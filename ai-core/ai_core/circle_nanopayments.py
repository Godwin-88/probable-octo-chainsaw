import random
import asyncio
import time

class X402Verifier:
    async def verify(self, payment_header: str, amount: float, currency: str, chain: str) -> bool:
        """
        Mock verification of x402 payment header.
        In a real implementation, this would verify the nanopayment on the Arc L1.
        """
        if not payment_header:
            return False
        
        # Simulate network latency
        await asyncio.sleep(0.05)
        
        # For hackathon demo purposes, we accept any header starting with 'x402_'
        # or 'pay_' to make it easy to test.
        if payment_header.startswith('x402_') or payment_header.startswith('pay_'):
            return True
        
        return False

class ArcSettler:
    @staticmethod
    async def log_usage(endpoint: str, compute_ms: float, price_paid: float):
        """
        Log usage to Arc L1 for margin analysis.
        """
        print(f"[ArcSettler] LOG: endpoint={endpoint}, compute={compute_ms}ms, price={price_paid} USDC")
        # In a real implementation, this would send telemetry to an on-chain or off-chain oracle
        pass

x402_verifier = X402Verifier()
