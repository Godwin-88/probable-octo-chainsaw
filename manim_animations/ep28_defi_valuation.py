"""
QuantiFire EP28 — Valuing DeFi Protocols Like a Stock: P/TVL, P/Revenue, and DCF
Run: manim -pql ep28_defi_valuation.py DeFiValuationScene
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

class DeFiValuationScene(VoiceoverScene):
    def construct(self):
        self.camera.background_color = BG
        self.set_speech_service(GTTSService(lang="en"))
        # PRODUCTION: self.set_speech_service(ElevenLabsService(voice_id="pNInz6obpgDQGcFmaJgB", model="eleven_turbo_v2"))

        title = Text("Valuing DeFi Protocols Like a Stock", font_size=38, color=GOLD)\
                  .to_edge(UP)

        # ── Hook ───────────────────────────────────────────────────────────────
        with self.voiceover(
            "The narrative that crypto is purely speculative — with no fundamental value anchor "
            "— is wrong. Every DeFi protocol generates revenue. Every one has costs. Many have "
            "discounted cash flows you can model. The same valuation frameworks that work for "
            "stocks work for DeFi protocols if you know how to translate the metrics. Today I'll "
            "show you the DeFi-native equivalents of P/E, P/B, and DCF."
        ) as tracker:
            self.play(Write(title), run_time=tracker.duration)

        # ── Context ────────────────────────────────────────────────────────────
        with self.voiceover(
            "Welcome to QuantiFire. Quantitative value investing — buying assets below fundamental "
            "value and waiting for reversion — is one of the oldest and most empirically robust "
            "investment strategies. The HML factor in Fama-French is essentially systematic value. "
            "The question is: what is fundamental value for a DeFi protocol? Let's build "
            "the framework."
        ) as tracker:
            self.wait(tracker.duration)

        # ── TradFi ↔ DeFi metric table ─────────────────────────────────────────
        with self.voiceover(
            "Every DeFi protocol has revenue from trading fees, lending spread, and liquidation "
            "fees. It has costs from token emissions and security. The TradFi-to-DeFi metric "
            "translation: Price-to-Earnings maps to fully diluted valuation over annualized "
            "revenue — that's your P/S ratio. Price-to-Book maps to FDV over TVL — total value "
            "locked is the DeFi equivalent of book value. Earnings yield maps to revenue over "
            "FDV. And growth maps to TVL and revenue growth rates. Key data sources: Token "
            "Terminal for revenue and P/S ratios, DeFiLlama for TVL, Dune Analytics for "
            "custom on-chain queries."
        ) as tracker:
            mapping = Table(
                [["P/E Ratio",   "Price / Earnings",  "FDV / Annualised Revenue"],
                 ["P/B Ratio",   "Price / Book Value", "FDV / TVL"],
                 ["Yield",       "Earnings / Price",   "Revenue / FDV"],
                 ["Growth",      "EPS Growth",         "TVL / Revenue Growth"]],
                col_labels=[
                    Text("Metric",    color=GOLD),
                    Text("TradFi",    color=BLUE),
                    Text("DeFi",      color=TEAL),
                ],
                element_to_mobject_config={"font_size": 19},
                include_outer_lines=True,
                line_config={"color": DARK_GRAY}
            ).shift(DOWN*0.1)
            self.play(Create(mapping))
            self.wait(tracker.duration - 2)
        self.play(FadeOut(mapping))

        # ── P/TVL scatter plot ─────────────────────────────────────────────────
        scatter_title = Text("FDV/TVL Valuation Map", font_size=24, color=WHITE)\
                          .shift(UP*1.8)
        self.play(Write(scatter_title))

        axes = Axes(
            x_range=[0, 2.5, 0.5], y_range=[0, 100, 20],
            x_length=7.5, y_length=4.5,
            axis_config={"color": GRAY, "include_numbers": True}, tips=False
        ).shift(DOWN*0.4)
        x_lab = Text("FDV / TVL", font_size=18, color=GRAY)\
                  .next_to(axes.x_axis.get_end(), RIGHT)
        y_lab = Text("Annualised Revenue Yield (%)", font_size=16, color=GRAY)\
                  .next_to(axes.y_axis.get_end(), UP)
        self.play(Create(axes), Write(x_lab), Write(y_lab))

        protocols = [
            ("Uniswap",  0.4,  60, TEAL),
            ("Aave",     0.6,  35, BLUE),
            ("Curve",    0.3,  55, GOLD),
            ("GMX",      1.2,  30, TEAL),
            ("Compound", 0.9,  18, BLUE),
            ("Protocol X", 2.1, 5, RED),   # overvalued
        ]

        with self.voiceover(
            "This scatter plot maps DeFi protocols by FDV over TVL on the horizontal axis against "
            "annualized revenue yield on the vertical axis. The value zone — FDV/TVL below 0.8 "
            "and revenue yield above 30% — contains Uniswap, Curve, and Aave. These are the "
            "protocols generating substantial real revenue relative to their managed assets at "
            "reasonable valuations. Protocol X at top-right — high FDV/TVL, low revenue yield — "
            "represents a speculative premium with no fundamental support. The screening criteria: "
            "P/S below 10, revenue yield above 10%, and positive revenue growth. Combine with "
            "momentum from episode 25 to get value at improving momentum — the strongest "
            "systematic signal combination in any asset class."
        ) as tracker:
            for name, fdv_tvl, rev_yield, col in protocols:
                dot = Dot(axes.coords_to_point(fdv_tvl, rev_yield), color=col, radius=0.13)
                lbl = Text(name, font_size=14, color=col)\
                        .next_to(dot, UR, buff=0.06)
                self.play(FadeIn(dot, scale=1.4), Write(lbl), run_time=0.5)

            # Value zone box
            value_zone = Rectangle(
                width=abs(axes.coords_to_point(0.8, 0)[0] - axes.coords_to_point(0, 0)[0]),
                height=abs(axes.coords_to_point(0, 80)[1] - axes.coords_to_point(0, 30)[1]),
                stroke_color=TEAL, fill_color=TEAL, fill_opacity=0.08, stroke_width=1.5
            ).move_to(axes.coords_to_point(0.4, 55))
            value_lbl = Text("VALUE ZONE\nFDV/TVL < 0.8\nYield > 30%",
                             font_size=14, color=TEAL).move_to(value_zone).shift(LEFT*0.5)
            self.play(Create(value_zone), Write(value_lbl))

            screen = Text(
                "Screen: P/S < 10 + Revenue Yield > 10% + Positive Revenue Growth",
                font_size=18, color=GOLD
            ).to_edge(DOWN, buff=0.35)
            self.play(Write(screen))
            self.wait(tracker.duration - 6)

        # ── CTA ────────────────────────────────────────────────────────────────
        with self.voiceover(
            "DeFi protocols have real fundamentals: revenue, growth, token cash flow. Build a "
            "screening model using P/S below 10 plus revenue yield above 10% plus positive "
            "revenue growth as the value filter. Combine with momentum to get value at improving "
            "momentum — the strongest systematic signal combination in any asset class. "
            "Final episode of Series 4: On-Chain Alpha Signals — the DeFi data revolution. "
            "Wallet tracking, TVL flows, liquidity migration signals, and how to build a "
            "systematic on-chain data edge. Subscribe. QuantiFire."
        ) as tracker:
            self.play(*[FadeOut(m) for m in self.mobjects], run_time=1)
            outro = Text("QuantiFire  |  EP 28", font_size=30, color=GOLD)
            self.play(FadeIn(outro))
            self.wait(tracker.duration - 1)
