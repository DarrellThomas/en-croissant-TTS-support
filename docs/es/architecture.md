[English](../en/architecture.md) | [Français](../fr/architecture.md) | **Español** | [Deutsch](../de/architecture.md) | [日本語](../ja/architecture.md) | [Русский](../ru/architecture.md) | [中文](../zh/architecture.md) | [한국어](../ko/architecture.md)

# Introducción a la Arquitectura de En Parlant~

**Versión de la aplicación:** v0.1.0 (fork: DarrellThomas/en-parlant)
**Stack tecnológico:** Tauri v2 (Rust) + React 19 (TypeScript) + Vite

---

## ¿Qué es Tauri?

Tauri es un framework para crear aplicaciones de escritorio. En lugar de incluir un navegador completo como hace Electron, Tauri utiliza el webview nativo del sistema operativo para la interfaz y un proceso en Rust para el backend. El resultado es un binario pequeño y rápido.

Las dos mitades se comunican mediante IPC (comunicación entre procesos):

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

## El lado Rust: src-tauri/src/

Rust se encarga de todo lo que necesita ser rápido o requiere acceso al sistema.

### Punto de entrada: main.rs

Registra aproximadamente 50 comandos que el frontend puede invocar, inicializa los plugins (sistema de archivos, diálogos, HTTP, shell, logging, actualizador) y lanza la ventana de la aplicación.

Los comandos se definen con una macro:

```rust
#[tauri::command]
async fn get_best_moves(id: String, engine: String, ...) -> Result<...> {
    // spawn UCI engine, return analysis
}
```

El crate `specta` genera automáticamente definiciones de tipos TypeScript a partir de estas funciones Rust, de modo que el frontend obtiene seguridad de tipos completa sin ningún esfuerzo manual.

### Módulos principales

| Módulo | Función |
|--------|---------|
| `db/mod.rs` | Base de datos SQLite mediante Diesel ORM — consultas de partidas, estadísticas de jugadores, importaciones, búsqueda por posición |
| `game.rs` | Motor de partidas en vivo — gestiona partidas motor contra humano y motor contra motor, controles de tiempo, validación de jugadas |
| `chess.rs` | Análisis de motor — ejecuta motores UCI, transmite resultados de mejores jugadas al frontend mediante eventos |
| `engine/` | Implementación del protocolo UCI — creación de procesos, pipes stdin/stdout, soporte multi-PV |
| `pgn.rs` | Lectura/escritura/tokenización de archivos PGN |
| `opening.rs` | Consulta de nombres de apertura a partir de FEN (datos binarios integrados en la aplicación) |
| `puzzle.rs` | Base de datos de puzzles de Lichess — acceso aleatorio mapeado en memoria |
| `fs.rs` | Descargas de archivos con reanudación, asignación de permisos de ejecución |
| `sound.rs` | Servidor HTTP local para streaming de audio (solución alternativa para audio en Linux) |
| `tts.rs` | TTS del sistema vía speech-dispatcher (Linux) / APIs de voz nativas del SO, además de gestión del servidor KittenTTS |
| `oauth.rs` | Flujo OAuth2 para vincular cuentas de Lichess/Chess.com |

### Patrones de diseño

- **Asincronía en todas partes:** runtime Tokio, I/O no bloqueante
- **Estado concurrente:** `DashMap` (HashMap concurrente) para procesos de motor, conexiones a BD, cachés
- **Pool de conexiones:** r2d2 gestiona pools de conexiones SQLite
- **Búsqueda mapeada en memoria:** consulta de posiciones mediante índice binario mapeado con mmap para resultados instantáneos
- **Streaming de eventos:** Rust emite eventos (mejores jugadas, tics del reloj, fin de partida) que React escucha en tiempo real

---

## El lado React/TypeScript: src/

### Pipeline de compilación: Vite

