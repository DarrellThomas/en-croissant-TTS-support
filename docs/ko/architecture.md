[English](../en/architecture.md) | [Français](../fr/architecture.md) | [Español](../es/architecture.md) | [Deutsch](../de/architecture.md) | [日本語](../ja/architecture.md) | [Русский](../ru/architecture.md) | [中文](../zh/architecture.md) | **한국어**

# En Parlant~ 아키텍처 입문서

**앱 버전:** v0.1.0 (포크: DarrellThomas/en-parlant)
**기술 스택:** Tauri v2 (Rust) + React 19 (TypeScript) + Vite

---

## Tauri란 무엇인가?

Tauri는 데스크톱 앱을 만들기 위한 프레임워크입니다. Electron처럼 전체 브라우저를 포함하는 대신, Tauri는 UI에 운영체제 내장 웹뷰를 사용하고 백엔드에는 Rust 프로세스를 사용합니다. 그 결과 작고 빠른 바이너리가 만들어집니다.

두 부분은 IPC(프로세스 간 통신)를 통해 통신합니다:

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

## Rust 측: src-tauri/src/

Rust는 빠른 처리가 필요하거나 시스템 접근이 필요한 모든 것을 담당합니다.

### 진입점: main.rs

프론트엔드에서 호출할 수 있는 약 50개의 커맨드를 등록하고, 플러그인(파일시스템, 다이얼로그, HTTP, 셸, 로깅, 업데이터)을 초기화하며, 앱 창을 시작합니다.

커맨드는 매크로로 정의됩니다:

```rust
#[tauri::command]
async fn get_best_moves(id: String, engine: String, ...) -> Result<...> {
    // spawn UCI engine, return analysis
}
```

`specta` 크레이트가 이러한 Rust 함수로부터 TypeScript 타입 정의를 자동 생성하므로, 프론트엔드는 수작업 없이 완전한 타입 안전성을 갖추게 됩니다.

### 주요 모듈

| 모듈 | 역할 |
|------|------|
| `db/mod.rs` | Diesel ORM을 사용한 SQLite 데이터베이스 — 게임 조회, 플레이어 통계, 가져오기, 포지션 검색 |
| `game.rs` | 라이브 게임 엔진 — 엔진 대 사람, 엔진 대 엔진 게임 관리, 시간 제어, 수 유효성 검사 |
| `chess.rs` | 엔진 분석 — UCI 엔진 실행, 최선수 결과를 이벤트를 통해 프론트엔드로 스트리밍 |
| `engine/` | UCI 프로토콜 구현 — 프로세스 생성, stdin/stdout 파이프, 멀티 PV 지원 |
| `pgn.rs` | PGN 파일 읽기/쓰기/토큰화 |
| `opening.rs` | FEN으로부터 오프닝 이름 조회 (바이너리 데이터가 앱에 내장됨) |
| `puzzle.rs` | Lichess 퍼즐 데이터베이스 — 메모리 매핑된 랜덤 접근 |
| `fs.rs` | 이어받기 지원 파일 다운로드, 실행 권한 설정 |
| `sound.rs` | 오디오 스트리밍용 로컬 HTTP 서버 (Linux 오디오 우회 방법) |
| `tts.rs` | speech-dispatcher(Linux) / 네이티브 OS 음성 API를 통한 시스템 TTS, KittenTTS 서버 관리 |
| `oauth.rs` | Lichess/Chess.com 계정 연동을 위한 OAuth2 흐름 |

### 설계 패턴

- **전면 비동기:** Tokio 런타임, 논블로킹 I/O
- **동시 상태 관리:** 엔진 프로세스, DB 연결, 캐시에 `DashMap` (동시성 HashMap) 사용
- **연결 풀링:** r2d2가 SQLite 연결 풀 관리
- **메모리 매핑 검색:** mmap된 바이너리 인덱스를 통한 포지션 조회로 즉각적인 결과 제공
- **이벤트 스트리밍:** Rust가 이벤트(최선수, 시계 틱, 게임 종료)를 발행하면 React가 실시간으로 수신

---

## React/TypeScript 측: src/

### 빌드 파이프라인: Vite

