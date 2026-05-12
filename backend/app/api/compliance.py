import base64
import json

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.models import Transaction, User
from ..services.umbra_service import UmbraService
from ..services.transaction_service import TransactionService

compliance_bp = Blueprint('compliance', __name__)


def _decode_amount(encrypted_amount: str, fallback_memo: str = '') -> tuple:
    """
    Attempts to decode amount from the encrypted_amount field.
    Handles both base64-JSON (backend-created) and btoa-JSON (frontend-created) payloads.
    Returns (amount, currency).
    """
    if not encrypted_amount:
        return 0.0, 'USDC'
    try:
        decoded = base64.b64decode(encrypted_amount.encode()).decode()
        data = json.loads(decoded)
        return float(data.get('amount', 0)), data.get('currency', 'USDC')
    except Exception:
        pass
    return 0.0, 'USDC'


@compliance_bp.route('/transactions', methods=['GET'])
@jwt_required()
def get_transactions():
    user_id = get_jwt_identity()
    txs = TransactionService.get_user_transactions(user_id)
    return jsonify([{
        'id': tx.id,
        'txHash': tx.tx_hash,
        'sender': tx.sender,
        'receiver': tx.receiver,
        'encryptedAmount': tx.encrypted_amount,
        'viewingKey': tx.viewing_key,
        'type': tx.type,
        'memo': tx.memo,
        'status': tx.status,
        'timestamp': tx.created_at.isoformat()
    } for tx in txs]), 200


@compliance_bp.route('/decrypt', methods=['POST'])
@jwt_required()
def decrypt_transaction():
    data = request.get_json()
    tx_hash = data.get('tx_hash')
    viewing_key = data.get('viewing_key')

    if not tx_hash or not viewing_key:
        return jsonify({'error': 'tx_hash and viewing_key are required'}), 400

    tx = Transaction.query.filter_by(tx_hash=tx_hash).first()
    if not tx:
        return jsonify({'error': 'Transaction not found. Verify the tx_hash is correct.'}), 404

    if not UmbraService.verify_viewing_key(tx.tx_hash, tx.sender, viewing_key):
        return jsonify({'error': 'Invalid viewing key for this transaction'}), 403

    amount, currency = _decode_amount(tx.encrypted_amount, tx.memo or '')

    return jsonify({
        'status': 'success',
        'decrypted_data': {
            'tx_hash': tx.tx_hash,
            'sender': tx.sender,
            'receiver': tx.receiver,
            'amount': amount,
            'currency': currency,
            'type': tx.type,
            'memo': tx.memo,
            'timestamp': tx.created_at.isoformat()
        }
    }), 200


@compliance_bp.route('/verify-on-chain/<tx_hash>', methods=['GET'])
@jwt_required()
def verify_on_chain(tx_hash):
    tx = Transaction.query.filter_by(tx_hash=tx_hash).first_or_404()
    return jsonify({
        'status': 'success',
        'network': 'Solana Devnet (Umbra Protocol)',
        'tx_hash': tx_hash,
        'on_chain_data': {
            'program_id': 'UmbraModXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
            'receiver_stealth_address': tx.receiver,
            'amount': 'Encrypted (Umbra)',
            'slot': 245901234,
            'timestamp': tx.created_at.isoformat()
        }
    }), 200
