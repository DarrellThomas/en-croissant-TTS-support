[English](../en/architecture.md) | [Français](../fr/architecture.md) | [Español](../es/architecture.md) | [Deutsch](../de/architecture.md) | [日本語](../ja/architecture.md) | **Русский** | [中文](../zh/architecture.md) | [한국어](../ko/architecture.md)

# Архитектура En Parlant~ — Вводное руководство

**Версия приложения:** v0.1.1 (форк: DarrellThomas/en-parlant)
**Стек:** Tauri v2 (Rust) + React 19 (TypeScript) + Vite

---

## Что такое Tauri?

Tauri — это фреймворк для создания десктопных приложений. В отличие от Electron, который поставляется с полноценным браузером, Tauri использует встроенный в операционную систему webview для отображения интерфейса и процесс на Rust для серверной части. В результате получается компактный и быстрый исполняемый файл.

Две половины приложения взаимодействуют через IPC (межпроцессное взаимодействие):

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

## Серверная часть на Rust: src-tauri/src/

Rust берёт на себя всё, что требует высокой производительности или системного доступа.

### Точка входа: main.rs

Регистрирует около 50 команд, которые может вызывать фронтенд, инициализирует плагины (файловая система, диалоги, HTTP, shell, логирование, автообновление) и запускает окно приложения.

Команды определяются с помощью макроса:

```rust
#[tauri::command]
async fn get_best_moves(id: String, engine: String, ...) -> Result<...> {
    // spawn UCI engine, return analysis
}
```

Крейт `specta` автоматически генерирует TypeScript-определения типов из этих Rust-функций, благодаря чему фронтенд получает полную типобезопасность без ручной работы.

### Ключевые модули

| Модуль | Назначение |
|--------|-----------|
| `db/mod.rs` | База данных SQLite через Diesel ORM — запросы партий, статистика игроков, импорт, поиск позиций |
| `game.rs` | Игровой движок — управление партиями «движок против человека» и «движок против движка», контроль времени, валидация ходов |
| `chess.rs` | Анализ движком — запуск UCI-движков, потоковая передача лучших ходов на фронтенд через события |
| `engine/` | Реализация протокола UCI — запуск процессов, каналы stdin/stdout, поддержка multi-PV |
| `pgn.rs` | Чтение, запись и токенизация PGN-файлов |
| `opening.rs` | Поиск названия дебюта по FEN (бинарные данные встроены в приложение) |
| `puzzle.rs` | База задач Lichess — произвольный доступ через отображение файлов в память |
| `fs.rs` | Скачивание файлов с возможностью возобновления, установка прав на исполнение |
| `sound.rs` | Локальный HTTP-сервер для потоковой передачи аудио (обходное решение для Linux) |
| `tts.rs` | Системный TTS через speech-dispatcher (Linux) / нативные API операционной системы, а также управление сервером KittenTTS |
| `oauth.rs` | Процесс OAuth2 для привязки аккаунтов Lichess/Chess.com |

### Архитектурные паттерны

- **Асинхронность повсюду:** среда выполнения Tokio, неблокирующий ввод-вывод
- **Конкурентное состояние:** `DashMap` (потокобезопасная HashMap) для процессов движков, подключений к БД, кэшей
- **Пул соединений:** r2d2 управляет пулом соединений SQLite
- **Поиск через отображение в память:** поиск позиций через mmap-индексированный бинарный файл для мгновенных результатов
- **Потоковая передача событий:** Rust отправляет события (лучшие ходы, тики часов, конец партии), которые React отслеживает в реальном времени

---

## Фронтенд на React/TypeScript: src/

### Конвейер сборки: Vite

`vite.config.ts` конфигурирует:
- **Плагин React** с компилятором Babel
- **Плагин TanStack Router** — автоматическая генерация дерева маршрутов из папки `routes/`
- **Vanilla Extract** — CSS-in-JS без runtime-затрат
- **Псевдоним пути:** `@` указывает на `./src`
- **Сервер разработки** на порту 1420

Процесс сборки:
```
pnpm dev   → Vite on :1420 + Tauri opens webview pointing to it
pnpm build → tsc (typecheck) → vite build (bundle to dist/) → tauri build (native binary)
```

### Точка входа: App.tsx

Корневой компонент:
- Инициализирует плагины Tauri (логирование, управление процессами, автообновление)
- Загружает пользовательские настройки из персистентных атомов
- Настраивает тему Mantine UI
- Регистрирует маршрутизатор
- Проверяет наличие обновлений приложения

### Управление состоянием

**Атомы Jotai** (`src/state/atoms.ts`) — легковесное реактивное состояние:

