import uuid
from ..models.models import db, Transaction, User
from .umbra_service import UmbraService


class TransactionService:
    @staticmethod
    def create_private_transaction(
        user_id: str,
        receiver_address: str,
        amount: float,
        currency: str,
        tx_type: str,
        memo: str = None,
        tx_hash: str = None,
        viewing_key: str = None,
        encrypted_amount: str = None,
        stealth_address: str = None,
    ) -> Transaction:
        user = User.query.get(user_id)
        if not user:
            raise ValueError("User not found")

        sender_wallet = user.wallet_address or 'System'

        # Derive Umbra metadata if not provided by the frontend
        if not tx_hash:
            tx_hash = f"0x{uuid.uuid4().hex}{uuid.uuid4().hex}"
        if not viewing_key:
            viewing_key = UmbraService.generate_viewing_key(tx_hash, sender_wallet)
        if not stealth_address:
            stealth_address = UmbraService.generate_stealth_address(user, receiver_address)
        if not encrypted_amount:
            encrypted_amount = UmbraService.encrypt_metadata(amount, currency)

        tx = Transaction(
            id=str(uuid.uuid4()),
            creator_id=user_id,
            tx_hash=tx_hash,
            sender=sender_wallet,
            receiver=stealth_address,
            encrypted_amount=encrypted_amount,
            viewing_key=viewing_key,
            type=tx_type,
            memo=memo,
            status='confirmed',
        )
        db.session.add(tx)

        from ..utils.supabase_sync import SupabaseSync
        SupabaseSync.sync_record("transactions", {
            "id": tx.id,
            "creator_id": tx.creator_id,
            "tx_hash": tx.tx_hash,
            "sender": tx.sender,
            "receiver": tx.receiver,
            "encrypted_amount": tx.encrypted_amount,
            "viewing_key": tx.viewing_key,
            "type": tx.type,
            "memo": tx.memo,
            "status": tx.status,
        })

        return tx

    @staticmethod
    def get_user_transactions(user_id: str):
        user = User.query.get(user_id)
        if not user:
            return []

        # Primary: creator_id FK (all transactions created by this user)
        # Secondary: wallet match (for transactions where user is sender/receiver)
        filters = [Transaction.creator_id == user_id]
        if user.wallet_address:
            filters.append(Transaction.sender == user.wallet_address)
            filters.append(Transaction.receiver == user.wallet_address)

        from sqlalchemy import or_
        return (
            Transaction.query
            .filter(or_(*filters))
            .order_by(Transaction.created_at.desc())
            .all()
        )
