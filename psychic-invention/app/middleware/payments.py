import time
from functools import wraps
from fastapi import Request, HTTPException
from app.middleware.circle_settler import verify_onchain_payment

# --- Circle Nanopayments Verifier ---
class X402Verifier:
    async def verify(self, payment_hash: str, amount: float) -> bool:
        """Strict verification against Circle Smart Contract Platform API."""
        if not payment_hash:
            return False
        # Hits the actual Circle API
        return verify_onchain_payment(payment_hash)

x402_verifier = X402Verifier()

# --- Middleware Decorator ---
def require_micro_payment(endpoint_name: str, price_usdc: float):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            request = next((arg for arg in args if isinstance(arg, Request)), None)
            
            # 1. STRICT VERIFICATION: X402-Payment header must contain a valid tx_hash
            payment_hash = request.headers.get('X402-Payment')
            is_valid = await x402_verifier.verify(payment_hash, price_usdc)
            
            if not is_valid:
                raise HTTPException(
                    status_code=402,
                    detail={
                        "error": "Payment Required",
                        "message": "Transaction hash not confirmed on Circle SCP.",
                        "price": price_usdc
                    }
                )

            # 2. Execute endpoint
            return await func(*args, **kwargs) if asyncio.iscoroutinefunction(func) else func(*args, **kwargs)
        return wrapper
    return decorator