| Категория | Примеры |
|-----------|---------|
| Вкладки | `tabsAtom`, `activeTabAtom` (многодокументный интерфейс) |
| Директории | `storedDocumentDirAtom`, `storedDatabasesDirAtom` |
| Настройки UI | `primaryColorAtom`, `fontSizeAtom`, `pieceSetAtom` |
| Движок | `engineMovesFamily`, `engineProgressFamily` (для каждой вкладки через atomFamily) |
| TTS | `ttsEnabledAtom`, `ttsProviderAtom`, `ttsVoiceIdAtom`, `ttsVolumeAtom`, `ttsSpeedAtom`, `ttsLanguageAtom` |

Атомы с `atomWithStorage()` автоматически сохраняются в localStorage.

**Хранилища Zustand** для сложного доменного состояния:
- `src/state/store/tree.ts` — навигация по дереву партии, ветвление ходов, аннотации, комментарии. Использует Immer для иммутабельных обновлений.
- `src/state/store/database.ts` — фильтры представления базы данных, выбранная партия, пагинация

### Маршрутизация: TanStack Router

Файловая маршрутизация в `src/routes/`:
```
routes/
  __root.tsx          # Root layout (AppShell, menu bar)
  index.tsx           # Home/dashboard
  databases/          # Database browsing
  accounts.tsx        # Lichess/Chess.com accounts
  settings.tsx        # App preferences
  engines.tsx         # Engine management
```

### Компоненты: src/components/

| Группа | Назначение |
|--------|-----------|
| `boards/` | Шахматная доска (chessground), ввод ходов, шкала оценки, отображение анализа, модал превращения, рисование стрелок |
| `panels/` | Боковые панели: анализ движком (BestMoves), поиск позиций в базе, редактирование аннотаций, информация о партии, режим тренировки |
| `databases/` | Интерфейс базы данных: таблица партий, таблица игроков, карточки с деталями, фильтрация |
| `settings/` | Формы настроек, пути к движкам, настройки TTS |
| `home/` | Карточки аккаунтов, интерфейс импорта |
| `common/` | Общие компоненты: TreeStateContext, отображение материала, иконка динамика для озвучки комментариев |
| `tabs/` | Панель вкладок |

---

## Как фронтенд вызывает Rust

### Команды (запрос/ответ)

Specta генерирует TypeScript-привязки в `src/bindings/generated.ts`:

```typescript
// Auto-generated from Rust #[tauri::command] functions
export const commands = {
  async getBestMoves(id, engine, tab, goMode, options) {
    return await TAURI_INVOKE("get_best_moves", { id, engine, tab, goMode, options });
  },
  // ~50 more commands...
}
```

Компоненты React вызывают их как обычные асинхронные функции:

```typescript
import { commands } from "@/bindings";
const result = await commands.getBestMoves(id, engine, tab, goMode, options);
```

### События (потоковая передача, Rust → React)

Для передачи данных в реальном времени (анализ движком, тики часов, ходы в партии):

```
Rust:  app.emit("best_moves_payload", BestMovesPayload { depth: 24, ... })
         ↓
React: listen("best_moves_payload", (event) => updateBestMoves(event.payload))
```

### Плагины Tauri

Приложение использует несколько официальных плагинов для системного доступа:

| Плагин | Назначение |
|--------|-----------|
| `@tauri-apps/plugin-fs` | Чтение и запись файлов |
| `@tauri-apps/plugin-dialog` | Диалоги выбора файлов, окна сообщений |
| `@tauri-apps/plugin-http` | HTTP-клиент (скачивание движков, облачный TTS) |
| `@tauri-apps/plugin-shell` | Запуск UCI-движков |
| `@tauri-apps/plugin-updater` | Проверка автообновлений |
| `@tauri-apps/plugin-log` | Структурированное логирование |
| `@tauri-apps/plugin-os` | Определение CPU/RAM |

---

## Синтез речи (TTS): Введение

En Parlant~ может озвучивать шахматные ходы и комментарии по мере того, как вы просматриваете партию. В этом разделе объясняется, как устроена система TTS — конвейер предобработки, архитектура провайдеров и стратегия кэширования. Инструкции по настройке смотрите в руководствах по TTS в меню TTS.

### Как работает TTS (кратко)

Синтез речи преобразует письменный текст в звуковое аудио. Современные системы TTS построены на глубоких нейронных сетях, обученных на тысячах часов человеческой речи. Модель учится связи между текстом (буквы, слова, знаки препинания) и акустическими характеристиками речи (высота тона, темп, ударение, дыхательные паузы). На этапе генерации вы подаёте текст и получаете аудиоволну.

Существует два основных подхода:

- **Облачный TTS** — текст отправляется на удалённый сервер (Google, ElevenLabs и др.), где мощная нейронная сеть на GPU-оборудовании обрабатывает его и возвращает аудио. Превосходное качество, но требует подключения к интернету и оплачивается за каждый запрос (хотя большинство провайдеров предлагают бесплатные тарифы).

