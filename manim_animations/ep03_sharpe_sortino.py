"""
QuantiFire EP03 — Sharpe Ratio vs Sortino: Which One Should You Actually Use?
Run: manim -pql ep03_sharpe_sortino.py SharpeSortinoScene

One scene per script paragraph for maximum engagement:
  HOOK        0:00–0:30   Sharpe is everywhere — and broken
  CONTEXT     0:30–1:00   Both measure risk-adj return, disagree on risk
  SHARPE      1:00–1:30   Formula breakdown — numerator vs denominator
  FLAW        1:30–2:00   Two identical-Sharpe strategies that are NOT equal
  SORTINO     2:00–2:30   Downside-only denominator + concrete numbers
  WHEN        2:30–3:00   Decision table: Sharpe / Sortino / Calmar
  TRAP        3:00–3:30   The Sharpe Ratio trap — tail risk manufacturing
  DEFI        3:30–3:50   Asymmetric DeFi profiles
  TAKEAWAY    3:50–4:30   Sortino vs Sharpe tells you skew direction
  CTA         4:30–5:00   Outro
"""
from manim import *
from manim_voiceover import VoiceoverScene
from manim_voiceover.services.gtts import GTTSService
# PRODUCTION: from manim_voiceover.services.elevenlabs import ElevenLabsService
import numpy as np
from scipy.stats import norm

GOLD = "#FFB700"; TEAL = "#00C896"; RED = "#FF4444"; BLUE = "#4A90E2"; BG = "#0D0D0D"


