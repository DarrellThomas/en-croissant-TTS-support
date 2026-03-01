# En Parlant~ Project Principles

**Purpose:** This document extends [Universal Principles](01_UNIVERSAL_PRINCIPLES.md) with project-specific guidelines for En Parlant~.

---

## Project Identity

**Project Name:** En Parlant~
**Type:** Tool (desktop application)
**Primary Domain:** Chess study GUI with TTS narration
**License:** GPL-3.0
**Fork of:** [En Croissant](https://github.com/franciscoBSalgueiro/en-croissant) by Francisco Salgueiro

---

## 1. ARCHITECTURAL DECISIONS

### 1.1 System Boundaries

| Component | Responsibility | Owns Data? |
|-----------|---------------|------------|
| **Rust backend** (`src-tauri/`) | System access, database, engine management, IPC, local TTS server lifecycle | Yes (SQLite, files) |
| **React frontend** (`src/`) | UI rendering, state management, TTS audio pipeline, user interaction | Yes (localStorage, sessionStorage) |
| **Local TTS servers** (`scripts/`) | KittenTTS (Flask/PyTorch) and OpenTTS (Docker) speech synthesis | No (stateless) |

### 1.2 Data Flow

```
PGN Move Node
    → buildNarration() (frontend: SAN → spoken text)
    → speakText() (frontend: check cache → call provider API)
    → Audio playback (frontend: HTMLAudioElement)

For local providers:
    speakText() → Rust proxy (fetch_tts_audio, bypasses CORS)
        → localhost Flask/Docker server → WAV/MP3 response
```

### 1.3 External Dependencies

| Dependency | Purpose | Replaceable? |
|------------|---------|--------------|
| **Tauri v2** | Desktop app framework (Rust + webview) | No (core architecture) |
| **Mantine v8** | React UI component library | Yes (but deeply integrated) |
| **Jotai** | Simple atom-based state for settings/preferences | Yes |
| **Zustand** | Complex state for game trees and navigation | Yes |
| **chessops** | Chess logic, FEN/SAN parsing | Yes (but best-in-class) |
| **ElevenLabs API** | Premium cloud TTS | Yes (swappable provider) |
| **Google Cloud TTS API** | WaveNet cloud TTS | Yes (swappable provider) |
| **KittenTTS** | Local neural TTS (PyTorch) | Yes (swappable provider) |
| **OpenTTS** | Local Docker TTS | Yes (may be removed) |

---

## 2. TECHNOLOGY STACK PRINCIPLES

### 2.1 Language/Framework

- **Frontend:** TypeScript + React 19
- **Backend:** Rust (Tauri v2)
- **Build:** Vite 7 (requires Node.js 22+)
- **Rationale:** Inherited from En Croissant. Tauri gives native performance with web UI. Rust handles system access safely.

### 2.2 Project-Specific Conventions

- **pnpm only** — npm breaks vanillaExtract at runtime (white screen, no error)
- **Biome** for formatting and linting — not Prettier, not ESLint
- **Always** `pnpm format && pnpm lint:fix` before committing
- **File naming:** kebab-case for utilities, PascalCase for React components
- **State:** Jotai atoms for simple persisted settings, Zustand stores for complex game state
- **All TTS atoms use `getOnInit: true`** — required because `tts.ts` reads imperatively via `store.get()` before React subscribes

### 2.3 Dependency Management

- **Package manager:** pnpm (non-negotiable)
- **Version pinning:** Caret ranges (`^`) in package.json, lockfile pins exact versions
- **Update cadence:** Pull upstream periodically for bugfixes; update dependencies when something breaks or a security advisory lands

---

## 3. DOMAIN-SPECIFIC RULES

### 3.1 Chess Domain Constraints

- SAN notation must be parsed correctly for all piece types, disambiguation, captures, checks, castling, promotion
- Move numbers with dots (`6...Bf5`) must not produce "dot dot dot" in speech — convert to comma pauses
- NAG annotations (`!`, `??`, `!?`) must not duplicate when comment text repeats the quality word
- `[%eval]`, `[%cal]`, `[%csl]` PGN tags must be stripped before TTS, never spoken aloud
- Piece-on-square references in comments (`Ra8 is hanging`) must expand to "Rook on a8 is hanging"

### 3.2 TTS Provider Constraints

- **ElevenLabs audio cannot be bundled** with redistributed builds (TOS non-sublicensable vs GPL-3.0)
- **Google Cloud audio CAN be bundled** (customer retains all IP rights on output)
- **KittenTTS/OpenTTS/System** audio has no redistribution restrictions
- Cache keys must include `provider:voiceId:lang:text` — switching any of these produces separate cache entries
- Speed adjustment is client-side (playbackRate), never re-synthesized — doesn't invalidate cache

### 3.3 Security Principles

- **No telemetry.** The settings page says "We do not collect any telemetry data." The code must match this claim. Always.
- **API keys in localStorage only.** Never transmitted except to the provider's own API endpoint. Never logged. Never included in error reports.
- **Local TTS servers bind to localhost only.** No network exposure.

---

## 4. TESTING STRATEGY

### 4.1 Current State (honest)

Testing is thin. The upstream project has a small vitest suite; the TTS feature has no automated tests. This is a known gap.

### 4.2 What Must Be Tested

- [ ] `sanToSpoken()` — SAN to spoken text conversion across all languages
- [ ] `cleanCommentForTTS()` — PGN tag stripping, inline SAN expansion, deduplication
- [ ] `buildNarration()` — assembly of move + annotation + comment
- [ ] Chess vocabulary mapping for all 8 languages
- [ ] Cache key generation (provider:voiceId:lang:text)

### 4.3 What May Skip Tests

- UI components (visual, better tested manually)
- Provider API calls (external services, better tested with integration tests)
- Rust backend commands (tested via Tauri's own framework)

---

## 5. ERROR HANDLING STRATEGY

### 5.1 Error Categories

| Category | Handling | Example |
|----------|----------|---------|
| TTS provider failure | Retry once for local servers (2s delay), skip silently for cloud | Server not started, API key expired |
| Network failure | Log warning, TTS degrades gracefully (no audio, no crash) | Offline, DNS failure |
| Invalid PGN | Parse what you can, skip what you can't | Malformed annotations |
| Missing dependency | Show setup wizard with "Fix" buttons | Python not installed, Docker not running |

### 5.2 Logging

- **Tauri log plugin** via `@tauri-apps/plugin-log`
- **Log levels:** `info` for startup/lifecycle, `warn` for recoverable failures, `error` for things that need attention
- **Never log:** API keys, audio content, user PGN data

### 5.3 Recovery

- **Stale TTS requests:** Generation counter + AbortController. Rapid navigation cancels in-flight requests; only the latest plays.
- **Local server crash:** Status indicator in settings. User can restart manually. Server auto-starts when provider is selected.

---

## 6. PERFORMANCE PRINCIPLES

### 6.1 TTS Latency Budgets

| Operation | Target | Max Acceptable |
|-----------|--------|----------------|
| Cache hit playback | Instant (<50ms) | 100ms |
| Cloud TTS generation | 500ms | 2s |
| KittenTTS generation (8+ cores) | 1s | 3s |
| KittenTTS generation (4 cores) | 2s | 5s |

### 6.2 Resource Constraints

- **KittenTTS threads:** Configurable via settings. Default 0 (auto = all cores). Recommend capping at half core count when running alongside Stockfish.
- **Audio cache:** In-memory only. Blob URLs revoked on clear. No persistent disk cache.
- **Precache:** Background generation of entire game tree. Must not block UI or current playback.

---

## 7. DEPLOYMENT & OPERATIONS

### 7.1 Build

```bash
pnpm install          # dependencies (never npm)
pnpm tauri build --no-bundle   # standalone binary
sudo ./install.sh     # system install (Linux)
```

### 7.2 Distribution

- Binary named `en-parlant`
- Resources to `/usr/lib/en-parlant/`
- Desktop entry with `StartupWMClass=en-parlant`
- Close app before overwriting binary ("Text file busy")
- After moving source directories: `cargo clean`

### 7.3 Data Migration

- Old data dir: `~/.local/share/org.encroissant.app/`
- New data dir: `~/.local/share/org.enparlant.app/`
- Migrate with `cp -a`. Symlinks to large databases survive.

---

## 8. AGENT MAINTAINABILITY

### 8.1 Documentation

- [x] README with setup instructions
- [x] Architecture document (`ARCHITECTURE.md`)
- [x] Claude workflow document (`docs/claude-workflow.md`)
- [x] Persistent memory file (MEMORY.md)
- [x] TTS technical documentation (`docs/tts/tts-readme.md`)

### 8.2 Context Preservation

- Memory file carries project knowledge across sessions
- Build gotchas documented (pnpm, getOnInit, CSS coordinate fix)
- Fork relationship and upstream status documented
- Decision log lives in commit messages and this file

### 8.3 Key Knowledge for Agents

Things an AI agent must know to work on this codebase without breaking it:

- **pnpm only.** npm will produce a working build that white-screens at runtime.
- **All TTS atoms need `getOnInit: true`.** Without it, `tts.ts` reads undefined on first access.
- **The chessground coordinate fix is CSS-side** (`chessgroundBaseOverride.css`), not a library fork.
- **Rust backend recreates subdirs on startup.** Symlinks survive this.
- **The app overwrites PGN annotations when opened.** Use database import, not file open.

---

## 9. PROJECT-SPECIFIC CODE SMELLS

- TTS atom without `getOnInit: true` — will silently read default values instead of localStorage
- Hardcoded provider URLs — should come from atoms/settings
- Audio not cleaning up blob URLs — memory leak over long sessions
- Chess notation handling that doesn't account for disambiguation (`Rae1` vs `Re1`)
- PGN tag stripping that misses nested brackets

---

## 10. DEFINITION OF DONE

A feature is complete when:

- [x] Code follows Universal Principles (timeless ones strictly, contextual ones with judgment)
- [x] Code follows these Project Principles
- [ ] Tests written for pure logic functions (TTS text processing, chess notation)
- [x] Documentation updated (TTS readme, guides, workflow doc)
- [x] `pnpm format && pnpm lint:fix` passes
- [x] Builds successfully with `pnpm tauri build --no-bundle`
- [x] Manually tested in the running app
- [x] Committed with `Co-Authored-By` attribution

---

*Last Updated: 2026-03-01*
*Maintainer: Darrell + Claude Code*
