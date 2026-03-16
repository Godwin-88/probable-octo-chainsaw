"""
QuantiFire EP26 — Statistical Arbitrage: Cross-DEX Spread Trading
Run: manim -pql ep26_stat_arb.py StatArbScene
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

class StatArbScene(VoiceoverScene):
    def construct(self):
        self.camera.background_color = BG
        self.set_speech_service(GTTSService(lang="en"))
        # PRODUCTION: self.set_speech_service(ElevenLabsService(voice_id="pNInz6obpgDQGcFmaJgB", model="eleven_turbo_v2"))

        title = Text("Statistical Arbitrage: Cross-DEX Spread", font_size=36, color=GOLD)\
                  .to_edge(UP)

        # ── Hook ───────────────────────────────────────────────────────────────
        with self.voiceover(
            "Statistical arbitrage — pairs trading, cointegration, mean-reversion on spreads — "
            "has been the bread and butter of quantitative equity desks since the 1980s. The same "
            "mathematical framework applies perfectly to DeFi: two liquidity pools with the same "
            "token pair but different protocols, or two correlated tokens with a structural price "
            "relationship. Today I'll walk through the full implementation: from cointegration "
            "testing to execution on-chain."
        ) as tracker:
            self.play(Write(title), run_time=tracker.duration)

        # ── Context ────────────────────────────────────────────────────────────
        with self.voiceover(
            "Welcome to QuantiFire. Stat arb in DeFi has a key advantage over equity stat arb: "
            "execution is atomic. Flash loans allow you to capture the spread in one transaction "
            "with zero execution risk. The challenge is that DeFi spreads are smaller, gas costs "
            "are real, and pool liquidity is more fragile than equity markets. Let's build "
            "this system."
        ) as tracker:
            self.wait(tracker.duration)

        # ── Z-score formula ────────────────────────────────────────────────────
        with self.voiceover(
            "Cointegration means two price series have a structural relationship — they may each "
            "wander independently, but their spread is anchored. Find the right ratio to combine "
            "them, and that spread becomes mean-reverting. You test whether the relationship is "
            "real using stationarity tests on the residuals. If the test confirms it, you have "
            "a tradeable pair. Strong cointegrated DeFi pairs include USDC and USDT across "
            "different DEXes, stETH and ETH, and identical tokens bridged across chains."
        ) as tracker:
            z_form = MathTex(
                r"z_t = \frac{S_t - \mu_{roll}}{\sigma_{roll}}",
                font_size=52, color=TEAL
            ).shift(UP*1.6)
            s_def  = MathTex(r"S_t = P_t - \beta \cdot Q_t \quad \text{(cointegrated spread)}",
                             font_size=30, color=WHITE).next_to(z_form, DOWN, buff=0.3)
            self.play(Write(z_form), Write(s_def))
            self.wait(tracker.duration - 2)
        self.play(FadeOut(z_form, s_def))

        # ── Spread time series with z-score signals ────────────────────────────
        axes = Axes(
            x_range=[0, 120, 20], y_range=[-3.5, 3.5, 1],
            x_length=9, y_length=5,
            axis_config={"color": GRAY, "include_numbers": True}, tips=False
        ).shift(DOWN*0.3)
        x_lab = Text("Time (days)", font_size=18, color=GRAY)\
                  .next_to(axes.x_axis.get_end(), RIGHT)
        y_lab = Text("Z-score", font_size=18, color=GRAY)\
                  .next_to(axes.y_axis.get_end(), UP)
        self.play(Create(axes), Write(x_lab), Write(y_lab))

        t = np.linspace(0, 120, 500)
        rng = np.random.default_rng(42)
        spread_raw = (np.sin(t*0.12) + 0.5*np.sin(t*0.31)
                      + rng.normal(0, 0.4, 500))
        # normalise to z-score
        z = (spread_raw - spread_raw.mean()) / spread_raw.std()
        z = np.clip(z, -3.2, 3.2)

        pts = [axes.coords_to_point(t[i], z[i]) for i in range(500)]
        spread_line = VMobject(color=WHITE, stroke_width=2)
        spread_line.set_points_smoothly(pts)

        with self.voiceover(
            "Normalize the spread by its recent history — how far it has deviated relative to "
            "its own rolling volatility. When that normalized spread swings two standard deviations "
            "wide, the pair has gotten extreme. That is your entry signal. Trade against the "
            "divergence and exit when it normalizes back toward the mean. The red dots mark "
            "sell signals, the teal dots mark buy signals. On Layer 2 networks, trading costs "
            "are low enough to capture spreads as small as half a percent — versus 1.5 percent "
            "minimum viable spread on Ethereum mainnet."
        ) as tracker:
            self.play(Create(spread_line), run_time=2)

            # Threshold lines at ±2
            for val, col in [(2, RED), (-2, TEAL)]:
                dline = DashedLine(axes.coords_to_point(0, val),
                                   axes.coords_to_point(120, val),
                                   color=col, stroke_width=2)
                lbl   = Text(f"z = {val:+d}", font_size=16, color=col)\
                          .next_to(axes.coords_to_point(120, val), RIGHT, buff=0.1)
                self.play(Create(dline), Write(lbl))

            # Highlight entry/exit signals
            entry_above = [(i, z[i]) for i in range(500) if z[i] > 2.0]
            entry_below = [(i, z[i]) for i in range(500) if z[i] < -2.0]

            for i, zv in entry_above[:6]:
                d = Dot(axes.coords_to_point(t[i], zv), color=RED, radius=0.08)
                self.play(FadeIn(d, scale=1.5), run_time=0.2)
            for i, zv in entry_below[:6]:
                d = Dot(axes.coords_to_point(t[i], zv), color=TEAL, radius=0.08)
                self.play(FadeIn(d, scale=1.5), run_time=0.2)

            legend = VGroup(
                self._leg("z > +2: SELL spread (buy Q, sell P)", RED),
                self._leg("z < -2: BUY spread (buy P, sell Q)", TEAL),
                self._leg("z → 0: EXIT trade", GOLD),
            ).arrange(DOWN, aligned_edge=LEFT, buff=0.2).to_corner(UL).shift(RIGHT*0.2+DOWN*0.5)
            self.play(LaggedStartMap(Write, legend, lag_ratio=0.3))

            cost_note = Text(
                "L2 round-trip cost ≈ 0.2–0.4%  |  Min spread > 0.5% to profit",
                font_size=19, color=GOLD
            ).to_edge(DOWN, buff=0.35)
            self.play(Write(cost_note))
            self.wait(tracker.duration - 8)

        # ── CTA ────────────────────────────────────────────────────────────────
        with self.voiceover(
            "DeFi stat arb is a real systematic strategy. Start with the most structurally "
            "cointegrated pairs: stETH over ETH, USDC over USDT across different venues, "
            "same-token cross-chain. Use Layer 2 networks where gas makes smaller spreads viable. "
            "Automate the z-score monitoring and execution — this strategy requires continuous "
            "scanning, not manual observation. "
            "Next: the delta-neutral yield strategy — running a structured position that earns "
            "funding rates with zero directional exposure to crypto prices. The institutional "
            "yield strategy hidden in plain sight. Subscribe. QuantiFire."
        ) as tracker:
            self.play(*[FadeOut(m) for m in self.mobjects], run_time=1)
            outro = Text("QuantiFire  |  EP 26", font_size=30, color=GOLD)
            self.play(FadeIn(outro))
            self.wait(tracker.duration - 1)

    def _leg(self, text, color):
        sq  = Square(side_length=0.2, fill_color=color, fill_opacity=0.9, stroke_width=0)
        lbl = Text(text, font_size=16, color=color).next_to(sq, RIGHT, buff=0.12)
        return VGroup(sq, lbl)
