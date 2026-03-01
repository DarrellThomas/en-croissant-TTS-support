[English](../en/architecture.md) | [Français](../fr/architecture.md) | [Español](../es/architecture.md) | [Deutsch](../de/architecture.md) | [日本語](../ja/architecture.md) | [Русский](../ru/architecture.md) | **中文** | [한국어](../ko/architecture.md)

# En Parlant~ 架构入门

**应用版本：** v0.1.0（分支：DarrellThomas/en-parlant）
**技术栈：** Tauri v2 (Rust) + React 19 (TypeScript) + Vite

---

## 什么是 Tauri？

Tauri 是一个用于构建桌面应用程序的框架。与 Electron 打包一个完整浏览器不同，Tauri 使用操作系统自带的 webview 来渲染界面，并用一个 Rust 进程作为后端。最终得到的是一个体积小、速度快的二进制文件。

前后端通过 IPC（进程间通信）交互：

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

## Rust 端：src-tauri/src/

Rust 负责处理所有需要高性能或需要系统访问权限的工作。

### 入口：main.rs

注册约 50 个前端可以调用的命令，初始化插件（文件系统、对话框、HTTP、Shell、日志、更新器），并启动应用窗口。

命令通过宏定义：

```rust
#[tauri::command]
async fn get_best_moves(id: String, engine: String, ...) -> Result<...> {
    // spawn UCI engine, return analysis
}
```

`specta` crate 会根据这些 Rust 函数自动生成 TypeScript 类型定义，因此前端无需手动操作即可获得完整的类型安全。

### 核心模块

| 模块 | 功能 |
|--------|-------------|
| `db/mod.rs` | 通过 Diesel ORM 访问 SQLite 数据库——棋局查询、棋手统计、导入、局面搜索 |
| `game.rs` | 实时对局引擎——管理人机对弈和引擎互弈、时间控制、走法验证 |
| `chess.rs` | 引擎分析——启动 UCI 引擎，通过事件将最佳走法结果以流的方式回传给前端 |
| `engine/` | UCI 协议实现——进程启动、标准输入/输出管道、多主要变例支持 |
| `pgn.rs` | PGN 文件的读取/写入/词法分析 |
| `opening.rs` | 根据 FEN 查找开局名称（二进制数据内嵌于应用中） |
| `puzzle.rs` | Lichess 战术题库——基于内存映射的随机访问 |
| `fs.rs` | 文件下载（支持断点续传）、可执行权限设置 |
| `sound.rs` | 用于音频流的本地 HTTP 服务器（Linux 音频适配方案） |
| `tts.rs` | 通过 speech-dispatcher（Linux）/ 原生 OS 语音 API 实现系统 TTS，以及 KittenTTS 服务器管理 |
| `oauth.rs` | Lichess/Chess.com 账户绑定的 OAuth2 流程 |

### 设计模式

- **全面异步：** Tokio 运行时，非阻塞 I/O
- **并发状态：** `DashMap`（并发 HashMap）用于管理引擎进程、数据库连接和缓存
- **连接池：** r2d2 管理 SQLite 连接池
- **内存映射搜索：** 通过 mmap 二进制索引进行局面查找，实现即时结果
- **事件流：** Rust 发出事件（最佳走法、时钟计时、对局结束），React 实时监听

---

## React/TypeScript 端：src/

### 构建流水线：Vite

`vite.config.ts` 配置：
- **React 插件**，使用 Babel 编译器
- **TanStack Router 插件** —— 根据 `routes/` 文件夹自动生成路由树
- **Vanilla Extract** —— 零运行时开销的 CSS-in-JS
- **路径别名：** `@` 映射到 `./src`
- **开发服务器**运行在端口 1420

构建流程：
```
pnpm dev   → Vite on :1420 + Tauri opens webview pointing to it
pnpm build → tsc (typecheck) → vite build (bundle to dist/) → tauri build (native binary)
```

### 入口：App.tsx

