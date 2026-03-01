# Text-to-Speech Narration Guide

*This guide is also available in:
[Francais](TTS-GUIDE-fr.md) |
[Espanol](TTS-GUIDE-es.md) |
[Deutsch](TTS-GUIDE-de.md) |
[日本語](TTS-GUIDE-ja.md) |
[Русский](TTS-GUIDE-ru.md) |
[中文](TTS-GUIDE-zh.md) |
[한국어](TTS-GUIDE-ko.md)*

## Why TTS Changes How You Study Chess

When you're reviewing an annotated game, your eyes are doing double duty. You're trying to follow the pieces on the board *and* read the commentary at the same time. Your gaze bounces between the board and the annotation panel, and every time it does, you lose the position for a split second. You have to re-find the pieces, re-trace the lines, re-build the picture in your head.

Text-to-speech fixes this completely.

With TTS enabled, you step through a game and the annotations are *spoken to you*. Your eyes stay on the board. You watch the knight land on f3 while a voice tells you why it's a strong developing move. You see the pawn structure shift while the commentary explains the strategic idea behind it. The board and the words arrive together, the way a coach sitting across from you would teach.

This is especially powerful for:

- **Opening study** — hear the ideas behind each move while you watch the position develop
- **Game review** — step through your own annotated games and absorb the lessons naturally
- **Endgame practice** — keep your focus on the critical squares while the commentary guides you
- **Language immersion** — study chess in French, German, Spanish, Russian, Japanese, Chinese, or Korean with all chess terms properly translated. Hear "Cavalier f3, echec" instead of "Knight f3, check." Learn the game in the language you think in.
- **Accessibility** — for players who find it easier to listen than to read, or who want to study away from a desk

Once you try it, going back to silent annotations feels like watching a movie on mute.

## Choosing a Provider

En Parlant~ ships with five TTS providers. They range from zero-setup OS-native speech to premium cloud AI voices, with local ML models in between. You only need one provider to get started. Pick whichever suits you best.

|                        | System (OS Native)            | KittenTTS (Local AI)             | Google Cloud                  | ElevenLabs                    | OpenTTS (Docker)                   |
|------------------------|-------------------------------|----------------------------------|-------------------------------|-------------------------------|------------------------------------|
| **Cost**               | Free, unlimited               | Free, unlimited                  | Free (1M chars/month)         | Free (10K chars/month)        | Free, unlimited                    |
| **Voice quality**      | Basic (OS voices)             | Very good (neural AI)            | Very good (WaveNet neural)    | Excellent (premium AI)        | Functional (older neural/rule)     |
| **Voice selection**    | OS-dependent                  | 8 voices (4 male, 4 female)     | Male or Female per language   | Dozens of unique characters   | 75+ voices across engines          |
| **Languages**          | OS-dependent                  | English only                     | 8 languages, excellent CJK    | 8 languages, excellent CJK    | European languages best            |
| **Requires internet**  | No                            | No (runs locally)                | Yes (Google servers)          | Yes (ElevenLabs servers)      | No (runs locally)                  |
| **Requires API key**   | No                            | No                               | Yes                           | Yes                           | No                                 |
| **Setup difficulty**   | None                          | Moderate (Python + ML model)     | Moderate (Cloud Console)      | Easy (simple sign-up)         | Easy (one Docker command)          |
| **Hardware needs**     | Minimal                       | Modern CPU (see below)           | Minimal                       | Minimal                       | Minimal                            |
| **Best for**           | Quick test / basic use        | Best local quality               | Most users                    | Voice quality enthusiasts     | Privacy / offline (many voices)    |

### How they work

**System (OS Native)** uses your operating system's built-in speech synthesis. On Linux this is typically eSpeak or speech-dispatcher; on macOS it's the system voice; on Windows it's SAPI. There's nothing to install, no API keys, no servers to run. Just select it and go. The voice quality is basic — you'll hear the characteristic robotic tone of OS-level TTS — but it's perfect for quickly testing that TTS works, or if you just want functional narration with zero setup.

**KittenTTS (Local AI)** is a lightweight neural text-to-speech model that runs entirely on your machine. It uses a ~25MB "nano" model from HuggingFace with 8 expressive voices (4 male, 4 female). The quality is remarkably good for a local model — natural intonation, clear pronunciation, and genuine expressiveness. The trade-off is hardware: KittenTTS uses PyTorch for inference and will consume significant CPU resources during speech generation. On a modern multi-core machine it sounds great. On an older laptop, you may notice lag or high CPU usage. English only for now. **See the hardware requirements section below.**

