[English](../en/architecture.md) | [Français](../fr/architecture.md) | [Español](../es/architecture.md) | **Deutsch** | [日本語](../ja/architecture.md) | [Русский](../ru/architecture.md) | [中文](../zh/architecture.md) | [한국어](../ko/architecture.md)

# En Parlant~ Architektur-Einführung

**App-Version:** v0.1.1 (Fork: DarrellThomas/en-parlant)
**Stack:** Tauri v2 (Rust) + React 19 (TypeScript) + Vite

---

## Was ist Tauri?

Tauri ist ein Framework zur Entwicklung von Desktop-Anwendungen. Anstatt wie Electron einen vollständigen Browser mitzuliefern, nutzt Tauri die betriebssystemeigene Webview für die Benutzeroberfläche und einen Rust-Prozess für das Backend. Das Ergebnis ist eine kleine, schnelle Binärdatei.

Die beiden Hälften kommunizieren über IPC (Inter-Prozesskommunikation):

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

## Die Rust-Seite: src-tauri/src/

Rust übernimmt alles, was schnell sein muss oder Systemzugriff erfordert.

### Einstiegspunkt: main.rs

Registriert ca. 50 Befehle, die das Frontend aufrufen kann, initialisiert Plugins (Dateisystem, Dialog, HTTP, Shell, Logging, Updater) und startet das App-Fenster.

Befehle werden mit einem Makro definiert:

```rust
#[tauri::command]
async fn get_best_moves(id: String, engine: String, ...) -> Result<...> {
    // spawn UCI engine, return analysis
}
```

Das `specta`-Crate generiert automatisch TypeScript-Typdefinitionen aus diesen Rust-Funktionen, sodass das Frontend volle Typsicherheit ohne manuellen Aufwand erhält.

### Wichtige Module

| Modul | Funktion |
|-------|----------|
| `db/mod.rs` | SQLite-Datenbank über Diesel ORM — Spielabfragen, Spielerstatistiken, Importe, Stellungssuche |
| `game.rs` | Live-Spiel-Engine — verwaltet Engine-gegen-Mensch- und Engine-gegen-Engine-Partien, Zeitkontrollen, Zugvalidierung |
| `chess.rs` | Engine-Analyse — startet UCI-Engines, streamt beste Züge als Events an das Frontend zurück |
| `engine/` | UCI-Protokoll-Implementierung — Prozessstart, stdin/stdout-Pipes, Multi-PV-Unterstützung |
| `pgn.rs` | PGN-Dateien lesen/schreiben/tokenisieren |
| `opening.rs` | Eröffnungsname aus FEN nachschlagen (binäre Daten in die App eingebettet) |
| `puzzle.rs` | Lichess-Aufgabendatenbank — speicherabgebildeter Direktzugriff |
| `fs.rs` | Dateidownloads mit Wiederaufnahme, Ausführungsrechte setzen |
| `sound.rs` | Lokaler HTTP-Server für Audio-Streaming (Linux-Audio-Workaround) |
| `tts.rs` | System-TTS über speech-dispatcher (Linux) / native OS-Sprach-APIs, plus KittenTTS-Serververwaltung |
| `oauth.rs` | OAuth2-Ablauf für Lichess/Chess.com-Kontoverknüpfung |

### Entwurfsmuster

- **Überall asynchron:** Tokio-Laufzeitumgebung, nicht-blockierende I/O
- **Nebenläufiger Zustand:** `DashMap` (nebenläufige HashMap) für Engine-Prozesse, DB-Verbindungen, Caches
- **Connection-Pooling:** r2d2 verwaltet SQLite-Verbindungspools
- **Speicherabgebildete Suche:** Stellungssuche über mmap-basierte Binärindizes für sofortige Ergebnisse
- **Event-Streaming:** Rust sendet Events (beste Züge, Uhrzeiten, Spielende), die React in Echtzeit empfängt

---

## Die React/TypeScript-Seite: src/

### Build-Pipeline: Vite

`vite.config.ts` konfiguriert:
- **React-Plugin** mit Babel-Compiler
- **TanStack Router Plugin** — generiert automatisch den Routenbaum aus dem `routes/`-Ordner
- **Vanilla Extract** — CSS-in-JS ohne Laufzeit-Overhead
- **Pfad-Alias:** `@` verweist auf `./src`
- **Entwicklungsserver** auf Port 1420

