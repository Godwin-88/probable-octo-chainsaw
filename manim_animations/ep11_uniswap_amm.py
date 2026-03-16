"""
QuantiFire EP11 — How Uniswap Actually Works: The x·y=k Formula
Run: manim -pql ep11_uniswap_amm.py UniswapAMMScene
Audio: AI voiceover via manim-voiceover

Sources cited on-screen:
  Adams, Zinsmeister & Robinson (2020) Uniswap v2 Core whitepaper
  Angeris et al. (2021) arXiv:1911.03380 — Uniswap market analysis
  Angeris & Chitra (2020) arXiv:2003.10001 — CFMM price oracle theory
  Harvey, Ramachandran & Santoro (2021) DeFi and the Future of Finance, Wiley
  CoinGecko Research (2021) How to DeFi: Advanced
  Delbaen & Schachermayer (2006) The Mathematics of Arbitrage, Springer

Key 2025 facts incorporated (web-verified):
  - V1 launch: Nov 2018; V2: May 2020; V3: May 2021; V4: Jan 30 2025
  - Cumulative protocol volume > $2 trillion (all versions, 2025)
  - V2 TVL ~$834M; total Uniswap TVL ~$4.5-6.8B (DeFiLlama, 2025)
  - Fee switch passed Dec 26 2025: 0.25% LP + 0.05% protocol fee; 100M UNI burn
  - V4: hooks + flash accounting + native ETH (no WETH wrapping)
  - Post-Dencun mainnet gas: V2 swap ~$0.39-2 USD
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


class UniswapAMMScene(VoiceoverScene):
    def construct(self):
        self.camera.background_color = BG
        self.set_speech_service(GTTSService(lang="en"))
        # PRODUCTION: self.set_speech_service(ElevenLabsService(...))

        self._scene_hook()
        self._scene_context()
        self._scene_invariant()
        self._scene_hyperbola()
        self._scene_trade_walkthrough()
        self._scene_output_formula()
        self._scene_price_impact()
        self._scene_arbitrage()
        self._scene_versions()
        self._scene_fee_tiers()
        self._scene_takeaway()
        self._scene_cta()

    # ── 1. HOOK ────────────────────────────────────────────────────────────────
    def _scene_hook(self):
        title = Text("How Uniswap Actually Works", font_size=40, color=GOLD)\
                  .to_edge(UP, buff=0.5)
        sub   = Text("The x · y = k Formula", font_size=28, color=TEAL)\
                  .next_to(title, DOWN, buff=0.18)

        order_book = VGroup(
            Text("BUY   2,000  @ $1,990", font_size=18, color=TEAL),
            Text("BUY   5,000  @ $1,985", font_size=18, color=TEAL),
            Text("SELL  1,500  @ $2,001", font_size=18, color=RED),
            Text("SELL  3,000  @ $2,010", font_size=18, color=RED),
        ).arrange(DOWN, buff=0.15, aligned_edge=LEFT).shift(LEFT * 2.8 + UP * 0.3)
        ob_box   = SurroundingRectangle(order_book, color=GRAY, buff=0.2, corner_radius=0.1)
        ob_label = Text("Traditional order book", font_size=16, color=GRAY)\
                     .next_to(ob_box, UP, buff=0.1)

        cross = Cross(ob_box, color=RED, stroke_width=4)

        equation = MathTex(r"x \cdot y = k", font_size=72, color=GOLD)\
                     .shift(RIGHT * 2.5 + UP * 0.3)
        eq_label  = Text("Uniswap AMM", font_size=18, color=TEAL)\
                      .next_to(equation, DOWN, buff=0.2)

        vol_stat = Text(
            "$2 trillion+ cumulative volume · zero human market makers",
            font_size=18, color=WHITE
        ).to_edge(DOWN, buff=0.35)

        with self.voiceover(
            "Every stock exchange in the world works the same way: buyers post bids, "
            "sellers post asks, and a matching engine pairs them together."
        ) as tracker:
            self.play(Write(title), FadeIn(sub), run_time=0.9)
            self.play(Create(ob_box), FadeIn(ob_label), run_time=0.5)
            for row in order_book:
                self.play(FadeIn(row), run_time=0.25)
            self.wait(tracker.duration - 2.0)

        with self.voiceover(
            "Uniswap threw out that entire system in 2018 and replaced it with a "
            "single mathematical equation: x times y equals k."
        ) as tracker:
            self.play(Create(cross), run_time=0.6)
            self.play(Write(equation), FadeIn(eq_label), run_time=1.0)
            self.wait(tracker.duration - 1.6)

        with self.voiceover(
            "That equation now powers over two trillion dollars in cumulative trading "
            "volume with zero human market makers. Here is how it actually works."
        ) as tracker:
            self.play(FadeIn(vol_stat), run_time=0.6)
            self.wait(tracker.duration - 0.6)

        clear(self)

    # ── 2. CONTEXT ─────────────────────────────────────────────────────────────
    def _scene_context(self):
        title = Text("Uniswap — Context & History", font_size=34, color=GOLD)\
                  .to_edge(UP, buff=0.5)

        timeline = VGroup(
            self._trow("Nov 2018", "Uniswap V1",
                       "Hayden Adams launches CFMM\non Ethereum — first of its kind", TEAL),
            self._trow("May 2020", "Uniswap V2",
                       "Flash swaps, on-chain TWAP\noracle, ERC-20/ERC-20 pairs", BLUE),
            self._trow("May 2021", "Uniswap V3",
                       "Concentrated liquidity ranges,\nmultiple fee tiers", GOLD),
            self._trow("Jan 2025", "Uniswap V4",
                       "Hooks, flash accounting,\nnative ETH — no WETH wrap", PURPLE),
        ).arrange(DOWN, buff=0.32).next_to(title, DOWN, buff=0.42)

        src_box = self._sources_box([
            "Adams, Zinsmeister & Robinson (2020) Uniswap v2 Core (whitepaper)",
            "Harvey, Ramachandran & Santoro (2021) DeFi and the Future of Finance, Wiley",
            "CoinGecko Research (2021) How to DeFi: Advanced",
            "Angeris et al. (2021) arXiv:1911.03380",
        ])

        with self.voiceover(
            "Welcome to QuantiFire. Hayden Adams — a mechanical engineer who taught himself "
            "Solidity after being laid off from Siemens — launched Uniswap V1 in November 2018."
        ) as tracker:
            self.play(Write(title), run_time=0.8)
            self.play(FadeIn(timeline[0], shift=RIGHT * 0.2), run_time=0.6)
            self.wait(tracker.duration - 1.4)

        with self.voiceover(
            "V2 added flash swaps and ERC-20 to ERC-20 pairs in May 2020. V3 introduced "
            "concentrated liquidity in 2021. And V4 — launched January 30, 2025 — added "
            "hooks: modular smart contracts that attach custom logic to any pool."
        ) as tracker:
            self.play(FadeIn(timeline[1], shift=RIGHT * 0.2), run_time=0.4)
            self.play(FadeIn(timeline[2], shift=RIGHT * 0.2), run_time=0.4)
            self.play(FadeIn(timeline[3], shift=RIGHT * 0.2), run_time=0.4)
            self.wait(tracker.duration - 1.2)

        with self.voiceover(
            "Uniswap is an Automated Market Maker — an AMM. Instead of an order book, "
            "it uses a liquidity pool: a smart contract holding two tokens. This model is "
            "the foundation of DeFi. Understanding it is non-negotiable."
        ) as tracker:
            self.play(FadeIn(src_box), run_time=0.6)
            self.wait(tracker.duration - 0.6)

        clear(self)

    # ── 3. THE INVARIANT ───────────────────────────────────────────────────────
    def _scene_invariant(self):
        title = Text("The Invariant: x · y = k", font_size=34, color=GOLD)\
                  .to_edge(UP, buff=0.5)

        big_eq = MathTex(r"x \cdot y = k", font_size=80, color=GOLD).shift(UP * 1.3)

        brace_x = Brace(MathTex(r"x", font_size=80).shift(UP * 1.3 + LEFT * 0.65), DOWN, color=TEAL)
        lbl_x   = Text("Token A\nreserves", font_size=18, color=TEAL)\
                    .next_to(brace_x, DOWN, buff=0.08)
        brace_y = Brace(MathTex(r"y", font_size=80).shift(UP * 1.3 + RIGHT * 0.65), DOWN, color=BLUE)
        lbl_y   = Text("Token B\nreserves", font_size=18, color=BLUE)\
                    .next_to(brace_y, DOWN, buff=0.08)
        brace_k = Brace(MathTex(r"k", font_size=80).shift(UP * 1.3 + RIGHT * 1.85), DOWN, color=GRAY)
        lbl_k   = Text("constant\n(invariant)", font_size=18, color=GRAY)\
                    .next_to(brace_k, DOWN, buff=0.08)

        example = VGroup(
            Text("Pool:  100 ETH  ×  200,000 USDC  =  20,000,000  (k)",
                 font_size=20, color=WHITE),
            Text("Implied price  =  200,000 / 100  =  2,000 USDC per ETH",
                 font_size=20, color=TEAL),
        ).arrange(DOWN, buff=0.22, aligned_edge=LEFT).shift(DOWN * 1.6)
        ex_box = SurroundingRectangle(example, color=TEAL, buff=0.18, corner_radius=0.1)

        rule = Text(
            "Every trade must leave k unchanged (before fees)",
            font_size=20, color=GOLD
        ).to_edge(DOWN, buff=0.3)

        with self.voiceover(
            "The invariant rule: x times y equals k. x is the reserve of Token A, "
            "y is the reserve of Token B, k is a constant."
        ) as tracker:
            self.play(Write(title), run_time=0.8)
            self.play(Write(big_eq), run_time=1.2)
            self.wait(tracker.duration - 2.0)

        with self.voiceover(
            "x labels the left side, y the right, k the product that must stay fixed. "
            "These are the three terms of the constant product formula."
        ) as tracker:
            self.play(Create(brace_x), FadeIn(lbl_x), run_time=0.5)
            self.play(Create(brace_y), FadeIn(lbl_y), run_time=0.5)
            self.play(Create(brace_k), FadeIn(lbl_k), run_time=0.5)
            self.wait(tracker.duration - 1.5)

        with self.voiceover(
            "Concrete example: 100 ETH and 200,000 USDC gives k equals 20 million. "
            "The implied ETH price is 200,000 divided by 100 — 2,000 USDC per ETH. "
            "No order book. No market maker. Just math enforcing the invariant."
        ) as tracker:
            self.play(Create(ex_box), FadeIn(example), run_time=0.8)
            self.play(FadeIn(rule), run_time=0.5)
            self.wait(tracker.duration - 1.3)

        clear(self)

    # ── 4. THE HYPERBOLA CURVE ─────────────────────────────────────────────────
    def _scene_hyperbola(self):
        title = Text("The Pricing Curve", font_size=34, color=GOLD).to_edge(UP, buff=0.5)

        axes = Axes(
            x_range=[0, 200, 50], y_range=[0, 420_000, 100_000],
            x_length=7.5, y_length=4.2,
            axis_config={"color": GRAY, "include_numbers": True},
            tips=False
        ).shift(DOWN * 0.55 + LEFT * 0.3)

        x_lbl = Text("ETH reserves (x)", font_size=18, color=TEAL)\
                  .next_to(axes.x_axis.get_end(), RIGHT, buff=0.12)
        y_lbl = Text("USDC (y)", font_size=18, color=BLUE)\
                  .next_to(axes.y_axis.get_end(), UP, buff=0.1)

        k = 100 * 200_000
        curve = axes.plot(
            lambda x: k / x,
            x_range=[5, 190, 0.5],
            color=GOLD, stroke_width=3
        )

        x0, y0 = 100.0, 200_000.0
        p0 = axes.coords_to_point(x0, y0)
        state_dot = Dot(p0, color=WHITE, radius=0.12)
        state_lbl = Text("100 ETH · 200,000 USDC\nPrice = $2,000", font_size=16, color=WHITE)\
                      .next_to(state_dot, UR, buff=0.15)

        slope_note = Text(
            "Slope of curve at any point  =  market price",
            font_size=18, color=TEAL
        ).to_edge(DOWN, buff=0.3)

        never_zero = Text(
            "Asymptotic — a pool can never be fully drained",
            font_size=17, color=GRAY
        ).next_to(slope_note, UP, buff=0.12)

        with self.voiceover(
            "The invariant x times y equals k traces a hyperbola in reserve space. "
            "The pool state must always sit on this curve."
        ) as tracker:
            self.play(Write(title), Create(axes), Write(x_lbl), Write(y_lbl), run_time=1.0)
            self.play(Create(curve), run_time=1.5)
            self.wait(tracker.duration - 2.5)

        with self.voiceover(
            "This point at 100 ETH and 200,000 USDC is the current pool state. "
            "The slope of the curve here gives the market price — 2,000 USDC per ETH."
        ) as tracker:
            self.play(FadeIn(state_dot, scale=1.4), Write(state_lbl), run_time=0.8)
            self.wait(tracker.duration - 0.8)

        with self.voiceover(
            "The curve is asymptotic in both directions. As one reserve approaches zero, "
            "the price goes to infinity — a pool can never be fully drained. That is a "
            "mathematical guarantee, not a governance rule."
        ) as tracker:
            self.play(FadeIn(never_zero), FadeIn(slope_note), run_time=0.7)
            self.wait(tracker.duration - 0.7)

        clear(self)

    # ── 5. TRADE WALKTHROUGH ───────────────────────────────────────────────────
    def _scene_trade_walkthrough(self):
        title = Text("Trade Walkthrough — Buying 1 ETH", font_size=32, color=GOLD)\
                  .to_edge(UP, buff=0.5)

        steps = VGroup(
            Text("Before trade:   x = 100 ETH,  y = 200,000 USDC,  k = 20,000,000",
                 font_size=19, color=WHITE),
            Text("You take 1 ETH out  →  new x = 99 ETH",
                 font_size=19, color=TEAL),
            MathTex(r"\text{new } y = \frac{k}{x'} = \frac{20{,}000{,}000}{99} = 202{,}020.20\;\text{USDC}",
                    font_size=30, color=BLUE),
            Text("You must send in:  202,020.20 − 200,000  =  2,020.20 USDC",
                 font_size=19, color=WHITE),
            Text("Effective price paid:  2,020.20 USDC per ETH", font_size=19, color=WHITE),
        ).arrange(DOWN, buff=0.28, aligned_edge=LEFT).shift(DOWN * 0.3)

        impact_box = RoundedRectangle(
            width=9.5, height=0.95, corner_radius=0.12,
            fill_color=RED, fill_opacity=0.08,
            stroke_color=RED, stroke_width=1.5
        ).to_edge(DOWN, buff=0.28)
        impact_txt = Text(
            "Price impact = (2,020.20 − 2,000) / 2,000 = 1.01%  ← cost of moving the pool",
            font_size=18, color=RED
        ).move_to(impact_box)

        with self.voiceover(
            "Before the trade: 100 ETH, 200,000 USDC, k equals 20 million."
        ) as tracker:
            self.play(Write(title), run_time=0.8)
            self.play(FadeIn(steps[0], shift=RIGHT * 0.2), run_time=0.5)
            self.wait(tracker.duration - 1.3)

        with self.voiceover(
            "You want to buy 1 ETH. You are taking ETH out of the pool, so the new "
            "ETH reserve must be 99."
        ) as tracker:
            self.play(FadeIn(steps[1], shift=RIGHT * 0.2), run_time=0.5)
            self.wait(tracker.duration - 0.5)

        with self.voiceover(
            "To keep k constant, new USDC reserve equals 20 million divided by 99 — "
            "which is 202,020.20 USDC. You must send in 2,020.20 USDC to cover the difference."
        ) as tracker:
            self.play(FadeIn(steps[2], shift=RIGHT * 0.2), run_time=0.6)
            self.play(FadeIn(steps[3], shift=RIGHT * 0.2), run_time=0.5)
            self.wait(tracker.duration - 1.1)

        with self.voiceover(
            "Effective price: 2,020.20 USDC per ETH against a pre-trade price of 2,000. "
            "That 1.01 percent premium is price impact — the cost of moving the pool's "
            "price with your trade."
        ) as tracker:
            self.play(FadeIn(steps[4], shift=RIGHT * 0.2), run_time=0.4)
            self.play(Create(impact_box), Write(impact_txt), run_time=0.7)
            self.wait(tracker.duration - 1.1)

        clear(self)

    # ── 6. OUTPUT FORMULA & FEES ───────────────────────────────────────────────
    def _scene_output_formula(self):
        title = Text("AMM Output Formula & Fee Structure", font_size=32, color=GOLD)\
                  .to_edge(UP, buff=0.5)

        formula = MathTex(
            r"\Delta_{\text{out}}",
            r"=",
            r"\frac{r_{\text{out}} \cdot \Delta_{\text{in}} \cdot (1 - f)}",
                  r"{r_{\text{in}} + \Delta_{\text{in}} \cdot (1 - f)}",
            font_size=38, color=TEAL
        ).shift(UP * 1.3)

        b_out  = Brace(formula[0], DOWN, color=TEAL)
        l_out  = Text("tokens received", font_size=16, color=TEAL).next_to(b_out, DOWN, buff=0.08)
        b_rin  = Brace(formula[3], DOWN, color=GOLD)
        l_rin  = Text("r_in + adjusted\namount in", font_size=15, color=GOLD).next_to(b_rin, DOWN, buff=0.08)

        fee_rows = VGroup(
            self._fee_row("V2 (original)", "0.30%", "100% to LPs", WHITE, TEAL),
            self._fee_row("V2 (post Dec-2025)", "0.25% LP + 0.05% protocol", "fee switch activated", GOLD, GOLD),
            self._fee_row("V3 stable pairs", "0.01% – 0.05%", "LP keeps all (switch pending)", TEAL, TEAL),
            self._fee_row("V3 exotic pairs", "0.30% – 1.00%", "higher IL risk compensation", RED, RED),
        ).arrange(DOWN, buff=0.22).shift(DOWN * 1.0)

        gov_note = Text(
            "Fee switch passed governance Dec 26 2025 · 100M UNI burn initiated",
            font_size=15, color=GRAY
        ).to_edge(DOWN, buff=0.28)

        with self.voiceover(
            "The general AMM output formula: delta-out equals reserve-out times delta-in "
            "times one minus fee, all divided by reserve-in plus delta-in times one minus fee."
        ) as tracker:
            self.play(Write(title), run_time=0.8)
            self.play(Write(formula), run_time=1.2)
            self.play(Create(b_out), FadeIn(l_out), run_time=0.5)
            self.play(Create(b_rin), FadeIn(l_rin), run_time=0.5)
            self.wait(tracker.duration - 3.0)

        with self.voiceover(
            "The fee f is deducted from the amount in before computation. In V2 originally, "
            "the fee was 0.3 percent — 100 percent going to liquidity providers."
        ) as tracker:
            self.play(FadeIn(fee_rows[0], shift=RIGHT * 0.2), run_time=0.5)
            self.wait(tracker.duration - 0.5)

        with self.voiceover(
            "In December 2025, Uniswap governance passed the fee switch: V2 pools now split "
            "the fee — 0.25 percent to LPs and 0.05 percent as a protocol fee used to buy "
            "and burn UNI tokens. A hundred million UNI tokens were burned at activation."
        ) as tracker:
            self.play(FadeIn(fee_rows[1], shift=RIGHT * 0.2), run_time=0.5)
            self.play(FadeIn(gov_note), run_time=0.4)
            self.wait(tracker.duration - 0.9)

        with self.voiceover(
            "V3 introduced tiered fees: 0.01 to 0.05 percent for stable pairs, "
            "up to 1 percent for exotic volatile pairs where impermanent loss risk is highest."
        ) as tracker:
            self.play(FadeIn(fee_rows[2], shift=RIGHT * 0.2), run_time=0.4)
            self.play(FadeIn(fee_rows[3], shift=RIGHT * 0.2), run_time=0.4)
            self.wait(tracker.duration - 0.8)

        clear(self)

    # ── 7. PRICE IMPACT ────────────────────────────────────────────────────────
    def _scene_price_impact(self):
        title = Text("Price Impact Scales with Trade Size", font_size=32, color=GOLD)\
                  .to_edge(UP, buff=0.5)

        # Bar chart of price impact vs trade size
        sizes   = [0.1, 1.0, 5.0, 10.0, 25.0, 50.0]  # % of pool
        impacts = [0.1, 1.01, 5.26, 11.11, 33.33, 100.0]
        colors  = [TEAL, TEAL, GOLD, GOLD, RED, RED]

        ax = Axes(
            x_range=[-0.5, 5.5, 1], y_range=[0, 115, 20],
            x_length=9.0, y_length=3.8,
            axis_config={"color": GRAY, "include_numbers": False},
            tips=False
        ).shift(DOWN * 0.6)

        bars, xlbls, ylbls = VGroup(), VGroup(), VGroup()
        for i, (sz, imp, col) in enumerate(zip(sizes, impacts, colors)):
            x0 = ax.coords_to_point(i, 0)
            x1 = ax.coords_to_point(i, imp)
            bar = Rectangle(
                width=0.72, height=abs(x1[1] - x0[1]),
                fill_color=col, fill_opacity=0.85, stroke_width=0
            ).move_to([(x0[0] + x1[0]) / 2, (x0[1] + x1[1]) / 2, 0])
            xlbl = Text(f"{sz}%", font_size=16, color=col)\
                     .next_to(ax.coords_to_point(i, 0), DOWN, buff=0.1)
            ylbl = Text(f"{imp:.1f}%", font_size=14, color=col)\
                     .next_to(bar, UP, buff=0.06)
            bars.add(bar); xlbls.add(xlbl); ylbls.add(ylbl)

        ax_xlabel = Text("Trade as % of pool", font_size=17, color=GRAY)\
                      .next_to(ax.x_axis.get_end(), RIGHT, buff=0.12)
        ax_ylabel = Text("Price\nimpact", font_size=16, color=GRAY)\
                      .next_to(ax.y_axis.get_end(), UP, buff=0.08)

        rule_box = RoundedRectangle(
            width=9.5, height=0.9, corner_radius=0.12,
            fill_color=GOLD, fill_opacity=0.07, stroke_color=GOLD, stroke_width=1.4
        ).to_edge(DOWN, buff=0.28)
        rule_txt = Text(
            "Always compute price impact for trades > 0.1% of pool size — beyond that, impact is meaningful",
            font_size=17, color=GOLD
        ).move_to(rule_box)

        angeris_note = Text(
            "Angeris et al. (2021) arXiv:1911.03380: formal proof of CFMM pricing properties",
            font_size=14, color=GRAY
        ).next_to(rule_box, UP, buff=0.1)

        with self.voiceover(
            "Price impact scales superlinearly with trade size. Trading 0.1 percent of the "
            "pool gives 0.1 percent impact. Trading 1 percent gives about 1 percent impact."
        ) as tracker:
            self.play(Write(title), Create(ax), Write(ax_xlabel), Write(ax_ylabel), run_time=1.0)
            self.play(
                LaggedStart(*[GrowFromEdge(b, DOWN) for b in bars[:2]], lag_ratio=0.2),
                LaggedStart(*[FadeIn(l) for l in xlbls[:2]], lag_ratio=0.2),
                LaggedStart(*[FadeIn(l) for l in ylbls[:2]], lag_ratio=0.2),
                run_time=0.8
            )
            self.wait(tracker.duration - 1.8)

        with self.voiceover(
            "Trading 10 percent of the pool costs over 11 percent in price impact. "
            "Trading 50 percent costs 100 percent impact — you pay double the pre-trade price."
        ) as tracker:
            self.play(
                LaggedStart(*[GrowFromEdge(b, DOWN) for b in bars[2:]], lag_ratio=0.15),
                LaggedStart(*[FadeIn(l) for l in xlbls[2:]], lag_ratio=0.15),
                LaggedStart(*[FadeIn(l) for l in ylbls[2:]], lag_ratio=0.15),
                run_time=1.2
            )
            self.wait(tracker.duration - 1.2)

        with self.voiceover(
            "For large trades, a DEX aggregator like 1inch splits your order across multiple "
            "pools to minimise total impact. Always compute price impact before submitting — "
            "it is deterministic and calculable from the pool reserves on-chain."
        ) as tracker:
            self.play(FadeIn(angeris_note), Create(rule_box), Write(rule_txt), run_time=0.8)
            self.wait(tracker.duration - 0.8)

        clear(self)

    # ── 8. ARBITRAGE ───────────────────────────────────────────────────────────
    def _scene_arbitrage(self):
        title = Text("Arbitrage — The Price Correction Mechanism", font_size=30, color=GOLD)\
                  .to_edge(UP, buff=0.5)

        scenario = VGroup(
            Text("Coinbase ETH price:  $2,100", font_size=21, color=GOLD),
            Text("Uniswap pool price: $2,000  (stale)", font_size=21, color=RED),
        ).arrange(DOWN, buff=0.22, aligned_edge=LEFT).shift(UP * 1.1)
        gap_arrow = Arrow(
            scenario[1].get_right() + RIGHT * 0.1,
            scenario[0].get_right() + RIGHT * 0.1,
            color=RED, stroke_width=2, buff=0.05
        )
        gap_lbl = Text("$100 arb gap", font_size=17, color=RED)\
                    .next_to(gap_arrow, RIGHT, buff=0.1)

        arb_steps = VGroup(
            Text("① Arb bot buys cheap ETH on Uniswap (sends USDC in)", font_size=19, color=TEAL),
            Text("② Sells dear ETH on Coinbase — pockets the spread", font_size=19, color=TEAL),
            Text("③ Uniswap price rises until both markets converge", font_size=19, color=TEAL),
        ).arrange(DOWN, buff=0.26, aligned_edge=LEFT).shift(DOWN * 0.4)

        lp_cost = RoundedRectangle(
            width=9.5, height=1.0, corner_radius=0.12,
            fill_color=RED, fill_opacity=0.08, stroke_color=RED, stroke_width=1.5
        ).to_edge(DOWN, buff=0.28)
        lp_txt = Text(
            "Arb profits come at LP's expense — this is the origin of Impermanent Loss (EP 12)",
            font_size=18, color=RED
        ).move_to(lp_cost)

        with self.voiceover(
            "When ETH trades at 2,100 USDC on Coinbase but Uniswap still shows 2,000, "
            "a one-hundred-dollar arbitrage gap opens."
        ) as tracker:
            self.play(Write(title), run_time=0.8)
            self.play(FadeIn(scenario[0]), FadeIn(scenario[1]), run_time=0.7)
            self.play(GrowArrow(gap_arrow), FadeIn(gap_lbl), run_time=0.5)
            self.wait(tracker.duration - 2.0)

        with self.voiceover(
            "An arbitrage bot buys cheap ETH on Uniswap by sending USDC in, then "
            "immediately sells that ETH on Coinbase at the higher price, pocketing the spread."
        ) as tracker:
            self.play(FadeIn(arb_steps[0], shift=RIGHT * 0.2), run_time=0.4)
            self.play(FadeIn(arb_steps[1], shift=RIGHT * 0.2), run_time=0.4)
            self.wait(tracker.duration - 0.8)

        with self.voiceover(
            "This continues until Uniswap and Coinbase prices converge. Arbitrage "
            "is the price correction mechanism that keeps AMMs aligned with global markets."
        ) as tracker:
            self.play(FadeIn(arb_steps[2], shift=RIGHT * 0.2), run_time=0.4)
            self.wait(tracker.duration - 0.4)

        with self.voiceover(
            "Crucially: the arbitrageur's profits come directly at the liquidity "
            "provider's expense. This profit transfer is the mathematical origin of "
            "impermanent loss — the topic of Episode 12."
        ) as tracker:
            self.play(Create(lp_cost), Write(lp_txt), run_time=0.8)
            self.wait(tracker.duration - 0.8)

        clear(self)

    # ── 9. VERSIONS: V2 → V3 → V4 ─────────────────────────────────────────────
    def _scene_versions(self):
        title = Text("Uniswap V2 vs V3 vs V4", font_size=34, color=GOLD)\
                  .to_edge(UP, buff=0.5)

        rows = [
            ("Liquidity range", "0 → ∞ uniform", "Chosen range [P_L, P_H]", "Any range + hooks", TEAL),
            ("Capital efficiency", "1× baseline",    "Up to 4,000× tighter",   "V3 + flash acctg",  GOLD),
            ("Fee tiers",         "0.3% (now 0.25%+0.05%)", "0.01% / 0.05% / 0.30% / 1%", "Fully custom via hook", WHITE),
            ("Gas (mainnet)",     "~150k units",   "~100k units",            "Lower via flash acctg", TEAL),
            ("Volume share",      "Shrinking",     "Dominant (≈5× V2)",      "Growing fast (>$190B)", BLUE),
        ]

        headers = VGroup(
            Text("Dimension",    font_size=17, color=GOLD, weight=BOLD),
            Text("V2",           font_size=17, color=GOLD, weight=BOLD),
            Text("V3",           font_size=17, color=GOLD, weight=BOLD),
            Text("V4 (2025)",    font_size=17, color=GOLD, weight=BOLD),
        ).arrange(RIGHT, buff=0.5).next_to(title, DOWN, buff=0.4)

        table_rows = VGroup()
        for i, (dim, v2, v3, v4, col) in enumerate(rows):
            row = VGroup(
                Text(dim, font_size=15, color=col),
                Text(v2,  font_size=14, color=WHITE),
                Text(v3,  font_size=14, color=WHITE),
                Text(v4,  font_size=14, color=WHITE),
            ).arrange(RIGHT, buff=0.5)
            table_rows.add(row)
        table_rows.arrange(DOWN, buff=0.28, aligned_edge=LEFT)\
                  .next_to(headers, DOWN, buff=0.3)

        v4_note = Text(
            "V4 hooks: custom logic before/after swap, mint, burn — one hook per pool",
            font_size=16, color=PURPLE
        ).to_edge(DOWN, buff=0.3)

        with self.voiceover(
            "V2 spreads liquidity uniformly from price zero to infinity — "
            "most of the capital sits at extreme prices that are rarely traded."
        ) as tracker:
            self.play(Write(title), FadeIn(headers), run_time=0.9)
            self.play(FadeIn(table_rows[0], shift=RIGHT * 0.2), run_time=0.4)
            self.play(FadeIn(table_rows[1], shift=RIGHT * 0.2), run_time=0.4)
            self.wait(tracker.duration - 1.7)

        with self.voiceover(
            "V3 LPs choose a price range. Concentrated liquidity achieves up to 4,000 "
            "times the capital efficiency of V2 for a tight range around the current price. "
            "V3 now handles roughly 5 times V2 volume."
        ) as tracker:
            self.play(FadeIn(table_rows[2], shift=RIGHT * 0.2), run_time=0.4)
            self.play(FadeIn(table_rows[3], shift=RIGHT * 0.2), run_time=0.4)
            self.wait(tracker.duration - 0.8)

        with self.voiceover(
            "V4, launched January 2025, adds hooks — modular contracts that attach "
            "custom logic to pools before and after swaps. Flash accounting nets all "
            "intermediate transfers, cutting gas further. V4 already crossed 190 billion "
            "in cumulative volume by September 2025."
        ) as tracker:
            self.play(FadeIn(table_rows[4], shift=RIGHT * 0.2), run_time=0.4)
            self.play(FadeIn(v4_note), run_time=0.5)
            self.wait(tracker.duration - 0.9)

        clear(self)

    # ── 10. FEE TIERS ──────────────────────────────────────────────────────────
    def _scene_fee_tiers(self):
        title = Text("Fee Tiers & LP Economics", font_size=34, color=GOLD)\
                  .to_edge(UP, buff=0.5)

        tiers = [
            ("0.01%",  "ETH/USDC, USDC/USDT",       "Stablecoin pairs",    TEAL),
            ("0.05%",  "ETH/USDC (alt tier), WBTC/ETH", "Low-vol blue chips", TEAL),
            ("0.30%",  "Most standard pairs",         "Default — V2 heritage", GOLD),
            ("1.00%",  "New tokens, high-vol exotics","Compensates IL risk", RED),
        ]

        tier_cards = VGroup()
        for fee, example, desc, col in tiers:
            box  = RoundedRectangle(
                width=10.5, height=1.0, corner_radius=0.12,
                fill_color=col, fill_opacity=0.07,
                stroke_color=col, stroke_width=1.3
            )
            fee_t  = Text(fee,     font_size=24, color=col, weight=BOLD)\
                       .move_to(box).align_to(box, LEFT).shift(RIGHT * 0.4)
            ex_t   = Text(example, font_size=16, color=WHITE)\
                       .move_to(box).shift(LEFT * 0.5)
            desc_t = Text(desc,    font_size=15, color=GRAY)\
                       .move_to(box).align_to(box, RIGHT).shift(LEFT * 0.4)
            tier_cards.add(VGroup(box, fee_t, ex_t, desc_t))
        tier_cards.arrange(DOWN, buff=0.22).next_to(title, DOWN, buff=0.4)

        insight = Text(
            "Higher fee  →  better IL compensation  →  LPs accept wider spreads",
            font_size=17, color=TEAL
        ).to_edge(DOWN, buff=0.3)

        with self.voiceover(
            "V3 introduced four fee tiers. The 0.01 percent tier for stablecoin pairs — "
            "minimal volatility means minimal impermanent loss risk, so LPs accept "
            "razor-thin fees."
        ) as tracker:
            self.play(Write(title), run_time=0.8)
            self.play(FadeIn(tier_cards[0], shift=RIGHT * 0.2), run_time=0.4)
            self.play(FadeIn(tier_cards[1], shift=RIGHT * 0.2), run_time=0.4)
            self.wait(tracker.duration - 1.6)

        with self.voiceover(
            "The 0.3 percent tier is the V2 heritage standard, still used for most "
            "mainstream pairs. The 1 percent tier targets exotic or newly launched "
            "tokens where impermanent loss risk is highest — LPs demand higher "
            "compensation."
        ) as tracker:
            self.play(FadeIn(tier_cards[2], shift=RIGHT * 0.2), run_time=0.4)
            self.play(FadeIn(tier_cards[3], shift=RIGHT * 0.2), run_time=0.4)
            self.play(FadeIn(insight), run_time=0.5)
            self.wait(tracker.duration - 1.3)

        clear(self)

    # ── 11. TAKEAWAY ──────────────────────────────────────────────────────────
    def _scene_takeaway(self):
        title = Text("Takeaway", font_size=38, color=GOLD).to_edge(UP, buff=0.5)

        rules = [
            ("x · y = k is the invariant",  "every trade must preserve the product",          TEAL),
            ("Price = dy/dx at pool state",  "slope of the hyperbola — not an order book",     TEAL),
            ("Price impact is deterministic","calculate before signing: impact ∝ trade/pool",  GOLD),
            ("Fee split updated Dec 2025",   "V2: 0.25% LP + 0.05% protocol; 100M UNI burned",GOLD),
            ("Arb profits = LP losses",      "arbitrage is the mechanism behind impermanent loss",RED),
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
        rule_group.arrange(DOWN, buff=0.22).next_to(title, DOWN, buff=0.38)

        cite = Text(
            "Adams et al. (2020) Uniswap v2 Core · Angeris et al. (2021) arXiv:1911.03380 · "
            "Harvey et al. (2021) DeFi and the Future of Finance",
            font_size=13, color=GRAY
        ).to_edge(DOWN, buff=0.22)

        with self.voiceover(
            "The AMM model eliminates order matching and human market makers. x times y "
            "equals k — the invariant. Price is the slope of the hyperbola at the pool state."
        ) as tracker:
            self.play(Write(title), run_time=0.8)
            self.play(FadeIn(rule_group[0], shift=RIGHT * 0.2), run_time=0.4)
            self.play(FadeIn(rule_group[1], shift=RIGHT * 0.2), run_time=0.4)
            self.wait(tracker.duration - 1.6)

        with self.voiceover(
            "Price impact is deterministic and calculable before you submit. The fee "
            "split was updated in December 2025 — V2 now routes 0.05 percent to the "
            "protocol for UNI burns."
        ) as tracker:
            self.play(FadeIn(rule_group[2], shift=RIGHT * 0.2), run_time=0.4)
            self.play(FadeIn(rule_group[3], shift=RIGHT * 0.2), run_time=0.4)
            self.wait(tracker.duration - 0.8)

        with self.voiceover(
            "And critically: arbitrage profits come at the LP's expense. That transfer "
            "is impermanent loss — the hidden cost of providing liquidity. That is the "
            "topic of Episode 12."
        ) as tracker:
            self.play(FadeIn(rule_group[4], shift=RIGHT * 0.2), run_time=0.4)
            self.play(FadeIn(cite), run_time=0.5)
            self.wait(tracker.duration - 0.9)

        clear(self)

    # ── 12. CTA ───────────────────────────────────────────────────────────────
    def _scene_cta(self):
        outro  = Text("QuantiFire  |  EP 11", font_size=30, color=GOLD).shift(UP * 0.8)
        next_ep = Text(
            "Next: EP 12 — Impermanent Loss\n"
            "The hidden cost every LP must understand before depositing",
            font_size=21, color=WHITE
        ).next_to(outro, DOWN, buff=0.4)
        sub = Text("Subscribe · QuantiFire", font_size=19, color=GRAY)\
                .next_to(next_ep, DOWN, buff=0.35)

        with self.voiceover(
            "Next episode: Impermanent Loss — the hidden cost of being a Uniswap LP that "
            "the marketing materials never emphasise enough. I will show you the exact "
            "formula and how to calculate your real P&L as a liquidity provider."
        ) as tracker:
            self.play(FadeIn(outro), run_time=0.6)
            self.play(FadeIn(next_ep), run_time=0.7)
            self.wait(tracker.duration - 1.3)

        with self.voiceover("Subscribe. QuantiFire.") as tracker:
            self.play(FadeIn(sub), run_time=0.5)
            self.wait(tracker.duration - 0.5)

    # ── HELPERS ───────────────────────────────────────────────────────────────
    def _trow(self, date, version, desc, color):
        d_t   = Text(date,    font_size=20, color=color, weight=BOLD)
        v_t   = Text(version, font_size=20, color=color)
        de_t  = Text(desc,    font_size=16, color=WHITE)
        row   = VGroup(d_t, v_t, de_t).arrange(RIGHT, buff=0.45)
        line  = Line(LEFT * 5.5, RIGHT * 5.5, color=color, stroke_width=0.5)\
                  .next_to(row, DOWN, buff=0.08)
        return VGroup(row, line)

    def _fee_row(self, version, fee, note, color, bdr):
        box  = RoundedRectangle(
            width=10.5, height=0.82, corner_radius=0.10,
            fill_color=bdr, fill_opacity=0.06, stroke_color=bdr, stroke_width=1.1
        )
        v_t  = Text(version, font_size=17, color=color)\
                 .move_to(box).align_to(box, LEFT).shift(RIGHT * 0.25)
        f_t  = Text(fee,     font_size=17, color=WHITE)\
                 .move_to(box)
        n_t  = Text(note,    font_size=15, color=GRAY)\
                 .move_to(box).align_to(box, RIGHT).shift(LEFT * 0.25)
        return VGroup(box, v_t, f_t, n_t)

    def _sources_box(self, sources):
        lines = [Text(s, font_size=13, color=GRAY) for s in sources]
        group = VGroup(*lines).arrange(DOWN, buff=0.10, aligned_edge=LEFT)
        box   = SurroundingRectangle(group, color=GRAY, buff=0.14, corner_radius=0.10)
        return VGroup(box, group).to_edge(DOWN, buff=0.22)
