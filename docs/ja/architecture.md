[English](../en/architecture.md) | [Français](../fr/architecture.md) | [Español](../es/architecture.md) | [Deutsch](../de/architecture.md) | **日本語** | [Русский](../ru/architecture.md) | [中文](../zh/architecture.md) | [한국어](../ko/architecture.md)

# En Parlant~ アーキテクチャ入門

**アプリバージョン:** v0.1.1 (フォーク: DarrellThomas/en-parlant)
**技術スタック:** Tauri v2 (Rust) + React 19 (TypeScript) + Vite

---

## Tauri とは？

Tauri はデスクトップアプリケーションを構築するためのフレームワークです。Electron のように完全なブラウザを同梱するのではなく、Tauri は UI に OS 組み込みの WebView を使用し、バックエンドには Rust プロセスを使用します。その結果、小型で高速なバイナリが生成されます。

この 2 つの部分は IPC（プロセス間通信）を通じてやり取りします：

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

## Rust 側: src-tauri/src/

Rust は高速性が求められる処理やシステムアクセスが必要な処理をすべて担当します。

### エントリーポイント: main.rs

フロントエンドから呼び出せるコマンドを約 50 個登録し、プラグイン（ファイルシステム、ダイアログ、HTTP、シェル、ロギング、アップデーター）を初期化し、アプリウィンドウを起動します。

コマンドはマクロで定義されます：

```rust
#[tauri::command]
async fn get_best_moves(id: String, engine: String, ...) -> Result<...> {
    // spawn UCI engine, return analysis
}
```

`specta` クレートがこれらの Rust 関数から TypeScript の型定義を自動生成するため、フロントエンドは手動作業なしで完全な型安全性を得ることができます。

### 主要モジュール

| モジュール | 機能 |
|--------|-------------|
| `db/mod.rs` | Diesel ORM による SQLite データベース — ゲームクエリ、プレイヤー統計、インポート、局面検索 |
| `game.rs` | ライブゲームエンジン — エンジン対人間、エンジン対エンジンのゲーム管理、持ち時間制御、着手バリデーション |
| `chess.rs` | エンジン解析 — UCI エンジンの起動、ベストムーブ結果のイベントによるフロントエンドへのストリーミング |
| `engine/` | UCI プロトコル実装 — プロセス起動、stdin/stdout パイプ、マルチ PV サポート |
| `pgn.rs` | PGN ファイルの読み書き・トークン化 |
| `opening.rs` | FEN からのオープニング名検索（バイナリデータをアプリに組み込み） |
| `puzzle.rs` | Lichess パズルデータベース — メモリマップによるランダムアクセス |
| `fs.rs` | レジューム対応のファイルダウンロード、実行権限の設定 |
| `sound.rs` | オーディオストリーミング用のローカル HTTP サーバー（Linux オーディオの回避策） |
| `tts.rs` | speech-dispatcher（Linux）/ ネイティブ OS 音声 API によるシステム TTS、および KittenTTS サーバー管理 |
| `oauth.rs` | Lichess/Chess.com アカウント連携用の OAuth2 フロー |

### 設計パターン

- **全面的な非同期処理:** Tokio ランタイム、ノンブロッキング I/O
- **並行状態管理:** エンジンプロセス、DB 接続、キャッシュに `DashMap`（並行 HashMap）を使用
- **コネクションプーリング:** r2d2 が SQLite のコネクションプールを管理
- **メモリマップ検索:** mmap されたバイナリインデックスによる局面検索で瞬時に結果を返す
- **イベントストリーミング:** Rust がイベント（ベストムーブ、クロック、ゲーム終了）を発行し、React がリアルタイムで受信

---

## React/TypeScript 側: src/

### ビルドパイプライン: Vite

`vite.config.ts` の設定内容：
- **React プラグイン** — Babel コンパイラ付き
- **TanStack Router プラグイン** — `routes/` フォルダからルートツリーを自動生成
- **Vanilla Extract** — ゼロランタイム CSS-in-JS
- **パスエイリアス:** `@` を `./src` にマッピング
- **開発サーバー** はポート 1420

ビルドフロー：
```
pnpm dev   → Vite on :1420 + Tauri opens webview pointing to it
pnpm build → tsc (typecheck) → vite build (bundle to dist/) → tauri build (native binary)
```

### エントリー: App.tsx

