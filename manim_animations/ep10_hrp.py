"""
QuantiFire EP10 — Hierarchical Risk Parity: Better Portfolios Through Clustering
Run: manim -pql ep10_hrp.py HRPScene
Audio: AI voiceover via manim-voiceover

Sources cited on-screen:
  Lopez de Prado (2016) JPM 42(4) 59-69         — original HRP paper
  Ledoit & Wolf (2004) JPM 30(4) 110-119         — covariance shrinkage
  Ledoit & Wolf (2003) JEF 10(5) 603-621         — analytical shrinkage
  Mantegna (1999) EPJ-B 11 193-197               — hierarchical structure in markets
  Ward (1963) JASA 58(301) 236-244               — Ward linkage
  Chan (2009) Quantitative Trading, Wiley        — AlgorithmicTradingStrategies/
  Tulchinsky et al. (2020) Finding Alphas, Wiley — AlgorithmicTradingStrategies/
  Successful Algorithmic Trading (aat-ebook)     — AlgorithmicTradingStrategies/
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
PURPLE = "#9B59B6"
BG   = "#0D0D0D"


def clear(scene):
    scene.play(*[FadeOut(m) for m in scene.mobjects], run_time=0.5)


class HRPScene(VoiceoverScene):
    def construct(self):
        self.camera.background_color = BG
        self.set_speech_service(GTTSService(lang="en"))
        # PRODUCTION: self.set_speech_service(ElevenLabsService(...))

        self._scene_hook()
        self._scene_context()
        self._scene_mvo_problem()
        self._scene_step1_distance()
        self._scene_step2_clustering()
        self._scene_step3_quasi_diag()
        self._scene_step4_bisection()
        self._scene_why_it_works()
        self._scene_ledoit_wolf()
        self._scene_defi()
        self._scene_takeaway()
        self._scene_cta()

    # ── 1. HOOK ────────────────────────────────────────────────────────────────
    def _scene_hook(self):
        title = Text("Hierarchical Risk Parity", font_size=44, color=GOLD).to_edge(UP, buff=0.5)
        sub   = Text("Better Portfolios Through Clustering", font_size=24, color=WHITE)\
                  .next_to(title, DOWN, buff=0.2)

        ldp_quote = Text(
            '"Markowitz\'s portfolio optimizer has a fundamental\n'
            'mathematical flaw that makes it unstable in practice."',
            font_size=22, color=TEAL, slant=ITALIC
        ).shift(UP * 0.4)
        attribution = Text(
            "— Marcos Lopez de Prado, JPM (2016)",
            font_size=18, color=GRAY
        ).next_to(ldp_quote, DOWN, buff=0.25)

        challenge = Text(
            "His alternative: machine learning clustering\n"
            "builds better portfolios without inverting the covariance matrix.",
            font_size=21, color=WHITE
        ).next_to(attribution, DOWN, buff=0.4)

        with self.voiceover(
            "In 2016, Marcos Lopez de Prado — one of the most cited quants in modern finance — "
            "published a paper arguing that Markowitz's portfolio optimizer had a fundamental "
            "mathematical flaw that made it unstable in practice."
        ) as tracker:
            self.play(Write(title), FadeIn(sub), run_time=1.0)
            self.play(Write(ldp_quote), run_time=1.5)
            self.play(FadeIn(attribution), run_time=0.5)
            self.wait(tracker.duration - 3.0)

        with self.voiceover(
            "His alternative used machine learning clustering to build better portfolios "
            "without inverting the covariance matrix. Today we break down Hierarchical "
            "Risk Parity from first principles."
        ) as tracker:
            self.play(FadeIn(challenge, shift=UP * 0.2), run_time=0.8)
            self.wait(tracker.duration - 0.8)

        clear(self)

    # ── 2. CONTEXT ─────────────────────────────────────────────────────────────
    def _scene_context(self):
        title = Text("Why HRP? Three Problems Solved", font_size=34, color=GOLD)\
                  .to_edge(UP, buff=0.5)

        problems = VGroup(
            self._problem_row("❌  MVO requires matrix inversion",
                              "amplifies estimation error → unstable weights", RED),
            self._problem_row("❌  MVO weights swing wildly",
                              "small data changes → huge weight changes", RED),
            self._problem_row("❌  MVO ignores correlation structure",
                              "treats all diversification the same way", RED),
        ).arrange(DOWN, buff=0.32).next_to(title, DOWN, buff=0.45)

        solutions = VGroup(
            self._problem_row("✓  HRP: no matrix inversion needed",
                              "no error amplification — robust by design", TEAL),
            self._problem_row("✓  HRP: stable weights under noise",
                              "clustering is noise-tolerant, MVO is not", TEAL),
            self._problem_row("✓  HRP: exploits correlation hierarchy",
                              "groups correlated assets before allocating", TEAL),
        ).arrange(DOWN, buff=0.32).next_to(title, DOWN, buff=0.45)

        sources_box = self._sources_box([
            "Lopez de Prado (2016) JPM 42(4) — original HRP paper",
            "Chan (2009) Quantitative Trading, Wiley",
            "Tulchinsky et al. (2020) Finding Alphas, Wiley",
            "Successful Algorithmic Trading (aat-ebook)",
        ])

        with self.voiceover(
            "Welcome to QuantiFire. Classical MVO has three practical problems that "
            "compound each other."
        ) as tracker:
            self.play(Write(title), run_time=0.8)
            for p in problems:
                self.play(FadeIn(p, shift=RIGHT * 0.2), run_time=0.4)
            self.wait(tracker.duration - 2.0)

        with self.voiceover(
            "HRP solves all three simultaneously: no matrix inversion, stable weights "
            "under small data changes, and natural handling of the genuine correlation "
            "structure in the asset universe."
        ) as tracker:
            self.play(
                *[FadeOut(p) for p in problems],
                run_time=0.4
            )
            for s in solutions:
                self.play(FadeIn(s, shift=RIGHT * 0.2), run_time=0.4)
            self.wait(tracker.duration - 1.6)

        with self.voiceover(
            "It has been adopted by dozens of institutional investors. Lopez de Prado's "
            "2016 Journal of Portfolio Management paper is one of the most downloaded "
            "quant papers of the last decade."
        ) as tracker:
            self.play(FadeIn(sources_box), run_time=0.6)
            self.wait(tracker.duration - 0.6)

        clear(self)

    # ── 3. THE MVO PROBLEM ─────────────────────────────────────────────────────
    def _scene_mvo_problem(self):
        title = Text("The Problem HRP Solves", font_size=34, color=GOLD)\
                  .to_edge(UP, buff=0.5)

        mvo_formula = MathTex(
            r"w^* = \Sigma^{-1} \mu",
            font_size=52, color=RED
        ).shift(UP * 1.5)

        brace_inv = Brace(MathTex(r"\Sigma^{-1}", font_size=52).shift(UP * 1.5), DOWN, color=RED)
        brace_lbl = Text("matrix inversion\namplifies errors", font_size=18, color=RED)\
                      .next_to(brace_inv, DOWN, buff=0.1)

        comparison = VGroup(
            self._compare_row("Small ρ change", "+2% correlation",  "→ weights swing ±60%", RED),
            self._compare_row("Estimation error", "noise in Σ",     "→ concentrated bets",  RED),
            self._compare_row("Out-of-sample",   "MVO theory",      "→ often beaten by 1/N",RED),
        ).arrange(DOWN, buff=0.3).shift(DOWN * 0.5)

        ref_note = Text(
            "Chan (2009): 'The inverse of the covariance matrix magnifies sample noise' — Ch.6",
            font_size=16, color=GRAY
        ).to_edge(DOWN, buff=0.3)

        with self.voiceover(
            "MVO computes optimal weights as the inverse of the covariance matrix times "
            "expected returns. The matrix inversion is the root of the instability."
        ) as tracker:
            self.play(Write(title), run_time=0.8)
            self.play(Write(mvo_formula), run_time=1.0)
            self.wait(tracker.duration - 1.8)

        with self.voiceover(
            "Matrix inversion amplifies estimation errors. A small change in correlations "
            "produces enormous swings in optimal weights. Estimation noise in the covariance "
            "matrix gets converted into concentrated, unstable bets."
        ) as tracker:
            self.play(Create(brace_inv), FadeIn(brace_lbl), run_time=0.7)
            for row in comparison:
                self.play(FadeIn(row, shift=RIGHT * 0.2), run_time=0.4)
            self.wait(tracker.duration - 1.9)

        with self.voiceover(
            "Out-of-sample, MVO portfolios often underperform naive one-over-N equal weight. "
            "Ernest Chan's Quantitative Trading dedicates an entire chapter to this instability. "
            "HRP is built to avoid it entirely."
        ) as tracker:
            self.play(FadeIn(ref_note), run_time=0.6)
            self.wait(tracker.duration - 0.6)

        clear(self)

    # ── 4. STEP 1 — DISTANCE MATRIX ───────────────────────────────────────────
    def _scene_step1_distance(self):
        title = Text("Step 1 — Correlation Distance Matrix", font_size=32, color=GOLD)\
                  .to_edge(UP, buff=0.5)

        formula = MathTex(
            r"d_{ij}", r"=", r"\sqrt{2\,(1 - \rho_{ij})}",
            font_size=52, color=TEAL
        ).shift(UP * 1.4)

        brace_d   = Brace(formula[0], DOWN, color=TEAL)
        lbl_d     = Text("distance between\nassets i and j", font_size=18, color=TEAL)\
                      .next_to(brace_d, DOWN, buff=0.1)
        brace_rho = Brace(formula[2], DOWN, color=GOLD)
        lbl_rho   = Text("Pearson correlation\ncoefficient", font_size=18, color=GOLD)\
                      .next_to(brace_rho, DOWN, buff=0.1)

        props = VGroup(
            Text("ρ = +1  →  d = 0    (perfectly correlated = same cluster)", font_size=19, color=WHITE),
            Text("ρ =  0  →  d = √2   (uncorrelated = far apart)", font_size=19, color=WHITE),
            Text("ρ = –1  →  d = 2    (perfectly anti-correlated = opposite)", font_size=19, color=WHITE),
        ).arrange(DOWN, buff=0.25, aligned_edge=LEFT).shift(DOWN * 1.5)

        mantegna_note = Text(
            "Mantegna (1999): metric distance on financial correlations — EPJ-B 11, 193–197",
            font_size=16, color=GRAY
        ).to_edge(DOWN, buff=0.3)

        with self.voiceover(
            "Step one: convert correlations into a proper metric distance. d-ij equals the "
            "square root of 2 times 1 minus the Pearson correlation between assets i and j."
        ) as tracker:
            self.play(Write(title), run_time=0.8)
            self.play(Write(formula), run_time=1.2)
            self.wait(tracker.duration - 2.0)

        with self.voiceover(
            "The formula by Mantegna ensures this is a proper Euclidean metric distance. "
            "Assets that are perfectly correlated have distance zero. Uncorrelated assets "
            "have distance root-2. Anti-correlated assets sit furthest apart at distance 2."
        ) as tracker:
            self.play(Create(brace_d), FadeIn(lbl_d), run_time=0.6)
            self.play(Create(brace_rho), FadeIn(lbl_rho), run_time=0.6)
            for p in props:
                self.play(FadeIn(p, shift=RIGHT * 0.2), run_time=0.4)
            self.wait(tracker.duration - 2.0)

        with self.voiceover(
            "This distance matrix is the input to hierarchical clustering in Step 2. "
            "Mantegna first proposed this construction for financial markets in 1999."
        ) as tracker:
            self.play(FadeIn(mantegna_note), run_time=0.6)
            self.wait(tracker.duration - 0.6)

        clear(self)

    # ── 5. STEP 2 — CLUSTERING & DENDROGRAM ───────────────────────────────────
    def _scene_step2_clustering(self):
        title = Text("Step 2 — Hierarchical Clustering (Ward Linkage)", font_size=30, color=GOLD)\
                  .to_edge(UP, buff=0.5)

        assets = ["ETH", "BTC", "AAVE", "UNI", "USDC", "DAI"]
        x_pos  = np.array([-4.2, -3.0, -1.4, -0.2, 1.4, 2.6])
        y_base = -2.4

        leaf_dots = VGroup()
        leaf_lbls = VGroup()
        col_map   = [BLUE, BLUE, GOLD, GOLD, TEAL, TEAL]
        for x, name, col in zip(x_pos, assets, col_map):
            d = Dot([x, y_base, 0], color=col, radius=0.09)
            l = Text(name, font_size=18, color=col).next_to(d, DOWN, buff=0.1)
            leaf_dots.add(d)
            leaf_lbls.add(l)

        c1_x, c1_y = float(np.mean(x_pos[0:2])), -1.4
        c2_x, c2_y = float(np.mean(x_pos[2:4])), -1.4
        c3_x, c3_y = float(np.mean(x_pos[4:6])), -1.5
        top_y  = -0.4
        root_y = 0.5
        defi_x = float(np.mean([c1_x, c2_x]))

        def hline(x1, x2, y, col):
            return Line([x1, y, 0], [x2, y, 0], color=col, stroke_width=2.5)

        def vline(x, y0, y1, col):
            return Line([x, y0, 0], [x, y1, 0], color=col, stroke_width=2.5)

        legend = VGroup(
            self._legend_item("ETH + BTC  (Layer-1)", BLUE),
            self._legend_item("AAVE + UNI  (DeFi gov.)", GOLD),
            self._legend_item("USDC + DAI  (Stablecoins)", TEAL),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.14).to_corner(UR, buff=0.3)

        ward_note = Text(
            "Ward (1963) linkage minimises within-cluster variance — JASA 58(301)",
            font_size=16, color=GRAY
        ).to_edge(DOWN, buff=0.3)

        with self.voiceover(
            "Step two: hierarchical clustering using Ward linkage, which minimises "
            "within-cluster variance at each merge step. Ward's method, from his 1963 "
            "Journal of the American Statistical Association paper, is standard in "
            "financial applications."
        ) as tracker:
            self.play(Write(title), run_time=0.8)
            self.play(FadeIn(leaf_dots), Write(leaf_lbls), run_time=0.8)
            self.play(FadeIn(ward_note), run_time=0.5)
            self.wait(tracker.duration - 2.1)

        with self.voiceover(
            "ETH and BTC cluster together first — they are the most correlated pair. "
            "AAVE and UNI cluster as DeFi governance tokens. USDC and DAI cluster "
            "as stablecoins."
        ) as tracker:
            for x, xc, yc, col in [
                (x_pos[0], c1_x, c1_y, BLUE), (x_pos[1], c1_x, c1_y, BLUE),
                (x_pos[2], c2_x, c2_y, GOLD), (x_pos[3], c2_x, c2_y, GOLD),
                (x_pos[4], c3_x, c3_y, TEAL), (x_pos[5], c3_x, c3_y, TEAL),
            ]:
                self.play(Create(vline(x, y_base, yc, col)), run_time=0.25)
            self.play(
                Create(hline(x_pos[0], x_pos[1], c1_y, BLUE)),
                Create(hline(x_pos[2], x_pos[3], c2_y, GOLD)),
                Create(hline(x_pos[4], x_pos[5], c3_y, TEAL)),
                run_time=0.5
            )
            self.play(FadeIn(legend), run_time=0.5)
            self.wait(tracker.duration - 2.5)

        with self.voiceover(
            "The two DeFi clusters merge next. Finally, the stable-yield cluster — "
            "stablecoins — merges at the root. This tree is the dendrogram that "
            "drives the weight allocation in Step 4."
        ) as tracker:
            self.play(
                Create(vline(c1_x, c1_y, top_y, BLUE)),
                Create(vline(c2_x, c2_y, top_y, GOLD)),
                run_time=0.5
            )
            self.play(Create(hline(c1_x, c2_x, top_y, WHITE)), run_time=0.4)
            self.play(
                Create(vline(defi_x, top_y, root_y, WHITE)),
                Create(vline(c3_x, c3_y, root_y, TEAL)),
                run_time=0.5
            )
            self.play(Create(hline(defi_x, c3_x, root_y, WHITE)), run_time=0.4)
            self.wait(tracker.duration - 1.8)

        clear(self)

    # ── 6. STEP 3 — QUASI-DIAGONALISATION ─────────────────────────────────────
    def _scene_step3_quasi_diag(self):
        title = Text("Step 3 — Quasi-Diagonalisation", font_size=34, color=GOLD)\
                  .to_edge(UP, buff=0.5)

        before_lbl = Text("Original order", font_size=20, color=WHITE).shift(UP * 1.2 + LEFT * 3.2)
        after_lbl  = Text("Quasi-diagonal order", font_size=20, color=TEAL).shift(UP * 1.2 + RIGHT * 2.0)

        # Simulate 6x6 correlation matrix cells — before
        assets_before = ["ETH", "USDC", "AAVE", "BTC", "DAI", "UNI"]
        assets_after  = ["ETH", "BTC", "AAVE", "UNI", "USDC", "DAI"]
        n = 6

        def make_matrix(labels, shift_x):
            cells = VGroup()
            sz = 0.52
            for i in range(n):
                for j in range(n):
                    dist = abs(i - j)
                    intensity = max(0.0, 1.0 - dist * 0.32)
                    col = interpolate_color(ManimColor("#1a1a2e"), ManimColor(TEAL), intensity)
                    cell = Square(side_length=sz, fill_color=col, fill_opacity=0.85,
                                  stroke_color=GRAY, stroke_width=0.4)
                    cell.move_to([shift_x + j * sz - (n / 2) * sz, -j * 0 + i * (-sz) + 1.0, 0])
                    cells.add(cell)
            row_lbls = VGroup(*[
                Text(labels[i], font_size=13, color=WHITE)
                    .next_to(cells[i * n], LEFT, buff=0.08)
                for i in range(n)
            ])
            col_lbls = VGroup(*[
                Text(labels[j], font_size=13, color=WHITE)
                    .next_to(cells[j], UP, buff=0.08)
                for j in range(n)
            ])
            return VGroup(cells, row_lbls, col_lbls)

        mat_before = make_matrix(assets_before, -3.2)
        mat_after  = make_matrix(assets_after,   2.8)

        arrow = Arrow(LEFT * 0.4, RIGHT * 0.8, color=GOLD, stroke_width=2.5)
        arrow_lbl = Text("reorder", font_size=16, color=GOLD).next_to(arrow, UP, buff=0.1)

        with self.voiceover(
            "Step three: quasi-diagonalisation. Reorder the rows and columns of the "
            "covariance matrix so that highly correlated assets sit adjacent to each other."
        ) as tracker:
            self.play(Write(title), run_time=0.8)
            self.play(FadeIn(before_lbl), FadeIn(mat_before), run_time=1.0)
            self.wait(tracker.duration - 1.8)

        with self.voiceover(
            "The left matrix has the original arbitrary asset order — correlated assets "
            "like ETH and BTC are scattered. After quasi-diagonalisation on the right, "
            "correlated pairs are adjacent: ETH next to BTC, AAVE next to UNI, "
            "USDC next to DAI."
        ) as tracker:
            self.play(GrowArrow(arrow), FadeIn(arrow_lbl), run_time=0.6)
            self.play(FadeIn(after_lbl), FadeIn(mat_after), run_time=0.8)
            self.wait(tracker.duration - 1.4)

        with self.voiceover(
            "The matrix now has high-value cells clustered near the diagonal — a "
            "quasi-diagonal structure. This ordering drives the recursive bisection "
            "step that follows."
        ) as tracker:
            insight = Text(
                "Correlation structure made explicit → recursive bisection follows the hierarchy",
                font_size=19, color=TEAL
            ).to_edge(DOWN, buff=0.3)
            self.play(FadeIn(insight), run_time=0.6)
            self.wait(tracker.duration - 0.6)

        clear(self)

    # ── 7. STEP 4 — RECURSIVE BISECTION ───────────────────────────────────────
    def _scene_step4_bisection(self):
        title = Text("Step 4 — Recursive Bisection", font_size=34, color=GOLD)\
                  .to_edge(UP, buff=0.5)

        formula = MathTex(
            r"\alpha_L", r"=",
            r"\frac{\sigma^2_R}{\sigma^2_L + \sigma^2_R}",
            font_size=50, color=TEAL
        ).shift(UP * 1.5)

        brace_alpha = Brace(formula[0], DOWN, color=TEAL)
        lbl_alpha   = Text("weight fraction\nfor left cluster", font_size=17, color=TEAL)\
                        .next_to(brace_alpha, DOWN, buff=0.08)
        brace_frac  = Brace(formula[2], DOWN, color=GOLD)
        lbl_frac    = Text("right variance\n÷ total variance", font_size=17, color=GOLD)\
                        .next_to(brace_frac, DOWN, buff=0.08)

        intuition = VGroup(
            Text("Low-variance cluster  →  gets MORE weight", font_size=20, color=WHITE),
            Text("High-variance cluster →  gets LESS weight", font_size=20, color=WHITE),
            Text("Repeat at every branch until leaf weights determined", font_size=20, color=TEAL),
        ).arrange(DOWN, buff=0.28, aligned_edge=LEFT).shift(DOWN * 1.4)

        example_box = RoundedRectangle(
            width=9.0, height=0.95, corner_radius=0.12,
            fill_color=GOLD, fill_opacity=0.07,
            stroke_color=GOLD, stroke_width=1.4
        ).to_edge(DOWN, buff=0.3)
        example_txt = Text(
            "σ²_L = 0.04 (DeFi),  σ²_R = 0.01 (Stables)  →  α_L = 0.01/(0.04+0.01) = 0.20",
            font_size=18, color=GOLD
        ).move_to(example_box)

        with self.voiceover(
            "Step four: recursive bisection. At each branch of the dendrogram, split "
            "the risk budget between the left and right sub-cluster using this formula."
        ) as tracker:
            self.play(Write(title), run_time=0.8)
            self.play(Write(formula), run_time=1.2)
            self.wait(tracker.duration - 2.0)

        with self.voiceover(
            "Alpha-L is the weight fraction assigned to the left cluster. It equals "
            "the right cluster's variance divided by the total variance — so the "
            "lower-variance cluster always receives the larger allocation."
        ) as tracker:
            self.play(Create(brace_alpha), FadeIn(lbl_alpha), run_time=0.6)
            self.play(Create(brace_frac), FadeIn(lbl_frac), run_time=0.6)
            self.wait(tracker.duration - 1.2)

        with self.voiceover(
            "The DeFi cluster has variance 0.04 and the stablecoin cluster has "
            "variance 0.01. Alpha-L equals 0.01 over 0.05 — giving 20 percent to "
            "DeFi and 80 percent to stablecoins at this branch."
        ) as tracker:
            self.play(FadeIn(intuition[0], shift=RIGHT * 0.2), run_time=0.4)
            self.play(FadeIn(intuition[1], shift=RIGHT * 0.2), run_time=0.4)
            self.play(Create(example_box), Write(example_txt), run_time=0.7)
            self.wait(tracker.duration - 1.5)

        with self.voiceover(
            "Recurse down every branch until all leaf weights are determined. "
            "No matrix inversion at any step. This is why HRP is fundamentally "
            "more stable than MVO."
        ) as tracker:
            self.play(FadeIn(intuition[2], shift=RIGHT * 0.2), run_time=0.5)
            self.wait(tracker.duration - 0.5)

        clear(self)

    # ── 8. WHY IT WORKS ────────────────────────────────────────────────────────
    def _scene_why_it_works(self):
        title = Text("Why HRP Outperforms — The Evidence", font_size=32, color=GOLD)\
                  .to_edge(UP, buff=0.5)

        rows = [
            ("No matrix inversion",      "eliminates error amplification",          TEAL),
            ("Captures hierarchy",        "respects genuine correlation structure",   TEAL),
            ("Stable out-of-sample",      "weights change smoothly with new data",    TEAL),
            ("Beats MVO empirically",     "better Sharpe & drawdown, N > 50 assets", GOLD),
            ("Beats 1/N equal weight",    "exploits structure that 1/N ignores",     GOLD),
        ]
        row_group = VGroup()
        for rule, detail, col in rows:
            box = RoundedRectangle(
                width=10.5, height=0.82, corner_radius=0.10,
                fill_color=col, fill_opacity=0.07,
                stroke_color=col, stroke_width=1.2
            )
            r_t = Text(rule,   font_size=19, color=col)\
                    .move_to(box).align_to(box, LEFT).shift(RIGHT * 0.25)
            d_t = Text(detail, font_size=17, color=WHITE)\
                    .move_to(box).align_to(box, RIGHT).shift(LEFT * 0.25)
            row_group.add(VGroup(box, r_t, d_t))
        row_group.arrange(DOWN, buff=0.22).next_to(title, DOWN, buff=0.4)

        cite = Text(
            "Lopez de Prado (2016) JPM 42(4): HRP outperforms MVO & CLA on out-of-sample Sharpe + drawdown",
            font_size=15, color=GRAY
        ).to_edge(DOWN, buff=0.25)

        with self.voiceover(
            "Why does HRP outperform? No matrix inversion means no error amplification — "
            "the fundamental fragility of MVO is removed by construction."
        ) as tracker:
            self.play(Write(title), run_time=0.8)
            self.play(FadeIn(row_group[0], shift=RIGHT * 0.2), run_time=0.4)
            self.play(FadeIn(row_group[1], shift=RIGHT * 0.2), run_time=0.4)
            self.wait(tracker.duration - 1.6)

        with self.voiceover(
            "The dendrogram captures genuine correlation structure. Weights change "
            "smoothly when data updates — the clustering is noise-tolerant in a way "
            "that matrix inversion is not."
        ) as tracker:
            self.play(FadeIn(row_group[2], shift=RIGHT * 0.2), run_time=0.4)
            self.wait(tracker.duration - 0.4)

        with self.voiceover(
            "Empirically: Lopez de Prado's original paper shows HRP outperforms MVO, "
            "the Critical Line Algorithm, and naive equal-weight on out-of-sample "
            "Sharpe ratio and maximum drawdown — particularly when the asset count "
            "exceeds 50."
        ) as tracker:
            self.play(FadeIn(row_group[3], shift=RIGHT * 0.2), run_time=0.4)
            self.play(FadeIn(row_group[4], shift=RIGHT * 0.2), run_time=0.4)
            self.play(FadeIn(cite), run_time=0.5)
            self.wait(tracker.duration - 1.3)

        clear(self)

    # ── 9. LEDOIT-WOLF SHRINKAGE ───────────────────────────────────────────────
    def _scene_ledoit_wolf(self):
        title = Text("Ledoit-Wolf Shrinkage + HRP", font_size=34, color=GOLD)\
                  .to_edge(UP, buff=0.5)

        formula = MathTex(
            r"\Sigma_{LW}",
            r"=",
            r"(1-\alpha)\,\Sigma_{\text{sample}}",
            r"+",
            r"\alpha\, F",
            font_size=44, color=TEAL
        ).shift(UP * 1.5)

        brace_lw     = Brace(formula[0], DOWN, color=TEAL)
        lbl_lw       = Text("shrunk covariance\nmatrix", font_size=17, color=TEAL)\
                         .next_to(brace_lw, DOWN, buff=0.08)
        brace_sample = Brace(formula[2], DOWN, color=WHITE)
        lbl_sample   = Text("noisy sample\nestimate", font_size=17, color=WHITE)\
                         .next_to(brace_sample, DOWN, buff=0.08)
        brace_f      = Brace(formula[4], DOWN, color=GOLD)
        lbl_f        = Text("structured target\n(e.g. const-corr.)", font_size=17, color=GOLD)\
                         .next_to(brace_f, DOWN, buff=0.08)

        benefit = VGroup(
            Text("α chosen analytically — minimises mean-squared error", font_size=19, color=WHITE),
            Text("No grid search required. Works with any sample size.", font_size=19, color=WHITE),
            Text("Particularly valuable when N (assets) ≈ T (time periods)", font_size=19, color=TEAL),
        ).arrange(DOWN, buff=0.26, aligned_edge=LEFT).shift(DOWN * 1.5)

        cite_box = RoundedRectangle(
            width=9.5, height=0.9, corner_radius=0.12,
            fill_color=GRAY, fill_opacity=0.06, stroke_color=GRAY, stroke_width=1.0
        ).to_edge(DOWN, buff=0.28)
        cite_txt = Text(
            "Ledoit & Wolf (2004) JPM 30(4) · Ledoit & Wolf (2003) JEF 10(5) — "
            "analytical shrinkage coefficient",
            font_size=15, color=GRAY
        ).move_to(cite_box)

        with self.voiceover(
            "The one important input improvement: use Ledoit-Wolf shrinkage on the sample "
            "covariance matrix before feeding it into HRP."
        ) as tracker:
            self.play(Write(title), run_time=0.8)
            self.play(Write(formula), run_time=1.2)
            self.wait(tracker.duration - 2.0)

        with self.voiceover(
            "Ledoit-Wolf shrinks the sample covariance toward a structured target matrix "
            "using an analytically optimal coefficient alpha. The shrunk estimate equals "
            "one minus alpha times the sample covariance, plus alpha times the target."
        ) as tracker:
            self.play(Create(brace_lw), FadeIn(lbl_lw), run_time=0.5)
            self.play(Create(brace_sample), FadeIn(lbl_sample), run_time=0.5)
            self.play(Create(brace_f), FadeIn(lbl_f), run_time=0.5)
            self.wait(tracker.duration - 1.5)

        with self.voiceover(
            "Alpha is chosen analytically to minimise mean-squared error — no grid search "
            "needed. It is especially valuable when the number of assets is close to the "
            "number of time periods, where the sample estimate is most unreliable. "
            "Ledoit and Wolf published the foundational papers in 2003 and 2004."
        ) as tracker:
            for b in benefit:
                self.play(FadeIn(b, shift=RIGHT * 0.2), run_time=0.4)
            self.play(Create(cite_box), Write(cite_txt), run_time=0.6)
            self.wait(tracker.duration - 1.8)

        clear(self)

    # ── 10. DEFI APPLICATION ───────────────────────────────────────────────────
    def _scene_defi(self):
        title = Text("HRP for DeFi Yield Portfolios", font_size=34, color=GOLD)\
                  .to_edge(UP, buff=0.5)

        protocols = [
            ("Aave USDC",     "Lending",   TEAL),
            ("Curve 3pool",   "Lending",   TEAL),
            ("GMX GLP",       "Perp DEX",  RED),
            ("dYdX Perp",     "Perp DEX",  RED),
            ("Lido ETH",      "Staking",   BLUE),
            ("Rocket Pool",   "Staking",   BLUE),
        ]

        # Simulate HRP weights (inverse-vol style, grouped by cluster)
        weights = [0.18, 0.17, 0.11, 0.10, 0.24, 0.20]
        colors  = [p[2] for p in protocols]
        names   = [p[0] for p in protocols]

        ax = Axes(
            x_range=[-0.5, 5.5, 1], y_range=[0, 0.32, 0.08],
            x_length=9.0, y_length=3.4,
            axis_config={"color": GRAY, "include_numbers": False},
            tips=False
        ).shift(DOWN * 0.8)

        bars, lbls, wlbls = VGroup(), VGroup(), VGroup()
        for i, (name, w, col) in enumerate(zip(names, weights, colors)):
            x0 = ax.coords_to_point(i, 0)
            x1 = ax.coords_to_point(i, w)
            bar = Rectangle(
                width=0.72, height=abs(x1[1] - x0[1]),
                fill_color=col, fill_opacity=0.85, stroke_width=0
            ).move_to([(x0[0] + x1[0]) / 2, (x0[1] + x1[1]) / 2, 0])
            lbl   = Text(name, font_size=14, color=col)\
                      .next_to(ax.coords_to_point(i, 0), DOWN, buff=0.08).rotate(PI / 5)
            wlbl  = Text(f"{int(w*100)}%", font_size=14, color=col)\
                      .next_to(bar, UP, buff=0.06)
            bars.add(bar); lbls.add(lbl); wlbls.add(wlbl)

        legend = VGroup(
            self._legend_item("Lending cluster", TEAL),
            self._legend_item("Perp DEX cluster", RED),
            self._legend_item("Staking cluster", BLUE),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.14).to_corner(UR, buff=0.35)

        insight = Text(
            "HRP groups correlated yield sources · allocates inversely to variance within each cluster",
            font_size=17, color=TEAL
        ).to_edge(DOWN, buff=0.28)

        with self.voiceover(
            "In a DeFi yield portfolio, protocol sources — Aave, Curve, GMX, Lido — "
            "have complex cross-correlations driven by DeFi market cycles."
        ) as tracker:
            self.play(Write(title), Create(ax), run_time=1.0)
            self.wait(tracker.duration - 1.0)

        with self.voiceover(
            "HRP on protocol yield return history groups lending protocols together, "
            "perpetual DEX yields together, and liquid staking yields together."
        ) as tracker:
            self.play(
                LaggedStart(*[GrowFromEdge(b, DOWN) for b in bars], lag_ratio=0.12),
                LaggedStart(*[Write(l) for l in lbls], lag_ratio=0.12),
                run_time=1.5
            )
            self.play(FadeIn(legend), run_time=0.5)
            self.wait(tracker.duration - 2.0)

        with self.voiceover(
            "Within each cluster, it allocates inversely to variance. Staking yields — "
            "historically the most stable — receive the largest allocation. Perp DEX "
            "yields — highest variance — receive the least."
        ) as tracker:
            self.play(
                LaggedStart(*[FadeIn(w) for w in wlbls], lag_ratio=0.12),
                run_time=0.8
            )
            self.play(FadeIn(insight), run_time=0.5)
            self.wait(tracker.duration - 1.3)

        clear(self)

    # ── 11. TAKEAWAY ──────────────────────────────────────────────────────────
    def _scene_takeaway(self):
        title = Text("Takeaway", font_size=38, color=GOLD).to_edge(UP, buff=0.5)

        rules = [
            ("Use HRP for N > 20 assets",   "especially with limited history (T < 3N)", TEAL),
            ("Apply Ledoit-Wolf shrinkage",  "before passing Σ to HRP clustering",       TEAL),
            ("Ward linkage for finance",     "minimises within-cluster variance (Ward 1963)", GOLD),
            ("No matrix inversion needed",  "robust by construction — Lopez de Prado 2016",  GOLD),
            ("DeFi: group by yield type",   "lending / DEX / staking as natural clusters",   BLUE),
        ]

        rule_group = VGroup()
        for rule, detail, col in rules:
            box = RoundedRectangle(
                width=10.5, height=0.82, corner_radius=0.12,
                fill_color=col, fill_opacity=0.07,
                stroke_color=col, stroke_width=1.2
            )
            r_t = Text(rule,   font_size=18, color=col)\
                    .move_to(box).align_to(box, LEFT).shift(RIGHT * 0.25)
            d_t = Text(detail, font_size=16, color=WHITE)\
                    .move_to(box).align_to(box, RIGHT).shift(LEFT * 0.25)
            rule_group.add(VGroup(box, r_t, d_t))
        rule_group.arrange(DOWN, buff=0.22).next_to(title, DOWN, buff=0.4)

        cite = Text(
            "Lopez de Prado (2016) · Ledoit & Wolf (2004) · Chan (2009) · "
            "Tulchinsky et al. (2020) · Successful Algorithmic Trading",
            font_size=14, color=GRAY
        ).to_edge(DOWN, buff=0.22)

        with self.voiceover(
            "Use HRP whenever you have a large asset universe — more than 20 assets — "
            "and limited history. Apply Ledoit-Wolf shrinkage before feeding the "
            "covariance matrix into HRP."
        ) as tracker:
            self.play(Write(title), run_time=0.8)
            self.play(FadeIn(rule_group[0], shift=RIGHT * 0.2), run_time=0.4)
            self.play(FadeIn(rule_group[1], shift=RIGHT * 0.2), run_time=0.4)
            self.wait(tracker.duration - 1.6)

        with self.voiceover(
            "Use Ward linkage — the standard for financial applications since Ward's "
            "1963 paper. No matrix inversion is required at any step — that is the "
            "fundamental robustness advantage of HRP."
        ) as tracker:
            self.play(FadeIn(rule_group[2], shift=RIGHT * 0.2), run_time=0.4)
            self.play(FadeIn(rule_group[3], shift=RIGHT * 0.2), run_time=0.4)
            self.wait(tracker.duration - 0.8)

        with self.voiceover(
            "For DeFi yield portfolios: group protocols by yield type — lending, "
            "DEX, staking — as natural clusters before applying the bisection. "
            "HRP is the practical portfolio construction method that finally works "
            "well out-of-sample."
        ) as tracker:
            self.play(FadeIn(rule_group[4], shift=RIGHT * 0.2), run_time=0.4)
            self.play(FadeIn(cite), run_time=0.5)
            self.wait(tracker.duration - 0.9)

        clear(self)

    # ── 12. CTA ───────────────────────────────────────────────────────────────
    def _scene_cta(self):
        outro  = Text("QuantiFire  |  EP 10", font_size=30, color=GOLD).shift(UP * 0.8)
        series = Text("Series 1 — Classical Quantitative Finance  ✓", font_size=22, color=TEAL)\
                   .next_to(outro, DOWN, buff=0.3)
        next_ep = Text(
            "Series 2 starts next:\nEP 11 — How Uniswap Actually Works: The x·y=k Formula",
            font_size=20, color=WHITE
        ).next_to(series, DOWN, buff=0.4)
        sub = Text("Subscribe · QuantiFire", font_size=19, color=GRAY)\
                .next_to(next_ep, DOWN, buff=0.35)

        with self.voiceover(
            "That wraps Series 1: Classical Quantitative Finance. Ten episodes from "
            "correlation matrices to Hierarchical Risk Parity."
        ) as tracker:
            self.play(FadeIn(outro), run_time=0.6)
            self.play(FadeIn(series), run_time=0.6)
            self.wait(tracker.duration - 1.2)

        with self.voiceover(
            "Series 2 starts next: How Uniswap Actually Works. We go from abstract "
            "portfolio theory to the on-chain math powering billions in daily trading "
            "volume. Subscribe and let's go. QuantiFire."
        ) as tracker:
            self.play(FadeIn(next_ep), run_time=0.6)
            self.play(FadeIn(sub), run_time=0.5)
            self.wait(tracker.duration - 1.1)

    # ── HELPERS ───────────────────────────────────────────────────────────────
    def _problem_row(self, label, detail, color):
        lbl_t = Text(label,  font_size=19, color=color)
        det_t = Text(detail, font_size=17, color=WHITE)
        row   = VGroup(lbl_t, det_t).arrange(RIGHT, buff=0.55)
        line  = Line(LEFT * 5.5, RIGHT * 5.5, color=color, stroke_width=0.4)\
                  .next_to(row, DOWN, buff=0.08)
        return VGroup(row, line)

    def _compare_row(self, trigger, cause, effect, color):
        t_t = Text(trigger, font_size=18, color=color)
        c_t = Text(cause,   font_size=17, color=WHITE)
        e_t = Text(effect,  font_size=17, color=color)
        row = VGroup(t_t, c_t, e_t).arrange(RIGHT, buff=0.4)
        return row

    def _legend_item(self, text, color):
        sq  = Square(side_length=0.20, fill_color=color, fill_opacity=0.85, stroke_width=0)
        lbl = Text(text, font_size=17, color=color).next_to(sq, RIGHT, buff=0.12)
        return VGroup(sq, lbl)

    def _sources_box(self, sources):
        lines = [Text(s, font_size=14, color=GRAY) for s in sources]
        group = VGroup(*lines).arrange(DOWN, buff=0.12, aligned_edge=LEFT)
        box   = SurroundingRectangle(group, color=GRAY, buff=0.15, corner_radius=0.1)
        return VGroup(box, group).to_edge(DOWN, buff=0.25)
