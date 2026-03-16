"""
QuantiFire EP17 — Chainlink Oracles: The Price Feed DeFi Runs On
Run: manim -pql ep17_chainlink_oracles.py ChainlinkScene
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

class ChainlinkScene(VoiceoverScene):
    def construct(self):
        self.camera.background_color = BG
        self.set_speech_service(GTTSService(lang="en"))
        # PRODUCTION: self.set_speech_service(ElevenLabsService(voice_id="pNInz6obpgDQGcFmaJgB", model="eleven_turbo_v2"))

        title = Text("Chainlink Oracles: The Bridge to Reality", font_size=38, color=GOLD)\
                  .to_edge(UP)

        # ── Hook ───────────────────────────────────────────────────────────────
        with self.voiceover(
            "A smart contract is completely isolated from the outside world. It can't see what ETH "
            "costs on Coinbase. It can't access interest rates, stock prices, or weather data. "
            "Without external data, lending protocols can't calculate collateral values, options "
            "protocols can't settle, prediction markets can't resolve. The oracle problem is "
            "DeFi's most critical infrastructure challenge — and Chainlink is the dominant solution."
        ) as tracker:
            self.play(Write(title), run_time=tracker.duration)

        # ── Context ────────────────────────────────────────────────────────────
        with self.voiceover(
            "Welcome to QuantiFire. Chainlink is a decentralized oracle network that aggregates "
            "data from multiple sources and delivers it on-chain with cryptographic security "
            "guarantees. It powers over $75 billion in DeFi TVL across hundreds of protocols. "
            "Understanding how it works — and where it can fail — is essential for any DeFi "
            "participant or builder."
        ) as tracker:
            self.wait(tracker.duration)

        # ── Oracle problem statement ───────────────────────────────────────────
        problem = Text(
            '"Smart contracts cannot see\noutside the blockchain"',
            font_size=28, color=WHITE, line_spacing=1.3
        ).shift(UP*1.5)
        self.play(Write(problem))
        self.wait(1)
        self.play(FadeOut(problem))

        # ── Chainlink architecture ─────────────────────────────────────────────
        def box(text, color, pos):
            b = RoundedRectangle(width=2.8, height=1.0, corner_radius=0.15,
                                 fill_color=color, fill_opacity=0.12,
                                 stroke_color=color, stroke_width=1.5).move_to(pos)
            t = Text(text, font_size=18, color=color, line_spacing=1.2).move_to(pos)
            return VGroup(b, t)

        sources = VGroup(
            box("Kaiko", BLUE,  LEFT*5.5 + UP*1.6),
            box("CoinGecko", BLUE, LEFT*5.5 + UP*0.3),
            box("Brave New Coin", BLUE, LEFT*5.5 + DOWN*1.0),
        )
        nodes = VGroup(
            box("Node 1", GOLD, LEFT*1.5 + UP*1.6),
            box("Node 2", GOLD, LEFT*1.5 + UP*0.3),
            box("...", GOLD, LEFT*1.5 + DOWN*0.5),
            box("Node 31", GOLD, LEFT*1.5 + DOWN*1.8),
        )
        agg = box("On-Chain\nAggregator\n(Median)", TEAL, RIGHT*2.5 + DOWN*0.1)
        defi = box("DeFi\nProtocols", TEAL, RIGHT*5.5 + DOWN*0.1)

        src_lbl  = Text("Data\nSources", font_size=18, color=BLUE).next_to(sources, UP, buff=0.1)
        node_lbl = Text("Node\nOperators", font_size=18, color=GOLD).next_to(nodes, UP, buff=0.1)
        agg_lbl  = Text("Aggregation", font_size=18, color=TEAL).next_to(agg, UP, buff=0.1)

        with self.voiceover(
            "Chainlink's architecture: multiple off-chain premium data providers each provide "
            "price data independently. A network of independent node operators — typically 7 to "
            "31 per feed — each independently query the data sources, aggregate them, and sign "
            "the result. An on-chain aggregator collects responses from all nodes, removes "
            "outliers, and reports the median on-chain. To corrupt a Chainlink feed, an attacker "
            "must corrupt a majority of node operators simultaneously — prohibitively expensive."
        ) as tracker:
            self.play(LaggedStartMap(FadeIn, sources, lag_ratio=0.2), Write(src_lbl))
            for s, n in [(sources[0], nodes[0]), (sources[1], nodes[1]), (sources[2], nodes[3])]:
                self.play(GrowArrow(Arrow(s.get_right(), n.get_left(), color=GRAY,
                                         buff=0.05, stroke_width=1.5)), run_time=0.3)
            self.play(LaggedStartMap(FadeIn, nodes, lag_ratio=0.15), Write(node_lbl))
            for n in [nodes[0], nodes[1], nodes[3]]:
                self.play(GrowArrow(Arrow(n.get_right(), agg.get_left(), color=GRAY,
                                         buff=0.05, stroke_width=1.5)), run_time=0.25)
            self.play(FadeIn(agg), Write(agg_lbl))
            self.play(GrowArrow(Arrow(agg.get_right(), defi.get_left(),
                                      color=TEAL, buff=0.05, stroke_width=2)))
            self.play(FadeIn(defi))
            self.wait(tracker.duration - 8)

        # ── Update conditions ──────────────────────────────────────────────────
        self.play(*[FadeOut(m) for m in self.mobjects if m != title])

        conditions = VGroup(
            self._cond("Deviation Trigger",
                       "Price moves >0.5% from last on-chain value", GOLD),
            self._cond("Heartbeat",
                       "No update in 1 hour  →  force update",       BLUE),
        ).arrange(DOWN, buff=0.5).shift(UP*0.5)

        best_practice = Text(
            "Best Practice: Chainlink (primary) + Uniswap TWAP (circuit breaker)",
            font_size=20, color=TEAL
        ).to_edge(DOWN, buff=0.5)
        best_box = SurroundingRectangle(best_practice, color=TEAL, buff=0.15, corner_radius=0.1)

        with self.voiceover(
            "The price is updated on-chain when price moves more than 0.5% from the last on-chain "
            "value — the deviation trigger — or when a heartbeat interval of typically 1 hour "
            "has passed. Current best practice: use Chainlink as the primary feed with a Uniswap "
            "TWAP as a circuit breaker. If Chainlink deviates from TWAP by more than 5%, halt "
            "the protocol and require manual intervention. Every DeFi protocol you interact with "
            "depends on oracle accuracy. Before using any protocol, check what oracle it uses "
            "and how many nodes back the feed."
        ) as tracker:
            self.play(LaggedStartMap(FadeIn, conditions, lag_ratio=0.4))
            self.play(Create(best_box), Write(best_practice))
            self.wait(tracker.duration - 3)

        # ── CTA ────────────────────────────────────────────────────────────────
        with self.voiceover(
            "Final episode of Series 2: dYdX Perpetuals — how perpetual futures work, what "
            "funding rates are, and how the funding rate arbitrage trade generates yield in all "
            "market conditions. Subscribe. QuantiFire."
        ) as tracker:
            self.play(*[FadeOut(m) for m in self.mobjects], run_time=1)
            outro = Text("QuantiFire  |  EP 17", font_size=30, color=GOLD)
            self.play(FadeIn(outro))
            self.wait(tracker.duration - 1)

    def _cond(self, title, desc, color):
        box  = RoundedRectangle(width=9, height=1.2, corner_radius=0.15,
                                fill_color=color, fill_opacity=0.08,
                                stroke_color=color, stroke_width=1.5)
        t_t  = Text(title, font_size=22, color=color).move_to(box).shift(LEFT*2.5)
        d_t  = Text(desc,  font_size=18, color=WHITE).move_to(box).shift(RIGHT*1.5)
        return VGroup(box, t_t, d_t)
