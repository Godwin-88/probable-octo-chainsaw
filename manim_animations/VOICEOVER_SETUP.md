# QuantiFire — AI Voiceover Setup Guide
## Produce full episodes with zero face-cam and zero your own voice

---

## How it works

`manim-voiceover` is the official Manim Community extension.
It calls a Text-to-Speech (TTS) service, saves audio files, and **syncs each
animation to its voiceover line automatically** — so you never need a
microphone, recording booth, or video editor.

---

## TTS Service Options

| Service | Quality | Cost | Best For |
|---------|---------|------|----------|
| **ElevenLabs** | Excellent (human-like) | ~$5/mo | Channel uploads |
| **Azure Cognitive** | Very good | Free 500K chars/mo | High volume |
| **OpenAI TTS** | Very good | $0.015/1K chars | Quick setup |
| **gTTS (Google)** | Good | Free, unlimited | Testing |
| **Coqui TTS** | Good | Free, local, offline | Privacy |

**Recommended: ElevenLabs** for the final channel voice. Use **gTTS** free
while developing.

---

## Installation

```bash
# Core library
pip install manim-voiceover

# Pick your TTS backend (install what you need):
pip install manim-voiceover[gtts]        # Free Google TTS
pip install manim-voiceover[azure]       # Azure Cognitive
pip install manim-voiceover[openai]      # OpenAI TTS
pip install manim-voiceover[elevenlabs]  # ElevenLabs (best quality)
pip install manim-voiceover[coqui]       # Local, offline Coqui

# Also needed for audio processing
pip install pydub
# On Windows you also need ffmpeg in PATH
```

---

## Choosing your ElevenLabs voice

1. Go to elevenlabs.io → sign up (free tier: 10,000 chars/mo)
2. Pick a voice from the Voice Library — suggested for QuantiFire:
   - **Adam** — deep, authoritative (finance presenter feel)
   - **Antoni** — clear, professional
   - **Josh** — energetic, younger feel
3. Copy your API key from Profile → API Keys

---

## Environment Variables

Create a `.env` file in `manim_animations/`:

```bash
# ElevenLabs
ELEVEN_API_KEY=your_elevenlabs_api_key
ELEVEN_VOICE_ID=pNInz6obpgDQGcFmaJgB   # Adam voice ID

# Azure (alternative)
AZURE_SUBSCRIPTION_KEY=your_key
AZURE_SERVICE_REGION=eastus

# OpenAI (alternative)
OPENAI_API_KEY=your_key
```

---

## Quick Pattern (used in all 36 scripts)

```python
from manim import *
from manim_voiceover import VoiceoverScene
from manim_voiceover.services.elevenlabs import ElevenLabsService
# or: from manim_voiceover.services.gtts import GTTSService  ← free

class MyScene(VoiceoverScene):
    def construct(self):
        # Set your TTS service once at the top
        self.set_speech_service(
            ElevenLabsService(
                voice_id="pNInz6obpgDQGcFmaJgB",   # Adam
                model="eleven_turbo_v2"
            )
            # GTTSService(lang="en")  ← swap to this for free testing
        )

        title = Text("My Title", color="#FFB700")

        # Voiceover block — animation runs for EXACTLY as long as the speech
        with self.voiceover("Welcome to QuantiFire. Today we cover...") as tracker:
            self.play(Write(title), run_time=tracker.duration)

        with self.voiceover("The portfolio variance formula is...") as tracker:
            formula = MathTex(r"\sigma^2_p = w^\top \Sigma w")
            self.play(Write(formula), run_time=tracker.duration)
```

`tracker.duration` = the exact length of the generated audio clip.
Manim stretches or compresses the animation to match it perfectly.

---

## Rendering with voiceover

```bash
# Low quality preview (fast, with audio)
manim -pql ep01_correlation.py CorrelationScene

# High quality for upload
manim -pqh ep01_correlation.py CorrelationScene

# The output video at media/videos/ep01.../CorrelationScene.mp4
# will have audio embedded — ready to upload directly to YouTube.
```

---

## Switching TTS service (one line change)

In every script, the service is set in `construct()` at line ~10.
To switch from gTTS to ElevenLabs across all files:

```bash
# In manim_animations/ directory:
sed -i 's/GTTSService(lang="en")/ElevenLabsService(voice_id="pNInz6obpgDQGcFmaJgB", model="eleven_turbo_v2")/g' ep*.py
sed -i 's/from manim_voiceover.services.gtts import GTTSService/from manim_voiceover.services.elevenlabs import ElevenLabsService/g' ep*.py
```

---

## Audio caching

`manim-voiceover` caches every TTS clip in `media/voiceovers/`.
If you re-render without changing the voiceover text, no new API call is made —
instant re-render. Only changed lines trigger new synthesis.

---

## No video editor needed

The rendered `.mp4` contains:
- Animated visuals (Manim)
- AI voiceover (ElevenLabs / gTTS)
- Background music (optional — see `batch_render.py`)

Upload directly to YouTube. Add chapters, description, and thumbnail only.
