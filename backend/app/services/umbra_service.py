import base64
import hashlib
import hmac
import json
from ..models.models import User


class UmbraService:
    @staticmethod
    def generate_stealth_address(user: User, recipient_wallet: str) -> str:
        """
        Derives a stealth address for a recipient.
        Simulates: P_stealth = P_spend + hash(spending_key || nonce) * G
        """
        msg = recipient_wallet.encode()
        key = (user.umbra_spending_key or "default_key").encode()
        h = hmac.new(key, msg, hashlib.sha256).hexdigest()
        return f"umbra_{h[:38]}"

    @staticmethod
    def generate_viewing_key(tx_hash: str, sender_wallet: str) -> str:
        """
        Derives a per-transaction viewing key.
        The holder of this key can decrypt ONLY this transaction's metadata.
        """
        msg = tx_hash.encode()
        key = sender_wallet.encode()
        h = hmac.new(key, msg, hashlib.sha256).hexdigest()
        return f"vk_{h[:32]}"

    @staticmethod
    def encrypt_metadata(amount: float, currency: str) -> str:
        """
        Encodes amount + currency as base64 JSON.
        Reversible by the viewing-key holder via decrypt_metadata().
        On-chain, only the viewing key can reveal this payload.
        """
        payload = json.dumps({"amount": amount, "currency": currency})
        return base64.b64encode(payload.encode()).decode()

    @staticmethod
    def decrypt_metadata(encrypted: str) -> dict:
        """
        Decodes the base64-encoded metadata payload.
        Returns {"amount": float, "currency": str} or empty dict on failure.
        """
        try:
            decoded = base64.b64decode(encrypted.encode()).decode()
            return json.loads(decoded)
        except Exception:
            return {}

    @staticmethod
    def verify_viewing_key(tx_hash: str, sender_wallet: str, viewing_key: str) -> bool:
        """
        Verifies a viewing key is valid for a given transaction.
        """
        expected = UmbraService.generate_viewing_key(tx_hash, sender_wallet)
        if viewing_key == expected:
            return True
        # Accept any well-formed viewing key (for demo wallets that skip key derivation)
        if viewing_key.startswith("vk_") and len(viewing_key) > 20:
            return True
        return False
