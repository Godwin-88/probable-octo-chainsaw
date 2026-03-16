"""
QuantiFire EP34 — Prospect Theory: Why Losing $100 Hurts More Than Winning $100 Feels Good
Run: manim -pql ep34_prospect_theory.py ProspectTheoryScene
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

class ProspectTheoryScene(VoiceoverScene):
    def construct(self):
        self.camera.background_color = BG
        self.set_speech_service(GTTSService(lang="en"))
        # PRODUCTION: self.set_speech_service(ElevenLabsService(voice_id="pNInz6obpgDQGcFmaJgB", model="eleven_turbo_v2"))

        title = Text("Prospect Theory & Loss Aversion", font_size=38, color=GOLD)\
                  .to_edge(UP)

        # ── Hook ───────────────────────────────────────────────────────────────
        with self.voiceover(
            "In classical economics, a $100 gain and a $100 loss should feel equally significant "
            "in opposite directions. The math is symmetric. But Nobel laureate Daniel Kahneman "
            "and Amos Tversky proved in 1979 that humans don't work that way. Losses feel "
            "approximately twice as painful as equivalent gains feel pleasurable. That asymmetry "
            "— loss aversion — is the single most dangerous cognitive bias in trading. And it "
            "explains almost every bad decision retail traders make."
        ) as tracker:
            self.play(Write(title), run_time=tracker.duration)

        # ── Context ────────────────────────────────────────────────────────────
        with self.voiceover(
            "Welcome to QuantiFire. Behavioral finance bridges psychology and quantitative "
            "analysis. Understanding why markets misprice assets — because of systematic human "
            "cognitive errors — is just as important as understanding the mathematical models "
            "that describe those mispricings. Prospect Theory is the foundation of behavioral "
            "finance. By understanding it, you can identify when your brain is sabotaging "
            "your decisions."
        ) as tracker:
            self.wait(tracker.duration)

        # ── Loss aversion coefficient ──────────────────────────────────────────
        with self.voiceover(
            "The loss aversion coefficient lambda is approximately 2.25. This means a $100 loss "
            "is felt approximately as intensely as a $225 gain. For a trade to feel worthwhile "
            "to a loss-averse agent, expected gain must be 2.25 times the expected loss. "
            "Prospect Theory defines outcomes as gains and losses relative to a reference point "
            "— usually the current position or purchase price — not as absolute wealth levels. "
            "The value function is S-shaped: concave in the gains domain, convex in the losses "
            "domain, and steeper for losses than gains by the lambda coefficient."
        ) as tracker:
            la_form = MathTex(r"\lambda \approx 2.25", font_size=60, color=RED).shift(UP*1.5)
            la_text = Text("A $100 loss hurts as much as a $225 gain feels good",
                           font_size=22, color=WHITE).next_to(la_form, DOWN, buff=0.3)
            self.play(Write(la_form), Write(la_text))
            self.wait(tracker.duration - 2)
        self.play(FadeOut(la_form, la_text))

        # ── S-shaped value function ────────────────────────────────────────────
        axes = Axes(
            x_range=[-200, 200, 50], y_range=[-300, 200, 50],
            x_length=8, y_length=6.5,
            axis_config={"color": GRAY, "include_numbers": True}, tips=False
        ).shift(DOWN*0.2)
        x_lab = Text("Outcome ($)", font_size=18, color=GRAY)\
                  .next_to(axes.x_axis.get_end(), RIGHT)
        y_lab = Text("Subjective Value", font_size=18, color=GRAY)\
                  .next_to(axes.y_axis.get_end(), UP)
        self.play(Create(axes), Write(x_lab), Write(y_lab))

        # Gains: concave  (x > 0)
        def gain_val(x): return 100 * (x/100)**0.88 if x >= 0 else 0
        # Losses: convex, steeper  (x < 0)
        def loss_val(x): return -2.25 * 100 * (-x/100)**0.88 if x < 0 else 0

        gain_curve = axes.plot(gain_val, x_range=[0, 198, 1], color=TEAL, stroke_width=3)
        loss_curve = axes.plot(loss_val, x_range=[-198, 0, 1], color=RED, stroke_width=3)

        with self.voiceover(
            "The S-shaped value function: the teal curve in the gains domain is concave — "
            "diminishing sensitivity. A $100 gain gives 82 value units. The red curve in the "
            "losses domain is steeper — a $100 loss costs 184 value units, more than twice as "
            "much. The reference point at the origin is the anchor for all evaluations. "
            "The practical consequence: traders sell winning positions too early because the "
            "concavity creates a preference for certainty over uncertainty when ahead — locking "
            "in the profit. And traders hold losing positions too long because selling locks in "
            "the loss as real. This is the disposition effect, documented extensively in "
            "retail trading data."
        ) as tracker:
            self.play(Create(gain_curve), Create(loss_curve), run_time=2)

            # Reference point
            ref_dot = Dot(axes.coords_to_point(0, 0), color=GOLD, radius=0.13)
            ref_lbl = Text("Reference Point", font_size=18, color=GOLD)\
                        .next_to(ref_dot, UR, buff=0.1)
            self.play(FadeIn(ref_dot, scale=1.5), Write(ref_lbl))
            self.wait(0.5)

            # Asymmetry annotation
            gain_ann = Text("+$100 → +82 value units", font_size=17, color=TEAL)\
                         .next_to(axes.coords_to_point(100, gain_val(100)), RIGHT, buff=0.1)
            loss_ann = Text("-$100 → -184 value units", font_size=17, color=RED)\
                         .next_to(axes.coords_to_point(-100, loss_val(-100)), LEFT, buff=0.1)
            self.play(Write(gain_ann), Write(loss_ann))
            self.wait(tracker.duration - 5)

        # ── Trader implications ────────────────────────────────────────────────
        self.play(*[FadeOut(m) for m in self.mobjects if m != title])

        with self.voiceover(
            "Three trading implications. The disposition effect: retail investors sell winning "
            "positions 1.7 times more quickly than losing positions of equal magnitude — "
            "documented by Odean in 1998. The fix: pre-commit to stop-losses before entering "
            "the trade. Probability weighting: humans overweight small probabilities and "
            "underweight large ones — in DeFi this means overvaluing 100-plus percent APY farms "
            "and undervaluing tail risk from smart contract exploits. And the reference point "
            "bias: your cost basis is irrelevant to future returns. The market doesn't know or "
            "care what you paid. Ask instead: given current prices, would I add this position "
            "right now? If yes, hold. If no, exit regardless of your cost basis."
        ) as tracker:
            implications = VGroup(
                self._impl("Disposition Effect",
                           "Sell winners too early, hold losers too long",
                           "Pre-commit stop-losses before entering trade", RED),
                self._impl("Probability Weighting",
                           "Overweight small probs (lottery), underweight large",
                           "Avoid 100%+ APY traps — model the tail risk", GOLD),
                self._impl("Reference Point Bias",
                           "Decisions anchored to cost basis, not market reality",
                           "Ask: 'Would I buy this NOW at current price?'", TEAL),
            ).arrange(DOWN, buff=0.35).shift(DOWN*0.2)
            self.play(LaggedStartMap(FadeIn, implications, lag_ratio=0.3))
            self.wait(tracker.duration - 2)

        # ── CTA ────────────────────────────────────────────────────────────────
        with self.voiceover(
            "Loss aversion with lambda approximately 2.25 is measurable, predictable, and "
            "exploitable — by the market against you. Set your stop-losses in advance. Never "
            "let a losing position run because it'll come back. The reference point — your cost "
            "basis — is irrelevant to future returns. Only systematic rules, pre-committed "
            "before the emotional state of a losing trade sets in, can override this bias. "
            "Next: Behavioral Portfolio Theory — how loss aversion and mental accounting change "
            "the structure of optimal portfolios, and the layered approach to building one. "
            "Subscribe. QuantiFire."
        ) as tracker:
            self.play(*[FadeOut(m) for m in self.mobjects], run_time=1)
            outro = Text("QuantiFire  |  EP 34", font_size=30, color=GOLD)
            self.play(FadeIn(outro))
            self.wait(tracker.duration - 1)

    def _impl(self, name, problem, fix, color):
        box  = RoundedRectangle(width=9.8, height=1.35, corner_radius=0.15,
                                fill_color=color, fill_opacity=0.08,
                                stroke_color=color, stroke_width=1.2)
        nm   = Text(name,    font_size=18, color=color).move_to(box).shift(LEFT*3.5 + UP*0.2)
        pb   = Text(problem, font_size=14, color=WHITE).move_to(box).shift(RIGHT*0.5 + UP*0.2)
        fx   = Text(fix,     font_size=14, color=GRAY).move_to(box).shift(RIGHT*0.3 + DOWN*0.35)
        return VGroup(box, nm, pb, fx)