**Google Cloud TTS** sends your text to Google's servers, which use WaveNet neural networks to generate natural-sounding speech. The audio comes back as an MP3 file. Google's free tier is generous — one million characters per month covers hundreds of annotated games. You need a Google Cloud account and an API key, but no credit card charges unless you exceed the free tier (which is very hard to do with chess annotations).

**ElevenLabs** is a premium AI voice platform. Your text goes to their servers and comes back as high-quality audio with expressive, human-like intonation. The voices have real personality — some sound like audiobook narrators, others like broadcasters. The free tier is small (10,000 characters — enough for 2-5 games), but the paid plans are affordable ($5/month for 30K characters). Setup is simple: sign up, copy your API key, and go.

**OpenTTS** is an open-source server that you run on your own computer using Docker. Nothing leaves your machine — all speech generation happens locally. It bundles several TTS engines (Larynx, Festival, eSpeak, Coqui-TTS, and others), giving you 75+ voices for English alone. The trade-off is voice quality: these are older neural and rule-based engines, so the output sounds more robotic than Google or ElevenLabs. OpenTTS also works best with European languages — CJK characters (Japanese, Chinese, Korean) are not well supported by its English-trained voices. But if you want free, unlimited, offline TTS with no API keys and no data leaving your machine, OpenTTS delivers.

**Our recommendation:** Start with **Google Cloud** if you want the best balance of quality, language support, and ease of use. The free tier covers hundreds of games per month. If you want high-quality local TTS with no cloud dependency and have a modern multi-core CPU, **KittenTTS** is excellent. For the absolute richest voice quality, try **ElevenLabs**. For zero-setup testing, **System TTS** works instantly. For maximum privacy with many voice options, **OpenTTS** runs everything locally via Docker.

## Setting Up Google Cloud TTS

This walkthrough takes about 5 minutes. You'll need a Google account (the same one you use for Gmail or YouTube works fine).

### Step 1: Sign in to Google Cloud Console