ルートコンポーネントの役割：
- Tauri プラグインの初期化（ログ、プロセス、アップデーター）
- 永続化アトムからのユーザー設定の読み込み
- Mantine UI テーマの設定
- ルーターの登録
- アプリのアップデート確認

### 状態管理

**Jotai アトム** (`src/state/atoms.ts`) — 軽量なリアクティブ状態：

| カテゴリ | 例 |
|----------|---------|
| タブ | `tabsAtom`, `activeTabAtom` (マルチドキュメントインターフェース) |
| ディレクトリ | `storedDocumentDirAtom`, `storedDatabasesDirAtom` |
| UI 設定 | `primaryColorAtom`, `fontSizeAtom`, `pieceSetAtom` |
| エンジン | `engineMovesFamily`, `engineProgressFamily` (atomFamily によるタブごとの状態) |
| TTS | `ttsEnabledAtom`, `ttsProviderAtom`, `ttsVoiceIdAtom`, `ttsVolumeAtom`, `ttsSpeedAtom`, `ttsLanguageAtom` |

`atomWithStorage()` を持つアトムは自動的に localStorage に永続化されます。

**Zustand ストア** は複雑なドメイン状態を管理します：
- `src/state/store/tree.ts` — ゲームツリーのナビゲーション、手順の分岐、アノテーション、コメント。不変更新に Immer を使用。
- `src/state/store/database.ts` — データベースビューのフィルター、選択されたゲーム、ページネーション

### ルーティング: TanStack Router

`src/routes/` でのファイルベースルーティング：
```
routes/
  __root.tsx          # Root layout (AppShell, menu bar)
  index.tsx           # Home/dashboard
  databases/          # Database browsing
  accounts.tsx        # Lichess/Chess.com accounts
  settings.tsx        # App preferences
  engines.tsx         # Engine management
```

### コンポーネント: src/components/

| グループ | 用途 |
|-------|---------|
| `boards/` | チェスボード (chessground)、着手入力、評価バー、解析表示、プロモーションモーダル、矢印描画 |
| `panels/` | サイドパネル: エンジン解析 (BestMoves)、データベース局面検索、アノテーション編集、ゲーム情報、練習モード |
| `databases/` | データベース UI: ゲームテーブル、プレイヤーテーブル、詳細カード、フィルタリング |
| `settings/` | 設定フォーム、エンジンパス、TTS 設定 |
| `home/` | アカウントカード、インポート UI |
| `common/` | 共有コンポーネント: TreeStateContext、駒の物量表示、コメントスピーカーアイコン |
| `tabs/` | マルチタブバー |

---

## フロントエンドから Rust を呼び出す方法

### コマンド（リクエスト/レスポンス）

Specta が `src/bindings/generated.ts` に TypeScript バインディングを自動生成します：

```typescript
// Auto-generated from Rust #[tauri::command] functions
export const commands = {
  async getBestMoves(id, engine, tab, goMode, options) {
    return await TAURI_INVOKE("get_best_moves", { id, engine, tab, goMode, options });
  },
  // ~50 more commands...
}
```

React コンポーネントからは通常の非同期関数として呼び出せます：

```typescript
import { commands } from "@/bindings";
const result = await commands.getBestMoves(id, engine, tab, goMode, options);
```

### イベント（ストリーミング、Rust → React）

リアルタイムデータ（エンジン解析、クロック、ゲームの着手）の場合：

```
Rust:  app.emit("best_moves_payload", BestMovesPayload { depth: 24, ... })
         ↓
React: listen("best_moves_payload", (event) => updateBestMoves(event.payload))
```

### Tauri プラグイン

アプリはシステムアクセスのためにいくつかの公式プラグインを使用しています：

| プラグイン | 用途 |
|--------|---------|
| `@tauri-apps/plugin-fs` | ファイルの読み書き |
| `@tauri-apps/plugin-dialog` | ファイル選択ダイアログ、メッセージボックス |
| `@tauri-apps/plugin-http` | HTTP クライアント（エンジンのダウンロード、クラウド TTS） |
| `@tauri-apps/plugin-shell` | UCI エンジンの実行 |
| `@tauri-apps/plugin-updater` | 自動アップデートチェック |
| `@tauri-apps/plugin-log` | 構造化ロギング |
| `@tauri-apps/plugin-os` | CPU/RAM の検出 |

---

## テキスト読み上げ（TTS）：入門ガイド

