"""
QuantiFire EP14 — Curve Finance: The AMM Built for Stablecoins
Run: manim -pql ep14_curve_stableswap.py CurveStableSwapScene
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

class CurveStableSwapScene(VoiceoverScene):
    def construct(self):
        self.camera.background_color = BG
        self.set_speech_service(GTTSService(lang="en"))
        # PRODUCTION: self.set_speech_service(ElevenLabsService(voice_id="pNInz6obpgDQGcFmaJgB", model="eleven_turbo_v2"))

        title = Text("Curve Finance: StableSwap", font_size=42, color=GOLD).to_edge(UP)

        # ── Hook ───────────────────────────────────────────────────────────────
        with self.voiceover(
            "Swapping 1 million USDC for 1 million USDT on Uniswap V2 would cost you 50,000 in "
            "slippage. That's a 5% loss on a swap between two assets worth exactly one dollar each. "
            "Curve Finance solved this in 2020 with a new invariant formula that reduces that "
            "slippage to under $100 on the same trade. Today I'll show you the math behind "
            "StableSwap."
        ) as tracker:
            self.play(Write(title), run_time=tracker.duration)

        # ── Context ────────────────────────────────────────────────────────────
        with self.voiceover(
            "Welcome to QuantiFire. Curve Finance is the dominant stablecoin DEX, regularly "
            "processing 1 to 5 billion in daily volume. Its superiority for stable-to-stable "
            "swaps comes from a single mathematical insight: near the equilibrium price of 1 to 1, "
            "a linear invariant gives zero slippage, but collapses for large moves. The StableSwap "
            "formula blends the linear and constant product curves to get the best of both."
        ) as tracker:
            self.wait(tracker.duration)

        # ── Invariant formula ──────────────────────────────────────────────────
        formula = MathTex(
            r"A \cdot n^n \sum x_i + D = A D n^n + \frac{D^{n+1}}{n^n \prod x_i}",
            font_size=34, color=WHITE
        ).shift(UP*1.8)
        a_label = Text("A = amplification coefficient (controls blend)",
                       font_size=20, color=GOLD).next_to(formula, DOWN, buff=0.25)

        with self.voiceover(
            "Curve blends two pricing models. Near balance, it behaves like a flat constant-sum "
            "curve — near-zero slippage for stablecoins. When reserves drift, it transitions toward "
            "constant-product behavior — preventing complete drainage of one token. The amplification "
            "parameter A controls how aggressively it stays flat near equilibrium. High A means "
            "extremely cheap stablecoin swaps. Low A means more tolerance for imbalance but worse "
            "pricing for everyday users."
        ) as tracker:
            self.play(Write(formula), run_time=2)
            self.play(Write(a_label))
            self.wait(tracker.duration - 3)
        self.play(FadeOut(formula, a_label))

        # ── Three curves comparison ────────────────────────────────────────────
        axes = Axes(
            x_range=[0, 1.0, 0.2], y_range=[0, 1.0, 0.2],
            x_length=6.5, y_length=6.5,
            axis_config={"color": GRAY, "include_numbers": True}, tips=False
        ).shift(DOWN*0.2 + LEFT*1.5)
        x_lab = Text("x (USDC)", font_size=18, color=GRAY)\
                  .next_to(axes.x_axis.get_end(), RIGHT)
        y_lab = Text("y (USDT)", font_size=18, color=GRAY)\
                  .next_to(axes.y_axis.get_end(), UP)
        self.play(Create(axes), Write(x_lab), Write(y_lab))

        cpmm = axes.plot(lambda x: 0.25/x if x > 0.04 else None,
                         x_range=[0.04, 0.95, 0.005],
                         color=RED, stroke_width=2.5)

        csum = axes.plot(lambda x: 1-x, x_range=[0.01, 0.99, 0.01],
                         color=BLUE, stroke_width=2.5)

        def stableswap(x, A=100):
            D = 1.0
            y = 0.5 * D
            for _ in range(50):
                c = D**3 / (4*A*x)
                b = x + D/A
                y_new = (-b + (b**2 + 4*c)**0.5)/2
                if abs(y_new - y) < 1e-9: break
                y = y_new
            return y

        ss_pts = [(x, stableswap(x)) for x in np.arange(0.05, 0.96, 0.005)]
        ss_pts = [(x, y) for x, y in ss_pts if 0 < y < 1]
        ss_curve = VMobject(color=TEAL, stroke_width=3)
        ss_curve.set_points_smoothly([axes.coords_to_point(x, y) for x, y in ss_pts])

        legend = VGroup(
            self._legend("Constant Product (x·y=k)", RED),
            self._legend("StableSwap (A=100)",        TEAL),
            self._legend("Constant Sum (x+y=D)",      BLUE),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.2).to_corner(UR).shift(LEFT*0.2)

        with self.voiceover(
            "When A equals 0, the equation reduces to the constant product curve — Uniswap "
            "behavior, high slippage. When A approaches infinity, the equation reduces to the "
            "constant sum x plus y equals D — zero slippage but allows arbitrage to drain one side. "
            "Curve sets A to a moderate value — typically 100 to 2000 for stablecoin pairs. "
            "Near equilibrium, it behaves like constant sum: near-zero slippage. Far from "
            "equilibrium, it curves toward constant product: prevents full drainage. The result: "
            "a 200 to 2,000 times improvement in capital efficiency for stablecoin swaps."
        ) as tracker:
            self.play(Create(cpmm), Write(legend[0]))
            self.play(Create(ss_curve), Write(legend[1]))
            self.play(Create(csum), Write(legend[2]))
            eq_dot = Dot(axes.coords_to_point(0.5, 0.5), color=GOLD, radius=0.12)
            eq_lbl = Text("Equilibrium\n(50/50)", font_size=18, color=GOLD)\
                       .next_to(eq_dot, UR, buff=0.1)
            self.play(FadeIn(eq_dot, scale=1.5), Write(eq_lbl))
            self.wait(tracker.duration - 5)

        slippage_note = Text(
            "Same $1M swap:  Uniswap ≈ 1% slippage  |  Curve ≈ 0.005%",
            font_size=20, color=GOLD
        ).to_edge(DOWN, buff=0.35)

        with self.voiceover(
            "StableSwap is strictly superior to CPMM for correlated-price assets. The A parameter "
            "is a risk dial — higher A means better normal-market performance and worse depeg "
            "performance. For LPs, stablecoin pools on Curve are low-IL, fee-generating positions, "
            "but carry tail risk if any pool asset depegs. Always check the A parameter and "
            "pool composition before providing liquidity."
        ) as tracker:
            self.play(Write(slippage_note))
            self.wait(tracker.duration - 1)

        # ── CTA ────────────────────────────────────────────────────────────────
        with self.voiceover(
            "Next: Aave lending — collateral, health factors, liquidations, and how the "
            "utilization-based interest rate model works. Subscribe. QuantiFire."
        ) as tracker:
            self.play(*[FadeOut(m) for m in self.mobjects], run_time=1)
            outro = Text("QuantiFire  |  EP 14", font_size=30, color=GOLD)
            self.play(FadeIn(outro))
            self.wait(tracker.duration - 1)

    def _legend(self, text, color):
        sq  = Square(side_length=0.25, fill_color=color, fill_opacity=0.85, stroke_width=0)
        lbl = Text(text, font_size=18, color=color).next_to(sq, RIGHT, buff=0.15)
        return VGroup(sq, lbl)
