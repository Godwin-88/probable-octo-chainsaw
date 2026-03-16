"""
QuantiFire EP22 — Governance Attacks: When DAOs Turn Evil
Run: manim -pql ep22_governance_attacks.py GovernanceAttackScene
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

class GovernanceAttackScene(VoiceoverScene):
    def construct(self):
        self.camera.background_color = BG
        self.set_speech_service(GTTSService(lang="en"))
        # PRODUCTION: self.set_speech_service(ElevenLabsService(voice_id="pNInz6obpgDQGcFmaJgB", model="eleven_turbo_v2"))

        title = Text("Governance Attacks: When DAOs Turn Evil", font_size=36, color=GOLD)\
                  .to_edge(UP)

        # ── Hook ───────────────────────────────────────────────────────────────
        with self.voiceover(
            "A DAO is supposed to be the purest form of democracy: token holders vote on protocol "
            "decisions. But what if someone could borrow $1 billion in tokens for 12 seconds, "
            "vote on a governance proposal that empties the treasury, and repay the tokens — all "
            "in one transaction? This isn't hypothetical. It happened to Beanstalk Farms in "
            "April 2022. $182 million stolen through a governance flash loan attack."
        ) as tracker:
            self.play(Write(title), run_time=tracker.duration)

        # ── Context ────────────────────────────────────────────────────────────
        with self.voiceover(
            "Welcome to QuantiFire. Governance is the mechanism by which DeFi protocols upgrade "
            "themselves, manage treasuries, and adjust parameters. It's also one of the largest "
            "attack surfaces in DeFi. Today I'll cover the major governance attack vectors: "
            "flash loan voting, token concentration, and malicious proposal execution."
        ) as tracker:
            self.wait(tracker.duration)

        # ── Beanstalk flash loan governance timeline ───────────────────────────
        tl_title = Text("Beanstalk Attack — April 2022 ($182M)", font_size=24, color=RED)\
                     .shift(UP*1.8)
        self.play(Write(tl_title))

        timeline_steps = [
            ("Flash loan\n$1B+ USDC",          BLUE,  LEFT*4.5),
            ("Deposit → receive\ngovernance tokens",  GOLD,  LEFT*1.5),
            ("Vote: pass malicious\nproposals",       RED,   RIGHT*1.5),
            ("Treasury drained\n$182M stolen",        RED,   RIGHT*4.5),
        ]

        tl_line = Line(LEFT*5, RIGHT*5, color=GRAY, stroke_width=2).shift(DOWN*0.5)
        self.play(Create(tl_line))

        prev_dot = None

        with self.voiceover(
            "The Beanstalk attack: flash loan over $1 billion in stablecoins, deposit into "
            "Beanstalk to receive governance tokens, immediately vote on two pre-staged malicious "
            "proposals — one to donate all Beanstalk assets to the attacker's wallet. Since the "
            "attacker held majority of tokens, both proposals passed instantly. Protocol sent all "
            "assets to the attacker's wallet. The attacker repaid flash loans and kept $182 million. "
            "The fatal flaw: no time delay between vote and execution."
        ) as tracker:
            for text, col, xpos in timeline_steps:
                dot = Dot(xpos + DOWN*0.5, color=col, radius=0.13)
                b   = RoundedRectangle(width=2.5, height=1.1, corner_radius=0.15,
                                       fill_color=col, fill_opacity=0.12,
                                       stroke_color=col, stroke_width=1.2)\
                        .move_to(xpos + UP*0.8)
                t   = Text(text, font_size=15, color=col, line_spacing=1.2).move_to(b)
                vl  = DashedLine(xpos + DOWN*0.5, xpos + UP*0.25, color=col, stroke_width=1.5)
                anims = [FadeIn(dot), Create(vl), FadeIn(VGroup(b, t))]
                if prev_dot:
                    a = Arrow(prev_dot.get_right(), dot.get_left(), color=GRAY,
                              buff=0.05, stroke_width=1.5)
                    anims.append(GrowArrow(a))
                self.play(*anims, run_time=0.7)
                prev_dot = dot
                self.wait(0.4)
            flaw = Text("Fatal Flaw: vote + execution in same block → flash loan exploit",
                        font_size=20, color=RED).to_edge(DOWN, buff=1.5)
            self.play(Write(flaw))
            self.wait(tracker.duration - 6)
        self.play(*[FadeOut(m) for m in self.mobjects if m != title])

        # ── Safe governance model ─────────────────────────────────────────────
        safe_title = Text("Safe Governance: Compound Governor Bravo Model",
                          font_size=22, color=TEAL).shift(UP*1.8)
        self.play(Write(safe_title))

        phases = [
            ("Proposal\nSubmitted",     "0 days",  BLUE),
            ("Voting Delay\n(2 days)",  "Day 2",   GOLD),
            ("Voting Period\n(3 days)", "Day 5",   GOLD),
            ("Timelock\n(2 days)",      "Day 7",   TEAL),
            ("Execution",               "Day 7+",  TEAL),
        ]

        phase_group = VGroup()
        for i, (label, time, col) in enumerate(phases):
            box = RoundedRectangle(width=2.0, height=1.5, corner_radius=0.15,
                                   fill_color=col, fill_opacity=0.1,
                                   stroke_color=col, stroke_width=1.2)
            lbl = Text(label, font_size=15, color=col, line_spacing=1.2).move_to(box).shift(UP*0.15)
            tm  = Text(time,  font_size=14, color=GRAY).move_to(box).shift(DOWN*0.42)
            phase_group.add(VGroup(box, lbl, tm))

        phase_group.arrange(RIGHT, buff=0.25).shift(DOWN*0.2)
        self.play(LaggedStartMap(FadeIn, phase_group, lag_ratio=0.2))

        for i in range(len(phases)-1):
            a = Arrow(phase_group[i].get_right(), phase_group[i+1].get_left(),
                      color=GRAY, buff=0.05, stroke_width=1.5)
            self.play(GrowArrow(a), run_time=0.3)

        timelock_note = Text(
            "2-day timelock = flash loan attack impossible\n"
            "Votes use balance snapshot at proposal block",
            font_size=20, color=TEAL, line_spacing=1.3
        ).to_edge(DOWN, buff=0.3)

        with self.voiceover(
            "The fix: timelock plus snapshot separation. Standard safe governance model — "
            "Compound Governor Bravo: proposal submitted, then 2-day voting delay — this prevents "
            "flash loan attacks since votes use the balance at the proposal block. Then a 3-day "
            "voting period. After passing, a 2-day timelock before execution. Total: 7 days "
            "minimum from proposal to execution. Flash loans are same-block — irrelevant to "
            "the snapshot. The 7-day delay also gives the community time to react to malicious "
            "proposals before they execute."
        ) as tracker:
            self.play(Write(timelock_note))
            self.wait(tracker.duration - 1)

        # ── CTA ────────────────────────────────────────────────────────────────
        with self.voiceover(
            "Next: Liquidation Cascades — when DeFi dominoes fall. How one large liquidation "
            "triggers others in a chain reaction that can destabilize entire protocols. "
            "Subscribe. QuantiFire."
        ) as tracker:
            self.play(*[FadeOut(m) for m in self.mobjects], run_time=1)
            outro = Text("QuantiFire  |  EP 22", font_size=30, color=GOLD)
            self.play(FadeIn(outro))
            self.wait(tracker.duration - 1)
