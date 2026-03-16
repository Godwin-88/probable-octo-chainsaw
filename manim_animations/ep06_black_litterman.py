"""
QuantiFire EP06 — Black-Litterman: Injecting Your Views Into the Market
Run: manim -pql ep06_black_litterman.py BlackLittermanScene
Audio: AI voiceover via manim-voiceover

Sources:
  Black & Litterman (1992) Financial Analysts Journal 48(5) 28-43
  He & Litterman (2002) Goldman Sachs Asset Management
  Idzorek (2005) A Step-by-Step Guide to the BL Model, Ibbotson Associates
  Litterman (2003) Modern Investment Management, Wiley

One scene per script paragraph:
  HOOK        0:00-0:30   Extreme MVO weights → Black & Litterman fix (1990)
  CONTEXT     0:30-1:00   Bayesian prior + views → stable weights
  STEP1       1:00-1:30   Equilibrium prior  π = δΣwm
  STEP2       1:30-2:00   Expressing views   Pμ = q + ε
  STEP3       2:00-2:30   Posterior formula  μ_BL (precision-weighted blend)
  STEP4       2:30-3:00   Optimize on posterior → tilt bar chart
  ABUSES      3:00-3:30   Three common BL mistakes
  DEFI        3:30-3:55   DeFi yield-optimization analogue
  TAKEAWAY    3:55-4:30   Start from market, not guesses
  CTA         4:30-5:00   Outro + EP07 Kelly teaser
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


class BlackLittermanScene(VoiceoverScene):
    def construct(self):
        self.camera.background_color = BG
        self.set_speech_service(GTTSService(lang="en"))
        # PRODUCTION: self.set_speech_service(ElevenLabsService(
        #     voice_id="pNInz6obpgDQGcFmaJgB", model="eleven_turbo_v2"))

        self._scene_hook()
        self._scene_context()
        self._scene_step1_prior()
        self._scene_step2_views()
        self._scene_step3_posterior()
        self._scene_step4_optimize()
        self._scene_abuses()
        self._scene_defi()
        self._scene_takeaway()
        self._scene_cta()

    # ── SCENE 1: HOOK ─────────────────────────────────────────────────────────
    def _scene_hook(self):
        # Show absurd MVO output weights
        mvo_title = Text("Classical MVO Output", font_size=26, color=RED)\
                       .to_edge(UP, buff=0.6)
        self.play(Write(mvo_title))

        assets = ["US Equities", "EU Bonds", "EM Debt", "Gold", "Real Estate"]
        weights = ["+120%", "–80%", "+95%", "–45%", "+10%"]
        weight_cols = [RED, RED, RED, RED, TEAL]

        weight_rows = VGroup()
        for asset, wt, col in zip(assets, weights, weight_cols):
            row = VGroup(
                Text(asset, font_size=20, color=WHITE),
                Text(wt, font_size=22, color=col, weight=BOLD),
            ).arrange(RIGHT, buff=1.2)
            weight_rows.add(row)
        weight_rows.arrange(DOWN, buff=0.22, aligned_edge=LEFT)\
                   .shift(LEFT * 0.5 + UP * 0.3)

        with self.voiceover(
            "If you've ever run a mean-variance optimizer and gotten portfolio weights "
            "like 120% in one asset and negative 80% in another, "
            "you've experienced the input sensitivity problem of classical MVO."
        ) as tracker:
            self.play(FadeIn(mvo_title), run_time=0.6)
            self.play(LaggedStart(*[FadeIn(r, shift=RIGHT * 0.2) for r in weight_rows],
                                  lag_ratio=0.2), run_time=1.5)
            self.wait(tracker.duration - 2.1)

        # Cross out the weights → BL stamp
        cross = Cross(weight_rows, color=RED, stroke_width=3)
        origin_text = VGroup(
            Text("1990 — Goldman Sachs", font_size=22, color=GOLD),
            Text("Fischer Black  &  Robert Litterman", font_size=26,
                 color=WHITE, weight=BOLD),
            Text("published the fix.", font_size=22, color=TEAL),
        ).arrange(DOWN, buff=0.2).to_edge(DOWN, buff=0.8)

        with self.voiceover(
            "In 1990, Goldman Sachs researchers Fischer Black and Robert Litterman "
            "published the fix. It changed how institutional portfolio managers "
            "build portfolios forever."
        ) as tracker:
            self.play(Create(cross), run_time=0.7)
            self.play(LaggedStart(*[FadeIn(t) for t in origin_text], lag_ratio=0.4),
                      run_time=1.2)
            self.wait(tracker.duration - 1.9)

        clear(self)

    # ── SCENE 2: CONTEXT ──────────────────────────────────────────────────────
    def _scene_context(self):
        title = Text("The Black-Litterman Model", font_size=32, color=GOLD)\
                   .to_edge(UP, buff=0.5)
        cite  = Text("Black & Litterman · Financial Analysts Journal · 1992",
                     font_size=14, color=GRAY).next_to(title, DOWN, buff=0.1)
        self.play(Write(title), FadeIn(cite))

        # Three-column concept map
        prior_col = VGroup(
            Text("MARKET\nEQUILIBRIUM", font_size=18, color=BLUE, weight=BOLD,
                 line_spacing=1.2),
            Text("Bayesian prior\n(what prices imply)", font_size=16, color=WHITE,
                 line_spacing=1.2),
        ).arrange(DOWN, buff=0.15)\
         .add_background_rectangle(color="#0A0A1A", opacity=1, buff=0.2)\
         .shift(LEFT * 3.8 + DOWN * 0.3)

        plus = Text("+", font_size=36, color=GRAY).shift(LEFT * 1.5 + DOWN * 0.3)

        views_col = VGroup(
            Text("INVESTOR\nVIEWS", font_size=18, color=GOLD, weight=BOLD,
                 line_spacing=1.2),
            Text("Your active forecasts\n(with confidence levels)", font_size=16,
                 color=WHITE, line_spacing=1.2),
        ).arrange(DOWN, buff=0.15)\
         .add_background_rectangle(color="#1A1400", opacity=1, buff=0.2)\
         .shift(RIGHT * 0.8 + DOWN * 0.3)

        arrow = Arrow(RIGHT * 2.2 + DOWN * 0.3, RIGHT * 4.0 + DOWN * 0.3,
                      color=GRAY, stroke_width=2, buff=0.1)

        result_col = VGroup(
            Text("STABLE\nWEIGHTS", font_size=18, color=TEAL, weight=BOLD,
                 line_spacing=1.2),
            Text("Diversified, intuitive,\nno extreme positions", font_size=16,
                 color=WHITE, line_spacing=1.2),
        ).arrange(DOWN, buff=0.15)\
         .add_background_rectangle(color="#0A1A0A", opacity=1, buff=0.2)\
         .shift(RIGHT * 5.2 + DOWN * 0.3)

        genius_note = Text(
            "The genius: instead of guessing returns (which causes instability),\n"
            "reverse-engineer what the market is already implying.",
            font_size=18, color=GOLD, line_spacing=1.3
        ).to_edge(DOWN, buff=0.55)

        with self.voiceover(
            "Black-Litterman combines a Bayesian prior — the market equilibrium — "
            "with your active views."
        ) as tracker:
            self.play(FadeIn(prior_col), FadeIn(plus), FadeIn(views_col), run_time=1.2)
            self.wait(tracker.duration - 1.2)

        with self.voiceover(
            "Using matrix algebra, it produces stable, intuitive portfolio weights. "
            "The genius is in the starting point: instead of guessing expected returns — "
            "which causes all the instability — you reverse-engineer what the market "
            "is already implying."
        ) as tracker:
            self.play(GrowArrow(arrow), FadeIn(result_col), run_time=1.0)
            self.play(FadeIn(genius_note), run_time=0.8)
            self.wait(tracker.duration - 1.8)

        clear(self)

    # ── SCENE 3: STEP 1 — EQUILIBRIUM PRIOR ──────────────────────────────────
    def _scene_step1_prior(self):
        title = Text("Step 1 — The Equilibrium Prior", font_size=28, color=GOLD)\
                   .to_edge(UP, buff=0.5)
        step_badge = Text("π = δ · Σ · wₘ", font_size=38, color=BLUE)\
                        .next_to(title, DOWN, buff=0.35)
        self.play(Write(title), Write(step_badge))

        # Visual: market-cap weights → implied returns
        assets = ["US Eq", "EU Eq", "EM Eq", "Bonds", "Commod"]
        mkt_w  = [0.45, 0.20, 0.15, 0.12, 0.08]
        pi_val = [0.062, 0.048, 0.071, 0.025, 0.038]

        axes_w = Axes(
            x_range=[-0.5, 4.5, 1], y_range=[0, 0.6, 0.1],
            x_length=4.5, y_length=3.0,
            axis_config={"color": GRAY, "include_numbers": False}, tips=False
        ).shift(LEFT * 2.8 + DOWN * 0.8)

        axes_pi = Axes(
            x_range=[-0.5, 4.5, 1], y_range=[0, 0.10, 0.02],
            x_length=4.5, y_length=3.0,
            axis_config={"color": GRAY, "include_numbers": False}, tips=False
        ).shift(RIGHT * 2.8 + DOWN * 0.8)

        w_title  = Text("Market-cap weights  wₘ", font_size=16, color=BLUE)\
                      .next_to(axes_w, UP, buff=0.1)
        pi_title = Text("Implied returns  π", font_size=16, color=TEAL)\
                      .next_to(axes_pi, UP, buff=0.1)
        arrow_mid = Arrow(axes_w.get_right(), axes_pi.get_left(),
                          color=GRAY, stroke_width=2, buff=0.15)
        arr_lbl   = Text("δΣ ×", font_size=14, color=GRAY)\
                       .next_to(arrow_mid, UP, buff=0.08)

        w_bars  = self._make_bars(axes_w,  mkt_w,  BLUE,  assets, scale=0.6)
        pi_bars = self._make_bars(axes_pi, pi_val, TEAL,  assets, scale=0.10)

        with self.voiceover(
            "Start with market-cap weights. The market equilibrium implies these weights "
            "are optimal for some aggregate level of risk aversion delta."
        ) as tracker:
            self.play(Create(axes_w), Write(w_title), run_time=0.8)
            self.play(LaggedStart(*[GrowFromEdge(b, DOWN) for b in w_bars[0]],
                                  lag_ratio=0.15), run_time=1.0)
            self.play(LaggedStart(*[FadeIn(l) for l in w_bars[1]], lag_ratio=0.15),
                      run_time=0.6)
            self.wait(tracker.duration - 2.4)

        with self.voiceover(
            "Reverse-engineer the implied expected returns: pi equals delta times "
            "the covariance matrix times the market-cap weights. "
            "Pi is your prior — the market's best guess of expected returns, "
            "reflected in current prices. It's the neutral starting point "
            "before you add any views of your own."
        ) as tracker:
            self.play(GrowArrow(arrow_mid), Write(arr_lbl), run_time=0.8)
            self.play(Create(axes_pi), Write(pi_title), run_time=0.8)
            self.play(LaggedStart(*[GrowFromEdge(b, DOWN) for b in pi_bars[0]],
                                  lag_ratio=0.15), run_time=1.0)
            self.play(LaggedStart(*[FadeIn(l) for l in pi_bars[1]], lag_ratio=0.15),
                      run_time=0.5)
            self.wait(tracker.duration - 3.1)

        clear(self)

    # ── SCENE 4: STEP 2 — EXPRESSING VIEWS ───────────────────────────────────
    def _scene_step2_views(self):
        title = Text("Step 2 — Expressing Views", font_size=28, color=GOLD)\
                   .to_edge(UP, buff=0.5)
        formula = MathTex(r"P \cdot \mu = q + \varepsilon_{\text{views}}",
                          font_size=40, color=GOLD).next_to(title, DOWN, buff=0.35)
        self.play(Write(title), Write(formula))

        # Annotated P matrix terms
        p_lbl = VGroup(
            Text("P", font_size=22, color=WHITE, weight=BOLD),
            Text("K × N pick matrix\n(which assets each view covers)",
                 font_size=17, color=TEAL, line_spacing=1.2),
        ).arrange(RIGHT, buff=0.3).shift(UP * 0.6 + LEFT * 2.0)

        q_lbl = VGroup(
            Text("q", font_size=22, color=WHITE, weight=BOLD),
            Text("View return vector\n(your forecast magnitude)",
                 font_size=17, color=BLUE, line_spacing=1.2),
        ).arrange(RIGHT, buff=0.3).shift(DOWN * 0.1 + LEFT * 2.0)

        omega_lbl = VGroup(
            Text("Ω", font_size=22, color=WHITE, weight=BOLD),
            Text("View uncertainty matrix\n(your confidence in each view)",
                 font_size=17, color=RED, line_spacing=1.2),
        ).arrange(RIGHT, buff=0.3).shift(DOWN * 0.8 + LEFT * 2.0)

        with self.voiceover(
            "Suppose you have K views. Each view is expressed as P times mu equals "
            "q plus epsilon-views."
        ) as tracker:
            self.play(LaggedStart(*[FadeIn(l, shift=RIGHT * 0.2)
                                    for l in [p_lbl, q_lbl, omega_lbl]],
                                  lag_ratio=0.35), run_time=1.5)
            self.wait(tracker.duration - 1.5)

        # Concrete example box
        example = VGroup(
            Text("Example view:", font_size=18, color=GRAY),
            Text('"US Tech will outperform EU Banks by 3% annually"',
                 font_size=18, color=WHITE, slant=ITALIC),
            Text("P  =  [+1  for US Tech,  –1  for EU Banks]",
                 font_size=17, color=TEAL),
            Text("q  =  0.03    (3% outperformance)", font_size=17, color=BLUE),
            Text("Ω₁₁  =  σ²_view    (how confident are you?)",
                 font_size=17, color=RED),
        ).arrange(DOWN, buff=0.18, aligned_edge=LEFT)\
         .add_background_rectangle(color="#111111", opacity=1, buff=0.25)\
         .to_edge(DOWN, buff=0.4)

        with self.voiceover(
            "P is a K by N pick matrix describing which assets your view is about. "
            "Q is the vector of view returns. Omega captures your uncertainty "
            "in each view — the smaller omega, the more confident you are."
        ) as tracker:
            self.wait(tracker.duration)

        with self.voiceover(
            "Concrete example: you believe US Tech will outperform EU Banks by 3% annually. "
            "P has plus-one for US Tech and minus-one for EU Banks. "
            "Q equals 0.03. Omega-one-one is your uncertainty squared — "
            "your confidence in this specific forecast."
        ) as tracker:
            self.play(FadeIn(example), run_time=1.0)
            self.wait(tracker.duration - 1.0)

        clear(self)

    # ── SCENE 5: STEP 3 — POSTERIOR FORMULA ──────────────────────────────────
    def _scene_step3_posterior(self):
        title = Text("Step 3 — The BL Posterior Return Estimate",
                     font_size=26, color=GOLD).to_edge(UP, buff=0.5)
        self.play(Write(title))

        # Full BL formula broken into readable lines
        formula = MathTex(
            r"\mu_{BL} = \Bigl[(\tau\Sigma)^{-1} + P^\top\Omega^{-1}P\Bigr]^{-1}"
            r"\Bigl[(\tau\Sigma)^{-1}\pi + P^\top\Omega^{-1}q\Bigr]",
            font_size=30, color=WHITE
        ).shift(UP * 1.6)

        cite = Text("Black & Litterman (1992)  ·  He & Litterman (2002)",
                    font_size=13, color=GRAY).next_to(formula, DOWN, buff=0.2)

        with self.voiceover(
            "Combine the prior and views using Bayes' theorem. "
            "The Black-Litterman posterior mean is this formula — "
            "a precision-weighted average of the prior and your views."
        ) as tracker:
            self.play(Write(formula), run_time=tracker.duration * 0.8)
            self.play(FadeIn(cite), run_time=0.5)
            self.wait(tracker.duration * 0.2)

        # Decode τ
        tau_box = VGroup(
            Text("τ  (tau) — prior uncertainty scalar", font_size=19, color=BLUE,
                 weight=BOLD),
            Text("Typical range: 0.025 – 0.05", font_size=17, color=WHITE),
            Text("Larger τ  →  less weight on prior  →  views dominate",
                 font_size=17, color=RED),
            Text("Smaller τ  →  more weight on prior  →  equilibrium dominates",
                 font_size=17, color=TEAL),
        ).arrange(DOWN, buff=0.18, aligned_edge=LEFT)\
         .add_background_rectangle(color="#0A0A1A", opacity=1, buff=0.22)\
         .shift(DOWN * 0.9 + LEFT * 0.5)

        with self.voiceover(
            "Tau is a scalar expressing how uncertain you are about the prior. "
            "Typically set between 0.025 and 0.05."
        ) as tracker:
            self.play(FadeIn(tau_box), run_time=0.8)
            self.wait(tracker.duration - 0.8)

        # Intuition note
        intuition = VGroup(
            Text("High confidence view  (small Ω)  →  posterior pulls toward view",
                 font_size=17, color=GOLD),
            Text("Low confidence view   (large Ω)  →  posterior stays near equilibrium",
                 font_size=17, color=GRAY),
        ).arrange(DOWN, buff=0.15, aligned_edge=LEFT).to_edge(DOWN, buff=0.5)

        with self.voiceover(
            "High confidence views — small omega — pull the posterior strongly toward "
            "your forecast. Low confidence views barely move it from equilibrium. "
            "This is exactly the Bayesian behaviour you want from a portfolio model."
        ) as tracker:
            self.play(LaggedStart(*[FadeIn(i) for i in intuition], lag_ratio=0.4),
                      run_time=1.0)
            self.wait(tracker.duration - 1.0)

        clear(self)

    # ── SCENE 6: STEP 4 — OPTIMIZE ON POSTERIOR ──────────────────────────────
    def _scene_step4_optimize(self):
        title = Text("Step 4 — Optimize on the Posterior", font_size=28, color=GOLD)\
                   .to_edge(UP, buff=0.5)
        subtitle = Text("Plug μ_BL into standard MVO  →  weights tilt proportionally to confidence",
                        font_size=18, color=WHITE).next_to(title, DOWN, buff=0.2)
        self.play(Write(title), FadeIn(subtitle))

        assets   = ["US Eq", "EU Eq", "EM Eq", "Bonds", "Commod"]
        mkt_w    = [0.45, 0.20, 0.15, 0.12, 0.08]
        # BL view: US Tech (US Eq proxy) outperforms → tilt up; EU Eq tilts down
        bl_w     = [0.52, 0.14, 0.17, 0.11, 0.06]
        no_view_w = mkt_w  # same as market when no view

        axes = Axes(
            x_range=[-0.5, 4.5, 1], y_range=[0, 0.65, 0.1],
            x_length=9, y_length=3.5,
            axis_config={"color": GRAY, "include_numbers": False}, tips=False
        ).shift(DOWN * 0.7)
        x_lbl = Text("Asset", font_size=15, color=GRAY)\
                    .next_to(axes.x_axis.get_end(), RIGHT, buff=0.1)
        y_lbl = Text("Portfolio weight", font_size=15, color=GRAY)\
                    .next_to(axes.y_axis.get_end(), UP, buff=0.08)
        self.play(Create(axes), Write(x_lbl), Write(y_lbl))

        mkt_bars = self._make_bars(axes, mkt_w,  BLUE,  assets, scale=0.65,
                                   x_offset=-0.2)
        bl_bars  = self._make_bars(axes, bl_w,   TEAL,  assets, scale=0.65,
                                   x_offset=0.2)

        legend = VGroup(
            self._legend_item(BLUE, "Market weights"),
            self._legend_item(TEAL, "BL weights (with view)"),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.15)\
         .to_corner(UR, buff=0.4)

        with self.voiceover(
            "Plug the BL posterior into the standard mean-variance optimizer. "
            "Here in blue are the market-cap weights — the neutral starting point "
            "when you have no views."
        ) as tracker:
            self.play(LaggedStart(*[GrowFromEdge(b, DOWN) for b in mkt_bars[0]],
                                  lag_ratio=0.15), run_time=1.0)
            self.play(LaggedStart(*[FadeIn(l) for l in mkt_bars[1]], lag_ratio=0.15),
                      run_time=0.5)
            self.play(FadeIn(legend[0]), run_time=0.5)
            self.wait(tracker.duration - 2.0)

        with self.voiceover(
            "In teal are the BL weights after expressing the view that US equities "
            "will outperform. The optimizer tilts toward US equities and away from EU — "
            "in exact proportion to your confidence. "
            "No extreme positions. No corner solutions from estimation noise."
        ) as tracker:
            self.play(LaggedStart(*[GrowFromEdge(b, DOWN) for b in bl_bars[0]],
                                  lag_ratio=0.15), run_time=1.0)
            self.play(LaggedStart(*[FadeIn(l) for l in bl_bars[1]], lag_ratio=0.15),
                      run_time=0.5)
            self.play(FadeIn(legend[1]), run_time=0.5)
            self.wait(tracker.duration - 2.0)

        result_note = Text(
            "BL portfolios: diversified · intuitive · tilted by conviction · "
            "never dominated by estimation artifacts",
            font_size=17, color=GOLD
        ).to_edge(DOWN, buff=0.45)

        with self.voiceover(
            "The practical result: BL portfolios look like real portfolios — "
            "diversified, intuitive, tilted in the direction of your convictions "
            "rather than dominated by optimization artifacts."
        ) as tracker:
            self.play(FadeIn(result_note), run_time=0.8)
            self.wait(tracker.duration - 0.8)

        clear(self)

    # ── SCENE 7: COMMON ABUSES ────────────────────────────────────────────────
    def _scene_abuses(self):
        title = Text("Common Abuses of the BL Model", font_size=28, color=RED)\
                   .to_edge(UP, buff=0.5)
        self.play(Write(title))

        abuses = [
            (
                "1.  Setting τ incorrectly",
                "Many practitioners default τ = 1 — makes the prior too uncertain,\n"
                "lets views dominate and reintroduces instability.",
                "Calibrate τ via Idzorek (2005) confidence-level method."
            ),
            (
                "2.  Treating Ω as diagonal",
                "Assumes view errors are uncorrelated — fine if views are truly\n"
                "independent, but wrong if they share the same macro driver.",
                "Use correlated Ω when views overlap in risk factor space."
            ),
            (
                "3.  Absolute views only",
                "Absolute views (asset A returns X%) are harder to calibrate\n"
                "and more sensitive to estimation error.",
                "Prefer relative views (A beats B by X%) — more natural and stable."
            ),
        ]

        for i, (header, problem, fix) in enumerate(abuses):
            row = VGroup(
                Text(header, font_size=19, color=RED, weight=BOLD),
                Text(problem, font_size=16, color=WHITE, line_spacing=1.2),
                Text(f"Fix: {fix}", font_size=15, color=TEAL, line_spacing=1.2),
            ).arrange(DOWN, buff=0.1, aligned_edge=LEFT)\
             .add_background_rectangle(color="#1A0A0A", opacity=1, buff=0.18)

            if i == 0:
                row.shift(UP * 1.4)
            elif i == 1:
                row.shift(UP * 0.0)
            else:
                row.shift(DOWN * 1.4)

            with self.voiceover(
                [
                    "Common abuse one: setting tau incorrectly. "
                    "Many practitioners default tau to 1, which makes the prior "
                    "too uncertain and lets views dominate — reintroducing the instability "
                    "BL was designed to fix.",
                    "Common abuse two: treating omega as diagonal. "
                    "This assumes view errors are uncorrelated — fine if views are "
                    "truly independent, but wrong if they share a common macro driver.",
                    "Common abuse three: using only absolute views. "
                    "Absolute views are harder to calibrate and more sensitive to error. "
                    "Prefer relative views — asset A beats B by X percent — "
                    "which are more natural and stable.",
                ][i]
            ) as tracker:
                self.play(FadeIn(row, shift=RIGHT * 0.2), run_time=0.8)
                self.wait(tracker.duration - 0.8)

        clear(self)

    # ── SCENE 8: DEFI APPLICATION ─────────────────────────────────────────────
    def _scene_defi(self):
        title = Text("BL in DeFi — Yield Optimization", font_size=28, color=GOLD)\
                   .to_edge(UP, buff=0.5)
        self.play(Write(title))

        mapping = VGroup(
            self._mapping_row(
                "Equilibrium prior  π",
                "Current yield allocation across protocols",
                BLUE
            ),
            self._mapping_row(
                "Pick matrix  P",
                "Which protocol's APY your view addresses",
                TEAL
            ),
            self._mapping_row(
                'View q  (example 1)',
                '"Aave utilization ↑15% → supply APY ↑2%"',
                GOLD
            ),
            self._mapping_row(
                'View q  (example 2)',
                '"Curve CRV incentives cut → pool APY ↓3%"',
                RED
            ),
            self._mapping_row(
                "BL output  μ_BL",
                "Stable reallocation weights across protocols",
                WHITE
            ),
        ).arrange(DOWN, buff=0.28, aligned_edge=LEFT).shift(DOWN * 0.2 + LEFT * 0.3)

        with self.voiceover(
            "BL maps directly to DeFi yield optimization. "
            "The equilibrium prior is the current yield allocation across protocols."
        ) as tracker:
            self.play(FadeIn(mapping[0], shift=RIGHT * 0.2), run_time=0.8)
            self.play(FadeIn(mapping[1], shift=RIGHT * 0.2), run_time=0.7)
            self.wait(tracker.duration - 1.5)

        with self.voiceover(
            "Your views are protocol-specific forecasts. "
            "For example: Aave's utilization will increase by 15%, boosting supply APY by 2%. "
            "Or: Curve's CRV incentives will be cut in the next governance vote, "
            "reducing pool APY by 3%."
        ) as tracker:
            self.play(FadeIn(mapping[2], shift=RIGHT * 0.2), run_time=0.7)
            self.play(FadeIn(mapping[3], shift=RIGHT * 0.2), run_time=0.7)
            self.wait(tracker.duration - 1.4)

        with self.voiceover(
            "These views are expressed in the P matrix, and BL blends them with "
            "the equilibrium yield allocation to produce stable reallocation weights — "
            "without the extreme positions classical MVO would generate."
        ) as tracker:
            self.play(FadeIn(mapping[4], shift=RIGHT * 0.2), run_time=0.8)
            self.wait(tracker.duration - 0.8)

        clear(self)

    # ── SCENE 9: TAKEAWAY ─────────────────────────────────────────────────────
    def _scene_takeaway(self):
        title = Text("Takeaway", font_size=34, color=GOLD).to_edge(UP, buff=0.5)
        self.play(Write(title))

        core_insight = VGroup(
            Text("The key insight of BL:", font_size=22, color=WHITE),
            Text("Start from the market, not from guesses.",
                 font_size=26, color=GOLD, weight=BOLD),
        ).arrange(DOWN, buff=0.2).shift(UP * 1.6)

        rules = VGroup(
            VGroup(
                Text("No view?", font_size=20, color=TEAL, weight=BOLD),
                Text("  Hold the market weights.", font_size=20, color=WHITE),
            ).arrange(RIGHT, buff=0.1),
            VGroup(
                Text("Have a view?", font_size=20, color=TEAL, weight=BOLD),
                Text("  Tilt proportionally to your confidence.", font_size=20,
                     color=WHITE),
            ).arrange(RIGHT, buff=0.1),
            VGroup(
                Text("Strong conviction?", font_size=20, color=TEAL, weight=BOLD),
                Text("  Set a small Ω — let the view move the posterior.", font_size=20,
                     color=WHITE),
            ).arrange(RIGHT, buff=0.1),
        ).arrange(DOWN, buff=0.3, aligned_edge=LEFT).shift(DOWN * 0.3)

        sources_note = Text(
            "Black & Litterman (1992)  ·  He & Litterman (2002)  ·  Idzorek (2005)",
            font_size=13, color=GRAY
        ).to_edge(DOWN, buff=0.4)

        with self.voiceover(
            "The key insight of BL: start from the market, not from guesses."
        ) as tracker:
            self.play(LaggedStart(*[FadeIn(t) for t in core_insight], lag_ratio=0.4),
                      run_time=tracker.duration * 0.8)
            self.wait(tracker.duration * 0.2)

        with self.voiceover(
            "When you have no view, hold the market. "
            "When you have a view, tilt proportionally to your confidence. "
            "When you have strong conviction, set a small omega and let the view "
            "move the posterior."
        ) as tracker:
            self.play(LaggedStart(*[FadeIn(r, shift=RIGHT * 0.2) for r in rules],
                                  lag_ratio=0.4), run_time=1.5)
            self.wait(tracker.duration - 1.5)

        with self.voiceover(
            "The formula ensures your views are incorporated in a mathematically "
            "coherent way that classical MVO simply cannot achieve."
        ) as tracker:
            self.play(FadeIn(sources_note), run_time=0.6)
            self.wait(tracker.duration - 0.6)

        clear(self)

    # ── SCENE 10: CTA ─────────────────────────────────────────────────────────
    def _scene_cta(self):
        with self.voiceover(
            "Next: the Kelly Criterion — the mathematically optimal bet sizing formula, "
            "why it's dangerous to use naively, and the fractional Kelly compromise "
            "professionals use in practice. Subscribe. QuantiFire."
        ) as tracker:
            teaser = VGroup(
                Text("Next → EP07", font_size=24, color=GRAY),
                Text("The Kelly Criterion", font_size=32, color=WHITE),
                Text("Optimal bet sizing — and why naïve Kelly destroys accounts",
                     font_size=18, color=TEAL),
            ).arrange(DOWN, buff=0.3)
            outro = Text("QuantiFire  |  EP 06", font_size=32, color=GOLD)\
                       .to_edge(DOWN, buff=0.8)
            self.play(LaggedStart(*[FadeIn(t) for t in teaser], lag_ratio=0.4),
                      run_time=1.5)
            self.play(FadeIn(outro), run_time=0.6)
            self.wait(tracker.duration - 2.2)

    # ── HELPERS ───────────────────────────────────────────────────────────────
    def _make_bars(self, axes, values, color, labels, scale=1.0, x_offset=0.0):
        bars  = VGroup()
        lbls  = VGroup()
        n     = len(values)
        for i, (val, lbl) in enumerate(zip(values, labels)):
            x0  = axes.coords_to_point(i + x_offset, 0)
            x1  = axes.coords_to_point(i + x_offset, val)
            bar = Rectangle(
                width=0.38,
                height=abs(x1[1] - x0[1]),
                fill_color=color, fill_opacity=0.82, stroke_width=0
            ).move_to([(x0[0] + x1[0]) / 2, (x0[1] + x1[1]) / 2, 0])
            bars.add(bar)
            lbls.add(
                Text(lbl, font_size=13, color=color)
                .next_to(axes.coords_to_point(i, 0), DOWN, buff=0.1)
            )
        return bars, lbls

    def _legend_item(self, color, label):
        sq  = Square(side_length=0.22, fill_color=color, fill_opacity=0.85,
                     stroke_width=0)
        lbl = Text(label, font_size=16, color=color).next_to(sq, RIGHT, buff=0.14)
        return VGroup(sq, lbl)

    def _mapping_row(self, left_text, right_text, color):
        lt = Text(left_text, font_size=17, color=color, weight=BOLD)
        arr = Text("→", font_size=17, color=GRAY)
        rt = Text(right_text, font_size=17, color=WHITE, slant=ITALIC)
        return VGroup(lt, arr, rt).arrange(RIGHT, buff=0.3)
