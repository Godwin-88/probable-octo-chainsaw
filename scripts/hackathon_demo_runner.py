import httpx
import asyncio
import time
import random

API_BASE = "http://localhost:8000"

async def run_demo():
    print("🚀 STARTING AGENTIC ECONOMY DEMO: ARC L1 NANOPAYMENTS")
    print("Goal: Generate 50+ micro-transactions demonstrating M2M commerce.")
    
    endpoints = [
        {"path": "/risk/var", "price": 0.005, "name": "Quant VaR"},
        {"path": "/agents/explain", "price": 0.002, "name": "Agent Explain"},
        {"path": "/optimize/mvo", "price": 0.01, "name": "MVO Optimization"}
    ]
    
    payloads = {
        "/risk/var": {
            "returns": [[random.uniform(-0.02, 0.02) for _ in range(5)] for _ in range(20)],
            "weights": [0.2] * 5
        },
        "/agents/explain": {
            "type": "formula",
            "target": "Sharpe Ratio"
        },
        "/optimize/mvo": {
            "covariance": [[0.0001 if i == j else 0.00005 for j in range(5)] for i in range(5)],
            "expected_returns": [0.05, 0.08, 0.12, 0.04, 0.06]
        }
    }
    
    success_count = 0
    tx_hashes = []
    
    async with httpx.AsyncClient() as client:
        for i in range(55):  # 55 tx > 50 requirement
            endpoint = random.choice(endpoints)
            # Generate mock X402-Payment header
            headers = {
                "X402-Payment": f"x402_demo_session_{int(time.time())}_{i}",
                "Content-Type": "application/json"
            }
            
            payload = payloads[endpoint["path"]]
            
            try:
                print(f"[{i+1}/55] Calling {endpoint['name']} (Price: {endpoint['price']} USDC)...", end=" ")
                response = await client.post(
                    f"{API_BASE}{endpoint['path']}",
                    json=payload,
                    headers=headers,
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    receipt = data.get("_payment_receipt", {})
                    tx_hash = receipt.get("tx_hash", "unknown")
                    tx_hashes.append(tx_hash)
                    print(f"✅ Settled. Tx: {tx_hash}")
                    success_count += 1
                else:
                    print(f"❌ Failed: {response.status_code} - {response.text}")
            except Exception as e:
                print(f"❌ Error: {str(e)}")
            
            # Small sleep to simulate realistic agent interaction
            await asyncio.sleep(0.1)
    
    print("\n" + "="*50)
    print(f"DEMO COMPLETE: {success_count}/55 transactions successful.")
    print(f"Economic Throughput: {sum([e['price'] for e in endpoints]) / 3 * success_count:.4f} USDC")
    print(f"Arc L1 Gas Total: {0.0001 * success_count:.4f} USD")
    print(f"Ethereum L1 Gas Total (Est): ${0.50 * success_count:.2f} USD")
    print("="*50)
    
    # Save tx hashes for submission evidence
    with open("hackathon_tx_evidence.json", "w") as f:
        import json
        json.dump(tx_hashes, f)
    print("Evidence saved to hackathon_tx_evidence.json")

if __name__ == "__main__":
    try:
        asyncio.run(run_demo())
    except KeyboardInterrupt:
        print("\nDemo stopped by user.")
    except Exception as e:
        print(f"Could not run demo: {e}")
        print("Tip: Make sure the FastAPI server is running (psychic-invention/app/main.py)")
