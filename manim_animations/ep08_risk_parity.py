"""
QuantiFire EP08 — Risk Parity: Why Bridgewater Ignores Expected Returns
Run: manim -pql ep08_risk_parity.py RiskParityScene
Audio: AI voiceover via manim-voiceover

Sources:
  Qian (2005) PanAgora Asset Management White Paper
  Maillard, Roncalli & Teiletche (2010) Journal of Portfolio Management 36(4) 60-70
  Asness, Frazzini & Pedersen (2012) Financial Analysts Journal 68(1) 47-59
  Roncalli (2013) Introduction to Risk Parity and Budgeting, CRC Press

One scene per script paragraph:
  HOOK        0:00-0:30   Bridgewater $100B+ — All Weather — every asset equal risk
  CONTEXT     0:30-1:00   Ray Dalio 1990s — solves MVO fragility
  PROB_6040   1:00-1:30   60/40 capital ≠ 60/40 risk — two pie charts
  RC_FORMULA  1:30-2:00   RC_i = w_i(Σw)_i / σ_p — each term labelled
  INV_VOL     2:00-2:30   w_i ∝ 1/σ_i — before/after risk-contribution bar chart
  LEVERAGE    2:30-3:00   RP needs leverage to match return targets
  ALL_WEATHER 3:00-3:20   Four economic quadrants — assets per quadrant
  RP_VS_MVO   3:20-3:40   Comparison table
  DEFI        3:40-3:55   DeFi inverse-yield-vol weighting
  TAKEAWAY    3:55-4:30   When to use RP, practical implementation
  CTA         4:30-5:00   Outro + EP09 Momentum teaser
"""
from manim import *
from manim_voiceover import VoiceoverScene
from manim_voiceover.services.gtts import GTTSService
# PRODUCTION: from manim_voiceover.services.elevenlabs import ElevenLabsService
import numpy as np

GOLD  = "#FFB700"
TEAL  = "#00C896"
RED   = "#FF4444"
BLUE  = "#4A90E2"
GRAY  = "#888888"
BG    = "#0D0D0D"
PURP  = "#9B59B6"


def clear(scene):
    scene.play(*[FadeOut(m) for m in scene.mobjects], run_time=0.5)