En Parlant~ は、ゲームをステップスルーしながらチェスの着手やコメントを音声で読み上げることができます。このセクションでは、TTS システムの構築方法 — 前処理パイプライン、プロバイダーアーキテクチャ、キャッシュ戦略について説明します。設定手順については、TTS メニューの TTS ガイドを参照してください。

### TTS の仕組み（簡単な説明）

テキスト読み上げ（TTS）は、書かれたテキストを音声に変換します。現代の TTS システムは、数千時間の人間の音声で訓練されたディープニューラルネットワーク上に構築されています。モデルはテキスト（文字、単語、句読点）と音声の音響的特徴（ピッチ、タイミング、強調、呼吸の間）の関係を学習します。推論時にテキストを入力すると、音声波形が返されます。

大きく分けて 2 つのアプローチがあります：

- **クラウド TTS** — テキストをリモートサーバー（Google、ElevenLabs など）に送信し、そこで大規模なニューラルネットワークが GPU ハードウェア上で動作して音声を返します。品質は優れていますが、インターネット接続が必要で、リクエストごとにコストがかかります（ただし、ほとんどのプロバイダーが無料枠を提供しています）。

- **ローカル TTS** — モデルがお使いのマシン上で直接動作します。インターネット接続不要、リクエストごとのコストなし、テキストがコンピュータの外に出ることもありません。最近のオープンソースモデル（Kokoro や Piper など）により、品質の差は大幅に縮まっています。

TTS モデルの内部的な仕組みに興味がある方は、HuggingFace (huggingface.co) で数百のオープンソース音声合成モデルを探索、ダウンロード、ローカルで実行できます。「text-to-speech」で検索すれば、軽量な CPU 向けのモデルから最先端の研究モデルまで見つけることができます。

### プロバイダーアーキテクチャ

TTS のコア実装は `src/utils/tts.ts` にあります。**単一の公開インターフェース**（`speakText()`）と交換可能なバックエンドを中心に設計されています。アプリの他の部分は、どのプロバイダーがアクティブかを知る必要も気にする必要もありません — `speakText()` を呼び出すだけで音声が出力されます。

5 つのプロバイダーがサポートされています：

| プロバイダー | タイプ | バックエンド |
|----------|------|---------|
| **ElevenLabs** | クラウド | REST API 経由のニューラル音声。MP3 を返します。 |
| **Google Cloud TTS** | クラウド | REST API 経由の WaveNet 音声。base64 エンコードされた MP3 を返します。 |
| **KittenTTS** | ローカル | バンドルされた TTS サーバー、Rust バックエンドにより自動起動。localhost 上の HTTP で通信します。 |
| **OpenTTS** | ローカル | セルフホスト型 TTS サーバー。多数のエンジン（espeak、MaryTTS、Piper など）をサポートします。 |
| **System TTS** | ローカル | Rust/Tauri コマンド経由の OS ネイティブ音声エンジン（Linux では speech-dispatcher、Windows では SAPI、macOS では AVSpeechSynthesizer）。 |

プロバイダーの選択は単一の Jotai アトム（`ttsProviderAtom`）に保存されます。プロバイダーの切り替えは即座に行われます — アトムを変更すれば、次の `speakText()` 呼び出しが新しいバックエンドにルーティングされます。

### 課題：チェス記譜法は英語ではない

チェスの着手は標準代数記譜法（SAN）で記述されます：`Nf3`、`Bxe5+`、`O-O-O`、`e8=Q#`。これをそのまま TTS エンジンに渡すと意味不明な発音になります — 「Nf3」を単語として発音しようとしたり、「O-O-O」を「オー・オー・オー」と読んだりする可能性があります。

解決策は、チェス記譜法を TTS エンジンに渡す前に自然言語に変換する**前処理パイプライン**です：

```
SAN Input         →  Preprocessing  →  Spoken Output
─────────────────────────────────────────────────────
"Nf3"             →  sanToSpoken()  →  "Knight f3"
"Bxe5+"           →  sanToSpoken()  →  "Bishop takes e5, check"
"O-O-O"           →  sanToSpoken()  →  "castles queenside"
"e8=Q#"           →  sanToSpoken()  →  "e8 promotes to Queen, checkmate"
```