根组件：
- 初始化 Tauri 插件（日志、进程、更新器）
- 从持久化 atom 加载用户偏好设置
- 设置 Mantine UI 主题
- 注册路由
- 检查应用更新

### 状态管理

**Jotai atoms**（`src/state/atoms.ts`）—— 轻量级响应式状态：

| 类别 | 示例 |
|----------|---------|
| 标签页 | `tabsAtom`、`activeTabAtom`（多文档界面） |
| 目录 | `storedDocumentDirAtom`、`storedDatabasesDirAtom` |
| UI 偏好 | `primaryColorAtom`、`fontSizeAtom`、`pieceSetAtom` |
| 引擎 | `engineMovesFamily`、`engineProgressFamily`（通过 atomFamily 实现每标签页独立） |
| TTS | `ttsEnabledAtom`、`ttsProviderAtom`、`ttsVoiceIdAtom`、`ttsVolumeAtom`、`ttsSpeedAtom`、`ttsLanguageAtom` |

使用 `atomWithStorage()` 的 atom 会自动持久化到 localStorage。

**Zustand stores** 用于复杂的领域状态：
- `src/state/store/tree.ts` —— 棋局树导航、分支走法、标注、评论。使用 Immer 实现不可变更新。
- `src/state/store/database.ts` —— 数据库视图筛选、选中棋局、分页

### 路由：TanStack Router

在 `src/routes/` 中使用基于文件的路由：
```
routes/
  __root.tsx          # Root layout (AppShell, menu bar)
  index.tsx           # Home/dashboard
  databases/          # Database browsing
  accounts.tsx        # Lichess/Chess.com accounts
  settings.tsx        # App preferences
  engines.tsx         # Engine management
```

### 组件：src/components/

| 分组 | 用途 |
|-------|---------|
| `boards/` | 棋盘（chessground）、走子输入、评估条、分析展示、升变弹窗、箭头绘制 |
| `panels/` | 侧面板：引擎分析（BestMoves）、数据库局面搜索、标注编辑、棋局信息、练习模式 |
| `databases/` | 数据库 UI：棋局表格、棋手表格、详情卡片、筛选 |
| `settings/` | 偏好设置表单、引擎路径、TTS 设置 |
| `home/` | 账户卡片、导入 UI |
| `common/` | 公共组件：TreeStateContext、子力显示、评论朗读图标 |
| `tabs/` | 多标签栏 |

---

## 前端如何调用 Rust

### 命令（请求/响应）

Specta 在 `src/bindings/generated.ts` 中生成 TypeScript 绑定：

```typescript
// Auto-generated from Rust #[tauri::command] functions
export const commands = {
  async getBestMoves(id, engine, tab, goMode, options) {
    return await TAURI_INVOKE("get_best_moves", { id, engine, tab, goMode, options });
  },
  // ~50 more commands...
}
```

React 组件像调用普通异步函数一样调用它们：

```typescript
import { commands } from "@/bindings";
const result = await commands.getBestMoves(id, engine, tab, goMode, options);
```

### 事件（流式传输，从 Rust 到 React）

用于实时数据（引擎分析、时钟计时、对局走法）：

```
Rust:  app.emit("best_moves_payload", BestMovesPayload { depth: 24, ... })
         ↓
React: listen("best_moves_payload", (event) => updateBestMoves(event.payload))
```

### Tauri 插件

应用使用多个官方插件来访问系统功能：

| 插件 | 用途 |
|--------|---------|
| `@tauri-apps/plugin-fs` | 读写文件 |
| `@tauri-apps/plugin-dialog` | 文件选择器、消息框 |
| `@tauri-apps/plugin-http` | HTTP 客户端（引擎下载、云端 TTS） |
| `@tauri-apps/plugin-shell` | 执行 UCI 引擎 |
| `@tauri-apps/plugin-updater` | 自动更新检查 |
| `@tauri-apps/plugin-log` | 结构化日志 |
| `@tauri-apps/plugin-os` | CPU/内存检测 |