Build-Ablauf:
```
pnpm dev   → Vite on :1420 + Tauri opens webview pointing to it
pnpm build → tsc (typecheck) → vite build (bundle to dist/) → tauri build (native binary)
```

### Einstieg: App.tsx

Die Wurzelkomponente:
- Initialisiert Tauri-Plugins (Log, Prozess, Updater)
- Lädt Benutzereinstellungen aus persistenten Atoms
- Richtet das Mantine-UI-Theme ein
- Registriert den Router
- Prüft auf App-Updates

### Zustandsverwaltung

**Jotai-Atoms** (`src/state/atoms.ts`) — leichtgewichtiger reaktiver Zustand:

| Kategorie | Beispiele |
|-----------|-----------|
| Tabs | `tabsAtom`, `activeTabAtom` (Mehrfachdokument-Oberfläche) |
| Verzeichnisse | `storedDocumentDirAtom`, `storedDatabasesDirAtom` |
| UI-Einstellungen | `primaryColorAtom`, `fontSizeAtom`, `pieceSetAtom` |
| Engine | `engineMovesFamily`, `engineProgressFamily` (pro Tab über atomFamily) |
| TTS | `ttsEnabledAtom`, `ttsProviderAtom`, `ttsVoiceIdAtom`, `ttsVolumeAtom`, `ttsSpeedAtom`, `ttsLanguageAtom` |

Atoms mit `atomWithStorage()` werden automatisch in localStorage gespeichert.

**Zustand-Stores** für komplexen Domänenzustand:
- `src/state/store/tree.ts` — Spielbaum-Navigation, Zugverzweigungen, Annotationen, Kommentare. Nutzt Immer für unveränderliche Aktualisierungen.
- `src/state/store/database.ts` — Datenbankansicht-Filter, ausgewählte Partie, Seitenumbruch

### Routing: TanStack Router

Dateibasiertes Routing in `src/routes/`:
```
routes/
  __root.tsx          # Root layout (AppShell, menu bar)
  index.tsx           # Home/dashboard
  databases/          # Database browsing
  accounts.tsx        # Lichess/Chess.com accounts
  settings.tsx        # App preferences
  engines.tsx         # Engine management
```

### Komponenten: src/components/

| Gruppe | Zweck |
|--------|-------|
| `boards/` | Schachbrett (chessground), Zugeingabe, Bewertungsbalken, Analyseanzeige, Bauernumwandlungsdialog, Pfeilzeichnung |
| `panels/` | Seitenpanels: Engine-Analyse (BestMoves), Datenbank-Stellungssuche, Annotationsbearbeitung, Spielinformationen, Übungsmodus |
| `databases/` | Datenbank-UI: Partietabelle, Spielertabelle, Detailkarten, Filterung |
| `settings/` | Einstellungsformulare, Engine-Pfade, TTS-Einstellungen |
| `home/` | Kontokarten, Import-UI |
| `common/` | Gemeinsam genutzt: TreeStateContext, Materialanzeige, Kommentar-Lautsprechersymbol |
| `tabs/` | Multi-Tab-Leiste |

---

## Wie das Frontend Rust aufruft

### Befehle (Anfrage/Antwort)

Specta generiert TypeScript-Bindings in `src/bindings/generated.ts`:

```typescript
// Auto-generated from Rust #[tauri::command] functions
export const commands = {
  async getBestMoves(id, engine, tab, goMode, options) {
    return await TAURI_INVOKE("get_best_moves", { id, engine, tab, goMode, options });
  },
  // ~50 more commands...
}
```

React-Komponenten rufen sie wie normale asynchrone Funktionen auf:

```typescript
import { commands } from "@/bindings";
const result = await commands.getBestMoves(id, engine, tab, goMode, options);
```

### Events (Streaming, Rust an React)

Für Echtzeitdaten (Engine-Analyse, Uhrzeiten, Spielzüge):

```
Rust:  app.emit("best_moves_payload", BestMovesPayload { depth: 24, ... })
         ↓
React: listen("best_moves_payload", (event) => updateBestMoves(event.payload))
```

### Tauri-Plugins

Die App nutzt mehrere offizielle Plugins für Systemzugriff:

