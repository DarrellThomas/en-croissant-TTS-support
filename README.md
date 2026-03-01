<br />
<div align="center">
  <img width="115" height="115" src="src-tauri/icons/icon.png" alt="En Parlant~ Logo">

<h3 align="center">En Parlant~</h3>

  <p align="center">
    A TTS fork of <a href="https://github.com/franciscoBSalgueiro/en-croissant">En Croissant</a> — The Ultimate Chess Toolkit
    <br />
    <br />
    <a href="docs/README.md">Documentation</a>
    ·
    <a href="docs/en/tts-guide.md">Full TTS Guide</a>
    ·
    <a href="https://github.com/DarrellThomas/en-parlant/issues">Report a Bug</a>
  </p>
</div>

En Parlant~ ("speaking" in French) adds text-to-speech narration to [En Croissant](https://www.encroissant.org), the open-source, cross-platform chess GUI. Hear moves announced as you step through games, with multi-language support and multiple TTS providers.

## Features

Everything in En Croissant, plus:

- **Move narration** — moves spoken aloud as you navigate through games
- **Auto-narrate** — TTS triggers automatically on each move
- **Multiple TTS providers** — ElevenLabs, Google Cloud, KittenTTS (local), OpenTTS (local), or system TTS
- **Multi-language** — English, French, Spanish, German, Japanese, Russian, Chinese, Korean
- **Chess vocabulary** — SAN notation converted to natural spoken language per locale
- **Audio cache** — previously synthesized moves are replayed instantly

### From En Croissant

- Store and analyze your games from [lichess.org](https://lichess.org) and [chess.com](https://chess.com)
- Multi-engine analysis with all UCI engines
- Prepare a repertoire and train it with spaced repetition
- Simple engine and database installation and management
- Absolute or partial position search in the database

## TTS Providers at a Glance

| Provider | Cost | Quality | Languages | Offline | Setup |
|----------|------|---------|-----------|---------|-------|
| **ElevenLabs** | Free tier (10K chars/mo) | Exceptional | 8 languages | No | API key |
| **Google Cloud** | Free tier (1M chars/mo) | Very good | 8 languages | No | API key |
| **KittenTTS** | Free | Good | English only | Yes | Python + model |
| **System (OS Native)** | Free | Passable | OS-dependent | Yes | None |
| **OpenTTS** | Free | Poor | European best | Yes | Docker |

> **Hardware note:** The local providers (KittenTTS and OpenTTS) run neural inference on your CPU. They need a modern multi-core processor (8+ cores recommended) to generate speech without noticeable lag.

For a detailed comparison and full setup walkthroughs, see the [TTS Guide](docs/en/tts-guide.md).

## Quick Start: KittenTTS (Local AI)

KittenTTS runs a neural TTS model entirely on your machine — no cloud, no API keys, no data leaving your computer. English only, but the voice quality is genuinely good. Requires Python 3.10+ and a modern multi-core CPU.

**Option A: In-app setup wizard**

1. Go to **Settings > Sound** and set **TTS Provider** to **KittenTTS (English Only)**
2. A yellow "Setup Guide" alert appears if dependencies are missing
3. Click the alert — the wizard walks you through installation with "Fix" buttons

**Option B: Terminal**

```bash
cd /path/to/en-parlant/scripts
python3 -m venv .venv
.venv/bin/pip install kittentts flask soundfile numpy
```

The ~25MB nano model downloads from HuggingFace automatically on first run.

**Configure:**

1. **Settings > Sound > TTS Provider** → KittenTTS (English Only)
2. The server starts automatically when you select the provider
3. Choose a voice (8 options: 4 male, 4 female)
4. Click **Test** to preview

**Thread management:** KittenTTS uses PyTorch and can consume significant CPU. If you're also running a chess engine like Stockfish, set **KittenTTS CPU Threads** in Settings to limit usage (e.g., half your core count). Set to 0 for automatic.

## Quick Start: OpenTTS (Docker)

OpenTTS is a self-hosted TTS server that runs locally via Docker. 75+ voices, no API keys, nothing leaves your machine.

**Start the server:**

```bash
# English voices (~1.5 GB download on first run)
docker run -d -p 5500:5500 --name opentts synesthesiam/opentts:en

# All languages (larger download)
docker run -d -p 5500:5500 --name opentts synesthesiam/opentts:all
```

**Configure:**

1. **Settings > Sound > TTS Provider** → OpenTTS (Self-Hosted)
2. Confirm **OpenTTS Server URL** is `http://localhost:5500`
3. The voice dropdown populates from the server — try a **larynx** voice for best quality
4. Click **Test** to preview

**Manage the server:**

```bash
docker stop opentts     # stop
docker start opentts    # restart
docker rm -f opentts    # remove entirely
```

Note: OpenTTS works best with European languages. For Japanese, Chinese, or Korean, use Google Cloud or ElevenLabs instead.

## Quick Start: Google Cloud TTS

Google's WaveNet voices sound natural and support all 8 languages. The free tier (1M characters/month) covers hundreds of annotated games.

1. Enable the **Cloud Text-to-Speech API** in [Google Cloud Console](https://console.cloud.google.com/)
2. Create an API key under **APIs & Services > Credentials**
3. In En Parlant~: **Settings > Sound > TTS Provider** → Google Cloud
4. Paste your API key and click **Test**

See the [full walkthrough](docs/tts/setup-google.md) for step-by-step instructions.

## Quick Start: ElevenLabs

Premium AI voices with the most natural intonation. Free tier is 10K characters/month (~2-5 annotated games).

1. Sign up at [elevenlabs.io](https://elevenlabs.io/) and copy your API key from **Profile > API key**
2. In En Parlant~: **Settings > Sound > TTS Provider** → ElevenLabs
3. Paste your API key — the voice dropdown populates with your available voices
4. Click **Test** to preview

## Quick Start: System TTS

Zero setup — uses your OS built-in speech synthesis.

1. **Settings > Sound > TTS Provider** → System (OS Native)
2. Pick a voice from the dropdown and click **Test**

Quality varies by OS (macOS best, Linux most robotic). Good for a quick test before setting up a better provider.

## Building from Source

Requires Node.js 22+, pnpm, and Rust. See the [Tauri v2 prerequisites](https://v2.tauri.app/start/prerequisites/).

```bash
git clone https://github.com/DarrellThomas/en-parlant
cd en-parlant
pnpm install
pnpm tauri build --no-bundle
```

The binary will be at `src-tauri/target/release/en-parlant`.

To install system-wide (Linux):

```bash
sudo ./install.sh
```

This installs the binary to `/usr/bin/en-parlant`, resources to `/usr/lib/en-parlant/`, and creates a desktop entry.

## Credits

En Parlant~ is built on [En Croissant](https://github.com/franciscoBSalgueiro/en-croissant) by [Francisco Salgueiro](https://github.com/franciscoBSalgueiro). The original project and community can be found at [encroissant.org](https://www.encroissant.org).

TTS narration developed by Darrell at [Red Shed](https://redshed.ai) (darrell@redshed.ai) with [Claude Code](https://claude.ai/claude-code).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

GPL-3.0 — same as upstream En Croissant.