- **Локальный TTS** — модель работает непосредственно на вашем компьютере. Не нужен интернет, нет стоимости за запрос, а ваш текст никогда не покидает ваш компьютер. Современные модели с открытым исходным кодом (такие как Kokoro и Piper) значительно сократили разрыв в качестве.

Если вам интересно, как TTS-модели работают изнутри, на HuggingFace (huggingface.co) размещены сотни моделей синтеза речи с открытым исходным кодом, которые можно изучать, скачивать и запускать локально. Ищите по запросу «text-to-speech», чтобы найти модели — от легковесных вариантов для CPU до передовых исследовательских моделей.

### Архитектура провайдеров

Основная реализация TTS находится в `src/utils/tts.ts`. Она построена вокруг **единого публичного интерфейса** (`speakText()`) со сменными бэкендами. Остальная часть приложения не знает и не заботится о том, какой провайдер активен — она просто вызывает `speakText()`, и звучит аудио.

Поддерживаются пять провайдеров:

| Провайдер | Тип | Бэкенд |
|-----------|-----|--------|
| **ElevenLabs** | Облачный | Нейронные голоса через REST API. Возвращает MP3. |
| **Google Cloud TTS** | Облачный | Голоса WaveNet через REST API. Возвращает MP3 в кодировке base64. |
| **KittenTTS** | Локальный | Встроенный TTS-сервер, автоматически запускаемый бэкендом на Rust. Взаимодействует по HTTP на localhost. |
| **OpenTTS** | Локальный | Самостоятельно размещаемый TTS-сервер. Поддерживает множество движков (espeak, MaryTTS, Piper и др.). |
| **System TTS** | Локальный | Встроенный движок речи ОС через команды Rust/Tauri (speech-dispatcher на Linux, SAPI на Windows, AVSpeechSynthesizer на macOS). |

Выбор провайдера хранится в одном атоме Jotai (`ttsProviderAtom`). Переключение провайдеров мгновенно — измените атом, и следующий вызов `speakText()` направится к новому бэкенду.

### Проблема: шахматная нотация — это не обычный язык

Шахматные ходы записываются в стандартной алгебраической нотации (SAN): `Nf3`, `Bxe5+`, `O-O-O`, `e8=Q#`. Если подать это напрямую в TTS-движок, получится бессмыслица — он может попытаться произнести «Nf3» как слово или прочитать «O-O-O» как «о-о-о».

Решение — **конвейер предобработки**, который переводит шахматную нотацию в естественный язык до того, как текст попадёт в TTS-движок:

```
SAN Input         →  Preprocessing  →  Spoken Output
─────────────────────────────────────────────────────
"Nf3"             →  sanToSpoken()  →  "Knight f3"
"Bxe5+"           →  sanToSpoken()  →  "Bishop takes e5, check"
"O-O-O"           →  sanToSpoken()  →  "castles queenside"
"e8=Q#"           →  sanToSpoken()  →  "e8 promotes to Queen, checkmate"
```

Функция `sanToSpoken()` использует сопоставление с регулярными выражениями для разложения любой SAN-строки на компоненты (фигура, уточнение, взятие, поле назначения, превращение, шах/мат) и собирает их обратно, используя естественный язык из таблицы словаря.

### Многоязычная поддержка

Шахматный словарь переведён на 8 языков (английский, французский, испанский, немецкий, японский, русский, китайский, корейский). Таблица `CHESS_VOCAB` сопоставляет каждый термин:

```
English:  "Knight takes e5, check"
French:   "Cavalier prend e5, échec"
German:   "Springer schlägt e5, Schach"
Japanese: "ナイト テイクス e5, チェック"
Russian:  "Конь берёт e5, шах"
```

Настройка языка определяет, какая таблица словаря используется для предобработки, *а также* какой голос/акцент TTS-движок использует для синтеза.

### Очистка комментариев

Аннотации к партиям часто содержат PGN-специфичную разметку, которая звучала бы ужасно при озвучивании:

```
Raw comment:    "BLUNDER. 7.Nf3 was better [%eval -2.3] [%cal Gg1f3]"
After cleaning: "7, Knight f3 was better"
```

Функция `cleanCommentForTTS()`:
1. Удаляет PGN-теги: `[%eval ...]`, `[%csl ...]`, `[%cal ...]`, `[%clk ...]`
2. Убирает дублирующиеся слова аннотаций (когда «??» уже произнесло «Грубая ошибка»)
3. Раскрывает встроенную SAN в тексте: `"7.Nf3 controls e5"` → `"7, Knight f3 controls e5"`
4. Исправляет шахматные термины, которые TTS-движки произносят неправильно (например, «en prise» → «on preez»)
5. Раскрывает сокращения фигур в тексте: `"R vs R"` → `"Rook versus Rook"`

