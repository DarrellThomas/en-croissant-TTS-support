# En Parlant~ Architecture Primer

**App Version:** v0.1.1 (fork: DarrellThomas/en-parlant)
**Stack:** Tauri v2 (Rust) + React 19 (TypeScript) + Vite

---

## What Is Tauri?

Tauri is a framework for building desktop apps. Instead of shipping a full browser like Electron does, Tauri uses the OS's built-in webview for the UI and a Rust process for the backend. The result is a small, fast binary.

The two halves communicate over IPC (inter-process communication):

```
+---------------------------+       IPC        +---------------------------+
|       Rust Backend        | <--------------> |    React/TS Frontend      |
|                           |   (commands +    |                           |
|  - Chess engines (UCI)    |    events)       |  - Chessboard UI          |
|  - SQLite database        |                  |  - Analysis panels        |
|  - File I/O               |                  |  - Settings               |
|  - PGN parsing            |                  |  - Game tree navigation   |
|  - Position search index  |                  |  - TTS narration          |
+---------------------------+                  +---------------------------+
        src-tauri/src/                                   src/
```

---

## The Rust Side: src-tauri/src/

Rust handles everything that needs to be fast or needs system access.

### Entry Point: main.rs

Registers ~50 commands that the frontend can call, initializes plugins (filesystem, dialog, HTTP, shell, logging, updater), and starts the app window.

Commands are defined with a macro:

```rust
#[tauri::command]
async fn get_best_moves(id: String, engine: String, ...) -> Result<...> {
    // spawn UCI engine, return analysis
}
```

The `specta` crate auto-generates TypeScript type definitions from these Rust functions, so the frontend gets full type safety with zero manual effort.

### Key Modules

| Module | What It Does |
|--------|-------------|
| `db/mod.rs` | SQLite database via Diesel ORM — game queries, player stats, imports, position search |
| `game.rs` | Live game engine — manages engine-vs-human and engine-vs-engine games, time controls, move validation |
| `chess.rs` | Engine analysis — spawns UCI engines, streams best-move results back to frontend via events |
| `engine/` | UCI protocol implementation — process spawning, stdin/stdout pipes, multi-PV support |
| `pgn.rs` | PGN file reading/writing/tokenizing |
| `opening.rs` | Opening name lookup from FEN (binary data baked into the app) |
| `puzzle.rs` | Lichess puzzle database — memory-mapped random access |
| `fs.rs` | File downloads with resume, executable permission setting |
| `sound.rs` | Local HTTP server for audio streaming (Linux audio workaround) |
| `tts.rs` | System TTS via speech-dispatcher (Linux) / native OS speech APIs, plus KittenTTS server management |
| `oauth.rs` | OAuth2 flow for Lichess/Chess.com account linking |

### Design Patterns

- **Async everywhere:** Tokio runtime, non-blocking I/O
- **Concurrent state:** `DashMap` (concurrent HashMap) for engine processes, DB connections, caches
- **Connection pooling:** r2d2 manages SQLite connection pools
- **Memory-mapped search:** Position lookup via mmap'd binary index for instant results
- **Event streaming:** Rust emits events (best moves, clock ticks, game over) that React listens to in real-time

---

## The React/TypeScript Side: src/

### Build Pipeline: Vite

`vite.config.ts` configures:
- **React plugin** with Babel compiler
- **TanStack Router plugin** — auto-generates route tree from the `routes/` folder
- **Vanilla Extract** — zero-runtime CSS-in-JS
- **Path alias:** `@` maps to `./src`
- **Dev server** on port 1420

Build flow:
```
pnpm dev   → Vite on :1420 + Tauri opens webview pointing to it
pnpm build → tsc (typecheck) → vite build (bundle to dist/) → tauri build (native binary)
```

### Entry: App.tsx

The root component:
- Initializes Tauri plugins (log, process, updater)
- Loads user preferences from persistent atoms
- Sets up Mantine UI theme
- Registers the router
- Checks for app updates

### State Management

**Jotai atoms** (`src/state/atoms.ts`) — lightweight reactive state:

| Category | Examples |
|----------|---------|
| Tabs | `tabsAtom`, `activeTabAtom` (multi-document interface) |
| Directories | `storedDocumentDirAtom`, `storedDatabasesDirAtom` |
| UI prefs | `primaryColorAtom`, `fontSizeAtom`, `pieceSetAtom` |
| Engine | `engineMovesFamily`, `engineProgressFamily` (per-tab via atomFamily) |
| TTS | `ttsEnabledAtom`, `ttsProviderAtom`, `ttsVoiceIdAtom`, `ttsVolumeAtom`, `ttsSpeedAtom`, `ttsLanguageAtom` |

Atoms with `atomWithStorage()` persist to localStorage automatically.

