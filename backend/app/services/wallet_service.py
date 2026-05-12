from solana.rpc.api import Client
from solders.pubkey import Pubkey

class WalletService:
    RPC_URL = "https://api.devnet.solana.com"

    @staticmethod
    def get_balances(wallet_address: str):
        """
        Fetches real SOL balance from Solana devnet via RPC.
        Stablecoin/Umbra amounts are deterministic per-wallet for demo consistency
        (real SPL token accounts require separate getTokenAccountsByOwner calls).
        """
        sol_balance = 0.0
        is_live_sol = False

        if wallet_address and wallet_address not in ('', 'System'):
            try:
                client = Client(WalletService.RPC_URL)
                pubkey = Pubkey.from_string(wallet_address)
                response = client.get_balance(pubkey)
                sol_balance = response.value / 1_000_000_000  # lamports → SOL
                is_live_sol = True
            except Exception as e:
                print(f"[WalletService] RPC balance fetch failed: {e}")

        # Deterministic per-wallet seed for consistent stablecoin display
        seed = sum(ord(c) for c in (wallet_address or "default"))

        prices = {"SOL": 145.20, "USDC": 1.00, "USDT": 1.00, "UMBRA": 2.45}

        tokens = [
            {
                "token": "Solana",
                "symbol": "SOL",
                "amount": round(sol_balance, 4),
                "price": prices["SOL"],
                "usdValue": round(sol_balance * prices["SOL"], 2),
                "percentChange24h": 2.45,
                "isLive": is_live_sol,
            },
            {
                "token": "USD Coin",
                "symbol": "USDC",
                "amount": round((seed % 45000) + 5000, 2),
                "price": prices["USDC"],
                "usdValue": round((seed % 45000) + 5000, 2),
                "percentChange24h": 0.01,
                "isLive": False,
            },
            {
                "token": "Tether",
                "symbol": "USDT",
                "amount": round((seed % 9000) + 1000, 2),
                "price": prices["USDT"],
                "usdValue": round((seed % 9000) + 1000, 2),
                "percentChange24h": -0.02,
                "isLive": False,
            },
            {
                "token": "Umbra Protocol",
                "symbol": "UMBRA",
                "amount": round((seed % 4900) + 100, 2),
                "price": prices["UMBRA"],
                "usdValue": round(((seed % 4900) + 100) * prices["UMBRA"], 2),
                "percentChange24h": 4.12,
                "isLive": False,
            },
        ]

        return tokens
