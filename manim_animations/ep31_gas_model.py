"""
QuantiFire EP31 — The EVM Gas Model: Why Transactions Cost Money (And When They Won't)
Run: manim -pql ep31_gas_model.py GasModelScene
Audio: AI voiceover via manim-voiceover
"""
from manim import *
from manim_voiceover import VoiceoverScene
from manim_voiceover.services.gtts import GTTSService
# PRODUCTION: from manim_voiceover.services.elevenlabs import ElevenLabsService
import numpy as np

GOLD = "#FFB700"
TEAL = "#00C896"
RED  = "#FF4444"
BLUE = "#4A90E2"
BG   = "#0D0D0D"

class GasModelScene(VoiceoverScene):
    def construct(self):
        self.camera.background_color = BG
        self.set_speech_service(GTTSService(lang="en"))
        # PRODUCTION: self.set_speech_service(ElevenLabsService(voice_id="pNInz6obpgDQGcFmaJgB", model="eleven_turbo_v2"))

        title = Text("The EVM Gas Model: EIP-1559 Explained", font_size=36, color=GOLD)\
                  .to_edge(UP)

        # ── Hook ───────────────────────────────────────────────────────────────
        with self.voiceover(
            "You've sent ETH and paid $3 in gas. You've swapped tokens and paid $50 in gas "
            "during peak hours. You've wondered: why does this cost money at all, and why does "
            "the price fluctuate so wildly? Gas is Ethereum's computational pricing system — "
            "every operation the EVM executes has a cost in gas, and the fee you pay is gas "
            "consumed times the gas price you bid. Today I'll explain the entire system and "
            "show you how to stop overpaying."
        ) as tracker:
            self.play(Write(title), run_time=tracker.duration)

        # ── Context ────────────────────────────────────────────────────────────
        with self.voiceover(
            "Welcome to QuantiFire. Gas is the lifeblood of Ethereum — it incentivizes "
            "validators, prevents spam, and allocates scarce computation fairly via market "
            "pricing. EIP-1559, implemented in August 2021, transformed the gas market from a "
            "first-price auction to a more predictable mechanism. Understanding this system "
            "makes you a more efficient on-chain operator."
        ) as tracker:
            self.wait(tracker.duration)

        # ── Fee formula ────────────────────────────────────────────────────────
        with self.voiceover(
            "The EIP-1559 fee structure has two components. The base fee is set algorithmically "
            "by the protocol — it rises when blocks are full and falls when they are empty. "
            "Crucially, the base fee is burned, removing ETH from circulation and making the "
            "network deflationary during high-demand periods. The priority fee, or tip, goes "
            "directly to the validator as an incentive. A Uniswap swap consumes around 150,000 "
            "gas units. At 30 gwei base fee, that transaction costs roughly half a cent of ETH — "
            "which at ETH's price translates to nearly ten dollars in real money."
        ) as tracker:
            fee_form = MathTex(
                r"\text{tx\_fee} = \text{gas\_used} \times (\underbrace{\text{base\_fee}}_{\text{burned}} + \underbrace{\text{priority\_fee}}_{\text{validator}})",
                font_size=34, color=WHITE
            ).shift(UP*1.8)
            self.play(Write(fee_form))
            self.wait(0.5)

            example_calc = VGroup(
                Text("Example: Uniswap swap", font_size=20, color=TEAL),
                MathTex(r"\text{gas\_used} = 150{,}000 \quad \text{base\_fee} = 30\, \text{gwei} \quad \text{tip} = 2\, \text{gwei}",
                        font_size=24, color=WHITE),
                MathTex(r"\text{fee} = 150000 \times 32 \div 10^9 = 0.0048\, \text{ETH} \approx \$9.60",
                        font_size=28, color=GOLD),
            ).arrange(DOWN, buff=0.2).shift(DOWN*0.0)
            self.play(LaggedStartMap(Write, example_calc, lag_ratio=0.4))
            self.wait(tracker.duration - 4)

        self.play(FadeOut(fee_form, example_calc))

        # ── Base fee adjustment mechanism ──────────────────────────────────────
        adj_title = Text("Base Fee Auto-Adjustment", font_size=26, color=WHITE).shift(UP*1.8)
        self.play(Write(adj_title))

        axes = Axes(
            x_range=[0, 50, 10], y_range=[0, 120, 20],
            x_length=9, y_length=4.5,
            axis_config={"color": GRAY, "include_numbers": True}, tips=False
        ).shift(DOWN*0.4)
        x_lab = Text("Block", font_size=18, color=GRAY)\
                  .next_to(axes.x_axis.get_end(), RIGHT)
        y_lab = Text("Base Fee (gwei)", font_size=18, color=GRAY)\
                  .next_to(axes.y_axis.get_end(), UP)
        self.play(Create(axes), Write(x_lab), Write(y_lab))

        rng = np.random.default_rng(7)
        base_fees = [30.0]
        for i in range(49):
            demand = rng.random()          # 0-1: fullness of block
            change = (demand - 0.5) * 12.5 / 100
            base_fees.append(np.clip(base_fees[-1] * (1 + change), 5, 115))

        pts = [axes.coords_to_point(i, base_fees[i]) for i in range(50)]
        fee_line = VMobject(color=TEAL, stroke_width=2.5)
        fee_line.set_points_smoothly(pts)

        with self.voiceover(
            "The base fee auto-adjustment: if the previous block was more than 50% full, the "
            "base fee increases by up to 12.5%. If less than 50% full, it decreases by up to "
            "12.5%. This converges to an equilibrium where blocks are approximately 50% full "
            "on average. Watch the base fee oscillate around the target — this is the market "
            "finding its clearing price. On Ethereum mainnet, the cheapest windows are 2 to "
            "4 AM UTC on weekends when demand is lowest. Check etherscan.io/gastracker for "
            "real-time base fee monitoring before large transactions."
        ) as tracker:
            self.play(Create(fee_line), run_time=2)
            # Target line at 50% fullness equilibrium
            target = DashedLine(axes.coords_to_point(0, 30), axes.coords_to_point(50, 30),
                                color=GOLD, stroke_width=1.5)
            t_lbl = Text("Target", font_size=16, color=GOLD)\
                      .next_to(axes.coords_to_point(49, 30), RIGHT, buff=0.1)
            self.play(Create(target), Write(t_lbl))
            self.wait(tracker.duration - 3)

        # ── Gas opcode table ───────────────────────────────────────────────────
        self.play(*[FadeOut(m) for m in self.mobjects if m != title])

        with self.voiceover(
            "Gas costs by operation: a simple ETH transfer costs 21,000 gas — a flat fee. "
            "An ERC-20 transfer costs approximately 50,000 gas. A Uniswap V3 swap costs "
            "approximately 150,000 gas. An Aave borrow costs approximately 200,000 gas. "
            "A cold storage write costs 20,000 gas — expensive by design since it permanently "
            "modifies the state tree on every full node. Layer 2 networks — Arbitrum and Base "
            "— execute the same EVM operations at 100 to 1,000 times less cost. EIP-4844, "
            "implemented in March 2024, reduced Layer 2 fees 10 to 100 times further by "
            "introducing blob storage for rollup calldata. Most DeFi activity is migrating "
            "to Layer 2 precisely because of these economics."
        ) as tracker:
            opcode_t = Table(
                [["Simple ETH transfer", "21,000"],
                 ["ERC-20 transfer",     "~50,000"],
                 ["Uniswap V3 swap",     "~150,000"],
                 ["Aave borrow",         "~200,000"],
                 ["Storage write (cold)","20,000"]],
                col_labels=[Text("Operation", color=GOLD), Text("Gas Units", color=GOLD)],
                element_to_mobject_config={"font_size": 20},
                include_outer_lines=True,
                line_config={"color": DARK_GRAY}
            ).shift(DOWN*0.1)
            self.play(Create(opcode_t))
            self.wait(1)

            l2_note = Text(
                "Layer 2 (Arbitrum / Base): same operations cost 100–1000× less gas",
                font_size=20, color=TEAL
            ).to_edge(DOWN, buff=0.35)
            self.play(Write(l2_note))
            self.wait(tracker.duration - 3)

        # ── CTA ────────────────────────────────────────────────────────────────
        with self.voiceover(
            "Gas is a market — use it like one. Check base fee before large transactions. "
            "Time non-urgent swaps to low-demand windows at 2 to 4 AM UTC on weekends. Use "
            "Layer 2 for routine DeFi activity. Calculate your exact transaction gas cost "
            "using the Alchemy or Infura gas price API before signing. Stop paying gas blindly. "
            "Next: Smart Contract Security Patterns — the code-level patterns that prevent "
            "the hacks we covered in Series 3. Essential for any builder and illuminating for "
            "any user evaluating protocol safety. Subscribe. QuantiFire."
        ) as tracker:
            self.play(*[FadeOut(m) for m in self.mobjects], run_time=1)
            outro = Text("QuantiFire  |  EP 31", font_size=30, color=GOLD)
            self.play(FadeIn(outro))
            self.wait(tracker.duration - 1)
