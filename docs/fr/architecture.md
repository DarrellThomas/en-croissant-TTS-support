[English](../en/architecture.md) | **Français** | [Español](../es/architecture.md) | [Deutsch](../de/architecture.md) | [日本語](../ja/architecture.md) | [Русский](../ru/architecture.md) | [中文](../zh/architecture.md) | [한국어](../ko/architecture.md)

# En Parlant~ Guide d'Architecture

**Version de l'application :** v0.1.0 (fork : DarrellThomas/en-parlant)
**Stack technique :** Tauri v2 (Rust) + React 19 (TypeScript) + Vite

---

## Qu'est-ce que Tauri ?

Tauri est un framework pour construire des applications de bureau. Au lieu de livrer un navigateur complet comme le fait Electron, Tauri utilise la webview native du système d'exploitation pour l'interface et un processus Rust pour le backend. Le résultat est un binaire compact et rapide.

Les deux moitiés communiquent par IPC (communication inter-processus) :

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

## Le côté Rust : src-tauri/src/

Rust gère tout ce qui doit être rapide ou nécessite un accès au système.

### Point d'entrée : main.rs

Enregistre environ 50 commandes que le frontend peut appeler, initialise les plugins (système de fichiers, boîtes de dialogue, HTTP, shell, journalisation, mises à jour) et lance la fenêtre de l'application.

Les commandes sont définies avec une macro :

```rust
#[tauri::command]
async fn get_best_moves(id: String, engine: String, ...) -> Result<...> {
    // spawn UCI engine, return analysis
}
```

Le crate `specta` génère automatiquement des définitions de types TypeScript à partir de ces fonctions Rust, offrant ainsi au frontend une sécurité de typage complète sans aucun effort manuel.

### Modules principaux

| Module | Rôle |
|--------|------|
| `db/mod.rs` | Base de données SQLite via l'ORM Diesel — requêtes de parties, statistiques de joueurs, imports, recherche par position |
| `game.rs` | Moteur de jeu en direct — gère les parties moteur-contre-humain et moteur-contre-moteur, contrôles de temps, validation des coups |
| `chess.rs` | Analyse par moteur — lance les moteurs UCI, renvoie les meilleurs coups au frontend en streaming via des événements |
| `engine/` | Implémentation du protocole UCI — lancement de processus, pipes stdin/stdout, support multi-PV |
| `pgn.rs` | Lecture/écriture/tokenisation de fichiers PGN |
| `opening.rs` | Recherche de noms d'ouvertures à partir du FEN (données binaires intégrées dans l'application) |
| `puzzle.rs` | Base de données de puzzles Lichess — accès aléatoire par fichier mappé en mémoire |
| `fs.rs` | Téléchargement de fichiers avec reprise, configuration des permissions d'exécution |
| `sound.rs` | Serveur HTTP local pour le streaming audio (contournement audio sous Linux) |
| `tts.rs` | TTS système via speech-dispatcher (Linux) / API vocales natives de l'OS, plus gestion du serveur KittenTTS |
| `oauth.rs` | Flux OAuth2 pour la liaison de comptes Lichess/Chess.com |

### Principes de conception

- **Asynchrone partout :** runtime Tokio, I/O non bloquant
- **État concurrent :** `DashMap` (HashMap concurrent) pour les processus moteurs, les connexions à la base et les caches
- **Pool de connexions :** r2d2 gère les pools de connexions SQLite
- **Recherche par fichier mappé en mémoire :** recherche de positions via un index binaire mappé en mémoire (mmap) pour des résultats instantanés
- **Streaming d'événements :** Rust émet des événements (meilleurs coups, tics d'horloge, fin de partie) que React écoute en temps réel

---

## Le côté React/TypeScript : src/

### Pipeline de build : Vite

`vite.config.ts` configure :
- **Plugin React** avec le compilateur Babel
- **Plugin TanStack Router** — génère automatiquement l'arbre de routes à partir du dossier `routes/`
- **Vanilla Extract** — CSS-in-JS sans coût au runtime
- **Alias de chemin :** `@` pointe vers `./src`
- **Serveur de développement** sur le port 1420