**Zustand stores** for complex domain state:
- `src/state/store/tree.ts` — game tree navigation, move branching, annotations, comments. Uses Immer for immutable updates.
- `src/state/store/database.ts` — database view filters, selected game, pagination

### Routing: TanStack Router

File-based routing in `src/routes/`:
```
routes/
  __root.tsx          # Root layout (AppShell, menu bar)
  index.tsx           # Home/dashboard
  databases/          # Database browsing
  accounts.tsx        # Lichess/Chess.com accounts
  settings.tsx        # App preferences
  engines.tsx         # Engine management
```

### Components: src/components/

| Group | Purpose |
|-------|---------|
| `boards/` | Chessboard (chessground), move input, eval bar, analysis display, promotion modal, arrow drawing |
| `panels/` | Side panels: engine analysis (BestMoves), database position search, annotation editing, game info, practice mode |
| `databases/` | Database UI: game table, player table, detail cards, filtering |
| `settings/` | Preference forms, engine paths, TTS settings |
| `home/` | Account cards, import UI |
| `common/` | Shared: TreeStateContext, material display, comment speaker icon |
| `tabs/` | Multi-tab bar |

---

## How Frontend Calls Rust

### Commands (request/response)

Specta generates TypeScript bindings in `src/bindings/generated.ts`:

```typescript
// Auto-generated from Rust #[tauri::command] functions
export const commands = {
  async getBestMoves(id, engine, tab, goMode, options) {
    return await TAURI_INVOKE("get_best_moves", { id, engine, tab, goMode, options });
  },
  // ~50 more commands...
}
```

React components call them like normal async functions:

```typescript
import { commands } from "@/bindings";
const result = await commands.getBestMoves(id, engine, tab, goMode, options);
```

### Events (streaming, Rust to React)

For real-time data (engine analysis, clock ticks, game moves):

```
Rust:  app.emit("best_moves_payload", BestMovesPayload { depth: 24, ... })
         ↓
React: listen("best_moves_payload", (event) => updateBestMoves(event.payload))
```

### Tauri Plugins

The app uses several official plugins for system access:

| Plugin | Purpose |
|--------|---------|
| `@tauri-apps/plugin-fs` | Read/write files |
| `@tauri-apps/plugin-dialog` | File pickers, message boxes |
| `@tauri-apps/plugin-http` | HTTP client (engine downloads, cloud TTS) |
| `@tauri-apps/plugin-shell` | Execute UCI engines |
| `@tauri-apps/plugin-updater` | Auto-update checks |
| `@tauri-apps/plugin-log` | Structured logging |
| `@tauri-apps/plugin-os` | CPU/RAM detection |

---

## Text-to-Speech (TTS): A Primer

En Parlant~ can read chess moves and commentary aloud as you step through a game. This section explains how the TTS system is built — the preprocessing pipeline, the provider architecture, and the caching strategy. For setup instructions, see the TTS guides in the TTS menu.

### How TTS Works (The Short Version)

Text-to-speech converts written text into spoken audio. Modern TTS systems are built on deep neural networks trained on thousands of hours of human speech. The model learns the relationship between text (letters, words, punctuation) and the acoustic features of speech (pitch, timing, emphasis, breath pauses). At inference time, you send in text and get back an audio waveform.

There are two broad approaches:

- **Cloud TTS** — text is sent to a remote server (Google, ElevenLabs, etc.), which runs a large neural network on GPU hardware and returns audio. Excellent quality, but requires internet and has per-request costs (though most providers offer free tiers).

- **Local TTS** — a model runs directly on your machine. No internet needed, no per-request cost, and your text never leaves your computer. Recent open-source models (like Kokoro and Piper) have narrowed the quality gap significantly.

If you're curious about how TTS models work under the hood, HuggingFace (huggingface.co) hosts hundreds of open-source speech synthesis models you can explore, download, and run locally. Search for "text-to-speech" to find models ranging from lightweight CPU-friendly options to state-of-the-art research models.

### The Provider Architecture

The core TTS implementation lives in `src/utils/tts.ts`. It's designed around a **single public interface** (`speakText()`) with swappable backends. The rest of the app never knows or cares which provider is active — it just calls `speakText()` and audio comes out.

Five providers are supported:

| Provider | Type | Backend |
|----------|------|---------|
| **ElevenLabs** | Cloud | Neural voices via REST API. Returns MP3. |
| **Google Cloud TTS** | Cloud | WaveNet voices via REST API. Returns base64-encoded MP3. |
| **KittenTTS** | Local | Bundled TTS server, auto-started by the Rust backend. Communicates over HTTP on localhost. |
| **OpenTTS** | Local | Self-hosted TTS server. Supports many engines (espeak, MaryTTS, Piper, etc.). |
| **System TTS** | Local | OS-native speech engine via Rust/Tauri commands (speech-dispatcher on Linux, SAPI on Windows, AVSpeechSynthesizer on macOS). |