`vite.config.ts` 설정 항목:
- **React 플러그인** — Babel 컴파일러 사용
- **TanStack Router 플러그인** — `routes/` 폴더에서 라우트 트리 자동 생성
- **Vanilla Extract** — 런타임 제로 CSS-in-JS
- **경로 별칭:** `@`가 `./src`에 매핑
- **개발 서버** — 포트 1420

빌드 흐름:
```
pnpm dev   → Vite on :1420 + Tauri opens webview pointing to it
pnpm build → tsc (typecheck) → vite build (bundle to dist/) → tauri build (native binary)
```

### 진입점: App.tsx

루트 컴포넌트:
- Tauri 플러그인 초기화 (log, process, updater)
- 영속적 atom에서 사용자 환경설정 로드
- Mantine UI 테마 설정
- 라우터 등록
- 앱 업데이트 확인

### 상태 관리

**Jotai atom** (`src/state/atoms.ts`) — 경량 반응형 상태:

| 카테고리 | 예시 |
|----------|------|
| 탭 | `tabsAtom`, `activeTabAtom` (멀티 문서 인터페이스) |
| 디렉토리 | `storedDocumentDirAtom`, `storedDatabasesDirAtom` |
| UI 설정 | `primaryColorAtom`, `fontSizeAtom`, `pieceSetAtom` |
| 엔진 | `engineMovesFamily`, `engineProgressFamily` (atomFamily를 통한 탭별 관리) |
| TTS | `ttsEnabledAtom`, `ttsProviderAtom`, `ttsVoiceIdAtom`, `ttsVolumeAtom`, `ttsSpeedAtom`, `ttsLanguageAtom` |

`atomWithStorage()`를 사용하는 atom은 localStorage에 자동으로 영속화됩니다.

**Zustand 스토어** — 복잡한 도메인 상태용:
- `src/state/store/tree.ts` — 게임 트리 탐색, 수 분기, 주석, 코멘트. 불변 업데이트에 Immer 사용.
- `src/state/store/database.ts` — 데이터베이스 뷰 필터, 선택된 게임, 페이지네이션

### 라우팅: TanStack Router

`src/routes/`의 파일 기반 라우팅:
```
routes/
  __root.tsx          # Root layout (AppShell, menu bar)
  index.tsx           # Home/dashboard
  databases/          # Database browsing
  accounts.tsx        # Lichess/Chess.com accounts
  settings.tsx        # App preferences
  engines.tsx         # Engine management
```

### 컴포넌트: src/components/

| 그룹 | 용도 |
|------|------|
| `boards/` | 체스보드(chessground), 수 입력, 평가 바, 분석 표시, 프로모션 모달, 화살표 그리기 |
| `panels/` | 사이드 패널: 엔진 분석(BestMoves), 데이터베이스 포지션 검색, 주석 편집, 게임 정보, 연습 모드 |
| `databases/` | 데이터베이스 UI: 게임 테이블, 플레이어 테이블, 상세 카드, 필터링 |
| `settings/` | 환경설정 폼, 엔진 경로, TTS 설정 |
| `home/` | 계정 카드, 가져오기 UI |
| `common/` | 공유 컴포넌트: TreeStateContext, 기물 표시, 코멘트 스피커 아이콘 |
| `tabs/` | 멀티탭 바 |

---

## 프론트엔드에서 Rust를 호출하는 방법

### 커맨드 (요청/응답)

Specta가 `src/bindings/generated.ts`에 TypeScript 바인딩을 생성합니다:

```typescript
// Auto-generated from Rust #[tauri::command] functions
export const commands = {
  async getBestMoves(id, engine, tab, goMode, options) {
    return await TAURI_INVOKE("get_best_moves", { id, engine, tab, goMode, options });
  },
  // ~50 more commands...
}
```

React 컴포넌트에서 일반 비동기 함수처럼 호출합니다:

```typescript
import { commands } from "@/bindings";
const result = await commands.getBestMoves(id, engine, tab, goMode, options);
```

### 이벤트 (스트리밍, Rust에서 React로)

실시간 데이터(엔진 분석, 시계 틱, 게임 수) 전달:

```
Rust:  app.emit("best_moves_payload", BestMovesPayload { depth: 24, ... })
         ↓
React: listen("best_moves_payload", (event) => updateBestMoves(event.payload))
```

### Tauri 플러그인

앱은 시스템 접근을 위해 여러 공식 플러그인을 사용합니다:

