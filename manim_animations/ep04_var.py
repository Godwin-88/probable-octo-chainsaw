"""
QuantiFire EP04 — Value at Risk: How Much Can You Lose on a Bad Day?
Run: manim -pql ep04_var.py VaRScene
Audio: AI voiceover via manim-voiceover
"""
from manim import *
from manim_voiceover import VoiceoverScene
from manim_voiceover.services.gtts import GTTSService
# PRODUCTION: from manim_voiceover.services.elevenlabs import ElevenLabsService
import numpy as np
from scipy.stats import norm, t as t_dist

GOLD  = "#FFB700"
TEAL  = "#00C896"
RED   = "#FF4444"
BLUE  = "#4A90E2"
GRAY  = "#888888"
BG    = "#0D0D0D"

# ─── helpers ──────────────────────────────────────────────────────────────────

def clear(scene):
    scene.play(*[FadeOut(m) for m in scene.mobjects], run_time=0.5)


class VaRScene(VoiceoverScene):
    def construct(self):
        self.camera.background_color = BG
        self.set_speech_service(GTTSService(lang="en"))
        # PRODUCTION: self.set_speech_service(ElevenLabsService(voice_id="pNInz6obpgDQGcFmaJgB", model="eleven_turbo_v2"))

        self._scene_hook()
        self._scene_context()
        self._scene_hist_sim()
        self._scene_parametric_normal()
        self._scene_student_t()
        self._scene_sqrt_time()
        self._scene_var_limitation()
        self._scene_cvar()
        self._scene_defi()
        self._scene_takeaway()
        self._scene_cta()

    # ── SCENE 1: HOOK ─────────────────────────────────────────────────────────
    def _scene_hook(self):
        question = Text(
            "How much can you lose\non a really bad day?",
            font_size=42, color=WHITE, line_spacing=1.3
        ).shift(UP * 0.6)

        users = VGroup(
            Text("Banks", font_size=24, color=TEAL),
            Text("Hedge Funds", font_size=24, color=TEAL),
            Text("DeFi Protocols", font_size=24, color=TEAL),
        ).arrange(RIGHT, buff=1.0).next_to(question, DOWN, buff=0.6)

        var_stamp = Text("Value at Risk", font_size=52, color=GOLD, weight=BOLD)\
                       .shift(DOWN * 1.4)
        answer = Text("— the industry's standard answer —", font_size=22, color=GRAY)\
                    .next_to(var_stamp, DOWN, buff=0.2)

        with self.voiceover(
            "Every major bank, hedge fund, and now DeFi protocol needs to answer one question: "
            "how much could we lose in a really bad day? Value at Risk — VaR — is the industry's "
            "standard answer. It's a single number that regulators require, risk managers report, "
            "and traders live by. Today I'll show you three ways to calculate it and when each "
            "one lies to you."
        ) as tracker:
            self.play(FadeIn(question), run_time=1.2)
            self.play(LaggedStart(*[FadeIn(u) for u in users], lag_ratio=0.3), run_time=1.0)
            self.play(FadeIn(var_stamp), FadeIn(answer), run_time=1.0)
            self.wait(tracker.duration - 3.5)

        clear(self)

    # ── SCENE 2: CONTEXT ──────────────────────────────────────────────────────
    def _scene_context(self):
        title = Text("The VaR Standard", font_size=34, color=GOLD).to_edge(UP, buff=0.5)
        self.play(Write(title))

        origin = VGroup(
            Text("JP Morgan RiskMetrics — 1990s", font_size=24, color=TEAL),
            Text("Global standard post-Basel II", font_size=24, color=WHITE),
        ).arrange(DOWN, buff=0.25).shift(UP * 0.8)

        defn_box = Rectangle(width=10, height=1.8, fill_color="#1A1A2E",
                             fill_opacity=1, stroke_color=GOLD, stroke_width=1.5)\
                      .shift(DOWN * 0.1)
        defn_text = Text(
            "The maximum loss NOT exceeded\nwith probability  α  over a given horizon",
            font_size=26, color=WHITE, line_spacing=1.3
        ).move_to(defn_box)

        example = VGroup(
            Text("95% confidence, 1-day horizon  →  5% VaR", font_size=22, color=GOLD),
            Text("On 95 out of 100 trading days, losses won't exceed this number.",
                 font_size=20, color=GRAY),
        ).arrange(DOWN, buff=0.2).shift(DOWN * 1.8)

        with self.voiceover(
            "Welcome to QuantiFire. VaR was popularized by JP Morgan's RiskMetrics in the 1990s "
            "and became the global risk standard post-Basel II. It's defined simply: the maximum "
            "loss not exceeded with probability alpha over a given horizon. At 95% confidence over "
            "one day — 5% VaR — you're saying: on 95 out of 100 trading days, losses won't exceed "
            "this number."
        ) as tracker:
            self.play(LaggedStart(*[FadeIn(o) for o in origin], lag_ratio=0.4), run_time=1.2)
            self.play(FadeIn(defn_box), Write(defn_text), run_time=1.2)
            self.play(LaggedStart(*[FadeIn(e) for e in example], lag_ratio=0.4), run_time=1.0)
            self.wait(tracker.duration - 3.5)

        clear(self)

    # ── SCENE 3: HISTORICAL SIMULATION ────────────────────────────────────────
    def _scene_hist_sim(self):
        title = Text("Method 1 — Historical Simulation", font_size=30, color=GOLD).to_edge(UP, buff=0.5)
        self.play(Write(title))

        # Simulate 500 daily P&L values and sort them
        rng = np.random.default_rng(42)
        raw = rng.normal(0.0005, 0.012, 500)
        sorted_pnl = np.sort(raw)          # worst → best

        # Show only first 80 bars to keep chart readable
        n_show = 80
        sample = sorted_pnl[:n_show]
        threshold_idx = int(500 * 0.05) - 1   # 24th index (25th obs)

        axes = Axes(
            x_range=[0, n_show, 10], y_range=[min(sample) * 1.1, 0.005, 0.01],
            x_length=9.5, y_length=3.6,
            axis_config={"color": GRAY, "include_numbers": False},
            tips=False,
        ).shift(DOWN * 0.6)

        x_lbl = Text("Observation rank (worst → best)", font_size=17, color=GRAY)\
                    .next_to(axes.x_axis.get_end(), RIGHT, buff=0.1)
        y_lbl = Text("Daily P&L", font_size=17, color=GRAY)\
                    .next_to(axes.y_axis.get_end(), UP, buff=0.1)
        self.play(Create(axes), Write(x_lbl), Write(y_lbl))

        bar_width = 9.5 / n_show * 0.85
        bars = VGroup()
        for i, val in enumerate(sample):
            color = RED if i <= threshold_idx else GRAY
            bar = Rectangle(
                width=bar_width,
                height=abs(val) * 3.6 / (abs(min(sample)) * 1.1),
                fill_color=color, fill_opacity=0.8,
                stroke_width=0
            )
            bar.move_to(axes.coords_to_point(i + 0.5, 0), aligned_edge=UP)
            bars.add(bar)

        with self.voiceover(
            "Method one: Historical Simulation. Take your portfolio's actual historical P and L "
            "series — say 500 days. Sort losses from worst to best. The 5% VaR is the loss at the "
            "25th worst observation — that's 500 times 0.05. "
            "No distributional assumptions at all."
        ) as tracker:
            self.play(LaggedStart(*[GrowFromEdge(b, UP) for b in bars], lag_ratio=0.04),
                      run_time=min(tracker.duration, 3.5))
            self.wait(max(0, tracker.duration - 3.5))

        # Highlight the VaR bar
        var_bar = bars[threshold_idx]
        highlight_ring = SurroundingRectangle(var_bar, color=GOLD, stroke_width=2.5, buff=0.04)
        var_idx_lbl = Text("25th obs\n= 5% VaR", font_size=17, color=GOLD)\
                         .next_to(highlight_ring, UP, buff=0.15)

        formula = MathTex(r"\text{VaR}_\alpha = -\hat{q}_\alpha(r)", font_size=32, color=WHITE)\
                     .to_edge(DOWN, buff=0.6)

        with self.voiceover(
            "The formula reads: VaR at confidence alpha equals the negative of the empirical "
            "alpha-quantile of historical returns. Pros: fully non-parametric, captures fat tails "
            "and actual market behavior. Cons: completely dependent on the historical window. "
            "If your window doesn't include a crisis, your VaR will chronically underestimate risk."
        ) as tracker:
            self.play(Create(highlight_ring), Write(var_idx_lbl), run_time=1.2)
            self.play(Write(formula), run_time=1.2)
            self.wait(tracker.duration - 2.5)

        clear(self)

    # ── SCENE 4: PARAMETRIC NORMAL ─────────────────────────────────────────────
    def _scene_parametric_normal(self):
        title = Text("Method 2 — Parametric (Normal)", font_size=30, color=GOLD).to_edge(UP, buff=0.5)
        self.play(Write(title))

        # Formula with Brace labels
        formula = MathTex(
            r"\text{VaR}_\alpha = -(\mu - z_\alpha \cdot \sigma)",
            font_size=38, color=WHITE
        ).shift(UP * 2.2)

        brace_z = Brace(formula[0][11:16], DOWN, color=BLUE)
        lbl_z   = Text("z = 1.645\n(95% conf.)", font_size=17, color=BLUE)\
                     .next_to(brace_z, DOWN, buff=0.1)

        brace_s = Brace(formula[0][17:], DOWN, color=TEAL)
        lbl_s   = Text("portfolio\nvolatility", font_size=17, color=TEAL)\
                     .next_to(brace_s, DOWN, buff=0.1)

        # Normal distribution curve
        axes = Axes(
            x_range=[-4.5, 4.5, 1], y_range=[0, 0.45, 0.1],
            x_length=9, y_length=3.2,
            axis_config={"color": GRAY, "include_numbers": False},
            tips=False,
        ).shift(DOWN * 0.8)

        x_lbl = Text("Daily Return (σ units)", font_size=17, color=GRAY)\
                    .next_to(axes.x_axis.get_end(), RIGHT, buff=0.1)
        curve = axes.plot(lambda x: norm.pdf(x), x_range=[-4.4, 4.4, 0.02],
                          color=BLUE, stroke_width=2.5)
        z95 = -1.645
        tail = axes.get_area(curve, x_range=[-4.4, z95], color=RED, opacity=0.65)
        var_line = DashedLine(
            axes.coords_to_point(z95, 0),
            axes.coords_to_point(z95, 0.36),
            color=GOLD, stroke_width=2
        )
        var_lbl = Text("VaR₉₅", font_size=18, color=GOLD)\
                     .next_to(axes.coords_to_point(z95, 0.36), UP, buff=0.08)
        pct_lbl = Text("5% tail", font_size=17, color=RED)\
                     .next_to(axes.coords_to_point(-3.2, 0.04), DOWN, buff=0.1)

        with self.voiceover(
            "Method two: Parametric Normal. Assume returns are normally distributed. "
            "VaR equals the negative of the mean minus z-alpha times sigma — where z equals 1.645 "
            "for 95% confidence. Scale to portfolio value by multiplying by total capital. "
            "Pros: fast, analytically tractable, easy to decompose by asset."
        ) as tracker:
            self.play(Write(formula), run_time=1.2)
            self.play(Create(brace_z), FadeIn(lbl_z), run_time=0.8)
            self.play(Create(brace_s), FadeIn(lbl_s), run_time=0.8)
            self.play(Create(axes), Write(x_lbl), run_time=0.8)
            self.play(Create(curve), run_time=0.8)
            self.play(FadeIn(tail), Create(var_line), Write(var_lbl), Write(pct_lbl), run_time=1.0)
            self.wait(tracker.duration - 5.0)

        # Fat-tail warning
        warning = VGroup(
            Text("WARNING: Financial returns have fat tails.", font_size=20, color=RED),
            Text("A 5-sigma event should happen once per 3.5 million days.", font_size=18, color=GRAY),
            Text("In markets, it happens every few years.", font_size=18, color=RED),
        ).arrange(DOWN, buff=0.18).to_edge(DOWN, buff=0.5)

        with self.voiceover(
            "Cons: financial returns have fat tails. The normal distribution massively "
            "underestimates tail losses. A 5-sigma event that should happen once every "
            "3.5 million days happens every few years in real markets."
        ) as tracker:
            self.play(LaggedStart(*[FadeIn(w) for w in warning], lag_ratio=0.3),
                      run_time=tracker.duration * 0.6)
            self.wait(tracker.duration * 0.4)

        clear(self)

    # ── SCENE 5: STUDENT-t ────────────────────────────────────────────────────
    def _scene_student_t(self):
        title = Text("Method 3 — Parametric (Student-t)", font_size=30, color=GOLD).to_edge(UP, buff=0.5)
        self.play(Write(title))

        formula = MathTex(
            r"\text{VaR}_\alpha = -(\mu - t_{\nu,\alpha} \cdot \sigma)",
            font_size=38, color=WHITE
        ).shift(UP * 2.2)

        nu_note = Text("ν ≈ 4–6  →  realistic fat tails matching equity returns",
                       font_size=20, color=TEAL).next_to(formula, DOWN, buff=0.3)
        inf_note = Text("As  ν → ∞  →  reduces back to Normal VaR",
                        font_size=18, color=GRAY).next_to(nu_note, DOWN, buff=0.2)

        # Overlay normal vs t(4) curves
        axes = Axes(
            x_range=[-5, 5, 1], y_range=[0, 0.42, 0.1],
            x_length=9, y_length=3.0,
            axis_config={"color": GRAY, "include_numbers": False},
            tips=False,
        ).shift(DOWN * 1.1)

        x_lbl = Text("Return (σ units)", font_size=17, color=GRAY)\
                    .next_to(axes.x_axis.get_end(), RIGHT, buff=0.1)

        normal_curve = axes.plot(lambda x: norm.pdf(x), x_range=[-4.9, 4.9, 0.02],
                                 color=BLUE, stroke_width=2)
        t4_curve = axes.plot(lambda x: t_dist.pdf(x, df=4), x_range=[-4.9, 4.9, 0.02],
                             color=GOLD, stroke_width=2.5)

        norm_lbl = Text("Normal", font_size=17, color=BLUE)\
                      .next_to(axes.coords_to_point(0, 0.40), LEFT, buff=0.2)
        t4_lbl   = Text("Student-t (ν=4)", font_size=17, color=GOLD)\
                      .next_to(axes.coords_to_point(3.5, 0.05), RIGHT, buff=0.1)
        fat_lbl  = Text("Fatter tails →\nhigher VaR", font_size=17, color=GOLD)\
                      .next_to(axes.coords_to_point(-4.0, 0.08), LEFT, buff=0.05)

        with self.voiceover(
            "Method three: Parametric Student-t. Replace the normal with a t-distribution "
            "with estimated degrees of freedom nu. For nu around 4 to 6, you get realistic "
            "fat tails that match equity return data. As nu approaches infinity, "
            "you recover the normal. The gold t-distribution curve is heavier in the tails — "
            "that means higher VaR estimates that better reflect true market risk. "
            "This is strictly better than the normal method for any financial return series."
        ) as tracker:
            self.play(Write(formula), run_time=1.0)
            self.play(FadeIn(nu_note), FadeIn(inf_note), run_time=1.0)
            self.play(Create(axes), Write(x_lbl), run_time=0.8)
            self.play(Create(normal_curve), Write(norm_lbl), run_time=0.8)
            self.play(Create(t4_curve), Write(t4_lbl), run_time=0.8)
            self.play(FadeIn(fat_lbl), run_time=0.6)
            self.wait(tracker.duration - 4.5)

        clear(self)

    # ── SCENE 6: SQRT-OF-TIME SCALING ─────────────────────────────────────────
    def _scene_sqrt_time(self):
        title = Text("VaR Scaling: Square-Root-of-Time Rule", font_size=30, color=GOLD).to_edge(UP, buff=0.5)
        self.play(Write(title))

        formula = MathTex(
            r"\text{VaR}_T = \text{VaR}_1 \cdot \sqrt{T}",
            font_size=44, color=WHITE
        ).shift(UP * 1.2)

        brace_t = Brace(formula[0][8:], DOWN, color=TEAL)
        lbl_t   = Text("horizon in trading days", font_size=19, color=TEAL)\
                     .next_to(brace_t, DOWN, buff=0.1)

        # Example bar chart: 1-day, 5-day, 10-day VaR
        var1 = 1.0
        horizons = [1, 5, 10, 22]
        var_vals = [var1 * np.sqrt(T) for T in horizons]
        bar_labels = ["1d", "5d", "10d", "22d"]
        colors = [TEAL, BLUE, GOLD, RED]

        axes = Axes(
            x_range=[0, 5, 1], y_range=[0, 5.5, 1],
            x_length=7, y_length=2.8,
            axis_config={"color": GRAY, "include_numbers": False},
            tips=False,
        ).shift(DOWN * 1.4)

        bar_group = VGroup()
        bar_lbls  = VGroup()
        val_lbls  = VGroup()
        for i, (T, v, lbl, col) in enumerate(zip(horizons, var_vals, bar_labels, colors)):
            bar = Rectangle(
                width=0.7,
                height=v * 2.8 / 5.5,
                fill_color=col, fill_opacity=0.75, stroke_width=0
            ).move_to(axes.coords_to_point(i + 0.8, 0), aligned_edge=DOWN)
            bar_group.add(bar)
            bar_lbls.add(
                Text(lbl, font_size=17, color=col)
                .next_to(axes.coords_to_point(i + 0.8, 0), DOWN, buff=0.12)
            )
            val_lbls.add(
                Text(f"×{v:.1f}", font_size=15, color=col)
                .next_to(bar, UP, buff=0.1)
            )

        iid_note = VGroup(
            Text("Holds ONLY if returns are i.i.d.", font_size=19, color=RED),
            Text("Volatility clustering → rule understates multi-day VaR in crises",
                 font_size=17, color=GRAY),
        ).arrange(DOWN, buff=0.15).to_edge(DOWN, buff=0.5)

        with self.voiceover(
            "VaR Scaling: the square-root-of-time rule. To convert a 1-day VaR to a T-day VaR, "
            "multiply by the square root of T. A 5-day VaR is roughly 2.2 times the 1-day VaR. "
            "A 22-day monthly VaR is about 4.7 times the daily figure."
        ) as tracker:
            self.play(Write(formula), run_time=1.0)
            self.play(Create(brace_t), FadeIn(lbl_t), run_time=0.8)
            self.play(Create(axes), run_time=0.6)
            self.play(LaggedStart(*[GrowFromEdge(b, DOWN) for b in bar_group], lag_ratio=0.2),
                      LaggedStart(*[FadeIn(l) for l in bar_lbls], lag_ratio=0.2),
                      LaggedStart(*[FadeIn(v) for v in val_lbls], lag_ratio=0.2),
                      run_time=1.5)
            self.wait(tracker.duration - 3.5)

        with self.voiceover(
            "Important caveat: this holds only if returns are independent and identically "
            "distributed. In practice, volatility clusters — bad days follow bad days. "
            "The square-root rule understates multi-day VaR during market stress periods."
        ) as tracker:
            self.play(LaggedStart(*[FadeIn(n) for n in iid_note], lag_ratio=0.4),
                      run_time=tracker.duration * 0.5)
            self.wait(tracker.duration * 0.5)

        clear(self)

    # ── SCENE 7: VAR LIMITATION ───────────────────────────────────────────────
    def _scene_var_limitation(self):
        title = Text("The Biggest VaR Limitation", font_size=30, color=GOLD).to_edge(UP, buff=0.5)
        self.play(Write(title))

        subtitle = Text(
            "Two strategies — identical VaR — wildly different risk profiles",
            font_size=21, color=WHITE
        ).next_to(title, DOWN, buff=0.2)
        self.play(FadeIn(subtitle))

        # Strategy A: loses exactly VaR 5% of the time
        # Strategy B: occasionally loses 10× VaR
        axes_a = Axes(
            x_range=[-12, 3, 3], y_range=[0, 0.55, 0.1],
            x_length=5, y_length=2.6,
            axis_config={"color": GRAY, "include_numbers": False},
            tips=False,
        ).shift(LEFT * 3.2 + DOWN * 0.8)

        axes_b = Axes(
            x_range=[-12, 3, 3], y_range=[0, 0.55, 0.1],
            x_length=5, y_length=2.6,
            axis_config={"color": GRAY, "include_numbers": False},
            tips=False,
        ).shift(RIGHT * 3.2 + DOWN * 0.8)

        # Strategy A: truncated normal, losses capped near VaR
        curve_a = axes_a.plot(
            lambda x: norm.pdf(x, 0, 1.5) * (1 if x > -2.5 else 0.05),
            x_range=[-11.9, 2.9, 0.05], color=TEAL, stroke_width=2.5
        )
        # Strategy B: normal + spike deep in the left tail
        def strat_b(x):
            base = norm.pdf(x, 0, 1.5)
            spike = 0.35 * norm.pdf(x, -9, 0.6)
            return base + spike
        curve_b = axes_b.plot(strat_b, x_range=[-11.9, 2.9, 0.05], color=GOLD, stroke_width=2.5)

        # VaR line at same position for both
        z_var = -2.47
        line_a = DashedLine(axes_a.coords_to_point(z_var, 0),
                            axes_a.coords_to_point(z_var, 0.48), color=RED, stroke_width=2)
        line_b = DashedLine(axes_b.coords_to_point(z_var, 0),
                            axes_b.coords_to_point(z_var, 0.48), color=RED, stroke_width=2)

        lbl_a = Text("Strategy A", font_size=20, color=TEAL)\
                   .next_to(axes_a, UP, buff=0.15)
        lbl_b = Text("Strategy B", font_size=20, color=GOLD)\
                   .next_to(axes_b, UP, buff=0.15)
        var_lbl_a = Text("VaR", font_size=15, color=RED)\
                       .next_to(axes_a.coords_to_point(z_var, 0.48), UP, buff=0.05)
        var_lbl_b = Text("VaR", font_size=15, color=RED)\
                       .next_to(axes_b.coords_to_point(z_var, 0.48), UP, buff=0.05)
        same_var = Text("← same VaR →", font_size=18, color=RED).shift(DOWN * 2.3)

        tail_spike = Text("Hidden\ntail spike!", font_size=16, color=RED)\
                        .next_to(axes_b.coords_to_point(-9, 0.35), UP, buff=0.1)

        with self.voiceover(
            "VaR's biggest limitation: it tells you the threshold, but says nothing about "
            "how bad losses can get beyond that threshold. Strategy A and Strategy B can have "
            "identical VaR numbers. Strategy A loses exactly the VaR amount when things go "
            "wrong. Strategy B occasionally loses ten times the VaR — there's a hidden tail spike "
            "the VaR number completely ignores. These are wildly different risk profiles."
        ) as tracker:
            self.play(Create(axes_a), Create(axes_b), Write(lbl_a), Write(lbl_b), run_time=1.0)
            self.play(Create(curve_a), Create(curve_b), run_time=1.2)
            self.play(Create(line_a), Create(line_b),
                      Write(var_lbl_a), Write(var_lbl_b), FadeIn(same_var), run_time=1.0)
            self.play(FadeIn(tail_spike), run_time=0.8)
            self.wait(tracker.duration - 4.0)

        clear(self)

    # ── SCENE 8: CVAR ─────────────────────────────────────────────────────────
    def _scene_cvar(self):
        title = Text("Expected Shortfall — CVaR", font_size=30, color=GOLD).to_edge(UP, buff=0.5)
        self.play(Write(title))

        formula = MathTex(
            r"\text{CVaR}_\alpha = -\mathbb{E}[\,r \mid r < -\text{VaR}_\alpha\,]",
            font_size=36, color=WHITE
        ).shift(UP * 2.0)

        meaning = Text(
            "The expected loss GIVEN you've already breached VaR",
            font_size=21, color=TEAL
        ).next_to(formula, DOWN, buff=0.25)

        # Distribution with VaR threshold and CVaR shading
        axes = Axes(
            x_range=[-4.5, 4.5, 1], y_range=[0, 0.45, 0.1],
            x_length=9, y_length=3.2,
            axis_config={"color": GRAY, "include_numbers": False},
            tips=False,
        ).shift(DOWN * 1.1)

        x_lbl = Text("Return", font_size=17, color=GRAY)\
                    .next_to(axes.x_axis.get_end(), RIGHT, buff=0.1)
        curve = axes.plot(lambda x: norm.pdf(x), x_range=[-4.4, 4.4, 0.02],
                          color=BLUE, stroke_width=2.5)
        z95 = -1.645
        tail_area = axes.get_area(curve, x_range=[-4.4, z95], color=RED, opacity=0.55)
        var_line = DashedLine(
            axes.coords_to_point(z95, 0),
            axes.coords_to_point(z95, 0.40),
            color=GOLD, stroke_width=2
        )
        var_lbl = Text("VaR\nthreshold", font_size=15, color=GOLD)\
                     .next_to(axes.coords_to_point(z95, 0.40), UP, buff=0.06)

        # CVaR arrow pointing into the tail
        cvar_pt = axes.coords_to_point(-2.5, 0.06)
        cvar_arrow = Arrow(
            axes.coords_to_point(-3.8, 0.28), cvar_pt,
            color=TEAL, stroke_width=2, buff=0.1
        )
        cvar_lbl = Text("CVaR\n(avg loss\nin red zone)", font_size=15, color=TEAL)\
                      .next_to(axes.coords_to_point(-3.8, 0.28), UP, buff=0.06)

        basel_note = Text("Basel III requires CVaR alongside VaR", font_size=19, color=GOLD)\
                        .to_edge(DOWN, buff=0.5)

        with self.voiceover(
            "This is why Expected Shortfall — also called CVaR or Conditional VaR — was developed. "
            "CVaR equals the expected loss given that you have already breached VaR. "
            "It captures the full shape of the tail — the red zone. While VaR draws a line "
            "in the sand, CVaR asks: if we cross that line, how bad does it get on average? "
            "Basel Three and most modern risk frameworks now require CVaR to be reported "
            "alongside VaR."
        ) as tracker:
            self.play(Write(formula), run_time=1.0)
            self.play(FadeIn(meaning), run_time=0.8)
            self.play(Create(axes), Write(x_lbl), run_time=0.7)
            self.play(Create(curve), run_time=0.7)
            self.play(FadeIn(tail_area), Create(var_line), Write(var_lbl), run_time=0.9)
            self.play(GrowArrow(cvar_arrow), Write(cvar_lbl), run_time=0.8)
            self.play(Write(basel_note), run_time=0.7)
            self.wait(tracker.duration - 5.0)

        clear(self)

    # ── SCENE 9: DEFI VAR ─────────────────────────────────────────────────────
    def _scene_defi(self):
        title = Text("DeFi On-Chain VaR: Two Extra Risk Terms", font_size=28, color=GOLD)\
                   .to_edge(UP, buff=0.5)
        self.play(Write(title))

        std_formula = MathTex(
            r"\text{Standard VaR} = f(\text{price returns})",
            font_size=30, color=WHITE
        ).shift(UP * 1.6)

        plus_sign = Text("+", font_size=40, color=RED).shift(UP * 0.7)

        risk1_box = RoundedRectangle(width=5.0, height=1.8, corner_radius=0.2,
                                     fill_color="#2A0A0A", fill_opacity=1,
                                     stroke_color=RED, stroke_width=1.5).shift(LEFT * 2.8 + DOWN * 0.3)
        risk1_title = Text("Liquidation Cascade Risk", font_size=19, color=RED)\
                         .move_to(risk1_box).shift(UP * 0.35)
        risk1_body  = Text("Systemic protocol correlation\nduring market stress",
                           font_size=16, color=GRAY, line_spacing=1.2)\
                         .move_to(risk1_box).shift(DOWN * 0.3)

        risk2_box = RoundedRectangle(width=5.0, height=1.8, corner_radius=0.2,
                                     fill_color="#0A1A2A", fill_opacity=1,
                                     stroke_color=BLUE, stroke_width=1.5).shift(RIGHT * 2.8 + DOWN * 0.3)
        risk2_title = Text("Smart Contract Exploit Risk", font_size=19, color=BLUE)\
                         .move_to(risk2_box).shift(UP * 0.35)
        risk2_body  = Text("Rare but catastrophic —\nnot in any price series",
                           font_size=16, color=GRAY, line_spacing=1.2)\
                         .move_to(risk2_box).shift(DOWN * 0.3)

        warning = Text(
            "Standard VaR ignoring these terms will chronically underestimate DeFi risk.",
            font_size=19, color=RED
        ).to_edge(DOWN, buff=0.5)

        with self.voiceover(
            "For DeFi: on-chain VaR needs two extra risk terms that no price series captures. "
            "First — liquidation cascade risk: during market stress, protocols become highly "
            "correlated and forced liquidations amplify losses systemically. "
            "Second — smart contract exploit risk: rare, but when it happens it can be "
            "catastrophic and instantaneous. A standard VaR model that ignores these will "
            "chronically underestimate the true risk of a DeFi portfolio."
        ) as tracker:
            self.play(Write(std_formula), run_time=0.8)
            self.play(FadeIn(plus_sign), run_time=0.5)
            self.play(FadeIn(risk1_box), Write(risk1_title), Write(risk1_body), run_time=1.0)
            self.play(FadeIn(risk2_box), Write(risk2_title), Write(risk2_body), run_time=1.0)
            self.play(Write(warning), run_time=0.8)
            self.wait(tracker.duration - 4.0)

        clear(self)

    # ── SCENE 10: TAKEAWAY ────────────────────────────────────────────────────
    def _scene_takeaway(self):
        title = Text("Takeaway", font_size=34, color=GOLD).to_edge(UP, buff=0.5)
        self.play(Write(title))

        items = [
            ("1.", "Always report VaR alongside CVaR —\nVaR says nothing about tail severity.", TEAL),
            ("2.", "Know your historical window. Does it include\na market stress event? If not, VaR is optimistic.", WHITE),
            ("3.", "Excess kurtosis > 3? Use Student-t, not Normal.\nThat's most financial assets.", GOLD),
            ("4.", "For DeFi: add liquidation cascade and\nexploit risk on top of price-return VaR.", RED),
        ]

        item_group = VGroup()
        for num, text, col in items:
            num_t  = Text(num, font_size=24, color=col)
            body_t = Text(text, font_size=20, color=WHITE, line_spacing=1.2)
            row = VGroup(num_t, body_t).arrange(RIGHT, buff=0.25, aligned_edge=UP)
            item_group.add(row)

        item_group.arrange(DOWN, buff=0.35, aligned_edge=LEFT).shift(DOWN * 0.3 + LEFT * 0.3)

        with self.voiceover(
            "Key takeaways. One: always report VaR alongside CVaR — VaR alone says nothing "
            "about how severe losses can get once you've breached the threshold. "
            "Two: know your historical window and challenge it — if it doesn't include a crisis "
            "period, your VaR is optimistic. "
            "Three: if your return series has excess kurtosis above 3 — which is most financial "
            "assets — use Student-t, not Normal. "
            "Four: for DeFi, add liquidation cascade and smart contract exploit risk on top of "
            "any price-return VaR."
        ) as tracker:
            self.play(LaggedStart(*[FadeIn(item, shift=RIGHT * 0.3) for item in item_group],
                                  lag_ratio=0.35), run_time=tracker.duration * 0.7)
            self.wait(tracker.duration * 0.3)

        clear(self)

    # ── SCENE 11: CTA ─────────────────────────────────────────────────────────
    def _scene_cta(self):
        with self.voiceover(
            "Next episode: Factor Models — how quants decompose every return into systematic "
            "exposures, and why that changes everything about how you think about alpha. "
            "Subscribe. QuantiFire."
        ) as tracker:
            teaser = VGroup(
                Text("Next → EP05", font_size=26, color=GRAY),
                Text("Factor Models: Decomposing Every Return", font_size=28, color=WHITE),
                Text("How quants separate alpha from beta", font_size=20, color=TEAL),
            ).arrange(DOWN, buff=0.3)
            outro = Text("QuantiFire  |  EP 04", font_size=32, color=GOLD).to_edge(DOWN, buff=0.8)
            self.play(LaggedStart(*[FadeIn(t) for t in teaser], lag_ratio=0.4), run_time=1.5)
            self.play(FadeIn(outro), run_time=0.8)
            self.wait(tracker.duration - 2.5)
