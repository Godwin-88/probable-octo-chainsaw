"""
QuantiFire EP32 — Smart Contract Security Patterns Every Builder Must Know
Run: manim -pql ep32_smart_contract_security.py SmartContractSecurityScene
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

class SmartContractSecurityScene(VoiceoverScene):
    def construct(self):
        self.camera.background_color = BG
        self.set_speech_service(GTTSService(lang="en"))
        # PRODUCTION: self.set_speech_service(ElevenLabsService(voice_id="pNInz6obpgDQGcFmaJgB", model="eleven_turbo_v2"))

        title = Text("Smart Contract Security Patterns", font_size=38, color=GOLD)\
                  .to_edge(UP)

        # ── Hook ───────────────────────────────────────────────────────────────
        with self.voiceover(
            "$5 billion stolen from DeFi protocols — almost all of it from preventable bugs. "
            "The same attack patterns repeat across hundreds of hacks: reentrancy, missing "
            "access control, unchecked external calls, price oracle manipulation. In this "
            "episode, I'll show you the defensive code patterns that prevent each category of "
            "attack. If you're building on-chain or evaluating protocol security — this is "
            "your checklist."
        ) as tracker:
            self.play(Write(title), run_time=tracker.duration)

        # ── Context ────────────────────────────────────────────────────────────
        with self.voiceover(
            "Welcome to QuantiFire. We covered the attack vectors in episode 21. Today is the "
            "builder's perspective: the design patterns, code conventions, and architectural "
            "decisions that make contracts resistant to each attack class. These patterns are "
            "distilled from OpenZeppelin, Trail of Bits, ConsenSys Diligence, and the "
            "post-mortems of every major DeFi hack."
        ) as tracker:
            self.wait(tracker.duration)

        # ── CEI Pattern visual ─────────────────────────────────────────────────
        cei_title = Text("Pattern 1: Checks → Effects → Interactions",
                         font_size=24, color=TEAL).shift(UP*1.8)
        self.play(Write(cei_title))

        wrong_title = Text("VULNERABLE", font_size=20, color=RED).shift(LEFT*3.5 + UP*1.0)
        wrong_code  = VGroup(
            Text("1. Send ETH (interact) ← FIRST",  font_size=15, color=RED),
            Text("2. Update balance (effect) ← late", font_size=15, color=RED),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.15)\
         .next_to(wrong_title, DOWN, buff=0.2)
        wrong_box = SurroundingRectangle(VGroup(wrong_title, wrong_code),
                                         color=RED, buff=0.2, corner_radius=0.15)

        right_title = Text("CORRECT", font_size=20, color=TEAL).shift(RIGHT*3.0 + UP*1.0)
        right_code  = VGroup(
            Text("1. Check: balance >= amount",  font_size=15, color=TEAL),
            Text("2. Effect: balance -= amount", font_size=15, color=TEAL),
            Text("3. Interact: send ETH",        font_size=15, color=TEAL),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.15)\
         .next_to(right_title, DOWN, buff=0.2)
        right_box = SurroundingRectangle(VGroup(right_title, right_code),
                                          color=TEAL, buff=0.2, corner_radius=0.15)

        with self.voiceover(
            "Pattern one: Checks-Effects-Interactions — the most important pattern in Solidity. "
            "For every state-changing function: first, validate all inputs and preconditions "
            "with require statements. Second, update all state variables. Third, call external "
            "contracts last. The vulnerable pattern on the left sends ETH before updating the "
            "balance — an attacker's receive function can call withdraw again before the balance "
            "is updated, draining the pool. The correct pattern on the right updates the balance "
            "first, then interacts. The reentrancy attack is impossible because the state is "
            "already updated when the external call happens. Add OpenZeppelin's nonReentrant "
            "modifier as belt-and-suspenders protection."
        ) as tracker:
            self.play(Create(wrong_box), Write(wrong_title), Write(wrong_code))
            cross = Text("X", font_size=40, color=RED).next_to(wrong_box, DOWN, buff=0.1)
            self.play(Write(cross))
            self.wait(0.5)
            self.play(Create(right_box), Write(right_title), Write(right_code))
            tick = Text("✓", font_size=40, color=TEAL).next_to(right_box, DOWN, buff=0.1)
            self.play(Write(tick))
            self.wait(tracker.duration - 5)

        self.play(*[FadeOut(m) for m in self.mobjects if m != title])

        # ── Security audit checklist ───────────────────────────────────────────
        checklist_title = Text("Audit Checklist — 6 Non-Negotiables",
                               font_size=24, color=WHITE).shift(UP*1.8)
        self.play(Write(checklist_title))

        items = [
            ("CEI pattern on every state-changing function",    TEAL),
            ("ReentrancyGuard (nonReentrant) modifier",         TEAL),
            ("Role-based access control (OpenZeppelin)",        TEAL),
            ("Chainlink oracle — no AMM spot price",            TEAL),
            ("Timelock (48h) on admin operations",              GOLD),
            ("Solidity 0.8+ (auto overflow protection)",        TEAL),
        ]

        item_group = VGroup()
        for text, col in items:
            row = Text(f"  {text}", font_size=19, color=col)
            item_group.add(row)
        item_group.arrange(DOWN, aligned_edge=LEFT, buff=0.23).shift(DOWN*0.2)

        with self.voiceover(
            "The six non-negotiable security patterns. One: CEI pattern on every state-changing "
            "function. Two: ReentrancyGuard with the nonReentrant modifier from OpenZeppelin. "
            "Three: role-based access control — every sensitive function must restrict callers "
            "explicitly. Never leave admin functions callable by arbitrary addresses. Four: "
            "Chainlink price feed for oracles — never use AMM spot price as a primary oracle "
            "for collateral valuation. It is manipulatable with flash loans. Five: 48-hour "
            "timelock on all admin operations — this is what prevents governance flash loan "
            "attacks. Six: Solidity 0.8 or higher for automatic integer overflow protection. "
            "The cost of an audit is 30 to 100 thousand dollars. The cost of a hack is "
            "everything. Always audit with at least one professional firm before mainnet."
        ) as tracker:
            self.play(LaggedStartMap(FadeIn, item_group, lag_ratio=0.2))
            self.wait(1)
            audit_note = Text(
                "Always: 2 audits from top firms + bug bounty before mainnet",
                font_size=19, color=GOLD
            ).to_edge(DOWN, buff=0.35)
            self.play(Write(audit_note))
            self.wait(tracker.duration - 4)

        # ── CTA ────────────────────────────────────────────────────────────────
        with self.voiceover(
            "Security is architecture, not an afterthought. Build with Checks-Effects-Interactions, "
            "ReentrancyGuard, and AccessControl from the start. Use Chainlink for oracles. Add "
            "timelocks on all admin operations. Then audit with at least one professional firm "
            "before mainnet. "
            "Final episode of Series 5: Blockchain Consensus — Proof of Work vs Proof of Stake, "
            "why the Merge happened, and what the security implications are for the assets you "
            "hold. Subscribe. QuantiFire."
        ) as tracker:
            self.play(*[FadeOut(m) for m in self.mobjects], run_time=1)
            outro = Text("QuantiFire  |  EP 32", font_size=30, color=GOLD)
            self.play(FadeIn(outro))
            self.wait(tracker.duration - 1)
