"""
QuantiFire EP09 — The Momentum Factor: Why Past Winners Keep Winning
Run: manim -pql ep09_momentum.py MomentumScene
Audio: AI voiceover via manim-voiceover
Sources:
  Jegadeesh & Titman (1993) JF 48(1) 65-91
  Carhart (1997) JF 52(1) 57-82
  Fama & French (1996) JF 51(1) 55-84
  Barroso & Santa-Clara (2015) JFE 116(1) 111-120
  Tulchinsky et al., Finding Alphas (Wiley, 2020)
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


def clear(scene):
    scene.play(*[FadeOut(m) for m in scene.mobjects], run_time=0.5)


class MomentumScene(VoiceoverScene):
    def construct(self):
        self.camera.background_color = BG
        self.set_speech_service(GTTSService(lang="en"))
        # PRODUCTION: self.set_speech_service(ElevenLabsService(...))

        self._scene_hook()
        self._scene_context()
        self._scene_signal()
        self._scene_rank_chart()
        self._scene_why_underreaction()
        self._scene_why_overreaction()
        self._scene_why_risk()
        self._scene_crash()
        self._scene_vol_scaling()
        self._scene_defi()
        self._scene_takeaway()
        self._scene_cta()

    # ── 1. HOOK ────────────────────────────────────────────────────────────────
    def _scene_hook(self):
        title = Text("The Momentum Factor", font_size=44, color=GOLD).to_edge(UP, buff=0.5)
        sub   = Text("Why Past Winners Keep Winning", font_size=26, color=WHITE)\
                  .next_to(title, DOWN, buff=0.2)

        disclaimer = Text(
            "Every finance textbook says: past performance doesn't predict future results.",
            font_size=22, color=WHITE
        ).shift(UP * 0.6)

        anomaly = Text(
            "And yet — stocks that outperformed over the past 3–12 months\ncontinue to outperform next month.",
            font_size=22, color=TEAL, t2c={"3–12 months": GOLD, "outperform": GOLD}
        ).next_to(disclaimer, DOWN, buff=0.4)

        stat = Text("200+ years of data. Nearly every asset class.", font_size=20, color=GRAY)\
                 .next_to(anomaly, DOWN, buff=0.35)

        with self.voiceover(
            "Every finance textbook will tell you past performance doesn't predict future results."
        ) as tracker:
            self.play(Write(title), run_time=1.0)
            self.play(FadeIn(sub), run_time=0.6)
            self.play(Write(disclaimer), run_time=1.2)
            self.wait(tracker.duration - 2.8)

        with self.voiceover(
            "And yet one of the most replicated findings in all of academic finance is this: "
            "stocks that performed best over the past 3 to 12 months continue to outperform "
            "over the next month."
        ) as tracker:
            self.play(FadeIn(anomaly, shift=UP * 0.2), run_time=1.2)
            self.wait(tracker.duration - 1.2)

        with self.voiceover(
            "This anomaly has persisted for over 200 years of data across nearly every asset "
            "class. Today, we break down exactly how it works."
        ) as tracker:
            self.play(FadeIn(stat), run_time=0.8)
            self.wait(tracker.duration - 0.8)

        clear(self)

    # ── 2. CONTEXT ─────────────────────────────────────────────────────────────
    def _scene_context(self):
        title = Text("Context & Discovery", font_size=36, color=GOLD).to_edge(UP, buff=0.5)

        timeline = VGroup(
            self._timeline_row("1993", "Jegadeesh & Titman",
                               "Formally document cross-sectional\nmomentum in US equities", TEAL),
            self._timeline_row("1997", "Carhart",
                               "Adds MOM as the 4th factor;\nWML captures 0.7–1.2%/mo", BLUE),
            self._timeline_row("1996", "Fama & French",
                               "Multifactor explanations —\nmomentum survives all controls", GOLD),
            self._timeline_row("2015", "Barroso & Santa-Clara",
                               "Volatility-scaled momentum\nrecovers Sharpe from crashes", RED),
        ).arrange(DOWN, buff=0.35).next_to(title, DOWN, buff=0.5)

        sources_box = self._sources_box([
            "Jegadeesh & Titman (1993) JF 48(1)",
            "Carhart (1997) JF 52(1)",
            "Fama & French (1996) JF 51(1)",
            "Barroso & Santa-Clara (2015) JFE 116(1)",
        ])

        with self.voiceover("Welcome to QuantiFire.") as tracker:
            self.play(Write(title), run_time=0.8)
            self.wait(tracker.duration - 0.8)

        with self.voiceover(
            "Momentum was formally documented by Jegadeesh and Titman in their landmark 1993 paper, "
            "Returns to Buying Winners and Selling Losers."
        ) as tracker:
            self.play(FadeIn(timeline[0], shift=RIGHT * 0.3), run_time=0.8)
            self.wait(tracker.duration - 0.8)

        with self.voiceover(
            "Carhart added it as a fourth factor in 1997, showing winners minus losers captures "
            "0.7 to 1.2 percent per month. Fama and French confirmed momentum survives all controls."
        ) as tracker:
            self.play(FadeIn(timeline[1], shift=RIGHT * 0.3), run_time=0.6)
            self.play(FadeIn(timeline[2], shift=RIGHT * 0.3), run_time=0.6)
            self.wait(tracker.duration - 1.2)

        with self.voiceover(
            "Momentum has since been documented in international equities, bonds, commodities, "
            "currencies, and — as we will see — DeFi protocols."
        ) as tracker:
            self.play(FadeIn(timeline[3], shift=RIGHT * 0.3), run_time=0.6)
            self.play(FadeIn(sources_box), run_time=0.6)
            self.wait(tracker.duration - 1.2)

        clear(self)

    # ── 3. SIGNAL CONSTRUCTION ─────────────────────────────────────────────────
    def _scene_signal(self):
        title = Text("The Signal — MOM Construction", font_size=34, color=GOLD)\
                  .to_edge(UP, buff=0.5)

        formula = MathTex(
            r"\text{MOM}_i", r"=", r"R_i(t{-}12,\; t{-}1)",
            font_size=52, color=TEAL
        ).shift(UP * 1.4)

        brace_mom = Brace(formula[0], DOWN, color=TEAL)
        lbl_mom   = Text("momentum\nscore", font_size=18, color=TEAL)\
                      .next_to(brace_mom, DOWN, buff=0.1)

        brace_ret = Brace(formula[2], DOWN, color=GOLD)
        lbl_ret   = Text("trailing 12-month return\nexcluding last month", font_size=18, color=GOLD)\
                      .next_to(brace_ret, DOWN, buff=0.1)

        skip_box = RoundedRectangle(
            width=7.5, height=1.2, corner_radius=0.15,
            fill_color=RED, fill_opacity=0.08,
            stroke_color=RED, stroke_width=1.5
        ).shift(DOWN * 1.7)
        skip_txt = Text(
            "Skip month (t−1): short-term reversal contaminates the signal",
            font_size=20, color=RED
        ).move_to(skip_box)

        steps = VGroup(
            Text("① Compute MOM_i for every asset", font_size=20, color=WHITE),
            Text("② Rank all assets by MOM_i score", font_size=20, color=WHITE),
            Text("③ Long top decile (winners) · Short bottom decile (losers)", font_size=20, color=TEAL),
            Text("④ Rebalance monthly", font_size=20, color=GRAY),
        ).arrange(DOWN, buff=0.22, aligned_edge=LEFT).shift(DOWN * 0.2)

        with self.voiceover(
            "The standard cross-sectional momentum signal: MOM-i equals the trailing 12-month "
            "return for asset i, excluding the most recent month."
        ) as tracker:
            self.play(Write(title), run_time=0.8)
            self.play(Write(formula), run_time=1.2)
            self.wait(tracker.duration - 2.0)

        with self.voiceover(
            "The momentum score labels the left side. The right side is the 12-month return "
            "window, running from month t-minus-12 to t-minus-1."
        ) as tracker:
            self.play(Create(brace_mom), FadeIn(lbl_mom), run_time=0.8)
            self.play(Create(brace_ret), FadeIn(lbl_ret), run_time=0.8)
            self.wait(tracker.duration - 1.6)

        with self.voiceover(
            "Why skip the last month? Short-term reversal is documented separately and "
            "contaminates the momentum signal. Skipping t-minus-1 removes this noise."
        ) as tracker:
            self.play(Create(skip_box), Write(skip_txt), run_time=1.0)
            self.wait(tracker.duration - 1.0)

        with self.voiceover(
            "Implementation: compute the score for every asset, rank them all, go long the "
            "top decile — the winners — short the bottom decile — the losers — and rebalance monthly."
        ) as tracker:
            self.play(FadeOut(formula, brace_mom, lbl_mom, brace_ret, lbl_ret, skip_box, skip_txt),
                      run_time=0.4)
            for step in steps:
                self.play(FadeIn(step, shift=RIGHT * 0.2), run_time=0.5)
            self.wait(tracker.duration - 2.0 - 0.4)

        clear(self)

    # ── 4. RANK BAR CHART ──────────────────────────────────────────────────────
    def _scene_rank_chart(self):
        title = Text("Ranking Assets by Momentum Score", font_size=32, color=GOLD)\
                  .to_edge(UP, buff=0.5)

        assets = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]
        mom    = [0.62, 0.45, 0.38, 0.20, 0.10, -0.05, -0.18, -0.30, -0.44, -0.55]
        colors = [TEAL if m > 0 else RED for m in mom]

        axes = Axes(
            x_range=[-0.5, 9.5, 1], y_range=[-0.75, 0.80, 0.25],
            x_length=9.5, y_length=4.5,
            axis_config={"color": GRAY, "include_numbers": False},
            tips=False
        ).shift(DOWN * 0.35)

        bars, lbls = VGroup(), VGroup()
        for i, (name, m, col) in enumerate(zip(assets, mom, colors)):
            x0 = axes.coords_to_point(i, 0)
            x1 = axes.coords_to_point(i, m)
            bar = Rectangle(
                width=0.65,
                height=abs(x1[1] - x0[1]),
                fill_color=col, fill_opacity=0.85, stroke_width=0
            ).move_to([(x0[0] + x1[0]) / 2, (x0[1] + x1[1]) / 2, 0])
            lbl = Text(name, font_size=20, color=col)\
                    .next_to(axes.coords_to_point(i, 0), DOWN, buff=0.1)
            bars.add(bar)
            lbls.add(lbl)

        long_bracket  = Brace(VGroup(*[bars[i] for i in range(3)]), UP, color=TEAL)
        long_text     = Text("LONG  (top 30%)", font_size=18, color=TEAL)\
                          .next_to(long_bracket, UP, buff=0.1)
        short_bracket = Brace(VGroup(*[bars[i] for i in range(7, 10)]), DOWN, color=RED)
        short_text    = Text("SHORT  (bottom 30%)", font_size=18, color=RED)\
                          .next_to(short_bracket, DOWN, buff=0.1)

        wml_note = Text("WML = Winners Minus Losers ≈ 0.7–1.2%/month  (Carhart 1997)",
                        font_size=17, color=GOLD).to_edge(DOWN, buff=0.3)

        with self.voiceover(
            "Here are ten assets ranked by their trailing 12-month return. Green bars are "
            "positive momentum — these are the winners. Red bars are the losers."
        ) as tracker:
            self.play(Write(title), Create(axes), run_time=1.0)
            self.play(
                LaggedStart(*[GrowFromEdge(b, DOWN if m > 0 else UP)
                              for b, m in zip(bars, mom)], lag_ratio=0.08),
                LaggedStart(*[Write(l) for l in lbls], lag_ratio=0.08),
                run_time=1.5
            )
            self.wait(tracker.duration - 2.5)

        with self.voiceover(
            "We go long the top three — assets A, B, and C — and short the bottom three, "
            "H through J. The Carhart WML factor captures this spread: 0.7 to 1.2 percent "
            "per month in the original US data before transaction costs."
        ) as tracker:
            self.play(Create(long_bracket), Write(long_text), run_time=0.8)
            self.play(Create(short_bracket), Write(short_text), run_time=0.8)
            self.play(FadeIn(wml_note), run_time=0.6)
            self.wait(tracker.duration - 2.2)

        clear(self)

    # ── 5. WHY — UNDERREACTION ─────────────────────────────────────────────────
    def _scene_why_underreaction(self):
        title = Text("Why Does Momentum Exist? (1/3)", font_size=32, color=GOLD)\
                  .to_edge(UP, buff=0.5)

        heading = Text("Behavioral: Underreaction", font_size=28, color=TEAL)\
                    .next_to(title, DOWN, buff=0.4)

        explanation = VGroup(
            Text("Good news hits a stock.", font_size=22, color=WHITE),
            Text("Investors update beliefs slowly — gradual price response.", font_size=22, color=WHITE),
            Text("Momentum trade harvests the delayed price incorporation.", font_size=22, color=TEAL),
        ).arrange(DOWN, buff=0.3, aligned_edge=LEFT).shift(DOWN * 0.3)

        # Simple arrow diagram showing gradual price rise
        ax = Axes(
            x_range=[0, 10, 1], y_range=[95, 115, 5],
            x_length=6, y_length=3,
            axis_config={"color": GRAY, "include_numbers": False},
            tips=False
        ).shift(DOWN * 1.4)

        def fair_val(x):
            return 105 + 0 * x  # flat fair value

        def delayed_price(x):
            return 95 + 12 * (1 - np.exp(-0.5 * x))  # gradual convergence

        fair_curve  = ax.plot(fair_val,    x_range=[0, 10], color=GOLD,    stroke_width=2)
        price_curve = ax.plot(delayed_price, x_range=[0, 10], color=TEAL, stroke_width=2.5)
        fair_lbl    = Text("Fair value", font_size=16, color=GOLD)\
                        .next_to(ax.coords_to_point(9.5, 105), RIGHT, buff=0.1)
        price_lbl   = Text("Market price", font_size=16, color=TEAL)\
                        .next_to(ax.coords_to_point(9, delayed_price(9)), RIGHT, buff=0.1)
        news_arrow  = Arrow(
            start=ax.coords_to_point(0, 96),
            end=ax.coords_to_point(0, 104),
            color=RED, buff=0, stroke_width=2
        )
        news_lbl = Text("News!", font_size=16, color=RED).next_to(news_arrow, LEFT, buff=0.1)

        with self.voiceover(
            "First explanation: behavioral underreaction. Investors are slow to update their "
            "beliefs when good news arrives for a company."
        ) as tracker:
            self.play(Write(title), Write(heading), run_time=1.0)
            self.play(FadeIn(explanation[0]), run_time=0.6)
            self.wait(tracker.duration - 1.6)

        with self.voiceover(
            "The price response to that news is gradual rather than immediate — good news gets "
            "incorporated over weeks and months, not in a single day."
        ) as tracker:
            self.play(FadeIn(explanation[1]), run_time=0.5)
            self.play(Create(ax), run_time=0.5)
            self.play(Create(fair_curve), FadeIn(fair_lbl), run_time=0.5)
            self.play(FadeIn(news_arrow), FadeIn(news_lbl), run_time=0.4)
            self.play(Create(price_curve), FadeIn(price_lbl), run_time=1.2)
            self.wait(tracker.duration - 3.1)

        with self.voiceover(
            "The momentum trade harvests this delayed price response. Evidence: momentum profits "
            "are highest in stocks with high analyst forecast dispersion — exactly where information "
            "is most contested and slowest to incorporate."
        ) as tracker:
            self.play(FadeIn(explanation[2], shift=UP * 0.1), run_time=0.6)
            self.wait(tracker.duration - 0.6)

        clear(self)

    # ── 6. WHY — OVERREACTION ──────────────────────────────────────────────────
    def _scene_why_overreaction(self):
        title = Text("Why Does Momentum Exist? (2/3)", font_size=32, color=GOLD)\
                  .to_edge(UP, buff=0.5)

        heading = Text("Behavioral: Overreaction Cascade", font_size=28, color=BLUE)\
                    .next_to(title, DOWN, buff=0.4)

        steps = VGroup(
            Text("① Past winner attracts media attention", font_size=21, color=WHITE),
            Text("② Retail flows chase performance", font_size=21, color=WHITE),
            Text("③ Self-reinforcing trend forms", font_size=21, color=BLUE),
            Text("④ Eventually overcorrects → reversal", font_size=21, color=RED),
        ).arrange(DOWN, buff=0.32, aligned_edge=LEFT).shift(DOWN * 0.5)

        evidence_box = RoundedRectangle(
            width=8.5, height=1.0, corner_radius=0.12,
            fill_color=BLUE, fill_opacity=0.08,
            stroke_color=BLUE, stroke_width=1.5
        ).to_edge(DOWN, buff=0.3)
        evidence_txt = Text(
            "Evidence: momentum profits lower in large liquid caps (fast information) — "
            "Fama & French (1996)",
            font_size=17, color=BLUE
        ).move_to(evidence_box)

        with self.voiceover(
            "Second explanation: the overreaction cascade. Past winners attract attention — "
            "media coverage, analyst upgrades, retail interest."
        ) as tracker:
            self.play(Write(title), Write(heading), run_time=1.0)
            self.play(FadeIn(steps[0], shift=RIGHT * 0.2), run_time=0.5)
            self.play(FadeIn(steps[1], shift=RIGHT * 0.2), run_time=0.5)
            self.wait(tracker.duration - 2.0)

        with self.voiceover(
            "Retail performance-chasing flows pile in, creating a self-reinforcing trend. "
            "The trend continues until it overcorrects and produces eventual reversal."
        ) as tracker:
            self.play(FadeIn(steps[2], shift=RIGHT * 0.2), run_time=0.5)
            self.play(FadeIn(steps[3], shift=RIGHT * 0.2), run_time=0.5)
            self.wait(tracker.duration - 1.0)

        with self.voiceover(
            "Supporting evidence: momentum profits are lower in highly liquid large caps, "
            "where information incorporates faster and performance-chasing has less impact."
        ) as tracker:
            self.play(Create(evidence_box), Write(evidence_txt), run_time=1.0)
            self.wait(tracker.duration - 1.0)

        clear(self)

    # ── 7. WHY — RISK-BASED ────────────────────────────────────────────────────
    def _scene_why_risk(self):
        title = Text("Why Does Momentum Exist? (3/3)", font_size=32, color=GOLD)\
                  .to_edge(UP, buff=0.5)

        heading = Text("Risk-Based: Time-Varying Risk Premium", font_size=26, color=GOLD)\
                    .next_to(title, DOWN, buff=0.4)

        logic = VGroup(
            Text("Winners in good times → high economic-cycle exposure", font_size=21, color=WHITE),
            Text("When cycle turns → momentum strategies crash catastrophically", font_size=21, color=RED),
            Text("The premium compensates for bearing this crash risk", font_size=21, color=GOLD),
        ).arrange(DOWN, buff=0.32, aligned_edge=LEFT).shift(DOWN * 0.3)

        verdict = RoundedRectangle(
            width=9.0, height=1.1, corner_radius=0.12,
            fill_color=TEAL, fill_opacity=0.08,
            stroke_color=TEAL, stroke_width=1.5
        ).shift(DOWN * 2.2)
        verdict_txt = Text(
            "Verdict: Behavioral explanations dominate the evidence",
            font_size=21, color=TEAL
        ).move_to(verdict)

        with self.voiceover(
            "Third explanation: risk-based. Winners during good economic times load heavily on "
            "the economic cycle."
        ) as tracker:
            self.play(Write(title), Write(heading), run_time=1.0)
            self.play(FadeIn(logic[0], shift=RIGHT * 0.2), run_time=0.6)
            self.wait(tracker.duration - 1.6)

        with self.voiceover(
            "When the cycle turns — as in 2009 — momentum strategies crash spectacularly "
            "as prior losers explode upward. The premium supposedly compensates for bearing "
            "this crash risk."
        ) as tracker:
            self.play(FadeIn(logic[1], shift=RIGHT * 0.2), run_time=0.6)
            self.play(FadeIn(logic[2], shift=RIGHT * 0.2), run_time=0.6)
            self.wait(tracker.duration - 1.2)

        with self.voiceover(
            "Overall verdict: the behavioral explanation is strongest. Momentum profits are "
            "higher in markets with weaker institutional participation — exactly where behavioral "
            "biases dominate."
        ) as tracker:
            self.play(Create(verdict), Write(verdict_txt), run_time=0.8)
            self.wait(tracker.duration - 0.8)

        clear(self)

    # ── 8. MOMENTUM CRASH ─────────────────────────────────────────────────────
    def _scene_crash(self):
        title = Text("The Momentum Crash", font_size=36, color=RED).to_edge(UP, buff=0.5)

        # Simulated drawdown chart
        rng = np.random.default_rng(42)
        t = np.linspace(0, 12, 120)
        # Pre-crash: steady gains up to t=6; crash from t=6 to t=8; recovery
        pre  = np.cumsum(rng.normal(0.8, 1.2, 60)) + 50
        crash_vals = np.array([pre[-1] - (pre[-1] - pre[-1] * 0.35) * (i / 20) for i in range(20)])
        post = crash_vals[-1] + np.cumsum(rng.normal(0.3, 1.0, 40))
        series = np.concatenate([pre, crash_vals, post])
        series = series / series[0] * 100  # index to 100

        ax = Axes(
            x_range=[0, 120, 20], y_range=[60, 165, 20],
            x_length=8.5, y_length=4.0,
            axis_config={"color": GRAY, "include_numbers": False},
            tips=False
        ).shift(DOWN * 0.7)

        curve_pts = [ax.coords_to_point(i, v) for i, v in enumerate(series)]
        curve_pre   = VMobject().set_points_smoothly(curve_pts[:60]).set_color(TEAL).set_stroke(width=2)
        curve_crash = VMobject().set_points_smoothly(curve_pts[59:80]).set_color(RED).set_stroke(width=2.5)
        curve_post  = VMobject().set_points_smoothly(curve_pts[79:]).set_color(GOLD).set_stroke(width=2)

        crash_label = Text("March 2009\nMomentum −50 to −75%", font_size=18, color=RED)\
                        .next_to(ax.coords_to_point(72, series[72]), DR, buff=0.15)
        crash_arrow = Arrow(
            start=crash_label.get_top() + UP * 0.1,
            end=ax.coords_to_point(68, series[68]),
            color=RED, buff=0.05, stroke_width=2
        )

        explanation = Text(
            "Prior losers (beaten-down financials) gained 200–300% in weeks.\n"
            "Prior winners (defensives) lagged. Momentum lost in two months.",
            font_size=19, color=WHITE
        ).to_edge(DOWN, buff=0.3)

        with self.voiceover(
            "Momentum's Achilles heel. In sharp market reversals — particularly after prolonged "
            "crashes followed by sudden recovery — momentum strategies can lose catastrophically."
        ) as tracker:
            self.play(Write(title), Create(ax), run_time=1.0)
            self.play(Create(curve_pre), run_time=1.2)
            self.wait(tracker.duration - 2.2)

        with self.voiceover(
            "March 2009: the bottom of the financial crisis. Prior 12-month losers — beaten-down "
            "financials — exploded upward 200 to 300 percent in weeks."
        ) as tracker:
            self.play(Create(curve_crash), run_time=0.8)
            self.play(FadeIn(crash_label), Create(crash_arrow), run_time=0.6)
            self.wait(tracker.duration - 1.4)

        with self.voiceover(
            "Prior 12-month winners — defensive stocks — lagged badly. Momentum strategies "
            "lost 50 to 75 percent in just two months."
        ) as tracker:
            self.play(Create(curve_post), run_time=0.8)
            self.play(FadeIn(explanation), run_time=0.6)
            self.wait(tracker.duration - 1.4)

        clear(self)

    # ── 9. VOLATILITY SCALING ─────────────────────────────────────────────────
    def _scene_vol_scaling(self):
        title = Text("Mitigation: Volatility-Scaled Momentum", font_size=32, color=GOLD)\
                  .to_edge(UP, buff=0.5)

        formula = MathTex(
            r"\text{signal\_scaled}_i",
            r"=",
            r"\frac{\text{MOM}_i}{\sigma_i^{(1\text{-month})}}",
            font_size=48, color=TEAL
        ).shift(UP * 1.2)

        brace_sig = Brace(formula[2], DOWN, color=GOLD)
        lbl_sig   = Text("1-month realized\nvolatility of asset i", font_size=18, color=GOLD)\
                      .next_to(brace_sig, DOWN, buff=0.1)

        intuition = VGroup(
            Text("High volatility period  →  smaller position size", font_size=21, color=WHITE),
            Text("Low volatility period   →  larger position size", font_size=21, color=WHITE),
            Text("Crash risk is highest when recent volatility is high", font_size=21, color=RED),
        ).arrange(DOWN, buff=0.28, aligned_edge=LEFT).shift(DOWN * 1.2)

        result_box = RoundedRectangle(
            width=9.0, height=1.0, corner_radius=0.12,
            fill_color=TEAL, fill_opacity=0.08,
            stroke_color=TEAL, stroke_width=1.5
        ).to_edge(DOWN, buff=0.3)
        result_txt = Text(
            "Empirically: vol scaling recovers most of the Sharpe lost to crashes  (Barroso & Santa-Clara 2015)",
            font_size=17, color=TEAL
        ).move_to(result_box)

        with self.voiceover(
            "The mitigation: volatility-scaled momentum. Instead of equal-weight long-short, "
            "scale each position by its inverse 1-month realized volatility."
        ) as tracker:
            self.play(Write(title), run_time=0.8)
            self.play(Write(formula), run_time=1.2)
            self.play(Create(brace_sig), FadeIn(lbl_sig), run_time=0.7)
            self.wait(tracker.duration - 2.7)

        with self.voiceover(
            "During turbulent periods — when crash risk is highest — recent volatility is "
            "elevated, so the scaled signal automatically reduces position sizes."
        ) as tracker:
            self.play(FadeIn(intuition[0]), run_time=0.5)
            self.play(FadeIn(intuition[1]), run_time=0.5)
            self.play(FadeIn(intuition[2]), run_time=0.5)
            self.wait(tracker.duration - 1.5)

        with self.voiceover(
            "Empirically, Barroso and Santa-Clara show that volatility scaling recovers most "
            "of the Sharpe ratio lost to momentum crashes."
        ) as tracker:
            self.play(Create(result_box), Write(result_txt), run_time=0.8)
            self.wait(tracker.duration - 0.8)

        clear(self)

    # ── 10. DEFI MOMENTUM ─────────────────────────────────────────────────────
    def _scene_defi(self):
        title = Text("Momentum in DeFi", font_size=36, color=GOLD).to_edge(UP, buff=0.5)

        signals = VGroup(
            self._signal_card(
                "TVL Momentum",
                "30/90-day TVL growth rate per protocol",
                "Underreaction to adoption signals",
                TEAL
            ),
            self._signal_card(
                "Token Price Momentum",
                "12-1 month trailing return, ranked cross-protocol",
                "Top-decile governance tokens outperform in bull markets",
                BLUE
            ),
            self._signal_card(
                "Revenue Momentum",
                "90-day fee revenue acceleration",
                "Growing fees → more users → reinforcing growth",
                GOLD
            ),
        ).arrange(DOWN, buff=0.35).next_to(title, DOWN, buff=0.45)

        data_note = Text(
            "Data sources: DeFiLlama · Dune Analytics · TheGraph",
            font_size=17, color=GRAY
        ).to_edge(DOWN, buff=0.3)

        with self.voiceover(
            "On-chain momentum works. TVL momentum: protocols gaining total value locked over "
            "the past 30 to 90 days continue to attract capital — an underreaction to protocol "
            "adoption signals."
        ) as tracker:
            self.play(Write(title), run_time=0.8)
            self.play(FadeIn(signals[0], shift=RIGHT * 0.3), run_time=0.7)
            self.wait(tracker.duration - 1.5)

        with self.voiceover(
            "Token price momentum: rank governance tokens cross-protocol by trailing 12-1 month "
            "return. Top-decile tokens outperform in bull markets."
        ) as tracker:
            self.play(FadeIn(signals[1], shift=RIGHT * 0.3), run_time=0.7)
            self.wait(tracker.duration - 0.7)

        with self.voiceover(
            "Revenue momentum: protocols with growing fee revenue attract more users, reinforcing "
            "the growth signal. All three are implementable with on-chain data from DeFiLlama, "
            "Dune Analytics, or TheGraph."
        ) as tracker:
            self.play(FadeIn(signals[2], shift=RIGHT * 0.3), run_time=0.7)
            self.play(FadeIn(data_note), run_time=0.5)
            self.wait(tracker.duration - 1.2)

        clear(self)

    # ── 11. TAKEAWAY ──────────────────────────────────────────────────────────
    def _scene_takeaway(self):
        title = Text("Takeaway", font_size=38, color=GOLD).to_edge(UP, buff=0.5)

        rules = [
            ("12-1 month lookback",       "skip the most recent month — avoids reversal contamination",  TEAL),
            ("Volatility-scale positions","reduce size when 1-month vol is elevated",                     TEAL),
            ("Crash risk plan",           "go flat when trailing market vol > 25% annualised",            RED),
            ("Factor allocation",         "momentum works in size, not in timing — not a timing tool",    GOLD),
            ("On-chain applies",          "TVL, price, revenue momentum all harvestable with Dune data",  BLUE),
        ]

        rule_group = VGroup()
        for i, (rule, detail, col) in enumerate(rules):
            box = RoundedRectangle(
                width=10.5, height=0.85, corner_radius=0.12,
                fill_color=col, fill_opacity=0.07,
                stroke_color=col, stroke_width=1.2
            )
            r_txt = Text(rule, font_size=19, color=col)\
                      .move_to(box).shift(LEFT * 3.2)
            d_txt = Text(detail, font_size=17, color=WHITE)\
                      .move_to(box).shift(RIGHT * 1.5)
            rule_group.add(VGroup(box, r_txt, d_txt))

        rule_group.arrange(DOWN, buff=0.22).next_to(title, DOWN, buff=0.45)

        cite = Text(
            "Jegadeesh & Titman (1993) · Carhart (1997) · Barroso & Santa-Clara (2015)",
            font_size=15, color=GRAY
        ).to_edge(DOWN, buff=0.2)

        with self.voiceover(
            "Momentum is real, persistent, and harvestable. Rule one: use 12-1 month lookback "
            "and always skip the most recent month."
        ) as tracker:
            self.play(Write(title), run_time=0.8)
            self.play(FadeIn(rule_group[0], shift=RIGHT * 0.2), run_time=0.5)
            self.wait(tracker.duration - 1.3)

        with self.voiceover(
            "Rule two: volatility-scale your positions — reduce size when 1-month volatility "
            "is elevated. Rule three: have a crash risk plan — go flat when trailing market "
            "volatility exceeds 25 percent annualised."
        ) as tracker:
            self.play(FadeIn(rule_group[1], shift=RIGHT * 0.2), run_time=0.4)
            self.play(FadeIn(rule_group[2], shift=RIGHT * 0.2), run_time=0.4)
            self.wait(tracker.duration - 0.8)

        with self.voiceover(
            "Rule four: treat momentum as a factor allocation, not a trading strategy — it "
            "works in size, not in timing. Rule five: DeFi momentum is implementable with "
            "on-chain data today."
        ) as tracker:
            self.play(FadeIn(rule_group[3], shift=RIGHT * 0.2), run_time=0.4)
            self.play(FadeIn(rule_group[4], shift=RIGHT * 0.2), run_time=0.4)
            self.play(FadeIn(cite), run_time=0.5)
            self.wait(tracker.duration - 1.3)

        clear(self)

    # ── 12. CTA ───────────────────────────────────────────────────────────────
    def _scene_cta(self):
        outro = Text("QuantiFire  |  EP 09", font_size=30, color=GOLD).shift(UP * 0.4)
        next_ep = Text(
            "Next: EP 10 — Hierarchical Risk Parity\nBetter portfolios through clustering",
            font_size=22, color=WHITE
        ).next_to(outro, DOWN, buff=0.4)
        sub = Text("Subscribe · QuantiFire", font_size=20, color=GRAY)\
                .next_to(next_ep, DOWN, buff=0.4)

        with self.voiceover(
            "Final episode of Series 1 next: Hierarchical Risk Parity — a modern portfolio "
            "construction method that replaces the covariance matrix optimizer with a machine "
            "learning clustering algorithm. Subscribe. QuantiFire."
        ) as tracker:
            self.play(FadeIn(outro), run_time=0.6)
            self.play(FadeIn(next_ep), run_time=0.6)
            self.play(FadeIn(sub), run_time=0.5)
            self.wait(tracker.duration - 1.7)

    # ── HELPERS ───────────────────────────────────────────────────────────────
    def _timeline_row(self, year, author, description, color):
        year_t = Text(year, font_size=22, color=color, weight=BOLD)
        auth_t = Text(author, font_size=20, color=color)
        desc_t = Text(description, font_size=17, color=WHITE)
        row    = VGroup(year_t, auth_t, desc_t).arrange(RIGHT, buff=0.5)
        line   = Line(LEFT * 5.5, RIGHT * 5.5, color=color, stroke_width=0.5)\
                   .next_to(row, DOWN, buff=0.1)
        return VGroup(row, line)

    def _sources_box(self, sources):
        lines = [Text(s, font_size=14, color=GRAY) for s in sources]
        group = VGroup(*lines).arrange(DOWN, buff=0.12, aligned_edge=LEFT)
        box   = SurroundingRectangle(group, color=GRAY, buff=0.15, corner_radius=0.1)
        return VGroup(box, group).to_edge(DOWN, buff=0.25)

    def _signal_card(self, name, mechanic, insight, color):
        box    = RoundedRectangle(
            width=10.5, height=1.3, corner_radius=0.15,
            fill_color=color, fill_opacity=0.08,
            stroke_color=color, stroke_width=1.5
        )
        nm_t   = Text(name, font_size=20, color=color, weight=BOLD)\
                   .move_to(box).align_to(box, LEFT).shift(RIGHT * 0.25 + UP * 0.25)
        mech_t = Text(mechanic, font_size=17, color=WHITE)\
                   .move_to(box).align_to(box, LEFT).shift(RIGHT * 0.25 + DOWN * 0.05)
        ins_t  = Text(insight, font_size=15, color=GRAY)\
                   .move_to(box).align_to(box, LEFT).shift(RIGHT * 0.25 + DOWN * 0.32)
        return VGroup(box, nm_t, mech_t, ins_t)