Provider selection is stored in a single Jotai atom (`ttsProviderAtom`). Switching providers is instant — change the atom, and the next `speakText()` call routes to the new backend.

### The Challenge: Chess Notation Isn't English

Chess moves are written in Standard Algebraic Notation (SAN): `Nf3`, `Bxe5+`, `O-O-O`, `e8=Q#`. If you feed this directly to a TTS engine, you get nonsense — it might try to pronounce "Nf3" as a word, or read "O-O-O" as "oh oh oh."

The solution is a **preprocessing pipeline** that translates chess notation into natural language before it reaches the TTS engine:

```
SAN Input         →  Preprocessing  →  Spoken Output
─────────────────────────────────────────────────────
"Nf3"             →  sanToSpoken()  →  "Knight f3"
"Bxe5+"           →  sanToSpoken()  →  "Bishop takes e5, check"
"O-O-O"           →  sanToSpoken()  →  "castles queenside"
"e8=Q#"           →  sanToSpoken()  →  "e8 promotes to Queen, checkmate"
```

The `sanToSpoken()` function uses regex pattern matching to decompose any SAN string into its components (piece, disambiguation, capture, destination, promotion, check/checkmate) and reassembles them using natural language from a vocabulary table.

### Multi-Language Support

Chess vocabulary is translated into 8 languages (English, French, Spanish, German, Japanese, Russian, Chinese, Korean). The `CHESS_VOCAB` table maps each term:

```
English:  "Knight takes e5, check"
French:   "Cavalier prend e5, échec"
German:   "Springer schlägt e5, Schach"
Japanese: "ナイト テイクス e5, チェック"
Russian:  "Конь берёт e5, шах"
```

The language setting determines which vocabulary table is used for preprocessing *and* which voice/accent the TTS engine uses for synthesis.

### Comment Cleaning

Game annotations often contain PGN-specific markup that would sound terrible if read aloud:

```
Raw comment:    "BLUNDER. 7.Nf3 was better [%eval -2.3] [%cal Gg1f3]"
After cleaning: "7, Knight f3 was better"
```

The `cleanCommentForTTS()` function:
1. Strips PGN tags: `[%eval ...]`, `[%csl ...]`, `[%cal ...]`, `[%clk ...]`
2. Removes duplicate annotation words (when "??" already said "Blunder")
3. Expands inline SAN in prose: `"7.Nf3 controls e5"` → `"7, Knight f3 controls e5"`
4. Fixes chess terms TTS engines mispronounce (e.g., "en prise" → "on preez")
5. Expands piece abbreviations in prose: `"R vs R"` → `"Rook versus Rook"`

### Building the Full Narration

When you step to a new move, `buildNarration()` assembles the complete spoken text from three sources:

```
Move:        "12, Knight f3, check."        ← from sanToSpoken()
Annotation:  "Good move."                   ← from annotation symbol (!)
Comment:     "Developing with tempo."       ← from cleanCommentForTTS()

Full narration: "12, Knight f3, check.  Good move.  Developing with tempo."
```

The double-space between parts gives TTS engines a natural breathing pause.

### Caching and Playback

Cloud TTS calls cost money and take time (~200-500ms round trip). To avoid re-fetching the same audio, every generated clip is cached in memory as a blob URL:

```
Cache key:  "elevenlabs:pNInz6obpgDQGcFmaJgB:en:12, Knight f3, check."
Cache value: blob:http://localhost/abc123  (the MP3 audio in browser memory)
```

On cache hit, playback is instant. The cache is keyed by `provider:voice:language:text`, so switching voices or languages creates separate entries.

For games with lots of annotations, you can **precache** the entire game tree in the background. The app walks every node, builds the narration text, and fires sequential API calls to fill the cache before you start navigating.

### Concurrency and Cancellation

Rapid arrow-key navigation creates a problem: if the user steps forward 5 times quickly, you don't want 5 overlapping audio clips fighting each other. The solution is a **generation counter**:

```typescript
const thisGeneration = ++requestGeneration;
// ... fetch audio ...
if (thisGeneration !== requestGeneration) return;  // stale — discard
```

Each new `speakText()` call increments the counter and aborts any in-flight HTTP request via `AbortController`. When the audio arrives, it checks if its generation is still current. If the user has already moved on, the response is silently discarded. This gives clean, glitch-free audio even when clicking rapidly through moves.

### Where TTS Hooks Into the App

The integration points are minimal:

| File | What Happens |
|------|-------------|
| `src/state/store/tree.ts` | Every navigation function (`goToNext`, `goToPrevious`, etc.) calls `stopSpeaking()`. When auto-narrate is on, `goToNext` also calls `speakMoveNarration()`. |
| `src/components/common/Comment.tsx` | A speaker icon next to each comment lets you manually trigger TTS for that comment. |
| `src/components/settings/TTSSettings.tsx` | Settings UI for choosing provider, voice, language, volume, speed, and entering API keys. |

