import logging
import os
import secrets

from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from .models.models import db

load_dotenv()

logger = logging.getLogger(__name__)


def _resolve_jwt_secret():
    secret = os.getenv('JWT_SECRET_KEY') or os.getenv('SECRET_KEY')
    if secret:
        return secret
    if os.getenv('FLASK_ENV', 'production').lower() == 'production':
        raise RuntimeError(
            "JWT_SECRET_KEY (or SECRET_KEY) must be set in production. "
            "Refusing to start with a generated secret because tokens "
            "would not survive a restart."
        )
    logger.warning("JWT_SECRET_KEY not set; using ephemeral dev secret.")
    return secrets.token_urlsafe(32)


def _resolve_cors_origins():
    raw = os.getenv('CORS_ORIGINS', '')
    origins = [o.strip() for o in raw.split(',') if o.strip()]
    return origins or '*'


def create_app():
    app = Flask(__name__)

    db_url = os.getenv('DATABASE_URL', 'sqlite:///stealthpay.db')
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = _resolve_jwt_secret()

    db.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": _resolve_cors_origins()}})
    JWTManager(app)

    with app.app_context():
        try:
            db.create_all()
        except Exception as exc:
            logger.error("db.create_all failed at startup: %s", exc)

    from .api.auth import auth_bp
    from .api.compliance import compliance_bp
    from .api.invoices import invoices_bp
    from .api.payment_links import payment_links_bp
    from .api.payroll import payroll_bp
    from .api.transactions import transactions_bp
    from .api.wallet import wallet_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(payroll_bp, url_prefix='/api/payroll')
    app.register_blueprint(invoices_bp, url_prefix='/api/invoices')
    app.register_blueprint(compliance_bp, url_prefix='/api/compliance')
    app.register_blueprint(payment_links_bp, url_prefix='/api/payment-links')
    app.register_blueprint(wallet_bp, url_prefix='/api/wallet')
    app.register_blueprint(transactions_bp, url_prefix='/api/transactions')

    @app.route('/api/health')
    def health():
        return jsonify({'status': 'healthy', 'service': 'stealthpay-backend'})

    @app.errorhandler(404)
    def not_found(_):
        return jsonify({'error': 'Not found'}), 404

    @app.errorhandler(500)
    def server_error(exc):
        logger.exception("Unhandled error: %s", exc)
        return jsonify({'error': 'Internal server error'}), 500

    return app
