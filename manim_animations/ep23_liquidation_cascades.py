"""
QuantiFire EP23 — Liquidation Cascades: When DeFi Dominoes Fall
Run: manim -pql ep23_liquidation_cascades.py LiquidationCascadeScene
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

class LiquidationCascadeScene(VoiceoverScene):
    def construct(self):
        self.camera.background_color = BG
        self.set_speech_service(GTTSService(lang="en"))
        # PRODUCTION: self.set_speech_service(ElevenLabsService(voice_id="pNInz6obpgDQGcFmaJgB", model="eleven_turbo_v2"))

        title = Text("Liquidation Cascades: DeFi Dominoes", font_size=38, color=GOLD)\
                  .to_edge(UP)

        # ── Hook ───────────────────────────────────────────────────────────────
        with self.voiceover(
            "May 2022. LUNA collapses from $80 to $0 in 72 hours. Billions in positions across "
            "Anchor, Venus, and Aave are instantly undercollateralized. Liquidation bots race to "
            "clear positions, dumping collateral onto thin markets. Each liquidation drives prices "
            "lower. Lower prices trigger more liquidations. The cascade propagates across the entire "
            "DeFi ecosystem. By the end: $300 billion in market cap evaporated. This is the "
            "liquidation cascade — and it's a structural feature of overcollateralized lending."
        ) as tracker:
            self.play(Write(title), run_time=tracker.duration)

        # ── Context ────────────────────────────────────────────────────────────
        with self.voiceover(
            "Welcome to QuantiFire. Liquidation cascades are one of the most dangerous systemic "
            "risks in DeFi. They arise from the feedback loop between falling prices, forced "
            "selling, and further price declines. Understanding the mechanics helps you position "
            "your own portfolios defensively and identify systemic risk building up in the market."
        ) as tracker:
            self.wait(tracker.duration)

        # ── Domino / cascade diagram ───────────────────────────────────────────
        cascade_title = Text("The Feedback Loop", font_size=26, color=WHITE).shift(UP*1.8)
        self.play(Write(cascade_title))

        loop_steps = [
            ("Price Drops", RED,    LEFT*4 + UP*0.0),
            ("HF < 1.0\n(Positions unsafe)", RED, LEFT*1.2 + UP*0.0),
            ("Bots Liquidate\n(sell collateral)", GOLD, RIGHT*1.8 + UP*0.0),
            ("MORE Price\nPressure", RED,  RIGHT*4.5 + UP*0.0),
        ]

        prev = None
        mobs = []
        with self.voiceover(
            "The cascade mechanism: step one — asset price drops below a critical level, multiple "
            "positions reach a health factor below 1. Step two — liquidation bots execute, selling "
            "collateral on DEXes at market price. Step three — that selling pressure drives prices "
            "further down. Step four — new positions breach the health factor threshold, triggering "
            "more liquidations. Repeat until price finds natural support or collateral pools are "
            "exhausted. The feedback amplifies because all liquidations sell the same collateral "
            "asset — ETH — and price impact is additive across hundreds of simultaneous events."
        ) as tracker:
            for text, col, pos in loop_steps:
                b = RoundedRectangle(width=2.5, height=1.3, corner_radius=0.15,
                                     fill_color=col, fill_opacity=0.12,
                                     stroke_color=col, stroke_width=1.5).move_to(pos)
                t = Text(text, font_size=17, color=col, line_spacing=1.2).move_to(b)
                mobs.append(VGroup(b, t))
                anims = [FadeIn(VGroup(b, t))]
                if prev:
                    a = Arrow(prev.get_right(), VGroup(b,t).get_left(),
                              color=RED, buff=0.05, stroke_width=2)
                    anims.append(GrowArrow(a))
                self.play(*anims, run_time=0.6)
                prev = VGroup(b, t)
                self.wait(0.3)

            # Loop-back arrow
            loop_arrow = CurvedArrow(
                loop_steps[-1][2] + DOWN*0.65 + RIGHT*1.0,
                loop_steps[0][2]  + DOWN*0.65 + LEFT*1.0,
                color=RED, stroke_width=2, angle=-PI/3
            )
            loop_lbl = Text("...amplifies", font_size=18, color=RED).shift(DOWN*1.8)
            self.play(Create(loop_arrow), Write(loop_lbl))
            self.wait(tracker.duration - 8)

        # ── Liquidation density chart ──────────────────────────────────────────
        self.play(*[FadeOut(m) for m in self.mobjects if m != title])

        liq_title = Text("Liquidation Density Map — ETH Collateral",
                         font_size=22, color=WHITE).shift(UP*1.8)
        self.play(Write(liq_title))

        axes = Axes(
            x_range=[1000, 3500, 500], y_range=[0, 600, 100],
            x_length=9, y_length=4,
            axis_config={"color": GRAY}, tips=False
        ).shift(DOWN*0.4)
        x_lab = Text("ETH Price (USD)", font_size=18, color=GRAY)\
                  .next_to(axes.x_axis.get_end(), RIGHT)
        y_lab = Text("Collateral ($M) liquidatable", font_size=16, color=GRAY)\
                  .next_to(axes.y_axis.get_end(), UP)
        self.play(Create(axes), Write(x_lab), Write(y_lab))

        # Simulated density
        prices = [1200, 1400, 1600, 1800, 2000, 2200, 2400, 2600, 2800, 3000, 3200]
        amounts = [550, 420, 300, 200, 150, 100, 80, 60, 40, 25, 15]

        with self.voiceover(
            "This liquidation density map shows how much ETH collateral becomes liquidatable "
            "at each price level. The red bars — prices below $2,000 — represent hundreds of "
            "millions in positions that would cascade. When ETH was at $2,000, a drop to $1,600 "
            "would unlock $300 million in forced selling. That selling pushes price to $1,400, "
            "unlocking another $420 million. The March 2020 Black Thursday event followed exactly "
            "this pattern — ETH dropped 43% in 24 hours and MakerDAO liquidation auctions had zero "
            "bidders. The protocol ended with $4 million in bad debt sold for zero DAI."
        ) as tracker:
            for p, amt in zip(prices, amounts):
                x0 = axes.coords_to_point(p-80, 0)
                x1 = axes.coords_to_point(p-80, amt)
                col = RED if p < 2000 else GOLD if p < 2500 else TEAL
                bar = Rectangle(
                    width=abs(axes.coords_to_point(p+80, 0)[0] - x0[0]),
                    height=abs(x1[1] - x0[1]),
                    fill_color=col, fill_opacity=0.8, stroke_width=0
                ).move_to([(x0[0]+axes.coords_to_point(p+80,0)[0])/2,
                           (x0[1]+x1[1])/2, 0])
                self.play(FadeIn(bar), run_time=0.2)

            current_price = DashedLine(axes.coords_to_point(2000, 0),
                                       axes.coords_to_point(2000, 620),
                                       color=WHITE, stroke_width=2)
            cp_lbl = Text("Current\nPrice", font_size=16, color=WHITE)\
                       .next_to(axes.coords_to_point(2000, 580), RIGHT, buff=0.1)
            self.play(Create(current_price), Write(cp_lbl))
            self.wait(tracker.duration - 4)

        # ── CTA ────────────────────────────────────────────────────────────────
        with self.voiceover(
            "In a cascade, every second counts. Automated position management tools — DeFiSaver "
            "automation, Instadapp — can add collateral or reduce debt automatically when your "
            "health factor drops below your threshold. They move faster than any manual response. "
            "Set these up before you need them. Never rely on being able to manually respond during "
            "a cascade — gas prices will spike 100 times and the UI will be down. "
            "Final episode of Series 3: Regulatory Risk — SEC, FATF, MiCA, and what the evolving "
            "global regulatory framework means for your DeFi positions. Subscribe. QuantiFire."
        ) as tracker:
            defence = Text(
                "Defence: HF > 1.5 always | Auto-liquidation alerts | Hold dry-powder stables",
                font_size=19, color=TEAL
            ).to_edge(DOWN, buff=0.3)
            self.play(Write(defence))
            self.wait(2)
            self.play(*[FadeOut(m) for m in self.mobjects], run_time=1)
            outro = Text("QuantiFire  |  EP 23", font_size=30, color=GOLD)
            self.play(FadeIn(outro))
            self.wait(tracker.duration - 4)