| Plugin | Zweck |
|--------|-------|
| `@tauri-apps/plugin-fs` | Dateien lesen/schreiben |
| `@tauri-apps/plugin-dialog` | Dateiauswahldialoge, Meldungsfenster |
| `@tauri-apps/plugin-http` | HTTP-Client (Engine-Downloads, Cloud-TTS) |
| `@tauri-apps/plugin-shell` | UCI-Engines ausführen |
| `@tauri-apps/plugin-updater` | Automatische Update-Prüfung |
| `@tauri-apps/plugin-log` | Strukturiertes Logging |
| `@tauri-apps/plugin-os` | CPU-/RAM-Erkennung |

---

## Text-to-Speech (TTS): Eine Einführung

En Parlant~ kann Schachzüge und Kommentare vorlesen, während man eine Partie durchgeht. Dieser Abschnitt erklärt, wie das TTS-System aufgebaut ist — die Vorverarbeitungs-Pipeline, die Provider-Architektur und die Caching-Strategie. Für Einrichtungsanleitungen siehe die TTS-Guides im TTS-Menü.

### Wie TTS funktioniert (die Kurzfassung)

Text-to-Speech wandelt geschriebenen Text in gesprochenes Audio um. Moderne TTS-Systeme basieren auf tiefen neuronalen Netzen, die mit Tausenden Stunden menschlicher Sprache trainiert wurden. Das Modell erlernt die Beziehung zwischen Text (Buchstaben, Wörtern, Satzzeichen) und den akustischen Eigenschaften der Sprache (Tonhöhe, Timing, Betonung, Atempausen). Zur Inferenzzeit sendet man Text ein und erhält eine Audio-Wellenform zurück.

Es gibt zwei grundlegende Ansätze:

- **Cloud-TTS** — der Text wird an einen entfernten Server (Google, ElevenLabs usw.) gesendet, der ein großes neuronales Netz auf GPU-Hardware ausführt und Audio zurückgibt. Hervorragende Qualität, erfordert jedoch Internet und verursacht Kosten pro Anfrage (wobei die meisten Anbieter kostenlose Kontingente anbieten).

- **Lokales TTS** — ein Modell läuft direkt auf dem eigenen Rechner. Kein Internet nötig, keine Kosten pro Anfrage, und der Text verlässt nie den eigenen Computer. Aktuelle Open-Source-Modelle (wie Kokoro und Piper) haben den Qualitätsunterschied deutlich verringert.

Wer sich dafür interessiert, wie TTS-Modelle im Detail funktionieren: HuggingFace (huggingface.co) hostet Hunderte von Open-Source-Sprachsynthesemodellen zum Erkunden, Herunterladen und lokalen Ausführen. Eine Suche nach „text-to-speech" liefert Modelle von leichtgewichtigen CPU-freundlichen Varianten bis hin zu hochmodernen Forschungsmodellen.

### Die Provider-Architektur

Die zentrale TTS-Implementierung befindet sich in `src/utils/tts.ts`. Sie ist um eine **einzige öffentliche Schnittstelle** (`speakText()`) mit austauschbaren Backends aufgebaut. Der Rest der App weiß nicht und muss nicht wissen, welcher Provider aktiv ist — es wird einfach `speakText()` aufgerufen und Audio kommt heraus.

Fünf Provider werden unterstützt:

| Provider | Typ | Backend |
|----------|-----|---------|
| **ElevenLabs** | Cloud | Neuronale Stimmen über REST-API. Liefert MP3. |
| **Google Cloud TTS** | Cloud | WaveNet-Stimmen über REST-API. Liefert base64-kodiertes MP3. |
| **KittenTTS** | Lokal | Mitgelieferter TTS-Server, wird automatisch vom Rust-Backend gestartet. Kommuniziert über HTTP auf localhost. |
| **OpenTTS** | Lokal | Selbst gehosteter TTS-Server. Unterstützt viele Engines (espeak, MaryTTS, Piper usw.). |
| **System-TTS** | Lokal | Betriebssystemeigene Sprach-Engine über Rust/Tauri-Befehle (speech-dispatcher unter Linux, SAPI unter Windows, AVSpeechSynthesizer unter macOS). |

Die Provider-Auswahl wird in einem einzelnen Jotai-Atom (`ttsProviderAtom`) gespeichert. Der Wechsel zwischen Providern erfolgt sofort — man ändert das Atom, und der nächste `speakText()`-Aufruf wird an das neue Backend weitergeleitet.

### Die Herausforderung: Schachnotation ist kein natürlicher Sprachtext

