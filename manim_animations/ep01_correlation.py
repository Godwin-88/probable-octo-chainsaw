"""
QuantiFire EP01 — Why Correlation Matters More Than Returns
Run: manim -pql ep01_correlation.py CorrelationScene
Audio: AI voiceover via manim-voiceover (swap service below for ElevenLabs)

Covers ALL script sections:
  HOOK       0:00–0:30  title + hook
  CONTEXT    0:30–1:00  welcome text
  FORMULA    1:00–1:30  portfolio variance formula, rho range
  EXAMPLE    1:30–2:30  Asset A vs B table → portfolio vol bar chart at rho=-0.5
  SLIDER     2:30–3:10  animated rho slider
  MATRIX     3:10–3:30  wT Sigma w generalisation
  BREAKDOWN  3:30–4:00  correlation breakdown (normal vs crisis)
  TAKEAWAY   4:00–4:30  key insight box
  CTA        4:30–5:00  outro
"""
from manim import *
from manim_voiceover import VoiceoverScene
from manim_voiceover.services.gtts import GTTSService
# PRODUCTION: from manim_voiceover.services.elevenlabs import ElevenLabsService
import numpy as np

GOLD = "#FFB700"; TEAL = "#00C896"; RED = "#FF4444"; BLUE = "#4A90E2"; BG = "#0D0D0D"

# ── Shared asset parameters ─────────────────────────────────────────────────
W1, W2       = 0.5, 0.5
SIG1, SIG2   = 0.20, 0.15        # Asset A/B volatility
RHO_EX       = -0.5              # example correlation

def portfolio_var(rho, w1=W1, w2=W2, s1=SIG1, s2=SIG2):
    return w1**2*s1**2 + w2**2*s2**2 + 2*w1*w2*s1*s2*rho

def portfolio_vol(rho):
    return np.sqrt(portfolio_var(rho))


