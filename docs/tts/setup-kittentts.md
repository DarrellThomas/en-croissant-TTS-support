# Setting Up KittenTTS

*Back to the [TTS Guide](../en/tts-guide.md)*

KittenTTS runs a neural TTS model directly on your machine. No cloud, no API keys, no data leaving your computer — and the voice quality is genuinely good. Setup takes about 5 minutes. **English only for now.**

## Hardware Requirements

KittenTTS uses PyTorch for neural network inference on your CPU. This means it needs real computing power:

| Hardware | Experience |
|----------|-----------|
| **8+ cores, modern CPU** (Ryzen 7, i7, Xeon) | Excellent. Speech generates quickly, minimal impact on other tasks |
| **4-6 cores** (Ryzen 5, i5) | Good. Noticeable CPU usage during generation but perfectly usable |
| **2 cores / older CPU** | Slow. Generation may take several seconds per utterance. Consider Google Cloud instead |

**CPU usage is temporary** — KittenTTS only uses CPU while actively generating speech (typically 1-2 seconds per utterance). Between utterances, CPU usage drops to near zero.

### Thread Management

By default, KittenTTS uses all available CPU cores for maximum speed. If you're also running a chess engine (like Stockfish), you may want to limit the threads KittenTTS uses.

In **Settings > Sound > KittenTTS CPU Threads**, set a value to cap thread usage. Set to 0 for automatic (use all cores). A good starting point for shared use with a chess engine is half your core count.

> **Tip:** KittenTTS and Stockfish both want CPU cores. If you're analyzing at full depth while KittenTTS generates speech, both will compete for CPU time. On a machine with 8+ cores, you'll rarely notice. On 4 cores, give KittenTTS 2 threads and leave the rest for the engine.

## Step 1: Install Dependencies

KittenTTS requires Python 3.10+ and a few Python packages. Choose one of these methods:

### Option A: In-App Setup Wizard (Recommended)

1. Open En Parlant~ and go to **Settings > Sound**
2. Set **TTS Provider** to **KittenTTS (English Only)**
3. If dependencies are missing, a yellow "Setup Guide" alert appears
4. Click the alert to open the setup wizard
5. The wizard walks you through each step with "Fix" buttons for automatic installation

### Option B: Terminal Setup Script

```bash
cd /path/to/en-parlant
./scripts/setup-tts.sh --kittentts
```

This creates a Python virtual environment and installs the required packages (kittentts, flask, soundfile, numpy). The nano model (~25MB) downloads from HuggingFace on first run.

### Option C: Manual Setup

```bash
cd /path/to/en-parlant/scripts
python3 -m venv .venv
.venv/bin/pip install kittentts flask soundfile numpy
```

## Step 2: Configure En Parlant~

1. Open En Parlant~ and go to **Settings** (gear icon) > **Sound** tab
2. Set **TTS Provider** to **KittenTTS (English Only)**
3. The server starts automatically when you select this provider
4. Wait a few seconds for the model to load (first run downloads from HuggingFace)
5. Choose a voice — there are 8 options (4 male, 4 female)
6. Click the **Test** button next to the voice selector

You should hear a chess move spoken aloud with natural, expressive AI speech.

## Troubleshooting

- **"Server not responding" error?** The KittenTTS server may not have started. Check the setup wizard in Settings — it shows dependency status and can auto-fix missing packages.
- **First run is slow?** The ~25MB nano model downloads from HuggingFace on first use. This is a one-time download. Subsequent starts take 2-5 seconds.
- **High CPU usage?** This is normal during speech generation. Reduce the thread count in Settings if it's impacting other tasks.
- **No sound?** Make sure Python 3.10+ is installed and the virtual environment was created successfully. The setup wizard can diagnose this.

## Voice Guide

KittenTTS offers 8 voices numbered 2-5, each in male and female variants. All voices are English with slightly different tonal qualities. Try a few to find the one you like best.

## Language Note

KittenTTS currently supports English only. For other languages, use ElevenLabs or Google Cloud. The TTS language setting is ignored when using KittenTTS — chess terms are always spoken in English.