class SharpeSortinoScene(VoiceoverScene):
    def construct(self):
        self.camera.background_color = BG
        self.set_speech_service(GTTSService(lang="en"))
        # PRODUCTION:
        # self.set_speech_service(ElevenLabsService(
        #     voice_id="pNInz6obpgDQGcFmaJgB", model="eleven_turbo_v2"))

        title = Text("Sharpe vs Sortino", font_size=44, color=GOLD).to_edge(UP)

        # ══════════════════════════════════════════════════════════════════════
        # HOOK  0:00–0:30
        # ══════════════════════════════════════════════════════════════════════
        everywhere = VGroup(
            Text("Every fund factsheet",    font_size=22, color=GRAY),
            Text("Every backtest report",   font_size=22, color=GRAY),
            Text("Every quant resume",      font_size=22, color=GRAY),
        ).arrange(DOWN, buff=0.25).shift(LEFT*2.5)

        sharpe_big   = Text("SHARPE", font_size=72, color=GOLD, weight=BOLD).shift(RIGHT*1.5 + UP*0.3)
        broken_stamp = Text("FLAWED?", font_size=46, color=RED, weight=BOLD,
                            slant=ITALIC).next_to(sharpe_big, DOWN, buff=0.1)

        with self.voiceover(
            "The Sharpe Ratio is the single most cited performance metric in finance. It's on every "
            "fund factsheet, every backtest report, every quant resume. And it has a fundamental flaw "
            "that can make a catastrophically risky strategy look like a safe, consistent winner. "
            "Today I'll show you exactly what that flaw is, and the fix that professionals use instead."
        ) as tracker:
            self.play(Write(title))
            self.play(LaggedStartMap(FadeIn, everywhere, lag_ratio=0.4), run_time=1.2)
            self.play(Write(sharpe_big), run_time=0.6)
            self.play(FadeIn(broken_stamp, shift=DOWN*0.3), run_time=0.5)
            self.wait(tracker.duration - 3.5)
        self.play(FadeOut(everywhere, sharpe_big, broken_stamp))

        # ══════════════════════════════════════════════════════════════════════
        # CONTEXT  0:30–1:00
        # ══════════════════════════════════════════════════════════════════════
        context_row = VGroup(
            VGroup(
                Text("Both measure:", font_size=20, color=GRAY),
                Text("Risk-Adjusted Return", font_size=22, color=GOLD),
                Text("Return per unit of risk taken", font_size=18, color=WHITE),
            ).arrange(DOWN, buff=0.12),
            VGroup(
                Text("But disagree on:", font_size=20, color=GRAY),
                Text("What counts as RISK", font_size=22, color=RED),
                Text("Symmetric or only downside?", font_size=18, color=WHITE),
            ).arrange(DOWN, buff=0.12),
        ).arrange(RIGHT, buff=1.8).move_to(ORIGIN + UP*0.1)

        divider = Line(UP*1.5, DOWN*1.5, color=DARK_GRAY, stroke_width=1.5)

        asymm_note = Text(
            "⚠  In DeFi and systematic trading, distributions\n"
            "    are almost always asymmetric — this matters.",
            font_size=19, color=GOLD, line_spacing=1.3
        ).to_edge(DOWN, buff=0.5)

        with self.voiceover(
            "Welcome to QuantiFire. Both the Sharpe and Sortino ratios measure risk-adjusted return — "
            "how much return are you generating per unit of risk taken. But they disagree on what "
            "counts as risk. That disagreement matters enormously when your return distribution is "
            "asymmetric — which in DeFi and systematic trading, it almost always is."
        ) as tracker:
            self.play(FadeIn(context_row[0], shift=RIGHT*0.3), Create(divider))
            self.play(FadeIn(context_row[1], shift=LEFT*0.3))
            self.play(FadeIn(asymm_note))
            self.wait(tracker.duration - 2.5)
        self.play(FadeOut(context_row, divider, asymm_note))

        # ══════════════════════════════════════════════════════════════════════
        # SHARPE FORMULA  1:00–1:30
        # ══════════════════════════════════════════════════════════════════════
        sharpe_form = MathTex(
            r"S = \frac{",
            r"\bar{r}_p - r_f",
            r"}{",
            r"\sigma_p",
            r"}",
            font_size=72, color=BLUE
        ).move_to(ORIGIN + UP*0.5)
        sharpe_form[1].set_color(TEAL)   # numerator
        sharpe_form[3].set_color(RED)    # denominator

        num_brace = Brace(sharpe_form[1], UP, color=TEAL)
        num_lbl   = Text("Excess return above risk-free rate", font_size=18, color=TEAL)\
                      .next_to(num_brace, UP, buff=0.08)
        den_brace = Brace(sharpe_form[3], DOWN, color=RED)
        den_lbl   = Text("Standard deviation of ALL returns — up AND down", font_size=18, color=RED)\
                      .next_to(den_brace, DOWN, buff=0.08)

        with self.voiceover(
            "The Sharpe Ratio: your average excess return above the risk-free rate, "
            "divided by the standard deviation of all your returns."
        ) as tracker:
            self.play(Write(sharpe_form), run_time=tracker.duration * 0.8)
            self.wait(tracker.duration * 0.2)

        with self.voiceover(
            "The numerator — shown in teal — is your excess return above the risk-free rate."
        ) as tracker:
            self.play(GrowFromCenter(num_brace), FadeIn(num_lbl), run_time=1)
            self.wait(tracker.duration - 1)

        with self.voiceover(
            "The denominator — shown in red — is the standard deviation of ALL returns, "
            "up AND down. A month where you made eight percent? That goes in. "
            "A month where you lost four percent? That also goes in. "
            "The Sharpe treats both identically as volatility to be penalized."
        ) as tracker:
            self.play(GrowFromCenter(den_brace), FadeIn(den_lbl), run_time=1)
            self.wait(tracker.duration - 1)
        self.play(FadeOut(sharpe_form, num_brace, num_lbl, den_brace, den_lbl))

        # ══════════════════════════════════════════════════════════════════════
        # FLAW  1:30–2:00   Two strategies, same Sharpe — completely different
        # ══════════════════════════════════════════════════════════════════════
        flaw_title = Text("Two Strategies — Same Sharpe — Not the Same", font_size=24, color=GOLD)\
                       .next_to(title, DOWN, buff=0.3)

        months   = list(range(1, 13))
        ret_a    = [0.02] * 12                              # flat 2% every month
        ret_b    = [0.08, -0.04, 0.02, 0.08, -0.04, 0.08,
                    -0.04, 0.02, 0.08, -0.04, 0.02, 0.08]  # volatile but avg ≈ 2.83%
        # Adjust B to have same mean as A
        ret_b    = [r - np.mean(ret_b) + 0.02 for r in ret_b]

        def make_bar_chart(data, color_pos, color_neg, x_offset, chart_title_str, chart_color):
            ax = Axes(
                x_range=[0.5, 12.5, 1], y_range=[-0.08, 0.12, 0.04],
                x_length=4.5, y_length=2.8,
                axis_config={"color": GRAY, "include_numbers": False},
                tips=False
            ).shift(x_offset + DOWN*0.3)
            zero_line = DashedLine(ax.coords_to_point(0.5, 0), ax.coords_to_point(12.5, 0),
                                   color=GRAY, stroke_width=1)
            bars = VGroup()
            for i, r in enumerate(data):
                x  = i + 1
                col = color_pos if r >= 0 else color_neg
                h  = ax.coords_to_point(0, r)[1] - ax.coords_to_point(0, 0)[1]
                b  = Rectangle(
                    width=0.28, height=abs(h),
                    fill_color=col, fill_opacity=0.85, stroke_width=0
                ).move_to(ax.coords_to_point(x, r/2))
                bars.add(b)
            ct = Text(chart_title_str, font_size=18, color=chart_color)\
                   .next_to(ax, UP, buff=0.1)
            sharpe_val = np.mean(data) / np.std(data) * np.sqrt(12)
            sv = Text(f"Sharpe ≈ {sharpe_val:.2f}", font_size=16, color=GOLD)\
                   .next_to(ax, DOWN, buff=0.1)
            return ax, zero_line, bars, ct, sv

        ax_a, zl_a, bars_a, ct_a, sv_a = make_bar_chart(
            ret_a, TEAL, RED, LEFT*3.0, "Strategy A — flat 2%/month", TEAL)
        ax_b, zl_b, bars_b, ct_b, sv_b = make_bar_chart(
            ret_b, TEAL, RED, RIGHT*2.8, "Strategy B — volatile avg 2%", BLUE)

        penalty_lbl = Text(
            "Sharpe punishes Strategy B's +8% months\nas if they were risk — but you WANT those gains",
            font_size=18, color=RED, line_spacing=1.3
        ).to_edge(DOWN, buff=0.4)

        with self.voiceover(
            "Here is the flaw made concrete. Strategy A returns a flat two percent every single month — "
            "no drama, no variation."
        ) as tracker:
            self.play(FadeIn(flaw_title), run_time=0.6)
            self.play(Create(ax_a), Create(zl_a), FadeIn(ct_a), run_time=0.8)
            self.play(LaggedStart(*[GrowFromEdge(b, DOWN) for b in bars_a], lag_ratio=0.05),
                      run_time=1.2)
            self.play(FadeIn(sv_a), run_time=0.5)
            self.wait(tracker.duration - 3.5)

        with self.voiceover(
            "Strategy B averages the same two percent but with volatile swings: "
            "some months of plus eight percent, some of minus four."
        ) as tracker:
            self.play(Create(ax_b), Create(zl_b), FadeIn(ct_b), run_time=0.8)
            self.play(LaggedStart(*[GrowFromEdge(b, DOWN if r >= 0 else UP)
                                    for b, r in zip(bars_b, ret_b)], lag_ratio=0.05),
                      run_time=1.2)
            self.play(FadeIn(sv_b), run_time=0.5)
            self.wait(tracker.duration - 2.5)

        with self.voiceover(
            "Both strategies have nearly identical Sharpe Ratios. But a rational investor "
            "prefers Strategy B — those plus eight percent months are gains, not risk. "
            "The Sharpe Ratio cannot tell the difference."
        ) as tracker:
            self.play(FadeIn(penalty_lbl), run_time=0.8)
            self.wait(tracker.duration - 0.8)
        self.play(FadeOut(flaw_title, ax_a, zl_a, bars_a, ct_a, sv_a,
                          ax_b, zl_b, bars_b, ct_b, sv_b, penalty_lbl))

        # ══════════════════════════════════════════════════════════════════════
        # SORTINO  2:00–2:30   Downside-only + concrete numbers
        # ══════════════════════════════════════════════════════════════════════
        sortino_form = MathTex(
            r"Sortino = \frac{\bar{r}_p - r_f}{\sigma_{\text{down}}}",
            font_size=58, color=TEAL
        ).next_to(title, DOWN, buff=0.5)

        # Distribution plot
        ax_dist = Axes(
            x_range=[-0.18, 0.28, 0.05], y_range=[0, 9, 2],
            x_length=8, y_length=3.2,
            axis_config={"color": GRAY, "include_numbers": False},
            tips=False
        ).shift(DOWN*1.1)

        mu_d, sig_d = 0.05, 0.08
        def pdf(x):
            return (1/(sig_d*(2*PI)**0.5)) * np.exp(-0.5*((x-mu_d)/sig_d)**2)

        dist_curve  = ax_dist.plot(pdf, x_range=[-0.18, 0.28, 0.001],
                                   color=WHITE, stroke_width=2)
        down_fill   = ax_dist.get_area(dist_curve, x_range=[-0.18, 0], color=RED, opacity=0.55)
        up_fill     = ax_dist.get_area(dist_curve, x_range=[0, 0.28],  color=TEAL, opacity=0.25)

        thresh_line = DashedLine(ax_dist.coords_to_point(0, 0),
                                 ax_dist.coords_to_point(0, 8.5),
                                 color=GOLD, stroke_width=2)
        thresh_lbl  = Text("Threshold = 0", font_size=16, color=GOLD)\
                        .next_to(ax_dist.coords_to_point(0, 8.5), UR, buff=0.05)

        down_ann = Text("COUNTED in σ_down\n(penalised)", font_size=16, color=RED)\
                     .next_to(ax_dist.coords_to_point(-0.09, 4), LEFT, buff=0.05)
        up_ann   = Text("IGNORED in σ_down\n(free upside!)", font_size=16, color=TEAL)\
                     .next_to(ax_dist.coords_to_point(0.13, 4), RIGHT, buff=0.05)

        # Concrete numbers panel
        numbers_box = VGroup(
            Text("Concrete example:", font_size=18, color=GRAY),
            Text("σ_upside  = 15%", font_size=20, color=TEAL),
            Text("σ_downside =  5%", font_size=20, color=RED),
            Text("─────────────────", font_size=16, color=DARK_GRAY),
            Text("Sharpe denominator → σ ≈ 11%  (combined)", font_size=17, color=WHITE),
            Text("Sortino denominator → σ =  5%  (downside only)", font_size=17, color=TEAL),
            Text("Same strategy — radically different scores", font_size=17, color=GOLD),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.12)\
         .add_background_rectangle(color=BG, opacity=0.9, buff=0.2)\
         .to_corner(DR, buff=0.3)

        with self.voiceover(
            "The Sortino Ratio fixes this. The denominator uses only downside deviation — "
            "the standard deviation of returns that fall below a target threshold, "
            "usually zero or the risk-free rate."
        ) as tracker:
            self.play(Write(sortino_form), run_time=1.2)
            self.wait(tracker.duration - 1.2)

        with self.voiceover(
            "Returns above the threshold — shown in teal — are completely ignored in the "
            "denominator. Returns below it — shown in red — are the only ones penalized. "
            "You are penalized only for bad volatility."
        ) as tracker:
            self.play(Create(ax_dist), run_time=0.8)
            self.play(Create(dist_curve), run_time=0.8)
            self.play(Create(thresh_line), Write(thresh_lbl), run_time=0.7)
            self.play(FadeIn(down_fill), FadeIn(up_fill), run_time=0.8)
            self.play(Write(down_ann), Write(up_ann), run_time=0.8)
            self.wait(tracker.duration - 4.0)

        with self.voiceover(
            "Concretely: a strategy with fifteen percent upside deviation and five percent downside "
            "deviation. Sharpe uses a combined sigma of about eleven percent. Sortino uses only five. "
            "Same strategy — radically different scores — and the Sortino tells the more honest story."
        ) as tracker:
            self.play(FadeIn(numbers_box), run_time=0.8)
            self.wait(tracker.duration - 0.8)
        self.play(FadeOut(sortino_form, ax_dist, dist_curve, thresh_line, thresh_lbl,
                          down_fill, up_fill, down_ann, up_ann, numbers_box))

        # ══════════════════════════════════════════════════════════════════════
        # WHEN TO USE WHICH  2:30–3:00
        # ══════════════════════════════════════════════════════════════════════
        when_title = Text("When to Use Each Metric", font_size=26, color=GOLD)\
                       .next_to(title, DOWN, buff=0.35)

        cards = VGroup(
            VGroup(
                Text("USE SHARPE", font_size=22, color=BLUE, weight=BOLD),
                Text("Symmetric, near-normal distributions", font_size=18, color=WHITE),
                Text("Classical equity long-only", font_size=16, color=GRAY),
                Text("Diversified factor portfolios", font_size=16, color=GRAY),
                Text("→ Up/down vol roughly equal", font_size=16, color=BLUE),
            ).arrange(DOWN, aligned_edge=LEFT, buff=0.1)
             .add_background_rectangle(color="#001133", opacity=0.7, buff=0.22),
            VGroup(
                Text("USE SORTINO", font_size=22, color=TEAL, weight=BOLD),
                Text("Skewed / asymmetric distributions", font_size=18, color=WHITE),
                Text("Options writing, trend following", font_size=16, color=GRAY),
                Text("Yield farming, DeFi strategies", font_size=16, color=GRAY),
                Text("→ Asymmetric wins vs losses", font_size=16, color=TEAL),
            ).arrange(DOWN, aligned_edge=LEFT, buff=0.1)
             .add_background_rectangle(color="#001a0d", opacity=0.7, buff=0.22),
            VGroup(
                Text("USE CALMAR", font_size=22, color=GOLD, weight=BOLD),
                Text("Drawdown-managed strategies", font_size=18, color=WHITE),
                Text("CTA / managed futures", font_size=16, color=GRAY),
                MathTex(r"Calmar = \frac{CAGR}{|Max\ Drawdown|}",
                        font_size=22, color=GOLD),
                Text("→ Focus on worst-case loss", font_size=16, color=GOLD),
            ).arrange(DOWN, aligned_edge=LEFT, buff=0.1)
             .add_background_rectangle(color="#1a1100", opacity=0.7, buff=0.22),
        ).arrange(RIGHT, buff=0.4).next_to(when_title, DOWN, buff=0.3)

        with self.voiceover(
            "Use the Sharpe Ratio when return distributions are approximately "
            "symmetric and normal — classical equity long-only, diversified factor portfolios "
            "where upside and downside volatility are roughly equal."
        ) as tracker:
            self.play(FadeIn(when_title), run_time=0.6)
            self.play(FadeIn(cards[0]), run_time=0.8)
            self.wait(tracker.duration - 1.4)

        with self.voiceover(
            "Use the Sortino when strategies have skewed distributions — options writing, "
            "trend following, yield farming — any strategy where you care about the "
            "asymmetry between wins and losses."
        ) as tracker:
            self.play(FadeIn(cards[1]), run_time=0.8)
            self.wait(tracker.duration - 0.8)

        with self.voiceover(
            "And use the Calmar Ratio when you care specifically about maximum drawdown — "
            "the preferred metric for CTA traders who manage to explicit drawdown thresholds."
        ) as tracker:
            self.play(FadeIn(cards[2]), run_time=0.8)
            self.wait(tracker.duration - 0.8)
        self.play(FadeOut(when_title, cards))

        # ══════════════════════════════════════════════════════════════════════
        # SHARPE TRAP  3:00–3:30
        # ══════════════════════════════════════════════════════════════════════
        trap_title = Text("The Sharpe Ratio Trap", font_size=30, color=RED, weight=BOLD)\
                       .next_to(title, DOWN, buff=0.35)

        # Equity curve: smooth growth then cliff
        ax_eq = Axes(
            x_range=[0, 36, 6], y_range=[0.8, 1.5, 0.1],
            x_length=8, y_length=3,
            axis_config={"color": GRAY, "include_numbers": False},
            tips=False
        ).shift(DOWN*0.9)
        t_smooth = np.linspace(0, 30, 200)
        t_crash  = np.linspace(30, 36, 50)
        eq_smooth = 1.0 + t_smooth * 0.012 + np.random.default_rng(7).normal(0, 0.005, 200)
        eq_crash  = np.linspace(eq_smooth[-1], 0.85, 50)

        smooth_pts = [ax_eq.coords_to_point(t_smooth[i], eq_smooth[i]) for i in range(200)]
        crash_pts  = [ax_eq.coords_to_point(t_crash[i],  eq_crash[i])  for i in range(50)]

        smooth_line = VMobject(color=TEAL, stroke_width=3)
        smooth_line.set_points_smoothly(smooth_pts)
        crash_line  = VMobject(color=RED, stroke_width=3)
        crash_line.set_points_smoothly(crash_pts)

        high_sharpe = Text("Sharpe ≈ 2.1  ✓", font_size=18, color=TEAL)\
                        .next_to(ax_eq.coords_to_point(15, 1.35), UP, buff=0.1)
        blowup_lbl  = Text("Strategy\nblowup", font_size=16, color=RED)\
                        .next_to(ax_eq.coords_to_point(33, 0.9), DOWN, buff=0.1)

        trap_bullets = VGroup(
            Text("Selling naked puts / tail risk premiums", font_size=18, color=WHITE),
            Text("Consistent small gains  →  occasional catastrophic loss", font_size=18, color=WHITE),
            Text("High Sharpe right up until it isn't", font_size=18, color=RED),
            Text("Always pair Sharpe with: Max DD  |  CVaR 95%  |  Skewness  |  Kurtosis",
                 font_size=17, color=GOLD),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.15)\
         .add_background_rectangle(color=BG, opacity=0.9, buff=0.2)\
         .to_corner(DR, buff=0.3)

        with self.voiceover(
            "Now the most important warning. Some strategies manufacture high Sharpe Ratios by "
            "selling tail risk — consistently collecting small premiums from selling naked puts "
            "or short volatility strategies."
        ) as tracker:
            self.play(FadeIn(trap_title), run_time=0.6)
            self.play(Create(ax_eq), run_time=0.8)
            self.wait(tracker.duration - 1.4)

        with self.voiceover(
            "This produces a smooth return series right up until a volatility spike wipes them out. "
            "Watch this equity curve: beautiful, steady growth, Sharpe of two point one."
        ) as tracker:
            self.play(Create(smooth_line), run_time=1.5)
            self.play(FadeIn(high_sharpe), run_time=0.6)
            self.wait(tracker.duration - 2.1)

        with self.voiceover(
            "Then a sudden cliff. The Sharpe looked great the whole time. "
            "This is the Sharpe Ratio trap."
        ) as tracker:
            self.play(Create(crash_line), run_time=0.8)
            self.play(FadeIn(blowup_lbl), run_time=0.5)
            self.wait(tracker.duration - 1.4)

        with self.voiceover(
            "Always pair Sharpe with tail metrics: "
            "maximum drawdown, CVaR at ninety-five percent, skewness, and kurtosis."
        ) as tracker:
            self.play(FadeIn(trap_bullets), run_time=0.8)
            self.wait(tracker.duration - 0.8)
        self.play(FadeOut(trap_title, ax_eq, smooth_line, crash_line,
                          high_sharpe, blowup_lbl, trap_bullets))

        # ══════════════════════════════════════════════════════════════════════
        # DEFI  3:30–3:50
        # ══════════════════════════════════════════════════════════════════════
        defi_title = Text("DeFi: Asymmetric by Design", font_size=26, color=GOLD)\
                       .next_to(title, DOWN, buff=0.35)

        defi_cards = VGroup(
            VGroup(
                Text("Liquidity Provision", font_size=20, color=TEAL, weight=BOLD),
                Text("Gradual IL accumulation", font_size=17, color=RED),
                Text("+ steady fee income", font_size=17, color=TEAL),
                Text("→ Right-skewed profile", font_size=17, color=WHITE),
                Text("USE SORTINO", font_size=17, color=TEAL, weight=BOLD),
            ).arrange(DOWN, aligned_edge=LEFT, buff=0.12)
             .add_background_rectangle(color="#001a0d", opacity=0.7, buff=0.2),
            VGroup(
                Text("Funding Rate Arbitrage", font_size=20, color=BLUE, weight=BOLD),
                Text("Near-normal daily returns", font_size=17, color=WHITE),
                Text("+ rare spike events", font_size=17, color=RED),
                Text("→ Slight left-skew from spikes", font_size=17, color=WHITE),
                Text("USE SHARPE + CVaR", font_size=17, color=BLUE, weight=BOLD),
            ).arrange(DOWN, aligned_edge=LEFT, buff=0.12)
             .add_background_rectangle(color="#00001a", opacity=0.7, buff=0.2),
        ).arrange(RIGHT, buff=1.0).next_to(defi_title, DOWN, buff=0.4)

        with self.voiceover(
            "For DeFi specifically: liquidity provision strategies have asymmetric profiles — "
            "gradual impermanent loss accumulation punctuated by fee income creates a "
            "right-skewed return distribution. Use Sortino here."
        ) as tracker:
            self.play(FadeIn(defi_title), run_time=0.6)
            self.play(FadeIn(defi_cards[0]), run_time=0.8)
            self.wait(tracker.duration - 1.4)

        with self.voiceover(
            "Funding rate arbitrage has near-normally distributed daily returns with rare "
            "positive funding spike events. Sharpe works there, but always pair it with CVaR "
            "to catch the spike risk."
        ) as tracker:
            self.play(FadeIn(defi_cards[1]), run_time=0.8)
            self.wait(tracker.duration - 0.8)
        self.play(FadeOut(defi_title, defi_cards))

        # ══════════════════════════════════════════════════════════════════════
        # TAKEAWAY  3:50–4:30
        # ══════════════════════════════════════════════════════════════════════
        takeaway_title = Text("Reading the Signal: Sortino vs Sharpe", font_size=24, color=GOLD)\
                           .next_to(title, DOWN, buff=0.35)

        signal_rows = VGroup(
            VGroup(
                MathTex(r"Sortino \gg Sharpe", font_size=30, color=TEAL),
                Text("  →  Positive skew  →  Fat right tail  →  Usually GOOD",
                     font_size=19, color=TEAL),
            ).arrange(RIGHT, buff=0.2),
            VGroup(
                MathTex(r"Sortino \approx Sharpe", font_size=30, color=WHITE),
                Text("  →  Near-symmetric distribution  →  Metrics agree",
                     font_size=19, color=WHITE),
            ).arrange(RIGHT, buff=0.2),
            VGroup(
                MathTex(r"Sortino < Sharpe", font_size=30, color=RED),
                Text("  →  Negative skew  →  Hidden tail risk  →  INVESTIGATE",
                     font_size=19, color=RED),
            ).arrange(RIGHT, buff=0.2),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.35).next_to(takeaway_title, DOWN, buff=0.4)

        min_standard = VGroup(
            Text("Minimum reporting standard:", font_size=18, color=GRAY),
            Text("Sharpe  ·  Sortino  ·  Max Drawdown  ·  Skewness",
                 font_size=20, color=GOLD),
        ).arrange(DOWN, buff=0.1)\
         .add_background_rectangle(color="#1a1000", opacity=0.8, buff=0.2)\
         .to_edge(DOWN, buff=0.4)

        box_bad = SurroundingRectangle(signal_rows[2], color=RED, buff=0.1, corner_radius=0.08)

        with self.voiceover(
            "Never evaluate a strategy with a single metric. "
            "If the Sortino is significantly higher than the Sharpe, "
            "the strategy has positive skew — a fat right tail — that's usually good news."
        ) as tracker:
            self.play(FadeIn(takeaway_title), run_time=0.6)
            self.play(FadeIn(signal_rows[0]), run_time=0.8)
            self.wait(tracker.duration - 1.4)

        with self.voiceover(
            "If they are roughly equal, the distribution is near-symmetric and the metrics agree."
        ) as tracker:
            self.play(FadeIn(signal_rows[1]), run_time=0.8)
            self.wait(tracker.duration - 0.8)

        with self.voiceover(
            "If the Sortino is lower than the Sharpe, the strategy has negative skew — "
            "hidden tail risk lurking below the surface. That is your red flag."
        ) as tracker:
            self.play(FadeIn(signal_rows[2]), run_time=0.8)
            self.play(Create(box_bad), run_time=0.6)
            self.wait(tracker.duration - 1.4)

        with self.voiceover(
            "Minimum reporting standard: Sharpe, Sortino, Max Drawdown, and Skewness. "
            "Never just one number."
        ) as tracker:
            self.play(FadeIn(min_standard), run_time=0.8)
            self.wait(tracker.duration - 0.8)

        # ══════════════════════════════════════════════════════════════════════
        # CTA  4:30–5:00
        # ══════════════════════════════════════════════════════════════════════
        with self.voiceover(
            "Next up: Value at Risk — how do quants put an actual dollar figure on the worst-case "
            "loss? It's the number regulators require, and it has some nasty surprises. Subscribe "
            "and I'll see you in the next episode. QuantiFire."
        ) as tracker:
            self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.8)
            outro   = Text("QuantiFire  |  EP 03", font_size=34, color=GOLD).move_to(ORIGIN)
            next_ep = Text("Next → EP 04: Value at Risk — the number regulators require",
                           font_size=20, color=WHITE).next_to(outro, DOWN, buff=0.4)
            self.play(FadeIn(outro), FadeIn(next_ep))
            self.wait(tracker.duration - 0.8)
