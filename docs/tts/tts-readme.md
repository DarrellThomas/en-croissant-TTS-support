# Text-to-Speech Narration for Chess Annotations

This fork adds **TTS narration** to En Parlant~, turning annotated PGN files into spoken chess lessons. Step through any game and hear every comment read aloud with correct chess pronunciation.

Built for studying annotated master games and reviewing your own game debriefs without staring at the screen.

## Providers

En Parlant~ supports five TTS providers:

| Provider | Type | Quality | Setup | Languages |
|----------|------|---------|-------|-----------|
| **ElevenLabs** | Cloud API | Exceptional | API key | 8 languages |
| **Google Cloud** | Cloud API | Very good (WaveNet) | API key | 8 languages |
| **KittenTTS** | Local neural AI | Good | Python + venv | English only |
| **System (OS Native)** | OS built-in | Passable | None | OS-dependent |
| **OpenTTS** | Local Docker | Poor | Docker | European best |

> **Hardware note:** The local providers (KittenTTS and OpenTTS) run neural inference on your CPU. They need a modern multi-core processor (8+ cores recommended) to generate speech without noticeable lag. If your machine is older or low-power, use one of the cloud providers instead.

See the [TTS Guide](../en/tts-guide.md) for detailed setup instructions for each provider.

## What It Does

Load any PGN with annotations, press forward through the moves, and hear:

- **Move narration**: "14, Rook e3. Good move." (move number + spoken SAN + annotation quality)
- **Comment narration**: Full commentary read aloud with chess terms pronounced correctly
- **Automatic playback**: Audio triggers as you step through moves, or click the speaker icon on any comment to hear it on demand

### Chess-Aware Text Preprocessing

The TTS engine doesn't just read raw text -- it understands chess notation:

| Written in PGN | Spoken aloud |
|-----------------|-------------|
| `Nf3` | "Knight f3" |
| `Bxe6+` | "Bishop takes e6, check" |
| `O-O-O` | "castles queenside" |
| `e8=Q#` | "e8 promotes to Queen, checkmate" |
| `Rae1` | "Rook a e1" (disambiguation) |
| `5.Qxd8+` (in comments) | "5, Queen takes d8, check" |
| `en prise` | "on preez" (French pronunciation) |
| `Ra8 is hanging` | "Rook on a8 is hanging" |
| `R vs R` | "Rook versus Rook" |
| `6...Bf5` (move number dots) | "6, Bishop f5" (natural pause, no "dot") |