Schachzüge werden in Standardalgebraischer Notation (SAN) geschrieben: `Nf3`, `Bxe5+`, `O-O-O`, `e8=Q#`. Gibt man dies direkt an eine TTS-Engine, kommt Unsinn heraus — sie könnte versuchen, „Nf3" als Wort auszusprechen oder „O-O-O" als „oh oh oh" vorzulesen.

Die Lösung ist eine **Vorverarbeitungs-Pipeline**, die Schachnotation in natürliche Sprache übersetzt, bevor sie die TTS-Engine erreicht:

```
SAN Input         →  Preprocessing  →  Spoken Output
─────────────────────────────────────────────────────
"Nf3"             →  sanToSpoken()  →  "Knight f3"
"Bxe5+"           →  sanToSpoken()  →  "Bishop takes e5, check"
"O-O-O"           →  sanToSpoken()  →  "castles queenside"
"e8=Q#"           →  sanToSpoken()  →  "e8 promotes to Queen, checkmate"
```

Die Funktion `sanToSpoken()` verwendet Regex-Musterabgleich, um jeden SAN-String in seine Bestandteile zu zerlegen (Figur, Disambiguation, Schlagen, Zielfeld, Umwandlung, Schach/Matt) und setzt sie unter Verwendung natürlicher Sprache aus einer Vokabeltabelle wieder zusammen.

### Mehrsprachige Unterstützung

Das Schachvokabular ist in 8 Sprachen übersetzt (Englisch, Französisch, Spanisch, Deutsch, Japanisch, Russisch, Chinesisch, Koreanisch). Die `CHESS_VOCAB`-Tabelle ordnet jeden Begriff zu:

```
English:  "Knight takes e5, check"
French:   "Cavalier prend e5, échec"
German:   "Springer schlägt e5, Schach"
Japanese: "ナイト テイクス e5, チェック"
Russian:  "Конь берёт e5, шах"
```

Die Spracheinstellung bestimmt, welche Vokabeltabelle für die Vorverarbeitung verwendet wird *und* welche Stimme/welchen Akzent die TTS-Engine für die Synthese nutzt.

### Kommentarbereinigung

Spielannotationen enthalten oft PGN-spezifisches Markup, das furchtbar klingen würde, wenn es vorgelesen wird:

```
Raw comment:    "BLUNDER. 7.Nf3 was better [%eval -2.3] [%cal Gg1f3]"
After cleaning: "7, Knight f3 was better"
```

Die Funktion `cleanCommentForTTS()`:
1. Entfernt PGN-Tags: `[%eval ...]`, `[%csl ...]`, `[%cal ...]`, `[%clk ...]`
2. Entfernt doppelte Annotationswörter (wenn „??" bereits „Blunder" gesagt hat)
3. Expandiert inline-SAN im Fließtext: `"7.Nf3 controls e5"` → `"7, Knight f3 controls e5"`
4. Korrigiert Schachbegriffe, die TTS-Engines falsch aussprechen (z.B. „en prise" → „on preez")
5. Expandiert Figurenabkürzungen im Fließtext: `"R vs R"` → `"Rook versus Rook"`

### Aufbau der vollständigen Narration

Wenn man zu einem neuen Zug navigiert, setzt `buildNarration()` den vollständigen gesprochenen Text aus drei Quellen zusammen:

```
Move:        "12, Knight f3, check."        ← from sanToSpoken()
Annotation:  "Good move."                   ← from annotation symbol (!)
Comment:     "Developing with tempo."       ← from cleanCommentForTTS()

Full narration: "12, Knight f3, check.  Good move.  Developing with tempo."
```

Die doppelten Leerzeichen zwischen den Teilen geben TTS-Engines eine natürliche Atempause.

### Caching und Wiedergabe

Cloud-TTS-Aufrufe kosten Geld und brauchen Zeit (~200-500 ms Roundtrip). Um das wiederholte Abrufen desselben Audios zu vermeiden, wird jeder generierte Clip als Blob-URL im Speicher zwischengespeichert:

```
Cache key:  "elevenlabs:pNInz6obpgDQGcFmaJgB:en:12, Knight f3, check."
Cache value: blob:http://localhost/abc123  (the MP3 audio in browser memory)
```

Bei einem Cache-Treffer erfolgt die Wiedergabe sofort. Der Cache ist nach `provider:voice:language:text` geschlüsselt, sodass ein Wechsel der Stimme oder Sprache separate Einträge erzeugt.

