"""
QuantiFire EP15 — Aave Lending: Collateral, Health Factors, and Liquidations
Run: manim -pql ep15_aave_lending.py AaveLendingScene
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

class AaveLendingScene(VoiceoverScene):
    def construct(self):
        self.camera.background_color = BG
        self.set_speech_service(GTTSService(lang="en"))
        # PRODUCTION: self.set_speech_service(ElevenLabsService(voice_id="pNInz6obpgDQGcFmaJgB", model="eleven_turbo_v2"))

        title = Text("Aave: Collateral, Health Factors & Liquidations",
                     font_size=34, color=GOLD).to_edge(UP)

        # ── Hook ───────────────────────────────────────────────────────────────
        with self.voiceover(
            "You deposit $10,000 of ETH into Aave as collateral and borrow $6,000 in USDC. ETH "
            "drops 20% while you sleep. An automated liquidator bot — running 24/7, scanning every "
            "block — notices your health factor has dropped below 1. Before you can react, it "
            "liquidates a portion of your ETH, repays your debt, and pockets a 5% bonus. You never "
            "got a margin call. This is DeFi lending, and understanding it could save your capital."
        ) as tracker:
            self.play(Write(title), run_time=tracker.duration)

        # ── Context ────────────────────────────────────────────────────────────
        with self.voiceover(
            "Welcome to QuantiFire. Aave is the largest decentralized lending protocol, with tens "
            "of billions in Total Value Locked. Understanding its mechanics — utilization rates, "
            "health factors, liquidation thresholds — is essential for anyone borrowing against "
            "crypto assets or providing capital to lending pools."
        ) as tracker:
            self.wait(tracker.duration)

        # ── Health Factor formula ──────────────────────────────────────────────
        hf_form = MathTex(
            r"HF = \frac{\sum (\text{collateral}_i \times \text{liq. threshold}_i)}{\text{total debt}}",
            font_size=36, color=WHITE
        ).shift(UP*1.8)

        hf_safe  = MathTex(r"HF > 1.0 \Rightarrow \text{Safe}", font_size=32, color=TEAL)\
                     .next_to(hf_form, DOWN, buff=0.3).shift(LEFT*2)
        hf_risky = MathTex(r"HF = 1.0 \Rightarrow \text{Liquidatable!}", font_size=32, color=RED)\
                     .next_to(hf_form, DOWN, buff=0.3).shift(RIGHT*2)

        with self.voiceover(
            "The Health Factor: HF equals the sum of collateral-i times liquidation threshold-i "
            "divided by total debt value. ETH has a liquidation threshold of 85%. HF below 1 "
            "means your position can be liquidated. Example: $10,000 ETH deposited, $6,000 USDC "
            "borrowed. HF equals 10,000 times 0.85 divided by 6,000 equals 1.42. ETH drops to "
            "$7,059 — a 29.4% fall — and HF reaches exactly 1.0. Liquidation triggers."
        ) as tracker:
            self.play(Write(hf_form), run_time=2)
            self.play(Write(hf_safe), Write(hf_risky))
            self.wait(tracker.duration - 3)
        self.play(FadeOut(hf_form, hf_safe, hf_risky))

        # ── HF Gauge animation ─────────────────────────────────────────────────
        gauge_bg = Arc(radius=2.2, start_angle=PI, angle=-PI,
                       color=DARK_GRAY, stroke_width=18)
        gauge_bg.shift(DOWN*0.5)
        self.play(Create(gauge_bg))

        safe_arc  = Arc(radius=2.2, start_angle=PI, angle=-PI*0.6,
                        color=TEAL, stroke_width=18).shift(DOWN*0.5)
        warn_arc  = Arc(radius=2.2, start_angle=PI-PI*0.6, angle=-PI*0.25,
                        color=GOLD, stroke_width=18).shift(DOWN*0.5)
        risk_arc  = Arc(radius=2.2, start_angle=PI-PI*0.85, angle=-PI*0.15,
                        color=RED, stroke_width=18).shift(DOWN*0.5)

        self.play(Create(safe_arc), Create(warn_arc), Create(risk_arc))

        zone_lbls = VGroup(
            Text("Safe\nHF > 1.5", font_size=18, color=TEAL).shift(LEFT*3.0 + DOWN*1.2),
            Text("Warning\n1.1–1.5", font_size=18, color=GOLD).shift(LEFT*0.5 + DOWN*2.5),
            Text("Danger!\nHF < 1.1", font_size=18, color=RED).shift(RIGHT*2.5 + DOWN*1.8),
        )
        self.play(LaggedStartMap(Write, zone_lbls, lag_ratio=0.3))

        example = VGroup(
            Text("Deposit: 10,000 USD in ETH  |  LiqThreshold = 85%", font_size=18, color=WHITE),
            Text("Borrow:  6,000 USDC",                                font_size=18, color=WHITE),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.12).to_edge(DOWN, buff=1.6)
        self.play(Write(example))

        hf_vals = [
            (10000, "ETH @ $10K  →  HF = 1.42", TEAL),
            (8000,  "ETH @ $8K   →  HF = 1.13", GOLD),
            (7059,  "ETH @ $7.1K →  HF = 1.00  LIQUIDATION!", RED),
        ]

        hf_display = Text("", font_size=22).shift(DOWN*2.2)
        for _, msg, col in hf_vals:
            new_display = Text(msg, font_size=22, color=col).shift(DOWN*2.2)
            self.play(Transform(hf_display, new_display), run_time=0.8)
            self.wait(1)

        # ── Utilisation rate curve ─────────────────────────────────────────────
        self.play(*[FadeOut(m) for m in self.mobjects if m != title])

        axes = Axes(
            x_range=[0, 1, 0.2], y_range=[0, 3.5, 0.5],
            x_length=8, y_length=4.5,
            axis_config={"color": GRAY}, tips=False
        ).shift(DOWN*0.4)
        x_lab = Text("Utilisation Rate (U)", font_size=20, color=GRAY)\
                  .next_to(axes.x_axis.get_end(), RIGHT)
        y_lab = Text("Borrow APY", font_size=20, color=GRAY)\
                  .next_to(axes.y_axis.get_end(), UP)
        self.play(Create(axes), Write(x_lab), Write(y_lab))

        def borrow_rate(u, U_opt=0.80, base=0.02, slope1=0.5, slope2=3.0):
            if u <= U_opt: return base + (u/U_opt)*slope1
            return base + slope1 + ((u-U_opt)/(1-U_opt))*slope2

        rate_curve = axes.plot(borrow_rate, x_range=[0, 0.999, 0.005],
                               color=TEAL, stroke_width=3)
        kink_line = DashedLine(axes.coords_to_point(0.8, 0),
                               axes.coords_to_point(0.8, borrow_rate(0.8)),
                               color=GOLD, stroke_width=2)
        kink_lbl  = Text("Kink (U=80%)", font_size=18, color=GOLD)\
                      .next_to(axes.coords_to_point(0.8, borrow_rate(0.8)), UR, buff=0.1)

        with self.voiceover(
            "Aave uses a two-slope interest rate model based on utilization. U equals total borrows "
            "divided by total borrows plus total cash. Below the kink at 80% utilization, borrow "
            "rate increases slowly — cheap to borrow. Above the kink, borrow rate increases steeply "
            "— often 300% APY at 100% utilization. This prevents complete pool drainage. "
            "Always maintain health factor above 1.5 as a personal floor. Set on-chain alerts "
            "at HF equals 1.3 to give yourself time to add collateral or repay debt."
        ) as tracker:
            self.play(Create(rate_curve))
            self.play(Create(kink_line), Write(kink_lbl))
            self.wait(tracker.duration - 2)

        # ── CTA ────────────────────────────────────────────────────────────────
        with self.voiceover(
            "Next episode: Flash Loans — how you can borrow $1 million in one Ethereum block with "
            "zero collateral, execute arbitrage, and repay it all atomically. Subscribe. QuantiFire."
        ) as tracker:
            self.play(*[FadeOut(m) for m in self.mobjects], run_time=1)
            outro = Text("QuantiFire  |  EP 15", font_size=30, color=GOLD)
            self.play(FadeIn(outro))
            self.wait(tracker.duration - 1)