| 플러그인 | 용도 |
|----------|------|
| `@tauri-apps/plugin-fs` | 파일 읽기/쓰기 |
| `@tauri-apps/plugin-dialog` | 파일 선택기, 메시지 박스 |
| `@tauri-apps/plugin-http` | HTTP 클라이언트 (엔진 다운로드, 클라우드 TTS) |
| `@tauri-apps/plugin-shell` | UCI 엔진 실행 |
| `@tauri-apps/plugin-updater` | 자동 업데이트 확인 |
| `@tauri-apps/plugin-log` | 구조화된 로깅 |
| `@tauri-apps/plugin-os` | CPU/RAM 감지 |

---

## 텍스트 음성 변환(TTS): 입문서

En Parlant~는 게임을 진행하면서 체스 수와 해설을 소리 내어 읽어줄 수 있습니다. 이 섹션에서는 TTS 시스템의 구축 방식 — 전처리 파이프라인, 제공업체 아키텍처, 캐싱 전략을 설명합니다. 설정 안내는 TTS 메뉴의 TTS 가이드를 참고하십시오.

### TTS의 작동 원리 (요약)

텍스트 음성 변환은 문자로 작성된 텍스트를 음성 오디오로 변환합니다. 현대 TTS 시스템은 수천 시간의 인간 음성 데이터로 학습된 심층 신경망을 기반으로 합니다. 모델은 텍스트(문자, 단어, 구두점)와 음성의 음향적 특성(음높이, 타이밍, 강세, 호흡 쉼) 사이의 관계를 학습합니다. 추론 시에는 텍스트를 입력하면 오디오 파형을 반환합니다.

크게 두 가지 접근 방식이 있습니다:

- **클라우드 TTS** — 텍스트를 원격 서버(Google, ElevenLabs 등)로 전송하면, 서버가 GPU 하드웨어에서 대규모 신경망을 실행하여 오디오를 반환합니다. 뛰어난 품질을 제공하지만, 인터넷 연결이 필요하고 요청당 비용이 발생합니다 (대부분의 제공업체가 무료 등급을 제공하지만).

- **로컬 TTS** — 모델이 사용자의 컴퓨터에서 직접 실행됩니다. 인터넷이 필요 없고, 요청당 비용도 없으며, 텍스트가 컴퓨터 외부로 전송되지 않습니다. 최근 오픈소스 모델(Kokoro, Piper 등)이 품질 격차를 크게 좁혔습니다.

TTS 모델의 내부 작동 방식에 관심이 있다면, HuggingFace(huggingface.co)에서 수백 개의 오픈소스 음성 합성 모델을 탐색, 다운로드, 로컬 실행할 수 있습니다. "text-to-speech"로 검색하면 경량 CPU 친화적 옵션부터 최첨단 연구 모델까지 다양한 모델을 찾을 수 있습니다.

### 제공업체 아키텍처

핵심 TTS 구현은 `src/utils/tts.ts`에 있습니다. **단일 공개 인터페이스**(`speakText()`)에 교체 가능한 백엔드를 두는 방식으로 설계되어 있습니다. 앱의 나머지 부분은 어떤 제공업체가 활성화되어 있는지 알 필요도, 신경 쓸 필요도 없습니다 — 그저 `speakText()`를 호출하면 오디오가 재생됩니다.

다섯 개의 제공업체가 지원됩니다:

| 제공업체 | 유형 | 백엔드 |
|----------|------|--------|
| **ElevenLabs** | 클라우드 | REST API를 통한 신경망 음성. MP3 반환. |
| **Google Cloud TTS** | 클라우드 | REST API를 통한 WaveNet 음성. base64 인코딩 MP3 반환. |
| **KittenTTS** | 로컬 | 번들 TTS 서버, Rust 백엔드에 의해 자동 시작. localhost의 HTTP로 통신. |
| **OpenTTS** | 로컬 | 자체 호스팅 TTS 서버. 다양한 엔진 지원 (espeak, MaryTTS, Piper 등). |
| **System TTS** | 로컬 | Rust/Tauri 커맨드를 통한 OS 네이티브 음성 엔진 (Linux의 speech-dispatcher, Windows의 SAPI, macOS의 AVSpeechSynthesizer). |

제공업체 선택은 단일 Jotai atom(`ttsProviderAtom`)에 저장됩니다. 제공업체 전환은 즉시 이루어집니다 — atom을 변경하면 다음 `speakText()` 호출이 새로운 백엔드로 라우팅됩니다.