---

## 文本转语音（TTS）入门

En Parlant~ 可以在你逐步浏览棋局时朗读棋步和评论。本节介绍 TTS 系统的构建方式——预处理管道、提供商架构和缓存策略。有关设置说明，请参阅 TTS 菜单中的 TTS 指南。

### TTS 的工作原理（简要版）

文本转语音技术将书面文字转换为语音音频。现代 TTS 系统基于深度神经网络构建，这些网络经过数千小时人类语音数据的训练。模型学习文本（字母、单词、标点）与语音声学特征（音高、时长、重音、换气停顿）之间的映射关系。在推理时，你输入文本，模型输出音频波形。

目前有两大类方案：

- **云端 TTS** —— 将文本发送到远程服务器（Google、ElevenLabs 等），服务器在 GPU 硬件上运行大型神经网络并返回音频。音质出色，但需要联网，且按请求计费（不过大多数提供商都有免费额度）。

- **本地 TTS** —— 模型直接在你的机器上运行。不需要联网，没有按请求计费的费用，你的文本也不会离开你的电脑。近期的开源模型（如 Kokoro 和 Piper）已经大幅缩小了与云端的质量差距。

如果你对 TTS 模型的底层原理感兴趣，HuggingFace (huggingface.co) 托管了数百个开源语音合成模型，你可以在上面探索、下载和本地运行。搜索"text-to-speech"即可找到从轻量级 CPU 友好模型到前沿研究模型在内的各种选择。

### 提供商架构

TTS 的核心实现位于 `src/utils/tts.ts`。它围绕一个**统一的公共接口**（`speakText()`）设计，后端可自由切换。应用的其他部分无需知道也不关心当前使用的是哪个提供商——只需调用 `speakText()`，语音就会播放出来。

支持五个提供商：

| 提供商 | 类型 | 后端 |
|----------|------|---------|
| **ElevenLabs** | 云端 | 通过 REST API 使用神经网络语音。返回 MP3。 |
| **Google Cloud TTS** | 云端 | 通过 REST API 使用 WaveNet 语音。返回 base64 编码的 MP3。 |
| **KittenTTS** | 本地 | 内置 TTS 服务器，由 Rust 后端自动启动。通过 localhost 上的 HTTP 通信。 |
| **OpenTTS** | 本地 | 自托管 TTS 服务器。支持多种引擎（espeak、MaryTTS、Piper 等）。 |
| **System TTS** | 本地 | 通过 Rust/Tauri 命令调用操作系统原生语音引擎（Linux 上为 speech-dispatcher，Windows 上为 SAPI，macOS 上为 AVSpeechSynthesizer）。 |

提供商选择存储在一个 Jotai atom（`ttsProviderAtom`）中。切换提供商是即时的——更改 atom 的值，下一次 `speakText()` 调用就会路由到新的后端。

### 挑战：棋谱记法不是自然语言

棋步使用标准代数记法（SAN）书写：`Nf3`、`Bxe5+`、`O-O-O`、`e8=Q#`。如果直接将这些送入 TTS 引擎，得到的将是一团乱码——它可能会试图把"Nf3"当作一个单词来发音，或者把"O-O-O"读成"oh oh oh"。

解决方案是一个**预处理管道**，在文本到达 TTS 引擎之前将棋谱记法翻译成自然语言：

```
SAN Input         →  Preprocessing  →  Spoken Output
─────────────────────────────────────────────────────
"Nf3"             →  sanToSpoken()  →  "Knight f3"
"Bxe5+"           →  sanToSpoken()  →  "Bishop takes e5, check"
"O-O-O"           →  sanToSpoken()  →  "castles queenside"
"e8=Q#"           →  sanToSpoken()  →  "e8 promotes to Queen, checkmate"
```

`sanToSpoken()` 函数使用正则表达式模式匹配将任意 SAN 字符串分解为其组成部分（棋子、消歧义标记、吃子、目标格、升变、将军/将杀），然后使用词汇表中的自然语言重新组装。

