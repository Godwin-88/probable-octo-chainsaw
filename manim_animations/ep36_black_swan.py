"""
QuantiFire EP36 — Black Swans: The Tail Risk Your Model Will Never Predict
Run: manim -pql ep36_black_swan.py BlackSwanScene
Audio: AI voiceover via manim-voiceover
"""
from manim import *
from manim_voiceover import VoiceoverScene
from manim_voiceover.services.gtts import GTTSService
# PRODUCTION: from manim_voiceover.services.elevenlabs import ElevenLabsService
import numpy as np
from scipy.stats import norm, t as t_dist

GOLD = "#FFB700"
TEAL = "#00C896"
RED  = "#FF4444"
BLUE = "#4A90E2"
BG   = "#0D0D0D"

class BlackSwanScene(VoiceoverScene):
    def construct(self):
        self.camera.background_color = BG
        self.set_speech_service(GTTSService(lang="en"))
        # PRODUCTION: self.set_speech_service(ElevenLabsService(voice_id="pNInz6obpgDQGcFmaJgB", model="eleven_turbo_v2"))

        title = Text("Black Swans: Tail Risk Your Model Won't Predict",
                     font_size=34, color=GOLD).to_edge(UP)

        # ── Hook ───────────────────────────────────────────────────────────────
        with self.voiceover(
            "In 2008, quantitative models at every major bank said a nationwide simultaneous "
            "decline in US housing prices was essentially impossible — such an event had never "
            "happened in the historical data. Then it happened. In May 2022, quantitative models "
            "at every crypto fund said a top-5 algorithmic stablecoin collapsing to zero in "
            "72 hours was essentially impossible. Then it happened. Nassim Nicholas Taleb calls "
            "these Black Swan events — and his framework for thinking about them is the most "
            "important risk management insight of the last 50 years."
        ) as tracker:
            self.play(Write(title), run_time=tracker.duration)

        # ── Context ────────────────────────────────────────────────────────────
        with self.voiceover(
            "Welcome to QuantiFire. Taleb's trilogy — The Black Swan, Fooled by Randomness, and "
            "Antifragile — fundamentally challenged the mathematical assumptions underlying "
            "modern portfolio theory. This final episode of Season 1 closes the loop: after "
            "35 episodes of models and formulas, we confront the limits of models themselves "
            "and build a practical framework for surviving the events they cannot predict."
        ) as tracker:
            self.wait(tracker.duration)

        # ── Normal vs Fat-tail distribution ────────────────────────────────────
        axes = Axes(
            x_range=[-5.5, 5.5, 1], y_range=[0, 0.45, 0.1],
            x_length=9, y_length=4.5,
            axis_config={"color": GRAY, "include_numbers": True}, tips=False
        ).shift(DOWN*0.3)
        x_lab = Text("Standard Deviations", font_size=18, color=GRAY)\
                  .next_to(axes.x_axis.get_end(), RIGHT)
        y_lab = Text("Density", font_size=18, color=GRAY)\
                  .next_to(axes.y_axis.get_end(), UP)
        self.play(Create(axes), Write(x_lab), Write(y_lab))

        # Normal
        normal_curve = axes.plot(lambda x: norm.pdf(x), x_range=[-5.4, 5.4, 0.01],
                                 color=BLUE, stroke_width=2.5)
        # Student-t with nu=3 (fat tails)
        fat_tail = axes.plot(lambda x: t_dist.pdf(x, df=3), x_range=[-5.4, 5.4, 0.01],
                             color=RED, stroke_width=2.5)

        with self.voiceover(
            "The core statistical problem: financial returns live in Extremistan — domains "
            "dominated by extreme outliers. The blue curve is the normal distribution — what "
            "your model assumes. The red curve is the fat-tailed Student-t distribution with "
            "3 degrees of freedom — closer to reality. Notice the shaded tails beyond 3 standard "
            "deviations: the fat-tailed distribution has 10 to 100 times more probability mass "
            "in extreme events than the normal distribution predicts. The 2008 financial crisis "
            "was a 25-sigma event under normal distribution assumptions — an event that should "
            "occur once every 10 to the power 135 years. It occurred. This is the Ludic Fallacy "
            "— using models built for structured games to model open-ended reality. September 11 "
            "didn't appear in any historical dataset. COVID-19 didn't appear in any historical "
            "dataset. The model's confidence interval is not a guarantee."
        ) as tracker:
            self.play(Create(normal_curve))
            normal_lbl = Text("Normal dist.\n(your model)", font_size=18, color=BLUE)\
                           .next_to(axes.coords_to_point(2, 0.38), UR, buff=0.1)
            self.play(Write(normal_lbl))
            self.play(Create(fat_tail))
            fat_lbl = Text("Fat tails\n(reality)", font_size=18, color=RED)\
                        .next_to(axes.coords_to_point(-4, 0.06), LEFT, buff=0.1)
            self.play(Write(fat_lbl))

            # Shade tails beyond ±3σ
            tail_right = axes.get_area(fat_tail, x_range=[3.0, 5.4], color=RED, opacity=0.5)
            tail_left  = axes.get_area(fat_tail, x_range=[-5.4, -3.0], color=RED, opacity=0.5)
            normal_right = axes.get_area(normal_curve, x_range=[3.0, 5.4], color=BLUE, opacity=0.3)
            normal_left  = axes.get_area(normal_curve, x_range=[-5.4, -3.0], color=BLUE, opacity=0.3)

            self.play(FadeIn(tail_right), FadeIn(tail_left),
                      FadeIn(normal_right), FadeIn(normal_left))

            tail_ann = Text(
                "Fat tails: 10–100× more probability mass in extreme events",
                font_size=18, color=RED
            ).to_edge(DOWN, buff=1.0)
            self.play(Write(tail_ann))
            self.wait(tracker.duration - 7)

        # ── Three Properties of Black Swans ───────────────────────────────────
        self.play(*[FadeOut(m) for m in self.mobjects if m != title])

        with self.voiceover(
            "Taleb defines a Black Swan by three properties. First: rarity — the event lies "
            "outside the realm of regular expectations. Nothing in the past convincingly points "
            "to its possibility. Second: extreme impact — the event carries massive consequences, "
            "positive or negative. It changes the paradigm. Third: retrospective predictability "
            "— after the event, it seems explainable and predictable in hindsight. 'Of course "
            "the housing market was in a bubble.' 'Of course an algorithmic stablecoin with no "
            "real collateral would collapse.' Hindsight bias kicks in. The term comes from the "
            "assumption, held until the 17th century, that all swans were white. The discovery "
            "of black swans in Australia invalidated a universal law based on extensive but "
            "incomplete observation."
        ) as tracker:
            props = VGroup(
                self._prop("RARITY",
                           "Outside all historical precedent\nNothing pointed to it",
                           RED),
                self._prop("EXTREME IMPACT",
                           "Catastrophic or transformational\nChanges the paradigm",
                           RED),
                self._prop("RETROSPECTIVE PREDICTABILITY",
                           "'Of course it was going to happen'\nHindsight bias kicks in",
                           GOLD),
            ).arrange(DOWN, buff=0.4).shift(DOWN*0.2)

            for p in props:
                self.play(FadeIn(p, shift=RIGHT*0.3))
                self.wait(0.5)
            self.wait(tracker.duration - 5)

        # ── Barbell Strategy ──────────────────────────────────────────────────
        self.play(*[FadeOut(m) for m in self.mobjects if m != title])

        barbell_title = Text("Taleb's Barbell Strategy", font_size=28, color=GOLD)\
                          .shift(UP*1.8)
        self.play(Write(barbell_title))

        left_bell  = RoundedRectangle(width=3.5, height=2.5, corner_radius=0.2,
                                      fill_color=TEAL, fill_opacity=0.12,
                                      stroke_color=TEAL, stroke_width=1.5)\
                       .shift(LEFT*3.5 + DOWN*0.3)
        right_bell = RoundedRectangle(width=3.5, height=2.5, corner_radius=0.2,
                                      fill_color=GOLD, fill_opacity=0.12,
                                      stroke_color=GOLD, stroke_width=1.5)\
                       .shift(RIGHT*3.5 + DOWN*0.3)
        bar_line   = Line(left_bell.get_right(), right_bell.get_left(),
                          color=GRAY, stroke_width=3)

        left_title = Text("90% — SAFE", font_size=20, color=TEAL)\
                       .move_to(left_bell).shift(UP*0.7)
        left_desc  = Text("T-bills\nFDIC cash\nCannot lose >10%", font_size=16, color=WHITE,
                           line_spacing=1.2).move_to(left_bell).shift(DOWN*0.1)

        right_title = Text("10% — CONVEX", font_size=20, color=GOLD)\
                        .move_to(right_bell).shift(UP*0.7)
        right_desc  = Text("Long options\nVenture bets\nUnlimited upside\nMax loss = premium",
                            font_size=14, color=WHITE, line_spacing=1.2)\
                        .move_to(right_bell).shift(DOWN*0.15)

        with self.voiceover(
            "Taleb's prescription: build antifragile portfolios — portfolios that gain from "
            "volatility, not just survive it. The Barbell Strategy: 90% in ultra-safe assets — "
            "T-bills, FDIC cash — you cannot lose more than 10% of total portfolio. 10% in "
            "highly convex, positively skewed assets — long options, venture bets, tail-risk "
            "hedging instruments. These positions have unlimited upside but limited downside — "
            "maximum loss is the premium paid. Net result: protected from catastrophic loss "
            "while having exposure to Black Swan upside. Applied to DeFi: 70 to 80% in "
            "stablecoins and major chain staking, 10 to 20% in diversified DeFi blue chips, "
            "and 5 to 10% in protocol tokens with convex upside. Never concentrate more than "
            "20% in any single protocol regardless of audit status or track record. Black Swans "
            "don't care about audits."
        ) as tracker:
            self.play(Create(left_bell), Write(left_title), Write(left_desc))
            self.play(Create(bar_line))
            self.play(Create(right_bell), Write(right_title), Write(right_desc))
            self.wait(1)

            ruin_rule = Text(
                "NEVER size any position where a total loss destroys your ability to continue",
                font_size=18, color=RED
            ).to_edge(DOWN, buff=0.35)
            ruin_box = SurroundingRectangle(ruin_rule, color=RED, buff=0.12, corner_radius=0.1)
            self.play(Create(ruin_box), Write(ruin_rule))
            self.wait(tracker.duration - 6)

        # ── Season finale ──────────────────────────────────────────────────────
        with self.voiceover(
            "Build portfolios that can survive Black Swans, not just model the expected "
            "distribution of normal outcomes. Rules: never size any position where a total "
            "loss destroys your ability to continue. Keep cash and safe assets sufficient to "
            "survive multi-year drawdowns. Maintain convex exposure to upside as Black Swan "
            "insurance. Models tell you what should happen — position sizing tells you what "
            "happens when they're wrong. "
            "That wraps Season 1 of QuantiFire — 36 episodes covering everything from portfolio "
            "variance to Black Swan theory, from x times y equals k to ECDSA cryptography. If "
            "you've made it here, you now have the quantitative foundation that most market "
            "participants never develop. Season 2 is coming: we'll build live, runnable Python "
            "and Solidity implementations of everything we covered. Subscribe, hit the bell, "
            "share this with one person who needs it. QuantiFire — the math is real, the "
            "edge is yours."
        ) as tracker:
            self.play(*[FadeOut(m) for m in self.mobjects])

            finale = VGroup(
                Text("Season 1 Complete", font_size=36, color=GOLD),
                Text("36 Episodes  |  Classical Quant → DeFi → Blockchain → Behavioral",
                     font_size=20, color=WHITE),
                Text("Season 2: Live Python + Solidity implementations",
                     font_size=20, color=TEAL),
                Text("QuantiFire  —  the math is real, the edge is yours",
                     font_size=22, color=GOLD),
            ).arrange(DOWN, buff=0.4)
            self.play(LaggedStartMap(FadeIn, finale, lag_ratio=0.4))
            self.wait(tracker.duration - 3)

    def _prop(self, title, desc, color):
        box  = RoundedRectangle(width=9.8, height=1.25, corner_radius=0.15,
                                fill_color=color, fill_opacity=0.08,
                                stroke_color=color, stroke_width=1.2)
        t_t  = Text(title, font_size=20, color=color).move_to(box).shift(LEFT*3.5)
        d_t  = Text(desc, font_size=16, color=WHITE, line_spacing=1.2)\
                 .move_to(box).shift(RIGHT*1.5)
        return VGroup(box, t_t, d_t)