`vite.config.ts` configura:
- **Plugin de React** con compilador Babel
- **Plugin de TanStack Router** — genera automáticamente el árbol de rutas a partir de la carpeta `routes/`
- **Vanilla Extract** — CSS-in-JS sin coste en tiempo de ejecución
- **Alias de ruta:** `@` apunta a `./src`
- **Servidor de desarrollo** en el puerto 1420

Flujo de compilación:
```
pnpm dev   → Vite on :1420 + Tauri opens webview pointing to it
pnpm build → tsc (typecheck) → vite build (bundle to dist/) → tauri build (native binary)
```

### Punto de entrada: App.tsx

El componente raíz:
- Inicializa los plugins de Tauri (log, process, updater)
- Carga las preferencias del usuario desde átomos persistentes
- Configura el tema de Mantine UI
- Registra el router
- Comprueba si hay actualizaciones disponibles

### Gestión del estado

**Átomos Jotai** (`src/state/atoms.ts`) — estado reactivo ligero:

| Categoría | Ejemplos |
|-----------|----------|
| Pestañas | `tabsAtom`, `activeTabAtom` (interfaz multidocumento) |
| Directorios | `storedDocumentDirAtom`, `storedDatabasesDirAtom` |
| Preferencias de UI | `primaryColorAtom`, `fontSizeAtom`, `pieceSetAtom` |
| Motor | `engineMovesFamily`, `engineProgressFamily` (por pestaña mediante atomFamily) |
| TTS | `ttsEnabledAtom`, `ttsProviderAtom`, `ttsVoiceIdAtom`, `ttsVolumeAtom`, `ttsSpeedAtom`, `ttsLanguageAtom` |

Los átomos con `atomWithStorage()` se persisten en localStorage automáticamente.

**Stores Zustand** para estado de dominio complejo:
- `src/state/store/tree.ts` — navegación del árbol de partida, ramificación de jugadas, anotaciones, comentarios. Usa Immer para actualizaciones inmutables.
- `src/state/store/database.ts` — filtros de vista de base de datos, partida seleccionada, paginación

### Enrutamiento: TanStack Router

Enrutamiento basado en archivos en `src/routes/`:
```
routes/
  __root.tsx          # Root layout (AppShell, menu bar)
  index.tsx           # Home/dashboard
  databases/          # Database browsing
  accounts.tsx        # Lichess/Chess.com accounts
  settings.tsx        # App preferences
  engines.tsx         # Engine management
```

### Componentes: src/components/

| Grupo | Propósito |
|-------|-----------|
| `boards/` | Tablero de ajedrez (chessground), entrada de jugadas, barra de evaluación, visualización de análisis, modal de promoción, dibujo de flechas |
| `panels/` | Paneles laterales: análisis de motor (BestMoves), búsqueda de posición en base de datos, edición de anotaciones, información de partida, modo práctica |
| `databases/` | Interfaz de base de datos: tabla de partidas, tabla de jugadores, tarjetas de detalle, filtros |
| `settings/` | Formularios de preferencias, rutas de motores, configuración de TTS |
| `home/` | Tarjetas de cuenta, interfaz de importación |
| `common/` | Compartidos: TreeStateContext, visualización de material, icono de altavoz en comentarios |
| `tabs/` | Barra de pestañas múltiples |

---

## Cómo el frontend llama a Rust

### Comandos (petición/respuesta)

Specta genera bindings TypeScript en `src/bindings/generated.ts`:

```typescript
// Auto-generated from Rust #[tauri::command] functions
export const commands = {
  async getBestMoves(id, engine, tab, goMode, options) {
    return await TAURI_INVOKE("get_best_moves", { id, engine, tab, goMode, options });
  },
  // ~50 more commands...
}
```

Los componentes React los invocan como funciones asíncronas normales:

```typescript
import { commands } from "@/bindings";
const result = await commands.getBestMoves(id, engine, tab, goMode, options);
```

### Eventos (streaming, de Rust a React)

Para datos en tiempo real (análisis de motor, tics del reloj, jugadas de partida):

