# Setting Up OpenTTS

*Back to the [TTS Guide](tts-guide.md)*

OpenTTS is an open-source TTS server that runs on your own computer using Docker. No account, no API key, no data leaving your machine. Setup takes about 2 minutes if you already have Docker installed.

> **Note:** OpenTTS uses older neural and rule-based engines. Voice quality is functional but noticeably more robotic than ElevenLabs, Google Cloud, or KittenTTS. It may be removed in a future release if better local options emerge.

## Step 1: Install Docker

If you don't have Docker yet:

- **Linux (Ubuntu/Debian):** `sudo apt install docker.io`
- **Linux (Fedora):** `sudo dnf install docker`
- **macOS / Windows:** Download [Docker Desktop](https://www.docker.com/products/docker-desktop/)

## Step 2: Start the OpenTTS Server

Open a terminal and run:

```bash
docker run -d -p 5500:5500 --name opentts synesthesiam/opentts:en
```

This downloads the English voice pack (~1.5 GB on first run) and starts the server in the background. It runs until you stop it.

### Other Languages

Other language packs are available: `de`, `fr`, `es`, `ru`, `nl`, `sv`, `it`, and more. For all languages (larger download):

```bash
docker run -d -p 5500:5500 --name opentts synesthesiam/opentts:all
```

> **CJK Warning:** OpenTTS works best with European languages. Japanese, Chinese, and Korean text will not be pronounced correctly. For CJK languages, use ElevenLabs or Google Cloud instead.

## Step 3: Configure En Parlant~

1. Open En Parlant~ and go to **Settings** (gear icon) > **Sound** tab
2. Scroll down to the TTS section
3. Set **TTS Provider** to **OpenTTS (Self-Hosted)**
4. Confirm the **OpenTTS Server URL** is `http://localhost:5500`
5. The **TTS Voice** dropdown will populate with available voices. Try a **larynx** voice (like `harvard`) for the best quality
6. Set **Text-to-Speech** to **On**
7. Click the **Test** button next to the voice selector

You should hear a chess move spoken aloud.

## Voice Quality Guide

Voices come from several engines bundled in OpenTTS. From best to most basic:

1. **Larynx** — neural, most natural sounding
2. **Coqui-TTS** — neural, multi-speaker
3. **MaryTTS** — Java-based, decent quality
4. **Festival** — traditional synthesis
5. **eSpeak** — robotic but fast

The voice dropdown shows the engine name in parentheses so you can pick accordingly.

## Managing the Server

The OpenTTS container runs in the background. Common commands:

```bash
# Stop the server
docker stop opentts

# Start it again
docker start opentts

# Remove it entirely
docker rm -f opentts

# Check if it's running
docker ps | grep opentts
```

## Troubleshooting

- **"Connection refused" error?** The Docker container may not be running. Run `docker ps` to check. If it's not listed, start it with `docker start opentts` or re-run the `docker run` command from Step 2.
- **No voices in dropdown?** Make sure the container is running and accessible at `http://localhost:5500`. You can test by opening that URL in your browser — you should see the OpenTTS web interface.
- **Voices sound very robotic?** Try switching to a Larynx voice — they're the highest quality option in OpenTTS. If you want better quality overall, consider upgrading to KittenTTS, Google Cloud, or ElevenLabs.
