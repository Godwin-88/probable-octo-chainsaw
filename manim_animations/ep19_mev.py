"""
QuantiFire EP19 — MEV: The Invisible Tax on Every Crypto Trade
Run: manim -pql ep19_mev.py MEVScene
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

class MEVScene(VoiceoverScene):
    def construct(self):
        self.camera.background_color = BG
        self.set_speech_service(GTTSService(lang="en"))
        # PRODUCTION: self.set_speech_service(ElevenLabsService(voice_id="pNInz6obpgDQGcFmaJgB", model="eleven_turbo_v2"))

        title = Text("MEV: The Invisible Tax on Every Trade", font_size=38, color=GOLD)\
                  .to_edge(UP)

        # ── Hook ───────────────────────────────────────────────────────────────
        with self.voiceover(
            "Every time you make a swap on a DEX, there's a good chance a bot saw your transaction "
            "in the mempool before it was included in a block, calculated that it could profit from "
            "your trade, inserted its own transaction before yours to move the price, let your trade "
            "execute at the worse price, then sold immediately after. You paid more than you had to, "
            "and the bot pocketed the difference. This is MEV — Maximal Extractable Value — and it "
            "extracts over $1 billion from users every year."
        ) as tracker:
            self.play(Write(title), run_time=tracker.duration)

        # ── Context ────────────────────────────────────────────────────────────
        with self.voiceover(
            "Welcome to QuantiFire. MEV is money that validators or block producers can extract "
            "by reordering, inserting, or censoring transactions within a block. Originally called "
            "Miner Extractable Value in proof-of-work, it's now called Maximal Extractable Value. "
            "Understanding MEV tells you why your swaps get worse execution than you expect, and "
            "what you can do about it."
        ) as tracker:
            self.wait(tracker.duration)

        # ── Mempool visual ─────────────────────────────────────────────────────
        mempool_label = Text("PUBLIC MEMPOOL", font_size=22, color=GRAY)\
                          .shift(LEFT*3.5 + UP*1.5)
        mempool_box = RoundedRectangle(width=4.5, height=4, corner_radius=0.2,
                                       stroke_color=GRAY, fill_opacity=0,
                                       stroke_width=1.5).shift(LEFT*3.0 + DOWN*0.2)
        self.play(Create(mempool_box), Write(mempool_label))

        txs = [
            ("Alice: swap 5 ETH → USDC\nslippage=1%", BLUE,   UP*1.0),
            ("Bob: swap 2 ETH → DAI\nslippage=0.5%",  TEAL,  ORIGIN),
            ("MEV Bot: watching...",                    RED,   DOWN*1.0),
        ]
        tx_mobs = VGroup()
        for text, col, shift in txs:
            b = RoundedRectangle(width=4.0, height=0.9, corner_radius=0.12,
                                 fill_color=col, fill_opacity=0.12,
                                 stroke_color=col, stroke_width=1)\
                  .move_to(LEFT*3.0 + shift)
            t = Text(text, font_size=14, color=col, line_spacing=1.2)\
                  .move_to(b)
            tx_mobs.add(VGroup(b, t))

        with self.voiceover(
            "The mempool: Ethereum transactions don't go directly into blocks. They sit in the "
            "public mempool — a shared waiting room visible to everyone. Every transaction you "
            "submit shows the world what tokens you're swapping, what slippage you'll tolerate, "
            "your exact transaction parameters. MEV bots scan this in real time."
        ) as tracker:
            self.play(LaggedStartMap(FadeIn, tx_mobs, lag_ratio=0.4))
            self.wait(tracker.duration - 1)

        # ── Block inclusion order ──────────────────────────────────────────────
        block_label = Text("NEXT BLOCK\n(ordered by MEV builder)", font_size=20, color=GOLD)\
                        .shift(RIGHT*3.5 + UP*1.5)
        block_box   = RoundedRectangle(width=4, height=4.5, corner_radius=0.2,
                                       stroke_color=GOLD, fill_opacity=0,
                                       stroke_width=1.5).shift(RIGHT*3.0 + DOWN*0.3)
        self.play(Create(block_box), Write(block_label))

        ordered = [
            ("TX1: MEV frontrun\nbuy ETH cheap", RED,  UP*1.5),
            ("TX2: Alice's swap\n(worse price!)", BLUE, UP*0.3),
            ("TX3: MEV backrun\nsell ETH profit", RED,  DOWN*0.9),
            ("TX4: Bob's swap",                  TEAL,  DOWN*2.1),
        ]
        for text, col, shift in ordered:
            b = RoundedRectangle(width=3.6, height=0.85, corner_radius=0.12,
                                 fill_color=col, fill_opacity=0.12,
                                 stroke_color=col, stroke_width=1)\
                  .move_to(RIGHT*3.0 + shift)
            t = Text(text, font_size=13, color=col, line_spacing=1.2).move_to(b)
            self.play(FadeIn(VGroup(b, t)), run_time=0.5)
        self.wait(1)

        # ── MEV types ─────────────────────────────────────────────────────────
        self.play(*[FadeOut(m) for m in self.mobjects if m != title])

        types = VGroup(
            self._mev_row("Sandwich Attacks", "Harmful — extracts from retail", RED),
            self._mev_row("Arbitrage",         "Neutral — improves price efficiency", TEAL),
            self._mev_row("Liquidations",      "Neutral — maintains protocol solvency", BLUE),
            self._mev_row("JIT Liquidity",     "Mixed — takes LP fees", GOLD),
        ).arrange(DOWN, buff=0.35).shift(DOWN*0.2)

        with self.voiceover(
            "Types of MEV: sandwich attacks are the most user-harmful — pure extraction from "
            "retail users. Arbitrage MEV is mostly beneficial — it restores price efficiency "
            "across DEXes. Liquidation MEV maintains protocol solvency. JIT — just-in-time "
            "liquidity — is mixed: users get slightly better prices, existing LPs get slightly "
            "less fees. MEV-Boost, used by 90% of Ethereum validators, redirects most MEV value "
            "to validators — democratizing MEV revenue. Defence: use private RPC endpoints like "
            "Flashbots Protect or MEV Blocker, and keep slippage tolerance tight."
        ) as tracker:
            self.play(LaggedStartMap(FadeIn, types, lag_ratio=0.25))
            defence = Text(
                "Defence: private RPC (Flashbots Protect / MEV Blocker) + tight slippage",
                font_size=20, color=TEAL
            ).to_edge(DOWN, buff=0.3)
            self.play(Write(defence))
            self.wait(tracker.duration - 2)

        # ── CTA ────────────────────────────────────────────────────────────────
        with self.voiceover(
            "Next: Sandwich Attacks specifically — the exact mechanics, how much it costs you on "
            "each trade, and how to calculate your exposure. Subscribe. QuantiFire."
        ) as tracker:
            self.play(*[FadeOut(m) for m in self.mobjects], run_time=1)
            outro = Text("QuantiFire  |  EP 19", font_size=30, color=GOLD)
            self.play(FadeIn(outro))
            self.wait(tracker.duration - 1)

    def _mev_row(self, name, desc, color):
        box  = RoundedRectangle(width=9.5, height=0.95, corner_radius=0.12,
                                fill_color=color, fill_opacity=0.08,
                                stroke_color=color, stroke_width=1.2)
        nm   = Text(name, font_size=20, color=color).move_to(box).shift(LEFT*2.8)
        desc_t = Text(desc, font_size=17, color=WHITE).move_to(box).shift(RIGHT*1.8)
        return VGroup(box, nm, desc_t)
