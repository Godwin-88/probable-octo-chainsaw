"""
QuantiFire EP12 — Impermanent Loss: The LP's Hidden Enemy
Run: manim -pql ep12_impermanent_loss.py ImpermanentLossScene
Audio: AI voiceover via manim-voiceover

Sources cited on-screen:
  Pintail (2019) "Uniswap: A Good Deal for Liquidity Providers?" Medium — original IL formula
  Aigner (2021) arXiv:2106.14404 — formal IL risk profile
  Loesch et al. (2021) arXiv:2111.09192 — IL in Uniswap V3
  Milionis et al. (2022) arXiv:2208.06046 — Loss-Versus-Rebalancing (LVR), ACM EC 2023
  Harvey, Ramachandran & Santoro (2021) DeFi and the Future of Finance, Wiley
  CoinGecko Research (2021) How to DeFi: Advanced

Key 2025 facts incorporated (web-verified):
  - Bancor V3 IL protection paused June 2022, never fully restored — cautionary tale
  - LVR (arXiv:2208.06046) now academic preferred term over "impermanent loss"
  - LVR/time = (σ²/8) · L  (Black-Scholes formula for AMMs)
  - 2023 real data: ~5.7% raw IL on ETH/USDC V2; net +1-2% after fees
  - Active 2025 mitigation: Bunni V2, Arrakis Finance, Gamma Strategies (V4 hooks)
"""
from manim import *
from manim_voiceover import VoiceoverScene
from manim_voiceover.services.gtts import GTTSService
# PRODUCTION: from manim_voiceover.services.elevenlabs import ElevenLabsService
import numpy as np

GOLD   = "#FFB700"
TEAL   = "#00C896"
RED    = "#FF4444"
BLUE   = "#4A90E2"
PURPLE = "#9B59B6"
BG     = "#0D0D0D"


def clear(scene):
    scene.play(*[FadeOut(m) for m in scene.mobjects], run_time=0.5)

def il(r):
    return 2 * r**0.5 / (1 + r) - 1