`sanToSpoken()` 関数は正規表現パターンマッチングを使用して、あらゆる SAN 文字列をその構成要素（駒、曖昧さ回避、取る手、移動先、プロモーション、チェック/チェックメイト）に分解し、語彙テーブルの自然言語を使って再構成します。

### 多言語サポート

チェス用語は 8 言語（英語、フランス語、スペイン語、ドイツ語、日本語、ロシア語、中国語、韓国語）に翻訳されています。`CHESS_VOCAB` テーブルが各用語をマッピングします：

```
English:  "Knight takes e5, check"
French:   "Cavalier prend e5, échec"
German:   "Springer schlägt e5, Schach"
Japanese: "ナイト テイクス e5, チェック"
Russian:  "Конь берёт e5, шах"
```

言語設定は、前処理に使用する語彙テーブル*と* TTS エンジンが合成に使用する音声/アクセントの両方を決定します。

### コメントのクリーニング

ゲームのアノテーションには、読み上げると不自然に聞こえる PGN 固有のマークアップが含まれていることがよくあります：

```
Raw comment:    "BLUNDER. 7.Nf3 was better [%eval -2.3] [%cal Gg1f3]"
After cleaning: "7, Knight f3 was better"
```

`cleanCommentForTTS()` 関数の処理：
1. PGN タグを除去：`[%eval ...]`、`[%csl ...]`、`[%cal ...]`、`[%clk ...]`
2. 重複するアノテーション語句の削除（「??」が既に「Blunder」と読み上げた場合）
3. 文中のインライン SAN を展開：`"7.Nf3 controls e5"` → `"7, Knight f3 controls e5"`
4. TTS エンジンが誤って発音するチェス用語の修正（例：「en prise」→「on preez」）
5. 文中の駒の略語を展開：`"R vs R"` → `"Rook versus Rook"`

### 完全なナレーションの構築

新しい手に進むと、`buildNarration()` が 3 つのソースから完全な読み上げテキストを組み立てます：

```
Move:        "12, Knight f3, check."        ← from sanToSpoken()
Annotation:  "Good move."                   ← from annotation symbol (!)
Comment:     "Developing with tempo."       ← from cleanCommentForTTS()

Full narration: "12, Knight f3, check.  Good move.  Developing with tempo."
```

各パーツ間のダブルスペースにより、TTS エンジンに自然な呼吸の間を与えます。

### キャッシュと再生

クラウド TTS の呼び出しにはコストがかかり、時間もかかります（約 200〜500ms のラウンドトリップ）。同じ音声の再取得を避けるため、生成されたすべてのクリップは Blob URL としてメモリにキャッシュされます：

```
Cache key:  "elevenlabs:pNInz6obpgDQGcFmaJgB:en:12, Knight f3, check."
Cache value: blob:http://localhost/abc123  (the MP3 audio in browser memory)
```

キャッシュヒット時は即座に再生されます。キャッシュキーは `provider:voice:language:text` で構成されているため、音声や言語を切り替えると別のエントリーが作成されます。

アノテーションが多いゲームでは、ゲームツリー全体をバックグラウンドで**プリキャッシュ**できます。アプリがすべてのノードを巡回し、ナレーションテキストを構築し、ナビゲーションを開始する前にキャッシュを埋めるための API 呼び出しを順次実行します。

### 並行処理とキャンセル

矢印キーでの高速ナビゲーションは問題を引き起こします：ユーザーが素早く 5 回前に進むと、5 つの音声クリップが重なり合って再生されるのは望ましくありません。解決策は**世代カウンター**です：

```typescript
const thisGeneration = ++requestGeneration;
// ... fetch audio ...
if (thisGeneration !== requestGeneration) return;  // stale — discard
```

新しい `speakText()` 呼び出しのたびにカウンターがインクリメントされ、`AbortController` を介して進行中の HTTP リクエストが中断されます。音声が到着すると、その世代がまだ現在のものかどうかを確認します。ユーザーが既に先に進んでいた場合、レスポンスは黙って破棄されます。これにより、手を素早くクリックしても、クリーンでグリッチのない音声再生が実現します。

### TTS のアプリへの統合ポイント

統合ポイントは最小限です：

