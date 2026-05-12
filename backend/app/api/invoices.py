import uuid
import os
from datetime import datetime

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..models.models import db, Invoice
from ..utils.supabase_sync import SupabaseSync

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
        'payment_link': i.payment_link,
    } for i in invoices]), 200


@invoices_bp.route('', methods=['POST'])
@jwt_required()
def create_invoice():
    user_id = get_jwt_identity()
    data = request.get_json()

    invoice_number = f"INV-{datetime.now().year}-{uuid.uuid4().hex[:4].upper()}"
    site = os.getenv('SITE_URL', 'https://stealthpay.vercel.app').rstrip('/')
    payment_link = f"{site}/pay/{uuid.uuid4().hex[:12]}"

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
        payment_link=payment_link,
    )
    db.session.add(invoice)
    db.session.commit()

    return jsonify({
        'message': 'Invoice created',
        'id': invoice.id,
        'invoice_number': invoice_number,
    }), 201


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

        if old_status != 'paid' and new_status == 'paid':
            from ..services.transaction_service import TransactionService
            try:
                tx = TransactionService.create_private_transaction(
                    user_id=user_id,
                    receiver_address=invoice.creator_id,
                    amount=invoice.amount,
                    currency=invoice.currency,
                    tx_type='invoice',
                    memo=f"Payment for {invoice.invoice_number}",
                )
                db.session.add(tx)
            except Exception as e:
                print(f"Transaction record failed: {e}")

    db.session.commit()

    SupabaseSync.sync_record("invoices", {
        "id": invoice.id,
        "status": invoice.status,
    })

    return jsonify({'message': 'Invoice updated'}), 200
