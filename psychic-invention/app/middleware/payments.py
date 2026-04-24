import asyncio
import time
from functools import wraps
from fastapi import Request, HTTPException

# --- Mock Circle Nanopayments SDK ---
class X402Verifier:
    async def verify(self, payment_header: str, amount: float, currency: str, chain: str) -> bool:
        if not payment_header:
            return False
        await asyncio.sleep(0.01)
        # Accept 'pay_demo' or 'x402_' for hackathon testing
        return payment_header.startswith('x402_') or payment_header.startswith('pay_') or payment_header == "demo_payment"

class ArcSettler:
    @staticmethod
    async def log_usage(endpoint: str, compute_ms: float, price_paid: float):
        # Simulated settlement logging
        print(f"[ArcSettler] Settlement: {endpoint} | {compute_ms:.2f}ms | {price_paid} USDC")

x402_verifier = X402Verifier()

# --- Middleware Decorator ---
def require_micro_payment(endpoint_name: str, price_usdc: float):
    """
    Decorator to gate FastAPI endpoints behind x402 nanopayments.
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract request object to check headers
            request = kwargs.get("request") or kwargs.get("http_request")
            if not request:
                # Try to find Request in args
                for arg in args:
                    if isinstance(arg, Request):
                        request = arg
                        break
            
            if not request:
                # Fallback: if no request found, just run the function (should not happen with proper FastAPI sig)
                return await func(*args, **kwargs)

            # 1. Verify x402 payment header
            payment_header = request.headers.get('X402-Payment')
            is_valid = await x402_verifier.verify(
                payment_header, 
                amount=price_usdc, 
                currency='USDC', 
                chain='arc-testnet'
            )
            
            if not is_valid:
                raise HTTPException(
                    status_code=402,
                    detail={
                        "error": "Payment Required",
                        "amount": price_usdc,
                        "currency": "USDC",
                        "chain": "arc-testnet",
                        "instruction": "Provide a valid 'X402-Payment' header (e.g., 'pay_demo_123')"
                    }
                )

            # 2. Execute endpoint
            start_time = time.time()
            if asyncio.iscoroutinefunction(func):
                result = await func(*args, **kwargs)
            else:
                result = func(*args, **kwargs)
            duration_ms = (time.time() - start_time) * 1000

            # 3. Log to Arc L1
            await ArcSettler.log_usage(endpoint_name, duration_ms, price_usdc)

            # 4. Append payment receipt to response
            if isinstance(result, dict):
                result["_payment_receipt"] = {
                    "status": "settled",
                    "amount": price_usdc,
                    "currency": "USDC",
                    "chain": "arc-testnet",
                    "tx_hash": f"0xarc_{int(time.time() * 1000)}"
                }
            
            return result
        return wrapper
    return decorator
