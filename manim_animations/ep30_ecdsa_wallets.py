"""
QuantiFire EP30 — How Ethereum Creates Your Wallet Address (ECDSA Explained)
Run: manim -pql ep30_ecdsa_wallets.py ECDSAScene
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

class ECDSAScene(VoiceoverScene):
    def construct(self):
        self.camera.background_color = BG
        self.set_speech_service(GTTSService(lang="en"))
        # PRODUCTION: self.set_speech_service(ElevenLabsService(voice_id="pNInz6obpgDQGcFmaJgB", model="eleven_turbo_v2"))

        title = Text("How Ethereum Creates Your Wallet", font_size=38, color=GOLD)\
                  .to_edge(UP)

        # ── Hook ───────────────────────────────────────────────────────────────
        with self.voiceover(
            "Your entire Ethereum wallet — every token, every NFT, every DeFi position — is "
            "controlled by a single 256-bit number. A number so large that guessing it is more "
            "unlikely than winning the lottery a billion times in a row. From that one number, "
            "Ethereum derives your public key, then your address — all using a branch of "
            "mathematics called elliptic curve cryptography. Today I'll show you exactly how "
            "this works."
        ) as tracker:
            self.play(Write(title), run_time=tracker.duration)

        # ── Context ────────────────────────────────────────────────────────────
        with self.voiceover(
            "Welcome to QuantiFire. Understanding the cryptographic foundation of Ethereum wallets "
            "is essential for two reasons: security — understanding why your private key must never "
            "be shared — and technical literacy — understanding what actually happens when you "
            "sign a transaction. This is the math that makes self-custody possible."
        ) as tracker:
            self.wait(tracker.duration)

        # ── Three-step key derivation pipeline ────────────────────────────────
        steps = VGroup(
            self._step("Private Key  k",
                       "Random 256-bit integer\n1 <= k < n",
                       "secp256k1 curve order", RED),
            self._step("Public Key  K",
                       "K = k · G\n(elliptic curve multiplication)",
                       "One-way: K to k is infeasible", GOLD),
            self._step("Address",
                       "Keccak256(K)[last 20 bytes]\n0x + 40 hex chars",
                       "Unique on-chain identity", TEAL),
        ).arrange(RIGHT, buff=0.5).shift(DOWN*0.2)

        with self.voiceover(
            "Three steps to create your Ethereum wallet. Step one: your private key is simply "
            "a massive random number — close to 2 to the power of 256 possible values. The "
            "randomness is everything. If someone can predict or brute-force it, they own your "
            "funds. Step two: multiplying that private key by a fixed generator point on an "
            "elliptic curve produces your public key. This multiplication is a one-way function — "
            "knowing the public key tells you nothing about the private key. That asymmetry is "
            "the entire foundation of self-custody. Step three: hash the public key and take "
            "the last 20 bytes. That is your Ethereum address."
        ) as tracker:
            for i, step in enumerate(steps):
                self.play(FadeIn(step, scale=0.9))
                if i < 2:
                    arr = Arrow(steps[i].get_right(), steps[i+1].get_left(),
                                color=GRAY, buff=0.05, stroke_width=2)
                    self.play(GrowArrow(arr))
                self.wait(0.4)
            self.wait(tracker.duration - 5)

        # ── Example key material ───────────────────────────────────────────────
        with self.voiceover(
            "Here is what the actual key material looks like. The private key is a 32-byte hex "
            "string — this one is Ethereum founder Vitalik's well-known public address derived "
            "for illustration. The public key is a pair of 32-byte coordinates on the secp256k1 "
            "curve. The address is the last 20 bytes of the Keccak-256 hash of the public key. "
            "Hardware wallets like Ledger and Trezor store the private key inside a secure "
            "enclave chip. The signing computation happens inside the chip. The private key "
            "never leaves the hardware. This is why hardware wallets are the gold standard "
            "for self-custody."
        ) as tracker:
            example = VGroup(
                Text("k = 0xd4e56740f876aef8c010b86a40d5f56745a118d090...",
                     font_size=13, color=RED),
                Text("K = (0x50863AD64A87AE8A2FE83C1AF1A8403CB53F53E4...,\n"
                     "     0x64B6E9FAFEC7E83FF5EBC6B0B9D4...)",
                     font_size=13, color=GOLD, line_spacing=1.2),
                Text("Address = 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
                     font_size=13, color=TEAL),
            ).arrange(DOWN, aligned_edge=LEFT, buff=0.2).to_edge(DOWN, buff=1.2)
            self.play(LaggedStartMap(Write, example, lag_ratio=0.4))
            self.wait(tracker.duration - 2)

        # ── Transaction signing diagram ────────────────────────────────────────
        self.play(*[FadeOut(m) for m in self.mobjects if m != title])

        sign_title = Text("Transaction Signing — How It Works", font_size=26, color=WHITE)\
                      .shift(UP*1.8)
        self.play(Write(sign_title))

        sign_steps = [
            ("Hash Tx", r"\text{msg\_hash} = \text{Keccak256(rlp(tx))}", BLUE),
            ("Sign",    r"(r,s,v) = \text{ECDSA}(k,\, msg\_hash)",       GOLD),
            ("Verify",  r"\text{Recover pubkey} \to \text{derive address}", TEAL),
        ]

        s_group = VGroup()
        for name, form, col in sign_steps:
            box  = RoundedRectangle(width=4.0, height=1.5, corner_radius=0.15,
                                    fill_color=col, fill_opacity=0.1,
                                    stroke_color=col, stroke_width=1.5)
            nm   = Text(name, font_size=20, color=col).move_to(box).shift(UP*0.35)
            fm   = MathTex(form, font_size=20, color=WHITE).move_to(box).shift(DOWN*0.2)
            s_group.add(VGroup(box, nm, fm))

        s_group.arrange(DOWN, buff=0.35).shift(DOWN*0.2)

        with self.voiceover(
            "Transaction signing: when you sign a transaction, you hash the transaction data "
            "using Keccak-256. Then the ECDSA algorithm produces a signature triple r, s, v "
            "using your private key and the message hash. Anyone can verify the signature: "
            "using r, s, v, and the message hash, recover the public key, derive the address, "
            "and confirm it matches the sender. The private key never leaves your device — "
            "only the signature is broadcast to the network."
        ) as tracker:
            self.play(LaggedStartMap(FadeIn, s_group, lag_ratio=0.3))
            self.wait(0.5)
            security = Text(
                "Private key NEVER leaves your device — only the signature is broadcast",
                font_size=20, color=TEAL
            ).to_edge(DOWN, buff=0.35)
            self.play(Write(security))
            self.wait(tracker.duration - 3)

        # ── CTA ────────────────────────────────────────────────────────────────
        with self.voiceover(
            "Your Ethereum wallet is: one private key k, one public key K equals k times G, "
            "one address equal to the last 20 bytes of Keccak-256 of K. The security of the "
            "entire system rests on the hardness of the Elliptic Curve Discrete Logarithm "
            "Problem. Never store your private key or seed phrase digitally without encryption. "
            "Use hardware wallets for significant holdings. "
            "Next: The EVM Gas Model — why Ethereum transactions cost money, how EIP-1559 "
            "changed the fee market, and what it means for how you time your transactions. "
            "Subscribe. QuantiFire."
        ) as tracker:
            self.play(*[FadeOut(m) for m in self.mobjects], run_time=1)
            outro = Text("QuantiFire  |  EP 30", font_size=30, color=GOLD)
            self.play(FadeIn(outro))
            self.wait(tracker.duration - 1)

    def _step(self, title, desc, sub, color):
        box  = RoundedRectangle(width=3.5, height=3.5, corner_radius=0.2,
                                fill_color=color, fill_opacity=0.08,
                                stroke_color=color, stroke_width=1.5)
        t_t  = Text(title, font_size=20, color=color, line_spacing=1.2)\
                 .move_to(box).shift(UP*1.0)
        d_t  = Text(desc, font_size=16, color=WHITE, line_spacing=1.3)\
                 .move_to(box)
        s_t  = Text(sub, font_size=13, color=GRAY, line_spacing=1.2)\
                 .move_to(box).shift(DOWN*1.1)
        return VGroup(box, t_t, d_t, s_t)