1. Open your browser and go to **[console.cloud.google.com](https://console.cloud.google.com/)**
2. Sign in with your Google account
3. If this is your first time, Google will ask you to agree to the Terms of Service. Check the box and click **Agree and Continue**

You should now see the Google Cloud Console dashboard. It looks busy — don't worry, we only need two things from here.

### Step 2: Set up billing

Google requires a billing account even for their free tier. **You will not be charged** unless you exceed 1 million characters in a month (that's very hard to do with chess annotations). Google shows you a warning well before that happens.

1. In the top search bar, type **"Billing"** and click **Billing** in the dropdown
2. Click **Link a billing account** (or **Create account** if you don't have one yet)
3. Follow the prompts to add a credit card or debit card
4. Once complete, you'll see a green checkmark next to your billing account

> **Note:** If you already have Google Cloud billing set up from another project, you can skip this step. Your existing billing account works fine.

### Step 3: Enable the Text-to-Speech API

This tells Google which service you want to use.

1. In the top search bar, type **"Text-to-Speech"**
2. In the dropdown results, click **Cloud Text-to-Speech API** (it has a blue API icon)
3. You'll land on the API details page. Click the big blue **Enable** button
4. Wait a few seconds. When the button changes to **Manage**, the API is enabled

### Step 4: Create an API key

The API key is what En Parlant~ uses to talk to Google's servers.

1. In the top search bar, type **"Credentials"** and click **Credentials** under "APIs & Services"
2. Near the top of the page, click **+ Create Credentials**
3. From the dropdown, select **API key**
4. A dialog pops up showing your new key. It looks something like: `AIzaSyC...about 35 characters...`
5. **Click the copy icon** next to the key to copy it to your clipboard
6. Click **Close**

> **Recommended: Restrict your key.** After creating the key, you'll see it listed on the Credentials page. Click the key name to open its settings. Under **API restrictions**, select **Restrict key**, then choose **Cloud Text-to-Speech API** from the dropdown and click **Save**. This means even if someone gets your key, they can only use it for TTS — nothing else.

### Step 5: Configure En Parlant~

Almost there!

1. Open En Parlant~ and go to **Settings** (gear icon) > **Sound** tab
2. Scroll down to the TTS section
3. Set **TTS Provider** to **Google Cloud**
4. Click inside the **Google Cloud API Key** field and paste your key (Ctrl+V)
5. Set **Text-to-Speech** to **On**
6. Click the **Test** button next to the voice selector

You should hear a chess move spoken aloud. If you do — congratulations, you're set up!

> **Troubleshooting:** If the test is silent, double-check that (1) you pasted the full API key, (2) the Text-to-Speech API is enabled (Step 3), and (3) billing is linked (Step 2). The most common issue is forgetting to enable the API.

## Setting Up ElevenLabs

ElevenLabs is simpler to set up but has a smaller free tier (10,000 characters/month — enough for a few games to try it out).

### Step 1: Create an account

1. Open your browser and go to **[elevenlabs.io](https://elevenlabs.io/)**
2. Click **Sign Up** in the top right
3. You can sign up with Google, GitHub, or email — pick whatever's easiest
4. After signing up, you'll land on the ElevenLabs dashboard

### Step 2: Get your API key

1. In the bottom-left corner of the dashboard, click your **profile icon** (or your name)
2. Click **Profile + API key**
3. You'll see an API key section. Click **Reveal** to show your key, or **Generate** if you don't have one yet
4. The key looks like: `sk_...about 30 characters...`
5. **Click the copy icon** to copy it to your clipboard

### Step 3: Configure En Parlant~

1. Open En Parlant~ and go to **Settings** (gear icon) > **Sound** tab
2. Scroll down to the TTS section
3. Set **TTS Provider** to **ElevenLabs**
4. Click inside the **ElevenLabs API Key** field and paste your key (Ctrl+V)
5. The **TTS Voice** dropdown will populate with your available voices. **Adam** is a great default — clear, natural, and works well for chess commentary
6. Set **Text-to-Speech** to **On**
7. Click the **Test** button next to the voice selector

You should hear a chess move spoken aloud.

> **About the free tier:** ElevenLabs gives you 10,000 characters/month on the free plan. A typical annotated game uses 2,000-4,000 characters, so you can review 2-5 games per month for free. If you find TTS valuable, their Starter plan at $5/month (30,000 characters) is a solid upgrade. The Pro plan ($22/month, 100,000 characters) covers heavy use.

## Setting Up OpenTTS (Self-Hosted)

OpenTTS runs on your own machine using Docker. No account, no API key, no data leaving your computer. Setup takes about 2 minutes if you already have Docker installed.

### Step 1: Install Docker

If you don't have Docker yet:

- **Linux:** `sudo apt install docker.io` (Ubuntu/Debian) or `sudo dnf install docker` (Fedora)
- **macOS/Windows:** Download [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Step 2: Start the OpenTTS server

Open a terminal and run:

```bash
docker run -d -p 5500:5500 --name opentts synesthesiam/opentts:en
```

This downloads the English voice pack (~1.5 GB on first run) and starts the server in the background. It will keep running until you stop it.

Other language packs are available: `de`, `fr`, `es`, `ru`, `nl`, `sv`, `it`, and more. Use `synesthesiam/opentts:all` for every language (larger download). For example:

```bash
docker run -d -p 5500:5500 --name opentts synesthesiam/opentts:all
```

### Step 3: Configure En Parlant~

1. Open En Parlant~ and go to **Settings** (gear icon) > **Sound** tab
2. Scroll down to the TTS section
3. Set **TTS Provider** to **OpenTTS (Self-Hosted)**
4. Confirm the **OpenTTS Server URL** is `http://localhost:5500`
5. The **TTS Voice** dropdown will populate with available voices from your server. Try a **larynx** voice (like `harvard`) for the best quality, or browse the list — there are 75+ options
6. Set **Text-to-Speech** to **On**
7. Click the **Test** button next to the voice selector

You should hear a chess move spoken aloud.

> **Voice quality guide:** Voices are provided by several engines bundled in OpenTTS. From best to most basic: **Larynx** (neural, most natural), **Coqui-TTS** (neural, multi-speaker), **MaryTTS** (Java-based, decent), **Festival** (traditional), **eSpeak** (robotic but fast). The voice dropdown shows the engine name in parentheses so you can pick accordingly.

> **Managing the server:** The OpenTTS container runs in the background. To stop it: `docker stop opentts`. To start it again: `docker start opentts`. To remove it entirely: `docker rm -f opentts`.

> **Note on CJK languages:** OpenTTS works best with European languages. Japanese, Chinese, and Korean text will not be pronounced correctly by the English-trained voices. For CJK languages, use Google Cloud or ElevenLabs instead.

## Setting Up KittenTTS (Local AI)

KittenTTS runs a neural TTS model directly on your machine. No cloud, no API keys, no data leaving your computer — and the voice quality is genuinely good. Setup takes about 5 minutes.

### Hardware Requirements

KittenTTS uses PyTorch for neural network inference on your CPU. This means it needs real computing power:

| Hardware | Experience |
|----------|-----------|
| **8+ cores, modern CPU** (Ryzen 7, i7, Xeon) | Excellent. Speech generates quickly, minimal impact on other tasks |
| **4-6 cores** (Ryzen 5, i5) | Good. Noticeable CPU usage during generation but perfectly usable |
| **2 cores / older CPU** | Slow. Generation may take several seconds per utterance. Consider Google Cloud instead |

**CPU usage is temporary** — KittenTTS only uses CPU while actively generating speech (typically 1-2 seconds per utterance). Between utterances, CPU usage drops to near zero.

**Thread management:** By default, KittenTTS uses all available CPU cores for maximum generation speed. If you're also running a chess engine (like Stockfish), you may want to limit the threads KittenTTS uses. In **Settings > Sound > KittenTTS CPU Threads**, set a value to cap thread usage. Set to 0 for automatic (use all cores). A good starting point for shared use with a chess engine is half your core count.

> **Important:** KittenTTS and a chess engine like Stockfish both want CPU cores. If you're analyzing a position with Stockfish at full depth while KittenTTS is generating speech, both will compete for CPU time. The thread setting lets you balance this. On a machine with 8+ cores, you'll rarely notice. On a 4-core machine, you may want to give KittenTTS 2 threads and leave the rest for the engine.

### Step 1: Install dependencies

KittenTTS requires Python 3.10+ and a few Python packages. You can set this up two ways:

**Option A: In-app setup wizard (recommended)**

1. Open En Parlant~ and go to **Settings > Sound**
2. Set **TTS Provider** to **KittenTTS (English Only)**
3. If dependencies are missing, a yellow "Setup Guide" alert appears
4. Click the alert to open the setup wizard
5. The wizard walks you through each step with "Fix" buttons for automatic installation

**Option B: Terminal setup script**

```bash
cd /path/to/en-parlant
./scripts/setup-tts.sh --kittentts
```

This creates a Python virtual environment and installs the required packages (kittentts, flask, soundfile, numpy). The nano model (~25MB) downloads from HuggingFace on first run.

**Option C: Manual setup**

```bash
cd /path/to/en-parlant/scripts
python3 -m venv .venv
.venv/bin/pip install kittentts flask soundfile numpy
```

### Step 2: Configure En Parlant~

1. Open En Parlant~ and go to **Settings** (gear icon) > **Sound** tab
2. Set **TTS Provider** to **KittenTTS (English Only)**
3. The server starts automatically when you select this provider
4. Wait a few seconds for the model to load (first run downloads from HuggingFace)
5. Choose a voice — there are 8 options (4 male, 4 female)
6. Click the **Test** button next to the voice selector

You should hear a chess move spoken aloud with natural, expressive AI speech.

> **First run:** The first time you use KittenTTS, the ~25MB nano model downloads from HuggingFace. This is a one-time download. Subsequent starts are faster (typically 2-5 seconds to load the model into memory).

> **Voice guide:** KittenTTS offers 8 voices numbered 2-5, each in male and female variants. All voices are English and have slightly different tonal qualities. Try a few to find the one you like best.

> **English only:** KittenTTS currently supports English only. For other languages, use Google Cloud or ElevenLabs. The TTS language setting is ignored when using KittenTTS — chess terms are always spoken in English.

## Setting Up System TTS (OS Native)

System TTS uses your operating system's built-in speech synthesis. There is nothing to install.

### Configure En Parlant~

1. Open En Parlant~ and go to **Settings** (gear icon) > **Sound** tab
2. Set **TTS Provider** to **System (OS Native)**
3. The voice dropdown shows all voices available on your system
4. Click the **Test** button to preview

That's it. System TTS works immediately with no setup.

> **Voice quality:** System voices vary by OS. macOS voices tend to be the most natural. Linux voices (typically eSpeak or Festival via speech-dispatcher) are more robotic. Windows SAPI voices fall somewhere in between. If you find the quality too basic, upgrade to KittenTTS (local) or Google Cloud.

> **Language support:** Available languages depend on your OS and installed voice packs. On Linux, you can install additional voices: `sudo apt install espeak-ng-data-*` for more languages.

## Settings Reference

All TTS settings are in **Settings > Sound**:

| Setting                  | What it does                                                                  |
|--------------------------|-------------------------------------------------------------------------------|
| **Text-to-Speech**       | Master on/off switch for all TTS features                                     |
| **Auto-Narrate on Move** | Automatically speak annotations when you step through moves with arrow keys   |
| **TTS Provider**         | Switch between System, KittenTTS, Google Cloud, ElevenLabs, and OpenTTS       |
| **TTS Setup**            | Dependency status for KittenTTS/OpenTTS with setup wizard link (appears when needed) |
| **ElevenLabs API Key**   | Your ElevenLabs API key (only needed if using ElevenLabs)                     |
| **Google Cloud API Key** | Your Google Cloud API key (only needed if using Google)                        |
| **KittenTTS Server URL** | URL of the KittenTTS server (default: http://localhost:8192)                  |
| **KittenTTS CPU Threads**| Number of CPU threads for KittenTTS inference (0 = auto / use all cores)      |
| **OpenTTS Server URL**   | URL of your OpenTTS server (default: http://localhost:5500)                   |
| **TTS Voice**            | Provider-specific voice selection (varies by provider)                         |
| **TTS Language**         | Language for narration — chess terms are translated automatically (cloud providers) |
| **TTS Volume**           | How loud the narration plays                                                  |
| **TTS Speed**            | Playback speed (0.5x to 2x) — adjusts instantly without re-generating audio   |
| **TTS Audio Cache**      | Clear cached audio to force re-generation (useful after editing annotations)  |

## Supported Languages

TTS narration currently supports eight languages with fully translated chess vocabulary:

| Language           | Chess example                                      |
|--------------------|-----------------------------------------------------|
| **English**        | Knight f3, check. A strong developing move.         |
| **Francais**       | Cavalier f3, echec. Un coup de developpement fort.  |
| **Espanol**        | Caballo f3, jaque. Un fuerte movimiento.            |
| **Deutsch**        | Springer f3, Schach. Ein starker Entwicklungszug.   |
| **日本語**          | ナイト f3、チェック。強い展開の手。                      |
| **Русский**        | Конь f3, шах. Сильный развивающий ход.              |
| **中文**            | 马 f3，将军。一步控制中心的强力出子。                    |
| **한국어**          | 나이트 f3, 체크. 중앙을 지배하는 강력한 전개 수.          |

Every chess term — piece names, "check", "checkmate", "castles", "takes", move quality annotations like "Brilliant move" and "Blunder" — is spoken in the selected language. Comments in your PGN files are spoken as written, so annotate your games in the language you want to hear.

## Tips for the Best Experience

- **Use Auto-Narrate.** Turn on "Auto-Narrate on Move" and just use your arrow keys to step through games. The commentary arrives naturally as you move, like having a coach at your shoulder.

- **Annotate your own games.** TTS really shines when you're listening to commentary on *your* games. Annotate your games, then step through them with narration. Hearing "Grabbing the pawn looks tempting, but your entire kingside is still asleep" while staring at the position hits different than reading it.

- **Try different speeds.** Some players like 1x for careful study, others prefer 1.3x for faster review. The speed slider adjusts playback in real-time without using additional API characters — the audio is generated once and played back faster.

- **Use the speaker icon.** Every comment in the move list has a small speaker icon. Click it to hear just that one annotation without stepping through the whole game.

- **Switch languages to learn chess vocabulary.** If you're studying chess in a second language, set the TTS language to match. You'll naturally pick up terms like "Cavalier" (Knight), "echec" (check), and "mat" (checkmate) just by listening.

## About This Feature

En Croissant is an open-source chess study tool created by [Francisco Salgueiro](https://github.com/franciscoBSalgueiro). Francisco built something genuinely special — a free, powerful, community-driven platform for studying chess — and released it under the GPL-3.0 license so that anyone can use it, improve it, and share it. This TTS feature exists because of that generosity. We're grateful for the foundation he built, and we're proud to contribute back to it.

The TTS plugin was developed by Darrell at [Red Shed](mailto:darrell@redshed.ai), with the help of [Claude Code](https://claude.ai/claude-code). Five providers, multi-language support, translated chess vocabulary across eight languages, local AI inference, dependency management — built from source, tested by hand, and contributed with care.

That's the beauty of open source. Someone builds something great. Someone else adds to it. Everyone benefits.

## Get in Touch

We're excited about this feature and we'd love to hear how it's working for you. Comments, suggestions, and feedback are always welcome.

- **Want a language we don't support yet?** Let us know — we can add new languages quickly.
- **Found a bug?** Tell us and we'll fix it fast.
- **Have an idea for another TTS provider?** We're happy to add it.
- **Just want to say it's working?** That's great to hear too.

Open an issue here on GitHub, or reach out directly at **[darrell@redshed.ai](mailto:darrell@redshed.ai)**.