```
Rust:  app.emit("best_moves_payload", BestMovesPayload { depth: 24, ... })
         ↓
React: listen("best_moves_payload", (event) => updateBestMoves(event.payload))
```

### Plugins de Tauri

La aplicación utiliza varios plugins oficiales para acceder al sistema:

| Plugin | Propósito |
|--------|-----------|
| `@tauri-apps/plugin-fs` | Lectura/escritura de archivos |
| `@tauri-apps/plugin-dialog` | Selectores de archivos, cuadros de mensaje |
| `@tauri-apps/plugin-http` | Cliente HTTP (descarga de motores, TTS en la nube) |
| `@tauri-apps/plugin-shell` | Ejecución de motores UCI |
| `@tauri-apps/plugin-updater` | Comprobación automática de actualizaciones |
| `@tauri-apps/plugin-log` | Logging estructurado |
| `@tauri-apps/plugin-os` | Detección de CPU/RAM |

---

## Texto a Voz (TTS): Introducción

En Parlant~ puede leer en voz alta las jugadas de ajedrez y los comentarios mientras recorres una partida. Esta sección explica cómo está construido el sistema de TTS: el pipeline de preprocesamiento, la arquitectura de proveedores y la estrategia de caché. Para instrucciones de configuración, consulta las guías de TTS en el menú TTS.

### Cómo funciona el TTS (versión resumida)

El texto a voz convierte texto escrito en audio hablado. Los sistemas modernos de TTS están construidos sobre redes neuronales profundas entrenadas con miles de horas de habla humana. El modelo aprende la relación entre el texto (letras, palabras, puntuación) y las características acústicas del habla (tono, ritmo, énfasis, pausas respiratorias). En el momento de la inferencia, envías texto y recibes una forma de onda de audio.

Existen dos enfoques principales:

- **TTS en la nube** — el texto se envía a un servidor remoto (Google, ElevenLabs, etc.), que ejecuta una red neuronal grande en hardware GPU y devuelve el audio. Calidad excelente, pero requiere conexión a internet y tiene costes por solicitud (aunque la mayoría de los proveedores ofrecen niveles gratuitos).

- **TTS local** — un modelo se ejecuta directamente en tu máquina. No necesita internet, no tiene coste por solicitud, y tu texto nunca sale de tu ordenador. Los modelos de código abierto recientes (como Kokoro y Piper) han reducido significativamente la diferencia de calidad.

Si tienes curiosidad sobre cómo funcionan los modelos de TTS internamente, HuggingFace (huggingface.co) aloja cientos de modelos de síntesis de voz de código abierto que puedes explorar, descargar y ejecutar localmente. Busca "text-to-speech" para encontrar modelos que van desde opciones ligeras para CPU hasta modelos de investigación de última generación.

### La arquitectura de proveedores

La implementación principal del TTS se encuentra en `src/utils/tts.ts`. Está diseñada en torno a una **interfaz pública única** (`speakText()`) con backends intercambiables. El resto de la aplicación nunca sabe ni le importa qué proveedor está activo — simplemente llama a `speakText()` y sale el audio.

Se soportan cinco proveedores:

| Proveedor | Tipo | Backend |
|-----------|------|---------|
| **ElevenLabs** | Nube | Voces neuronales vía API REST. Devuelve MP3. |
| **Google Cloud TTS** | Nube | Voces WaveNet vía API REST. Devuelve MP3 codificado en base64. |
| **KittenTTS** | Local | Servidor TTS integrado, iniciado automáticamente por el backend Rust. Se comunica por HTTP en localhost. |
| **OpenTTS** | Local | Servidor TTS autoalojado. Soporta múltiples motores (espeak, MaryTTS, Piper, etc.). |
| **System TTS** | Local | Motor de voz nativo del SO mediante comandos Rust/Tauri (speech-dispatcher en Linux, SAPI en Windows, AVSpeechSynthesizer en macOS). |

