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
    <a href="TTS-GUIDE.md">TTS Setup Guide</a>
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

## Building from source

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

## Credits

En Parlant~ is built on [En Croissant](https://github.com/franciscoBSalgueiro/en-croissant) by [Francisco Salgueiro](https://github.com/franciscoBSalgueiro). The original project and community can be found at [encroissant.org](https://www.encroissant.org).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

GPL-3.0 — same as upstream En Croissant.