### Формирование полной озвучки

При переходе к новому ходу `buildNarration()` собирает полный текст для произнесения из трёх источников:

```
Move:        "12, Knight f3, check."        ← from sanToSpoken()
Annotation:  "Good move."                   ← from annotation symbol (!)
Comment:     "Developing with tempo."       ← from cleanCommentForTTS()

Full narration: "12, Knight f3, check.  Good move.  Developing with tempo."
```

Двойной пробел между частями даёт TTS-движкам естественную дыхательную паузу.

### Кэширование и воспроизведение

Вызовы облачного TTS стоят денег и занимают время (~200–500 мс на запрос). Чтобы не загружать одно и то же аудио повторно, каждый сгенерированный клип кэшируется в памяти как blob URL:

```
Cache key:  "elevenlabs:pNInz6obpgDQGcFmaJgB:en:12, Knight f3, check."
Cache value: blob:http://localhost/abc123  (the MP3 audio in browser memory)
```

При попадании в кэш воспроизведение мгновенно. Ключ кэша формируется как `provider:voice:language:text`, поэтому при смене голоса или языка создаются отдельные записи.

Для партий с большим количеством аннотаций можно **предзагрузить кэш** для всего дерева партии в фоновом режиме. Приложение обходит каждый узел, формирует текст озвучки и последовательно отправляет API-запросы для заполнения кэша, прежде чем вы начнёте навигацию.

### Конкурентность и отмена

Быстрая навигация стрелками создаёт проблему: если пользователь нажмёт «вперёд» 5 раз подряд, не хотелось бы, чтобы 5 аудиоклипов одновременно боролись друг с другом. Решение — **счётчик поколений**:

```typescript
const thisGeneration = ++requestGeneration;
// ... fetch audio ...
if (thisGeneration !== requestGeneration) return;  // stale — discard
```

Каждый новый вызов `speakText()` увеличивает счётчик и прерывает любой текущий HTTP-запрос через `AbortController`. Когда аудио приходит, проверяется, актуально ли ещё его поколение. Если пользователь уже перешёл дальше, ответ тихо отбрасывается. Это обеспечивает чистое воспроизведение без артефактов даже при быстром пролистывании ходов.

### Где TTS подключается к приложению

Точек интеграции минимум:

| Файл | Что происходит |
|------|---------------|
| `src/state/store/tree.ts` | Каждая функция навигации (`goToNext`, `goToPrevious` и др.) вызывает `stopSpeaking()`. При включённой автоозвучке `goToNext` также вызывает `speakMoveNarration()`. |
| `src/components/common/Comment.tsx` | Иконка динамика рядом с каждым комментарием позволяет вручную запустить TTS для этого комментария. |
| `src/components/settings/TTSSettings.tsx` | Интерфейс настроек для выбора провайдера, голоса, языка, громкости, скорости и ввода API-ключей. |

Когда TTS отключён, ничего из этого кода не выполняется. Приложение ведёт себя идентично исходному En Croissant.

---

## Примеры потоков данных

### Анализ движком

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

### Поиск позиции в базе данных

```
User reaches a position on the board
  → React calls commands.searchPosition(fen, gameQuery)
  → Rust queries memory-mapped binary search index
  → Returns: PositionStats (wins/losses/draws) + matching games
  → React renders DatabasePanel with results table
```

### Озвучка TTS

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

## Карта каталогов

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

## Ключевые выводы

1. **Rust берёт на себя тяжёлую работу** — движки, база данных, файловый ввод-вывод, разбор PGN. React никогда не обращается к файловой системе и не запускает процессы напрямую.

2. **Типобезопасность на границе** — Specta генерирует TypeScript-типы из Rust-структур, поэтому если Rust-команда изменит свою сигнатуру, сборка TypeScript сразу же сломается.

3. **Две системы состояния** — Jotai для простого реактивного состояния (настройки, параметры интерфейса, состояние движка для каждой вкладки), Zustand для сложного доменного состояния (дерево партии с ветвлением и иммутабельными обновлениями).

4. **TTS — это задача предобработки** — сложность не в вызове API синтеза речи, а в переводе шахматной нотации и PGN-разметки в чистый, естественно звучащий текст на 8 языках. Конвейеры `sanToSpoken()` и `cleanCommentForTTS()` — вот где выполняется настоящая работа.

5. **Пять провайдеров — один интерфейс** — независимо от того, приходит ли аудио от ElevenLabs, Google Cloud, KittenTTS, OpenTTS или встроенного движка речи вашей ОС, остальная часть приложения вызывает только `speakText()`. Выбор провайдера — это переключение одного атома.

6. **Сборка создаёт один исполняемый файл** по пути `src-tauri/target/release/en-parlant`, который объединяет бэкенд на Rust и собранные Vite ресурсы фронтенда.
