from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.models import db, PaymentLink, User
from ..services.transaction_service import TransactionService
import uuid
from datetime import datetime
import os
from ..utils.supabase_sync import SupabaseSync

def _claim_url(link_id: str) -> str:
    site = os.getenv('SITE_URL', 'https://stealthpay.vercel.app').rstrip('/')
    return f"{site}/pay/{link_id}"

payment_links_bp = Blueprint('payment_links', __name__)

@payment_links_bp.route('/', methods=['GET'])
@jwt_required()
def get_links():
    user_id = get_jwt_identity()
    links = PaymentLink.query.filter_by(creator_id=user_id).all()
    return jsonify([{
        'id': l.id,
        'title': l.title,
        'amount': l.amount,
        'currency': l.currency,
        'status': l.status,
        'expires_at': l.expires_at.isoformat() if l.expires_at else None,
        'created_at': l.created_at.isoformat(),
        'claimed_at': l.claimed_at.isoformat() if l.claimed_at else None,
        'claimed_by': l.claimed_by,
        'link': _claim_url(l.id)
    } for l in links]), 200
    
@payment_links_bp.route('/<id>/info', methods=['GET'])
def get_link_info(id):
    link = PaymentLink.query.get_or_404(id)
    return jsonify({
        'id': link.id,
        'title': link.title,
        'amount': link.amount,
        'currency': link.currency,
        'status': link.status,
        'created_at': link.created_at.isoformat()
    }), 200

@payment_links_bp.route('/', methods=['POST'])
@jwt_required()
def create_link():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    link = PaymentLink(
        creator_id=user_id,
        title=data.get('title'),
        amount=data.get('amount'),
        currency=data.get('currency', 'USDC'),
        expires_at=datetime.fromisoformat(data.get('expires_at')) if data.get('expires_at') else None
    )
    db.session.add(link)
    db.session.commit()
    
    # Sync to Supabase
    SupabaseSync.sync_record("payment_links", {
        "id": link.id,
        "creator_id": link.creator_id,
        "title": link.title,
        "amount": link.amount,
        "currency": link.currency,
        "status": link.status
    })
    
    return jsonify({
        'message': 'Payment link generated',
        'id': link.id,
        'link': _claim_url(link.id)
    }), 201

@payment_links_bp.route('/<id>/claim', methods=['POST'])
@jwt_required()
def claim_link(id):
    user_id = get_jwt_identity()
    link = PaymentLink.query.get_or_404(id)
    
    if link.status != 'active':
        return jsonify({'error': 'Link is no longer active'}), 400
        
    data = request.get_json()
    claimed_by = data.get('wallet_address', 'External')
    
    try:
        # Create the private transaction using the service
        tx = TransactionService.create_private_transaction(
            user_id=user_id,
            receiver_address=User.query.get(link.creator_id).wallet_address or 'System',
            amount=link.amount,
            currency=link.currency,
            tx_type='payment_link',
            memo=f"Payment for: {link.title}"
        )
        
        link.status = 'claimed'
        link.claimed_at = datetime.utcnow()
        link.claimed_by = claimed_by
        
        db.session.commit()
        
        # Sync to Supabase
        SupabaseSync.sync_record("payment_links", {
            "id": link.id,
            "status": link.status,
            "claimed_at": link.claimed_at.isoformat() if link.claimed_at else None,
            "claimed_by": link.claimed_by
        })
        
        return jsonify({
            'message': 'Payment successful via Umbra',
            'tx_hash': tx.tx_hash,
            'viewing_key': tx.viewing_key
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
