"""
QuantiFire EP33 — PoW vs PoS: Why Ethereum Killed Mining
Run: manim -pql ep33_pow_vs_pos.py PoWvPoSScene
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

class PoWvPoSScene(VoiceoverScene):
    def construct(self):
        self.camera.background_color = BG
        self.set_speech_service(GTTSService(lang="en"))
        # PRODUCTION: self.set_speech_service(ElevenLabsService(voice_id="pNInz6obpgDQGcFmaJgB", model="eleven_turbo_v2"))

        title = Text("PoW vs PoS: Why Ethereum Killed Mining", font_size=36, color=GOLD)\
                  .to_edge(UP)

        # ── Hook ───────────────────────────────────────────────────────────────
        with self.voiceover(
            "In September 2022, Ethereum executed the Merge — switching from proof-of-work "
            "mining to proof-of-stake validation in a live system running $300 billion in "
            "assets. Energy consumption dropped 99.95% overnight. The emission rate dropped "
            "90%. And the security model fundamentally changed. Today I'll explain both "
            "consensus mechanisms, why Ethereum made the switch, and what it means for the "
            "network's long-term security."
        ) as tracker:
            self.play(Write(title), run_time=tracker.duration)

        # ── Context ────────────────────────────────────────────────────────────
        with self.voiceover(
            "Welcome to QuantiFire. Blockchain consensus is the mechanism by which distributed "
            "nodes agree on which transactions are valid and in what order — without any central "
            "authority. The choice of consensus mechanism determines the network's security "
            "model, energy consumption, throughput, and decentralization properties. This isn't "
            "just academic — it affects the safety of every asset on each chain."
        ) as tracker:
            self.wait(tracker.duration)

        # ── Side-by-side comparison ────────────────────────────────────────────
        pow_col = RoundedRectangle(width=5, height=5.5, corner_radius=0.2,
                                   fill_color=RED, fill_opacity=0.06,
                                   stroke_color=RED, stroke_width=1.5)\
                    .shift(LEFT*3.2 + DOWN*0.4)
        pos_col = RoundedRectangle(width=5, height=5.5, corner_radius=0.2,
                                   fill_color=TEAL, fill_opacity=0.06,
                                   stroke_color=TEAL, stroke_width=1.5)\
                    .shift(RIGHT*3.2 + DOWN*0.4)

        pow_title = Text("Proof of Work", font_size=24, color=RED).next_to(pow_col, UP, buff=0.1)
        pos_title = Text("Proof of Stake", font_size=24, color=TEAL).next_to(pos_col, UP, buff=0.1)

        self.play(Create(pow_col), Create(pos_col), Write(pow_title), Write(pos_title))

        pow_items = [
            "Miners solve SHA256 puzzle",
            "Block found ~every 10 min",
            "Attack: own 51% hashrate",
            "Energy: ~80 TWh/year (Chile)",
            "Hardware: ASIC specialised",
            "No slashing mechanism",
        ]
        pos_items = [
            "Validators stake 32 ETH",
            "Block every 12 seconds",
            "Attack: own 33%+ of stake",
            "Energy: ~0.01 TWh/year",
            "Software: standard server",
            "Slashing: lose staked ETH",
        ]

        pow_group = VGroup(*[Text(f"• {s}", font_size=16, color=RED) for s in pow_items])\
                      .arrange(DOWN, aligned_edge=LEFT, buff=0.22)\
                      .move_to(pow_col)
        pos_group = VGroup(*[Text(f"• {s}", font_size=16, color=TEAL) for s in pos_items])\
                      .arrange(DOWN, aligned_edge=LEFT, buff=0.22)\
                      .move_to(pos_col)

        with self.voiceover(
            "Proof of Work: miners compete to solve a computationally intensive SHA256 puzzle. "
            "Find a nonce such that the hash of the block header is below a target. Attacking "
            "requires controlling over 51% of the global hashrate — for Bitcoin that's estimated "
            "at $20 billion or more in hardware plus millions per hour in electricity. "
            "Economically infeasible. The problem: the computation produces nothing except a "
            "valid block. Mining consumes as much electricity as a mid-sized country — purely "
            "for security. "
            "Proof of Stake: validators lock up 32 ETH as collateral. The protocol "
            "pseudorandomly selects validators in proportion to their stake. Attacking requires "
            "over 33% of staked ETH. And a successful attack triggers slashing — the attacker "
            "loses up to 100% of their stake. The attack destroys the value of the asset you "
            "needed to buy to execute it. Self-defeating."
        ) as tracker:
            self.play(LaggedStartMap(Write, pow_group, lag_ratio=0.15))
            self.play(LaggedStartMap(Write, pos_group, lag_ratio=0.15))
            self.wait(tracker.duration - 4)

        # ── Energy reduction bar ───────────────────────────────────────────────
        self.play(*[FadeOut(m) for m in self.mobjects if m != title])

        energy_title = Text("Energy Reduction After the Merge", font_size=26, color=WHITE)\
                         .shift(UP*1.8)
        self.play(Write(energy_title))

        axes = Axes(
            x_range=[0, 2, 1], y_range=[0, 110, 20],
            x_length=5, y_length=5,
            axis_config={"color": GRAY, "include_numbers": True}, tips=False
        ).shift(DOWN*0.3)
        y_lab = Text("Energy (TWh/year)", font_size=18, color=GRAY)\
                  .next_to(axes.y_axis.get_end(), UP)
        self.play(Create(axes), Write(y_lab))

        with self.voiceover(
            "The energy reduction: Proof of Work Ethereum consumed approximately 80 terawatt-hours "
            "per year — equivalent to the electricity consumption of Chile. Proof of Stake "
            "Ethereum consumes approximately 0.01 terawatt-hours per year — equivalent to about "
            "10,000 US homes. A reduction of 99.95%. This improvement came from replacing "
            "competitive computation — everyone races to solve puzzles, only one wins — with "
            "cooperative attestation where all validators participate productively each epoch. "
            "Ethereum's Gasper consensus finalizes blocks after two epochs — approximately "
            "12.8 minutes — after which reverting a block would require burning one-third of "
            "all staked ETH. Economic finality without waste."
        ) as tracker:
            for x, h, col, lbl in [(0.5, 80, RED, "PoW\n80 TWh"), (1.5, 0.01, TEAL, "PoS\n0.01 TWh")]:
                x0  = axes.coords_to_point(x-0.3, 0)
                x1  = axes.coords_to_point(x-0.3, h)
                bar = Rectangle(
                    width=abs(axes.coords_to_point(x+0.3, 0)[0]-x0[0]),
                    height=abs(x1[1]-x0[1]),
                    fill_color=col, fill_opacity=0.85, stroke_width=0
                ).move_to([(x0[0]+axes.coords_to_point(x+0.3,0)[0])/2, (x0[1]+x1[1])/2, 0])
                bl  = Text(lbl, font_size=18, color=col)\
                        .next_to(axes.coords_to_point(x, 0), DOWN, buff=0.1)
                self.play(FadeIn(bar), Write(bl), run_time=0.8)

            reduction = Text("-99.95% energy consumption", font_size=26, color=TEAL)\
                          .to_corner(UR).shift(LEFT*0.5 + DOWN*0.5)
            self.play(Write(reduction))

            finality = Text(
                "PoS Finality: after 2 epochs (~12.8 min) reversion costs 1/3 of all staked ETH",
                font_size=18, color=GOLD
            ).to_edge(DOWN, buff=0.35)
            self.play(Write(finality))
            self.wait(tracker.duration - 5)

        # ── CTA ────────────────────────────────────────────────────────────────
        with self.voiceover(
            "Proof of Stake is more capital-efficient than Proof of Work and has equivalent or "
            "superior security properties for attacks requiring majority control. The tradeoffs "
            "are stake concentration risk over long periods and custodial risk in liquid staking "
            "protocols. For users: understand whether your ETH is solo-staked, in a distributed "
            "validator, or in a centralized liquid staking protocol like Lido — the risk profile "
            "is meaningfully different. "
            "Series 5 complete. Series 6 next: Behavioral Finance and Psychology. Prospect "
            "theory, loss aversion, and Black Swan events. Why your brain is the biggest risk "
            "to your portfolio. Subscribe. QuantiFire."
        ) as tracker:
            self.play(*[FadeOut(m) for m in self.mobjects], run_time=1)
            outro = Text("QuantiFire  |  EP 33", font_size=30, color=GOLD)
            self.play(FadeIn(outro))
            self.wait(tracker.duration - 1)