### 과제: 체스 기보는 영어가 아닙니다

체스 수는 표준 대수 기보법(SAN)으로 작성됩니다: `Nf3`, `Bxe5+`, `O-O-O`, `e8=Q#`. 이것을 TTS 엔진에 그대로 전달하면 의미 없는 소리가 납니다 — "Nf3"를 단어처럼 발음하거나, "O-O-O"를 "오 오 오"로 읽을 수 있습니다.

해결책은 체스 기보를 TTS 엔진에 전달하기 전에 자연어로 변환하는 **전처리 파이프라인**입니다:

```
SAN Input         →  Preprocessing  →  Spoken Output
─────────────────────────────────────────────────────
"Nf3"             →  sanToSpoken()  →  "Knight f3"
"Bxe5+"           →  sanToSpoken()  →  "Bishop takes e5, check"
"O-O-O"           →  sanToSpoken()  →  "castles queenside"
"e8=Q#"           →  sanToSpoken()  →  "e8 promotes to Queen, checkmate"
```

`sanToSpoken()` 함수는 정규식 패턴 매칭을 사용하여 SAN 문자열을 구성 요소(기물, 명확화, 잡음, 목적지, 프로모션, 체크/체크메이트)로 분해하고, 어휘 테이블의 자연어를 사용하여 재조합합니다.

### 다국어 지원

체스 용어는 8개 언어(영어, 프랑스어, 스페인어, 독일어, 일본어, 러시아어, 중국어, 한국어)로 번역되어 있습니다. `CHESS_VOCAB` 테이블이 각 용어를 매핑합니다:

```
English:  "Knight takes e5, check"
French:   "Cavalier prend e5, échec"
German:   "Springer schlägt e5, Schach"
Japanese: "ナイト テイクス e5, チェック"
Russian:  "Конь берёт e5, шах"
```

언어 설정은 전처리에 사용할 어휘 테이블과 TTS 엔진이 합성에 사용할 음성/억양을 결정합니다.

### 코멘트 정리

게임 주석에는 소리 내어 읽으면 듣기 불편한 PGN 전용 마크업이 포함되어 있는 경우가 많습니다:

```
Raw comment:    "BLUNDER. 7.Nf3 was better [%eval -2.3] [%cal Gg1f3]"
After cleaning: "7, Knight f3 was better"
```

`cleanCommentForTTS()` 함수의 처리 과정:
1. PGN 태그 제거: `[%eval ...]`, `[%csl ...]`, `[%cal ...]`, `[%clk ...]`
2. 중복 주석 단어 제거 ("??"가 이미 "Blunder"로 읽힌 경우)
3. 본문 내 SAN 확장: `"7.Nf3 controls e5"` → `"7, Knight f3 controls e5"`
4. TTS 엔진이 잘못 발음하는 체스 용어 수정 (예: "en prise" → "on preez")
5. 본문 내 기물 약어 확장: `"R vs R"` → `"Rook versus Rook"`

### 전체 내레이션 구성

새로운 수로 이동하면, `buildNarration()`이 세 가지 소스에서 전체 음성 텍스트를 조합합니다:

```
Move:        "12, Knight f3, check."        ← from sanToSpoken()
Annotation:  "Good move."                   ← from annotation symbol (!)
Comment:     "Developing with tempo."       ← from cleanCommentForTTS()

Full narration: "12, Knight f3, check.  Good move.  Developing with tempo."
```

각 부분 사이의 이중 공백은 TTS 엔진에 자연스러운 호흡 쉼을 제공합니다.

### 캐싱과 재생

클라우드 TTS 호출은 비용이 발생하고 시간이 걸립니다 (왕복 약 200-500ms). 동일한 오디오를 다시 가져오지 않기 위해, 생성된 모든 클립은 메모리에 blob URL로 캐시됩니다:

```
Cache key:  "elevenlabs:pNInz6obpgDQGcFmaJgB:en:12, Knight f3, check."
Cache value: blob:http://localhost/abc123  (the MP3 audio in browser memory)
```

캐시 적중 시 재생은 즉각적입니다. 캐시 키는 `provider:voice:language:text`로 구성되므로, 음성이나 언어를 변경하면 별도의 항목이 생성됩니다.

