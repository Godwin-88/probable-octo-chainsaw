"""
QuantiFire EP05 — Factor Models: How Quants Decompose Every Return
Run: manim -pql ep05_factor_models.py FactorModelsScene
Audio: AI voiceover via manim-voiceover

Sources:
  Fama & French (1993) JFE 33(1) 3-56
  Fama & French (2015) JFE 116(1) 1-22
  Carhart (1997) JoF 52(1) 57-82
  Tulchinsky et al. (2020) Finding Alphas, Wiley

One scene per script paragraph for maximum engagement:
  HOOK        0:00-0:30   18%/yr — alpha or hidden beta?
  CONTEXT     0:30-1:00   Decomposition tool intro + sources
  GENERAL     1:00-1:30   R_it = alpha + beta*f + epsilon
  CAPM        1:30-2:00   Single-factor model + its failure
  FF3         2:00-2:30   Fama-French 3-Factor (1993)
  CARHART_FF5 2:30-3:00   Carhart MOM + FF5 RMW/CMA evolution
  ATTRIBUTION 3:00-3:20   Portfolio attribution — alpha vs factor
  RISK        3:20-3:40   Factor-based risk management
  DEFI        3:40-3:55   DeFi-native factors
  COVMATRIX   3:55-4:15   Factor covariance stability
  TAKEAWAY    4:15-4:30   Run factor regression first
  CTA         4:30-5:00   Outro + EP06 teaser
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


class FactorModelsScene(VoiceoverScene):
    def construct(self):
        self.camera.background_color = BG
        self.set_speech_service(GTTSService(lang="en"))
        # PRODUCTION: self.set_speech_service(ElevenLabsService(
        #     voice_id="pNInz6obpgDQGcFmaJgB", model="eleven_turbo_v2"))

        self._scene_hook()
        self._scene_context()
        self._scene_general_model()
        self._scene_capm()
        self._scene_ff3()
        self._scene_carhart_ff5()
        self._scene_attribution()
        self._scene_risk()
        self._scene_defi()
        self._scene_cov_matrix()
        self._scene_takeaway()
        self._scene_cta()

    # ── SCENE 1: HOOK ─────────────────────────────────────────────────────────
    def _scene_hook(self):
        big_num = Text("18% per year", font_size=62, color=GOLD, weight=BOLD)\
                     .shift(UP * 0.8)
        question = Text("Is that alpha — or hidden beta?", font_size=32, color=WHITE)\
                      .next_to(big_num, DOWN, buff=0.4)

        alpha_lbl = Text("Alpha  =  genuine skill", font_size=22, color=TEAL)\
                       .shift(DOWN * 1.4 + LEFT * 2.5)
        beta_lbl  = Text("Beta  =  factor exposure anyone can buy",
                         font_size=22, color=RED)\
                       .shift(DOWN * 1.4 + RIGHT * 1.8)
        divider = Line(UP * 0.3, DOWN * 0.3, color=GRAY, stroke_width=1.5)\
                     .move_to(DOWN * 1.4)

        with self.voiceover(
            "You've found a strategy that returns 18% per year. Is that alpha — "
            "genuine skill generating returns above what the market compensates — "
            "or is it just levered exposure to known risk factors that any investor "
            "could replicate cheaply?"
        ) as tracker:
            self.play(Write(big_num), run_time=1.0)
            self.play(FadeIn(question), run_time=0.8)
            self.play(
                FadeIn(alpha_lbl, shift=RIGHT * 0.3),
                Create(divider),
                FadeIn(beta_lbl, shift=LEFT * 0.3),
                run_time=1.0
            )
            self.wait(tracker.duration - 2.8)

        with self.voiceover(
            "Factor models answer this question. And the answer is almost always humbling."
        ) as tracker:
            self.play(
                big_num.animate.set_color(RED),
                question.animate.set_color(GOLD),
                run_time=tracker.duration * 0.6
            )
            self.wait(tracker.duration * 0.4)

        clear(self)

    # ── SCENE 2: CONTEXT ──────────────────────────────────────────────────────
    def _scene_context(self):
        title = Text("Factor Models — The Decomposition Tool", font_size=30, color=GOLD)\
                   .to_edge(UP, buff=0.5)
        self.play(Write(title))

        bullets = VGroup(
            Text("Every return stream = systematic factors  +  idiosyncratic residual",
                 font_size=21, color=WHITE),
            Text("Tells you what you're actually being paid for",
                 font_size=21, color=TEAL),
            Text("Tells you whether that compensation is efficient",
                 font_size=21, color=TEAL),
        ).arrange(DOWN, buff=0.3, aligned_edge=LEFT).shift(UP * 0.4)

        sources_box = VGroup(
            Text("Key sources:", font_size=16, color=GRAY),
            Text("Fama & French (1993, 2015)  ·  Carhart (1997)  ·  Tulchinsky et al. (2020)",
                 font_size=15, color=GRAY),
        ).arrange(DOWN, buff=0.1, aligned_edge=LEFT)\
         .to_edge(DOWN, buff=0.5)

        with self.voiceover(
            "Welcome to QuantiFire. Factor models are the fundamental decomposition tool "
            "of quantitative finance."
        ) as tracker:
            self.play(LaggedStart(*[FadeIn(b, shift=RIGHT * 0.2) for b in bullets[:1]],
                                  lag_ratio=0.3), run_time=tracker.duration * 0.8)
            self.wait(tracker.duration * 0.2)

        with self.voiceover(
            "Every return stream can be broken into systematic components — factors — "
            "plus an idiosyncratic residual. Understanding that decomposition tells you "
            "what you're actually being paid for and whether that compensation is efficient."
        ) as tracker:
            self.play(LaggedStart(*[FadeIn(b, shift=RIGHT * 0.2) for b in bullets[1:]],
                                  lag_ratio=0.4), run_time=1.2)
            self.play(FadeIn(sources_box), run_time=0.8)
            self.wait(tracker.duration - 2.0)

        clear(self)

    # ── SCENE 3: GENERAL MODEL ────────────────────────────────────────────────
    def _scene_general_model(self):
        title = Text("The General Factor Model", font_size=30, color=GOLD)\
                   .to_edge(UP, buff=0.5)
        self.play(Write(title))

        formula = MathTex(
            r"R_{it}",
            r"=",
            r"\alpha_i",
            r"+",
            r"\boldsymbol{\beta}_i^\top \mathbf{f}_t",
            r"+",
            r"\varepsilon_{it}",
            font_size=52, color=WHITE
        ).shift(UP * 1.5)
        formula[0].set_color(WHITE)
        formula[2].set_color(GOLD)
        formula[4].set_color(TEAL)
        formula[6].set_color(RED)

        with self.voiceover(
            "Every asset return decomposes into three parts: "
            "alpha, factor exposure, and idiosyncratic noise."
        ) as tracker:
            self.play(Write(formula), run_time=tracker.duration * 0.9)
            self.wait(tracker.duration * 0.1)

        # Brace labels for each term
        brace_r   = Brace(formula[0], DOWN, color=WHITE)
        lbl_r     = Text("Total return\nof asset i", font_size=16, color=WHITE)\
                       .next_to(brace_r, DOWN, buff=0.1)

        brace_a   = Brace(formula[2], DOWN, color=GOLD)
        lbl_a     = Text("Alpha — return\nunexplained by factors", font_size=16, color=GOLD)\
                       .next_to(brace_a, DOWN, buff=0.1)

        brace_b   = Brace(formula[4], DOWN, color=TEAL)
        lbl_b     = Text("Factor loadings\n× factor returns", font_size=16, color=TEAL)\
                       .next_to(brace_b, DOWN, buff=0.1)

        brace_e   = Brace(formula[6], DOWN, color=RED)
        lbl_e     = Text("Idiosyncratic\nnoise", font_size=16, color=RED)\
                       .next_to(brace_e, DOWN, buff=0.1)

        with self.voiceover(
            "Alpha — shown in gold — is the return you generated through genuine skill, "
            "unexplained by any systematic factor."
        ) as tracker:
            self.play(Create(brace_a), FadeIn(lbl_a), run_time=1.0)
            self.wait(tracker.duration - 1.0)

        with self.voiceover(
            "Factor exposure — in teal — is your sensitivity to market-wide forces "
            "like momentum, value, or size, multiplied by how those factors performed."
        ) as tracker:
            self.play(Create(brace_b), FadeIn(lbl_b), run_time=1.0)
            self.wait(tracker.duration - 1.0)

        with self.voiceover(
            "Idiosyncratic noise — in red — is just randomness that no factor explains. "
            "The key insight: if most of your return comes from factor exposure, "
            "you are not generating alpha. You are harvesting known risk premiums — "
            "and you should be paying much lower fees."
        ) as tracker:
            self.play(Create(brace_r), FadeIn(lbl_r), run_time=0.6)
            self.play(Create(brace_e), FadeIn(lbl_e), run_time=0.6)
            self.wait(tracker.duration - 1.2)

        clear(self)

    # ── SCENE 4: CAPM ─────────────────────────────────────────────────────────
    def _scene_capm(self):
        title = Text("The Original Model: CAPM", font_size=30, color=GOLD)\
                   .to_edge(UP, buff=0.5)
        self.play(Write(title))

        capm = MathTex(
            r"R_{it} - r_f = \alpha_i + \beta_i(R_m - r_f) + \varepsilon_{it}",
            font_size=40, color=WHITE
        ).shift(UP * 1.8)

        single_note = Text("Single factor: the market excess return",
                           font_size=20, color=TEAL)\
                         .next_to(capm, DOWN, buff=0.3)

        with self.voiceover(
            "The original model was CAPM — a single factor: the market. "
            "Everything in excess of the market return adjusted for beta is alpha. "
            "Sharpe (1964) and Lintner (1965) showed that if markets are efficient, "
            "beta fully explains cross-sectional return differences."
        ) as tracker:
            self.play(Write(capm), run_time=1.2)
            self.play(FadeIn(single_note), run_time=0.8)
            self.wait(tracker.duration - 2.0)

        # Failure evidence
        fail_title = Text("But CAPM fails empirically:", font_size=22, color=RED)\
                        .shift(UP * 0.3)
        fail_items = VGroup(
            Text("Small-cap stocks outperform large-cap (size effect)",
                 font_size=19, color=WHITE),
            Text("Value stocks outperform growth stocks (value effect)",
                 font_size=19, color=WHITE),
            Text("Past winners outperform past losers (momentum)",
                 font_size=19, color=WHITE),
            Text("These earn returns that beta alone cannot explain",
                 font_size=19, color=RED),
        ).arrange(DOWN, buff=0.22, aligned_edge=LEFT).next_to(fail_title, DOWN, buff=0.3)

        with self.voiceover(
            "But empirically, the single-factor model fails. "
            "Stocks with certain characteristics earn consistent returns "
            "that pure market exposure doesn't explain."
        ) as tracker:
            self.play(Write(fail_title), run_time=0.8)
            self.wait(tracker.duration - 0.8)

        with self.voiceover(
            "Small-cap stocks systematically outperform large-cap. "
            "Value stocks outperform growth. Past winners keep winning. "
            "These are returns that beta alone simply cannot explain — "
            "which means CAPM's alpha is contaminated by these hidden factor exposures."
        ) as tracker:
            self.play(LaggedStart(*[FadeIn(f, shift=RIGHT * 0.2) for f in fail_items],
                                  lag_ratio=0.35), run_time=1.8)
            self.wait(tracker.duration - 1.8)

        clear(self)

    # ── SCENE 5: FAMA-FRENCH 3-FACTOR ─────────────────────────────────────────
    def _scene_ff3(self):
        title = Text("Fama-French 3-Factor Model (1993)", font_size=28, color=GOLD)\
                   .to_edge(UP, buff=0.5)
        cite  = Text("Fama & French · Journal of Financial Economics · 1993",
                     font_size=14, color=GRAY)\
                   .next_to(title, DOWN, buff=0.12)
        self.play(Write(title), FadeIn(cite))

        ff3 = MathTex(
            r"R - r_f = \alpha_i + \beta_1 \cdot MKT + \beta_2 \cdot SMB + \beta_3 \cdot HML + \varepsilon",
            font_size=34, color=WHITE
        ).shift(UP * 1.8)

        with self.voiceover(
            "Fama and French published their 3-Factor Model in 1993 in the "
            "Journal of Financial Economics. It adds two factors to the market."
        ) as tracker:
            self.play(Write(ff3), run_time=tracker.duration * 0.8)
            self.wait(tracker.duration * 0.2)

        # Factor cards
        factor_cards = VGroup(
            self._factor_card("MKT", "Market excess return",
                              "The original CAPM factor.\nMarket risk premium.", BLUE),
            self._factor_card("SMB", "Small Minus Big",
                              "Small-cap stocks\nearn more than large-cap.", TEAL),
            self._factor_card("HML", "High Minus Low",
                              "Value stocks (high B/M)\nearn more than growth.", GOLD),
        ).arrange(RIGHT, buff=0.45).shift(DOWN * 0.3)

        with self.voiceover(
            "MKT is the original market factor. "
            "SMB — Small Minus Big — captures the size premium: "
            "small-cap stocks earn more than large-cap on average."
        ) as tracker:
            self.play(FadeIn(factor_cards[0]), run_time=0.7)
            self.play(FadeIn(factor_cards[1]), run_time=0.7)
            self.wait(tracker.duration - 1.4)

        with self.voiceover(
            "HML — High Minus Low — captures the value premium: "
            "value stocks with high book-to-market ratios earn more than growth stocks. "
            "Together these two factors explain about 90% of the cross-sectional "
            "variation in stock returns."
        ) as tracker:
            self.play(FadeIn(factor_cards[2]), run_time=0.7)
            ninety = Text("Explains ~90% of cross-sectional return variation",
                          font_size=19, color=TEAL).to_edge(DOWN, buff=0.6)
            self.play(FadeIn(ninety), run_time=0.6)
            self.wait(tracker.duration - 1.4)

        clear(self)

    # ── SCENE 6: CARHART 4-FACTOR + FF5 ──────────────────────────────────────
    def _scene_carhart_ff5(self):
        title = Text("Factor Model Evolution", font_size=30, color=GOLD)\
                   .to_edge(UP, buff=0.5)
        self.play(Write(title))

        # Timeline of factor model additions
        timeline = VGroup(
            self._timeline_row("1964", "CAPM", "MKT", BLUE),
            self._timeline_row("1993", "Fama-French 3F", "MKT  +  SMB  +  HML", TEAL),
            self._timeline_row("1997", "Carhart 4F", "FF3  +  MOM", GOLD),
            self._timeline_row("2015", "Fama-French 5F", "FF3  +  RMW  +  CMA", RED),
        ).arrange(DOWN, buff=0.35, aligned_edge=LEFT).shift(LEFT * 0.5 + UP * 0.3)

        with self.voiceover(
            "The single market factor of CAPM was published in 1964."
        ) as tracker:
            self.play(FadeIn(timeline[0]), run_time=0.8)
            self.wait(tracker.duration - 0.8)

        with self.voiceover(
            "Fama and French extended it to three factors in 1993, "
            "adding the size and value premiums."
        ) as tracker:
            self.play(FadeIn(timeline[1]), run_time=0.8)
            self.wait(tracker.duration - 0.8)

        with self.voiceover(
            "Carhart added a fourth factor in 1997: MOM — momentum — "
            "trailing 12-month return minus the last month. "
            "Momentum is one of the most robust and controversial anomalies in finance."
        ) as tracker:
            self.play(FadeIn(timeline[2]), run_time=0.8)
            self.wait(tracker.duration - 0.8)

        with self.voiceover(
            "Fama and French extended to five factors in 2015, adding RMW — "
            "Robust Minus Weak profitability — and CMA — Conservative Minus Aggressive investment. "
            "Together these five factors explain most of the variation in equity returns."
        ) as tracker:
            self.play(FadeIn(timeline[3]), run_time=0.8)
            # Highlight FF5 as the current standard
            box = SurroundingRectangle(timeline[3], color=GOLD, buff=0.12, corner_radius=0.08)
            self.play(Create(box), run_time=0.6)
            self.wait(tracker.duration - 1.4)

        ff5_note = Text(
            "FF5 is the current baseline for factor attribution in equity research",
            font_size=18, color=GOLD
        ).to_edge(DOWN, buff=0.5)
        cite = Text("Fama & French · Journal of Financial Economics · 2015",
                    font_size=13, color=GRAY).next_to(ff5_note, DOWN, buff=0.1)

        with self.voiceover(
            "The Fama-French 5-Factor model is now the standard baseline "
            "for factor attribution in equity research."
        ) as tracker:
            self.play(FadeIn(ff5_note), FadeIn(cite), run_time=0.8)
            self.wait(tracker.duration - 0.8)

        clear(self)

    # ── SCENE 7: PORTFOLIO ATTRIBUTION ───────────────────────────────────────
    def _scene_attribution(self):
        title = Text("Practical Use 1 — Portfolio Attribution", font_size=28, color=GOLD)\
                   .to_edge(UP, buff=0.5)
        self.play(Write(title))

        # Bar chart: decomposed return attribution
        components = ["MKT\nβ=1.05", "SMB\nβ=0.42", "HML\nβ=-0.18",
                      "MOM\nβ=0.55", "Alpha\nresidual"]
        contribs   = [6.3, 1.8, -0.7, 2.2, 0.8]   # contribution to total 18% return
        colors_bar = [BLUE, TEAL, RED, GOLD, WHITE]

        axes = Axes(
            x_range=[-0.5, 4.5, 1], y_range=[-2, 8, 2],
            x_length=8.5, y_length=3.8,
            axis_config={"color": GRAY, "include_numbers": False},
            tips=False
        ).shift(DOWN * 0.6)

        x_lbl = Text("Return Source", font_size=16, color=GRAY)\
                    .next_to(axes.x_axis.get_end(), RIGHT, buff=0.1)
        y_lbl = Text("Return contribution (%)", font_size=16, color=GRAY)\
                    .next_to(axes.y_axis.get_end(), UP, buff=0.1)
        self.play(Create(axes), Write(x_lbl), Write(y_lbl))

        bars     = VGroup()
        xlabels  = VGroup()
        vlabels  = VGroup()
        for i, (comp, val, col) in enumerate(zip(components, contribs, colors_bar)):
            x0  = axes.coords_to_point(i, 0)
            x1  = axes.coords_to_point(i, val)
            bar = Rectangle(
                width=0.60,
                height=abs(x1[1] - x0[1]),
                fill_color=col, fill_opacity=0.8, stroke_width=0
            ).move_to([(x0[0] + x1[0]) / 2,
                       (x0[1] + x1[1]) / 2, 0])
            xl = Text(comp, font_size=13, color=col)\
                    .next_to(axes.coords_to_point(i, 0), DOWN, buff=0.12)
            vl = Text(f"{val:+.1f}%", font_size=13, color=col)\
                    .next_to(bar, UP if val >= 0 else DOWN, buff=0.06)
            bars.add(bar)
            xlabels.add(xl)
            vlabels.add(vl)

        with self.voiceover(
            "Portfolio attribution: decompose your returns into factor exposures. "
            "This portfolio returned 18% — let's see where it actually came from."
        ) as tracker:
            self.play(
                LaggedStart(*[GrowFromEdge(b, DOWN if c >= 0 else UP)
                              for b, c in zip(bars, contribs)], lag_ratio=0.15),
                LaggedStart(*[FadeIn(xl) for xl in xlabels], lag_ratio=0.15),
                run_time=tracker.duration * 0.7
            )
            self.play(LaggedStart(*[FadeIn(vl) for vl in vlabels], lag_ratio=0.1),
                      run_time=0.8)
            self.wait(tracker.duration * 0.3)

        alpha_bar = bars[4]
        ring = SurroundingRectangle(alpha_bar, color=WHITE, stroke_width=2, buff=0.08)
        insight = Text(
            "Only 0.8% out of 18% is true alpha.\nThe rest is factor exposure — "
            "replicable with a cheap ETF.",
            font_size=18, color=WHITE, line_spacing=1.3
        ).to_edge(DOWN, buff=0.5)

        with self.voiceover(
            "If 80% of your alpha is just HML loading — value factor exposure — "
            "you are not an alpha generator. You are a value investor with leverage. "
            "You could replicate that exposure at a fraction of the cost with a value ETF. "
            "This insight, from Tulchinsky et al.'s Finding Alphas, is what drives the "
            "factor ETF industry."
        ) as tracker:
            self.play(Create(ring), run_time=0.6)
            self.play(FadeIn(insight), run_time=0.8)
            self.wait(tracker.duration - 1.4)

        clear(self)

    # ── SCENE 8: RISK MANAGEMENT ──────────────────────────────────────────────
    def _scene_risk(self):
        title = Text("Practical Use 2 — Factor-Based Risk Management",
                     font_size=26, color=GOLD).to_edge(UP, buff=0.5)
        self.play(Write(title))

        subtitle = Text(
            "Two portfolios — identical total volatility — completely different factor profiles",
            font_size=18, color=WHITE
        ).next_to(title, DOWN, buff=0.3)
        self.play(FadeIn(subtitle))

        # Two side-by-side stacked bar charts showing factor composition
        port_a_vals = [80, 10, 10]     # MKT, SMB, Other
        port_b_vals = [25, 25, 50]     # MKT, SMB, Other
        port_labels_a = ["MKT 80%", "SMB 10%", "Other 10%"]
        port_labels_b = ["MKT 25%", "SMB 25%", "Other 50%"]
        bar_colors = [BLUE, TEAL, GOLD]

        def stacked_bars(vals, labels, x_center, title_str, title_col):
            group = VGroup()
            y = 0
            for val, col in zip(vals, bar_colors):
                h = val * 3.0 / 100
                bar = Rectangle(width=1.8, height=h,
                                fill_color=col, fill_opacity=0.8, stroke_width=0)\
                         .move_to([x_center, -1.5 + y + h / 2, 0])
                group.add(bar)
                y += h
            for i, (lbl, col) in enumerate(zip(labels, bar_colors)):
                group.add(
                    Text(lbl, font_size=14, color=col)
                    .next_to(group[i], RIGHT, buff=0.12)
                )
            group.add(
                Text(title_str, font_size=18, color=title_col, weight=BOLD)
                .move_to([x_center, 1.9, 0])
            )
            group.add(
                Text("σ = 15%", font_size=16, color=GRAY)
                .move_to([x_center, -1.9, 0])
            )
            return group

        port_a = stacked_bars(port_a_vals, port_labels_a, -2.8,
                              "Portfolio A", BLUE)
        port_b = stacked_bars(port_b_vals, port_labels_b, 2.8,
                              "Portfolio B", TEAL)
        vs_lbl = Text("vs", font_size=28, color=GRAY).move_to(ORIGIN + DOWN * 0.3)

        with self.voiceover(
            "Two portfolios can have identical total volatility but completely "
            "different factor exposure profiles."
        ) as tracker:
            self.play(FadeIn(port_a), FadeIn(vs_lbl), FadeIn(port_b), run_time=1.5)
            self.wait(tracker.duration - 1.5)

        verdict = Text(
            "Portfolio B is genuinely better diversified — risk spread across factors,\n"
            "not concentrated in a single market-beta bet.",
            font_size=17, color=TEAL, line_spacing=1.3
        ).to_edge(DOWN, buff=0.4)

        with self.voiceover(
            "Portfolio A has 80% of its risk concentrated in market beta. "
            "Portfolio B diversifies across multiple factors. "
            "Both show 15% volatility — but Portfolio B is genuinely better diversified. "
            "Factor models make this visible. Without them, you're flying blind."
        ) as tracker:
            self.play(FadeIn(verdict), run_time=0.8)
            self.wait(tracker.duration - 0.8)

        clear(self)

    # ── SCENE 9: DEFI FACTORS ─────────────────────────────────────────────────
    def _scene_defi(self):
        title = Text("Factor Construction in DeFi", font_size=28, color=GOLD)\
                   .to_edge(UP, buff=0.5)
        self.play(Write(title))

        intro = Text(
            "On-chain data generates novel DeFi-native factor signals",
            font_size=20, color=WHITE
        ).next_to(title, DOWN, buff=0.3)
        self.play(FadeIn(intro))

        defi_factors = VGroup(
            self._defi_factor_card(
                "TVL Momentum",
                "Protocols gaining Total Value Locked\noutperform — size premium analogue",
                TEAL, "≈ SMB in DeFi"
            ),
            self._defi_factor_card(
                "Revenue Yield",
                "Protocol fees / Fully Diluted Value\nhigh-yield protocols outperform",
                GOLD, "≈ HML in DeFi"
            ),
            self._defi_factor_card(
                "Holder Concentration",
                "Low whale concentration = more\ndistributed ownership premium",
                BLUE, "Novel on-chain factor"
            ),
        ).arrange(RIGHT, buff=0.4).shift(DOWN * 0.4)

        with self.voiceover(
            "Factor construction in DeFi: on-chain data generates novel factor signals "
            "that map directly onto the Fama-French framework."
        ) as tracker:
            self.play(FadeIn(defi_factors[0]), run_time=0.8)
            self.wait(tracker.duration - 0.8)

        with self.voiceover(
            "TVL Momentum — protocols gaining total value locked outperform — "
            "is the DeFi analogue of the size premium. "
            "Revenue Yield — protocol fees divided by fully diluted value — "
            "maps to the value premium."
        ) as tracker:
            self.play(FadeIn(defi_factors[1]), run_time=0.8)
            self.wait(tracker.duration - 0.8)

        with self.voiceover(
            "Holder concentration — a novel on-chain factor with no traditional analogue — "
            "captures distributed ownership as a quality signal. "
            "We'll build these factors from on-chain data in a future episode."
        ) as tracker:
            self.play(FadeIn(defi_factors[2]), run_time=0.8)
            self.wait(tracker.duration - 0.8)

        clear(self)

    # ── SCENE 10: COVARIANCE MATRIX STABILITY ────────────────────────────────
    def _scene_cov_matrix(self):
        title = Text("Factor Models Stabilise the Covariance Matrix",
                     font_size=26, color=GOLD).to_edge(UP, buff=0.5)
        self.play(Write(title))

        # Two boxes: direct vs factor-based estimation
        direct_box = VGroup(
            Text("Direct Sample Estimation", font_size=20, color=RED, weight=BOLD),
            MathTex(r"\frac{N(N+1)}{2} \text{ entries to estimate}",
                    font_size=26, color=WHITE),
            Text("N=500 assets → 125,250 parameters", font_size=17, color=RED),
            Text("Highly unstable — needs T >> N", font_size=17, color=GRAY),
        ).arrange(DOWN, buff=0.2)\
         .add_background_rectangle(color="#1A0A0A", opacity=1, buff=0.25)\
         .shift(LEFT * 3.2 + DOWN * 0.4)

        factor_box = VGroup(
            Text("Factor-Based Estimation", font_size=20, color=TEAL, weight=BOLD),
            MathTex(r"K \times N \text{ factor loadings}",
                    font_size=26, color=WHITE),
            Text("K=5 factors, N=500 → only 2,500 parameters", font_size=17, color=TEAL),
            Text("Used by Barra, Axioma, every major quant shop", font_size=17, color=GOLD),
        ).arrange(DOWN, buff=0.2)\
         .add_background_rectangle(color="#0A1A0A", opacity=1, buff=0.25)\
         .shift(RIGHT * 3.2 + DOWN * 0.4)

        vs = Text("vs", font_size=26, color=GRAY).shift(DOWN * 0.4)

        with self.voiceover(
            "The covariance matrix estimated via factor models is far more stable "
            "than direct sample estimation."
        ) as tracker:
            self.play(FadeIn(direct_box), FadeIn(vs), run_time=1.0)
            self.wait(tracker.duration - 1.0)

        with self.voiceover(
            "Direct estimation of a 500-asset covariance matrix requires over 125,000 parameters — "
            "highly unstable unless you have thousands of years of data."
        ) as tracker:
            # Highlight the problem number
            self.play(
                direct_box[2].animate.set_color(RED),
                run_time=tracker.duration * 0.4
            )
            self.wait(tracker.duration * 0.6)

        with self.voiceover(
            "With a 5-factor model, you estimate only 5 loadings per asset — "
            "just 2,500 parameters total. Same 500 assets. Far more stable. "
            "This is the core advantage of factor-based risk models "
            "used by Barra, Axioma, and every major quantitative shop."
        ) as tracker:
            self.play(FadeIn(factor_box), run_time=1.0)
            self.wait(tracker.duration - 1.0)

        clear(self)

    # ── SCENE 11: TAKEAWAY ────────────────────────────────────────────────────
    def _scene_takeaway(self):
        title = Text("Takeaway", font_size=34, color=GOLD).to_edge(UP, buff=0.5)
        self.play(Write(title))

        items = [
            ("1.", "Run a factor regression on any strategy before declaring alpha.",
             TEAL),
            ("2.", "Use Fama-French 5-Factor as the baseline.\n"
                   "(Fama & French, JFE 2015)", WHITE),
            ("3.", "If alpha shrinks to near-zero after factor adjustment,\n"
                   "your strategy is factor harvesting — valuable, but not alpha.", GOLD),
            ("4.", "Only what survives factor adjustment is worth calling edge.\n"
                   "(Tulchinsky et al., Finding Alphas, Wiley 2020)", RED),
        ]

        rows = VGroup()
        for num, text, col in items:
            num_t  = Text(num, font_size=22, color=col, weight=BOLD)
            body_t = Text(text, font_size=18, color=WHITE, line_spacing=1.2)
            row = VGroup(num_t, body_t).arrange(RIGHT, buff=0.25, aligned_edge=UP)
            rows.add(row)
        rows.arrange(DOWN, buff=0.32, aligned_edge=LEFT).shift(DOWN * 0.2 + LEFT * 0.2)

        with self.voiceover(
            "Run a factor regression on any strategy before declaring alpha. "
            "Use the Fama-French 5 factors as your baseline."
        ) as tracker:
            self.play(FadeIn(rows[0], shift=RIGHT * 0.2), run_time=0.8)
            self.play(FadeIn(rows[1], shift=RIGHT * 0.2), run_time=0.8)
            self.wait(tracker.duration - 1.6)

        with self.voiceover(
            "If your alpha shrinks to near-zero after factor adjustment, "
            "your strategy is factor harvesting — valuable, but very different from true alpha. "
            "Only what survives factor adjustment is worth calling edge."
        ) as tracker:
            self.play(FadeIn(rows[2], shift=RIGHT * 0.2), run_time=0.8)
            self.play(FadeIn(rows[3], shift=RIGHT * 0.2), run_time=0.8)
            self.wait(tracker.duration - 1.6)

        clear(self)

    # ── SCENE 12: CTA ─────────────────────────────────────────────────────────
    def _scene_cta(self):
        with self.voiceover(
            "Next: the Black-Litterman Model — how to inject your own market views "
            "into a portfolio optimizer in a mathematically rigorous way. "
            "This is how the big funds do it. Subscribe. QuantiFire."
        ) as tracker:
            teaser = VGroup(
                Text("Next → EP06", font_size=24, color=GRAY),
                Text("Black-Litterman Model", font_size=32, color=WHITE),
                Text("Injecting your views into the optimizer", font_size=20, color=TEAL),
            ).arrange(DOWN, buff=0.3)
            outro = Text("QuantiFire  |  EP 05", font_size=32, color=GOLD)\
                       .to_edge(DOWN, buff=0.8)
            self.play(LaggedStart(*[FadeIn(t) for t in teaser], lag_ratio=0.4),
                      run_time=1.5)
            self.play(FadeIn(outro), run_time=0.6)
            self.wait(tracker.duration - 2.2)

    # ── HELPERS ───────────────────────────────────────────────────────────────
    def _factor_card(self, name, full_name, description, color):
        box  = RoundedRectangle(width=3.6, height=3.2, corner_radius=0.18,
                                fill_color=color, fill_opacity=0.07,
                                stroke_color=color, stroke_width=1.5)
        nm   = Text(name, font_size=26, color=color, weight=BOLD)\
                  .move_to(box).shift(UP * 0.95)
        fn   = Text(full_name, font_size=16, color=WHITE)\
                  .next_to(nm, DOWN, buff=0.15)
        desc = Text(description, font_size=15, color=GRAY, line_spacing=1.2)\
                  .next_to(fn, DOWN, buff=0.2)
        return VGroup(box, nm, fn, desc)

    def _timeline_row(self, year, model, factors, color):
        yr  = Text(year, font_size=20, color=GRAY, weight=BOLD)
        mdl = Text(model, font_size=20, color=color, weight=BOLD)
        fct = Text(factors, font_size=18, color=WHITE)
        row = VGroup(yr, mdl, fct).arrange(RIGHT, buff=0.5, aligned_edge=DOWN)
        return row

    def _defi_factor_card(self, name, description, color, analogue):
        box  = RoundedRectangle(width=4.0, height=2.8, corner_radius=0.18,
                                fill_color=color, fill_opacity=0.07,
                                stroke_color=color, stroke_width=1.5)
        nm   = Text(name, font_size=18, color=color, weight=BOLD)\
                  .move_to(box).shift(UP * 0.8)
        desc = Text(description, font_size=14, color=WHITE, line_spacing=1.2)\
                  .next_to(nm, DOWN, buff=0.2)
        ana  = Text(analogue, font_size=14, color=GRAY, slant=ITALIC)\
                  .next_to(desc, DOWN, buff=0.18)
        return VGroup(box, nm, desc, ana)