La selección de proveedor se almacena en un único átomo Jotai (`ttsProviderAtom`). Cambiar de proveedor es instantáneo — se modifica el átomo y la siguiente llamada a `speakText()` se dirige al nuevo backend.

### El desafío: la notación de ajedrez no es español

Las jugadas de ajedrez se escriben en Notación Algebraica Estándar (SAN): `Nf3`, `Bxe5+`, `O-O-O`, `e8=Q#`. Si alimentas esto directamente a un motor de TTS, obtienes un sinsentido — podría intentar pronunciar "Nf3" como una palabra, o leer "O-O-O" como "o o o".

La solución es un **pipeline de preprocesamiento** que traduce la notación de ajedrez a lenguaje natural antes de que llegue al motor de TTS:

```
SAN Input         →  Preprocessing  →  Spoken Output
─────────────────────────────────────────────────────
"Nf3"             →  sanToSpoken()  →  "Knight f3"
"Bxe5+"           →  sanToSpoken()  →  "Bishop takes e5, check"
"O-O-O"           →  sanToSpoken()  →  "castles queenside"
"e8=Q#"           →  sanToSpoken()  →  "e8 promotes to Queen, checkmate"
```

La función `sanToSpoken()` utiliza coincidencia de patrones con expresiones regulares para descomponer cualquier cadena SAN en sus componentes (pieza, desambiguación, captura, destino, promoción, jaque/jaque mate) y los reensambla utilizando lenguaje natural a partir de una tabla de vocabulario.

### Soporte multilingüe

El vocabulario de ajedrez está traducido a 8 idiomas (inglés, francés, español, alemán, japonés, ruso, chino, coreano). La tabla `CHESS_VOCAB` mapea cada término:

```
English:  "Knight takes e5, check"
French:   "Cavalier prend e5, échec"
German:   "Springer schlägt e5, Schach"
Japanese: "ナイト テイクス e5, チェック"
Russian:  "Конь берёт e5, шах"
```

La configuración de idioma determina qué tabla de vocabulario se usa para el preprocesamiento *y* qué voz/acento utiliza el motor de TTS para la síntesis.

### Limpieza de comentarios

Las anotaciones de partidas suelen contener marcado específico de PGN que sonaría terrible si se leyera en voz alta:

```
Raw comment:    "BLUNDER. 7.Nf3 was better [%eval -2.3] [%cal Gg1f3]"
After cleaning: "7, Knight f3 was better"
```

La función `cleanCommentForTTS()`:
1. Elimina etiquetas PGN: `[%eval ...]`, `[%csl ...]`, `[%cal ...]`, `[%clk ...]`
2. Suprime palabras de anotación duplicadas (cuando "??" ya dijo "Blunder")
3. Expande SAN en línea dentro de la prosa: `"7.Nf3 controls e5"` → `"7, Knight f3 controls e5"`
4. Corrige términos de ajedrez que los motores de TTS pronuncian mal (p. ej., "en prise" → "on preez")
5. Expande abreviaturas de piezas en la prosa: `"R vs R"` → `"Rook versus Rook"`

### Construcción de la narración completa

Cuando avanzas a una nueva jugada, `buildNarration()` ensambla el texto hablado completo a partir de tres fuentes:

```
Move:        "12, Knight f3, check."        ← from sanToSpoken()
Annotation:  "Good move."                   ← from annotation symbol (!)
Comment:     "Developing with tempo."       ← from cleanCommentForTTS()

Full narration: "12, Knight f3, check.  Good move.  Developing with tempo."
```

El doble espacio entre las partes proporciona al motor de TTS una pausa respiratoria natural.

### Caché y reproducción

Las llamadas a TTS en la nube cuestan dinero y llevan tiempo (~200-500ms de ida y vuelta). Para evitar solicitar el mismo audio repetidamente, cada clip generado se almacena en caché en memoria como una URL blob:

```
Cache key:  "elevenlabs:pNInz6obpgDQGcFmaJgB:en:12, Knight f3, check."
Cache value: blob:http://localhost/abc123  (the MP3 audio in browser memory)
```