Flux de build :
```
pnpm dev   → Vite on :1420 + Tauri opens webview pointing to it
pnpm build → tsc (typecheck) → vite build (bundle to dist/) → tauri build (native binary)
```

### Point d'entrée : App.tsx

Le composant racine :
- Initialise les plugins Tauri (log, process, updater)
- Charge les préférences utilisateur depuis les atomes persistants
- Configure le thème Mantine UI
- Enregistre le routeur
- Vérifie les mises à jour de l'application

### Gestion de l'état

**Atomes Jotai** (`src/state/atoms.ts`) — état réactif léger :

| Catégorie | Exemples |
|-----------|----------|
| Onglets | `tabsAtom`, `activeTabAtom` (interface multi-documents) |
| Répertoires | `storedDocumentDirAtom`, `storedDatabasesDirAtom` |
| Préférences d'interface | `primaryColorAtom`, `fontSizeAtom`, `pieceSetAtom` |
| Moteur | `engineMovesFamily`, `engineProgressFamily` (par onglet via atomFamily) |
| TTS | `ttsEnabledAtom`, `ttsProviderAtom`, `ttsVoiceIdAtom`, `ttsVolumeAtom`, `ttsSpeedAtom`, `ttsLanguageAtom` |

Les atomes définis avec `atomWithStorage()` sont persistés automatiquement dans le localStorage.

**Stores Zustand** pour les états de domaine complexes :
- `src/state/store/tree.ts` — navigation dans l'arbre de partie, embranchements de coups, annotations, commentaires. Utilise Immer pour les mises à jour immuables.
- `src/state/store/database.ts` — filtres de la vue base de données, partie sélectionnée, pagination

### Routage : TanStack Router

Routage basé sur les fichiers dans `src/routes/` :
```
routes/
  __root.tsx          # Root layout (AppShell, menu bar)
  index.tsx           # Home/dashboard
  databases/          # Database browsing
  accounts.tsx        # Lichess/Chess.com accounts
  settings.tsx        # App preferences
  engines.tsx         # Engine management
```

### Composants : src/components/

| Groupe | Rôle |
|--------|------|
| `boards/` | Échiquier (chessground), saisie de coups, barre d'évaluation, affichage d'analyse, modal de promotion, dessin de flèches |
| `panels/` | Panneaux latéraux : analyse moteur (BestMoves), recherche de position en base, édition d'annotations, info de partie, mode entraînement |
| `databases/` | Interface base de données : tableau de parties, tableau de joueurs, fiches détaillées, filtrage |
| `settings/` | Formulaires de préférences, chemins des moteurs, paramètres TTS |
| `home/` | Cartes de comptes, interface d'import |
| `common/` | Éléments partagés : TreeStateContext, affichage du matériel, icône haut-parleur pour les commentaires |
| `tabs/` | Barre multi-onglets |

---

## Comment le frontend appelle Rust

### Commandes (requête/réponse)

Specta génère des bindings TypeScript dans `src/bindings/generated.ts` :

```typescript
// Auto-generated from Rust #[tauri::command] functions
export const commands = {
  async getBestMoves(id, engine, tab, goMode, options) {
    return await TAURI_INVOKE("get_best_moves", { id, engine, tab, goMode, options });
  },
  // ~50 more commands...
}
```

Les composants React les appellent comme de simples fonctions asynchrones :

```typescript
import { commands } from "@/bindings";
const result = await commands.getBestMoves(id, engine, tab, goMode, options);
```

### Événements (streaming, de Rust vers React)

