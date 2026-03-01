**English** | [Français](../fr/tts-guide.md) | [Español](../es/tts-guide.md) | [Deutsch](../de/tts-guide.md) | [日本語](../ja/tts-guide.md) | [Русский](../ru/tts-guide.md) | [中文](../zh/tts-guide.md) | [한국어](../ko/tts-guide.md)

# Text-to-Speech Narration Guide

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

En Parlant~ ships with five TTS providers. You only need one to get started. Pick whichever suits you best.

### ElevenLabs

The best voice quality available. ElevenLabs produces expressive, human-like speech with real personality — some voices sound like audiobook narrators, others like broadcasters. Dozens of unique voices to choose from. Supports all eight languages with excellent CJK pronunciation.

The free tier gives you 10,000 characters per month (enough for 2-5 annotated games). Paid plans start at $5/month for 30,000 characters. Setup is simple: create an account, copy your API key, paste it into En Parlant~.

Requires internet. Best for voice quality enthusiasts.

**[ElevenLabs Setup Guide](../tts/setup-elevenlabs.md)**

### Google Cloud TTS

The best balance of quality, language support, and value. Google's WaveNet neural voices sound natural and clear across all eight languages. The free tier is generous — one million characters per month covers hundreds of annotated games.

Setup takes about 5 minutes: create a Google Cloud account, enable the Text-to-Speech API, generate an API key. No charges unless you exceed the free tier (very hard to do with chess annotations).

Requires internet. Best for most users.

**[Google Cloud Setup Guide](../tts/setup-google.md)**

### KittenTTS

High-quality local AI that runs entirely on your machine. Uses a lightweight ~25MB neural model with 8 expressive voices (4 male, 4 female). The quality is remarkably good — natural intonation, clear pronunciation, genuine expressiveness.

The trade-off is hardware: KittenTTS uses PyTorch for CPU inference, so it needs a modern multi-core processor. On an 8-core machine it sounds great; on an older laptop you may notice lag. English only for now.

The first time each annotation is spoken there's a brief generation delay (1-2 seconds on a fast CPU, longer on slower hardware). After that, the audio is cached in memory and replays instantly — stepping backward and forward through moves you've already heard has zero lag. You can also precache an entire game in the background from settings, so every annotation is ready before you start studying.

No internet required. No API keys. Best local quality.

**[KittenTTS Setup Guide](../tts/setup-kittentts.md)**

### System TTS

Your operating system's built-in speech synthesis. Nothing to install, no API keys, no servers. Select it and go. The voice quality is basic — you'll hear the characteristic robotic tone of OS-level TTS — but it works instantly with zero setup.

On Linux this is typically eSpeak or speech-dispatcher; on macOS it's the system voice; on Windows it's SAPI.

No internet required. Best for quick testing.

**[System TTS Setup Guide](../tts/setup-system.md)**

### OpenTTS

An open-source TTS server that runs on your machine via Docker. Nothing leaves your computer. Bundles several TTS engines (Larynx, Festival, eSpeak, Coqui-TTS), giving you 75+ voices for English alone.

The trade-off is voice quality: these are older neural and rule-based engines, so the output sounds more robotic than ElevenLabs or Google. Works best with European languages — CJK is not well supported. OpenTTS may be removed in a future release if better local options emerge.

No internet required. No API keys. Best for maximum privacy with many voice options.

**[OpenTTS Setup Guide](../tts/setup-opentts.md)**

### Our Recommendation

Start with **ElevenLabs** if you want the richest voice quality — the free tier is enough to try it out. For the best balance of quality and free usage, **Google Cloud** covers hundreds of games per month. For high-quality local TTS with no cloud dependency, **KittenTTS** is excellent if you have a modern CPU. For zero-setup testing, **System TTS** works instantly. For maximum privacy with many voice options, **OpenTTS** runs everything locally via Docker.

## Settings Reference

All TTS settings are in **Settings > Sound**:

