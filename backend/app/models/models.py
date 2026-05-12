from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid
from sqlalchemy import event

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    wallet_address = db.Column(db.String(44), nullable=True)
    company_name = db.Column(db.String(120), nullable=True)
    umbra_spending_key = db.Column(db.String(128), default=lambda: f"sk_{uuid.uuid4().hex}")
    umbra_viewing_key = db.Column(db.String(128), default=lambda: f"vk_{uuid.uuid4().hex}")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    employees = db.relationship('Employee', backref='employer', lazy=True)
    invoices = db.relationship('Invoice', backref='creator', lazy=True)


class Employee(db.Model):
    __tablename__ = 'employees'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    employer_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=True)
    wallet_address = db.Column(db.String(44), nullable=False)
    salary = db.Column(db.Float, nullable=False)
    department = db.Column(db.String(100), nullable=True)
    status = db.Column(db.String(20), default='active')
    last_paid = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Invoice(db.Model):
    __tablename__ = 'invoices'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    creator_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    invoice_number = db.Column(db.String(50), unique=True, nullable=False)
    client_name = db.Column(db.String(100), nullable=False)
    client_email = db.Column(db.String(120), nullable=True)
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(10), default='USDC')
    description = db.Column(db.Text, nullable=True)
    payment_link = db.Column(db.String(255), nullable=True)
    status = db.Column(db.String(20), default='pending')
    due_date = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Transaction(db.Model):
    __tablename__ = 'transactions'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    # creator_id allows per-user queries independent of wallet_address
    creator_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)
    tx_hash = db.Column(db.String(88), unique=True, nullable=False)
    sender = db.Column(db.String(44), nullable=False)
    receiver = db.Column(db.String(44), nullable=False)
    encrypted_amount = db.Column(db.String(512), nullable=True)
    viewing_key = db.Column(db.String(255), nullable=True)
    type = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(20), default='confirmed')
    memo = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class PaymentLink(db.Model):
    __tablename__ = 'payment_links'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    creator_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(10), default='USDC')
    status = db.Column(db.String(20), default='active')
    expires_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    claimed_at = db.Column(db.DateTime, nullable=True)
    claimed_by = db.Column(db.String(44), nullable=True)


def _sync_to_supabase(mapper, connection, target):
    try:
        from ..utils.supabase_sync import SupabaseSync
        table_name = target.__tablename__
        exclude = {'last_paid', 'created_at', 'claimed_at'}
        data = {}
        for column in target.__table__.columns:
            if column.name in exclude:
                continue
            val = getattr(target, column.name)
            if isinstance(val, datetime):
                val = val.isoformat()
            data[column.name] = val
        SupabaseSync.sync_record(table_name, data)
    except Exception as e:
        print(f"Supabase event sync failed: {e}")


for model in (User, Employee, Invoice, Transaction, PaymentLink):
    event.listen(model, 'after_insert', _sync_to_supabase)
    event.listen(model, 'after_update', _sync_to_supabase)
