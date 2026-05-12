import uuid
from datetime import datetime

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..models.models import db, Employee, User, Transaction
from ..services.transaction_service import TransactionService
from ..utils.supabase_sync import SupabaseSync

payroll_bp = Blueprint('payroll', __name__)


@payroll_bp.route('/employees', methods=['GET'])
@jwt_required()
def get_employees():
    user_id = get_jwt_identity()
    employees = Employee.query.filter_by(employer_id=user_id).all()
    return jsonify([{
        'id': e.id,
        'name': e.name,
        'email': e.email,
        'wallet_address': e.wallet_address,
        'salary': e.salary,
        'department': e.department,
        'status': e.status,
        'lastPaid': e.last_paid.isoformat() if e.last_paid else None,
    } for e in employees]), 200


@payroll_bp.route('/employees', methods=['POST'])
@jwt_required()
def add_employee():
    user_id = get_jwt_identity()
    data = request.get_json()

    employee = Employee(
        employer_id=user_id,
        name=data.get('name'),
        email=data.get('email'),
        wallet_address=data.get('wallet_address'),
        salary=data.get('salary'),
        department=data.get('department'),
    )
    db.session.add(employee)
    db.session.commit()

    return jsonify({'message': 'Employee added', 'id': employee.id}), 201


@payroll_bp.route('/employees/<id>', methods=['DELETE'])
@jwt_required()
def remove_employee(id):
    user_id = get_jwt_identity()
    employee = Employee.query.filter_by(id=id, employer_id=user_id).first_or_404()
    db.session.delete(employee)
    db.session.commit()
    return jsonify({'message': 'Employee removed'}), 200


@payroll_bp.route('/run', methods=['POST'])
@jwt_required()
def run_payroll():
    user_id = get_jwt_identity()
    data = request.get_json()
    employee_ids = data.get('employee_ids', [])
    # Umbra metadata forwarded from the frontend wallet signing step
    umbra_metadata = data.get('umbra_metadata', {})

    user = User.query.get(user_id)
    employees = Employee.query.filter(
        Employee.id.in_(employee_ids),
        Employee.employer_id == user_id,
    ).all()

    if not employees:
        return jsonify({'error': 'No employees found'}), 404

    results = []
    try:
        for emp in employees:
            tx = TransactionService.create_private_transaction(
                user_id=user_id,
                receiver_address=emp.wallet_address,
                amount=emp.salary,
                currency='USDC',
                tx_type='payroll',
                memo=f"Payroll for {emp.name}",
                # Prefer frontend-derived Umbra data when available
                tx_hash=umbra_metadata.get('txHash') or None,
                viewing_key=umbra_metadata.get('viewingKey') or None,
                encrypted_amount=umbra_metadata.get('encryptedAmount') or None,
                stealth_address=umbra_metadata.get('stealthAddress') or None,
            )
            emp.last_paid = datetime.utcnow()
            results.append({
                'employee_name': emp.name,
                'tx_hash': tx.tx_hash,
                'viewing_key': tx.viewing_key,
            })

        db.session.commit()
        return jsonify({'message': 'Payroll complete', 'transactions': results}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
