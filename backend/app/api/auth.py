import uuid

from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token
from werkzeug.security import check_password_hash, generate_password_hash

from ..models.models import User, db

auth_bp = Blueprint('auth', __name__)


def _user_payload(user: User):
    return {
        'id': user.id,
        'email': user.email,
        'company_name': user.company_name,
        'wallet_address': user.wallet_address,
        'umbra_spending_key': user.umbra_spending_key,
        'umbra_viewing_key': user.umbra_viewing_key,
    }


@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    company_name = data.get('company_name')
    wallet_address = data.get('wallet_address')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 400

    user = User(
        email=email,
        password_hash=generate_password_hash(password),
        company_name=company_name,
        wallet_address=wallet_address,
    )
    db.session.add(user)
    db.session.commit()

    access_token = create_access_token(identity=user.id)
    return jsonify({
        'message': 'User created successfully',
        'access_token': access_token,
        'user': _user_payload(user),
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()
    if user and check_password_hash(user.password_hash, password):
        access_token = create_access_token(identity=user.id)
        return jsonify({
            'access_token': access_token,
            'user': _user_payload(user),
        }), 200

    return jsonify({'error': 'Invalid email or password'}), 401


@auth_bp.route('/wallet-login', methods=['POST'])
def wallet_login():
    data = request.get_json(silent=True) or {}
    address = (data.get('address') or '').strip()

    if not address:
        return jsonify({'error': 'Wallet address required'}), 400

    # NOTE: signature verification is not implemented yet. This endpoint
    # auto-registers wallets so the demo flow works end-to-end. Do not enable
    # in production without verifying a wallet-signed challenge.
    user = User.query.filter_by(wallet_address=address).first()

    if not user:
        # Use the wallet address itself in the placeholder email to avoid
        # collisions between wallets that share a 6-character prefix.
        user = User(
            email=f"wallet_{address}@stealthpay.local",
            password_hash=generate_password_hash(str(uuid.uuid4())),
            wallet_address=address,
            company_name=f"Org {address[:4]}",
        )
        db.session.add(user)
        db.session.commit()

    access_token = create_access_token(identity=user.id)
    return jsonify({
        'access_token': access_token,
        'user': _user_payload(user),
    }), 200