주석이 많은 게임의 경우, 전체 게임 트리를 백그라운드에서 **사전 캐싱**할 수 있습니다. 앱이 모든 노드를 순회하며 내레이션 텍스트를 구성하고, 탐색을 시작하기 전에 순차적 API 호출을 실행하여 캐시를 채웁니다.

### 동시성과 취소

빠른 화살표 키 탐색은 문제를 일으킵니다: 사용자가 빠르게 5회 앞으로 이동하면, 5개의 오디오 클립이 서로 겹쳐 재생되는 것을 원하지 않을 것입니다. 해결책은 **세대 카운터**입니다:

```typescript
const thisGeneration = ++requestGeneration;
// ... fetch audio ...
if (thisGeneration !== requestGeneration) return;  // stale — discard
```

새로운 `speakText()` 호출은 카운터를 증가시키고 `AbortController`를 통해 진행 중인 HTTP 요청을 중단합니다. 오디오가 도착하면 자신의 세대가 아직 현재 세대인지 확인합니다. 사용자가 이미 다음 수로 넘어갔다면, 응답은 조용히 폐기됩니다. 이를 통해 수를 빠르게 클릭하며 넘겨도 깨끗하고 끊김 없는 오디오가 재생됩니다.

### TTS가 앱에 연결되는 지점

통합 지점은 최소한입니다:

| 파일 | 동작 |
|------|------|
| `src/state/store/tree.ts` | 모든 탐색 함수(`goToNext`, `goToPrevious` 등)가 `stopSpeaking()`을 호출합니다. 자동 내레이션이 켜져 있으면 `goToNext`가 `speakMoveNarration()`도 호출합니다. |
| `src/components/common/Comment.tsx` | 각 코멘트 옆의 스피커 아이콘으로 해당 코멘트의 TTS를 수동으로 트리거할 수 있습니다. |
| `src/components/settings/TTSSettings.tsx` | 제공업체, 음성, 언어, 볼륨, 속도 선택 및 API 키 입력을 위한 설정 UI입니다. |

TTS가 꺼져 있으면 이 코드는 실행되지 않습니다. 앱은 업스트림 En Croissant와 동일하게 작동합니다.

---

## 데이터 흐름 예시

### 엔진 분석

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

### 데이터베이스 포지션 검색

```
User reaches a position on the board
  → React calls commands.searchPosition(fen, gameQuery)
  → Rust queries memory-mapped binary search index
  → Returns: PositionStats (wins/losses/draws) + matching games
  → React renders DatabasePanel with results table
```

### TTS 내레이션

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

## 디렉토리 맵

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

## 핵심 요약

1. **Rust가 무거운 작업을 담당합니다** — 엔진, 데이터베이스, 파일 I/O, PGN 파싱. React는 파일시스템에 직접 접근하거나 프로세스를 직접 실행하지 않습니다.

2. **경계를 넘는 타입 안전성** — Specta가 Rust 구조체에서 TypeScript 타입을 생성하므로, Rust 커맨드의 시그니처가 변경되면 TypeScript 빌드가 즉시 실패합니다.

3. **두 가지 상태 시스템** — 단순한 반응형 상태(설정, UI 환경설정, 탭별 엔진 상태)에는 Jotai를, 복잡한 도메인 상태(분기와 불변 업데이트가 있는 게임 트리)에는 Zustand를 사용합니다.

4. **TTS는 전처리 문제입니다** — 어려운 부분은 음성 API를 호출하는 것이 아니라, 체스 기보와 PGN 마크업을 8개 언어에 걸쳐 깨끗하고 자연스럽게 들리는 텍스트로 변환하는 것입니다. `sanToSpoken()`과 `cleanCommentForTTS()` 파이프라인이 실제 핵심 작업을 수행합니다.

5. **다섯 개 제공업체, 하나의 인터페이스** — 오디오가 ElevenLabs, Google Cloud, KittenTTS, OpenTTS, OS 음성 엔진 중 어디에서 오든, 앱의 나머지 부분은 오직 `speakText()`만 호출합니다. 제공업체 선택은 단일 atom 토글입니다.

6. **빌드 결과물은 하나의 바이너리입니다** — `src-tauri/target/release/en-parlant`에 Rust 백엔드와 Vite로 빌드된 프론트엔드 에셋이 함께 번들됩니다.
