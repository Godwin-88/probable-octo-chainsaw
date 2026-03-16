"""
QuantiFire EP13 — Uniswap V3: Concentrated Liquidity and 4,000x Capital Efficiency
Run: manim -pql ep13_uniswap_v3.py UniswapV3Scene
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

class UniswapV3Scene(VoiceoverScene):
    def construct(self):
        self.camera.background_color = BG
        self.set_speech_service(GTTSService(lang="en"))
        # PRODUCTION: self.set_speech_service(ElevenLabsService(voice_id="pNInz6obpgDQGcFmaJgB", model="eleven_turbo_v2"))

        title = Text("Uniswap V3: Concentrated Liquidity", font_size=38, color=GOLD)\
                  .to_edge(UP)

        # ── Hook ───────────────────────────────────────────────────────────────
        with self.voiceover(
            "In Uniswap V2, your liquidity sits across every possible price from zero to infinity. "
            "The vast majority of it is sitting at prices ETH will never trade at. In May 2021, "
            "Uniswap V3 changed this completely: LPs choose a specific price range. All your "
            "capital works in that range. The result: up to 4,000 times more fee income per "
            "dollar deployed. But it comes with a catch."
        ) as tracker:
            self.play(Write(title), run_time=tracker.duration)

        # ── Context ────────────────────────────────────────────────────────────
        with self.voiceover(
            "Welcome to QuantiFire. Uniswap V3 introduced concentrated liquidity — arguably the "
            "most significant AMM innovation since the original constant product formula. Today "
            "I'll explain the math behind it, show you how virtual reserves work, calculate the "
            "exact capital efficiency gain, and explain why V3 LPs need to actively manage "
            "positions to stay profitable."
        ) as tracker:
            self.wait(tracker.duration)

        # ── V2 vs V3 liquidity distribution ───────────────────────────────────
        compare_label = Text("V2 vs V3 — Liquidity Distribution", font_size=26, color=WHITE)\
                          .shift(UP*1.8)
        self.play(Write(compare_label))

        axes = Axes(
            x_range=[500, 3500, 500], y_range=[0, 1.2, 0.3],
            x_length=9, y_length=4,
            axis_config={"color": GRAY}, tips=False
        ).shift(DOWN*0.5)
        x_lab = Text("ETH Price (USDC)", font_size=18, color=GRAY)\
                  .next_to(axes.x_axis.get_end(), RIGHT)
        y_lab = Text("Liquidity", font_size=18, color=GRAY)\
                  .next_to(axes.y_axis.get_end(), UP)
        self.play(Create(axes), Write(x_lab), Write(y_lab))

        v2_flat = axes.plot(lambda x: 0.25, x_range=[510, 3490, 5],
                            color=BLUE, stroke_width=2.5, stroke_opacity=0.7)
        v2_area = axes.get_area(v2_flat, x_range=[510, 3490], color=BLUE, opacity=0.2)
        v2_lbl  = Text("V2: uniform (0 → ∞)", font_size=20, color=BLUE)\
                    .to_corner(UR).shift(DOWN*0.5 + LEFT*0.3)

        def v3_liq(x):
            mu, sig = 2000, 250
            return 1.05 * np.exp(-0.5*((x-mu)/sig)**2)

        v3_curve = axes.plot(v3_liq, x_range=[510, 3490, 5],
                             color=TEAL, stroke_width=2.5)
        v3_area  = axes.get_area(v3_curve, x_range=[1400, 2600], color=TEAL, opacity=0.35)
        v3_lbl   = Text("V3: concentrated range", font_size=20, color=TEAL)\
                     .to_corner(UR).shift(DOWN*1.0 + LEFT*0.3)

        lp_low  = DashedLine(axes.coords_to_point(1400, 0), axes.coords_to_point(1400, 1.1),
                             color=GOLD, stroke_width=1.5)
        lp_high = DashedLine(axes.coords_to_point(2600, 0), axes.coords_to_point(2600, 1.1),
                             color=GOLD, stroke_width=1.5)
        range_lbl = Text("[1400, 2600]\nLP range", font_size=18, color=GOLD)\
                      .next_to(axes.coords_to_point(2000, 1.15), UP, buff=0.1)

        with self.voiceover(
            "In V2, an LP provides liquidity across the entire price curve from 0 to infinity. "
            "Only a tiny fraction of that curve is active at any moment — capital efficiency is "
            "extremely low. In V3, each LP position specifies a range from P-lower to P-upper. "
            "Within that range, the position behaves exactly like a V2 pool. Outside that range, "
            "the position earns zero fees but holds all reserves in one token."
        ) as tracker:
            self.play(Create(v2_flat), FadeIn(v2_area), Write(v2_lbl))
            self.play(Create(v3_curve), FadeIn(v3_area), Write(v3_lbl))
            self.play(Create(lp_low), Create(lp_high), Write(range_lbl))
            self.wait(tracker.duration - 4)

        # ── Capital efficiency callout ─────────────────────────────────────────
        self.play(*[FadeOut(m) for m in self.mobjects if m != title])

        eff_title = Text("Capital Efficiency Gain", font_size=28, color=GOLD).shift(UP*1.8)
        self.play(Write(eff_title))

        formula = MathTex(
            r"\text{Efficiency} \approx \frac{\sqrt{P_c}}{\sqrt{P_{high}} - \sqrt{P_{low}}}",
            font_size=40, color=WHITE
        ).shift(UP*0.6)
        self.play(Write(formula))

        examples = VGroup(
            Text("±25% range  →  ~10× efficiency", font_size=22, color=TEAL),
            Text("± 5% range  →  ~50× efficiency", font_size=22, color=GOLD),
            Text("± 1% range  →  ~250× efficiency", font_size=22, color=RED),
        ).arrange(DOWN, buff=0.3).shift(DOWN*0.5)

        with self.voiceover(
            "Tighter price ranges mean dramatically higher capital efficiency. A plus-or-minus 25% "
            "range gives you about 10 times the fee income per dollar versus V2. Narrow to plus-or-minus "
            "5% and you get 50 times. The tightest ranges push 250 times or more. But this cuts both "
            "ways — if price drifts outside your range, you earn zero fees AND you collect the full "
            "impermanent loss. Concentrated liquidity rewards precision and punishes passive LPs."
        ) as tracker:
            self.play(LaggedStartMap(FadeIn, examples, lag_ratio=0.3))
            self.wait(tracker.duration - 1)

        warning_box = RoundedRectangle(width=9.5, height=1.3, corner_radius=0.18,
                                       fill_color=RED, fill_opacity=0.1,
                                       stroke_color=RED, stroke_width=1.5)\
                        .to_edge(DOWN, buff=0.3)
        warning_text = Text(
            "OUT OF RANGE = zero fees + full IL — requires active management!",
            font_size=20, color=RED
        ).move_to(warning_box)

        with self.voiceover(
            "V3 is strictly better than V2 for informed LPs and worse for passive LPs who set a "
            "range and forget. If you're providing liquidity in V3, you need a rebalancing strategy, "
            "a fee tracking system, and a clear break-even analysis. Treat it as an active trading "
            "position with unique risk characteristics, not a passive yield source."
        ) as tracker:
            self.play(Create(warning_box), Write(warning_text))
            self.wait(tracker.duration - 1)

        # ── CTA ────────────────────────────────────────────────────────────────
        with self.voiceover(
            "Next: Curve Finance StableSwap — how Curve achieves near-zero slippage for stablecoin "
            "swaps with a completely different AMM formula. Subscribe. QuantiFire."
        ) as tracker:
            self.play(*[FadeOut(m) for m in self.mobjects], run_time=1)
            outro = Text("QuantiFire  |  EP 13", font_size=30, color=GOLD)
            self.play(FadeIn(outro))
            self.wait(tracker.duration - 1)
