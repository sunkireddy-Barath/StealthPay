from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from .models.models import db
import os
from dotenv import load_dotenv

load_dotenv()


def _resolve_db_url():
    """Return the database URL to use, falling back to SQLite if Postgres is unreachable."""
    raw = os.getenv('DATABASE_URL', '')
    if not raw:
        return 'sqlite:///stealthpay.db', False

    # Normalise scheme
    if raw.startswith("postgres://"):
        raw = raw.replace("postgres://", "postgresql://", 1)

    if not (raw.startswith("postgresql://") or raw.startswith("postgresql+")):
        return raw, False

    # Ensure pg8000 driver
    if "+pg8000" not in raw:
        raw = raw.replace("postgresql://", "postgresql+pg8000://", 1)

    # Probe the connection before committing to it
    try:
        from sqlalchemy import create_engine, text
        probe = create_engine(raw, connect_args={'ssl_context': True}, pool_pre_ping=True)
        with probe.connect() as conn:
            conn.execute(text("SELECT 1"))
        probe.dispose()
        return raw, True
    except Exception as e:
        print(f"[DB] PostgreSQL unreachable — {e}\n[DB] Falling back to SQLite.")
        return 'sqlite:///stealthpay.db', False


def create_app():
    app = Flask(__name__)

    db_url, is_postgres = _resolve_db_url()

    app.config['SQLALCHEMY_DATABASE_URI'] = db_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    if is_postgres:
        app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
            'connect_args': {'ssl_context': True},
            'pool_pre_ping': True,
            'pool_recycle': 300,
        }
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'stealth-jwt-secret-fallback')

    # ── Extensions ────────────────────────────────────────────────────────────
    db.init_app(app)

    cors_origins_raw = os.getenv('CORS_ORIGINS', '*')
    allowed_origins = '*' if cors_origins_raw == '*' else [o.strip() for o in cors_origins_raw.split(',')]
    CORS(app, origins=allowed_origins, supports_credentials=True)

    JWTManager(app)

    with app.app_context():
        db.create_all()
        _run_migrations(db)

    # ── Blueprints ────────────────────────────────────────────────────────────
    from .api.auth import auth_bp
    from .api.payroll import payroll_bp
    from .api.invoices import invoices_bp
    from .api.compliance import compliance_bp
    from .api.payment_links import payment_links_bp
    from .api.wallet import wallet_bp
    from .api.transactions import transactions_bp

    app.register_blueprint(auth_bp,          url_prefix='/api/auth')
    app.register_blueprint(payroll_bp,       url_prefix='/api/payroll')
    app.register_blueprint(invoices_bp,      url_prefix='/api/invoices')
    app.register_blueprint(compliance_bp,    url_prefix='/api/compliance')
    app.register_blueprint(payment_links_bp, url_prefix='/api/payment-links')
    app.register_blueprint(wallet_bp,        url_prefix='/api/wallet')
    app.register_blueprint(transactions_bp,  url_prefix='/api/transactions')

    @app.route('/api/health')
    def health():
        dialect = db.engine.dialect.name
        return {'status': 'healthy', 'service': 'stealthpay-backend', 'version': '2.0', 'db': dialect}

    return app


def _run_migrations(db):
    from sqlalchemy import text, inspect

    dialect = db.engine.dialect.name
    migrations = []

    if dialect == 'postgresql':
        migrations = [
            "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS creator_id VARCHAR(36)",
            "ALTER TABLE transactions ALTER COLUMN encrypted_amount TYPE VARCHAR(512)",
        ]
    else:
        inspector = inspect(db.engine)
        tx_cols = [c['name'] for c in inspector.get_columns('transactions')]
        if 'creator_id' not in tx_cols:
            migrations = ["ALTER TABLE transactions ADD COLUMN creator_id VARCHAR(36)"]

    with db.engine.begin() as conn:
        for stmt in migrations:
            try:
                conn.execute(text(stmt))
            except Exception as e:
                print(f"[Migration] Skipped: {stmt[:60]}... ({e})")
