"""
QuantiFire EP35 — Behavioral Portfolio Theory: How Psychology Changes Optimal Allocation
Run: manim -pql ep35_behavioral_portfolio.py BehavioralPortfolioScene
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

class BehavioralPortfolioScene(VoiceoverScene):
    def construct(self):
        self.camera.background_color = BG
        self.set_speech_service(GTTSService(lang="en"))
        # PRODUCTION: self.set_speech_service(ElevenLabsService(voice_id="pNInz6obpgDQGcFmaJgB", model="eleven_turbo_v2"))

        title = Text("Behavioral Portfolio Theory", font_size=40, color=GOLD).to_edge(UP)
        sub   = Text("How Psychology Changes Optimal Allocation", font_size=24, color=WHITE)\
                  .next_to(title, DOWN, buff=0.1)

        # ── Hook ───────────────────────────────────────────────────────────────
        with self.voiceover(
            "Mean-Variance Optimization tells you to build a single portfolio on the efficient "
            "frontier. But real investors — from retail traders to billionaires — don't behave "
            "this way. They mentally separate their money into accounts: a safety layer, a growth "
            "layer, a speculation layer. Behavioral Portfolio Theory formalizes this behavior and "
            "produces portfolio structures that look radically different from Markowitz — and in "
            "many ways, more rational given actual human psychology."
        ) as tracker:
            self.play(Write(title), FadeIn(sub))
            self.wait(0.8)
            self.play(FadeOut(sub))
            self.wait(tracker.duration - 2)

        # ── Context ────────────────────────────────────────────────────────────
        with self.voiceover(
            "Welcome to QuantiFire. Behavioral Portfolio Theory was developed by Shefrin and "
            "Statman in 2000. It extends Prospect Theory into a portfolio framework. "
            "Understanding it has two applications: avoiding its pitfalls in your own "
            "decision-making, and understanding why retail and institutional investors hold "
            "the positions they do — which generates the anomalies quants exploit."
        ) as tracker:
            self.wait(tracker.duration)

        # ── Layered portfolio pyramid ──────────────────────────────────────────
        layers = [
            ("Safety Layer",     "T-bills, USDC, Aave Stablecoins\n~4–5% APY",
             "70–80% of capital", BLUE,  0.55),
            ("Income Layer",     "stETH, PoS Staking, Blue-chip bonds\n~5–8% APY",
             "15–20% of capital", TEAL,  0.95),
            ("Growth Layer",     "ETH, BTC, Large-cap DeFi tokens\n~market returns",
             "5–10% of capital",  GOLD,  1.35),
            ("Speculation Layer","High APY farms, New protocols, Options\nAccept –100%",
             "1–5% of capital",   RED,   1.75),
        ]

        pyramid_group = VGroup()
        for i, (name, desc, allocation, col, width) in enumerate(layers):
            base_y = -2.5 + i * 1.2
            box = Rectangle(
                width=width * 3.5, height=1.0,
                fill_color=col, fill_opacity=0.85, stroke_color=BG, stroke_width=2
            ).move_to([0, base_y, 0])
            nm  = Text(name, font_size=16, color=BG).move_to(box).shift(LEFT*0.5)
            all_t = Text(allocation, font_size=13, color=BG).move_to(box).shift(RIGHT*1.0)
            pyramid_group.add(VGroup(box, nm, all_t))

        with self.voiceover(
            "The mental accounting framework: people don't think of their entire wealth as one "
            "unified portfolio. They think in mental accounts — buckets with different purposes, "
            "risk tolerances, and time horizons. The safety layer: money you cannot afford to "
            "lose — 70 to 80% of capital. Risk tolerance near zero. Instruments: cash, FDIC "
            "insured deposits, stablecoin yield on Aave. The income layer: steady return for "
            "reinvestment — 15 to 20% of capital. Instruments: stETH staking, liquid staking "
            "tokens, bonds. The growth layer: long-term wealth accumulation — 5 to 10% of "
            "capital. Instruments: ETH, BTC, blue-chip DeFi tokens. The speculation layer: "
            "get-rich potential, accept total loss — 1 to 5% of capital. Instruments: options, "
            "altcoins, high-APY DeFi farms, new protocol tokens."
        ) as tracker:
            self.play(LaggedStartMap(FadeIn, pyramid_group, lag_ratio=0.25))
            self.wait(0.8)

            # Right-side descriptions
            for i, (name, desc, allocation, col, _) in enumerate(layers):
                base_y = -2.5 + i * 1.2
                d_text = Text(desc, font_size=13, color=col, line_spacing=1.2)\
                           .move_to([4.5, base_y, 0])
                self.play(Write(d_text), run_time=0.5)
            self.wait(tracker.duration - 5)

        # ── DeFi layer mapping ─────────────────────────────────────────────────
        self.play(*[FadeOut(m) for m in self.mobjects if m != title])

        defi_title = Text("DeFi Portfolio Layer Mapping", font_size=26, color=WHITE)\
                       .shift(UP*1.8)
        self.play(Write(defi_title))

        with self.voiceover(
            "The behavioral portfolio framework maps naturally to DeFi allocation. Safety: "
            "USDC or USDT in Aave or Compound — 4 to 5% APY, minimal smart contract risk. "
            "Income: stETH staking, rETH, liquid staking — 4 to 5% plus ETH price exposure. "
            "Growth: ETH, BTC, blue-chip DeFi governance tokens like UNI and AAVE — market-linked "
            "returns. Speculation: high-APY farms, new protocol tokens, structured DeFi products "
            "— accept full loss. This framework is psychologically comfortable AND financially "
            "reasonable if the layers are sized correctly. The key rule: size the speculation "
            "layer to what you can afford to lose entirely. A speculative loss should not "
            "psychologically contaminate your growth and safety layers."
        ) as tracker:
            defi_map = Table(
                [["Safety",      "USDC in Aave / Compound",           "4–5% APY, minimal risk"],
                 ["Income",      "stETH, rETH, Liquid Staking",       "4–5% + ETH exposure"],
                 ["Growth",      "ETH, BTC, UNI, AAVE governance",    "Market-linked"],
                 ["Speculation", "New protocol tokens, 100%+ APY farms","Accept full loss"]],
                col_labels=[Text("Layer", color=GOLD),
                            Text("DeFi Instrument", color=GOLD),
                            Text("Expected Yield", color=GOLD)],
                element_to_mobject_config={"font_size": 17},
                include_outer_lines=True,
                line_config={"color": DARK_GRAY}
            ).shift(DOWN*0.2)
            self.play(Create(defi_map))
            self.wait(1)

            rule = Text(
                "Key rule: size the speculation layer to what you can AFFORD to lose entirely",
                font_size=19, color=RED
            ).to_edge(DOWN, buff=0.35)
            self.play(Write(rule))
            self.wait(tracker.duration - 3)

        # ── CTA ────────────────────────────────────────────────────────────────
        with self.voiceover(
            "If you use mental accounting — and you do, everyone does — use it deliberately. "
            "Define your layers explicitly, size them based on objective financial needs, and "
            "set rules for each layer separately. Acknowledge that your speculative layer will "
            "likely return negative 100% — size it accordingly. The structure prevents a "
            "speculative loss from psychologically contaminating your growth and safety layers. "
            "Final episode of the season: Black Swan Events — Nassim Taleb's framework for tail "
            "risk, what makes an event a Black Swan, and how to position your portfolio for "
            "events that models say can't happen but keep happening anyway. Subscribe. QuantiFire."
        ) as tracker:
            self.play(*[FadeOut(m) for m in self.mobjects], run_time=1)
            outro = Text("QuantiFire  |  EP 35", font_size=30, color=GOLD)
            self.play(FadeIn(outro))
            self.wait(tracker.duration - 1)