class CorrelationScene(VoiceoverScene):
    def construct(self):
        self.camera.background_color = BG
        self.set_speech_service(GTTSService(lang="en"))
        # PRODUCTION:
        # self.set_speech_service(ElevenLabsService(
        #     voice_id="pNInz6obpgDQGcFmaJgB", model="eleven_turbo_v2"))

        # ══════════════════════════════════════════════════════════════════════
        # HOOK  0:00–0:30
        # ══════════════════════════════════════════════════════════════════════
        title = Text("Why Correlation Matters", font_size=44, color=GOLD).to_edge(UP)
        sub   = Text("More Than Returns", font_size=32, color=WHITE)\
                  .next_to(title, DOWN, buff=0.1)

        with self.voiceover(
            "What if I told you that adding a losing asset to your portfolio could make you more money? "
            "Sounds insane. But this is exactly what modern portfolio theory proves — and it's the reason "
            "every hedge fund on Wall Street obsesses over one number above all others: correlation."
        ) as tracker:
            self.play(Write(title), FadeIn(sub, shift=UP*0.3), run_time=tracker.duration)
        self.play(FadeOut(sub))

        # ══════════════════════════════════════════════════════════════════════
        # CONTEXT  0:30–1:00
        # ══════════════════════════════════════════════════════════════════════
        context_bullets = VGroup(
            Text("✦  The actual formula quants use", font_size=22, color=WHITE),
            Text("✦  Why identical-return stocks differ in portfolios", font_size=22, color=WHITE),
            Text("✦  The one number that controls diversification", font_size=22, color=GOLD),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.3).move_to(ORIGIN)

        with self.voiceover(
            "Welcome to QuantiFire. Today we're breaking down the math behind portfolio diversification "
            "— not the hand-wavy don't put all your eggs in one basket version, but the actual formula "
            "quants use to build multi-billion dollar portfolios. By the end of this video, you'll "
            "understand why two stocks with identical returns can produce completely different portfolio "
            "outcomes depending on how they move together."
        ) as tracker:
            self.play(LaggedStartMap(FadeIn, context_bullets, lag_ratio=0.4))
            self.wait(tracker.duration - 1.2)
        self.play(FadeOut(context_bullets))

        # ══════════════════════════════════════════════════════════════════════
        # FORMULA  1:00–1:30
        # ══════════════════════════════════════════════════════════════════════
        formula = MathTex(
            r"\sigma^2_p",
            r"= ",
            r"w_1^2\sigma_1^2 + w_2^2\sigma_2^2",
            r"+ \ 2w_1 w_2 \sigma_1 \sigma_2 \,",
            r"\rho_{12}",
            font_size=38
        ).next_to(title, DOWN, buff=0.6)
        formula[2].set_color(BLUE)   # own-risk terms
        formula[3].set_color(TEAL)   # cross coefficient
        formula[4].set_color(GOLD)   # rho

        # Term labels
        own_brace  = Brace(formula[2], DOWN, color=BLUE)
        own_lbl    = Text("Own risk of each position", font_size=18, color=BLUE)\
                       .next_to(own_brace, DOWN, buff=0.1)
        cross_brace= Brace(VGroup(formula[3], formula[4]), DOWN, color=GOLD)
        cross_lbl  = Text("Cross term — controlled by rho", font_size=18, color=GOLD)\
                       .next_to(cross_brace, DOWN, buff=0.1)

        with self.voiceover(
            "The portfolio variance formula has three parts. The first two terms, shown in blue, capture "
            "each asset's individual risk weighted by allocation — those are fixed once you choose your "
            "positions. The critical third part is the cross term in teal and gold: two times the weights "
            "times the individual volatilities times rho. When rho is high, this term inflates total "
            "portfolio risk. When rho is low or negative, this term shrinks it. That single number rho "
            "determines whether diversification actually works."
        ) as tracker:
            self.play(Write(formula), run_time=2)
            self.play(
                GrowFromCenter(own_brace), FadeIn(own_lbl),
                GrowFromCenter(cross_brace), FadeIn(cross_lbl),
                run_time=1.5
            )
            self.wait(tracker.duration - 3.5)
        self.play(FadeOut(own_brace, own_lbl, cross_brace, cross_lbl))

        # ── rho range: three key values ──────────────────────────────────────
        rho_states = VGroup(
            VGroup(
                Text("ρ = +1", font_size=26, color=RED),
                Text("Perfect lockstep  →  zero diversification benefit", font_size=20, color=RED),
            ).arrange(RIGHT, buff=0.4),
            VGroup(
                Text("ρ =  0", font_size=26, color=WHITE),
                Text("Uncorrelated  →  cross term vanishes", font_size=20, color=WHITE),
            ).arrange(RIGHT, buff=0.4),
            VGroup(
                Text("ρ = −1", font_size=26, color=TEAL),
                Text("Exact opposition  →  risk can reach zero", font_size=20, color=TEAL),
            ).arrange(RIGHT, buff=0.4),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.3).shift(DOWN*1.2)

        with self.voiceover(
            "Correlation runs from negative one to positive one. When rho is plus one, assets "
            "move in perfect lockstep — you get no diversification benefit whatsoever. When rho is "
            "zero, the cross term vanishes and you get the maximum free diversification. When rho is "
            "negative one, assets move in exact opposition — you can actually eliminate risk entirely "
            "with the right weights."
        ) as tracker:
            self.play(LaggedStartMap(FadeIn, rho_states, lag_ratio=0.5))
            self.wait(tracker.duration - 1.5)
        self.play(FadeOut(rho_states, formula))

        # ══════════════════════════════════════════════════════════════════════
        # EXAMPLE  1:30–2:30   Asset A vs B table  →  bar chart at ρ = −0.5
        # ══════════════════════════════════════════════════════════════════════
        ex_title = Text("The Counterintuitive Example", font_size=28, color=GOLD)\
                     .next_to(title, DOWN, buff=0.35)

        # ── Step 1: show individual asset stats ──────────────────────────────
        asset_data = VGroup(
            # Asset A card
            VGroup(
                Text("Asset A", font_size=26, color=GOLD),
                VGroup(
                    Text("Return:",     font_size=20, color=GRAY),
                    Text("8%",          font_size=26, color=TEAL),
                ).arrange(RIGHT, buff=0.25),
                VGroup(
                    Text("Volatility:", font_size=20, color=GRAY),
                    Text("20%",         font_size=26, color=RED),
                ).arrange(RIGHT, buff=0.25),
                VGroup(
                    Text("Sharpe:",     font_size=20, color=GRAY),
                    Text("0.40",        font_size=26, color=WHITE),
                ).arrange(RIGHT, buff=0.25),
            ).arrange(DOWN, aligned_edge=LEFT, buff=0.18)
             .add_background_rectangle(color=DARK_GRAY, opacity=0.5, buff=0.25),

            # Asset B card
            VGroup(
                Text("Asset B", font_size=26, color=BLUE),
                VGroup(
                    Text("Return:",     font_size=20, color=GRAY),
                    Text("4%",          font_size=26, color=TEAL),
                ).arrange(RIGHT, buff=0.25),
                VGroup(
                    Text("Volatility:", font_size=20, color=GRAY),
                    Text("15%",         font_size=26, color=RED),
                ).arrange(RIGHT, buff=0.25),
                VGroup(
                    Text("Sharpe:",     font_size=20, color=GRAY),
                    Text("0.27",        font_size=26, color=WHITE),
                ).arrange(RIGHT, buff=0.25),
            ).arrange(DOWN, aligned_edge=LEFT, buff=0.18)
             .add_background_rectangle(color=DARK_GRAY, opacity=0.5, buff=0.25),
        ).arrange(RIGHT, buff=0.7).shift(DOWN*0.4)

        with self.voiceover(
            "Here is the counterintuitive part. Suppose Asset A returns eight percent with twenty percent "
            "volatility — a Sharpe ratio of 0.40. Asset B returns only four percent with fifteen percent "
            "volatility — a Sharpe of 0.27. By every standalone metric, Asset B is clearly inferior. "
            "It has lower return and lower Sharpe. A naive investor throws it out immediately."
        ) as tracker:
            self.play(FadeIn(ex_title))
            self.play(FadeIn(asset_data[0], shift=LEFT*0.3), run_time=1)
            self.play(FadeIn(asset_data[1], shift=RIGHT*0.3), run_time=1)
            self.wait(tracker.duration - 2)

        # ── Step 2: reveal portfolio stats at ρ = −0.5 ──────────────────────
        # Portfolio vol at rho=-0.5:
        # var = 0.25*0.04 + 0.25*0.0225 + 2*0.5*0.5*0.2*0.15*(-0.5)
        #     = 0.01 + 0.005625 - 0.0075 = 0.008125
        # vol = sqrt(0.008125) ≈ 9.01%
        # return = 6%, sharpe = 6/9 = 0.667

        port_card = VGroup(
            Text("50/50 Portfolio  (ρ = −0.5)", font_size=22, color=TEAL),
            VGroup(
                Text("Return:",     font_size=20, color=GRAY),
                Text("6%",          font_size=26, color=TEAL),
            ).arrange(RIGHT, buff=0.25),
            VGroup(
                Text("Volatility:", font_size=20, color=GRAY),
                Text("9.0%",        font_size=26, color=TEAL),  # < 15% AND < 20%
            ).arrange(RIGHT, buff=0.25),
            VGroup(
                Text("Sharpe:",     font_size=20, color=GRAY),
                Text("0.67  ↑",     font_size=26, color=GOLD),
            ).arrange(RIGHT, buff=0.25),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.18)\
         .add_background_rectangle(color=ManimColor("#003322"), opacity=0.8, buff=0.25)\
         .next_to(asset_data, DOWN, buff=0.5)

        vol_calc_line = VGroup(
            MathTex(r"\sigma_p = \sqrt{(0.5)^2(20\%)^2 + (0.5)^2(15\%)^2 + 2(0.5)(0.5)(20\%)(15\%)(-0.5)}",
                    font_size=20, color=WHITE),
            MathTex(r"= \sqrt{0.0081} \approx 9.0\%", font_size=24, color=TEAL),
        ).arrange(DOWN, buff=0.15).next_to(port_card, DOWN, buff=0.3)

        with self.voiceover(
            "But if Asset A and Asset B have a correlation of negative 0.5, combining them fifty-fifty "
            "produces a portfolio returning six percent with only nine percent volatility. That is lower "
            "than Asset B's fifteen percent and dramatically lower than Asset A's twenty percent. "
            "The Sharpe ratio jumps to 0.67 — nearly double Asset A's standalone number. "
            "The weak asset earned its place through negative correlation."
        ) as tracker:
            self.play(FadeIn(port_card, shift=DOWN*0.2), run_time=1)
            self.play(Write(vol_calc_line), run_time=2)
            self.wait(tracker.duration - 3)

        self.play(FadeOut(asset_data, port_card, vol_calc_line, ex_title))

        # ── Step 3: bar chart — volatility comparison ────────────────────────
        bar_title = Text("Portfolio Vol < Both Individual Vols", font_size=26, color=GOLD)\
                      .next_to(title, DOWN, buff=0.4)

        axes = Axes(
            x_range=[0, 4, 1], y_range=[0, 0.25, 0.05],
            x_length=7, y_length=3.5,
            axis_config={"color": GRAY, "include_numbers": False},
            tips=False,
        ).shift(DOWN*0.7)
        # Override y labels to show percentages correctly
        y_labels = VGroup(*[
            Text(f"{int(v*100)}%", font_size=16, color=GRAY)
              .next_to(axes.coords_to_point(0, v), LEFT, buff=0.1)
            for v in [0.05, 0.10, 0.15, 0.20, 0.25]
        ])

        def make_bar(x_center, height, color, label_str, val_str):
            bar = Rectangle(
                width=0.9,
                height=axes.coords_to_point(0, height)[1] - axes.coords_to_point(0, 0)[1],
                fill_color=color, fill_opacity=0.85, stroke_width=0
            ).move_to(axes.coords_to_point(x_center, height/2))
            lbl = Text(label_str, font_size=18, color=color)\
                    .next_to(axes.coords_to_point(x_center, 0), DOWN, buff=0.15)
            val = Text(val_str, font_size=20, color=WHITE)\
                    .next_to(bar, UP, buff=0.1)
            return bar, lbl, val

        bar_a, lbl_a, val_a = make_bar(1, 0.20, RED,  "Asset A",    "20%")
        bar_b, lbl_b, val_b = make_bar(2, 0.15, BLUE, "Asset B",    "15%")
        bar_p, lbl_p, val_p = make_bar(3, 0.09, TEAL, "Portfolio\n(ρ=−0.5)", "9%")

        star = Text("← Lower than both!", font_size=18, color=GOLD)\
                 .next_to(val_p, RIGHT, buff=0.15)

        with self.voiceover(
            "Look at this bar chart. Asset A carries twenty percent volatility. Asset B fifteen percent. "
            "The combined portfolio at negative 0.5 correlation carries only nine percent volatility — "
            "less than half of Asset A and well below Asset B. This is the free lunch of diversification. "
            "You are not just averaging the risks — you are cancelling them."
        ) as tracker:
            self.play(FadeIn(bar_title), Create(axes), FadeIn(y_labels))
            self.play(GrowFromEdge(bar_a, DOWN), FadeIn(lbl_a), FadeIn(val_a))
            self.play(GrowFromEdge(bar_b, DOWN), FadeIn(lbl_b), FadeIn(val_b))
            self.play(GrowFromEdge(bar_p, DOWN), FadeIn(lbl_p), FadeIn(val_p))
            self.play(FadeIn(star))
            self.wait(tracker.duration - 4)

        self.play(FadeOut(bar_title, axes, y_labels,
                          bar_a, lbl_a, val_a,
                          bar_b, lbl_b, val_b,
                          bar_p, lbl_p, val_p, star))

        # ══════════════════════════════════════════════════════════════════════
        # SLIDER  2:30–3:10   rho slider → watch variance drop
        # ══════════════════════════════════════════════════════════════════════
        formula2 = MathTex(
            r"\sigma^2_p = w_1^2\sigma_1^2 + w_2^2\sigma_2^2 + ",
            r"2w_1 w_2 \sigma_1 \sigma_2 \,",
            r"\rho_{12}",
            font_size=32
        ).next_to(title, DOWN, buff=0.5)
        formula2[1].set_color(TEAL)
        formula2[2].set_color(GOLD)
        self.play(FadeIn(formula2))

        slider_label = Text("ρ =", font_size=28, color=WHITE).shift(LEFT*4.5 + DOWN*0.6)
        rho_val = DecimalNumber(1.0, num_decimal_places=2, font_size=34, color=GOLD)\
                    .next_to(slider_label, RIGHT, buff=0.15)

        track    = Line(LEFT*3 + DOWN*0.6, RIGHT*1 + DOWN*0.6, color=DARK_GRAY)
        dot      = Dot(RIGHT*1 + DOWN*0.6, color=GOLD, radius=0.12)

        var_label = Text("Portfolio Vol:", font_size=22, color=WHITE).shift(DOWN*1.7 + LEFT*2.5)
        var_val   = DecimalNumber(
            portfolio_vol(1.0)*100, num_decimal_places=1,
            font_size=30, color=RED
        ).next_to(var_label, RIGHT, buff=0.2)
        pct_sign  = Text("%", font_size=28, color=RED).next_to(var_val, RIGHT, buff=0.05)

        sig_a_line = VGroup(
            Text("Asset A vol = 20%", font_size=18, color=RED),
        ).shift(DOWN*2.5 + LEFT*1)
        sig_b_line = VGroup(
            Text("Asset B vol = 15%", font_size=18, color=BLUE),
        ).shift(DOWN*3.0 + LEFT*1)

        self.play(
            Create(track), FadeIn(dot),
            Write(slider_label), Write(rho_val),
            Write(var_label), Write(var_val), Write(pct_sign),
            FadeIn(sig_a_line), FadeIn(sig_b_line),
        )

        def update_rho(mob, alpha):
            rho = 1 - 2*alpha
            mob.set_value(rho)
            dot.move_to(track.point_from_proportion(1 - alpha))
            v = portfolio_vol(rho) * 100
            var_val.set_value(v)
            pct_sign.next_to(var_val, RIGHT, buff=0.05)
            c = interpolate_color(ManimColor(RED), ManimColor(TEAL), alpha)
            var_val.set_color(c)
            pct_sign.set_color(c)

        with self.voiceover(
            "Watch what happens as we slide correlation from positive one down to negative one. "
            "At positive one — perfect lockstep — the portfolio carries seventeen point five percent "
            "volatility, which is just the weighted average of the two assets. As correlation falls, "
            "the variance shrinks. At zero, we hit twelve point five percent. At negative 0.5, nine "
            "percent — below both individual assets. And at negative one, you could construct a portfolio "
            "with near-zero volatility. This is the mathematical proof of diversification."
        ) as tracker:
            self.play(
                UpdateFromAlphaFunc(rho_val, update_rho),
                run_time=tracker.duration, rate_func=linear
            )

        self.play(FadeOut(slider_label, rho_val, track, dot,
                          var_label, var_val, pct_sign,
                          sig_a_line, sig_b_line, formula2))

        # ══════════════════════════════════════════════════════════════════════
        # MATRIX FORM  3:10–3:30
        # ══════════════════════════════════════════════════════════════════════
        matrix_form = VGroup(
            Text("Scale to N assets:", font_size=22, color=GRAY).shift(UP*0.3),
            MathTex(r"\sigma^2_p = \mathbf{w}^\top \boldsymbol{\Sigma} \mathbf{w}",
                    font_size=48, color=GOLD),
            Text("w = weight vector    Σ = N×N covariance matrix", font_size=20, color=WHITE),
        ).arrange(DOWN, buff=0.35).move_to(ORIGIN)

        sigma_desc = VGroup(
            Text("Σ contains:", font_size=20, color=GRAY),
            Text("  • diagonal: individual variances", font_size=20, color=BLUE),
            Text("  • off-diagonal: all pairwise covariances", font_size=20, color=GOLD),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.15).next_to(matrix_form, DOWN, buff=0.3)

        with self.voiceover(
            "Now scale this up. In a portfolio of N assets, the covariance matrix Sigma is an N by N "
            "grid of all pairwise correlations and variances. Portfolio variance becomes w-transpose "
            "Sigma w — where w is your weight vector. The diagonal holds each asset's own variance. "
            "Every off-diagonal entry is a cross term controlled by correlation. This one equation is "
            "the foundation of every optimizer from Markowitz's 1952 paper to the 500 billion dollar "
            "quant funds running today."
        ) as tracker:
            self.play(FadeIn(matrix_form), run_time=1.5)
            self.play(FadeIn(sigma_desc), run_time=1)
            self.wait(tracker.duration - 2.5)

        self.play(FadeOut(matrix_form, sigma_desc))

        # ══════════════════════════════════════════════════════════════════════
        # CORRELATION BREAKDOWN  3:30–4:00
        # ══════════════════════════════════════════════════════════════════════
        bd_title = Text("Correlation Breakdown: The Hidden Risk", font_size=26, color=RED)\
                     .next_to(title, DOWN, buff=0.4)

        # Bar chart: Normal vs Crisis correlations for 4 asset pairs
        pairs = ["Stocks/\nBonds", "Tech/\nEnergy", "EM/\nDM", "REITs/\nEquity"]
        normal_rho  = [0.20, 0.35, 0.45, 0.40]
        crisis_rho  = [0.82, 0.91, 0.88, 0.94]

        axes2 = Axes(
            x_range=[0, 5, 1], y_range=[0, 1.1, 0.2],
            x_length=8, y_length=3.5,
            axis_config={"color": GRAY, "include_numbers": False},
            tips=False,
        ).shift(DOWN*0.8)

        y_labels2 = VGroup(*[
            Text(f"{v:.1f}", font_size=14, color=GRAY)
              .next_to(axes2.coords_to_point(0, v), LEFT, buff=0.05)
            for v in [0.2, 0.4, 0.6, 0.8, 1.0]
        ])

        normal_bars = VGroup()
        crisis_bars = VGroup()
        x_labels2   = VGroup()

        for i, (pair, nr, cr) in enumerate(zip(pairs, normal_rho, crisis_rho)):
            xc = i + 1
            # Normal bar (TEAL, left of center)
            nb_h = axes2.coords_to_point(0, nr)[1] - axes2.coords_to_point(0, 0)[1]
            nb   = Rectangle(width=0.35, height=nb_h,
                              fill_color=TEAL, fill_opacity=0.8, stroke_width=0)\
                     .move_to(axes2.coords_to_point(xc - 0.2, nr/2))
            normal_bars.add(nb)

            # Crisis bar (RED, right of center)
            cb_h = axes2.coords_to_point(0, cr)[1] - axes2.coords_to_point(0, 0)[1]
            cb   = Rectangle(width=0.35, height=cb_h,
                              fill_color=RED, fill_opacity=0.8, stroke_width=0)\
                     .move_to(axes2.coords_to_point(xc + 0.2, cr/2))
            crisis_bars.add(cb)

            lbl = Text(pair, font_size=14, color=GRAY)\
                    .next_to(axes2.coords_to_point(xc, 0), DOWN, buff=0.15)
            x_labels2.add(lbl)

        legend = VGroup(
            VGroup(Square(0.25, fill_color=TEAL, fill_opacity=0.8, stroke_width=0),
                   Text("Normal markets (0.2–0.45)", font_size=16, color=TEAL))\
              .arrange(RIGHT, buff=0.15),
            VGroup(Square(0.25, fill_color=RED, fill_opacity=0.8, stroke_width=0),
                   Text("2008 / Mar 2020 crisis (0.8–0.95)", font_size=16, color=RED))\
              .arrange(RIGHT, buff=0.15),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.15).to_corner(DR, buff=0.4)

        with self.voiceover(
            "But here is the critical trap. Correlation is not stable. In normal markets, correlations "
            "between different asset classes run from 0.2 to 0.45 — shown in teal. But in a crisis — "
            "2008, March 2020 — correlations spike toward 0.9 and above — shown in red. Everything "
            "sells off together. The diversification you relied on disappears exactly when you need it "
            "most. This is called correlation breakdown, and it is one of the hardest problems in risk "
            "management. Solutions include stress-testing with crisis-period correlations, and adding "
            "assets with structurally negative correlation like volatility products and tail hedges."
        ) as tracker:
            self.play(FadeIn(bd_title), Create(axes2), FadeIn(y_labels2), FadeIn(x_labels2))
            self.play(LaggedStart(*[GrowFromEdge(b, DOWN) for b in normal_bars], lag_ratio=0.2))
            self.wait(0.5)
            self.play(LaggedStart(*[GrowFromEdge(b, DOWN) for b in crisis_bars], lag_ratio=0.2))
            self.play(FadeIn(legend))
            self.wait(tracker.duration - 5)

        self.play(FadeOut(bd_title, axes2, y_labels2, x_labels2,
                          normal_bars, crisis_bars, legend))

        # ══════════════════════════════════════════════════════════════════════
        # TAKEAWAY  4:00–4:30
        # ══════════════════════════════════════════════════════════════════════
        action_title = Text("Your Action Item", font_size=30, color=GOLD).next_to(title, DOWN, buff=0.4)
        steps = VGroup(
            Text("1.  Pull the correlation matrix of your current portfolio",
                 font_size=20, color=WHITE),
            Text("2.  Flag pairs with ρ > 0.7 — those are concentration risk",
                 font_size=20, color=RED),
            Text("3.  Ask: what asset lowers my highest correlations?",
                 font_size=20, color=TEAL),
            Text("    → That question is worth more than chasing the next hot asset.",
                 font_size=18, color=GOLD),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.3).shift(DOWN*0.4)
        box = SurroundingRectangle(steps, color=TEAL, buff=0.3, corner_radius=0.12)

        with self.voiceover(
            "Your action item: next time you build a portfolio, don't just look at expected returns. "
            "Pull the correlation matrix. Identify your most correlated pairs — those are your "
            "concentration risk. Then ask: what can I add that lowers those correlations? That question "
            "is worth more than chasing the next hot asset."
        ) as tracker:
            self.play(FadeIn(action_title))
            self.play(LaggedStartMap(FadeIn, steps, lag_ratio=0.35))
            self.play(Create(box))
            self.wait(tracker.duration - 3)

        self.play(FadeOut(action_title, steps, box))

        # ══════════════════════════════════════════════════════════════════════
        # CTA  4:30–5:00
        # ══════════════════════════════════════════════════════════════════════
        with self.voiceover(
            "If this clicked for you, hit subscribe — next episode we go even deeper: the Efficient "
            "Frontier, and why there's mathematically an optimal portfolio for every level of risk. "
            "Drop a comment if you want me to build this in Python live. That's QuantiFire — where the "
            "math is real and the edge is yours. See you next episode."
        ) as tracker:
            self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.8)
            outro = Text("QuantiFire  |  EP 01", font_size=34, color=GOLD).move_to(ORIGIN)
            next_ep = Text("Next → EP 02: The Efficient Frontier",
                           font_size=22, color=WHITE).next_to(outro, DOWN, buff=0.4)
            self.play(FadeIn(outro), FadeIn(next_ep))
            self.wait(tracker.duration - 0.8)