Cuando hay acierto de caché, la reproducción es instantánea. La clave de caché tiene el formato `provider:voice:language:text`, de modo que cambiar de voz o idioma crea entradas separadas.

Para partidas con muchas anotaciones, puedes **precachear** el árbol de partida completo en segundo plano. La aplicación recorre cada nodo, construye el texto de narración y ejecuta llamadas secuenciales a la API para llenar la caché antes de que empieces a navegar.

### Concurrencia y cancelación

La navegación rápida con teclas de flecha crea un problema: si el usuario avanza 5 veces rápidamente, no quieres que 5 clips de audio superpuestos compitan entre sí. La solución es un **contador de generación**:

```typescript
const thisGeneration = ++requestGeneration;
// ... fetch audio ...
if (thisGeneration !== requestGeneration) return;  // stale — discard
```

Cada nueva llamada a `speakText()` incrementa el contador y aborta cualquier solicitud HTTP en curso mediante `AbortController`. Cuando llega el audio, comprueba si su generación sigue siendo la actual. Si el usuario ya se ha movido a otra jugada, la respuesta se descarta silenciosamente. Esto proporciona un audio limpio y sin fallos incluso al hacer clic rápidamente entre jugadas.

### Dónde se integra el TTS en la aplicación

Los puntos de integración son mínimos:

| Archivo | Qué ocurre |
|---------|------------|
| `src/state/store/tree.ts` | Cada función de navegación (`goToNext`, `goToPrevious`, etc.) llama a `stopSpeaking()`. Cuando la narración automática está activada, `goToNext` también llama a `speakMoveNarration()`. |
| `src/components/common/Comment.tsx` | Un icono de altavoz junto a cada comentario permite activar manualmente el TTS para ese comentario. |
| `src/components/settings/TTSSettings.tsx` | Interfaz de configuración para elegir proveedor, voz, idioma, volumen, velocidad e introducir claves API. |

Cuando el TTS está desactivado, nada de este código se ejecuta. La aplicación se comporta de manera idéntica a la versión original de En Croissant.

---

## Ejemplos de flujo de datos

### Análisis de motor

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

### Búsqueda de posición en base de datos

```
User reaches a position on the board
  → React calls commands.searchPosition(fen, gameQuery)
  → Rust queries memory-mapped binary search index
  → Returns: PositionStats (wins/losses/draws) + matching games
  → React renders DatabasePanel with results table
```

### Narración TTS

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

## Mapa de directorios

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

## Conclusiones clave

1. **Rust hace el trabajo pesado** — motores, base de datos, I/O de archivos, análisis PGN. React nunca accede al sistema de archivos ni lanza procesos directamente.

2. **Seguridad de tipos a través de la frontera** — Specta genera tipos TypeScript a partir de structs Rust, de modo que si un comando Rust cambia su firma, la compilación TypeScript falla inmediatamente.

3. **Dos sistemas de estado** — Jotai para estado reactivo simple (configuración, preferencias de UI, estado de motor por pestaña), Zustand para estado de dominio complejo (árbol de partida con ramificación y actualizaciones inmutables).

4. **El TTS es un problema de preprocesamiento** — la parte difícil no es llamar a una API de voz, sino traducir la notación de ajedrez y el marcado PGN a texto limpio y natural en 8 idiomas. Los pipelines `sanToSpoken()` y `cleanCommentForTTS()` son donde ocurre el verdadero trabajo.

5. **Cinco proveedores, una interfaz** — ya sea que el audio provenga de ElevenLabs, Google Cloud, KittenTTS, OpenTTS o el motor de voz de tu sistema operativo, el resto de la aplicación solo llama a `speakText()`. La selección de proveedor es un simple cambio de átomo.

6. **La compilación produce un único binario** en `src-tauri/target/release/en-parlant` que integra el backend Rust + los recursos del frontend compilados con Vite.
