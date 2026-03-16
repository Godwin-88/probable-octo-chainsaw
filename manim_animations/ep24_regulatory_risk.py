"""
QuantiFire EP24 — Regulatory Risk: SEC, MiCA, Your DeFi Future
Run: manim -pql ep24_regulatory_risk.py RegulatoryRiskScene
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

class RegulatoryRiskScene(VoiceoverScene):
    def construct(self):
        self.camera.background_color = BG
        self.set_speech_service(GTTSService(lang="en"))
        # PRODUCTION: self.set_speech_service(ElevenLabsService(voice_id="pNInz6obpgDQGcFmaJgB", model="eleven_turbo_v2"))

        title = Text("Regulatory Risk: SEC, MiCA & Your DeFi", font_size=36, color=GOLD)\
                  .to_edge(UP)

        # ── Hook ───────────────────────────────────────────────────────────────
        with self.voiceover(
            "In June 2023, the SEC sued Binance and Coinbase in the same week, calling dozens of "
            "tokens unregistered securities. In 2024, the EU's MiCA regulation went fully live — "
            "the most comprehensive crypto regulatory framework in history. The regulatory tide is "
            "rising. Ignoring it is no longer an option for anyone operating in DeFi. Today I'll "
            "map the regulatory landscape and what it actually means for your positions."
        ) as tracker:
            self.play(Write(title), run_time=tracker.duration)

        # ── Context ────────────────────────────────────────────────────────────
        with self.voiceover(
            "Welcome to QuantiFire. Regulatory risk is the risk that legal or regulatory changes "
            "reduce the value of or restrict access to your crypto assets or DeFi positions. "
            "It's different from market risk — it can materialize regardless of market conditions, "
            "and it can move fast. Understanding the current global framework is essential for "
            "every serious participant."
        ) as tracker:
            self.wait(tracker.duration)

        # ── Global regulatory map ──────────────────────────────────────────────
        regions = [
            ("USA", "Howey Test\nSEC vs CFTC\nUnclear",  RED,    LEFT*4.5 + UP*0.5),
            ("EU",  "MiCA Live\nDec 2024\nClear rules", TEAL,   LEFT*1.5 + UP*0.5),
            ("UK",  "FCA regime\nEvolving",              BLUE,   RIGHT*1.5 + UP*0.5),
            ("SG",  "MAS framework\nCrypto-friendly",   GOLD,   RIGHT*4.5 + UP*0.5),
        ]

        with self.voiceover(
            "The global picture: the United States has the most uncertainty — the SEC and CFTC "
            "are battling over jurisdiction, and the Howey Test is applied inconsistently. The "
            "European Union has MiCA, which went live in December 2024 — clear rules, a licensing "
            "regime, and crucially a carve-out for fully decentralized protocols. The UK is "
            "developing its own FCA-led framework. Singapore has been consistently crypto-friendly "
            "with a clear MAS licensing path. Jurisdiction matters for which protocols and "
            "products you can legally access."
        ) as tracker:
            for emoji_name, status, col, pos in regions:
                box = RoundedRectangle(width=3.0, height=2.2, corner_radius=0.2,
                                       fill_color=col, fill_opacity=0.1,
                                       stroke_color=col, stroke_width=1.5).move_to(pos)
                nm  = Text(emoji_name, font_size=22, color=col).move_to(box).shift(UP*0.6)
                st  = Text(status, font_size=16, color=WHITE, line_spacing=1.2)\
                        .move_to(box).shift(DOWN*0.1)
                self.play(FadeIn(VGroup(box, nm, st), scale=0.95), run_time=0.6)
                self.wait(0.2)
            self.wait(tracker.duration - 4)

        self.play(*[FadeOut(m) for m in self.mobjects if m != title])

        # ── Howey Test visual ──────────────────────────────────────────────────
        howey_title = Text("The Howey Test — Is Your Token a Security?",
                           font_size=24, color=RED).shift(UP*1.8)
        self.play(Write(howey_title))

        criteria = [
            "① Investment of money",
            "② In a common enterprise",
            "③ Expectation of profit",
            "④ From efforts of OTHERS",
        ]
        crit_group = VGroup()
        for c in criteria:
            box = RoundedRectangle(width=7, height=0.75, corner_radius=0.12,
                                   fill_color=RED, fill_opacity=0.08,
                                   stroke_color=RED, stroke_width=1.2)
            t   = Text(c, font_size=20, color=RED).move_to(box)
            crit_group.add(VGroup(box, t))
        crit_group.arrange(DOWN, buff=0.22).shift(DOWN*0.2)

        with self.voiceover(
            "The SEC applies the Howey Test to determine if a token is a security. Four criteria: "
            "investment of money, in a common enterprise, with expectation of profit, from the "
            "efforts of others. Most governance tokens fail this test — they represent expectation "
            "of profit from the protocol team's efforts. If classified as securities, the token "
            "must register with the SEC, can only be sold to accredited investors, and exchanges "
            "must be licensed broker-dealers. Uniswap, Aave, and Compound governance tokens are "
            "all under implicit SEC scrutiny. Bitcoin and ETH are generally treated as commodities "
            "by the CFTC — but most altcoins remain in a legal grey zone."
        ) as tracker:
            self.play(LaggedStartMap(FadeIn, crit_group, lag_ratio=0.3))
            verdict = Text("ALL 4 met → Security → Register with SEC or face enforcement",
                           font_size=18, color=RED).to_edge(DOWN, buff=1.0)
            self.play(Write(verdict))
            self.wait(tracker.duration - 3)

        self.play(*[FadeOut(m) for m in self.mobjects if m != title])

        # ── MiCA highlights ────────────────────────────────────────────────────
        mica_title = Text("MiCA — EU Markets in Crypto-Assets (2024)",
                          font_size=24, color=TEAL).shift(UP*1.8)
        self.play(Write(mica_title))

        mica_pts = VGroup(
            Text("✓ CASPs (exchanges, custodians) must be licensed",
                 font_size=20, color=TEAL),
            Text("✓ Stablecoins: e-money token = EU banking license required",
                 font_size=20, color=TEAL),
            Text("✓ Fully decentralised protocols EXEMPT from MiCA",
                 font_size=20, color=GOLD),
            Text("✗ NFTs not covered (unless financial instruments)",
                 font_size=20, color=GRAY),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.3).shift(DOWN*0.2)

        with self.voiceover(
            "MiCA creates clear rules for centralized crypto companies — actually a positive for "
            "institutions who need regulatory clarity before entering the market. Key provisions: "
            "crypto asset service providers — exchanges and custodians — must be licensed with "
            "strict KYC and AML requirements. Stablecoins like USDC require EU banking licenses. "
            "The critical carve-out: protocols that are fully decentralized with no single "
            "controlling entity are explicitly excluded from MiCA. This means truly decentralized "
            "protocols like Uniswap are not directly regulated. NFTs are not covered unless they "
            "function as financial instruments. Regulatory clarity, even if initially burdensome, "
            "tends to be positive for institutional adoption and market depth."
        ) as tracker:
            self.play(LaggedStartMap(FadeIn, mica_pts, lag_ratio=0.3))
            takeaway = Text(
                "Regulatory clarity → institutional capital flows → bigger market depth",
                font_size=19, color=GOLD
            ).to_edge(DOWN, buff=0.35)
            self.play(Write(takeaway))
            self.wait(tracker.duration - 3)

        # ── CTA ────────────────────────────────────────────────────────────────
        with self.voiceover(
            "Regulatory risk is not binary. It's a continuous exposure that can be partially "
            "hedged: diversify across jurisdictions, avoid protocols with clearly centralized "
            "control structures, hold stablecoin exposure across multiple issuers, and stay "
            "current on regulatory developments in your jurisdiction. "
            "That wraps Series 3. Series 4 next: bridging TradFi quant strategies into DeFi — "
            "how momentum, statistical arbitrage, and value investing translate to on-chain "
            "markets. Subscribe. QuantiFire."
        ) as tracker:
            self.play(*[FadeOut(m) for m in self.mobjects], run_time=1)
            outro = Text("QuantiFire  |  EP 24", font_size=30, color=GOLD)
            self.play(FadeIn(outro))
            self.wait(tracker.duration - 1)