### 多语言支持

国际象棋词汇被翻译为 8 种语言（英语、法语、西班牙语、德语、日语、俄语、中文、韩语）。`CHESS_VOCAB` 表映射了每个术语：

```
English:  "Knight takes e5, check"
French:   "Cavalier prend e5, échec"
German:   "Springer schlägt e5, Schach"
Japanese: "ナイト テイクス e5, チェック"
Russian:  "Конь берёт e5, шах"
```

语言设置决定了预处理时使用哪个词汇表，*以及*TTS 引擎合成时使用哪个语音/口音。

### 评论清理

棋局标注中常常包含 PGN 特有的标记，如果直接朗读会非常难听：

```
Raw comment:    "BLUNDER. 7.Nf3 was better [%eval -2.3] [%cal Gg1f3]"
After cleaning: "7, Knight f3 was better"
```

`cleanCommentForTTS()` 函数：
1. 去除 PGN 标签：`[%eval ...]`、`[%csl ...]`、`[%cal ...]`、`[%clk ...]`
2. 移除重复的标注词（当"??"已经说了"Blunder"时）
3. 展开正文中的内联 SAN：`"7.Nf3 controls e5"` → `"7, Knight f3 controls e5"`
4. 修正 TTS 引擎会读错的国际象棋术语（如 "en prise" → "on preez"）
5. 展开正文中的棋子缩写：`"R vs R"` → `"Rook versus Rook"`

### 组装完整旁白

当你跳转到新的一步时，`buildNarration()` 从三个来源组装完整的朗读文本：

```
Move:        "12, Knight f3, check."        ← from sanToSpoken()
Annotation:  "Good move."                   ← from annotation symbol (!)
Comment:     "Developing with tempo."       ← from cleanCommentForTTS()

Full narration: "12, Knight f3, check.  Good move.  Developing with tempo."
```

各部分之间的双空格让 TTS 引擎产生自然的换气停顿。

### 缓存与播放

云端 TTS 调用既花钱又耗时（约 200-500 毫秒往返延迟）。为避免重复获取相同的音频，每段生成的音频都以 blob URL 的形式缓存在内存中：

```
Cache key:  "elevenlabs:pNInz6obpgDQGcFmaJgB:en:12, Knight f3, check."
Cache value: blob:http://localhost/abc123  (the MP3 audio in browser memory)
```

命中缓存时播放是即时的。缓存键格式为 `provider:voice:language:text`，因此切换语音或语言会创建独立的缓存条目。

对于标注丰富的棋局，你可以在后台**预缓存**整个棋局树。应用会遍历每个节点，构建旁白文本，并按顺序发起 API 调用来填充缓存，然后你再开始浏览。

### 并发与取消

快速按方向键导航会带来一个问题：如果用户快速向前跳了 5 步，你不希望 5 段音频同时播放互相干扰。解决方案是一个**生成计数器**：

```typescript
const thisGeneration = ++requestGeneration;
// ... fetch audio ...
if (thisGeneration !== requestGeneration) return;  // stale — discard
```

每次新的 `speakText()` 调用都会递增计数器，并通过 `AbortController` 中止所有正在进行的 HTTP 请求。当音频到达时，它会检查自己的生成编号是否仍然是最新的。如果用户已经跳到了别的地方，响应会被静默丢弃。这样即使快速点击浏览棋步也能获得干净、无杂音的音频。

### TTS 在应用中的集成点

集成点非常精简：

| 文件 | 功能 |
|------|-------------|
| `src/state/store/tree.ts` | 每个导航函数（`goToNext`、`goToPrevious` 等）都会调用 `stopSpeaking()`。当自动朗读开启时，`goToNext` 还会调用 `speakMoveNarration()`。 |
| `src/components/common/Comment.tsx` | 每条评论旁的扬声器图标，可手动触发该评论的 TTS 朗读。 |
| `src/components/settings/TTSSettings.tsx` | 设置界面，用于选择提供商、语音、语言、音量、语速以及输入 API 密钥。 |

