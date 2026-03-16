"""
QuantiFire EP16 — Flash Loans: Borrowing Millions With Zero Collateral
Run: manim -pql ep16_flash_loans.py FlashLoanScene
Audio: AI voiceover via manim-voiceover
"""
from manim import *
from manim_voiceover import VoiceoverScene
from manim_voiceover.services.gtts import GTTSService
# PRODUCTION: from manim_voiceover.services.elevenlabs import ElevenLabsService

GOLD = "#FFB700"
TEAL = "#00C896"
RED  = "#FF4444"
BLUE = "#4A90E2"
BG   = "#0D0D0D"

class FlashLoanScene(VoiceoverScene):
    def construct(self):
        self.camera.background_color = BG
        self.set_speech_service(GTTSService(lang="en"))
        # PRODUCTION: self.set_speech_service(ElevenLabsService(voice_id="pNInz6obpgDQGcFmaJgB", model="eleven_turbo_v2"))

        title = Text("Flash Loans: $1M With Zero Collateral", font_size=36, color=GOLD)\
                  .to_edge(UP)

        # ── Hook ───────────────────────────────────────────────────────────────
        with self.voiceover(
            "In traditional finance, borrowing $1 million requires collateral, credit checks, KYC, "
            "and days of processing. In DeFi, you can borrow $1 million with zero collateral, "
            "execute a complex multi-protocol arbitrage strategy, repay the loan plus fees, and "
            "pocket the profit — all in a single Ethereum transaction taking 12 seconds. If you "
            "don't repay, the entire transaction reverts as if it never happened. This is the "
            "flash loan."
        ) as tracker:
            self.play(Write(title), run_time=tracker.duration)

        # ── Context ────────────────────────────────────────────────────────────
        with self.voiceover(
            "Welcome to QuantiFire. Flash loans were invented by Aave and have become one of "
            "DeFi's most powerful — and most misunderstood — primitives. They enable legitimate "
            "arbitrage, liquidation, and collateral swaps, but they've also been weaponized in "
            "over $1 billion in protocol exploits. Today I'll show you exactly how they work."
        ) as tracker:
            self.wait(tracker.duration)

        # ── Key concept ────────────────────────────────────────────────────────
        concept = VGroup(
            Text("Everything inside one Ethereum transaction", font_size=24, color=WHITE),
            Text("Borrow → Execute → Repay  (or whole tx REVERTS)", font_size=24, color=TEAL),
        ).arrange(DOWN, buff=0.2).shift(UP*1.8)
        self.play(LaggedStartMap(Write, concept, lag_ratio=0.4))
        self.wait(1)
        self.play(FadeOut(concept))

        # ── Step-by-step flowchart ─────────────────────────────────────────────
        steps = [
            ("1. Borrow",   "1,000,000 USDC\nfrom Aave pool",         BLUE),
            ("2. Execute",  "Arb: buy cheap on Uniswap\nsell high on SushiSwap", GOLD),
            ("3. Repay",    "1,000,900 USDC\n(principal + 0.09% fee)", TEAL),
            ("4. Profit",   "~$9,100 net\nafter gas",                  TEAL),
        ]

        boxes = VGroup()
        for i, (step, desc, col) in enumerate(steps):
            box  = RoundedRectangle(width=4.2, height=1.6, corner_radius=0.18,
                                    fill_color=col, fill_opacity=0.1,
                                    stroke_color=col, stroke_width=1.5)
            s_t  = Text(step, font_size=20, color=col).move_to(box).shift(UP*0.3)
            d_t  = Text(desc, font_size=16, color=WHITE, line_spacing=1.2)\
                     .move_to(box).shift(DOWN*0.2)
            boxes.add(VGroup(box, s_t, d_t))

        boxes[0].shift(LEFT*2.8 + UP*1.0)
        boxes[1].shift(RIGHT*2.8 + UP*1.0)
        boxes[2].shift(LEFT*2.8 + DOWN*1.0)
        boxes[3].shift(RIGHT*2.8 + DOWN*1.0)

        arrows = [
            Arrow(boxes[0].get_right(), boxes[1].get_left(), color=GRAY, buff=0.05),
            Arrow(boxes[1].get_bottom(), boxes[2].get_top() + RIGHT*5.6, color=GRAY, buff=0.05),
            Arrow(boxes[2].get_right(), boxes[3].get_left(), color=GRAY, buff=0.05),
        ]

        with self.voiceover(
            "The mechanism: Ethereum transactions are atomic — they either execute completely "
            "or revert completely. The entire flash loan sequence must fit in one transaction. "
            "Step one: borrow tokens from Aave flash loan pool — no collateral required. "
            "Step two: execute arbitrary logic — swaps, liquidations, arbitrage. "
            "Step three: repay borrowed amount plus 0.09% fee. If repayment fails, the entire "
            "transaction reverts. The Aave flash loan pool never loses money."
        ) as tracker:
            for box in boxes:
                self.play(FadeIn(box, scale=0.9), run_time=0.6)
            for a in arrows:
                self.play(GrowArrow(a), run_time=0.4)
            self.wait(tracker.duration - 4)

        # ── Atomic guarantee ──────────────────────────────────────────────────
        self.play(*[FadeOut(m) for m in self.mobjects if m != title])

        atomic = Text("If repay fails → ENTIRE transaction reverts",
                      font_size=26, color=RED).shift(UP*1.5)
        atomic_box = SurroundingRectangle(atomic, color=RED, buff=0.2, corner_radius=0.12)
        self.play(Create(atomic_box), Write(atomic))

        profit_form = MathTex(
            r"\text{Profit} = V_{sell} - V_{buy} - \underbrace{0.0009 \cdot V_{loan}}_{\text{fee}} - \text{gas}",
            font_size=34, color=WHITE
        ).shift(DOWN*0.3)
        self.play(Write(profit_form))

        use_cases = VGroup(
            Text("✓ Cross-DEX Arbitrage", font_size=22, color=TEAL),
            Text("✓ Self-Liquidation (avoid penalty)", font_size=22, color=TEAL),
            Text("✓ Collateral Swap",    font_size=22, color=TEAL),
            Text("✗ Oracle Manipulation (ATTACK)", font_size=22, color=RED),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.22).shift(DOWN*1.5)

        with self.voiceover(
            "Flash loan arbitrage profit equals V-sell minus V-buy minus the fee of 0.09% times "
            "the loan amount minus gas cost. Breakeven price difference is about 0.1% — meaning "
            "any price discrepancy above that across DEX pools is exploitable. The attack vector: "
            "flash loans amplify the power of any price oracle manipulation. If a protocol uses "
            "an on-chain AMM price as its oracle, an attacker can manipulate it in one block. "
            "The fix: TWAP oracles averaging price over 30 minutes — impossible to manipulate "
            "in a single transaction."
        ) as tracker:
            self.play(LaggedStartMap(FadeIn, use_cases, lag_ratio=0.3))
            self.wait(tracker.duration - 1)

        # ── CTA ────────────────────────────────────────────────────────────────
        with self.voiceover(
            "Next: How Chainlink Oracle Networks work and why accurate, manipulation-resistant "
            "price feeds are the most critical infrastructure in all of DeFi. Subscribe. QuantiFire."
        ) as tracker:
            self.play(*[FadeOut(m) for m in self.mobjects], run_time=1)
            outro = Text("QuantiFire  |  EP 16", font_size=30, color=GOLD)
            self.play(FadeIn(outro))
            self.wait(tracker.duration - 1)
