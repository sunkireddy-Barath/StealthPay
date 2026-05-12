from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.transaction_service import TransactionService

transactions_bp = Blueprint('transactions', __name__)


@transactions_bp.route('', methods=['GET'])
@jwt_required()
def get_transactions():
    user_id = get_jwt_identity()
    txs = TransactionService.get_user_transactions(user_id)
    return jsonify([{
        'id': tx.id,
        'tx_hash': tx.tx_hash,
        'sender': tx.sender,
        'receiver': tx.receiver,
        'encrypted_amount': tx.encrypted_amount or '',
        'viewing_key': tx.viewing_key,
        'type': tx.type,
        'status': tx.status,
        'memo': tx.memo,
        'created_at': tx.created_at.isoformat(),
    } for tx in txs]), 200
