"""
QuantiFire EP18 — dYdX Perpetuals: Funding Rates and the Delta-Neutral Trade
Run: manim -pql ep18_perpetuals_funding.py PerpFundingScene
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

class PerpFundingScene(VoiceoverScene):
    def construct(self):
        self.camera.background_color = BG
        self.set_speech_service(GTTSService(lang="en"))
        # PRODUCTION: self.set_speech_service(ElevenLabsService(voice_id="pNInz6obpgDQGcFmaJgB", model="eleven_turbo_v2"))

        title = Text("Perpetuals & Delta-Neutral Yield", font_size=38, color=GOLD)\
                  .to_edge(UP)

        # ── Hook ───────────────────────────────────────────────────────────────
        with self.voiceover(
            "Traditional futures contracts expire on a fixed date. Perpetual futures — invented "
            "by BitMEX in 2016 and now dominating crypto derivatives — never expire. Instead, "
            "they use a funding rate mechanism to keep the perpetual price anchored to spot. "
            "That funding rate, paid between longs and shorts every 8 hours, is the basis of one "
            "of the most popular yield strategies in DeFi. Let's break down the math."
        ) as tracker:
            self.play(Write(title), run_time=tracker.duration)

        # ── Context ────────────────────────────────────────────────────────────
        with self.voiceover(
            "Welcome to QuantiFire. Perpetual futures are the most traded crypto instrument by "
            "volume — daily volume regularly exceeds spot markets. dYdX, GMX, Hyperliquid, and "
            "others offer on-chain perps. The funding rate mechanism is the key to understanding "
            "both the instrument's price dynamics and the yield strategy that exploits them."
        ) as tracker:
            self.wait(tracker.duration)

        # ── Funding rate mechanism ─────────────────────────────────────────────
        funding_title = Text("Funding Rate Mechanism", font_size=26, color=WHITE)\
                          .shift(UP*1.8)
        self.play(Write(funding_title))

        mech = VGroup(
            Text("Perp price > Spot  →  Longs pay Shorts  (+funding)",
                 font_size=20, color=TEAL),
            Text("Perp price < Spot  →  Shorts pay Longs  (–funding)",
                 font_size=20, color=RED),
            Text("Paid every 8 hours  |  typically ±0.01–0.10% per 8h",
                 font_size=20, color=GRAY),
        ).arrange(DOWN, buff=0.3).shift(UP*0.5)

        with self.voiceover(
            "The funding rate mechanism keeps the perpetual price close to spot. When perp price "
            "is above spot, funding is positive — longs pay shorts. When perp price is below spot, "
            "funding is negative — shorts pay longs. The magnitude is proportional to the "
            "premium or discount. Most exchanges cap this at plus or minus 0.1% per 8 hours — "
            "that's plus or minus 109.5% annualized at cap. In bull markets, positive funding "
            "rates of 0.05 to 0.1% per 8 hours — 18 to 36% annualized — are common."
        ) as tracker:
            self.play(LaggedStartMap(Write, mech, lag_ratio=0.4))
            self.wait(tracker.duration - 1)
        self.play(FadeOut(funding_title, mech))

        # ── Delta-neutral position ─────────────────────────────────────────────
        dn_title = Text("Delta-Neutral Yield Strategy", font_size=26, color=GOLD)\
                     .shift(UP*1.8)
        self.play(Write(dn_title))

        pos_table = Table(
            [["Long 1 ETH (spot)", "+1", "~4% staking APY"],
             ["Short 1 ETH (perp)", "−1", "Funding received"],
             ["Net Delta", "0", "Market neutral!"]],
            col_labels=[Text("Position", color=GOLD),
                        Text("Delta", color=GOLD),
                        Text("Yield Source", color=GOLD)],
            element_to_mobject_config={"font_size": 20},
            include_outer_lines=True,
            line_config={"color": DARK_GRAY}
        ).shift(DOWN*0.2)

        with self.voiceover(
            "The delta-neutral yield strategy: buy ETH on spot, short the same amount on a "
            "perpetual exchange. Your price exposure cancels to zero — any gain from the spot "
            "position is offset by the short, and vice versa. Your only remaining exposure is "
            "the funding rate, paid every 8 hours from longs to shorts. When the market is "
            "bullish and longs dominate, that rate is positive and you collect it. Annualized, "
            "this can reach 50% or more during bull markets — completely uncorrelated to "
            "whether ETH goes up or down."
        ) as tracker:
            self.play(Create(pos_table))
            self.wait(tracker.duration - 1)
        self.play(FadeOut(dn_title, pos_table))

        # ── Funding rate time series ───────────────────────────────────────────
        axes = Axes(
            x_range=[0, 12, 2], y_range=[-10, 80, 20],
            x_length=9, y_length=4.5,
            axis_config={"color": GRAY}, tips=False
        ).shift(DOWN*0.4)
        x_lab = Text("Month", font_size=20, color=GRAY)\
                  .next_to(axes.x_axis.get_end(), RIGHT)
        y_lab = Text("Annualised Funding (%)", font_size=20, color=GRAY)\
                  .next_to(axes.y_axis.get_end(), UP)
        self.play(Create(axes), Write(x_lab), Write(y_lab))

        months = np.linspace(0, 12, 200)
        funding = (30 + 20*np.sin(months*0.8) + 10*np.sin(months*2.1)
                   + np.random.default_rng(5).normal(0, 5, 200))
        funding = np.clip(funding, -8, 78)

        pts = [axes.coords_to_point(months[i], funding[i]) for i in range(200)]
        fund_line = VMobject(color=TEAL, stroke_width=2.5)
        fund_line.set_points_smoothly(pts)
        self.play(Create(fund_line), run_time=2)

        entry_line = DashedLine(axes.coords_to_point(0, 20), axes.coords_to_point(12, 20),
                                color=GOLD, stroke_width=1.5)
        exit_line  = DashedLine(axes.coords_to_point(0, 10), axes.coords_to_point(12, 10),
                                color=RED,  stroke_width=1.5)

        with self.voiceover(
            "Key heuristic: enter the delta-neutral trade when 30-day average funding exceeds "
            "20% annualized. Exit when 7-day average drops below 10%. Risk factors include "
            "funding rate flip — if the market turns bearish, funding goes negative and you pay "
            "instead of receiving. Historical data shows funding has been positive about 65% of "
            "the time in crypto bull cycles. Perpetual funding rate arbitrage is a genuine source "
            "of uncorrelated yield — but requires continuous monitoring and margin management."
        ) as tracker:
            self.play(Create(entry_line), Create(exit_line))
            self.play(Write(Text("Enter > 20%", font_size=16, color=GOLD)\
                              .next_to(axes.coords_to_point(11, 20), RIGHT, buff=0.1)),
                      Write(Text("Exit < 10%",  font_size=16, color=RED)\
                              .next_to(axes.coords_to_point(11, 10), RIGHT, buff=0.1)))
            self.wait(tracker.duration - 2)

        # ── CTA ────────────────────────────────────────────────────────────────
        with self.voiceover(
            "That wraps Series 2: DeFi Mechanics. Series 3 next: the risks — MEV, sandwich "
            "attacks, smart contract hacks, governance attacks. The stuff that can take your "
            "capital from 100 to zero overnight. Subscribe. QuantiFire."
        ) as tracker:
            self.play(*[FadeOut(m) for m in self.mobjects], run_time=1)
            outro = Text("QuantiFire  |  EP 18", font_size=30, color=GOLD)
            self.play(FadeIn(outro))
            self.wait(tracker.duration - 1)