Pour les données en temps réel (analyse moteur, tics d'horloge, coups de partie) :

```
Rust:  app.emit("best_moves_payload", BestMovesPayload { depth: 24, ... })
         ↓
React: listen("best_moves_payload", (event) => updateBestMoves(event.payload))
```

### Plugins Tauri

L'application utilise plusieurs plugins officiels pour l'accès au système :

| Plugin | Rôle |
|--------|------|
| `@tauri-apps/plugin-fs` | Lecture/écriture de fichiers |
| `@tauri-apps/plugin-dialog` | Sélecteurs de fichiers, boîtes de dialogue |
| `@tauri-apps/plugin-http` | Client HTTP (téléchargement de moteurs, TTS cloud) |
| `@tauri-apps/plugin-shell` | Exécution de moteurs UCI |
| `@tauri-apps/plugin-updater` | Vérification automatique des mises à jour |
| `@tauri-apps/plugin-log` | Journalisation structurée |
| `@tauri-apps/plugin-os` | Détection CPU/RAM |

---

## Synthèse vocale (TTS) : Guide d'introduction

En Parlant~ peut lire à haute voix les coups d'échecs et les commentaires au fur et à mesure que vous parcourez une partie. Cette section explique comment le système TTS est construit : le pipeline de prétraitement, l'architecture des fournisseurs, et la stratégie de mise en cache. Pour les instructions de configuration, consultez les guides TTS dans le menu TTS.

### Comment fonctionne le TTS (en bref)

La synthèse vocale convertit du texte écrit en audio parlé. Les systèmes TTS modernes reposent sur des réseaux de neurones profonds entraînés sur des milliers d'heures de parole humaine. Le modèle apprend la relation entre le texte (lettres, mots, ponctuation) et les caractéristiques acoustiques de la parole (hauteur, rythme, accentuation, pauses respiratoires). Au moment de l'inférence, vous envoyez du texte et récupérez une forme d'onde audio.

Il existe deux grandes approches :

- **TTS Cloud** — le texte est envoyé à un serveur distant (Google, ElevenLabs, etc.), qui exécute un grand réseau de neurones sur du matériel GPU et renvoie l'audio. Excellente qualité, mais nécessite une connexion internet et engendre des coûts par requête (bien que la plupart des fournisseurs proposent des niveaux gratuits).

- **TTS Local** — un modèle s'exécute directement sur votre machine. Pas besoin d'internet, pas de coût par requête, et votre texte ne quitte jamais votre ordinateur. Les modèles open source récents (comme Kokoro et Piper) ont considérablement réduit l'écart de qualité.

Si vous êtes curieux de savoir comment les modèles TTS fonctionnent en coulisses, HuggingFace (huggingface.co) héberge des centaines de modèles de synthèse vocale open source que vous pouvez explorer, télécharger et exécuter localement. Recherchez "text-to-speech" pour trouver des modèles allant d'options légères adaptées au CPU jusqu'aux modèles de recherche de pointe.

### L'architecture des fournisseurs

L'implémentation principale du TTS se trouve dans `src/utils/tts.ts`. Elle est conçue autour d'une **interface publique unique** (`speakText()`) avec des backends interchangeables. Le reste de l'application ne sait pas et ne se soucie pas de quel fournisseur est actif : il appelle simplement `speakText()` et l'audio sort.

Cinq fournisseurs sont pris en charge :

| Fournisseur | Type | Backend |
|-------------|------|---------|
| **ElevenLabs** | Cloud | Voix neuronales via API REST. Renvoie du MP3. |
| **Google Cloud TTS** | Cloud | Voix WaveNet via API REST. Renvoie du MP3 encodé en base64. |
| **KittenTTS** | Local | Serveur TTS intégré, démarré automatiquement par le backend Rust. Communique via HTTP sur localhost. |
| **OpenTTS** | Local | Serveur TTS auto-hébergé. Prend en charge de nombreux moteurs (espeak, MaryTTS, Piper, etc.). |
| **System TTS** | Local | Moteur vocal natif de l'OS via des commandes Rust/Tauri (speech-dispatcher sous Linux, SAPI sous Windows, AVSpeechSynthesizer sous macOS). |

La sélection du fournisseur est stockée dans un seul atome Jotai (`ttsProviderAtom`). Changer de fournisseur est instantané : modifiez l'atome, et le prochain appel à `speakText()` sera routé vers le nouveau backend.

### Le défi : la notation échiquéenne n'est pas de l'anglais

Les coups d'échecs sont écrits en Notation Algébrique Standard (SAN) : `Nf3`, `Bxe5+`, `O-O-O`, `e8=Q#`. Si vous envoyez cela directement à un moteur TTS, vous obtenez du charabia : il pourrait essayer de prononcer "Nf3" comme un mot, ou lire "O-O-O" comme "oh oh oh".

La solution est un **pipeline de prétraitement** qui traduit la notation échiquéenne en langage naturel avant qu'elle n'atteigne le moteur TTS :

```
SAN Input         →  Preprocessing  →  Spoken Output
─────────────────────────────────────────────────────
"Nf3"             →  sanToSpoken()  →  "Knight f3"
"Bxe5+"           →  sanToSpoken()  →  "Bishop takes e5, check"
"O-O-O"           →  sanToSpoken()  →  "castles queenside"
"e8=Q#"           →  sanToSpoken()  →  "e8 promotes to Queen, checkmate"
```

La fonction `sanToSpoken()` utilise la correspondance par expressions régulières pour décomposer toute chaîne SAN en ses composants (pièce, désambiguïsation, capture, destination, promotion, échec/mat) et les réassemble en langage naturel à partir d'une table de vocabulaire.

### Support multilingue

Le vocabulaire échiquéen est traduit dans 8 langues (anglais, français, espagnol, allemand, japonais, russe, chinois, coréen). La table `CHESS_VOCAB` fait correspondre chaque terme :

```
English:  "Knight takes e5, check"
French:   "Cavalier prend e5, échec"
German:   "Springer schlägt e5, Schach"
Japanese: "ナイト テイクス e5, チェック"
Russian:  "Конь берёт e5, шах"
```

Le paramètre de langue détermine quelle table de vocabulaire est utilisée pour le prétraitement *et* quelle voix/quel accent le moteur TTS utilise pour la synthèse.

### Nettoyage des commentaires

Les annotations de parties contiennent souvent du balisage spécifique au PGN qui sonnerait affreusement s'il était lu à voix haute :

```
Raw comment:    "BLUNDER. 7.Nf3 was better [%eval -2.3] [%cal Gg1f3]"
After cleaning: "7, Knight f3 was better"
```

La fonction `cleanCommentForTTS()` :
1. Supprime les balises PGN : `[%eval ...]`, `[%csl ...]`, `[%cal ...]`, `[%clk ...]`
2. Retire les mots d'annotation en double (quand "??" a déjà dit "Blunder")
3. Développe le SAN inline dans la prose : `"7.Nf3 controls e5"` → `"7, Knight f3 controls e5"`
4. Corrige les termes échiquéens que les moteurs TTS prononcent mal (ex. "en prise" → "on preez")
5. Développe les abréviations de pièces dans la prose : `"R vs R"` → `"Rook versus Rook"`

### Construction de la narration complète

Lorsque vous avancez vers un nouveau coup, `buildNarration()` assemble le texte parlé complet à partir de trois sources :

```
Move:        "12, Knight f3, check."        ← from sanToSpoken()
Annotation:  "Good move."                   ← from annotation symbol (!)
Comment:     "Developing with tempo."       ← from cleanCommentForTTS()

Full narration: "12, Knight f3, check.  Good move.  Developing with tempo."
```

Le double espace entre les parties donne aux moteurs TTS une pause respiratoire naturelle.

### Mise en cache et lecture

Les appels TTS cloud coûtent de l'argent et prennent du temps (environ 200-500 ms aller-retour). Pour éviter de redemander le même audio, chaque clip généré est mis en cache en mémoire sous forme de blob URL :

```
Cache key:  "elevenlabs:pNInz6obpgDQGcFmaJgB:en:12, Knight f3, check."
Cache value: blob:http://localhost/abc123  (the MP3 audio in browser memory)
```

En cas de cache hit, la lecture est instantanée. La clé de cache est composée de `provider:voice:language:text`, donc changer de voix ou de langue crée des entrées séparées.

Pour les parties avec beaucoup d'annotations, vous pouvez **précacher** l'intégralité de l'arbre de partie en arrière-plan. L'application parcourt chaque noeud, construit le texte de narration et lance des appels API séquentiels pour remplir le cache avant que vous ne commenciez à naviguer.

### Concurrence et annulation

La navigation rapide avec les touches fléchées pose un problème : si l'utilisateur avance de 5 coups rapidement, on ne veut pas que 5 clips audio se chevauchent et entrent en conflit. La solution est un **compteur de génération** :

```typescript
const thisGeneration = ++requestGeneration;
// ... fetch audio ...
if (thisGeneration !== requestGeneration) return;  // stale — discard
```

Chaque nouvel appel à `speakText()` incrémente le compteur et annule toute requête HTTP en cours via `AbortController`. Lorsque l'audio arrive, il vérifie si sa génération est toujours la plus récente. Si l'utilisateur a déjà avancé, la réponse est silencieusement ignorée. Cela garantit un audio propre et sans glitch même en cliquant rapidement à travers les coups.

### Où le TTS s'intègre dans l'application

Les points d'intégration sont minimaux :

| Fichier | Ce qui se passe |
|---------|----------------|
| `src/state/store/tree.ts` | Chaque fonction de navigation (`goToNext`, `goToPrevious`, etc.) appelle `stopSpeaking()`. Quand l'auto-narration est activée, `goToNext` appelle aussi `speakMoveNarration()`. |
| `src/components/common/Comment.tsx` | Une icône de haut-parleur à côté de chaque commentaire permet de déclencher manuellement le TTS pour ce commentaire. |
| `src/components/settings/TTSSettings.tsx` | Interface de paramètres pour choisir le fournisseur, la voix, la langue, le volume, la vitesse et saisir les clés API. |

Quand le TTS est désactivé, rien de ce code ne s'exécute. L'application se comporte de manière identique à l'upstream En Croissant.

---

## Exemples de flux de données

### Analyse par moteur

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

### Recherche de position en base de données

```
User reaches a position on the board
  → React calls commands.searchPosition(fen, gameQuery)
  → Rust queries memory-mapped binary search index
  → Returns: PositionStats (wins/losses/draws) + matching games
  → React renders DatabasePanel with results table
```

### Narration TTS

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

## Carte du répertoire

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

## Points clés à retenir

1. **Rust fait le gros du travail** -- moteurs, base de données, I/O fichier, parsing PGN. React ne touche jamais au système de fichiers et ne lance jamais de processus directement.

2. **Sécurité de typage à travers la frontière** -- Specta génère des types TypeScript à partir des structs Rust, donc si une commande Rust change sa signature, la compilation TypeScript casse immédiatement.

3. **Deux systèmes d'état** -- Jotai pour l'état réactif simple (paramètres, préférences d'interface, état moteur par onglet), Zustand pour l'état de domaine complexe (arbre de partie avec embranchements et mises à jour immuables).

4. **Le TTS est un problème de prétraitement** -- la difficulté n'est pas d'appeler une API de synthèse vocale, c'est de traduire la notation échiquéenne et le balisage PGN en texte propre et naturel dans 8 langues. Les pipelines `sanToSpoken()` et `cleanCommentForTTS()` sont là où se fait le vrai travail.

5. **Cinq fournisseurs, une seule interface** -- que l'audio provienne d'ElevenLabs, Google Cloud, KittenTTS, OpenTTS ou du moteur vocal de votre OS, le reste de l'application n'appelle jamais que `speakText()`. La sélection du fournisseur se fait par un simple basculement d'atome.

6. **Le build produit un binaire unique** dans `src-tauri/target/release/en-parlant` qui intègre le backend Rust et les assets frontend construits par Vite.
