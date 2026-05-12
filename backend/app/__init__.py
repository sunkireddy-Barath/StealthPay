from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from .models.models import db
import os
from dotenv import load_dotenv

load_dotenv()


def create_app():
    app = Flask(__name__)

    # ── Database ──────────────────────────────────────────────────────────────
    db_url = os.getenv('DATABASE_URL', 'sqlite:///stealthpay.db')
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    is_postgres = db_url.startswith("postgresql://") or db_url.startswith("postgresql+")
    if is_postgres and "+pg8000" not in db_url:
        db_url = db_url.replace("postgresql://", "postgresql+pg8000://", 1)
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
    if cors_origins_raw == '*':
        allowed_origins = '*'
    else:
        allowed_origins = [o.strip() for o in cors_origins_raw.split(',')]
    CORS(app, origins=allowed_origins, supports_credentials=True)

    JWTManager(app)

    with app.app_context():
        db.create_all()          # Creates missing tables (safe to run repeatedly)
        _run_migrations(db)      # Adds new columns to existing tables

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
        return {'status': 'healthy', 'service': 'stealthpay-backend', 'version': '2.0'}

    return app


def _run_migrations(db):
    """
    Applies additive schema changes to existing databases.
    Safe to run on every startup — all statements use IF NOT EXISTS / similar guards.
    """
    from sqlalchemy import text, inspect

    dialect = db.engine.dialect.name   # 'postgresql' or 'sqlite'

    migrations = []

    if dialect == 'postgresql':
        # PostgreSQL supports IF NOT EXISTS on ADD COLUMN (PG 9.6+)
        migrations = [
            "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS creator_id VARCHAR(36)",
            "ALTER TABLE transactions ALTER COLUMN encrypted_amount TYPE VARCHAR(512)",
        ]
    else:
        # SQLite: check via inspect then add if missing
        inspector = inspect(db.engine)
        tx_cols = [c['name'] for c in inspector.get_columns('transactions')]
        if 'creator_id' not in tx_cols:
            migrations = [
                "ALTER TABLE transactions ADD COLUMN creator_id VARCHAR(36)"
            ]

    with db.engine.begin() as conn:
        for stmt in migrations:
            try:
                conn.execute(text(stmt))
            except Exception as e:
                # Non-fatal — column may already exist or type already matches
                print(f"[Migration] Skipped: {stmt[:60]}... ({e})")
