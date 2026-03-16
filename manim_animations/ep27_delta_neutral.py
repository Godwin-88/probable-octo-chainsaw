"""
QuantiFire EP27 — Delta-Neutral Yield: Earn 20% APY Without Betting on Price
Run: manim -pql ep27_delta_neutral.py DeltaNeutralScene
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

class DeltaNeutralScene(VoiceoverScene):
    def construct(self):
        self.camera.background_color = BG
        self.set_speech_service(GTTSService(lang="en"))
        # PRODUCTION: self.set_speech_service(ElevenLabsService(voice_id="pNInz6obpgDQGcFmaJgB", model="eleven_turbo_v2"))

        title = Text("Delta-Neutral Yield: 20% APY, Zero Direction",
                     font_size=36, color=GOLD).to_edge(UP)

        # ── Hook ───────────────────────────────────────────────────────────────
        with self.voiceover(
            "What if you could earn 20% APY on your crypto without caring whether Bitcoin goes "
            "up, down, or sideways? No directional bet. No leverage risk. Just structured yield "
            "from a market inefficiency that has persisted since crypto derivatives markets began. "
            "This is the delta-neutral yield strategy — and it's one of the most powerful tools "
            "in the DeFi quant toolkit."
        ) as tracker:
            self.play(Write(title), run_time=tracker.duration)

        # ── Context ────────────────────────────────────────────────────────────
        with self.voiceover(
            "Welcome to QuantiFire. In episode 18 we covered perpetual futures and funding rates. "
            "Today we build the full delta-neutral yield strategy: how to structure it, how to "
            "size it, how to manage it, and how to exit gracefully when conditions change. This "
            "is a strategy that institutions have been running at scale since 2021 — now accessible "
            "to anyone with basic DeFi knowledge."
        ) as tracker:
            self.wait(tracker.duration)

        # ── Position structure diagram ─────────────────────────────────────────
        pos_title = Text("The Structure", font_size=26, color=WHITE).shift(UP*1.8)
        self.play(Write(pos_title))

        leg1 = self._pos_box("Long 1 stETH\n(Spot)",
                             "+1 Delta\n+4% Staking APY", TEAL, LEFT*3.0)
        plus = Text("+", font_size=40, color=WHITE).move_to(ORIGIN)
        leg2 = self._pos_box("Short 1 ETH\n(Perp)",
                             "-1 Delta\n+Funding Received", BLUE, RIGHT*3.0)

        with self.voiceover(
            "The core structure: position one — long 1 ETH spot, or stETH for additional staking "
            "yield. Position two — short 1 ETH perpetual on a derivatives exchange like dYdX, "
            "Hyperliquid, or GMX. Net delta equals plus 1 from spot plus minus 1 from short equals "
            "zero. Zero price sensitivity. Net yield equals the staking yield — approximately 4% "
            "APY from stETH — plus the funding rate paid by longs to shorts. You are short, so "
            "you receive. At 0.05% per 8 hours: 54.75% APY on the ETH collateral. During bull "
            "markets with high leverage demand, funding rates of 20 to 60% annualized are common."
        ) as tracker:
            self.play(FadeIn(leg1, scale=0.9), Write(plus), FadeIn(leg2, scale=0.9))
            self.wait(0.8)
            net = Text("Net Delta = 0  →  Price Neutral", font_size=26, color=GOLD)\
                    .shift(DOWN*1.3)
            net_box = SurroundingRectangle(net, color=GOLD, buff=0.2, corner_radius=0.12)
            self.play(Create(net_box), Write(net))
            self.wait(tracker.duration - 4)

        self.play(*[FadeOut(m) for m in self.mobjects if m != title])

        # ── Yield stack bar ────────────────────────────────────────────────────
        yield_title = Text("Annual Yield Stack", font_size=26, color=WHITE).shift(UP*1.8)
        self.play(Write(yield_title))

        axes = Axes(
            x_range=[0, 2, 1], y_range=[0, 60, 10],
            x_length=4, y_length=5,
            axis_config={"color": GRAY, "include_numbers": True}, tips=False
        ).shift(LEFT*1.0 + DOWN*0.3)
        y_lab = Text("APY (%)", font_size=18, color=GRAY)\
                  .next_to(axes.y_axis.get_end(), UP)
        self.play(Create(axes), Write(y_lab))

        with self.voiceover(
            "The yield stack: ETH staking via stETH contributes approximately 4% APY as the "
            "base. The funding rate on the short perpetual adds the variable component — roughly "
            "30% annualized in normal bull market conditions. Combined: approximately 34% APY "
            "with zero directional exposure. The risks are manageable: funding rate inversion "
            "means you pay instead of receive — exit when 7-day average drops below zero. "
            "Exchange counterparty risk means the perp exchange holds your margin — never more "
            "than 30% of portfolio on a single derivatives platform. stETH to ETH depeg risk "
            "is small and historically temporary."
        ) as tracker:
            cumulative = 0
            for height, col, lbl in [(4, BLUE, "Staking\n4%"),
                                     (30, GOLD, "Funding\n30%")]:
                x0 = axes.coords_to_point(0.5, cumulative)
                x1 = axes.coords_to_point(0.5, cumulative+height)
                bar = Rectangle(
                    width=abs(axes.coords_to_point(1.5, 0)[0] - axes.coords_to_point(0.5, 0)[0]),
                    height=abs(x1[1]-x0[1]),
                    fill_color=col, fill_opacity=0.85, stroke_width=0
                ).move_to([(x0[0]+axes.coords_to_point(1.5,0)[0])/2, (x0[1]+x1[1])/2, 0])
                lbl_t = Text(lbl, font_size=16, color=col).next_to(bar, RIGHT, buff=0.15)
                self.play(FadeIn(bar), Write(lbl_t), run_time=0.8)
                cumulative += height

            total = Text("Total: ~34% APY", font_size=22, color=GOLD)\
                      .next_to(axes.coords_to_point(1, 36), UP, buff=0.1)
            self.play(Write(total))

            # Risk factors
            risks = VGroup(
                Text("Funding rate can go negative → exit strategy needed", font_size=18, color=RED),
                Text("Exchange counterparty risk on derivatives position",   font_size=18, color=RED),
                Text("stETH/ETH depeg risk (small, temporary)",             font_size=18, color=GOLD),
            ).arrange(DOWN, aligned_edge=LEFT, buff=0.2)\
             .to_corner(UR).shift(LEFT*0.2 + DOWN*0.5)
            self.play(LaggedStartMap(Write, risks, lag_ratio=0.3))
            self.wait(tracker.duration - 5)

        # ── CTA ────────────────────────────────────────────────────────────────
        with self.voiceover(
            "Delta-neutral yield is a genuine market-neutral strategy with meaningful return "
            "potential. The risk is exchange counterparty risk and funding rate regime change — "
            "both manageable with position limits and monitoring. Use it as one component of a "
            "diversified yield portfolio: 20 to 30% of DeFi yield allocation maximum. Complement "
            "with stablecoin lending on Aave or Compound for the remainder. "
            "Next: Quantitative Value in DeFi — how to apply price-to-earnings, price-to-book, "
            "and DCF frameworks to DeFi protocols using on-chain revenue and TVL data. "
            "Subscribe. QuantiFire."
        ) as tracker:
            self.play(*[FadeOut(m) for m in self.mobjects], run_time=1)
            outro = Text("QuantiFire  |  EP 27", font_size=30, color=GOLD)
            self.play(FadeIn(outro))
            self.wait(tracker.duration - 1)

    def _pos_box(self, title, details, color, pos):
        box  = RoundedRectangle(width=3.2, height=2.2, corner_radius=0.18,
                                fill_color=color, fill_opacity=0.1,
                                stroke_color=color, stroke_width=1.5).move_to(pos)
        t_t  = Text(title,   font_size=20, color=color, line_spacing=1.2)\
                 .move_to(box).shift(UP*0.4)
        d_t  = Text(details, font_size=16, color=WHITE, line_spacing=1.2)\
                 .move_to(box).shift(DOWN*0.3)
        return VGroup(box, t_t, d_t)