When TTS is turned off, none of this code runs. The app behaves identically to upstream En Croissant.

---

## Data Flow Examples

### Engine Analysis

```
User clicks "Analyze"
  → React calls commands.getBestMoves(position, engine, settings)
  → Rust spawns UCI engine process, sends position via stdin
  → Engine writes "info depth 18 score cp 45 pv e2e4 ..." to stdout
  → Rust parses UCI output, emits BestMovesPayload event
  → React's EvalListener receives event, updates atoms
  → UI re-renders: eval bar moves, best move arrows appear
  → User clicks "Stop" → commands.stopEngine() → Rust sets AtomicBool flag
```

### Database Position Search

```
User reaches a position on the board
  → React calls commands.searchPosition(fen, gameQuery)
  → Rust queries memory-mapped binary search index
  → Returns: PositionStats (wins/losses/draws) + matching games
  → React renders DatabasePanel with results table
```

### TTS Narration

```
User steps forward with arrow key
  → tree.ts calls stopSpeaking(), then checks isAutoNarrateEnabled()
  → Calls speakMoveNarration(san, comment, annotations, halfMoves)
  → buildNarration() assembles text:
       sanToSpoken("Nf3+") → "Knight f3, check"
       annotationsToSpoken(["!"]) → "Good move."
       cleanCommentForTTS(comment) → strips [%eval], expands inline SAN
  → speakText() checks audioCache
       HIT  → play blob URL instantly
       MISS → fetch from provider API → cache as blob URL → play
  → HTMLAudioElement.play() with volume and playbackRate from atoms
```

---

## Directory Map

```
en-parlant/
├── src-tauri/                    # RUST BACKEND
│   ├── src/
│   │   ├── main.rs              # Entry, command registration, plugins
│   │   ├── chess.rs             # Engine analysis
│   │   ├── game.rs              # Live game management
│   │   ├── db/                  # SQLite database (largest module)
│   │   ├── engine/              # UCI protocol
│   │   ├── pgn.rs               # PGN parsing
│   │   ├── puzzle.rs            # Puzzle database
│   │   ├── opening.rs           # Opening lookup
│   │   └── tts.rs               # System TTS + KittenTTS management
│   ├── Cargo.toml               # Rust dependencies
│   ├── tauri.conf.json          # Tauri config
│   └── capabilities/main.json   # Security permissions
│
├── src/                          # REACT/TS FRONTEND
│   ├── App.tsx                  # Root component
│   ├── state/
│   │   ├── atoms.ts             # Jotai atoms (all app state)
│   │   └── store/tree.ts        # Game tree (Zustand + TTS hooks)
│   ├── routes/                  # TanStack Router (file-based)
│   ├── components/
│   │   ├── boards/              # Chessboard + analysis
│   │   ├── panels/              # Side panels
│   │   ├── databases/           # DB browsing UI
│   │   ├── common/              # Comment display (with TTS speaker icon)
│   │   └── settings/            # Preferences, TTS settings
│   ├── utils/
│   │   ├── chess.ts             # Game logic
│   │   ├── tts.ts               # TTS engine (SAN-to-spoken, caching, 5 providers)
│   │   └── treeReducer.ts       # Tree data structure
│   ├── bindings/                # Auto-generated TS from Rust
│   └── translation/             # i18n (13 languages)
│
├── docs/                         # Bundled documentation (shown in Help menu)
├── vite.config.ts               # Build config
└── package.json                 # Frontend deps
```

---

## Key Takeaways

1. **Rust does the heavy lifting** — engines, database, file I/O, PGN parsing. React never touches the filesystem or spawns processes directly.

2. **Type safety across the boundary** — Specta generates TypeScript types from Rust structs, so if a Rust command changes its signature, the TypeScript build breaks immediately.

3. **Two state systems** — Jotai for simple reactive state (settings, UI prefs, per-tab engine state), Zustand for complex domain state (game tree with branching and immutable updates).

4. **TTS is a preprocessing problem** — the hard part isn't calling a speech API, it's translating chess notation and PGN markup into clean, natural-sounding text across 8 languages. The `sanToSpoken()` and `cleanCommentForTTS()` pipelines are where the real work happens.

5. **Five providers, one interface** — whether audio comes from ElevenLabs, Google Cloud, KittenTTS, OpenTTS, or your OS's speech engine, the rest of the app only ever calls `speakText()`. Provider selection is a single atom toggle.

6. **The build produces a single binary** at `src-tauri/target/release/en-parlant` that bundles the Rust backend + the Vite-built frontend assets.
