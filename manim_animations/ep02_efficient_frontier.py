"""
QuantiFire EP02 — The Efficient Frontier: The Only Free Lunch in Finance
Run: manim -pql ep02_efficient_frontier.py EfficientFrontierScene

Every paragraph of the master script is a distinct animated scene:
  HOOK        0:00–0:30   Nobel Prize moment + title
  CONTEXT     0:30–1:00   EP01 recap → today's goal
  UNIVERSE    1:00–1:30   Asset dots + portfolio cloud
  FRONTIER    1:30–2:00   Optimization math → frontier traces out
  MVP         2:00–2:30   Minimum Variance Portfolio explained
  TANGENCY    2:30–3:00   Capital Market Line + Sharpe formula
  SUBOPTIMAL  3:00–3:20   Proving inferior portfolios exist
  ERROR       3:20–3:45   Error maximization — why MVO breaks
  ALTS        3:45–4:00   4 practical alternatives
  TAKEAWAY    4:00–4:30   "Are you on the frontier?"
  CTA         4:30–5:00   Outro + next episode
"""
from manim import *
from manim_voiceover import VoiceoverScene
from manim_voiceover.services.gtts import GTTSService
# PRODUCTION: from manim_voiceover.services.elevenlabs import ElevenLabsService
import numpy as np

GOLD = "#FFB700"; TEAL = "#00C896"; RED = "#FF4444"; BLUE = "#4A90E2"; BG = "#0D0D0D"

def frontier_mu(s):
    """Parabolic approximation of efficient frontier."""
    v = -4.5*s**2 + 3.8*s - 0.38
    return max(0.0, v)

def frontier_mu_perturbed(s):
    """Slightly different expected return estimates → wildly different frontier."""
    v = -5.2*s**2 + 4.1*s - 0.44
    return max(0.0, v)