当 TTS 关闭时，这些代码都不会运行。应用的行为与上游 En Croissant 完全一致。

---

## 数据流示例

### 引擎分析

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

### 数据库局面搜索

```
User reaches a position on the board
  → React calls commands.searchPosition(fen, gameQuery)
  → Rust queries memory-mapped binary search index
  → Returns: PositionStats (wins/losses/draws) + matching games
  → React renders DatabasePanel with results table
```

### TTS 旁白

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

## 目录结构

```
en-parlant/
├── src-tauri/                    # RUST 后端
│   ├── src/
│   │   ├── main.rs              # 入口、命令注册、插件
│   │   ├── chess.rs             # 引擎分析
│   │   ├── game.rs              # 实时对局管理
│   │   ├── db/                  # SQLite 数据库（最大模块）
│   │   ├── engine/              # UCI 协议
│   │   ├── pgn.rs               # PGN 解析
│   │   ├── puzzle.rs            # 战术题库
│   │   ├── opening.rs           # 开局查找
│   │   └── tts.rs               # 系统 TTS + KittenTTS 管理
│   ├── Cargo.toml               # Rust 依赖
│   ├── tauri.conf.json          # Tauri 配置
│   └── capabilities/main.json   # 安全权限
│
├── src/                          # REACT/TS 前端
│   ├── App.tsx                  # 根组件
│   ├── state/
│   │   ├── atoms.ts             # Jotai atoms（全部应用状态）
│   │   └── store/tree.ts        # 棋局树（Zustand + TTS 钩子）
│   ├── routes/                  # TanStack Router（基于文件）
│   ├── components/
│   │   ├── boards/              # 棋盘 + 分析
│   │   ├── panels/              # 侧面板
│   │   ├── databases/           # 数据库浏览 UI
│   │   ├── common/              # 评论显示（含 TTS 扬声器图标）
│   │   └── settings/            # 偏好设置、TTS 设置
│   ├── utils/
│   │   ├── chess.ts             # 棋局逻辑
│   │   ├── tts.ts               # TTS 引擎（SAN 转口语、缓存、5 个提供商）
│   │   └── treeReducer.ts       # 树数据结构
│   ├── bindings/                # 从 Rust 自动生成的 TS 绑定
│   └── translation/             # 国际化（13 种语言）
│
├── docs/                         # 内置文档（显示在帮助菜单中）
├── vite.config.ts               # 构建配置
└── package.json                 # 前端依赖
```

---

## 核心要点

1. **Rust 承担重活** —— 引擎、数据库、文件 I/O、PGN 解析。React 从不直接接触文件系统或启动进程。

2. **跨边界的类型安全** —— Specta 从 Rust 结构体生成 TypeScript 类型，因此一旦 Rust 命令的签名发生变化，TypeScript 构建会立即报错。

3. **两套状态系统** —— Jotai 用于简单的响应式状态（设置、UI 偏好、每标签页的引擎状态），Zustand 用于复杂的领域状态（带分支和不可变更新的棋局树）。

4. **TTS 本质上是一个预处理问题** —— 难点不在于调用语音 API，而在于将棋谱记法和 PGN 标记转换为干净、自然的朗读文本，并且要支持 8 种语言。`sanToSpoken()` 和 `cleanCommentForTTS()` 管道才是真正费功夫的地方。

5. **五个提供商，一个接口** —— 无论音频来自 ElevenLabs、Google Cloud、KittenTTS、OpenTTS 还是操作系统的语音引擎，应用的其他部分始终只调用 `speakText()`。提供商选择只是一个 atom 的切换。

6. **构建产出为单一二进制文件**，位于 `src-tauri/target/release/en-parlant`，其中打包了 Rust 后端和 Vite 构建的前端资源。