class RiskParityScene(VoiceoverScene):
    def construct(self):
        self.camera.background_color = BG
        self.set_speech_service(GTTSService(lang="en"))
        # PRODUCTION: self.set_speech_service(ElevenLabsService(
        #     voice_id="pNInz6obpgDQGcFmaJgB", model="eleven_turbo_v2"))

        self._scene_hook()
        self._scene_context()
        self._scene_6040_problem()
        self._scene_rc_formula()
        self._scene_inv_vol()
        self._scene_leverage()
        self._scene_all_weather()
        self._scene_rp_vs_mvo()
        self._scene_defi()
        self._scene_takeaway()
        self._scene_cta()

    # ── SCENE 1: HOOK ─────────────────────────────────────────────────────────
    def _scene_hook(self):
        bw_lbl  = Text("Bridgewater Associates", font_size=32, color=GOLD, weight=BOLD)\
                     .shift(UP * 1.4)
        aum     = Text("$100+ billion AUM", font_size=28, color=WHITE)\
                     .next_to(bw_lbl, DOWN, buff=0.25)
        fund    = Text("All Weather Fund  —  outperformed 60/40 for decades",
                       font_size=22, color=TEAL).next_to(aum, DOWN, buff=0.2)

        with self.voiceover(
            "Bridgewater Associates manages over 100 billion dollars. "
            "Their flagship All Weather strategy has outperformed traditional "
            "60/40 portfolios for decades."
        ) as tracker:
            self.play(Write(bw_lbl), run_time=0.8)
            self.play(FadeIn(aum), FadeIn(fund), run_time=0.8)
            self.wait(tracker.duration - 1.6)

        radical = Text(
            "The radical idea behind it:",
            font_size=22, color=GRAY
        ).shift(DOWN * 0.4)
        core = Text(
            "Ignore expected returns entirely.\nBuild so every asset contributes equally to risk.",
            font_size=26, color=WHITE, weight=BOLD, line_spacing=1.35
        ).next_to(radical, DOWN, buff=0.3)
        stamp = Text("That's Risk Parity.", font_size=30, color=GOLD, weight=BOLD)\
                    .next_to(core, DOWN, buff=0.3)

        with self.voiceover(
            "The core idea behind it is radical: ignore expected returns entirely. "
            "Build your portfolio so that every asset contributes equally to portfolio risk. "
            "That's Risk Parity — and the math behind it is surprisingly simple."
        ) as tracker:
            self.play(FadeIn(radical), run_time=0.5)
            self.play(FadeIn(core), run_time=0.8)
            self.play(Write(stamp), run_time=0.6)
            self.wait(tracker.duration - 1.9)

        clear(self)

    # ── SCENE 2: CONTEXT ──────────────────────────────────────────────────────
    def _scene_context(self):
        title = Text("Risk Parity", font_size=34, color=GOLD).to_edge(UP, buff=0.5)
        cite  = Text(
            "Qian (2005)  ·  Maillard et al. (2010)  ·  Roncalli (2013)",
            font_size=13, color=GRAY
        ).next_to(title, DOWN, buff=0.12)
        self.play(Write(title), FadeIn(cite))

        origin = VGroup(
            Text("Ray Dalio  ·  Bridgewater  ·  early 1990s",
                 font_size=20, color=TEAL),
            Text("One of the dominant institutional allocation frameworks today",
                 font_size=18, color=WHITE),
        ).arrange(DOWN, buff=0.18).shift(UP * 1.2)

        problem_box = VGroup(
            Text("Problem it solves:", font_size=19, color=RED, weight=BOLD),
            Text("MVO is fragile — tiny errors in return forecasts\n"
                 "produce wildly different, unstable portfolios.",
                 font_size=18, color=WHITE, line_spacing=1.2),
        ).arrange(DOWN, buff=0.12, aligned_edge=LEFT)\
         .add_background_rectangle(color="#1A0A0A", opacity=1, buff=0.2)\
         .shift(DOWN * 0.1)

        solution_box = VGroup(
            Text("Risk Parity's answer:", font_size=19, color=TEAL, weight=BOLD),
            Text("Remove the most error-prone input — return forecasts — entirely.\n"
                 "Build purely on the risk structure of assets.",
                 font_size=18, color=WHITE, line_spacing=1.2),
        ).arrange(DOWN, buff=0.12, aligned_edge=LEFT)\
         .add_background_rectangle(color="#0A1A0A", opacity=1, buff=0.2)\
         .next_to(problem_box, DOWN, buff=0.3)

        with self.voiceover(
            "Welcome to QuantiFire. Risk Parity was developed by Ray Dalio at "
            "Bridgewater in the early 1990s and has become one of the dominant "
            "institutional allocation frameworks."
        ) as tracker:
            self.play(LaggedStart(*[FadeIn(o) for o in origin], lag_ratio=0.4),
                      run_time=1.0)
            self.wait(tracker.duration - 1.0)

        with self.voiceover(
            "It solves the core problem of MVO: sensitivity to return forecasts. "
            "By building a portfolio based purely on risk structure, "
            "you remove the most error-prone input from the optimisation entirely."
        ) as tracker:
            self.play(FadeIn(problem_box), run_time=0.8)
            self.play(FadeIn(solution_box), run_time=0.8)
            self.wait(tracker.duration - 1.6)

        clear(self)

    # ── SCENE 3: THE 60/40 PROBLEM ────────────────────────────────────────────
    def _scene_6040_problem(self):
        title = Text("The Problem with 60/40", font_size=30, color=GOLD)\
                   .to_edge(UP, buff=0.5)
        self.play(Write(title))

        # Two pie charts side by side
        cap_pie  = self._pie_chart(
            [60, 40], [BLUE, TEAL],
            ["Stocks 60%", "Bonds 40%"],
            "Capital Allocation",
            LEFT * 3.3 + DOWN * 0.3
        )
        risk_pie = self._pie_chart(
            [90, 10], [BLUE, TEAL],
            ["Stocks 90%", "Bonds 10%"],
            "Risk Contribution",
            RIGHT * 3.3 + DOWN * 0.3
        )
        arrow = Arrow(LEFT * 0.6, RIGHT * 0.6, color=GRAY,
                      stroke_width=2, buff=0.1).shift(DOWN * 0.3)
        arrow_lbl = Text("σ_stocks ≈ 3–4× σ_bonds", font_size=15, color=GRAY)\
                       .next_to(arrow, UP, buff=0.08)

        with self.voiceover(
            "A 60/40 stocks-bonds portfolio is 60% capital in stocks, "
            "40% in bonds. Looks balanced."
        ) as tracker:
            self.play(FadeIn(cap_pie), run_time=1.0)
            self.wait(tracker.duration - 1.0)

        with self.voiceover(
            "But stocks are 3 to 4 times more volatile than bonds. "
            "So roughly 90% of the portfolio's risk comes from the equity sleeve."
        ) as tracker:
            self.play(GrowArrow(arrow), FadeIn(arrow_lbl), run_time=0.7)
            self.play(FadeIn(risk_pie), run_time=1.0)
            self.wait(tracker.duration - 1.7)

        shock = Text(
            "In a crisis: you effectively hold an all-equity portfolio\n"
            "dressed up as diversified.",
            font_size=20, color=RED, line_spacing=1.3
        ).to_edge(DOWN, buff=0.55)

        with self.voiceover(
            "You have equal dollar weights but wildly unequal risk weights. "
            "In a crisis, you essentially have an all-equity portfolio "
            "dressed up as diversified."
        ) as tracker:
            self.play(FadeIn(shock), run_time=0.8)
            self.wait(tracker.duration - 0.8)

        clear(self)

    # ── SCENE 4: RISK CONTRIBUTION FORMULA ───────────────────────────────────
    def _scene_rc_formula(self):
        title = Text("Risk Contribution Formula", font_size=30, color=GOLD)\
                   .to_edge(UP, buff=0.5)
        self.play(Write(title))

        formula = MathTex(
            r"RC_i = \frac{w_i \cdot (\Sigma \mathbf{w})_i}{\sigma_p}",
            font_size=52, color=WHITE
        ).shift(UP * 1.7)

        with self.voiceover(
            "Define the Risk Contribution of asset i to portfolio risk: "
            "RC-i equals w-i times the i-th element of sigma-w, "
            "divided by total portfolio volatility sigma-p."
        ) as tracker:
            self.play(Write(formula), run_time=tracker.duration * 0.8)
            self.wait(tracker.duration * 0.2)

        # Annotate each term
        brace_w  = Brace(formula[0][3],  DOWN, color=TEAL)
        lbl_w    = Text("weight of\nasset i", font_size=16, color=TEAL)\
                      .next_to(brace_w, DOWN, buff=0.1)

        brace_sw = Brace(formula[0][5:10], DOWN, color=BLUE)
        lbl_sw   = Text("marginal contribution\nto portfolio variance", font_size=16, color=BLUE)\
                      .next_to(brace_sw, DOWN, buff=0.1)

        brace_sp = Brace(formula[0][11:], DOWN, color=GOLD)
        lbl_sp   = Text("total portfolio\nvolatility", font_size=16, color=GOLD)\
                      .next_to(brace_sp, DOWN, buff=0.1)

        with self.voiceover(
            "w-i is the weight of asset i. "
            "The sigma-w term is the marginal contribution to portfolio variance. "
            "Dividing by sigma-p normalises it as a fraction of total volatility."
        ) as tracker:
            self.play(Create(brace_w),  FadeIn(lbl_w),  run_time=0.7)
            self.play(Create(brace_sw), FadeIn(lbl_sw), run_time=0.7)
            self.play(Create(brace_sp), FadeIn(lbl_sp), run_time=0.7)
            self.wait(tracker.duration - 2.1)

        rp_goal = VGroup(
            Text("Risk Parity sets:", font_size=20, color=GRAY),
            MathTex(r"RC_i = RC_j \quad \forall\, i, j",
                    font_size=34, color=TEAL),
            Text("Every asset contributes equally to total portfolio risk.",
                 font_size=19, color=WHITE),
        ).arrange(DOWN, buff=0.2).to_edge(DOWN, buff=0.6)

        with self.voiceover(
            "Risk Parity sets RC-i equal to RC-j for every pair of assets. "
            "Every single asset contributes equally to total portfolio risk — "
            "no single sleeve dominates."
        ) as tracker:
            self.play(LaggedStart(*[FadeIn(r) for r in rp_goal], lag_ratio=0.4),
                      run_time=1.0)
            self.wait(tracker.duration - 1.0)

        clear(self)

    # ── SCENE 5: INVERSE-VOL WEIGHTING ───────────────────────────────────────
    def _scene_inv_vol(self):
        title = Text("Inverse-Volatility Weights", font_size=30, color=GOLD)\
                   .to_edge(UP, buff=0.5)
        self.play(Write(title))

        formula = MathTex(
            r"w_i \;\propto\; \frac{1}{\sigma_i}",
            font_size=52, color=GOLD
        ).shift(UP * 1.8)
        note = Text("(Exact solution when all correlations are equal)",
                    font_size=16, color=GRAY).next_to(formula, DOWN, buff=0.2)

        with self.voiceover(
            "In the simplest case — zero or equal correlation between assets — "
            "Risk Parity reduces to inverse-volatility weighting: "
            "each asset's weight is proportional to one over its volatility."
        ) as tracker:
            self.play(Write(formula), run_time=0.9)
            self.play(FadeIn(note), run_time=0.5)
            self.wait(tracker.duration - 1.4)

        # Before / After bar chart of risk contributions
        assets   = ["Stocks", "Bonds", "Commod", "Gold"]
        vols     = [0.18,  0.05,  0.22,  0.15]
        rc_before = [0.72,  0.06,  0.17,  0.05]   # 60/40-ish weights
        rc_after  = [0.25,  0.25,  0.25,  0.25]   # risk parity

        axes = Axes(
            x_range=[-0.5, 3.5, 1], y_range=[0, 0.85, 0.2],
            x_length=8.5, y_length=2.8,
            axis_config={"color": GRAY, "include_numbers": False},
            tips=False
        ).shift(DOWN * 1.1)
        y_lbl = Text("Risk Contribution", font_size=14, color=GRAY)\
                    .next_to(axes.y_axis.get_end(), UP, buff=0.08)
        self.play(Create(axes), Write(y_lbl))

        before_bars, before_lbls = self._make_bars(
            axes, rc_before, RED, assets, x_offset=-0.22, width=0.28)
        after_bars, after_lbls   = self._make_bars(
            axes, rc_after,  TEAL, assets, x_offset=0.22, width=0.28)

        legend = VGroup(
            self._legend_item(RED,  "Before (cap-weight)"),
            self._legend_item(TEAL, "After  (risk parity)"),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.15).to_corner(UR, buff=0.4)

        with self.voiceover(
            "Higher-volatility assets — stocks, commodities — get smaller weights. "
            "Lower-volatility assets — bonds — get much larger weights."
        ) as tracker:
            self.play(
                LaggedStart(*[GrowFromEdge(b, DOWN) for b in before_bars], lag_ratio=0.2),
                LaggedStart(*[FadeIn(l) for l in before_lbls], lag_ratio=0.2),
                FadeIn(legend[0]),
                run_time=1.2
            )
            self.wait(tracker.duration - 1.2)

        with self.voiceover(
            "After risk parity reweighting, every asset contributes exactly 25% "
            "to total risk. The portfolio is genuinely diversified — "
            "not dominated by a single volatile position."
        ) as tracker:
            self.play(
                LaggedStart(*[GrowFromEdge(b, DOWN) for b in after_bars], lag_ratio=0.2),
                LaggedStart(*[FadeIn(l) for l in after_lbls], lag_ratio=0.2),
                FadeIn(legend[1]),
                run_time=1.2
            )
            self.wait(tracker.duration - 1.2)

        clear(self)

    # ── SCENE 6: LEVERAGE ─────────────────────────────────────────────────────
    def _scene_leverage(self):
        title = Text("Risk Parity Requires Leverage", font_size=28, color=GOLD)\
                   .to_edge(UP, buff=0.5)
        self.play(Write(title))

        problem = VGroup(
            Text("Pure RP portfolio:", font_size=20, color=GRAY),
            Text("Bond-heavy → lower expected return at same capital level",
                 font_size=19, color=RED),
        ).arrange(DOWN, buff=0.12, aligned_edge=LEFT).shift(UP * 1.5)

        with self.voiceover(
            "A pure risk-parity portfolio is dominated by low-volatility bonds, "
            "which means lower expected return at the same capital level compared to 60/40."
        ) as tracker:
            self.play(LaggedStart(*[FadeIn(p) for p in problem], lag_ratio=0.4),
                      run_time=0.9)
            self.wait(tracker.duration - 0.9)

        # Lever-up diagram
        insight_box = VGroup(
            Text("Bridgewater's insight:", font_size=19, color=GOLD, weight=BOLD),
            Text("Lever up the RP portfolio to match the desired return target.",
                 font_size=18, color=WHITE),
            Text("Bonds × 3 leverage  →  same dollar return as unleveraged equity,",
                 font_size=17, color=TEAL),
            Text("but with diversified risk structure across ALL assets.",
                 font_size=17, color=TEAL),
        ).arrange(DOWN, buff=0.18, aligned_edge=LEFT)\
         .add_background_rectangle(color="#0A1A0A", opacity=1, buff=0.22)\
         .shift(UP * 0.3)

        sharpe_note = VGroup(
            Text("Result:", font_size=19, color=GOLD, weight=BOLD),
            Text("Total portfolio Sharpe Ratio improves —", font_size=18, color=WHITE),
            Text("you are no longer concentrated in equity risk.",
                 font_size=18, color=TEAL),
        ).arrange(DOWN, buff=0.12, aligned_edge=LEFT).to_edge(DOWN, buff=0.55)

        with self.voiceover(
            "Bridgewater's insight: lever up the risk parity portfolio until it "
            "matches the desired return target. Bonds with three times leverage "
            "contribute the same dollar return as unleveraged equity — "
            "but with a diversified risk structure."
        ) as tracker:
            self.play(FadeIn(insight_box), run_time=1.0)
            self.wait(tracker.duration - 1.0)

        with self.voiceover(
            "The total portfolio Sharpe Ratio improves because you are no longer "
            "concentrated in equity risk. Risk is spread across all assets and "
            "economic environments."
        ) as tracker:
            self.play(LaggedStart(*[FadeIn(s) for s in sharpe_note], lag_ratio=0.4),
                      run_time=0.9)
            self.wait(tracker.duration - 0.9)

        clear(self)

    # ── SCENE 7: ALL WEATHER QUADRANTS ────────────────────────────────────────
    def _scene_all_weather(self):
        title = Text("All Weather Logic — Four Economic Quadrants",
                     font_size=26, color=GOLD).to_edge(UP, buff=0.5)
        self.play(Write(title))

        # 2×2 grid of quadrants
        quad_data = [
            ("Rising Growth",    "Equities · Corp Bonds",  TEAL,  UL),
            ("Falling Growth",   "Bonds · Gold",            BLUE,  UR),
            ("Rising Inflation", "Commodities · Gold\n· TIPS", GOLD, DL),
            ("Falling Inflation","Bonds · Equities",        PURP,  DR),
        ]

        quads = VGroup()
        positions = [LEFT * 3.2 + UP * 0.85, RIGHT * 3.2 + UP * 0.85,
                     LEFT * 3.2 + DOWN * 1.15, RIGHT * 3.2 + DOWN * 1.15]

        for (label, assets, col, _), pos in zip(quad_data, positions):
            box = RoundedRectangle(width=5.0, height=1.8, corner_radius=0.15,
                                   fill_color=col, fill_opacity=0.08,
                                   stroke_color=col, stroke_width=1.5)\
                     .move_to(pos)
            ql = Text(label, font_size=17, color=col, weight=BOLD)\
                    .move_to(box).shift(UP * 0.38)
            al = Text(assets, font_size=15, color=WHITE, line_spacing=1.1)\
                    .move_to(box).shift(DOWN * 0.22)
            quads.add(VGroup(box, ql, al))

        h_line = Line(LEFT * 6.5 + ORIGIN, RIGHT * 6.5 + ORIGIN,
                      color=GRAY, stroke_width=1).shift(DOWN * 0.15)
        v_line = Line(UP * 2.0, DOWN * 2.3,
                      color=GRAY, stroke_width=1)
        g_lbl  = Text("Growth →", font_size=14, color=GRAY)\
                     .to_edge(RIGHT, buff=0.3).shift(DOWN * 0.15)
        i_lbl  = Text("Inflation ↑", font_size=14, color=GRAY)\
                     .to_edge(DOWN, buff=0.3)

        with self.voiceover(
            "This is the All Weather logic: diversify risk across four economic quadrants. "
            "Rising growth favours equities and corporate bonds."
        ) as tracker:
            self.play(Create(h_line), Create(v_line),
                      FadeIn(g_lbl), FadeIn(i_lbl), run_time=0.8)
            self.play(FadeIn(quads[0]), run_time=0.7)
            self.wait(tracker.duration - 1.5)

        with self.voiceover(
            "Falling growth favours sovereign bonds and gold. "
            "Rising inflation favours commodities, gold, and TIPS."
        ) as tracker:
            self.play(FadeIn(quads[1]), run_time=0.7)
            self.play(FadeIn(quads[2]), run_time=0.7)
            self.wait(tracker.duration - 1.4)

        with self.voiceover(
            "Falling inflation favours bonds and equities. "
            "Balance the risk allocation across all four quadrants, "
            "lever to target, and you get a portfolio that performs "
            "in all economic environments."
        ) as tracker:
            self.play(FadeIn(quads[3]), run_time=0.7)
            self.wait(tracker.duration - 0.7)

        clear(self)

    # ── SCENE 8: RP vs MVO COMPARISON ────────────────────────────────────────
    def _scene_rp_vs_mvo(self):
        title = Text("Risk Parity vs MVO", font_size=30, color=GOLD)\
                   .to_edge(UP, buff=0.5)
        self.play(Write(title))

        dims = [
            ("Return inputs needed",  "Yes — fragile",          "No",                RED,  TEAL),
            ("Optimal Sharpe",        "In theory",               "Not guaranteed",    GOLD, GRAY),
            ("Concentration risk",    "Often corner solutions",  "Diverse by design", RED,  TEAL),
            ("Practical stability",   "Low",                     "High",              RED,  TEAL),
            ("When it works best",    "Accurate forecasts",      "Always (+ leverage)",GRAY, TEAL),
        ]

        header = VGroup(
            Text("Dimension",    font_size=17, color=GRAY, weight=BOLD),
            Text("MVO",          font_size=17, color=RED,  weight=BOLD),
            Text("Risk Parity",  font_size=17, color=TEAL, weight=BOLD),
        ).arrange(RIGHT, buff=1.1).shift(UP * 1.5)

        sep = Line(header.get_left() + DOWN * 0.18,
                   header.get_right() + DOWN * 0.18,
                   color=GRAY, stroke_width=1)
        self.play(FadeIn(header), Create(sep))

        rows = VGroup()
        for dim, mvo_val, rp_val, mvo_col, rp_col in dims:
            row = VGroup(
                Text(dim,     font_size=15, color=WHITE),
                Text(mvo_val, font_size=15, color=mvo_col),
                Text(rp_val,  font_size=15, color=rp_col),
            ).arrange(RIGHT, buff=1.1)
            rows.add(row)
        rows.arrange(DOWN, buff=0.28, aligned_edge=LEFT)\
            .next_to(sep, DOWN, buff=0.25)

        with self.voiceover(
            "Risk Parity requires no return forecasts — MVO needs them and is fragile to errors. "
            "Risk Parity is diverse by construction — MVO often produces corner solutions."
        ) as tracker:
            self.play(LaggedStart(*[FadeIn(r, shift=RIGHT * 0.15) for r in rows[:2]],
                                  lag_ratio=0.4), run_time=1.0)
            self.wait(tracker.duration - 1.0)

        with self.voiceover(
            "Risk Parity has high practical stability. "
            "MVO is optimal in theory when forecasts are accurate — "
            "but that's rarely the case. Risk Parity works in all environments, "
            "as long as you're willing to apply modest leverage."
        ) as tracker:
            self.play(LaggedStart(*[FadeIn(r, shift=RIGHT * 0.15) for r in rows[2:]],
                                  lag_ratio=0.4), run_time=1.0)
            self.wait(tracker.duration - 1.0)

        clear(self)

    # ── SCENE 9: DEFI RISK PARITY ─────────────────────────────────────────────
    def _scene_defi(self):
        title = Text("DeFi Risk Parity — Yield Strategy Allocation",
                     font_size=26, color=GOLD).to_edge(UP, buff=0.5)
        self.play(Write(title))

        formula = MathTex(
            r"w_{\text{protocol}} \;\propto\; \frac{1}{\sigma_{\text{yield}}}",
            font_size=44, color=WHITE
        ).shift(UP * 1.6)
        desc = Text(
            "Weight each protocol inversely proportional to its yield volatility",
            font_size=18, color=TEAL
        ).next_to(formula, DOWN, buff=0.28)

        with self.voiceover(
            "Protocol yield strategies can be risk-parity weighted: assign each protocol "
            "a weight inversely proportional to its yield volatility."
        ) as tracker:
            self.play(Write(formula), run_time=0.9)
            self.play(FadeIn(desc), run_time=0.6)
            self.wait(tracker.duration - 1.5)

        # Example bar chart
        protocols = ["Aave\nUSDC", "Curve\n3pool", "GMX\nGLP", "Incentive\nFarm"]
        vols      = [0.02,          0.06,            0.18,        0.45]
        weights   = [1/v for v in vols]
        total     = sum(weights)
        weights   = [w / total for w in weights]

        axes = Axes(
            x_range=[-0.5, 3.5, 1], y_range=[0, 0.70, 0.1],
            x_length=8.0, y_length=2.8,
            axis_config={"color": GRAY, "include_numbers": False},
            tips=False
        ).shift(DOWN * 1.1)
        y_lbl = Text("RP Weight", font_size=14, color=GRAY)\
                    .next_to(axes.y_axis.get_end(), UP, buff=0.08)
        self.play(Create(axes), Write(y_lbl))

        w_bars, w_lbls = self._make_bars(axes, weights, TEAL, protocols,
                                         x_offset=0, width=0.55)
        vol_note = VGroup()
        for i, (v, w) in enumerate(zip(vols, weights)):
            vol_note.add(
                Text(f"σ={int(v*100)}%", font_size=12, color=GRAY)
                .next_to(w_bars[i], UP, buff=0.06)
            )

        with self.voiceover(
            "High-volatility incentive-heavy farms get tiny allocations. "
            "Stable lending positions like Aave USDC at 2% yield volatility "
            "get the largest allocation."
        ) as tracker:
            self.play(
                LaggedStart(*[GrowFromEdge(b, DOWN) for b in w_bars], lag_ratio=0.2),
                LaggedStart(*[FadeIn(l) for l in w_lbls], lag_ratio=0.2),
                run_time=1.2
            )
            self.play(LaggedStart(*[FadeIn(v) for v in vol_note], lag_ratio=0.2),
                      run_time=0.6)
            self.wait(tracker.duration - 1.8)

        benefit = Text(
            "Naturally reduces exposure to incentive cliff events and rug pulls\n"
            "in proportion to their historical yield volatility.",
            font_size=16, color=GOLD, line_spacing=1.3
        ).to_edge(DOWN, buff=0.45)

        with self.voiceover(
            "This naturally reduces exposure to incentive cliff events and rug pulls "
            "in proportion to their historical volatility — no manual override needed."
        ) as tracker:
            self.play(FadeIn(benefit), run_time=0.7)
            self.wait(tracker.duration - 0.7)

        clear(self)

    # ── SCENE 10: TAKEAWAY ────────────────────────────────────────────────────
    def _scene_takeaway(self):
        title = Text("Takeaway", font_size=34, color=GOLD).to_edge(UP, buff=0.5)
        self.play(Write(title))

        items = [
            ("1.", "If you can't trust return forecasts — and in most markets\n"
                   "you shouldn't — Risk Parity is the most principled default.",   TEAL),
            ("2.", "Inverse-volatility weighting is the quick practical implementation.\n"
                   "(Qian 2005  ·  Maillard et al. 2010)",                          GOLD),
            ("3.", "Pair with leverage to hit return targets — but keep leverage\n"
                   "modest enough to survive tail events.",                          WHITE),
            ("4.", "For DeFi: weight protocols by inverse yield-volatility.\n"
                   "High-vol farms get small allocations automatically.",            TEAL),
            ("5.", "Risk Parity does NOT guarantee the highest Sharpe.\n"
                   "It guarantees genuine diversification.",                         GRAY),
        ]
        rows = VGroup()
        for num, text, col in items:
            row = VGroup(
                Text(num, font_size=20, color=col, weight=BOLD),
                Text(text, font_size=17, color=WHITE, line_spacing=1.2),
            ).arrange(RIGHT, buff=0.25, aligned_edge=UP)
            rows.add(row)
        rows.arrange(DOWN, buff=0.28, aligned_edge=LEFT)\
            .shift(DOWN * 0.1 + LEFT * 0.2)

        with self.voiceover(
            "If you can't trust your return forecasts — and in most markets you shouldn't — "
            "Risk Parity is the most principled default allocation framework."
        ) as tracker:
            self.play(FadeIn(rows[0], shift=RIGHT * 0.2), run_time=0.6)
            self.wait(tracker.duration - 0.6)

        with self.voiceover(
            "Inverse-volatility weighting is the quick practical implementation. "
            "Pair it with leverage if needed to hit return targets, "
            "but always keep leverage modest enough to survive tail events."
        ) as tracker:
            self.play(FadeIn(rows[1], shift=RIGHT * 0.2), run_time=0.6)
            self.play(FadeIn(rows[2], shift=RIGHT * 0.2), run_time=0.6)
            self.wait(tracker.duration - 1.2)

        with self.voiceover(
            "For DeFi, weight protocols by inverse yield-volatility. "
            "And remember: Risk Parity does not guarantee the highest Sharpe — "
            "it guarantees genuine diversification."
        ) as tracker:
            self.play(FadeIn(rows[3], shift=RIGHT * 0.2), run_time=0.6)
            self.play(FadeIn(rows[4], shift=RIGHT * 0.2), run_time=0.6)
            self.wait(tracker.duration - 1.2)

        clear(self)

    # ── SCENE 11: CTA ─────────────────────────────────────────────────────────
    def _scene_cta(self):
        with self.voiceover(
            "Next: the Momentum Factor — why past winners keep winning, "
            "what the academic evidence says, and how to implement momentum "
            "systematically. Subscribe. QuantiFire."
        ) as tracker:
            teaser = VGroup(
                Text("Next → EP09", font_size=24, color=GRAY),
                Text("The Momentum Factor", font_size=34, color=WHITE),
                Text("Why past winners keep winning — and when they don't",
                     font_size=18, color=TEAL),
            ).arrange(DOWN, buff=0.3)
            outro = Text("QuantiFire  |  EP 08", font_size=32, color=GOLD)\
                       .to_edge(DOWN, buff=0.8)
            self.play(LaggedStart(*[FadeIn(t) for t in teaser], lag_ratio=0.4),
                      run_time=1.5)
            self.play(FadeIn(outro), run_time=0.6)
            self.wait(tracker.duration - 2.2)

    # ── HELPERS ───────────────────────────────────────────────────────────────
    @staticmethod
    def _pie_chart(pcts, colors, labels, title_str, center):
        group = VGroup()
        start = 0.0
        for pct, col, lbl in zip(pcts, colors, labels):
            angle  = pct / 100 * TAU
            sector = Sector(outer_radius=1.05, start_angle=start,
                            angle=angle, color=col, fill_opacity=0.82,
                            stroke_color=BG, stroke_width=2).shift(center)
            mid    = start + angle / 2
            lbl_t  = Text(lbl, font_size=14, color=WHITE)\
                        .move_to(center + np.array([
                            np.cos(mid) * 0.62,
                            np.sin(mid) * 0.62, 0]))
            group.add(sector, lbl_t)
            start += angle
        t = Text(title_str, font_size=18, color=GRAY)\
               .next_to(group, DOWN, buff=0.15)
        group.add(t)
        return group

    @staticmethod
    def _make_bars(axes, values, color, labels, x_offset=0.0, width=0.42):
        bars = VGroup()
        lbls = VGroup()
        for i, (val, lbl) in enumerate(zip(values, labels)):
            x0  = axes.coords_to_point(i + x_offset, 0)
            x1  = axes.coords_to_point(i + x_offset, val)
            bar = Rectangle(
                width=width,
                height=abs(x1[1] - x0[1]),
                fill_color=color, fill_opacity=0.82, stroke_width=0
            ).move_to([(x0[0] + x1[0]) / 2, (x0[1] + x1[1]) / 2, 0])
            bars.add(bar)
            lbls.add(
                Text(lbl, font_size=13, color=color, line_spacing=1.1)
                .next_to(axes.coords_to_point(i, 0), DOWN, buff=0.12)
            )
        return bars, lbls

    @staticmethod
    def _legend_item(color, label):
        sq  = Square(side_length=0.22, fill_color=color,
                     fill_opacity=0.85, stroke_width=0)
        lbl = Text(label, font_size=15, color=color).next_to(sq, RIGHT, buff=0.12)
        return VGroup(sq, lbl)