class EfficientFrontierScene(VoiceoverScene):
    def construct(self):
        self.camera.background_color = BG
        self.set_speech_service(GTTSService(lang="en"))
        # PRODUCTION:
        # self.set_speech_service(ElevenLabsService(
        #     voice_id="pNInz6obpgDQGcFmaJgB", model="eleven_turbo_v2"))

        # ══════════════════════════════════════════════════════════════════════
        # HOOK  0:00–0:30   Nobel Prize moment
        # ══════════════════════════════════════════════════════════════════════
        title = Text("The Efficient Frontier", font_size=44, color=GOLD).to_edge(UP)

        year  = Text("1990", font_size=96, color=GOLD, weight=BOLD).move_to(ORIGIN)
        nobel = Text("Nobel Prize in Economics", font_size=28, color=WHITE)\
                  .next_to(year, DOWN, buff=0.3)
        name  = Text("Harry Markowitz", font_size=32, color=TEAL)\
                  .next_to(nobel, DOWN, buff=0.2)

        with self.voiceover(
            "In 1990, Harry Markowitz won the Nobel Prize in Economics for an idea so elegant "
            "it fits on one graph. That graph — the Efficient Frontier — proves there is exactly "
            "one set of portfolios where you are getting the maximum return for every level of "
            "risk you're willing to take. Every other portfolio is mathematically inferior. "
            "Let me show you exactly what that means."
        ) as tracker:
            self.play(Write(title))
            self.play(Write(year), run_time=0.6)
            self.play(FadeIn(nobel), FadeIn(name), run_time=0.8)
            self.wait(tracker.duration - 2.5)

        self.play(FadeOut(year, nobel, name))

        # ══════════════════════════════════════════════════════════════════════
        # CONTEXT  0:30–1:00   EP01 recap bullets
        # ══════════════════════════════════════════════════════════════════════
        recap = VGroup(
            Text("EP01 recap:", font_size=22, color=GRAY),
            MathTex(r"\sigma^2_p = w_1^2\sigma_1^2 + w_2^2\sigma_2^2 + 2w_1w_2\sigma_1\sigma_2\rho_{12}",
                    font_size=26, color=WHITE),
            Text("Today: use that formula to build the Efficient Frontier from scratch",
                 font_size=22, color=TEAL),
            Text("Goal: find the set of portfolios that are provably optimal",
                 font_size=22, color=GOLD),
        ).arrange(DOWN, buff=0.3, aligned_edge=LEFT).move_to(ORIGIN)

        with self.voiceover(
            "Welcome back to QuantiFire. Last episode we covered the portfolio variance formula — "
            "today we use it to build the Efficient Frontier from scratch. This is the backbone of "
            "Mean-Variance Optimization, and understanding it tells you immediately whether your "
            "current portfolio is optimal or if you're leaving returns on the table."
        ) as tracker:
            self.play(LaggedStartMap(FadeIn, recap, lag_ratio=0.4))
            self.wait(tracker.duration - 1.6)
        self.play(FadeOut(recap))

        # ══════════════════════════════════════════════════════════════════════
        # UNIVERSE  1:00–1:30   Asset dots + portfolio cloud
        # ══════════════════════════════════════════════════════════════════════
        axes = Axes(
            x_range=[0, 0.38, 0.05], y_range=[0, 0.22, 0.05],
            x_length=8.5, y_length=4.2,
            axis_config={"color": GRAY, "include_numbers": False},
            tips=False,
        ).shift(DOWN*0.4)

        x_label = Text("Risk  σ  (volatility)", font_size=20, color=GRAY)\
                    .next_to(axes.x_axis.get_end(), RIGHT, buff=0.1)
        y_label = Text("Return  μ", font_size=20, color=GRAY)\
                    .next_to(axes.y_axis.get_end(), UP, buff=0.08)

        # Named assets with realistic return/risk
        asset_data = [
            (0.26, 0.12, "Bonds",      BLUE),
            (0.32, 0.16, "Large Cap",  TEAL),
            (0.22, 0.09, "Gold",       GOLD),
            (0.18, 0.11, "Real Estate",WHITE),
            (0.30, 0.19, "Small Cap",  RED),
        ]

        asset_dots   = VGroup()
        asset_labels = VGroup()
        for sx, mu, nm, col in asset_data:
            pt  = axes.coords_to_point(sx, mu)
            dot = Dot(pt, color=col, radius=0.11)
            lbl = VGroup(
                Text(nm,        font_size=14, color=col),
                Text(f"σ={int(sx*100)}%  μ={int(mu*100)}%", font_size=12, color=GRAY),
            ).arrange(DOWN, buff=0.04).next_to(dot, UR, buff=0.08)
            asset_dots.add(dot)
            asset_labels.add(lbl)

        with self.voiceover(
            "Take any universe of risky assets. Each one has an expected return and a standard "
            "deviation of returns. Plot them in return-versus-risk space — each asset is a dot. "
            "Here we have bonds, large cap equities, gold, real estate, and small cap stocks — "
            "each at their own unique risk-return coordinate."
        ) as tracker:
            self.play(Create(axes), Write(x_label), Write(y_label), run_time=1.2)
            self.play(LaggedStart(
                *[AnimationGroup(FadeIn(asset_dots[i]), Write(asset_labels[i]))
                  for i in range(len(asset_data))],
                lag_ratio=0.3
            ))
            self.wait(tracker.duration - 3)

        # Portfolio cloud
        rng = np.random.default_rng(42)
        cloud_pts = []
        for _ in range(300):
            sx = rng.uniform(0.14, 0.36)
            mu = rng.uniform(0.03, sx * 0.62)
            cloud_pts.append(axes.coords_to_point(sx, mu))

        cloud = VGroup(*[Dot(p, color=WHITE, radius=0.022, fill_opacity=0.28)
                         for p in cloud_pts])
        cloud_label = Text("All possible portfolio combinations",
                           font_size=18, color=GRAY).to_corner(DR, buff=0.5)

        with self.voiceover(
            "Now consider every possible combination of those assets at every possible weight. "
            "Sixty percent bonds, forty percent equities. Ten percent gold, thirty percent small cap, "
            "sixty percent real estate. Every weight combination you can imagine. All those portfolios "
            "form a cloud of points in risk-return space."
        ) as tracker:
            self.play(LaggedStartMap(FadeIn, cloud, lag_ratio=0.005), run_time=2)
            self.play(FadeIn(cloud_label))
            self.wait(tracker.duration - 2.5)
        self.play(FadeOut(cloud_label))

        # ══════════════════════════════════════════════════════════════════════
        # FRONTIER  1:30–2:00   Optimization math → frontier traces out
        # ══════════════════════════════════════════════════════════════════════
        # Show the optimization problem
        opt_box = VGroup(
            Text("Optimization Problem:", font_size=20, color=GOLD),
            MathTex(r"\max_{\mathbf{w}} \; \mu_p = \mathbf{w}^\top \boldsymbol{\mu}",
                    font_size=22, color=TEAL),
            MathTex(r"\text{s.t.} \quad \mathbf{w}^\top \boldsymbol{\Sigma}\mathbf{w} \leq \sigma^2_{\text{target}}",
                    font_size=22, color=WHITE),
            MathTex(r"\sum_i w_i = 1, \quad w_i \geq 0",
                    font_size=22, color=WHITE),
            Text("Sweep σ_target low → high to trace the frontier",
                 font_size=18, color=GRAY),
        ).arrange(DOWN, buff=0.2, aligned_edge=LEFT)\
         .add_background_rectangle(color=BG, opacity=0.9, buff=0.2)\
         .to_corner(UL, buff=0.3)

        frontier_curve = axes.plot(
            frontier_mu, x_range=[0.097, 0.32, 0.002],
            color=GOLD, stroke_width=3.5
        )
        frontier_lbl = Text("Efficient Frontier", font_size=20, color=GOLD)\
                         .next_to(axes.coords_to_point(0.30, 0.178), RIGHT, buff=0.08)

        with self.voiceover(
            "The math: we solve an optimization problem. Maximize expected return mu-p equals "
            "w-transpose mu, subject to: portfolio variance at or below a target, all weights "
            "summing to one, and any constraints like long-only. As we sweep the variance target "
            "from low to high, we trace out the frontier — shown here in gold as it emerges from "
            "the left edge of the cloud."
        ) as tracker:
            self.play(FadeIn(opt_box), run_time=1)
            self.play(Create(frontier_curve), run_time=tracker.duration - 1.5)
            self.play(Write(frontier_lbl))
        self.play(FadeOut(opt_box))

        # ══════════════════════════════════════════════════════════════════════
        # MVP  2:00–2:30
        # ══════════════════════════════════════════════════════════════════════
        mvp_s  = 0.097
        mvp_mu = frontier_mu(mvp_s)
        mvp_pt = axes.coords_to_point(mvp_s, mvp_mu)

        mvp_dot    = Dot(mvp_pt, color=TEAL, radius=0.14)
        mvp_ring   = Circle(radius=0.25, color=TEAL, stroke_width=2).move_to(mvp_pt)
        # Keep MVP label compact and anchored safely above the dot
        mvp_label  = VGroup(
            Text("Minimum Variance Portfolio", font_size=17, color=TEAL, weight=BOLD),
            Text("Lowest achievable risk", font_size=14, color=WHITE),
            Text("Less estimation error → often outperforms", font_size=14, color=GRAY),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.08)\
         .next_to(mvp_dot, UR, buff=0.15)

        with self.voiceover(
            "Two special portfolios live on this frontier that every quant knows by name. "
            "First: the Minimum Variance Portfolio — the leftmost point on the curve."
        ) as tracker:
            self.play(FadeIn(mvp_dot, scale=2), run_time=0.5)
            self.play(Create(mvp_ring), run_time=0.6)
            self.play(FadeOut(mvp_ring))
            self.wait(tracker.duration - 1.2)

        with self.voiceover(
            "This is the portfolio with the absolute lowest achievable risk across all possible "
            "weight combinations. You don't choose the return here — the math finds it for you. "
            "Because it doesn't rely on noisy return forecasts, it often outperforms "
            "higher-return targets on real out-of-sample data."
        ) as tracker:
            self.play(FadeIn(mvp_label), run_time=1)
            self.wait(tracker.duration - 1)

        # ══════════════════════════════════════════════════════════════════════
        # TANGENCY  2:30–3:00   CML + Sharpe formula
        # ══════════════════════════════════════════════════════════════════════
        rf       = 0.03
        tan_s    = 0.21
        tan_mu   = frontier_mu(tan_s)
        rf_pt    = axes.coords_to_point(0, rf)
        tan_pt   = axes.coords_to_point(tan_s, tan_mu)

        rf_dot   = Dot(rf_pt, color=WHITE, radius=0.09)
        rf_lbl   = Text("r_f = 3%", font_size=16, color=WHITE)\
                     .next_to(rf_pt, LEFT, buff=0.12)

        # Capital Market Line extended beyond tangency
        extend   = 0.5
        end_pt   = tan_pt + (tan_pt - rf_pt) * extend
        cml      = DashedLine(rf_pt, end_pt, color=RED, stroke_width=2, dash_length=0.12)
        cml_lbl  = Text("Capital Market Line", font_size=16, color=RED)\
                     .next_to(end_pt, RIGHT, buff=0.08)

        tan_dot  = Dot(tan_pt, color=RED, radius=0.14)
        tan_ring = Circle(radius=0.25, color=RED, stroke_width=2).move_to(tan_pt)
        tan_lbl  = VGroup(
            Text("Tangency Portfolio", font_size=18, color=RED, weight=BOLD),
            Text("Highest Sharpe Ratio of any risky portfolio", font_size=15, color=WHITE),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.08)\
         .next_to(tan_dot, UR, buff=0.12)

        sharpe_formula = VGroup(
            Text("Sharpe Ratio:", font_size=18, color=GOLD),
            MathTex(r"S = \frac{\mu_p - r_f}{\sigma_p}", font_size=32, color=GOLD),
            Text("Tangency portfolio maximises S", font_size=16, color=WHITE),
        ).arrange(DOWN, buff=0.15)\
         .add_background_rectangle(color=BG, opacity=0.9, buff=0.2)\
         .to_corner(DR, buff=0.3)

        # Clear MVP label before Tangency to prevent accumulation
        self.play(FadeOut(mvp_label), run_time=0.4)

        with self.voiceover(
            "Second: the Tangency Portfolio. Draw a line from the risk-free rate — the T-bill yield, "
            "say three percent — tangent to the efficient frontier."
        ) as tracker:
            self.play(FadeIn(rf_dot), Write(rf_lbl), run_time=0.6)
            self.play(Create(cml), Write(cml_lbl), run_time=1.2)
            self.play(FadeIn(tan_dot, scale=2), Create(tan_ring), run_time=0.6)
            self.play(FadeOut(tan_ring))
            self.wait(tracker.duration - 2.5)

        with self.voiceover(
            "The point of tangency has the highest Sharpe Ratio of any risky portfolio: "
            "return minus the risk-free rate, divided by volatility. In theory, every rational "
            "investor should hold exactly this portfolio combined with cash. In practice, "
            "estimating the true tangency point is hypersensitive to your expected return forecasts."
        ) as tracker:
            self.play(Write(tan_lbl), FadeIn(sharpe_formula), run_time=1)
            self.wait(tracker.duration - 1)
        self.play(FadeOut(sharpe_formula))

        # ══════════════════════════════════════════════════════════════════════
        # SUBOPTIMAL  3:00–3:20   Show a dominated portfolio visually
        # ══════════════════════════════════════════════════════════════════════
        # Use sub_s=0.20 so frontier_mu(0.20)=0.20 stays inside y_range [0, 0.22]
        sub_s   = 0.20
        sub_mu  = 0.07
        sub_pt  = axes.coords_to_point(sub_s, sub_mu)
        sub_dot = Dot(sub_pt, color=WHITE, radius=0.10, fill_opacity=0.6)

        # Same risk, higher return on frontier — clipped to y_range max
        same_s_mu     = min(frontier_mu(sub_s), 0.21)   # 0.20 — safely inside y_range
        same_risk_pt  = axes.coords_to_point(sub_s, same_s_mu)
        up_arrow      = Arrow(sub_pt, same_risk_pt, color=TEAL,
                              buff=0.05, stroke_width=3, max_tip_length_to_length_ratio=0.15)
        up_lbl        = Text("Same risk,\nmore return", font_size=15, color=TEAL)\
                          .next_to(same_risk_pt, RIGHT, buff=0.12)

        # Same return, less risk — σ where frontier_mu ≈ 0.07 → ≈ 0.135
        same_mu_s    = 0.135
        same_ret_pt  = axes.coords_to_point(same_mu_s, sub_mu)
        left_arrow   = Arrow(sub_pt, same_ret_pt, color=GOLD,
                             buff=0.05, stroke_width=3, max_tip_length_to_length_ratio=0.15)
        # Place label LEFT of target point (not DOWN) to stay in frame
        left_lbl     = Text("Same return,\nless risk", font_size=15, color=GOLD)\
                         .next_to(same_ret_pt, LEFT, buff=0.12)

        sub_cross = Cross(sub_dot, color=RED, stroke_width=3)

        with self.voiceover(
            "Here is the power of the framework. This white dot is a portfolio sitting below the "
            "frontier — it is provably inferior."
        ) as tracker:
            self.play(FadeIn(sub_dot))
            self.play(Create(sub_cross))
            self.wait(tracker.duration - 1.2)

        with self.voiceover(
            "Move straight up — same risk, dramatically more return. "
            "Move straight left — same return, far less risk. "
            "Either move makes you better off. There is no rational reason to stay here."
        ) as tracker:
            self.play(Create(up_arrow), Write(up_lbl), run_time=1)
            self.play(Create(left_arrow), Write(left_lbl), run_time=1)
            self.wait(tracker.duration - 2)
        self.play(FadeOut(sub_dot, sub_cross, up_arrow, up_lbl, left_arrow, left_lbl))

        # ══════════════════════════════════════════════════════════════════════
        # ERROR MAXIMIZATION  3:20–3:45
        # ══════════════════════════════════════════════════════════════════════
        # Original frontier already drawn in gold.
        # Draw a slightly perturbed frontier to show error magnification.
        perturbed_frontier = axes.plot(
            frontier_mu_perturbed, x_range=[0.097, 0.30, 0.002],
            color=RED, stroke_width=2.5
        )
        perturbed_lbl = Text("Small input change\n→ wildly different frontier",
                             font_size=16, color=RED)\
                          .next_to(axes.coords_to_point(0.22, 0.19), UP, buff=0.1)

        error_label = VGroup(
            Text('"Error Maximization"', font_size=22, color=RED, weight=BOLD),
            Text("MVO amplifies estimation errors in expected returns",
                 font_size=18, color=WHITE),
            Text("Small Δμ  →  large Δw  →  very different portfolio",
                 font_size=18, color=GRAY),
        ).arrange(DOWN, buff=0.2, aligned_edge=LEFT)\
         .add_background_rectangle(color=BG, opacity=0.9, buff=0.2)\
         .to_corner(UL, buff=0.3)

        with self.voiceover(
            "But here is the critical practical insight: the frontier is only as good as your inputs. "
            "The three inputs are expected returns mu, the covariance matrix Sigma, and constraints. "
            "Estimation error in mu — even tiny errors — causes the optimizer to produce wildly "
            "different portfolios. Watch: change the expected return estimates by just a few basis "
            "points, and the frontier shifts dramatically. This is called the error maximization "
            "property of MVO — the optimizer finds the portfolio most exposed to your estimation "
            "mistakes."
        ) as tracker:
            self.play(FadeIn(error_label), run_time=0.8)
            self.play(Create(perturbed_frontier), run_time=1.5)
            self.play(Write(perturbed_lbl))
            self.wait(tracker.duration - 3.8)
        self.play(FadeOut(error_label, perturbed_frontier, perturbed_lbl))

        # ══════════════════════════════════════════════════════════════════════
        # ALTS  3:45–4:00   4 practical alternatives
        # ══════════════════════════════════════════════════════════════════════
        alts_title = Text("Why Practitioners Use These Instead:", font_size=22, color=GOLD)\
                       .next_to(title, DOWN, buff=0.35)
        alts = VGroup(
            VGroup(
                Text("1. Resampled Frontiers (Michaud)", font_size=20, color=TEAL, weight=BOLD),
                Text("    Average frontiers over many bootstrap samples → more stable weights",
                     font_size=17, color=WHITE),
            ).arrange(DOWN, aligned_edge=LEFT, buff=0.06),
            VGroup(
                Text("2. Black-Litterman  (EP 06)", font_size=20, color=BLUE, weight=BOLD),
                Text("    Blend your views with market equilibrium prior → shrinks estimation error",
                     font_size=17, color=WHITE),
            ).arrange(DOWN, aligned_edge=LEFT, buff=0.06),
            VGroup(
                Text("3. Robust Optimization", font_size=20, color=GOLD, weight=BOLD),
                Text("    Treat inputs as uncertainty ranges, not point estimates → worst-case stable",
                     font_size=17, color=WHITE),
            ).arrange(DOWN, aligned_edge=LEFT, buff=0.06),
            VGroup(
                Text("4. Hierarchical Risk Parity  (EP 10)", font_size=20, color=RED, weight=BOLD),
                Text("    Skip return forecasting entirely — allocate by risk clustering",
                     font_size=17, color=WHITE),
            ).arrange(DOWN, aligned_edge=LEFT, buff=0.06),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.28)\
         .next_to(alts_title, DOWN, buff=0.3)

        # Clear the chart clutter first
        self.play(
            FadeOut(cloud, asset_dots, asset_labels, frontier_curve, frontier_lbl,
                    mvp_dot, mvp_label, rf_dot, rf_lbl, cml, cml_lbl,
                    tan_dot, tan_lbl, axes, x_label, y_label),
            run_time=0.5
        )

        with self.voiceover(
            "That's why practitioners today rarely use raw Mean-Variance Optimization with point "
            "estimates. Instead they use: Resampled Frontiers, which average across many bootstrap "
            "samples; Black-Litterman, which blends your views with market equilibrium — that's "
            "Episode 6; Robust Optimization, which treats inputs as ranges not point estimates; or "
            "Hierarchical Risk Parity, which skips return forecasting entirely — Episode 10. Each "
            "of these directly addresses the fragility at the heart of classical MVO."
        ) as tracker:
            self.play(FadeIn(alts_title))
            self.play(LaggedStartMap(FadeIn, alts, lag_ratio=0.3))
            self.wait(tracker.duration - 1.3)
        self.play(FadeOut(alts_title, alts))

        # ══════════════════════════════════════════════════════════════════════
        # TAKEAWAY  4:00–4:30
        # ══════════════════════════════════════════════════════════════════════
        # Re-draw a clean frontier for the takeaway
        axes2 = Axes(
            x_range=[0, 0.38, 0.05], y_range=[0, 0.22, 0.05],
            x_length=5, y_length=3,
            axis_config={"color": GRAY, "include_numbers": False},
            tips=False,
        ).shift(RIGHT*2.5 + DOWN*0.3)

        frontier2 = axes2.plot(
            frontier_mu, x_range=[0.097, 0.32, 0.002],
            color=GOLD, stroke_width=3
        )
        you_dot  = Dot(axes2.coords_to_point(0.25, 0.08), color=RED, radius=0.12)
        you_lbl  = Text("You?", font_size=16, color=RED).next_to(you_dot, DOWN, buff=0.1)
        q_arrow  = Arrow(you_dot.get_top(),
                         axes2.coords_to_point(0.25, frontier_mu(0.25)) + DOWN*0.1,
                         color=TEAL, buff=0.05, stroke_width=2.5,
                         max_tip_length_to_length_ratio=0.18)

        takeaway_text = VGroup(
            Text("The Efficient Frontier:", font_size=19, color=GOLD),
            Text("right framework even when", font_size=19, color=GOLD),
            Text("pure MVO is fragile.", font_size=19, color=GOLD),
            Text("Always ask:", font_size=18, color=WHITE),
            Text('"Am I on the frontier,', font_size=19, color=TEAL, slant=ITALIC),
            Text('or below it?"', font_size=19, color=TEAL, slant=ITALIC),
            Text("Below = suboptimal =", font_size=16, color=WHITE),
            Text("leaving returns on the table.", font_size=16, color=WHITE),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.14)\
         .next_to(axes2, LEFT, buff=0.35)\
         .align_to(axes2, UP)

        box = SurroundingRectangle(
            VGroup(takeaway_text[4], takeaway_text[5]),
            color=TEAL, buff=0.12, corner_radius=0.08
        )

        with self.voiceover(
            "The Efficient Frontier is the right framework even if pure MVO is fragile in practice. "
            "Always ask: given my risk tolerance, am I on the frontier or below it? Any portfolio "
            "below the frontier is provably suboptimal — you could get more return for the same risk, "
            "or equal return with less risk. That question forces discipline into every allocation "
            "decision you will ever make."
        ) as tracker:
            self.play(Create(axes2), Create(frontier2), run_time=1)
            self.play(FadeIn(you_dot), Write(you_lbl))
            self.play(GrowArrow(q_arrow))
            self.play(FadeIn(takeaway_text), run_time=1.5)
            self.play(Create(box))
            self.wait(tracker.duration - 5)

        # ══════════════════════════════════════════════════════════════════════
        # CTA  4:30–5:00
        # ══════════════════════════════════════════════════════════════════════
        with self.voiceover(
            "Next episode: Sharpe Ratio versus Sortino Ratio — which metric should you actually "
            "optimize, and when does the Sharpe Ratio lie to you? Subscribe so you don't miss it. "
            "QuantiFire — the math is real, the edge is yours."
        ) as tracker:
            self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.8)
            outro   = Text("QuantiFire  |  EP 02", font_size=34, color=GOLD).move_to(ORIGIN)
            next_ep = Text("Next → EP 03: Sharpe vs Sortino — when does Sharpe lie?",
                           font_size=20, color=WHITE).next_to(outro, DOWN, buff=0.4)
            self.play(FadeIn(outro), FadeIn(next_ep))
            self.wait(tracker.duration - 0.8)
