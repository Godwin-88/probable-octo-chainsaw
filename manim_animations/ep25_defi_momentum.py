"""
QuantiFire EP25 — Momentum Trading in DeFi: TVL, Token Price, and Revenue Signals
Run: manim -pql ep25_defi_momentum.py DeFiMomentumScene
Audio: AI voiceover via manim-voiceover
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
BG   = "#0D0D0D"

class DeFiMomentumScene(VoiceoverScene):
    def construct(self):
        self.camera.background_color = BG
        self.set_speech_service(GTTSService(lang="en"))
        # PRODUCTION: self.set_speech_service(ElevenLabsService(voice_id="pNInz6obpgDQGcFmaJgB", model="eleven_turbo_v2"))

        title = Text("Momentum Trading in DeFi", font_size=42, color=GOLD).to_edge(UP)

        # ── Hook ───────────────────────────────────────────────────────────────
        with self.voiceover(
            "The momentum anomaly — past winners outperform future losers — has been documented "
            "in stocks, bonds, commodities, and currencies for over 200 years. DeFi protocols are "
            "just assets. They have prices. They have adoption metrics. They have revenue. Every "
            "factor that creates momentum in traditional markets creates momentum in DeFi. Today "
            "I'll show you how to build a quant momentum system for on-chain markets using data "
            "that didn't even exist five years ago."
        ) as tracker:
            self.play(Write(title), run_time=tracker.duration)

        # ── Context ────────────────────────────────────────────────────────────
        with self.voiceover(
            "Welcome to QuantiFire. Series 4 is about bridging the quantitative finance toolkit "
            "from traditional markets into DeFi. We're taking proven systematic strategies and "
            "rebuilding them with on-chain data. Momentum is the natural starting point because "
            "it's the most robust factor across all asset classes and the on-chain data quality "
            "is now sufficient to implement it rigorously."
        ) as tracker:
            self.wait(tracker.duration)

        # ── Three on-chain signals ─────────────────────────────────────────────
        signals = VGroup(
            self._signal_card("Token Price\nMomentum",
                              "12-1 month trailing return\nRank & go long top decile",
                              "CoinGecko API", BLUE),
            self._signal_card("TVL\nMomentum",
                              "30-day TVL growth rate\nProtocols gaining capital",
                              "DeFiLlama API", TEAL),
            self._signal_card("Revenue\nMomentum",
                              "90-day fee acceleration\nGenuine product-market fit",
                              "Token Terminal", GOLD),
        ).arrange(RIGHT, buff=0.35).shift(UP*0.5)

        with self.voiceover(
            "Three DeFi momentum signals. Signal one: token price momentum — identical to TradFi "
            "momentum. Compute the trailing 12-month return for each governance token, skip the "
            "last month, rank protocols. Signal two: TVL momentum — total value locked is the DeFi "
            "equivalent of assets under management. Compute the 30-day TVL growth rate from the "
            "DeFiLlama API. High TVL growth protocols attract more capital in a reflexive process "
            "that creates persistence. Signal three: revenue momentum — protocol fee revenue is "
            "the DeFi equivalent of earnings. Growing revenue signals genuine product-market fit "
            "rather than mercenary incentive farming. Use the 90-day revenue acceleration from "
            "Token Terminal."
        ) as tracker:
            self.play(LaggedStartMap(FadeIn, signals, lag_ratio=0.3))
            self.wait(0.5)
            # Composite formula
            composite = MathTex(
                r"\text{Score}_i = \frac{1}{3}\left[\text{Rank}(P_{mom}) + \text{Rank}(TVL_{mom}) + \text{Rank}(Rev_{mom})\right]",
                font_size=28, color=WHITE
            ).to_edge(DOWN, buff=1.5)
            self.play(Write(composite))
            self.wait(tracker.duration - 4)

        self.play(*[FadeOut(m) for m in self.mobjects if m != title])

        # ── TVL bar race chart (animated) ──────────────────────────────────────
        race_title = Text("30-day TVL Growth — Protocol Ranking", font_size=24, color=WHITE)\
                      .shift(UP*1.8)
        self.play(Write(race_title))

        protocols = ["Aave", "Uniswap", "Curve", "Lido", "GMX", "Pendle"]
        tvl_t0    = np.array([0.30, 0.55, 0.40, 0.80, 0.25, 0.15])
        tvl_t1    = np.array([0.42, 0.70, 0.35, 0.95, 0.55, 0.65])
        colors    = [BLUE, TEAL, GOLD, RED, BLUE, TEAL]

        axes = Axes(
            x_range=[0, 1.1, 0.2], y_range=[-0.5, 5.5, 1],
            x_length=8, y_length=5,
            axis_config={"color": GRAY, "include_numbers": False}, tips=False
        ).shift(DOWN*0.3)
        self.play(Create(axes))

        bars = {}
        lbls = {}
        for i, (prot, val0, col) in enumerate(zip(protocols, tvl_t0, colors)):
            x0 = axes.coords_to_point(0, i)
            x1 = axes.coords_to_point(val0, i)
            bar = Rectangle(
                width=abs(x1[0]-x0[0]), height=0.5,
                fill_color=col, fill_opacity=0.8, stroke_width=0
            ).move_to([(x0[0]+x1[0])/2, x0[1], 0])
            lbl = Text(prot, font_size=18, color=col)\
                    .next_to(axes.coords_to_point(0, i), LEFT, buff=0.1)
            bars[prot] = bar
            lbls[prot] = lbl
            self.play(FadeIn(bar), Write(lbl), run_time=0.4)

        with self.voiceover(
            "This bar chart shows 30-day TVL growth across six major DeFi protocols. Watch the "
            "momentum winners pull ahead. Lido and Pendle show the strongest TVL acceleration — "
            "momentum signal says long. Curve is losing TVL — momentum signal says underweight. "
            "Combine all three signals into a composite score with equal weights as a starting "
            "point, then optimize. The composite reduces reliance on any single noisy data series. "
            "Use volatility-scaled position sizing — higher volatility protocols get smaller "
            "positions for the same signal strength. Rebalance monthly. Universe: top 100 "
            "protocols by TVL on DeFiLlama."
        ) as tracker:
            self.wait(0.8)
            # Animate to t1 (momentum winners grow, losers shrink)
            self.play(*[
                bars[prot].animate.stretch_to_fit_width(
                    abs(axes.coords_to_point(tvl_t1[i], 0)[0] - axes.coords_to_point(0, 0)[0])
                ).move_to([
                    (axes.coords_to_point(0, i)[0] + axes.coords_to_point(tvl_t1[i], i)[0])/2,
                    axes.coords_to_point(0, i)[1], 0
                ])
                for i, prot in enumerate(protocols)
            ], run_time=2)

            top_label = Text("TOP MOMENTUM\n→ LONG", font_size=18, color=TEAL)\
                          .next_to(axes.coords_to_point(1.0, 5), UR, buff=0.1)
            self.play(Write(top_label))
            self.wait(tracker.duration - 4)

        # ── CTA ────────────────────────────────────────────────────────────────
        with self.voiceover(
            "DeFi momentum is real but requires discipline: use composite signals combining price, "
            "TVL, and revenue, volatility-scale positions, apply skip periods to avoid reversal "
            "contamination, and limit your universe to liquid protocols. This is a monthly-rebalance "
            "systematic strategy — not a day-trading system. "
            "Next: Statistical Arbitrage across DEXes — how to run a systematic cross-DEX spread "
            "strategy using the same cointegration framework quants use in equity pairs trading. "
            "Subscribe. QuantiFire."
        ) as tracker:
            self.play(*[FadeOut(m) for m in self.mobjects], run_time=1)
            outro = Text("QuantiFire  |  EP 25", font_size=30, color=GOLD)
            self.play(FadeIn(outro))
            self.wait(tracker.duration - 1)

    def _signal_card(self, name, desc, source, color):
        box  = RoundedRectangle(width=3.5, height=3.0, corner_radius=0.18,
                                fill_color=color, fill_opacity=0.08,
                                stroke_color=color, stroke_width=1.5)
        nm   = Text(name,   font_size=20, color=color, line_spacing=1.2)\
                 .move_to(box).shift(UP*0.8)
        d    = Text(desc,   font_size=15, color=WHITE, line_spacing=1.2)\
                 .move_to(box)
        src  = Text(f"Data: {source}", font_size=13, color=GRAY)\
                 .move_to(box).shift(DOWN*0.9)
        return VGroup(box, nm, d, src)
