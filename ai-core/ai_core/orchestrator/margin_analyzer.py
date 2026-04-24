# ai-core/ai_core/orchestrator/margin_analyzer.py
import math

class MarginAnalyzer:
    def __init__(self, arc_gas_usd: float = 0.0001, eth_gas_usd: float = 0.50):
        self.arc_cost = arc_gas_usd
        self.eth_cost = eth_gas_usd
    
    def break_even_frequency(self, price_per_call: float, compute_cost: float) -> dict:
        """
        Calculate where traditional gas erodes margin.
        
        price_per_call: What the user/agent pays for the service (e.g. 0.005 USDC)
        compute_cost: Internal cost of compute (LLM tokens + server time, e.g. 0.002 USD)
        """
        arc_margin = price_per_call - compute_cost - self.arc_cost
        eth_margin = price_per_call - compute_cost - self.eth_cost
        
        # Calculate how many calls it takes for ETH gas to eat all profit if price was higher
        # Or just show the margin preservation percentage
        
        return {
            'parameters': {
                'price_per_call': price_per_call,
                'compute_cost': compute_cost,
                'arc_gas_cost': self.arc_cost,
                'eth_gas_cost': self.eth_cost
            },
            'margins': {
                'arc_profit_usd': arc_margin,
                'eth_profit_usd': eth_margin,
                'arc_margin_pct': (arc_margin / price_per_call) * 100 if price_per_call > 0 else 0,
                'eth_margin_pct': (eth_margin / price_per_call) * 100 if price_per_call > 0 else 0,
            },
            'verdict': {
                'is_viable_on_arc': arc_margin > 0,
                'is_viable_on_eth': eth_margin > 0,
                'margin_preservation_multiplier': (arc_margin / eth_margin) if eth_margin > 0 else float('inf'),
                'advantage': "Arc enables micro-transactions that are literally impossible on Ethereum L1 due to gas costs." if eth_margin <= 0 else "Arc significantly improves unit economics."
            }
        }

if __name__ == "__main__":
    analyzer = MarginAnalyzer()
    # Scenario: Agent-to-Agent research request costing $0.005 USDC
    report = analyzer.break_even_frequency(price_per_call=0.005, compute_cost=0.002)
    
    print("--- ARC AGENTIC ECONOMY: MARGIN ANALYSIS ---")
    print(f"Service Price: ${report['parameters']['price_per_call']} USDC")
    print(f"Compute Cost: ${report['parameters']['compute_cost']}")
    print("-" * 40)
    print(f"ARC L1 Profit: ${report['margins']['arc_profit_usd']:.5f} ({report['margins']['arc_margin_pct']:.1f}%)")
    print(f"ETH L1 Profit: ${report['margins']['eth_profit_usd']:.5f} ({report['margins']['eth_margin_pct']:.1f}%)")
    print("-" * 40)
    print(f"Verdict: {report['verdict']['advantage']}")
    if not report['verdict']['is_viable_on_eth']:
        print("CRITICAL: ETH L1 margin is negative. This business model REQUIRES Arc L1.")
