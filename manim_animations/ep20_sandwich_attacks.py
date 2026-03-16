"""
QuantiFire EP20 — Sandwich Attacks: How Bots Front-Run Your Every Trade
Run: manim -pql ep20_sandwich_attacks.py SandwichScene
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

class SandwichScene(VoiceoverScene):
    def construct(self):
        self.camera.background_color = BG
        self.set_speech_service(GTTSService(lang="en"))
        # PRODUCTION: self.set_speech_service(ElevenLabsService(voice_id="pNInz6obpgDQGcFmaJgB", model="eleven_turbo_v2"))

        title = Text("Sandwich Attacks: Front-Running Your Trade", font_size=36, color=GOLD)\
                  .to_edge(UP)

        # ── Hook ───────────────────────────────────────────────────────────────
        with self.voiceover(
            "You submit a swap: 1 ETH for USDC, 1% slippage tolerance. Before your transaction "
            "is included, a bot sees it in the mempool. It buys ETH just before you, pushing the "
            "price up. Your trade executes at the worse price. The bot immediately sells the ETH "
            "you just pushed higher. It made money. You paid more than necessary. The whole "
            "sequence happened in three transactions in one block. That's a sandwich attack — "
            "and it's happening thousands of times per day."
        ) as tracker:
            self.play(Write(title), run_time=tracker.duration)

        # ── Context ────────────────────────────────────────────────────────────
        with self.voiceover(
            "Welcome to QuantiFire. Sandwich attacks are the most user-harmful form of MEV. "
            "Unlike arbitrage, which benefits price efficiency, or liquidations, which maintain "
            "protocol solvency, sandwich attacks are pure extraction from retail users. The math "
            "is precise and the defense is straightforward once you understand the mechanism."
        ) as tracker:
            self.wait(tracker.duration)

        # ── Three transactions timeline ────────────────────────────────────────
        timeline = Line(LEFT*5, RIGHT*5, color=GRAY, stroke_width=2).shift(DOWN*1.0)
        self.play(Create(timeline))

        tx_data = [
            (LEFT*4.0,  "TX1\nBot BUYS first\n(front-run)",    RED,   UP*1.5),
            (ORIGIN,    "TX2\nYOUR swap\n(worse price!)",       BLUE,  UP*1.5),
            (RIGHT*4.0, "TX3\nBot SELLS after\n(back-run)",     RED,   UP*1.5),
        ]

        with self.voiceover(
            "Three transactions, in order within one block. TX1 — the frontrun: the bot buys "
            "token X just before your trade. This pushes the price of X upward along the AMM "
            "curve. TX2 — your transaction executes. You receive fewer tokens than expected "
            "because the price moved against you. TX3 — the backrun: the bot immediately sells "
            "token X back. The price returns roughly to pre-sandwich levels. Bot's profit "
            "approximately equals the price impact it inflicted on your trade."
        ) as tracker:
            for pos, text, col, offset in tx_data:
                dot  = Dot(pos + DOWN*1.0, color=col, radius=0.12)
                line = DashedLine(pos + DOWN*1.0, pos + offset - DOWN*0.15 + DOWN*1.0,
                                  color=col, stroke_width=1.5)
                b    = RoundedRectangle(width=3.0, height=1.2, corner_radius=0.15,
                                        fill_color=col, fill_opacity=0.12,
                                        stroke_color=col, stroke_width=1.2)\
                         .move_to(pos + offset + UP*0.5)
                t    = Text(text, font_size=15, color=col, line_spacing=1.2)\
                         .move_to(b)
                self.play(FadeIn(dot, scale=1.4), Create(line), FadeIn(VGroup(b, t)),
                          run_time=0.7)
                self.wait(0.3)
            self.wait(tracker.duration - 4)

        # ── Price impact animation on AMM curve ───────────────────────────────
        self.play(*[FadeOut(m) for m in self.mobjects if m != title])

        axes = Axes(
            x_range=[80, 130, 10], y_range=[150000, 250000, 20000],
            x_length=8, y_length=4.5,
            axis_config={"color": GRAY}, tips=False
        ).shift(DOWN*0.3)
        x_lab = Text("ETH reserves", font_size=18, color=GRAY)\
                  .next_to(axes.x_axis.get_end(), RIGHT)
        y_lab = Text("USDC reserves", font_size=18, color=GRAY)\
                  .next_to(axes.y_axis.get_end(), UP)
        self.play(Create(axes), Write(x_lab), Write(y_lab))

        k = 100 * 200_000
        curve = axes.plot(lambda x: k/x, x_range=[81, 129, 0.5],
                          color=GOLD, stroke_width=3)
        self.play(Create(curve))

        states = [
            (100.0, "Before\nETH=$2000",       WHITE, LEFT*1.5 + UP*1.0),
            (95.0,  "After bot buy\nETH=$2,216",RED,   RIGHT*0.5 + UP*0.5),
            (93.0,  "Your fill\nETH=$2,307",    BLUE,  RIGHT*2.5 + DOWN*0.5),
        ]
        prev_dot = None

        with self.voiceover(
            "If you allow 2% slippage on a $10,000 trade, the maximum extractable sandwich "
            "profit is roughly $200 minus gas. At $5 gas on L2, this is very profitable. "
            "The bot bids up to $195 in priority fees to guarantee its transactions are ordered "
            "correctly. Average sandwich attack extracts 0.3 to 1% of the victim's trade value. "
            "Your slippage setting is the attack surface: 1% slippage on a 0.1% price impact "
            "trade leaves 0.9% extractable by sandwich bots."
        ) as tracker:
            for x, label, col, lbl_pos in states:
                y   = k/x
                dot = Dot(axes.coords_to_point(x, y), color=col, radius=0.13)
                lbl = Text(label, font_size=15, color=col, line_spacing=1.2)\
                        .next_to(dot, lbl_pos, buff=0.1)
                anims = [FadeIn(dot, scale=1.4), Write(lbl)]
                if prev_dot:
                    arr = Arrow(prev_dot.get_center(), dot.get_center(),
                                color=col, buff=0.12, stroke_width=2)
                    anims.append(GrowArrow(arr))
                self.play(*anims)
                prev_dot = dot
                self.wait(0.8)
            self.wait(tracker.duration - 4)

        # ── Profit formula & defence ───────────────────────────────────────────
        self.play(*[FadeOut(m) for m in self.mobjects if m != title])

        profit = MathTex(
            r"\text{Sandwich Profit} \approx \text{victim\_size} \times \text{slippage\_tol} - \text{gas}",
            font_size=32, color=RED
        ).shift(UP*1.0)
        self.play(Write(profit))

        defences = VGroup(
            Text("✓ Private RPC: Flashbots Protect / MEV Blocker",
                 font_size=22, color=TEAL),
            Text("✓ Tight slippage: match to actual price impact, not 1%",
                 font_size=22, color=TEAL),
            Text("✓ Use CoW Protocol — batch auction, no mempool exposure",
                 font_size=22, color=TEAL),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.28).shift(DOWN*0.8)

        with self.voiceover(
            "Set your slippage to the minimum that allows your trade to execute — match it to "
            "actual price impact, not a default 1%. Use a private RPC endpoint for any trade "
            "above $500. These two steps eliminate 95% or more of your sandwich exposure at "
            "zero cost. It takes five minutes to set up and it's the highest-ROI security action "
            "available to a DeFi user."
        ) as tracker:
            self.play(LaggedStartMap(FadeIn, defences, lag_ratio=0.3))
            self.wait(tracker.duration - 1)

        # ── CTA ────────────────────────────────────────────────────────────────
        with self.voiceover(
            "Next: the all-time hall of shame — the top 5 smart contract attack vectors that "
            "have stolen billions. From reentrancy to integer overflow to access control failures. "
            "Subscribe. QuantiFire."
        ) as tracker:
            self.play(*[FadeOut(m) for m in self.mobjects], run_time=1)
            outro = Text("QuantiFire  |  EP 20", font_size=30, color=GOLD)
            self.play(FadeIn(outro))
            self.wait(tracker.duration - 1)