class ImpermanentLossScene(VoiceoverScene):
    def construct(self):
        self.camera.background_color = BG
        self.set_speech_service(GTTSService(lang="en"))
        # PRODUCTION: self.set_speech_service(ElevenLabsService(...))

        self._scene_hook()
        self._scene_context()
        self._scene_setup()
        self._scene_il_formula()
        self._scene_il_curve()
        self._scene_hodl_vs_lp()
        self._scene_breakeven()
        self._scene_why_impermanent()
        self._scene_lvr()
        self._scene_mitigation()
        self._scene_bancor_lesson()
        self._scene_takeaway()
        self._scene_cta()

    # ── 1. HOOK ────────────────────────────────────────────────────────────────
    def _scene_hook(self):
        title = Text("Impermanent Loss", font_size=44, color=GOLD).to_edge(UP, buff=0.5)
        sub   = Text("The LP's Hidden Enemy", font_size=26, color=RED)\
                  .next_to(title, DOWN, buff=0.18)

        scenario = VGroup(
            Text("You deposit:  1 ETH  +  2,000 USDC  into Uniswap", font_size=20, color=WHITE),
            Text("ETH price goes:  $2,000  →  $4,000  (+100%)", font_size=20, color=TEAL),
            Text("You withdraw your LP position.", font_size=20, color=WHITE),
        ).arrange(DOWN, buff=0.28, aligned_edge=LEFT).shift(UP * 0.4)

        compare = VGroup(
            Text("Just HELD:          $6,000   (1 ETH @ $4,000 + 2,000 USDC)", font_size=19, color=TEAL),
            Text("LP position worth:  $5,657   (after arb rebalancing)", font_size=19, color=RED),
            Text("                    – $343   ← Impermanent Loss  (–5.7%)", font_size=19, color=RED),
        ).arrange(DOWN, buff=0.22, aligned_edge=LEFT).shift(DOWN * 1.0)

        fee_note = Text(
            "And yes — you earned fees the whole time. You still came out behind.",
            font_size=18, color=GRAY
        ).to_edge(DOWN, buff=0.3)

        with self.voiceover(
            "Here is a scenario: you deposit ETH and USDC into a Uniswap pool. "
            "ETH goes up 100 percent. You withdraw your liquidity."
        ) as tracker:
            self.play(Write(title), FadeIn(sub), run_time=0.9)
            for line in scenario:
                self.play(FadeIn(line, shift=RIGHT * 0.2), run_time=0.4)
            self.wait(tracker.duration - 2.1)

        with self.voiceover(
            "If you had just held, your position would be worth 6,000 USDC. "
            "Your LP position is worth only 5,657 — a 343 USDC shortfall."
        ) as tracker:
            self.play(FadeIn(compare[0], shift=RIGHT * 0.2), run_time=0.4)
            self.play(FadeIn(compare[1], shift=RIGHT * 0.2), run_time=0.4)
            self.play(FadeIn(compare[2], shift=RIGHT * 0.2), run_time=0.4)
            self.wait(tracker.duration - 1.2)

        with self.voiceover(
            "You earned fees the whole time and still came out behind. "
            "This is Impermanent Loss — the DeFi concept that trips up every LP "
            "who does not understand the math."
        ) as tracker:
            self.play(FadeIn(fee_note), run_time=0.6)
            self.wait(tracker.duration - 0.6)

        clear(self)

    # ── 2. CONTEXT ─────────────────────────────────────────────────────────────
    def _scene_context(self):
        title = Text("What Is Impermanent Loss?", font_size=34, color=GOLD)\
                  .to_edge(UP, buff=0.5)

        definition = Text(
            "IL = opportunity cost of being an AMM LP\n"
            "       versus simply holding your assets",
            font_size=24, color=WHITE
        ).shift(UP * 1.0)

        mechanism = VGroup(
            Text("Arises from: arbitrageurs rebalancing the pool as price moves", font_size=19, color=TEAL),
            Text("Result:      you hold more of the cheaper asset, less of the expensive", font_size=19, color=RED),
            Text("Always:      fully predictable with a closed-form formula", font_size=19, color=GOLD),
        ).arrange(DOWN, buff=0.28, aligned_edge=LEFT).shift(DOWN * 0.4)

        src_box = self._sources_box([
            "Pintail (2019) 'Uniswap: A Good Deal for LPs?' Medium — original IL formula",
            "Aigner (2021) arXiv:2106.14404 — formal LP risk profile",
            "Harvey et al. (2021) DeFi and the Future of Finance, Wiley",
            "CoinGecko Research (2021) How to DeFi: Advanced",
        ])

        with self.voiceover(
            "Welcome to QuantiFire. Impermanent Loss, or IL, is the opportunity cost "
            "of being an AMM liquidity provider versus simply holding your assets."
        ) as tracker:
            self.play(Write(title), run_time=0.8)
            self.play(Write(definition), run_time=1.0)
            self.wait(tracker.duration - 1.8)

        with self.voiceover(
            "It arises mechanically from how arbitrageurs rebalance the pool as prices "
            "move. You end up holding more of the cheaper asset and less of the expensive "
            "one — exactly the wrong position."
        ) as tracker:
            for m in mechanism:
                self.play(FadeIn(m, shift=RIGHT * 0.2), run_time=0.4)
            self.wait(tracker.duration - 1.2)

        with self.voiceover(
            "The good news: IL is entirely predictable with a closed-form formula, "
            "first derived by Pintail in January 2019 and later formalized in peer-reviewed "
            "academic work."
        ) as tracker:
            self.play(FadeIn(src_box), run_time=0.6)
            self.wait(tracker.duration - 0.6)

        clear(self)

    # ── 3. SETUP ───────────────────────────────────────────────────────────────
    def _scene_setup(self):
        title = Text("The Setup — Price Ratio r", font_size=34, color=GOLD)\
                  .to_edge(UP, buff=0.5)

        pool_state = VGroup(
            Text("Pool:  x ETH  ·  y USDC  =  k", font_size=22, color=WHITE),
            Text("Entry price:  P₀ = y/x", font_size=22, color=TEAL),
            Text("New price:   P₁ = r · P₀", font_size=22, color=GOLD),
        ).arrange(DOWN, buff=0.3, aligned_edge=LEFT).shift(UP * 0.8)

        arb_box = RoundedRectangle(
            width=9.5, height=1.6, corner_radius=0.12,
            fill_color=RED, fill_opacity=0.07, stroke_color=RED, stroke_width=1.5
        ).shift(DOWN * 0.8)
        arb_lines = VGroup(
            Text("Arbitrageurs restore pool ratio to reflect P₁", font_size=19, color=RED),
            Text("New ETH reserve:  x' = x/√r      (less ETH if r > 1)", font_size=18, color=WHITE),
            Text("New USDC reserve: y' = y·√r       (more USDC if r > 1)", font_size=18, color=WHITE),
        ).arrange(DOWN, buff=0.18, aligned_edge=LEFT).move_to(arb_box)

        insight = Text(
            "You are forced to sell the appreciating asset to arb bots — at a discount",
            font_size=18, color=RED
        ).to_edge(DOWN, buff=0.28)

        with self.voiceover(
            "The setup: a pool holds x ETH and y USDC satisfying x times y equals k. "
            "The entry price P-zero equals y over x."
        ) as tracker:
            self.play(Write(title), run_time=0.8)
            self.play(FadeIn(pool_state[0]), FadeIn(pool_state[1]), run_time=0.7)
            self.wait(tracker.duration - 1.5)

        with self.voiceover(
            "ETH price moves to P-one equals r times P-zero. r is the price ratio — "
            "r equals 2 means ETH doubled, r equals 0.5 means ETH halved."
        ) as tracker:
            self.play(FadeIn(pool_state[2], shift=RIGHT * 0.2), run_time=0.5)
            self.wait(tracker.duration - 0.5)

        with self.voiceover(
            "Arbitrageurs immediately rebalance the pool until the reserve ratio "
            "matches the new price. Your ETH reserve shrinks to x over root-r, "
            "your USDC reserve grows to y times root-r. You are being forced "
            "to sell the appreciating asset to arbitrage bots at a discount."
        ) as tracker:
            self.play(Create(arb_box), run_time=0.4)
            for line in arb_lines:
                self.play(FadeIn(line, shift=RIGHT * 0.1), run_time=0.4)
            self.play(FadeIn(insight), run_time=0.5)
            self.wait(tracker.duration - 1.7)

        clear(self)

    # ── 4. IL FORMULA ──────────────────────────────────────────────────────────
    def _scene_il_formula(self):
        title = Text("The Impermanent Loss Formula", font_size=32, color=GOLD)\
                  .to_edge(UP, buff=0.5)

        formula = MathTex(
            r"\text{IL}(r)",
            r"=",
            r"\frac{2\sqrt{r}}{1+r}",
            r"- 1",
            font_size=60, color=RED
        ).shift(UP * 1.4)

        brace_r  = Brace(formula[0], DOWN, color=RED)
        lbl_r    = Text("price ratio\nP₁/P₀", font_size=17, color=RED)\
                     .next_to(brace_r, DOWN, buff=0.08)
        brace_sq = Brace(formula[2], DOWN, color=GOLD)
        lbl_sq   = Text("geometric mean\nof P₀ and P₁", font_size=17, color=GOLD)\
                     .next_to(brace_sq, DOWN, buff=0.08)

        # Key value table
        r_vals    = [0.5,   1.0,  1.25,  1.5,   2.0,   4.0]
        il_vals   = [il(r) for r in r_vals]
        row_data  = [[f"r = {r}", f"IL = {v*100:.1f}%"] for r, v in zip(r_vals, il_vals)]
        colors_il = [RED if v < -0.01 else TEAL for v in il_vals]

        table_rows = VGroup()
        for (rv, iv), col in zip(row_data, colors_il):
            row = VGroup(
                Text(rv, font_size=18, color=WHITE),
                Text(iv, font_size=18, color=col),
            ).arrange(RIGHT, buff=1.2)
            table_rows.add(row)
        table_rows.arrange(DOWN, buff=0.18).shift(DOWN * 1.0)

        sym_note = Text(
            "Symmetric: ETH ×2 hurts exactly as much as ETH ×0.5",
            font_size=18, color=GOLD
        ).to_edge(DOWN, buff=0.28)

        pintail_cite = Text(
            "Pintail (2019) Medium — first derivation of this formula",
            font_size=14, color=GRAY
        ).next_to(sym_note, UP, buff=0.08)

        with self.voiceover(
            "The Impermanent Loss formula: IL of r equals 2 root-r over 1 plus r, minus 1. "
            "Where r is the price ratio P-one over P-zero."
        ) as tracker:
            self.play(Write(title), run_time=0.8)
            self.play(Write(formula), run_time=1.2)
            self.wait(tracker.duration - 2.0)

        with self.voiceover(
            "The numerator is twice the geometric mean of the old and new prices. "
            "The denominator normalises by the sum. Pintail first derived this from "
            "x times y equals k first principles in January 2019."
        ) as tracker:
            self.play(Create(brace_r), FadeIn(lbl_r), run_time=0.5)
            self.play(Create(brace_sq), FadeIn(lbl_sq), run_time=0.5)
            self.wait(tracker.duration - 1.0)

        with self.voiceover(
            "Plug in values: no price change gives zero IL. ETH up 50 percent gives "
            "minus 2 percent. ETH doubling gives minus 5.7 percent. ETH quadrupling "
            "gives minus 20 percent. And it is symmetric — ETH halving gives the same "
            "minus 5.7 percent as ETH doubling."
        ) as tracker:
            self.play(FadeOut(brace_r, lbl_r, brace_sq, lbl_sq), run_time=0.3)
            for row in table_rows:
                self.play(FadeIn(row, shift=RIGHT * 0.2), run_time=0.28)
            self.play(FadeIn(pintail_cite), FadeIn(sym_note), run_time=0.5)
            self.wait(tracker.duration - 2.5)

        clear(self)

    # ── 5. IL CURVE ────────────────────────────────────────────────────────────
    def _scene_il_curve(self):
        title = Text("IL vs Price Ratio — The Loss Curve", font_size=32, color=GOLD)\
                  .to_edge(UP, buff=0.5)

        axes = Axes(
            x_range=[0.1, 4.3, 0.5], y_range=[-0.32, 0.03, 0.05],
            x_length=9.0, y_length=4.2,
            axis_config={"color": GRAY, "include_numbers": True},
            tips=False
        ).shift(DOWN * 0.55)

        x_lbl = Text("Price ratio r  (P₁/P₀)", font_size=17, color=WHITE)\
                  .next_to(axes.x_axis.get_end(), RIGHT, buff=0.12)
        y_lbl = Text("IL", font_size=16, color=RED)\
                  .next_to(axes.y_axis.get_end(), UP, buff=0.08)

        curve = axes.plot(il, x_range=[0.12, 4.28, 0.01], color=RED, stroke_width=3)

        key_pts = [(1.0, 0.0), (2.0, il(2.0)), (4.0, il(4.0)), (0.5, il(0.5))]
        labels  = ["r=1: 0%", "r=2: −5.7%", "r=4: −20%", "r=0.5: −5.7%"]
        anchors = [UP, UR, DL, UL]

        with self.voiceover(
            "Plotting IL as a function of price ratio gives this curve. "
            "At r equals 1 — no price change — IL is exactly zero."
        ) as tracker:
            self.play(Write(title), Create(axes), Write(x_lbl), Write(y_lbl), run_time=1.0)
            self.play(Create(curve), run_time=1.8)
            self.wait(tracker.duration - 2.8)

        with self.voiceover(
            "As price moves away from entry in either direction, IL grows. "
            "ETH doubling — r equals 2 — costs 5.7 percent."
        ) as tracker:
            pt = axes.coords_to_point(2.0, il(2.0))
            dot = Dot(pt, color=GOLD, radius=0.1)
            lbl = Text("r=2: −5.7%", font_size=16, color=GOLD).next_to(dot, UR, buff=0.1)
            self.play(FadeIn(dot, scale=1.5), Write(lbl), run_time=0.6)
            pt2 = axes.coords_to_point(0.5, il(0.5))
            dot2 = Dot(pt2, color=GOLD, radius=0.1)
            lbl2 = Text("r=0.5: −5.7%", font_size=16, color=GOLD).next_to(dot2, UL, buff=0.1)
            self.play(FadeIn(dot2, scale=1.5), Write(lbl2), run_time=0.6)
            self.wait(tracker.duration - 1.2)

        with self.voiceover(
            "ETH quadrupling costs 20 percent IL. And the curve is symmetric — "
            "the same ratio move hurts equally regardless of direction. "
            "A 4-times move is 20 percent IL whether ETH goes from 1,000 to 4,000 "
            "or from 4,000 to 1,000."
        ) as tracker:
            pt3 = axes.coords_to_point(4.0, il(4.0))
            dot3 = Dot(pt3, color=RED, radius=0.1)
            lbl3 = Text("r=4: −20%", font_size=16, color=RED).next_to(dot3, DL, buff=0.1)
            self.play(FadeIn(dot3, scale=1.5), Write(lbl3), run_time=0.6)
            sym_arrow = DoubleArrow(
                axes.coords_to_point(0.5, -0.12),
                axes.coords_to_point(2.0, -0.12),
                color=GOLD, stroke_width=2, buff=0.05
            )
            sym_lbl = Text("symmetric", font_size=15, color=GOLD)\
                        .next_to(sym_arrow, DOWN, buff=0.08)
            self.play(GrowArrow(sym_arrow), FadeIn(sym_lbl), run_time=0.6)
            self.wait(tracker.duration - 1.2)

        clear(self)

    # ── 6. HODL vs LP VALUE ────────────────────────────────────────────────────
    def _scene_hodl_vs_lp(self):
        title = Text("HODL Value vs LP Value", font_size=34, color=GOLD)\
                  .to_edge(UP, buff=0.5)

        axes = Axes(
            x_range=[0.05, 3.05, 0.5], y_range=[0.3, 2.6, 0.5],
            x_length=8.5, y_length=4.0,
            axis_config={"color": GRAY, "include_numbers": False},
            tips=False
        ).shift(DOWN * 0.6)

        x_lbl = Text("Price ratio r", font_size=17, color=GRAY)\
                  .next_to(axes.x_axis.get_end(), RIGHT, buff=0.1)
        y_lbl = Text("Value\n(relative)", font_size=16, color=GRAY)\
                  .next_to(axes.y_axis.get_end(), UP, buff=0.08)

        def hodl_val(r): return 0.5 * (1 + r)   # 50/50 initial split
        def lp_val(r):   return r**0.5            # LP value

        hodl_curve = axes.plot(hodl_val, x_range=[0.06, 3.0, 0.01], color=TEAL, stroke_width=2.5)
        lp_curve   = axes.plot(lp_val,   x_range=[0.06, 3.0, 0.01], color=RED,  stroke_width=2.5)

        area = axes.get_area(hodl_curve, bounded_graph=lp_curve,
                             x_range=[0.1, 2.95], color=RED, opacity=0.2)

        hodl_lbl = Text("HODL", font_size=18, color=TEAL)\
                     .next_to(axes.coords_to_point(2.7, hodl_val(2.7)), RIGHT, buff=0.1)
        lp_lbl   = Text("LP value", font_size=18, color=RED)\
                     .next_to(axes.coords_to_point(2.7, lp_val(2.7)), RIGHT, buff=0.1)
        gap_lbl  = Text("IL gap", font_size=16, color=RED)\
                     .next_to(axes.coords_to_point(2.0, (hodl_val(2.0)+lp_val(2.0))/2), LEFT, buff=0.1)

        entry_dot = Dot(axes.coords_to_point(1.0, 1.0), color=WHITE, radius=0.1)
        entry_lbl = Text("Entry (r=1)\nboth equal", font_size=15, color=WHITE)\
                      .next_to(entry_dot, UR, buff=0.1)

        with self.voiceover(
            "Plotting HODL value against LP value makes the gap visible. "
            "The teal line is what your 50/50 position would be worth if you just held."
        ) as tracker:
            self.play(Write(title), Create(axes), Write(x_lbl), Write(y_lbl), run_time=1.0)
            self.play(Create(hodl_curve), Write(hodl_lbl), run_time=0.9)
            self.wait(tracker.duration - 1.9)

        with self.voiceover(
            "The red line is your actual LP position value. At entry — r equals 1 — "
            "they are identical. As price diverges in either direction, the LP value "
            "falls below the HODL line."
        ) as tracker:
            self.play(Create(lp_curve), Write(lp_lbl), run_time=0.9)
            self.play(FadeIn(entry_dot), Write(entry_lbl), run_time=0.5)
            self.wait(tracker.duration - 1.4)

        with self.voiceover(
            "The shaded area is the impermanent loss — the total value the AMM "
            "mechanically transfers from you to arbitrage bots. The gap widens "
            "as price moves further from your entry."
        ) as tracker:
            self.play(FadeIn(area), Write(gap_lbl), run_time=0.8)
            self.wait(tracker.duration - 0.8)

        clear(self)

    # ── 7. BREAK-EVEN ──────────────────────────────────────────────────────────
    def _scene_breakeven(self):
        title = Text("When Is LP Profitable?", font_size=34, color=GOLD)\
                  .to_edge(UP, buff=0.5)

        equation = VGroup(
            Text("LP profit  =  fees earned  −  impermanent loss", font_size=22, color=WHITE),
            MathTex(r"\text{Daily fee APR} \approx \frac{0.003 \times V}{L}",
                    font_size=34, color=TEAL),
            Text("V = daily volume,   L = pool TVL", font_size=18, color=GRAY),
        ).arrange(DOWN, buff=0.28).shift(UP * 0.8)

        breakeven = VGroup(
            Text("Need:   fee APR  >  annual IL", font_size=20, color=GOLD),
            Text("ETH/USDC V2 typical annual IL  ≈  15–30%  (crypto volatility)", font_size=20, color=RED),
            Text("→  need fee APR > 15–30% to break even", font_size=20, color=RED),
        ).arrange(DOWN, buff=0.24, aligned_edge=LEFT).shift(DOWN * 0.4)

        real_data = RoundedRectangle(
            width=9.5, height=1.0, corner_radius=0.12,
            fill_color=TEAL, fill_opacity=0.07, stroke_color=TEAL, stroke_width=1.5
        ).to_edge(DOWN, buff=0.28)
        real_txt = Text(
            "2023 real data: ETH/USDC V2 — raw IL ≈ 5.7%,  fee income ≈ 6–7%  →  net +1–2%  (Atis E., 2024)",
            font_size=16, color=TEAL
        ).move_to(real_data)

        with self.voiceover(
            "LP profit equals fees earned minus impermanent loss. Daily fee APR "
            "approximates 0.003 times daily volume divided by pool TVL."
        ) as tracker:
            self.play(Write(title), run_time=0.8)
            for item in equation:
                self.play(FadeIn(item, shift=UP * 0.1), run_time=0.5)
            self.wait(tracker.duration - 2.3)

        with self.voiceover(
            "Break-even requires fee APR to exceed annual IL. For ETH/USDC V2 with "
            "typical crypto volatility, annual IL runs 15 to 30 percent — you need "
            "fee APR above that threshold to profit."
        ) as tracker:
            for item in breakeven:
                self.play(FadeIn(item, shift=RIGHT * 0.2), run_time=0.4)
            self.wait(tracker.duration - 1.2)

        with self.voiceover(
            "In 2023, ETH nearly doubled — roughly 5.7 percent raw IL — but V2 fee "
            "income ran 6 to 7 percent annualised on the pool. Net result: plus 1 to 2 "
            "percent over holding. In sideways or bear markets with lower volatility, "
            "fee income dominates and IL shrinks."
        ) as tracker:
            self.play(Create(real_data), Write(real_txt), run_time=0.8)
            self.wait(tracker.duration - 0.8)

        clear(self)

    # ── 8. WHY "IMPERMANENT" ───────────────────────────────────────────────────
    def _scene_why_impermanent(self):
        title = Text("Why Is It Called 'Impermanent'?", font_size=32, color=GOLD)\
                  .to_edge(UP, buff=0.5)

        definition = VGroup(
            Text("If ETH returns to your entry price P₀:", font_size=21, color=WHITE),
            Text("  →  r returns to 1  →  IL returns to 0%  →  you only kept fees", font_size=21, color=TEAL),
        ).arrange(DOWN, buff=0.2, aligned_edge=LEFT).shift(UP * 0.9)

        reality = VGroup(
            Text("Reality: crypto rarely returns exactly to entry price.", font_size=20, color=WHITE),
            Text("'Impermanent' loss often becomes permanent loss.", font_size=20, color=RED),
        ).arrange(DOWN, buff=0.2, aligned_edge=LEFT).shift(UP * 0.0)

        rename_box = RoundedRectangle(
            width=9.5, height=1.8, corner_radius=0.12,
            fill_color=PURPLE, fill_opacity=0.08, stroke_color=PURPLE, stroke_width=1.5
        ).shift(DOWN * 1.6)
        rename_lines = VGroup(
            Text("Even Pintail later updated his own articles to use 'divergence loss'", font_size=16, color=PURPLE),
            Text("Milionis et al. (2022): Loss-Versus-Rebalancing (LVR) — now the academic standard", font_size=16, color=PURPLE),
            Text("'Impermanent' is misleading — LVR accrues every block, never reverses", font_size=16, color=WHITE),
        ).arrange(DOWN, buff=0.18).move_to(rename_box)

        with self.voiceover(
            "The name 'impermanent' comes from this: if prices return exactly to your "
            "entry level, IL goes back to zero. You have earned fees on the round trip "
            "and suffered no permanent cost."
        ) as tracker:
            self.play(Write(title), run_time=0.8)
            self.play(FadeIn(definition[0]), run_time=0.5)
            self.play(FadeIn(definition[1], shift=RIGHT * 0.2), run_time=0.5)
            self.wait(tracker.duration - 1.8)

        with self.voiceover(
            "But in practice, crypto assets rarely return exactly to your entry price. "
            "So in most real cases, impermanent loss becomes permanent."
        ) as tracker:
            self.play(FadeIn(reality[0], shift=RIGHT * 0.2), run_time=0.5)
            self.play(FadeIn(reality[1], shift=RIGHT * 0.2), run_time=0.5)
            self.wait(tracker.duration - 1.0)

        with self.voiceover(
            "Academically, Milionis and co-authors prefer the term Loss-Versus-Rebalancing, "
            "or LVR. They argue the loss is not impermanent at all — it accrues continuously "
            "every second the pool runs, as arbitrage bots pick off stale prices."
        ) as tracker:
            self.play(Create(rename_box), run_time=0.4)
            for line in rename_lines:
                self.play(FadeIn(line), run_time=0.4)
            self.wait(tracker.duration - 0.8)

        clear(self)

    # ── 9. LVR — THE ACADEMIC UPGRADE ─────────────────────────────────────────
    def _scene_lvr(self):
        title = Text("LVR — Loss-Versus-Rebalancing", font_size=32, color=GOLD)\
                  .to_edge(UP, buff=0.5)

        lvr_formula = MathTex(
            r"\frac{d(\text{LVR})}{dt}",
            r"=",
            r"\frac{\sigma^2}{8} \cdot L",
            font_size=50, color=PURPLE
        ).shift(UP * 1.4)

        b_lvr  = Brace(lvr_formula[0], DOWN, color=PURPLE)
        l_lvr  = Text("LVR rate\nper unit time", font_size=16, color=PURPLE)\
                   .next_to(b_lvr, DOWN, buff=0.08)
        b_sig  = Brace(MathTex(r"\sigma^2", font_size=50).shift(UP*1.4+RIGHT*0.45), DOWN, color=GOLD)
        l_sig  = Text("asset\nvariance", font_size=16, color=GOLD)\
                   .next_to(b_sig, DOWN, buff=0.08)
        b_L    = Brace(MathTex(r"L", font_size=50).shift(UP*1.4+RIGHT*1.4), DOWN, color=TEAL)
        l_L    = Text("pool liquidity\ndepth", font_size=16, color=TEAL)\
                   .next_to(b_L, DOWN, buff=0.08)

        insights = VGroup(
            Text("LVR grows with volatility σ² — more volatile = faster LP loss", font_size=19, color=WHITE),
            Text("LVR grows with liquidity L  — deeper pool = more arb surface", font_size=19, color=WHITE),
            Text("LVR is non-decreasing, non-reversible — unlike the IL framing", font_size=19, color=RED),
        ).arrange(DOWN, buff=0.26, aligned_edge=LEFT).shift(DOWN * 1.4)

        cite = Text(
            "Milionis et al. (2022) arXiv:2208.06046 — 'Black-Scholes formula for AMMs'  (ACM EC 2023)",
            font_size=15, color=GRAY
        ).to_edge(DOWN, buff=0.25)

        with self.voiceover(
            "Milionis, Moallemi, Roughgarden and Zhang derived a precise formula: "
            "the LVR rate per unit time equals sigma-squared over 8, times liquidity "
            "depth L. They call it the Black-Scholes formula for AMMs."
        ) as tracker:
            self.play(Write(title), run_time=0.8)
            self.play(Write(lvr_formula), run_time=1.2)
            self.play(Create(b_lvr), FadeIn(l_lvr), run_time=0.5)
            self.wait(tracker.duration - 2.5)

        with self.voiceover(
            "LVR grows with asset variance — more volatile assets bleed more. "
            "And it grows with pool liquidity depth — deeper pools offer a larger "
            "arbitrage surface."
        ) as tracker:
            self.play(Create(b_sig), FadeIn(l_sig), run_time=0.4)
            self.play(Create(b_L), FadeIn(l_L), run_time=0.4)
            self.play(FadeIn(insights[0], shift=RIGHT * 0.2), run_time=0.4)
            self.play(FadeIn(insights[1], shift=RIGHT * 0.2), run_time=0.4)
            self.wait(tracker.duration - 1.6)

        with self.voiceover(
            "Critically: LVR is non-decreasing and non-reversible. The loss accrues "
            "every block. It does not recover when prices return to entry. This is why "
            "LVR is the more honest framing than 'impermanent loss'. "
            "Published at ACM Economics and Computation in 2023."
        ) as tracker:
            self.play(FadeIn(insights[2], shift=RIGHT * 0.2), run_time=0.4)
            self.play(FadeIn(cite), run_time=0.5)
            self.wait(tracker.duration - 0.9)

        clear(self)

    # ── 10. MITIGATION ─────────────────────────────────────────────────────────
    def _scene_mitigation(self):
        title = Text("IL Mitigation Strategies", font_size=34, color=GOLD)\
                  .to_edge(UP, buff=0.5)

        cards = VGroup(
            self._mcard("Correlated pairs",
                        "stETH/ETH, USDC/USDT — r stays near 1 → IL ≈ 0",
                        "Best: near-zero IL risk", TEAL),
            self._mcard("V3 concentrated range",
                        "Narrow range → more fees per dollar, IL accelerates if out-of-range",
                        "Requires active management", GOLD),
            self._mcard("Active rebalancing",
                        "Arrakis Finance, Gamma Strategies — automated V3/V4 range management",
                        "Offsets some IL via fee maximisation", BLUE),
            self._mcard("V4 hooks (2025)",
                        "Bunni V2 — MEV capture + fee redistribution back to LPs",
                        "Largest V4 hook by TVL as of 2025", PURPLE),
        ).arrange(DOWN, buff=0.24).next_to(title, DOWN, buff=0.4)

        with self.voiceover(
            "Strategy one: use correlated pairs. stETH and ETH, or USDC and USDT, "
            "always trade near parity — r stays near 1 and IL approaches zero. "
            "This is the most reliable mitigation."
        ) as tracker:
            self.play(Write(title), run_time=0.8)
            self.play(FadeIn(cards[0], shift=RIGHT * 0.2), run_time=0.5)
            self.wait(tracker.duration - 1.3)

        with self.voiceover(
            "Strategy two: Uniswap V3 concentrated ranges. A tight range captures "
            "far more fees per dollar, but if price exits your range, your capital "
            "is entirely in one asset and IL is maximised. Requires active management."
        ) as tracker:
            self.play(FadeIn(cards[1], shift=RIGHT * 0.2), run_time=0.5)
            self.wait(tracker.duration - 0.5)

        with self.voiceover(
            "Strategy three: active rebalancing vaults. Arrakis Finance and Gamma "
            "Strategies automate V3 range management to maximise fee income "
            "while reducing periods of out-of-range exposure."
        ) as tracker:
            self.play(FadeIn(cards[2], shift=RIGHT * 0.2), run_time=0.5)
            self.wait(tracker.duration - 0.5)

        with self.voiceover(
            "Strategy four: Uniswap V4 hooks. Bunni V2, the largest V4 hook by TVL "
            "in 2025, uses Liquidity Density Functions combined with MEV capture to "
            "redistribute arbitrage profits back to liquidity providers."
        ) as tracker:
            self.play(FadeIn(cards[3], shift=RIGHT * 0.2), run_time=0.5)
            self.wait(tracker.duration - 0.5)

        clear(self)

    # ── 11. BANCOR LESSON ─────────────────────────────────────────────────────
    def _scene_bancor_lesson(self):
        title = Text("Cautionary Tale: Bancor V3 IL Protection", font_size=30, color=GOLD)\
                  .to_edge(UP, buff=0.5)

        timeline = VGroup(
            self._trow("May 2022",  "Bancor V3 launches",
                       "Instant 100% IL protection — funded by BNT inflation", TEAL),
            self._trow("June 2022", "ILP paused indefinitely",
                       "Terra collapse / 3AC → hostile market → BNT short attack", RED),
            self._trow("2023",      "Class-action lawsuit filed (W.D. Texas)",
                       "Securities Act + breach of contract; protocol knew of deficit", RED),
            self._trow("2024–2026", "Never fully restored",
                       "TVL collapsed; canonical cautionary tale in DeFi research", RED),
        ).arrange(DOWN, buff=0.28).next_to(title, DOWN, buff=0.38)

        lesson_box = RoundedRectangle(
            width=9.5, height=1.1, corner_radius=0.12,
            fill_color=RED, fill_opacity=0.07, stroke_color=RED, stroke_width=1.5
        ).to_edge(DOWN, buff=0.28)
        lesson_txt = Text(
            "IL insurance funded by protocol inflation is reflexively fragile —\n"
            "it fails under exactly the market conditions where you need it most",
            font_size=17, color=RED
        ).move_to(lesson_box)

        with self.voiceover(
            "A lesson from Bancor V3. In May 2022 they launched instant 100 percent "
            "IL protection — funded by minting BNT tokens."
        ) as tracker:
            self.play(Write(title), run_time=0.8)
            self.play(FadeIn(timeline[0], shift=RIGHT * 0.2), run_time=0.5)
            self.wait(tracker.duration - 1.3)

        with self.voiceover(
            "One month later, following the Terra collapse and the 3AC crisis, "
            "Bancor paused the protection indefinitely, citing hostile market "
            "conditions and a large coordinated short on BNT."
        ) as tracker:
            self.play(FadeIn(timeline[1], shift=RIGHT * 0.2), run_time=0.5)
            self.wait(tracker.duration - 0.5)

        with self.voiceover(
            "A class-action lawsuit was filed in 2023 in U.S. federal court, alleging "
            "Bancor knew the mechanism ran at a structural deficit before launch. "
            "It was never fully restored and TVL collapsed. The lesson: IL insurance "
            "funded by inflation is reflexively fragile — it fails under exactly "
            "the market conditions where you would need it most."
        ) as tracker:
            self.play(FadeIn(timeline[2], shift=RIGHT * 0.2), run_time=0.4)
            self.play(FadeIn(timeline[3], shift=RIGHT * 0.2), run_time=0.4)
            self.play(Create(lesson_box), Write(lesson_txt), run_time=0.7)
            self.wait(tracker.duration - 1.5)

        clear(self)

    # ── 12. TAKEAWAY ──────────────────────────────────────────────────────────
    def _scene_takeaway(self):
        title = Text("Takeaway", font_size=38, color=GOLD).to_edge(UP, buff=0.5)

        rules = [
            ("Calculate before depositing",  "expected fee APR vs expected IL for this pair",  TEAL),
            ("IL is symmetric by ratio",      "ETH ×2 = ETH ÷2 in IL cost (both –5.7%)",       TEAL),
            ("'Impermanent' is misleading",   "LVR accrues every block — often permanent",      RED),
            ("Correlated pairs = lowest IL",  "stETH/ETH, stable/stable → r ≈ 1 always",        GOLD),
            ("No guaranteed IL insurance",    "Bancor 2022 — inflation-backed protection fails", RED),
        ]
        rule_group = VGroup()
        for rule, detail, col in rules:
            box = RoundedRectangle(
                width=10.5, height=0.82, corner_radius=0.12,
                fill_color=col, fill_opacity=0.07, stroke_color=col, stroke_width=1.2
            )
            r_t = Text(rule,   font_size=18, color=col)\
                    .move_to(box).align_to(box, LEFT).shift(RIGHT * 0.25)
            d_t = Text(detail, font_size=16, color=WHITE)\
                    .move_to(box).align_to(box, RIGHT).shift(LEFT * 0.25)
            rule_group.add(VGroup(box, r_t, d_t))
        rule_group.arrange(DOWN, buff=0.22).next_to(title, DOWN, buff=0.38)

        cite = Text(
            "Pintail (2019) · Aigner (2021) arXiv:2106.14404 · "
            "Milionis et al. (2022) arXiv:2208.06046 · Harvey et al. (2021)",
            font_size=13, color=GRAY
        ).to_edge(DOWN, buff=0.22)

        with self.voiceover(
            "Before providing liquidity anywhere: calculate expected annual fee income "
            "and expected IL given typical volatility for this pair. If fee APR does not "
            "comfortably exceed expected IL, you are subsidising traders with your capital."
        ) as tracker:
            self.play(Write(title), run_time=0.8)
            self.play(FadeIn(rule_group[0], shift=RIGHT * 0.2), run_time=0.4)
            self.play(FadeIn(rule_group[1], shift=RIGHT * 0.2), run_time=0.4)
            self.wait(tracker.duration - 1.6)

        with self.voiceover(
            "IL is a symmetric function of the price ratio. Academically, "
            "Loss-Versus-Rebalancing is the more honest framing — it is non-reversible "
            "and accrues every block."
        ) as tracker:
            self.play(FadeIn(rule_group[2], shift=RIGHT * 0.2), run_time=0.4)
            self.wait(tracker.duration - 0.4)

        with self.voiceover(
            "Stick to correlated pairs for conservative LP. And treat any "
            "'IL protection' claim with extreme scepticism — the Bancor lesson "
            "is that inflation-backed protection fails when you need it most."
        ) as tracker:
            self.play(FadeIn(rule_group[3], shift=RIGHT * 0.2), run_time=0.4)
            self.play(FadeIn(rule_group[4], shift=RIGHT * 0.2), run_time=0.4)
            self.play(FadeIn(cite), run_time=0.5)
            self.wait(tracker.duration - 1.3)

        clear(self)

    # ── 13. CTA ───────────────────────────────────────────────────────────────
    def _scene_cta(self):
        outro   = Text("QuantiFire  |  EP 12", font_size=30, color=GOLD).shift(UP * 0.8)
        next_ep = Text(
            "Next: EP 13 — Uniswap V3 Concentrated Liquidity\n"
            "4,000× capital efficiency — and the catch",
            font_size=21, color=WHITE
        ).next_to(outro, DOWN, buff=0.4)
        sub = Text("Subscribe · QuantiFire", font_size=19, color=GRAY)\
                .next_to(next_ep, DOWN, buff=0.35)

        with self.voiceover(
            "Next: Uniswap V3 Concentrated Liquidity — how narrowing your price range "
            "can deliver 4,000 times the capital efficiency, and the active management "
            "strategies you need to capture it without getting wrecked by IL."
        ) as tracker:
            self.play(FadeIn(outro), run_time=0.6)
            self.play(FadeIn(next_ep), run_time=0.7)
            self.wait(tracker.duration - 1.3)

        with self.voiceover("Subscribe. QuantiFire.") as tracker:
            self.play(FadeIn(sub), run_time=0.5)
            self.wait(tracker.duration - 0.5)

    # ── HELPERS ───────────────────────────────────────────────────────────────
    def _mcard(self, name, mechanic, note, color):
        box  = RoundedRectangle(
            width=10.5, height=1.15, corner_radius=0.12,
            fill_color=color, fill_opacity=0.07, stroke_color=color, stroke_width=1.4
        )
        n_t  = Text(name,    font_size=19, color=color, weight=BOLD)\
                 .move_to(box).align_to(box, LEFT).shift(RIGHT * 0.3 + UP * 0.22)
        m_t  = Text(mechanic, font_size=15, color=WHITE)\
                 .move_to(box).align_to(box, LEFT).shift(RIGHT * 0.3 + DOWN * 0.05)
        nt_t = Text(note,    font_size=14, color=GRAY)\
                 .move_to(box).align_to(box, LEFT).shift(RIGHT * 0.3 + DOWN * 0.3)
        return VGroup(box, n_t, m_t, nt_t)

    def _trow(self, date, event, desc, color):
        d_t  = Text(date,  font_size=19, color=color, weight=BOLD)
        e_t  = Text(event, font_size=19, color=color)
        de_t = Text(desc,  font_size=15, color=WHITE)
        row  = VGroup(d_t, e_t, de_t).arrange(RIGHT, buff=0.45)
        line = Line(LEFT * 5.5, RIGHT * 5.5, color=color, stroke_width=0.4)\
                 .next_to(row, DOWN, buff=0.08)
        return VGroup(row, line)

    def _sources_box(self, sources):
        lines = [Text(s, font_size=13, color=GRAY) for s in sources]
        group = VGroup(*lines).arrange(DOWN, buff=0.10, aligned_edge=LEFT)
        box   = SurroundingRectangle(group, color=GRAY, buff=0.14, corner_radius=0.10)
        return VGroup(box, group).to_edge(DOWN, buff=0.22)