| ファイル | 処理内容 |
|------|-------------|
| `src/state/store/tree.ts` | すべてのナビゲーション関数（`goToNext`、`goToPrevious` など）が `stopSpeaking()` を呼び出します。自動ナレーションがオンの場合、`goToNext` は `speakMoveNarration()` も呼び出します。 |
| `src/components/common/Comment.tsx` | 各コメントの横にあるスピーカーアイコンで、そのコメントの TTS を手動でトリガーできます。 |
| `src/components/settings/TTSSettings.tsx` | プロバイダー、音声、言語、音量、速度の選択および API キーの入力のための設定 UI です。 |

TTS がオフの場合、このコードは一切実行されません。アプリはアップストリームの En Croissant と同一の動作をします。

---

## データフローの例

### エンジン解析

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

### データベース局面検索

```
User reaches a position on the board
  → React calls commands.searchPosition(fen, gameQuery)
  → Rust queries memory-mapped binary search index
  → Returns: PositionStats (wins/losses/draws) + matching games
  → React renders DatabasePanel with results table
```

### TTS ナレーション

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

## ディレクトリマップ

```
en-parlant/
├── src-tauri/                    # RUST バックエンド
│   ├── src/
│   │   ├── main.rs              # エントリー、コマンド登録、プラグイン
│   │   ├── chess.rs             # エンジン解析
│   │   ├── game.rs              # ライブゲーム管理
│   │   ├── db/                  # SQLite データベース（最大のモジュール）
│   │   ├── engine/              # UCI プロトコル
│   │   ├── pgn.rs               # PGN パース
│   │   ├── puzzle.rs            # パズルデータベース
│   │   ├── opening.rs           # オープニング検索
│   │   └── tts.rs               # システム TTS + KittenTTS 管理
│   ├── Cargo.toml               # Rust 依存関係
│   ├── tauri.conf.json          # Tauri 設定
│   └── capabilities/main.json   # セキュリティ権限
│
├── src/                          # REACT/TS フロントエンド
│   ├── App.tsx                  # ルートコンポーネント
│   ├── state/
│   │   ├── atoms.ts             # Jotai アトム（全アプリ状態）
│   │   └── store/tree.ts        # ゲームツリー（Zustand + TTS フック）
│   ├── routes/                  # TanStack Router（ファイルベース）
│   ├── components/
│   │   ├── boards/              # チェスボード + 解析
│   │   ├── panels/              # サイドパネル
│   │   ├── databases/           # DB ブラウジング UI
│   │   ├── common/              # コメント表示（TTS スピーカーアイコン付き）
│   │   └── settings/            # 設定、TTS 設定
│   ├── utils/
│   │   ├── chess.ts             # ゲームロジック
│   │   ├── tts.ts               # TTS エンジン（SAN→読み上げ変換、キャッシュ、5 プロバイダー）
│   │   └── treeReducer.ts       # ツリーデータ構造
│   ├── bindings/                # Rust から自動生成された TS
│   └── translation/             # i18n（13 言語）
│
├── docs/                         # バンドルされたドキュメント（ヘルプメニューに表示）
├── vite.config.ts               # ビルド設定
└── package.json                 # フロントエンド依存関係
```

---

## 主なポイント

1. **Rust が重い処理を担当** — エンジン、データベース、ファイル I/O、PGN パース。React はファイルシステムに直接触れたり、プロセスを直接起動したりすることはありません。

2. **境界を越えた型安全性** — Specta が Rust の構造体から TypeScript の型を生成するため、Rust コマンドのシグネチャが変更されると、TypeScript のビルドが即座に壊れます。

3. **2 つの状態管理システム** — 単純なリアクティブ状態（設定、UI プリファレンス、タブごとのエンジン状態）には Jotai、複雑なドメイン状態（分岐と不変更新を伴うゲームツリー）には Zustand を使用。

4. **TTS は前処理の問題** — 難しいのは音声 API を呼び出すことではなく、チェス記譜法と PGN マークアップを 8 言語にわたって自然で聞きやすいテキストに変換することです。`sanToSpoken()` と `cleanCommentForTTS()` のパイプラインこそが本当の作業が行われる場所です。

5. **5 つのプロバイダー、1 つのインターフェース** — 音声が ElevenLabs、Google Cloud、KittenTTS、OpenTTS、OS の音声エンジンのいずれから来るとしても、アプリの他の部分は `speakText()` を呼び出すだけです。プロバイダーの選択は単一のアトムの切り替えです。

6. **ビルドは単一のバイナリを生成** — `src-tauri/target/release/en-parlant` に Rust バックエンドと Vite でビルドされたフロントエンドアセットがバンドルされます。