Bei Partien mit vielen Annotationen kann man den gesamten Spielbaum im Hintergrund **vorab cachen**. Die App durchläuft jeden Knoten, erstellt den Narrationstext und sendet sequenzielle API-Aufrufe, um den Cache zu füllen, bevor man mit der Navigation beginnt.

### Nebenläufigkeit und Abbruch

Schnelles Navigieren mit den Pfeiltasten erzeugt ein Problem: Wenn der Benutzer fünfmal schnell vorwärts springt, sollen nicht fünf sich überlappende Audioclips gegeneinander konkurrieren. Die Lösung ist ein **Generationszähler**:

```typescript
const thisGeneration = ++requestGeneration;
// ... fetch audio ...
if (thisGeneration !== requestGeneration) return;  // stale — discard
```

Jeder neue `speakText()`-Aufruf erhöht den Zähler und bricht jede laufende HTTP-Anfrage über `AbortController` ab. Wenn das Audio ankommt, wird geprüft, ob seine Generation noch aktuell ist. Hat der Benutzer bereits weiternavigiert, wird die Antwort stillschweigend verworfen. Das sorgt für sauberes, störungsfreies Audio auch bei schnellem Durchklicken der Züge.

### Wo TTS in die App eingebunden ist

Die Integrationspunkte sind minimal:

| Datei | Was passiert |
|-------|-------------|
| `src/state/store/tree.ts` | Jede Navigationsfunktion (`goToNext`, `goToPrevious` usw.) ruft `stopSpeaking()` auf. Bei aktivierter automatischer Narration ruft `goToNext` zusätzlich `speakMoveNarration()` auf. |
| `src/components/common/Comment.tsx` | Ein Lautsprechersymbol neben jedem Kommentar ermöglicht das manuelle Auslösen der TTS-Wiedergabe für diesen Kommentar. |
| `src/components/settings/TTSSettings.tsx` | Einstellungs-UI zur Auswahl von Provider, Stimme, Sprache, Lautstärke, Geschwindigkeit und Eingabe von API-Schlüsseln. |

Wenn TTS deaktiviert ist, wird keiner dieser Codepfade ausgeführt. Die App verhält sich identisch zum Upstream-Projekt En Croissant.

---

## Beispiele für den Datenfluss

### Engine-Analyse

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

### Datenbank-Stellungssuche

```
User reaches a position on the board
  → React calls commands.searchPosition(fen, gameQuery)
  → Rust queries memory-mapped binary search index
  → Returns: PositionStats (wins/losses/draws) + matching games
  → React renders DatabasePanel with results table
```

### TTS-Narration

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

## Verzeichnisübersicht

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

## Die wichtigsten Erkenntnisse

1. **Rust erledigt die Schwerstarbeit** — Engines, Datenbank, Datei-I/O, PGN-Parsing. React greift nie direkt auf das Dateisystem zu und startet keine Prozesse.

2. **Typsicherheit über die Grenze hinweg** — Specta generiert TypeScript-Typen aus Rust-Structs. Wenn ein Rust-Befehl seine Signatur ändert, bricht der TypeScript-Build sofort.

3. **Zwei Zustandssysteme** — Jotai für einfachen reaktiven Zustand (Einstellungen, UI-Präferenzen, Engine-Zustand pro Tab), Zustand für komplexen Domänenzustand (Spielbaum mit Verzweigungen und unveränderlichen Aktualisierungen).

4. **TTS ist ein Vorverarbeitungsproblem** — das Schwierige ist nicht der Aufruf einer Sprach-API, sondern die Übersetzung von Schachnotation und PGN-Markup in sauberen, natürlich klingenden Text in 8 Sprachen. Die Pipelines `sanToSpoken()` und `cleanCommentForTTS()` sind der Ort, an dem die eigentliche Arbeit stattfindet.

5. **Fünf Provider, eine Schnittstelle** — ob das Audio von ElevenLabs, Google Cloud, KittenTTS, OpenTTS oder der Sprach-Engine des Betriebssystems kommt, der Rest der App ruft immer nur `speakText()` auf. Die Provider-Auswahl ist ein einzelner Atom-Umschalter.

6. **Der Build erzeugt eine einzige Binärdatei** unter `src-tauri/target/release/en-parlant`, die das Rust-Backend und die Vite-gebauten Frontend-Assets bündelt.
