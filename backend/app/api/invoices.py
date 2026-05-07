import os
import uuid
from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..models.models import Invoice, db
from ..utils.supabase_sync import SupabaseSync


def _public_base_url():
    return os.getenv('PUBLIC_BASE_URL', '').rstrip('/')

invoices_bp = Blueprint('invoices', __name__)

@invoices_bp.route('', methods=['GET'])
@jwt_required()
def get_invoices():
    user_id = get_jwt_identity()
    invoices = Invoice.query.filter_by(creator_id=user_id).all()
    return jsonify([{
        'id': i.id,
        'invoice_number': i.invoice_number,
        'client_name': i.client_name,
        'client_email': i.client_email,
        'amount': i.amount,
        'currency': i.currency,
        'description': i.description,
        'status': i.status,
        'due_date': i.due_date.isoformat() if i.due_date else None,
        'payment_link': i.payment_link
    } for i in invoices]), 200

@invoices_bp.route('', methods=['POST'])
@jwt_required()
def create_invoice():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    invoice_number = f"INV-{datetime.now().year}-{uuid.uuid4().hex[:4].upper()}"
    base = _public_base_url()
    payment_link = f"{base}/pay/{invoice_number.lower()}" if base else f"/pay/{invoice_number.lower()}"
    
    invoice = Invoice(
        creator_id=user_id,
        invoice_number=invoice_number,
        client_name=data.get('client_name'),
        client_email=data.get('client_email'),
        amount=data.get('amount'),
        currency=data.get('currency', 'USDC'),
        description=data.get('description'),
        status='pending',
        due_date=datetime.fromisoformat(data.get('due_date')) if data.get('due_date') else None,
        payment_link=payment_link
    )
    db.session.add(invoice)
    db.session.commit()
    
    # SYNC TO SUPABASE
    SupabaseSync.sync_record("invoices", {
        "id": invoice.id,
        "creator_id": invoice.creator_id,
        "invoice_number": invoice.invoice_number,
        "client_name": invoice.client_name,
        "client_email": invoice.client_email,
        "amount": invoice.amount,
        "currency": invoice.currency,
        "description": invoice.description,
        "status": invoice.status,
        "payment_link": invoice.payment_link
    })
    
    return jsonify({'message': 'Invoice created', 'id': invoice.id, 'invoice_number': invoice_number}), 201

@invoices_bp.route('/<id>', methods=['PATCH', 'PUT'])
@jwt_required()
def update_invoice_status(id):
    user_id = get_jwt_identity()
    data = request.get_json()
    invoice = Invoice.query.filter_by(id=id, creator_id=user_id).first_or_404()
    
    if 'status' in data:
        old_status = invoice.status
        new_status = data['status']
        invoice.status = new_status
        
        # If marked as paid, record a confidential transaction
        if old_status != 'paid' and new_status == 'paid':
            from ..services.transaction_service import TransactionService
            TransactionService.create_private_transaction(
                user_id=user_id,
                receiver_address=user_id, # Simplified for demo
                amount=invoice.amount,
                currency=invoice.currency,
                tx_type='invoice',
                memo=f"Payment for Invoice {invoice.invoice_number}"
            )
        
    db.session.commit()
    
    # SYNC TO SUPABASE
    SupabaseSync.sync_record("invoices", {
        "id": invoice.id,
        "status": invoice.status
    })
    
    return jsonify({'message': 'Invoice updated'}), 200
