"""
QuantiFire EP29 — On-Chain Alpha: The DeFi Data Revolution
Run: manim -pql ep29_onchain_alpha.py OnChainAlphaScene
Audio: AI voiceover via manim-voiceover
"""
from manim import *
from manim_voiceover import VoiceoverScene
from manim_voiceover.services.gtts import GTTSService
# PRODUCTION: from manim_voiceover.services.elevenlabs import ElevenLabsService

GOLD = "#FFB700"
TEAL = "#00C896"
RED  = "#FF4444"
BLUE = "#4A90E2"
BG   = "#0D0D0D"

class OnChainAlphaScene(VoiceoverScene):
    def construct(self):
        self.camera.background_color = BG
        self.set_speech_service(GTTSService(lang="en"))
        # PRODUCTION: self.set_speech_service(ElevenLabsService(voice_id="pNInz6obpgDQGcFmaJgB", model="eleven_turbo_v2"))

        title = Text("On-Chain Alpha: The Data Revolution", font_size=38, color=GOLD)\
                  .to_edge(UP)

        # ── Hook ───────────────────────────────────────────────────────────────
        with self.voiceover(
            "In traditional finance, alternative data — satellite imagery of parking lots, credit "
            "card transaction flows, shipping container counts — sells for millions of dollars per "
            "year because it gives an edge on earnings before reports. In DeFi, an entire layer "
            "of financial data that dwarfs traditional alternative data is publicly available, "
            "on-chain, for free. Real-time positions, flows, liquidations, governance votes, "
            "smart contract interactions. The quants who learn to read this data have an edge "
            "unlike anything available in traditional markets."
        ) as tracker:
            self.play(Write(title), run_time=tracker.duration)

        # ── Context ────────────────────────────────────────────────────────────
        with self.voiceover(
            "Welcome to QuantiFire. On-chain alpha generation is the frontier of quantitative "
            "finance. This episode maps the data landscape, explains the key signals, and shows "
            "you how to build a systematic on-chain factor model. This is the raw material behind "
            "QuantiNova's AI Core — translated into actionable signals for every user."
        ) as tracker:
            self.wait(tracker.duration)

        # ── Data pipeline flow ─────────────────────────────────────────────────
        pipeline = [
            ("Ethereum\nBlockchain",           BLUE),
            ("Raw Events\n(swaps, borrows)",   GRAY),
            ("On-Chain\nSignals",              TEAL),
            ("Factor\nModel Score",            GOLD),
            ("Portfolio\nDecision",            TEAL),
        ]

        boxes = VGroup()
        for i, (label, col) in enumerate(pipeline):
            b = RoundedRectangle(width=2.2, height=1.2, corner_radius=0.15,
                                 fill_color=col, fill_opacity=0.12,
                                 stroke_color=col, stroke_width=1.5)
            t = Text(label, font_size=16, color=col, line_spacing=1.2).move_to(b)
            boxes.add(VGroup(b, t))

        boxes.arrange(RIGHT, buff=0.25).shift(DOWN*1.5)

        with self.voiceover(
            "The pipeline: every Ethereum transaction is permanently recorded and queryable. "
            "Raw events — DEX trades, lending deposits, liquidations — are indexed and processed "
            "into on-chain signals. Those signals feed a factor model that scores each protocol. "
            "The score drives portfolio decisions. Every Ethereum transaction is public, permanent, "
            "and structured. Key data categories: DEX trade data from every Uniswap and Curve "
            "pool, lending protocol events, TVL flows computed from on-chain events in real time, "
            "governance activity, wallet clustering, and bridge flows that precede TVL changes "
            "by hours."
        ) as tracker:
            self.play(LaggedStartMap(FadeIn, boxes, lag_ratio=0.2))
            for i in range(len(pipeline)-1):
                a = Arrow(boxes[i].get_right(), boxes[i+1].get_left(),
                          color=GRAY, buff=0.05, stroke_width=1.5)
                self.play(GrowArrow(a), run_time=0.35)
            self.wait(tracker.duration - 4)

        # ── Five signals ───────────────────────────────────────────────────────
        self.play(*[FadeOut(m) for m in self.mobjects if m != title])

        signals_title = Text("5 On-Chain Alpha Signals", font_size=26, color=WHITE)\
                          .shift(UP*1.8)
        self.play(Write(signals_title))

        signals = VGroup(
            self._sig("Whale Accumulation",
                      "7-day net flow from wallets >$500K", GOLD),
            self._sig("TVL Migration Velocity",
                      "24h/7d TVL inflow/outflow per protocol", TEAL),
            self._sig("Liquidation Proximity Map",
                      "Collateral liquidatable at each price level", RED),
            self._sig("Revenue Acceleration",
                      "7d run-rate vs 30d average fee revenue", BLUE),
            self._sig("Holder Concentration (HHI)",
                      "Herfindahl index of token ownership",   GRAY),
        ).arrange(DOWN, buff=0.25).shift(DOWN*0.2)

        with self.voiceover(
            "Five on-chain alpha signals. Signal one: whale accumulation — track wallets with "
            "over $500,000 in historical activity. When multiple large wallets accumulate a "
            "governance token, it often precedes announcement-driven price moves. This is the "
            "on-chain equivalent of institutional fund flow data. Signal two: TVL migration "
            "velocity — capital flows between protocols at measurable velocity. The migration "
            "signal appears on-chain 1 to 3 days before it registers on DeFiLlama dashboards. "
            "Signal three: liquidation proximity map — how much collateral becomes liquidatable "
            "at each price level. Use it as a support and resistance indicator with quantified "
            "dollar magnitude. Signal four: revenue acceleration — protocols with 7-day run-rate "
            "greater than 1.5 times the 30-day average are experiencing genuine demand "
            "acceleration. Signal five: holder concentration using the Herfindahl-Hirschman "
            "Index — low HHI means distributed ownership, low dump risk."
        ) as tracker:
            self.play(LaggedStartMap(FadeIn, signals, lag_ratio=0.2))
            self.wait(tracker.duration - 2)

        # ── Composite score formula ────────────────────────────────────────────
        self.play(*[FadeOut(m) for m in self.mobjects if m != title])

        with self.voiceover(
            "Combine signals into a multi-factor score: weight-one times the rank of whale "
            "accumulation, plus weight-two times TVL migration, plus weight-three times revenue "
            "acceleration, plus weight-four times negative HHI change — lower concentration is "
            "better — plus weight-five times liquidation buffer. Apply this score monthly to the "
            "DeFiLlama top-100 universe. Long top quartile, underweight bottom quartile. "
            "Tools: Dune Analytics for free SQL on historical data, TheGraph for real-time "
            "GraphQL, Nansen for pre-computed wallet labels and flow analytics, Flipside Crypto "
            "for free SQL access."
        ) as tracker:
            factor_form = MathTex(
                r"\text{Score}_i = \sum_j w_j \cdot \text{Rank}(\text{Signal}_{ij})",
                font_size=38, color=WHITE
            ).shift(UP*1.0)
            self.play(Write(factor_form))

            tools = VGroup(
                Text("Dune Analytics  — free SQL on-chain data",  font_size=20, color=BLUE),
                Text("TheGraph       — real-time GraphQL API",     font_size=20, color=TEAL),
                Text("Nansen         — wallet labeling + flows",   font_size=20, color=GOLD),
                Text("DeFiLlama      — TVL, revenue, protocol",    font_size=20, color=TEAL),
            ).arrange(DOWN, aligned_edge=LEFT, buff=0.25).shift(DOWN*0.8)
            self.play(LaggedStartMap(FadeIn, tools, lag_ratio=0.3))
            self.wait(tracker.duration - 3)

        # ── CTA ────────────────────────────────────────────────────────────────
        with self.voiceover(
            "On-chain data is the most information-dense, legally accessible alternative data "
            "source in the history of finance. The tools to analyze it are largely free. The "
            "barrier is skills and time, not access. Start with one signal — TVL migration "
            "velocity — implement it in Python with the DeFiLlama API, and backtest against "
            "token returns over 12 months. That's your first on-chain alpha model. "
            "Series 4 complete. Series 5 next: Crypto and Blockchain Fundamentals — from ECDSA "
            "cryptography to the EVM gas model to consensus mechanisms. The technical foundations "
            "that everything else is built on. Subscribe. QuantiFire."
        ) as tracker:
            self.play(*[FadeOut(m) for m in self.mobjects], run_time=1)
            outro = Text("QuantiFire  |  EP 29", font_size=30, color=GOLD)
            self.play(FadeIn(outro))
            self.wait(tracker.duration - 1)

    def _sig(self, name, desc, color):
        box  = RoundedRectangle(width=9.5, height=0.9, corner_radius=0.12,
                                fill_color=color, fill_opacity=0.08,
                                stroke_color=color, stroke_width=1.2)
        nm   = Text(name, font_size=18, color=color).move_to(box).shift(LEFT*2.8)
        d    = Text(desc, font_size=15, color=WHITE).move_to(box).shift(RIGHT*1.8)
        return VGroup(box, nm, d)
