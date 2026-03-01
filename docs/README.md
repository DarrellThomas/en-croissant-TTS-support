# En Parlant~ Documentation

## What is En Parlant~?

En Parlant~ is an open-source, cross-platform chess GUI that aims to be powerful, customizable and easy to use. It functions as a chess database and analysis tool, bridging the user experience of online chess websites with the powerful features only a desktop application can offer.

### Key Features

- **Analyze** — Store and analyze your games from lichess.org and chess.com with top engines
- **Database** — Manage your games with a powerful database system
- **Repertoire** — Prepare your openings with the integrated explorer
- **Easy Management** — Simple engine and database installation and management directly within the app

## Documentation Index

### Introduction
- [Getting Started](getting-started.md)

### Guides
- [Analyze Game](guides/analyze-game.md)
- [Manage Repertoire](guides/manage-repertoire.md)
- [Configure Engines](guides/configure-engines.md)

### Assets
- [Databases](assets/databases.md)
- [Engines](assets/engines.md)

### Reference
- [Database Format](reference/database-format.md)

### Architecture
- [Under the Hood](en/architecture.md) — available in 8 languages via the in-app language selector

### TTS (Text-to-Speech)
- [TTS Overview](tts/tts-readme.md)
- [TTS Setup Guide](en/tts-guide.md) — available in 8 languages via the in-app language selector

### TTS Provider Setup Guides
- [ElevenLabs Setup](tts/setup-elevenlabs.md)
- [Google Cloud Setup](tts/setup-google.md)
- [KittenTTS Setup](tts/setup-kittentts.md)
- [System TTS Setup](tts/setup-system.md)
- [OpenTTS Setup](tts/setup-opentts.md)

### About AI
- [A Note from Darrell](en/ai-note.md) — why this project exists and what AI-assisted development means
- [AI Workflow](en/ai-workflow.md) — deep-dive into what working with a coding AI actually looks like
- [Claude Code Workflow](claude-workflow.md) — the technical cockpit: what the AI knows, how sessions work

## Attribution

En Parlant~ is a fork of [En Croissant](https://www.encroissant.org), created by [Francisco Salgueiro](https://github.com/franciscoBSalgueiro). Francisco built an exceptional open-source chess platform — powerful, thoughtfully designed, and freely available under the GPL-3.0 license. This fork exists because of his work and generosity. The core application, database system, analysis engine, repertoire trainer, and all the features documented here are his creation. We are deeply grateful for the foundation he built.

The TTS (Text-to-Speech) narration feature was developed by Darrell at [Red Shed](https://redshed.ai), with the help of [Claude Code](https://www.anthropic.com/claude-code).

## License

This project is licensed under the GPL-3.0, same as the original En Croissant. See the full [LICENSE](LICENSE) file.

## Links

- **This fork:** <https://github.com/DarrellThomas/en-parlant>
- **Original En Croissant:** <https://www.encroissant.org>
- **Francisco's GitHub:** <https://github.com/franciscoBSalgueiro/en-croissant>
