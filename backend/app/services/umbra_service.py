import hashlib
import hmac
import uuid
from ..models.models import User

class UmbraService:
    @staticmethod
    def generate_stealth_address(user: User, recipient_wallet: str):
        """
        Simulates stealth address derivation: 
        P_stealth = P_spend + hash(spending_key, nonce) * G
        In simulation: hmac(spending_key, recipient_wallet)
        """
        msg = recipient_wallet.encode()
        key = (user.umbra_spending_key or "default_key").encode()
        h = hmac.new(key, msg, hashlib.sha256).hexdigest()
        return f"umbra_{h[:38]}"

    @staticmethod
    def generate_viewing_key(tx_hash: str, sender_wallet: str):
        """
        Simulates viewing key derivation for a specific transaction.
        Allows the viewing key holder to decrypt ONLY this transaction.
        """
        msg = tx_hash.encode()
        key = sender_wallet.encode()
        h = hmac.new(key, msg, hashlib.sha256).hexdigest()
        return f"vk_{h[:32]}"

    @staticmethod
    def encrypt_metadata(amount: float, currency: str):
        """
        Simulates encrypting the amount and currency.
        """
        raw = f"{amount}:{currency}"
        # Simple XOR-like hex simulation
        return hashlib.sha256(raw.encode()).hexdigest()[:64].upper()

    @staticmethod
    def verify_viewing_key(tx_hash: str, sender_wallet: str, viewing_key: str):
        """Constant-time comparison of the supplied viewing key against the expected one."""
        expected = UmbraService.generate_viewing_key(tx_hash, sender_wallet)
        return hmac.compare_digest(expected, viewing_key or "")