Comments are cleaned before speaking: `[%eval]`, `[%cal]`, `[%csl]` tags are stripped. Leading quality words that duplicate the NAG symbol are removed (so `?? {BLUNDER. The rook hangs}` doesn't stutter "Blunder. Blunder.").

### Caching

Every narration is cached in memory after the first generation. Stepping backward and forward through a game replays instantly from cache -- no API calls. You can also precache an entire game tree in the background so there are zero pauses during playback.

The cache is keyed by `provider:voiceId:lang:text`, so changing the voice or provider creates separate cache entries. Changing playback speed does **not** invalidate the cache (speed is applied client-side).

A **Clear Audio Cache** button in Settings lets you force re-generation after editing annotations.

## KittenTTS Hardware Requirements

KittenTTS runs a PyTorch neural network on your CPU. This is real ML inference, and it uses real computing power.

### CPU Usage

During speech generation (typically 1-2 seconds per utterance), KittenTTS will use multiple CPU cores at high utilization. Between utterances, CPU usage drops to near zero. This is normal behavior for neural TTS inference.

| Hardware | Experience |
|----------|-----------|
| **8+ cores** (Ryzen 7/9, i7/i9, Xeon, Apple M-series) | Excellent. Fast generation, minimal impact on other tasks |
| **4-6 cores** (Ryzen 5, i5) | Good. Noticeable CPU spike during generation but usable |
| **2 cores / older CPU** | Slow. Several seconds per utterance. Consider Google Cloud instead |

### Thread Management

By default, KittenTTS uses all available CPU cores (via PyTorch's default thread count). If you're running a chess engine like Stockfish simultaneously, both will compete for CPU time.

**Settings > Sound > KittenTTS CPU Threads** lets you cap the number of threads KittenTTS uses:
- **0 (default):** Automatic — PyTorch uses all available cores
- **1-4:** Conservative — good for machines also running a chess engine
- **Half your core count:** A reasonable balance for shared use

The thread setting is passed to PyTorch's `torch.set_num_threads()` at server startup. Changing it requires restarting the KittenTTS server (stop and start again in settings).

### Memory

The KittenTTS nano model uses approximately 100-200MB of RAM when loaded. The Python server process itself adds another ~50MB. Total memory footprint is modest.

### First Run

On first launch, KittenTTS downloads the nano model (~25MB) from HuggingFace. This is a one-time download. Subsequent starts load the model from disk in 2-5 seconds.

## Dependency Management

KittenTTS and OpenTTS require external dependencies (Python packages and Docker, respectively). En Parlant~ includes three layers of dependency management:

### In-App Setup Wizard

When you select KittenTTS or OpenTTS as your provider, the app automatically checks for required dependencies. If anything is missing, a yellow alert appears with a "Setup Guide" button that opens a step-by-step wizard.

The wizard shows each dependency as a step:
- Green checkmark = installed
- Red X = missing, with a "Fix" button or terminal command to install
- "Re-check All" button after fixing things externally

**KittenTTS wizard steps:**
1. Python 3.10+ installed
2. Virtual environment created
3. Python packages installed (kittentts, flask, soundfile, numpy)
4. Server script present

**OpenTTS wizard steps:**
1. Docker installed
2. Docker daemon running
3. OpenTTS Docker image pulled

### Setup Script

A standalone bash script is available for terminal users:

```bash
./scripts/setup-tts.sh --check       # Show status of all dependencies
./scripts/setup-tts.sh --kittentts   # Set up KittenTTS (venv + packages)
./scripts/setup-tts.sh --opentts     # Pull OpenTTS Docker image
./scripts/setup-tts.sh --all         # Set up everything
```

The script is idempotent (safe to run multiple times) and does not use sudo.

### Auto-Start

When you select KittenTTS or OpenTTS as your provider and all dependencies are satisfied, the server starts automatically. A status indicator in settings shows whether the server is running. The server stops when you switch to a different provider or close the app.

## Architecture

The TTS system is implemented as self-contained modules plus small integration hooks:

```
src/
  utils/
    tts.ts                          # Core engine
      - sanToSpoken()               # SAN -> spoken text (multi-language)
      - cleanCommentForTTS()        # Strip PGN tags, expand inline SAN, apply chess vocab
      - buildNarration()            # Assemble move + annotation + comment into one utterance
      - speakText()                 # TTS API call with caching + retry for local servers
      - precacheGame()              # Background precache entire game tree
      - clearAudioCache()           # Revoke blob URLs and reset cache
  components/
    settings/
      TTSSettings.tsx               # UI components for all providers
      TTSSetupWizard.tsx            # Dependency check wizard (KittenTTS + OpenTTS)

src-tauri/src/
  tts_servers.rs                    # Rust backend for local server management
    - fetch_tts_audio()             # Proxy localhost requests (bypasses browser CORS)
    - kittentts_start/stop()        # Python server lifecycle
    - opentts_start/stop()          # Docker container lifecycle
    - check_*/setup_*()             # Dependency detection and installation

scripts/
  kittentts-server.py              # Flask HTTP wrapper around KittenTTS library
  setup-tts.sh                     # Standalone dependency setup script
```

### Integration Points (minimal changes to existing code)

| File | Change |
|------|--------|
| `src/state/atoms.ts` | TTS setting atoms (provider, API keys, voice, volume, speed, language, threads, server status) |
| `src/components/settings/SettingsPage.tsx` | Settings entries in Sound tab |
| `src/state/store/tree.ts` | Auto-narrate on move navigation, stop on go-back |
| `src/components/common/Comment.tsx` | Speaker icon button when TTS enabled |

### Audio Pipeline

```
PGN Move Node
    |
    v
buildNarration(san, comment, annotations, halfMoves)
    |
    +-- sanToSpoken(san)              # "Nf3+" -> "Knight f3, check"
    +-- annotationsToSpoken(["!"])    # "Good move."
    +-- cleanCommentForTTS(comment)
            |
            +-- strip [%eval], [%cal], [%csl] tags
            +-- strip leading quality words (BLUNDER, EXCELLENT, etc.)
            +-- expandInlineSAN()     # "5.Qxd8+" -> "5, Queen takes d8, check"
            +-- deduplicate move numbers in lists
            +-- applyChessVocab()     # "en prise" -> "on preez", "Ra8 is" -> "Rook on a8 is"
    |
    v
"14, Rook e3.  Good move.  Blocks the e-file and attacks the queen."
    |
    v
speakText(narration)
    |
    +-- check audioCache (provider:voiceId:lang:text -> blob URL)
    |       |
    |       +-- [HIT]  -> play from cache instantly
    |       +-- [MISS] -> call provider API -> cache blob URL -> play
    |
    +-- [local server retry] -> if kittentts/opentts, retry once after 2s on failure
    |
    v
HTMLAudioElement.play()
    volume = ttsVolumeAtom
    playbackRate = ttsSpeedAtom
```

### Stale Request Handling

Rapid navigation (holding the arrow key) generates many requests. A generation counter ensures only the latest request plays:

1. Each `speakText()` call increments `requestGeneration`
2. In-flight API requests are aborted via `AbortController`
3. When a response arrives, it checks if its generation matches current -- stale responses are silently discarded
4. Any currently playing audio is stopped before the new one starts

This means you can scrub through a game quickly without audio piling up or playing out of order.

## Provider API Details

### ElevenLabs
- **Model**: `eleven_turbo_v2_5` (fast, good quality)
- **Default voice**: Adam (`pNInz6obpgDQGcFmaJgB`)
- **Voice settings**: stability 0.5, similarity_boost 0.75, style 0.0, speaker_boost on
- **Audio format**: MP3 (audio/mpeg)

### Google Cloud
- **API**: Cloud Text-to-Speech v1
- **Voice type**: WaveNet (neural)
- **Audio format**: MP3 (audio/mpeg)
- **Voice selection**: Automatic per language + gender (male/female setting)

### KittenTTS
- **Model**: nano (~25MB, downloads from HuggingFace on first run)
- **Server**: Flask HTTP on localhost:8192
- **Audio format**: WAV (audio/wav)
- **Voices**: 8 expressive voices (expr-voice-2 through expr-voice-5, male and female)
- **Inference**: PyTorch CPU, configurable thread count

### OpenTTS
- **Server**: Docker container on localhost:5500
- **Image**: `synesthesiam/opentts:en` (~1.5GB)
- **Engines**: Larynx, Coqui-TTS, MaryTTS, Festival, eSpeak
- **Audio format**: WAV (audio/wav)

### System TTS
- **API**: Web Speech API (`speechSynthesis`)
- **Voices**: OS-dependent
- **Audio format**: Direct playback (no file)

## Writing TTS-Friendly Annotations

These guidelines produce the best spoken narration:

### SAN in comments
Use standard SAN notation. The preprocessor expands it:
- `"After 7.Nf3, White controls e5"` -> "After 7, Knight f3, White controls e5"
- `"The Bg5 pins the knight"` -> "The Bishop g5 pins the knight"

### Annotation symbols
The NAG glyph (`!`, `??`, `!?`, etc.) generates spoken quality words automatically. Don't duplicate them in the comment:
- Bad: `?? {BLUNDER. A terrible move...}`  (TTS says "Blunder. Blunder. A terrible move")
- Good: `?? {A terrible move...}` (TTS says "Blunder. A terrible move")

### Move number dots
Standard PGN notation works: `6...Bf5`. The preprocessor converts dots to commas for natural pauses instead of "dot dot dot."

### Periods for pacing
Periods create natural TTS pauses. Use them between distinct ideas:
```
{Doubled isolated e-pawns. The f-file is ripped open. The position is strategically won.}
```

### Arrows and circles
`[%cal ...]` and `[%csl ...]` tags are stripped from audio automatically. Use them freely for visual annotations without affecting narration.

## Compatibility

This feature is purely additive. When TTS is disabled (the default), the app behaves identically to upstream En Croissant. No existing functionality is modified.

The TTS atoms persist to localStorage, so settings survive app restarts. The audio cache is in-memory only and clears on restart.

## License

Same as En Croissant: GPL-3.0.

Note on audio licensing: ElevenLabs audio cannot be bundled with redistributed builds (TOS non-sublicensable vs GPL-3.0). Google Cloud audio CAN be bundled (customer retains all IP rights on output). KittenTTS, OpenTTS, and System TTS audio have no redistribution restrictions.
