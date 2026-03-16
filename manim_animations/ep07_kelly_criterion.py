"""
QuantiFire EP07 — The Kelly Criterion: The Optimal Bet Sizing Formula
Run: manim -pql ep07_kelly_criterion.py KellyScene
Audio: AI voiceover via manim-voiceover

Sources:
  Kelly (1956) Bell System Technical Journal 35(4) 917-926
  Thorp (1969) Revue de l'Institut International de Statistique 37(3) 273-293
  MacLean, Thorp & Ziemba (2011) The Kelly Capital Growth Investment Criterion, World Scientific
  Chan (2009) Quantitative Trading, Wiley  Ch.6

One scene per script paragraph:
  HOOK         0:00-0:30   Bell Labs 1956 — Kelly's formula
  CONTEXT      0:30-1:00   What fraction of bankroll to risk?
  FORMULA      1:00-1:30   f* = p - q/b  with labelled terms
  EXAMPLE      1:30-2:00   Coin flip: 25%, not 50%, not 100%
  GEOMEAN      2:00-2:30   G = p·ln(1+fb) + q·ln(1-f)  — why Kelly maximises log-wealth
  OVERTRAP     2:30-3:00   Growth curves: conservative / Kelly / 2×Kelly / reckless
  MULTIASSET   3:00-3:20   Multi-asset Kelly  w* ≈ Σ⁻¹μ  — converges with Markowitz
  FRACTKELLY   3:20-3:40   Half-Kelly: 75% of growth, far less drawdown
  DEFI         3:40-3:55   Yield allocation — smart-contract ruin risk
  TAKEAWAY     3:55-4:30   Use half-Kelly, never exceed full, hard-stop rule
  CTA          4:30-5:00   Outro + EP08 Risk Parity teaser
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
GRAY = "#888888"
BG   = "#0D0D0D"


def clear(scene):
    scene.play(*[FadeOut(m) for m in scene.mobjects], run_time=0.5)


class KellyScene(VoiceoverScene):
    def construct(self):
        self.camera.background_color = BG
        self.set_speech_service(GTTSService(lang="en"))
        # PRODUCTION: self.set_speech_service(ElevenLabsService(
        #     voice_id="pNInz6obpgDQGcFmaJgB", model="eleven_turbo_v2"))

        self._scene_hook()
        self._scene_context()
        self._scene_formula()
        self._scene_example()
        self._scene_geomean()
        self._scene_overbetting_trap()
        self._scene_multi_asset()
        self._scene_fractional_kelly()
        self._scene_defi()
        self._scene_takeaway()
        self._scene_cta()

    # ── SCENE 1: HOOK ─────────────────────────────────────────────────────────
    def _scene_hook(self):
        year_lbl  = Text("1956", font_size=80, color=GOLD, weight=BOLD).shift(UP * 0.6)
        origin    = Text("Bell Labs  ·  John L. Kelly Jr.", font_size=26, color=WHITE)\
                       .next_to(year_lbl, DOWN, buff=0.3)
        claim     = Text(
            "A formula that provably maximises\nlong-term wealth growth faster\nthan any other strategy.",
            font_size=24, color=TEAL, line_spacing=1.3
        ).next_to(origin, DOWN, buff=0.45)

        users = VGroup(
            Text("Blackjack card counters", font_size=19, color=GRAY),
            Text("Quantitative hedge funds", font_size=19, color=GRAY),
            Text("DeFi yield strategists",   font_size=19, color=GRAY),
        ).arrange(RIGHT, buff=0.9).to_edge(DOWN, buff=0.7)

        with self.voiceover(
            "In 1956, a Bell Labs scientist named John Kelly published a formula that — "
            "if applied correctly — provably maximises your long-term wealth growth rate "
            "faster than any other betting strategy."
        ) as tracker:
            self.play(Write(year_lbl), run_time=0.8)
            self.play(FadeIn(origin), run_time=0.6)
            self.play(FadeIn(claim), run_time=0.8)
            self.wait(tracker.duration - 2.2)

        with self.voiceover(
            "It's used by everyone from professional blackjack card counters to "
            "quantitative hedge funds. And it comes with a trap that destroys "
            "accounts if you're not careful."
        ) as tracker:
            self.play(LaggedStart(*[FadeIn(u) for u in users], lag_ratio=0.3),
                      run_time=1.0)
            self.wait(tracker.duration - 1.0)

        clear(self)

    # ── SCENE 2: CONTEXT ──────────────────────────────────────────────────────
    def _scene_context(self):
        title = Text("The Kelly Criterion", font_size=32, color=GOLD)\
                   .to_edge(UP, buff=0.5)
        cite  = Text(
            "Kelly (1956) · Bell System Technical Journal  ·  "
            "MacLean, Thorp & Ziemba (2011) · World Scientific",
            font_size=13, color=GRAY
        ).next_to(title, DOWN, buff=0.12)
        self.play(Write(title), FadeIn(cite))

        question = Text(
            "Given a bet with known probabilities and payoffs —\n"
            "what fraction of your bankroll should you risk?",
            font_size=24, color=WHITE, line_spacing=1.35
        ).shift(UP * 0.9)

        wrong = VGroup(
            Text("Not all of it  →  one loss wipes you out",
                 font_size=20, color=RED),
            Text("Not as much as you feel  →  overbetting causes ruin",
                 font_size=20, color=RED),
            Text("Kelly gives the exact optimal fraction.",
                 font_size=20, color=TEAL, weight=BOLD),
        ).arrange(DOWN, buff=0.25, aligned_edge=LEFT).shift(DOWN * 0.6)

        with self.voiceover(
            "The Kelly Criterion answers one question: given a bet with known "
            "probabilities and payoffs, what fraction of your bankroll should you risk?"
        ) as tracker:
            self.play(FadeIn(question), run_time=1.0)
            self.wait(tracker.duration - 1.0)

        with self.voiceover(
            "The answer is counterintuitive — not as much as you think, "
            "and definitely not all of it. Today I'll give you the single-bet formula, "
            "the multi-asset extension, and the fractional Kelly approach "
            "used in real trading."
        ) as tracker:
            self.play(LaggedStart(*[FadeIn(w, shift=RIGHT * 0.2) for w in wrong],
                                  lag_ratio=0.4), run_time=1.2)
            self.wait(tracker.duration - 1.2)

        clear(self)

    # ── SCENE 3: SINGLE-BET FORMULA ───────────────────────────────────────────
    def _scene_formula(self):
        title = Text("Single-Bet Kelly Formula", font_size=30, color=GOLD)\
                   .to_edge(UP, buff=0.5)
        self.play(Write(title))

        formula = MathTex(
            r"f^* = p - \frac{q}{b}",
            font_size=68, color=GOLD
        ).shift(UP * 1.5)

        with self.voiceover(
            "The Kelly formula: f-star equals p minus q over b."
        ) as tracker:
            self.play(Write(formula), run_time=tracker.duration * 0.85)
            self.wait(tracker.duration * 0.15)

        # Term labels with braces
        brace_p = Brace(formula[0][3], DOWN, color=TEAL)
        lbl_p   = Text("p = probability of winning", font_size=18, color=TEAL)\
                     .next_to(brace_p, DOWN, buff=0.1)

        brace_q = Brace(formula[0][5], DOWN, color=RED)
        lbl_q   = Text("q = 1 – p  (prob. of losing)", font_size=18, color=RED)\
                     .next_to(brace_q, DOWN, buff=0.1)

        brace_b = Brace(formula[0][7], DOWN, color=BLUE)
        lbl_b   = Text("b = net odds per unit risked", font_size=18, color=BLUE)\
                     .next_to(brace_b, DOWN, buff=0.1)

        lbl_f   = VGroup(
            Text("f*", font_size=22, color=GOLD, weight=BOLD),
            Text("= fraction of bankroll to bet", font_size=18, color=WHITE),
        ).arrange(RIGHT, buff=0.2).to_edge(DOWN, buff=0.65)

        with self.voiceover(
            "p is the probability of winning. "
            "q equals one minus p — the probability of losing. "
            "b is the net odds: how much you win per unit risked."
        ) as tracker:
            self.play(Create(brace_p), FadeIn(lbl_p), run_time=0.8)
            self.play(Create(brace_q), FadeIn(lbl_q), run_time=0.8)
            self.play(Create(brace_b), FadeIn(lbl_b), run_time=0.8)
            self.wait(tracker.duration - 2.4)

        with self.voiceover(
            "f-star is the optimal fraction of your bankroll to bet each time. "
            "This single formula encodes the entire trade-off between "
            "edge, odds, and position sizing."
        ) as tracker:
            self.play(FadeIn(lbl_f), run_time=0.7)
            self.wait(tracker.duration - 0.7)

        clear(self)

    # ── SCENE 4: COIN FLIP EXAMPLE ────────────────────────────────────────────
    def _scene_example(self):
        title = Text("Concrete Example: 2:1 Coin Flip", font_size=28, color=GOLD)\
                   .to_edge(UP, buff=0.5)
        self.play(Write(title))

        setup = VGroup(
            Text("Fair coin — heads pays 2:1", font_size=22, color=WHITE),
            MathTex(r"p = 0.5 \quad q = 0.5 \quad b = 2",
                    font_size=28, color=GRAY),
        ).arrange(DOWN, buff=0.2).shift(UP * 1.6)

        calc = MathTex(
            r"f^* = 0.5 - \frac{0.5}{2} = 0.5 - 0.25 = \mathbf{0.25}",
            font_size=38, color=GOLD
        ).shift(UP * 0.5)
        answer = Text("Bet 25% of bankroll each flip.",
                      font_size=24, color=TEAL, weight=BOLD)\
                    .next_to(calc, DOWN, buff=0.35)

        with self.voiceover(
            "Concrete example: a fair coin where heads pays 2 to 1. "
            "p equals 0.5, q equals 0.5, b equals 2."
        ) as tracker:
            self.play(FadeIn(setup), run_time=1.0)
            self.wait(tracker.duration - 1.0)

        with self.voiceover(
            "Kelly says bet 25% of your bankroll each flip."
        ) as tracker:
            self.play(Write(calc), run_time=0.9)
            self.play(FadeIn(answer), run_time=0.6)
            self.wait(tracker.duration - 1.5)

        # Three options visual comparison
        options = VGroup(
            self._option_card("50%", "Feels right", RED,
                              "Losing streak\ncompounds ruinously"),
            self._option_card("25%", "Kelly optimal", TEAL,
                              "Maximum long-run\ngrowth rate"),
            self._option_card("100%", "All in", RED,
                              "One loss =\ntotal ruin"),
        ).arrange(RIGHT, buff=0.55).shift(DOWN * 1.3)

        with self.voiceover(
            "Not 50% — that feels right but a losing streak compounds ruinously. "
            "Not 100% — one loss wipes you out. "
            "25%, because the mathematics proves that is the exact fraction "
            "that maximises compound wealth over time."
        ) as tracker:
            self.play(FadeIn(options[0]), run_time=0.6)
            self.play(FadeIn(options[1]), run_time=0.6)
            self.play(FadeIn(options[2]), run_time=0.6)
            self.wait(tracker.duration - 1.8)

        clear(self)

    # ── SCENE 5: GEOMETRIC MEAN / LOG WEALTH ──────────────────────────────────
    def _scene_geomean(self):
        title = Text("Why Kelly Works — Maximising Log-Wealth", font_size=26, color=GOLD)\
                   .to_edge(UP, buff=0.5)
        self.play(Write(title))

        g_formula = MathTex(
            r"G(f) = p \cdot \ln(1 + f \cdot b) + q \cdot \ln(1 - f)",
            font_size=38, color=WHITE
        ).shift(UP * 1.8)
        cite = Text("Kelly (1956) · Bell System Technical Journal",
                    font_size=13, color=GRAY).next_to(g_formula, DOWN, buff=0.15)

        with self.voiceover(
            "Kelly maximises the geometric mean — the expected value of the "
            "logarithm of wealth. G of f equals p times log of one plus f-b, "
            "plus q times log of one minus f."
        ) as tracker:
            self.play(Write(g_formula), run_time=1.2)
            self.play(FadeIn(cite), run_time=0.5)
            self.wait(tracker.duration - 1.7)

        # Plot G(f) for the 2:1 coin
        axes = Axes(
            x_range=[0, 1.0, 0.2], y_range=[-1.2, 0.4, 0.2],
            x_length=8, y_length=3.6,
            axis_config={"color": GRAY, "include_numbers": False},
            tips=False
        ).shift(DOWN * 0.9)
        x_lbl = Text("Fraction bet  f", font_size=16, color=GRAY)\
                    .next_to(axes.x_axis.get_end(), RIGHT, buff=0.1)
        y_lbl = Text("G(f)", font_size=16, color=GRAY)\
                    .next_to(axes.y_axis.get_end(), UP, buff=0.08)
        self.play(Create(axes), Write(x_lbl), Write(y_lbl))

        def G(f):
            if f >= 1.0:
                return -10
            return 0.5 * np.log(1 + 2 * f) + 0.5 * np.log(1 - f)

        g_curve = axes.plot(G, x_range=[0.001, 0.99, 0.005],
                            color=TEAL, stroke_width=2.5)

        with self.voiceover(
            "Maximise G over f. The solution is f-star at 25%. "
            "Notice: G rises to a peak at Kelly, then falls steeply. "
            "Betting more than f-star produces lower geometric growth."
        ) as tracker:
            self.play(Create(g_curve), run_time=1.5)
            self.wait(tracker.duration - 1.5)

        # Mark Kelly peak and ruin zone
        kelly_x  = 0.25
        peak_pt  = axes.coords_to_point(kelly_x, G(kelly_x))
        peak_dot = Dot(peak_pt, color=GOLD, radius=0.12)
        peak_lbl = Text("f* = 0.25\n(maximum G)", font_size=16, color=GOLD)\
                       .next_to(peak_dot, UR, buff=0.1)

        ruin_area = axes.get_area(
            axes.plot(G, x_range=[0.5, 0.99, 0.005]),
            x_range=[0.5, 0.99], color=RED, opacity=0.25
        )
        ruin_lbl = Text("Overbetting zone\n→ lower growth, eventual ruin",
                        font_size=15, color=RED)\
                      .next_to(axes.coords_to_point(0.75, -0.5), DOWN, buff=0.1)

        with self.voiceover(
            "Paradoxically, overbetting makes you grow slower and eventually go to zero. "
            "This is the Kelly trap: a winning strategy played at twice Kelly "
            "will eventually ruin you."
        ) as tracker:
            self.play(FadeIn(peak_dot), Write(peak_lbl), run_time=0.8)
            self.play(FadeIn(ruin_area), Write(ruin_lbl), run_time=0.8)
            self.wait(tracker.duration - 1.6)

        clear(self)

    # ── SCENE 6: OVERBETTING TRAP — GROWTH CURVES ─────────────────────────────
    def _scene_overbetting_trap(self):
        title = Text("The Overbetting Trap — Growth Curves", font_size=28, color=GOLD)\
                   .to_edge(UP, buff=0.5)
        self.play(Write(title))

        axes = Axes(
            x_range=[0, 50, 10], y_range=[0, 5.0, 1],
            x_length=9.0, y_length=3.8,
            axis_config={"color": GRAY, "include_numbers": False},
            tips=False
        ).shift(DOWN * 0.7)
        x_lbl = Text("Number of bets", font_size=16, color=GRAY)\
                    .next_to(axes.x_axis.get_end(), RIGHT, buff=0.1)
        y_lbl = Text("Bankroll (×)", font_size=16, color=GRAY)\
                    .next_to(axes.y_axis.get_end(), UP, buff=0.08)
        self.play(Create(axes), Write(x_lbl), Write(y_lbl))

        configs = [
            (0.10, BLUE,  "f = 10%  (conservative)"),
            (0.25, TEAL,  "f = 25%  (full Kelly ✓)"),
            (0.50, GOLD,  "f = 50%  (2× Kelly)"),
            (0.75, RED,   "f = 75%  (reckless)"),
        ]

        legend_items = VGroup()
        for f, col, lbl_text in configs:
            data = self._simulate(f, seed=42, n=50, b=2.0)
            pts  = [axes.coords_to_point(i, min(data[i], 4.9)) for i in range(51)]
            line = VMobject(color=col, stroke_width=2.5)
            line.set_points_smoothly(pts)
            legend_items.add(
                VGroup(
                    Square(side_length=0.18, fill_color=col,
                           fill_opacity=0.9, stroke_width=0),
                    Text(lbl_text, font_size=15, color=col),
                ).arrange(RIGHT, buff=0.12)
            )

            with self.voiceover(
                [
                    "At 10% — well below Kelly — the bankroll grows slowly but safely.",
                    "At full Kelly — 25% — the bankroll compounds at the maximum "
                    "long-run growth rate.",
                    "At 50% — twice Kelly — growth is actually slower than full Kelly. "
                    "The extra risk is not compensated.",
                    "At 75% — reckless overbetting — the bankroll collapses toward zero. "
                    "A strategy with a 50% win rate, played at 75%, will eventually ruin you. "
                    "This is the Kelly trap.",
                ][configs.index((f, col, lbl_text))]
            ) as tracker:
                self.play(Create(line), run_time=min(tracker.duration * 0.7, 1.5))
                self.wait(tracker.duration - min(tracker.duration * 0.7, 1.5))

        legend_items.arrange(DOWN, aligned_edge=LEFT, buff=0.18)\
                    .to_corner(UR, buff=0.4)
        self.play(LaggedStart(*[FadeIn(l) for l in legend_items], lag_ratio=0.2),
                  run_time=0.8)
        self.wait(0.5)

        clear(self)

    # ── SCENE 7: MULTI-ASSET KELLY ────────────────────────────────────────────
    def _scene_multi_asset(self):
        title = Text("Multi-Asset Kelly", font_size=30, color=GOLD)\
                   .to_edge(UP, buff=0.5)
        self.play(Write(title))

        formula = MathTex(
            r"\mathbf{w}^* = \underset{\mathbf{w}}{\arg\max}\;"
            r"\mathbb{E}\!\left[\ln(1 + \mathbf{w}^\top \mathbf{r})\right]"
            r"\;\approx\; \Sigma^{-1}\boldsymbol{\mu}",
            font_size=34, color=WHITE
        ).shift(UP * 1.6)

        with self.voiceover(
            "For a portfolio of N assets, the multi-asset Kelly maximises the "
            "expected log return over all weight vectors w."
        ) as tracker:
            self.play(Write(formula), run_time=tracker.duration * 0.85)
            self.wait(tracker.duration * 0.15)

        convergence = VGroup(
            Text("In the Gaussian approximation:", font_size=19, color=GRAY),
            MathTex(r"\mathbf{w}^*_{\text{Kelly}} \propto \Sigma^{-1}\boldsymbol{\mu}",
                    font_size=32, color=TEAL),
            Text("= the Markowitz tangency portfolio!", font_size=22, color=GOLD,
                 weight=BOLD),
        ).arrange(DOWN, buff=0.25).shift(DOWN * 0.2)

        divergence = VGroup(
            Text("Where they diverge:", font_size=18, color=RED),
            Text("Fat-tailed returns  →  Kelly is more conservative than Markowitz",
                 font_size=17, color=WHITE),
            Text("(Kelly penalises tail losses via log utility; MVO does not)",
                 font_size=16, color=GRAY),
        ).arrange(DOWN, buff=0.15, aligned_edge=LEFT).to_edge(DOWN, buff=0.55)

        with self.voiceover(
            "In the Gaussian approximation, the optimal Kelly portfolio is "
            "proportional to the inverse covariance matrix times expected returns — "
            "identical to the Markowitz tangency portfolio. "
            "Kelly and Markowitz converge in the Gaussian world."
        ) as tracker:
            self.play(LaggedStart(*[FadeIn(c) for c in convergence], lag_ratio=0.4),
                      run_time=1.2)
            self.wait(tracker.duration - 1.2)

        with self.voiceover(
            "Where they diverge is in fat-tailed distributions, "
            "where Kelly is more conservative because log utility "
            "penalises extreme losses far more severely than mean-variance does."
        ) as tracker:
            self.play(LaggedStart(*[FadeIn(d) for d in divergence], lag_ratio=0.4),
                      run_time=1.0)
            self.wait(tracker.duration - 1.0)

        clear(self)

    # ── SCENE 8: FRACTIONAL KELLY ─────────────────────────────────────────────
    def _scene_fractional_kelly(self):
        title = Text("Fractional Kelly — The Practical Standard", font_size=26, color=GOLD)\
                   .to_edge(UP, buff=0.5)
        cite  = Text("Thorp (1969)  ·  MacLean, Thorp & Ziemba (2011)",
                     font_size=13, color=GRAY).next_to(title, DOWN, buff=0.1)
        self.play(Write(title), FadeIn(cite))

        sensitivity = VGroup(
            Text("Full Kelly is extremely sensitive to estimation error:",
                 font_size=19, color=RED),
            Text("10% overestimate of edge  →  you bet 2× the optimal amount",
                 font_size=18, color=WHITE),
        ).arrange(DOWN, buff=0.15, aligned_edge=LEFT).shift(UP * 1.4)

        with self.voiceover(
            "Full Kelly is extremely aggressive and highly sensitive to "
            "estimation errors in p and b. A 10% overestimate of edge can "
            "drive you to bet twice the optimal amount."
        ) as tracker:
            self.play(LaggedStart(*[FadeIn(s) for s in sensitivity], lag_ratio=0.4),
                      run_time=1.0)
            self.wait(tracker.duration - 1.0)

        # Comparison table
        rows_data = [
            ("Full Kelly   f*",    "100%",  "Maximum",  "Maximum",   GOLD),
            ("Half Kelly   f*/2",  "~75%",  "Moderate", "Much less", TEAL),
            ("Quarter Kelly f*/4", "~55%",  "Low",      "Minimal",   BLUE),
        ]
        headers = VGroup(
            Text("Strategy", font_size=16, color=GRAY, weight=BOLD),
            Text("Growth rate", font_size=16, color=GRAY, weight=BOLD),
            Text("Volatility", font_size=16, color=GRAY, weight=BOLD),
            Text("Max drawdown", font_size=16, color=GRAY, weight=BOLD),
        ).arrange(RIGHT, buff=0.55).shift(UP * 0.15)

        rows = VGroup()
        for strat, growth, vol, dd, col in rows_data:
            row = VGroup(
                Text(strat,  font_size=15, color=col),
                Text(growth, font_size=15, color=col),
                Text(vol,    font_size=15, color=WHITE),
                Text(dd,     font_size=15, color=WHITE),
            ).arrange(RIGHT, buff=0.55)
            rows.add(row)
        rows.arrange(DOWN, buff=0.25, aligned_edge=LEFT).next_to(headers, DOWN, buff=0.25)

        sep = Line(headers.get_left() + DOWN * 0.12,
                   headers.get_right() + DOWN * 0.12,
                   color=GRAY, stroke_width=1)

        pro_note = Text(
            "Half-Kelly:  ~75% of full-Kelly growth  ·  dramatically lower drawdowns\n"
            "The professional compromise between growth maximisation and risk control.",
            font_size=16, color=TEAL, line_spacing=1.3
        ).to_edge(DOWN, buff=0.5)

        with self.voiceover(
            "In practice, traders use fractional Kelly. "
            "Half Kelly gives you about 75% of the long-run growth rate of full Kelly "
            "with dramatically lower drawdowns and variance of outcomes."
        ) as tracker:
            self.play(FadeIn(headers), Create(sep), run_time=0.8)
            self.play(LaggedStart(*[FadeIn(r, shift=RIGHT * 0.2) for r in rows],
                                  lag_ratio=0.35), run_time=1.2)
            self.wait(tracker.duration - 2.0)

        with self.voiceover(
            "Half-Kelly is the professional compromise between growth maximisation "
            "and risk control. Never use more than full Kelly."
        ) as tracker:
            self.play(FadeIn(pro_note), run_time=0.8)
            self.wait(tracker.duration - 0.8)

        clear(self)

    # ── SCENE 9: DEFI YIELD ALLOCATION ────────────────────────────────────────
    def _scene_defi(self):
        title = Text("Kelly in DeFi Yield Allocation", font_size=28, color=GOLD)\
                   .to_edge(UP, buff=0.5)
        self.play(Write(title))

        defi_formula = MathTex(
            r"f^*_{\text{protocol}} \propto "
            r"\frac{\mu_{\text{yield}} - r_f}{\sigma^2_{\text{yield}}}",
            font_size=40, color=WHITE
        ).shift(UP * 1.5)
        desc = Text(
            "Higher-yielding, lower-variance protocols → larger allocation",
            font_size=19, color=TEAL
        ).next_to(defi_formula, DOWN, buff=0.3)

        with self.voiceover(
            "Applied to yield strategy selection: the Kelly fraction for each "
            "protocol allocation is proportional to expected yield minus the "
            "risk-free rate, divided by the variance of that yield. "
            "Higher-yielding, lower-variance protocols receive larger allocations."
        ) as tracker:
            self.play(Write(defi_formula), run_time=1.0)
            self.play(FadeIn(desc), run_time=0.7)
            self.wait(tracker.duration - 1.7)

        # Smart contract ruin risk warning
        ruin_box = VGroup(
            Text("Smart Contract Exploit Risk", font_size=20, color=RED, weight=BOLD),
            Text("A –100% event has log utility of  –∞  (total ruin)",
                 font_size=17, color=WHITE),
            MathTex(r"\ln(1 + (-1)) = \ln(0) = -\infty", font_size=28, color=RED),
            Text("Kelly fraction collapses to near-zero for uncapped exploit risk.",
                 font_size=17, color=GRAY),
            Text("Explicitly price smart contract risk before applying Kelly to DeFi.",
                 font_size=17, color=GOLD, weight=BOLD),
        ).arrange(DOWN, buff=0.18, aligned_edge=LEFT)\
         .add_background_rectangle(color="#1A0A0A", opacity=1, buff=0.22)\
         .to_edge(DOWN, buff=0.35)

        with self.voiceover(
            "Smart contract exploit risk dramatically reduces the Kelly fraction. "
            "A negative 100% event has a log utility of negative infinity — total ruin. "
            "The Kelly fraction collapses to near-zero for any protocol with "
            "uncapped exploit risk."
        ) as tracker:
            self.play(FadeIn(ruin_box), run_time=1.0)
            self.wait(tracker.duration - 1.0)

        with self.voiceover(
            "This is why you must explicitly price smart contract risk "
            "before applying Kelly to any DeFi yield allocation."
        ) as tracker:
            self.wait(tracker.duration)

        clear(self)

    # ── SCENE 10: TAKEAWAY ────────────────────────────────────────────────────
    def _scene_takeaway(self):
        title = Text("Takeaway", font_size=34, color=GOLD).to_edge(UP, buff=0.5)
        self.play(Write(title))

        items = [
            ("1.", "Kelly is the long-run optimal sizing formula —\n"
                   "but only when probability estimates are accurate.",   TEAL),
            ("2.", "Use half-Kelly in practice.\n"
                   "~75% of growth · far lower drawdowns.",               GOLD),
            ("3.", "Never use more than full Kelly.\n"
                   "Overbetting causes ruin even with positive edge.",     RED),
            ("4.", "Always add a hard stop — even if Kelly says 40%,\n"
                   "cap at your maximum acceptable single-position loss.", WHITE),
            ("5.", "For DeFi: price smart contract exploit risk first.\n"
                   "(Thorp 1969 · Chan 2009 · MacLean et al. 2011)",      GRAY),
        ]
        rows = VGroup()
        for num, text, col in items:
            row = VGroup(
                Text(num, font_size=20, color=col, weight=BOLD),
                Text(text, font_size=17, color=WHITE, line_spacing=1.2),
            ).arrange(RIGHT, buff=0.25, aligned_edge=UP)
            rows.add(row)
        rows.arrange(DOWN, buff=0.28, aligned_edge=LEFT)\
            .shift(DOWN * 0.15 + LEFT * 0.2)

        with self.voiceover(
            "Kelly is the long-run optimal sizing formula — but only when your "
            "probability estimates are accurate. Use half-Kelly in practice."
        ) as tracker:
            self.play(FadeIn(rows[0], shift=RIGHT * 0.2), run_time=0.6)
            self.play(FadeIn(rows[1], shift=RIGHT * 0.2), run_time=0.6)
            self.wait(tracker.duration - 1.2)

        with self.voiceover(
            "Never use more than full Kelly — overbetting causes ruin even with "
            "positive edge. Always add a hard stop: Kelly is a ceiling, not a mandate."
        ) as tracker:
            self.play(FadeIn(rows[2], shift=RIGHT * 0.2), run_time=0.6)
            self.play(FadeIn(rows[3], shift=RIGHT * 0.2), run_time=0.6)
            self.wait(tracker.duration - 1.2)

        with self.voiceover(
            "For DeFi: price smart contract exploit risk before applying Kelly. "
            "The formula is a ceiling, not a mandate."
        ) as tracker:
            self.play(FadeIn(rows[4], shift=RIGHT * 0.2), run_time=0.6)
            self.wait(tracker.duration - 0.6)

        clear(self)

    # ── SCENE 11: CTA ─────────────────────────────────────────────────────────
    def _scene_cta(self):
        with self.voiceover(
            "Next: Risk Parity — the portfolio construction method that ignores "
            "expected returns entirely and allocates purely based on risk contribution. "
            "Used by Bridgewater's All Weather fund. Subscribe. QuantiFire."
        ) as tracker:
            teaser = VGroup(
                Text("Next → EP08", font_size=24, color=GRAY),
                Text("Risk Parity", font_size=34, color=WHITE),
                Text("Why Bridgewater ignores expected returns", font_size=20, color=TEAL),
            ).arrange(DOWN, buff=0.3)
            outro = Text("QuantiFire  |  EP 07", font_size=32, color=GOLD)\
                       .to_edge(DOWN, buff=0.8)
            self.play(LaggedStart(*[FadeIn(t) for t in teaser], lag_ratio=0.4),
                      run_time=1.5)
            self.play(FadeIn(outro), run_time=0.6)
            self.wait(tracker.duration - 2.2)

    # ── HELPERS ───────────────────────────────────────────────────────────────
    @staticmethod
    def _simulate(f, seed, n=50, b=2.0):
        rng = np.random.default_rng(seed)
        br  = [1.0]
        for _ in range(n):
            win = rng.random() < 0.5
            br.append(br[-1] * ((1 + b * f) if win else (1 - f)))
        return np.clip(br, 1e-6, 20)

    @staticmethod
    def _option_card(fraction, label, color, note):
        box  = RoundedRectangle(width=3.2, height=2.6, corner_radius=0.18,
                                fill_color=color, fill_opacity=0.07,
                                stroke_color=color, stroke_width=1.5)
        frac = Text(fraction, font_size=36, color=color, weight=BOLD)\
                  .move_to(box).shift(UP * 0.55)
        lbl  = Text(label, font_size=17, color=color)\
                  .next_to(frac, DOWN, buff=0.15)
        nt   = Text(note, font_size=14, color=GRAY, line_spacing=1.2)\
                  .next_to(lbl, DOWN, buff=0.18)
        return VGroup(box, frac, lbl, nt)
