"""
QuantiFire EP21 — Top 5 Smart Contract Hacks: How $5 Billion Was Stolen
Run: manim -pql ep21_smart_contract_hacks.py SmartContractHacksScene
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

class SmartContractHacksScene(VoiceoverScene):
    def construct(self):
        self.camera.background_color = BG
        self.set_speech_service(GTTSService(lang="en"))
        # PRODUCTION: self.set_speech_service(ElevenLabsService(voice_id="pNInz6obpgDQGcFmaJgB", model="eleven_turbo_v2"))

        title = Text("Top 5 Smart Contract Attack Vectors", font_size=36, color=GOLD)\
                  .to_edge(UP)

        # ── Hook ───────────────────────────────────────────────────────────────
        with self.voiceover(
            "The DAO hack: $60 million. Poly Network: $611 million. Ronin Bridge: $625 million. "
            "Wormhole: $320 million. Total DeFi hacks since 2019: over $5 billion stolen. Not "
            "from exchanges being hacked in the traditional sense — from bugs in smart contract "
            "code that anyone could exploit. Today I'm breaking down the five most common attack "
            "vectors, the code-level vulnerability, and how each one is prevented."
        ) as tracker:
            self.play(Write(title), run_time=tracker.duration)

        # ── Context ────────────────────────────────────────────────────────────
        with self.voiceover(
            "Welcome to QuantiFire. Smart contracts are immutable programs running on public "
            "blockchains. Their code is open source — any attacker can study it. Any bug is a "
            "potential exploit. Understanding these vulnerabilities is essential whether you're "
            "building protocols, auditing code, or deciding which protocols to trust with "
            "your capital."
        ) as tracker:
            self.wait(tracker.duration)

        # ── Hack timeline ──────────────────────────────────────────────────────
        hacks = [
            ("Reentrancy",          "$60M  (The DAO, 2016)",      RED),
            ("Access Control",      "$611M (Poly Network, 2021)",  RED),
            ("Oracle Manipulation", "$500M+ (multiple)",           RED),
            ("Logic / Economic",    "$116M (Mango, 2022)",         RED),
            ("Integer Overflow",    "$~50M (multiple, pre-0.8)",   RED),
        ]

        hack_group = VGroup()
        for i, (name, amount, col) in enumerate(hacks):
            box = RoundedRectangle(width=9, height=0.9, corner_radius=0.12,
                                   fill_color=col, fill_opacity=0.1,
                                   stroke_color=col, stroke_width=1.2)
            idx  = Text(f"#{i+1}", font_size=22, color=col).move_to(box).shift(LEFT*4.0)
            nm   = Text(name,   font_size=20, color=col).move_to(box).shift(LEFT*1.5)
            amt  = Text(amount, font_size=18, color=WHITE).move_to(box).shift(RIGHT*2.5)
            hack_group.add(VGroup(box, idx, nm, amt))

        hack_group.arrange(DOWN, buff=0.2).shift(DOWN*0.2)

        with self.voiceover(
            "The five most damaging attack categories. Number one: reentrancy — the original "
            "DeFi hack that drained The DAO of $60 million in 2016. Number two: access control "
            "failure — a single missing check enabled the $611 million Poly Network hack. "
            "Number three: oracle manipulation — flash loans used to distort prices across "
            "multiple attacks totaling $500 million or more. Number four: logic and economic "
            "design flaws — Mango Markets lost $116 million to a price manipulation strategy "
            "that wasn't technically a code bug. Number five: integer overflow — affects older "
            "contracts written before Solidity 0.8."
        ) as tracker:
            self.play(LaggedStartMap(FadeIn, hack_group, lag_ratio=0.2))
            self.wait(tracker.duration - 2)

        # ── Reentrancy call stack animation ───────────────────────────────────
        self.play(*[FadeOut(m) for m in self.mobjects if m != title])

        re_title = Text("Reentrancy — Call Stack Visualised", font_size=26, color=RED)\
                     .shift(UP*1.8)
        self.play(Write(re_title))

        stack_frames = [
            ("Victim.withdraw(100)", BLUE,  UP*0.8),
            ("  ↳ send 100 ETH to Attacker.receive()", RED, UP*0.0),
            ("    ↳ Attacker.receive() calls withdraw() AGAIN!", RED, DOWN*0.8),
            ("      ↳ Balance not yet updated → send 100 ETH again!", RED, DOWN*1.6),
            ("        ↳ Repeat until pool drained...", RED, DOWN*2.4),
        ]

        with self.voiceover(
            "The reentrancy pattern: the attacker calls withdraw on the victim contract. "
            "The victim sends ETH to the attacker's contract. The attacker's receive function "
            "calls withdraw again — before the first call completes. The victim hasn't updated "
            "its balance yet, so it sends ETH again. Repeat until the pool is drained. "
            "The fix: Checks-Effects-Interactions pattern. Update all state — set balance to "
            "zero — before any external call. Or use a nonReentrant mutex lock. Modern best "
            "practice: both."
        ) as tracker:
            for text, col, shift in stack_frames:
                t = Text(text, font_size=17, color=col).shift(shift)
                self.play(Write(t), run_time=0.6)
                self.wait(0.3)
            fix_title = Text("FIX: Checks-Effects-Interactions Pattern", font_size=22, color=TEAL)\
                          .to_edge(DOWN, buff=1.2)
            code_box = RoundedRectangle(width=9, height=1.3, corner_radius=0.15,
                                        fill_color=TEAL, fill_opacity=0.08,
                                        stroke_color=TEAL, stroke_width=1.5)\
                         .to_edge(DOWN, buff=0.25)
            fix_code = Text(
                "balances[msg.sender] -= amount;   // Effect FIRST\n"
                "(bool ok,) = msg.sender.call{value:amount}('');  // Interact AFTER",
                font_size=15, color=TEAL, line_spacing=1.3
            ).move_to(code_box)
            self.play(Write(fix_title), Create(code_box), Write(fix_code))
            self.wait(tracker.duration - 8)

        # ── CTA ────────────────────────────────────────────────────────────────
        with self.voiceover(
            "Before trusting a protocol with capital: has it been audited by at least two "
            "top-tier firms? Is there a bug bounty program? Is the code open source and "
            "time-tested? What's the largest withdrawal that can happen without a time-lock? "
            "These four questions are your minimum security due diligence. "
            "Next: Governance Attacks — when DAOs turn against their users. Flash loan voting, "
            "token concentration risks, and the malicious proposal that drained a $100 million "
            "treasury. Subscribe. QuantiFire."
        ) as tracker:
            self.play(*[FadeOut(m) for m in self.mobjects], run_time=1)
            outro = Text("QuantiFire  |  EP 21", font_size=30, color=GOLD)
            self.play(FadeIn(outro))
            self.wait(tracker.duration - 1)