| Setting | What it does |
|---------|-------------|
| **Text-to-Speech** | Master on/off switch for all TTS features |
| **Auto-Narrate on Move** | Automatically speak annotations when you step through moves |
| **TTS Provider** | Switch between the five providers |
| **TTS Voice** | Provider-specific voice selection |
| **TTS Language** | Language for narration — chess terms are translated automatically |
| **TTS Volume** | How loud the narration plays |
| **TTS Speed** | Playback speed (0.5x to 2x) — adjusts without re-generating audio |
| **ElevenLabs API Key** | Your ElevenLabs API key (only shown when using ElevenLabs) |
| **Google Cloud API Key** | Your Google Cloud API key (only shown when using Google) |
| **KittenTTS CPU Threads** | CPU threads for inference (0 = auto / use all cores) |
| **TTS Audio Cache** | Clear cached audio to force re-generation |

## Supported Languages

TTS narration supports eight languages with fully translated chess vocabulary:

| Language | Chess example |
|----------|--------------|
| **English** | Knight f3, check. A strong developing move. |
| **Francais** | Cavalier f3, echec. Un coup de developpement fort. |
| **Espanol** | Caballo f3, jaque. Un fuerte movimiento. |
| **Deutsch** | Springer f3, Schach. Ein starker Entwicklungszug. |
| **日本語** | ナイト f3、チェック。強い展開の手。 |
| **Русский** | Конь f3, шах. Сильный развивающий ход. |
| **中文** | 马 f3，将军。一步控制中心的强力出子。 |
| **한국어** | 나이트 f3, 체크. 중앙을 지배하는 강력한 전개 수. |

Every chess term — piece names, "check", "checkmate", "castles", "takes", move quality annotations like "Brilliant move" and "Blunder" — is spoken in the selected language. Comments in your PGN files are spoken as written, so annotate your games in the language you want to hear.

## Tips for the Best Experience

- **Use Auto-Narrate.** Turn on "Auto-Narrate on Move" and just use your arrow keys to step through games. The commentary arrives naturally as you move, like having a coach at your shoulder.

- **Annotate your own games.** TTS really shines when you're listening to commentary on *your* games. Annotate your games, then step through them with narration. Hearing "Grabbing the pawn looks tempting, but your entire kingside is still asleep" while staring at the position hits different than reading it.

- **Try different speeds.** Some players like 1x for careful study, others prefer 1.3x for faster review. The speed slider adjusts playback in real-time without using additional API characters.

- **Use the speaker icon.** Every comment in the move list has a small speaker icon. Click it to hear just that one annotation.

- **Switch languages to learn chess vocabulary.** If you're studying chess in a second language, set the TTS language to match. You'll naturally pick up terms like "Cavalier" (Knight), "echec" (check), and "mat" (checkmate) just by listening.

## About This Feature

En Croissant is an open-source chess study tool created by [Francisco Salgueiro](https://github.com/franciscoBSalgueiro). Francisco built something genuinely special — a free, powerful, community-driven platform for studying chess — and released it under the GPL-3.0 license so that anyone can use it, improve it, and share it. This TTS feature exists because of that generosity. We're grateful for the foundation he built, and we're proud to contribute back to it.

The TTS plugin was developed by Darrell at [Red Shed](https://redshed.ai), with the help of [Claude Code](https://www.anthropic.com/claude-code). Five providers, multi-language support, translated chess vocabulary across eight languages, local AI inference, dependency management — built from source, tested by hand, and contributed with care.

We used AI to help build this. [Read about that here](ai-note.md).

That's the beauty of open source. Someone builds something great. Someone else adds to it. Everyone benefits.

## Get in Touch

We'd love to hear how TTS is working for you. Comments, suggestions, and feedback are always welcome.

- **Want a language we don't support yet?** Let us know — we can add new languages quickly.
- **Found a bug?** Tell us and we'll fix it fast.
- **Have an idea for another TTS provider?** We're happy to add it.
- **Just want to say it's working?** That's great to hear too.

Open an issue on [GitHub](https://github.com/DarrellThomas/en-parlant), or reach out directly at **[darrell@redshed.ai](mailto:darrell@redshed.ai)**.
