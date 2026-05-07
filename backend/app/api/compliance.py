from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..models.models import Transaction
from ..services.transaction_service import TransactionService
from ..services.umbra_service import UmbraService

compliance_bp = Blueprint('compliance', __name__)


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
        'timestamp': tx.created_at.isoformat(),
    } for tx in txs]), 200


@compliance_bp.route('/decrypt', methods=['POST'])
@jwt_required()
def decrypt_transaction():
    data = request.get_json(silent=True) or {}
    tx_hash = data.get('tx_hash')
    viewing_key = data.get('viewing_key')

    if not tx_hash or not viewing_key:
        return jsonify({'error': 'tx_hash and viewing_key are required'}), 400

    tx = Transaction.query.filter_by(tx_hash=tx_hash).first()
    if not tx:
        return jsonify({'error': 'Transaction not found'}), 404

    if not UmbraService.verify_viewing_key(tx.tx_hash, tx.sender, viewing_key):
        return jsonify({'error': 'Invalid viewing key for this transaction'}), 403

    return jsonify({
        'status': 'success',
        'decrypted_data': {
            'tx_hash': tx.tx_hash,
            'sender': tx.sender,
            'receiver': tx.receiver,
            'encrypted_amount': tx.encrypted_amount,
            'currency': 'USDC',
            'type': tx.type,
            'memo': tx.memo,
            'timestamp': tx.created_at.isoformat(),
        }
    }), 200


@compliance_bp.route('/verify-on-chain/<tx_hash>', methods=['GET'])
@jwt_required()
def verify_on_chain(tx_hash):
    tx = Transaction.query.filter_by(tx_hash=tx_hash).first_or_404()
    return jsonify({
        'status': 'success',
        'network': 'Solana Devnet (Simulated)',
        'tx_hash': tx_hash,
        'on_chain_data': {
            'program_id': 'UmbraMod111111111111111111111111111111',
            'receiver_stealth_address': tx.receiver,
            'amount': 'Encrypted (Umbra)',
            'slot': 245901234,
            'timestamp': tx.created_at.isoformat(),
        }
    }), 200
