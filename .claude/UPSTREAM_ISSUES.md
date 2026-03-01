# Upstream Open Issues Analysis

Analysis of 110 open issues from `franciscoBSalgueiro/en-croissant` as of 2026-03-01.
Classified for actionability in the **En Parlant~** fork (Linux, build-from-source).

---

## Summary Statistics

| Category | Count |
|---|---|
| **Labeled `type: bug`** | 22 |
| **Labeled `type: enhancement`** | 64 |
| **Unlabeled** (questions, mixed, or uncategorized) | 24 |
| **Total** | 110 |

### By Priority Label (upstream-assigned)

| Priority | Count |
|---|---|
| `priority: high` | 1 (#191) |
| `priority: medium` | 8 (#226, #224, #208, #201, #186, #127, #47, #11 partial) |
| `priority: low` | 12 (#239, #228, #221, #211, #205, #153, #152, #148, #131, #128, #108, #1) |
| No priority label | 89 |

### Classification Summary for En Parlant~

| Batch | Description | Count |
|---|---|---|
| BATCH 1 | Easy Bug Fixes | 8 |
| BATCH 2 | Moderate Bug Fixes | 9 |
| BATCH 3 | Hard Bug Fixes | 3 |
| BATCH 4 | Easy Enhancements | 14 |
| BATCH 5 | Moderate Enhancements | 24 |
| BATCH 6 | Large Enhancements / Proposals | 22 |
| SKIP | Not relevant to En Parlant~ | 30 |

---

## BATCH 1: Easy Bug Fixes

Issues that are likely quick fixes -- UI glitches, small parsing issues, simple config changes, compilation warnings.

### ~~#659 -- Compilation warnings~~ FIXED (commit 139d40d2)
**Summary:** 13 Rust compiler warnings (unused imports, unused variables, dead code structs) in release build.
**Fix:** Prefixed unused vars with `_`, removed unused imports/structs. All clippy warnings resolved.

### ~~#697 -- Edge coordinates: ranks displayed on left side instead of right~~ FIXED (commit 4a30e3ba)
**Summary:** Edge-mode rank numbers (1-8) were always on the left. Also, edge coordinate colors had no contrast against their background squares (both light and dark coords got the same dark color, making them invisible on dark squares).
**Fix:** Added `ranksPositionAtom` with Left/Right setting (default: right), fixed `.left` CSS positioning, and swapped `coord-light`/`coord-dark` color mapping so coordinates contrast against their background square.

### ~~#698 -- Flipping board switches coordinate mode from 'edge' to 'all squares'~~ FIXED (commit 4a30e3ba)
**Summary:** When coordinates are set to "On the edge" and board is flipped, coordinates switch to "On all squares" mode.
**Fix:** Resolved alongside #697 — the edge coordinate CSS rewrite properly preserves coordinate mode on board flip.

### ~~#316 -- Can't castle using text Move Input~~ FIXED (commit 610be907)
**Summary:** Text move input does not accept any castling notation (OO, O-O, 00, Kg1/Kg8).
**Fix:** Replaced `cleanSan()` in `parseKeyboardMove()` (`src/utils/chess.ts`) with regex-based normalization that accepts any combination of O/o/0 with optional hyphens for both kingside and queenside castling.

### ~~#185 -- Partial position board resets after switching tabs~~ FIXED (commit 848cc79d)
**Summary:** Custom partial position in database search was lost when navigating moves or switching tabs.
**Fix:** The useEffect syncing board FEN into localOptions unconditionally overwrote the custom partial FEN. Added a guard to skip the sync when `options.type === "partial"`.

### ~~#319 -- PGN parsing doesn't allow for multiple comments~~ FIXED (commit a9bd84a4)
**Summary:** When a PGN has multiple consecutive comments, only one is displayed; the rest are silently dropped.
**Fix:** Changed `innerParsePGN()` in `src/utils/chess.ts` to concatenate consecutive comments with double newline separators instead of overwriting. Empty comment text from pure metadata annotations is skipped.

### ~~#539 -- UI layout issues at different component sizes~~ FIXED (commit de638255)
**Summary:** Four layout issues at small widths: piece palette disappears, coordinates overflow, move table cut off, practice panel cut off.
**Fix:** EditingCard gets minWidth/overflow:auto; coords container gets overflow:hidden; OpeningsTable totals column uses auto width; practice tab panels use overflow:auto with miw on MoveRow columns.

### ~~#690 -- Duplicate options error when entering Board~~ FIXED (commit c205bc11)
**Summary:** Mantine Select threw "Duplicate options are not supported" when engine/database/account lists contained duplicate entries.
**Fix:** Added deduplication filters before passing data to Select in EnginesSelect, LogsPanel, WebsiteAccountSelector, and DatabasePanel.

### ~~#634 -- List of players and tournaments does not update after deleting games~~ FIXED (commit c14d2be4)
**Summary:** After deleting games in a database, the players/tournaments lists still show stale entries.
**Fix:** Used SWR's global mutate to invalidate players and tournaments caches after game deletion in GameCard.

---

## BATCH 2: Moderate Bug Fixes

Bugs requiring more investigation or touching multiple files.

### ~~#670 -- Engine settings reset after switching sub-tabs (Unlimited time)~~ FIXED (commit ea05836a)
**Summary:** In Play Chess with Unlimited time, changes to Time/Depth/Nodes sub-tabs are lost when switching between them. Number of cores setting never saves.
**Fix:** GoModeInput now remembers values via useRef; OpponentForm correctly updates engine.settings instead of spreading onto the wrong object level.

### ~~#633 -- Practice mode arrows leave drill line and play sounds before answer reveal~~ FIXED (commit 173aab30)
**Summary:** Left/right arrow navigation in practice mode can jump to unintended variations. Sounds play even when navigation should be blocked before "See Answer."
**Fix:** All MoveControls navigation (hotkeys + buttons) now guarded by practice state; blocked and visually disabled when phase is "waiting".

### ~~#500 -- "No analysis available" with UCI-compliant engine output~~ FIXED (commit 50131f75)
**Summary:** The frontend fails to parse valid UCI info strings that have `score` without the `cp` or `mate` keyword prefix, showing "No analysis available."
**Fix:** Added normalize_uci_line() that detects `score <number>` (without cp/mate) and inserts `cp` before parsing.

### ~~#569 -- Reference database shows no options after pawn promotion~~ FIXED (commit 16f70902)
**Summary:** After a pawn promotes, the reference database stops showing continuation options for the resulting position.
**Fix:** Material reachability pruning in get_move_after_match now accounts for promotion potential (each pawn can gain up to +8 material).

### ~~#580 -- Puzzle database workflow is broken~~ FIXED (commit 55fe9bfc)
**Summary:** Adding new puzzle databases always re-installs Lichess Puzzles and offers no option to add other local puzzle databases.
**Fix:** Added Local tab to AddPuzzle dialog with file picker for importing .db3 puzzle databases from filesystem.

### ~~#163 -- UCI Protocol Inaccuracies (ucinewgame)~~ FIXED (commit 54dd350a)
**Summary:** The GUI does not send `ucinewgame` command when switching between different games, which can cause engines to behave incorrectly.
**Fix:** Send ucinewgame + isready in set_options() when the root FEN changes, clearing stale engine state before analyzing a new game.

### ~~#673 -- Games from position should be ordered by players' Elo~~ FIXED (commit 9b077f00)
**Summary:** Database search by position returns games ordered by date (oldest first) instead of by Elo descending.
**Fix:** Added ORDER BY COALESCE(white_elo, 0) + COALESCE(black_elo, 0) DESC to the position search query.

### ~~#418 -- Problem while saving to database~~ FIXED (commit 292544cc)
**Summary:** Saving a game from the analysis board to an existing PGN database fails with an error.
**Fix:** Auto-save useEffect had circular dependency on saveFile→currentTab. Used ref pattern to break the cycle and added await to prevent concurrent saves.

### ~~#707 -- Lichess Database Syntax Error~~ FIXED (commit f73d17ca)
**Summary:** Lichess All and Lichess Masters databases return a SyntaxError about invalid JSON (`<html>` response). Eventually loads but errors on any new move.
**Fix:** Check res.ok before calling res.json() in all Lichess API functions. HTML error pages now throw meaningful HTTP status errors instead of JSON parse failures.

---

## BATCH 3: Hard Bug Fixes

Bugs involving architecture, performance, or deep engine/system integration.

### #530 -- Laggy board UI while running engine
**Summary:** Piece move animations stutter badly when an engine is running analysis alongside. Confirmed on Linux. Likely caused by engine output flooding the UI event loop.
**Test:** Open analysis board, make a few moves with smooth animation, start an engine, then use arrow keys to scroll through moves -- observe stutter.
**Difficulty:** Hard -- requires throttling engine output updates, possibly debouncing UI re-renders, or offloading engine parsing to a web worker.

### #631 -- Piece-move animation stutters during Analysis mode (Tauri 2 regression)
**Summary:** Same stutter issue as #530 but specifically attributed to the Tauri 2 migration. Multi-line analysis with high cores/hash causes visually degraded animations.
**Test:** Same as #530 but specifically test with 3+ lines and 4+ cores. Compare behavior to a Tauri 1 build if available.
**Difficulty:** Hard -- may require profiling the Tauri 2 webview event loop and finding the rendering bottleneck.

### #487 -- Every bug so far (omnibus)
**Summary:** Collection of ~12 bugs: engine crashes on timeout, illegal moves under low time, engine loading while clock runs, Syzygy path not saving, Leela download failure, tablebase crash without internet, close button issues, download percentages off.
**Test:** Most are Windows-specific timing/crash issues, but test on Linux: (1) play engine vs engine at very low time (1ms depth), check for freezes; (2) check Syzygy path persistence after restart; (3) disconnect network and open tablebase tab.
**Difficulty:** Hard -- many independent issues bundled together; each needs separate investigation.

---

## BATCH 4: Easy Enhancements

Small feature additions or UI tweaks.

### #672 -- Databases list should credit authors
**Summary:** Database download list should show author name and link to upstream website.
**Relevance:** Medium -- good UX improvement for attribution.

### #510 -- Copy engine output to clipboard
**Summary:** Add a button in the analysis panel to copy all engine lines (eval + moves) to clipboard in a readable format.
**Relevance:** High -- very useful for repertoire building and note-taking.

### #495 -- Auto-start engine on new analysis board
**Summary:** Option/flag to automatically start a default engine when creating a new analysis board tab.
**Relevance:** High -- reduces clicks for the most common workflow.

### #301 -- Allow more lines in UI analysis configuration (up to 8)
**Summary:** The UI analysis settings only allow 1-5 lines; requesting 1-8 for opening repertoire work.
**Relevance:** High -- simple UI slider range change.

### #393 -- Add option to download unrated Lichess games
**Summary:** Lichess game import currently filters `rated=true`; add toggle for unrated/casual games.
**Relevance:** Medium -- API parameter toggle, affects the Lichess import fetch URL.

### #254 -- Arrow keys should only alternate between moves, not tab selection
**Summary:** After switching between Analysis/Database tabs, left/right arrow keys move the tab selection rectangle instead of navigating moves.
**Relevance:** High -- keyboard navigation UX fix, very annoying for power users.

### #266 -- Open analysis in new tab from Play Chess
**Summary:** When playing or watching a game, allow opening analysis for that game in a new tab without stopping the game.
**Relevance:** Medium -- convenience feature.

### #534 -- Save engine lines as variations without jumping to position
**Summary:** Add ability to save an engine's recommended line as a variation in the PGN without navigating to that position first.
**Relevance:** High -- very useful for opening study workflow.

### #565 -- Time editor in PGN editor
**Summary:** Allow adding/editing clock times on moves in the analysis board.
**Relevance:** Low -- niche feature for OTB game recording.

### #566 -- Invert/switch sides button in board editor
**Summary:** Add button to mirror all pieces when editing a position (swap white/black pieces).
**Relevance:** Low -- minor convenience for position setup.

### #516 -- Option to not create INFO files for PGNs
**Summary:** En Croissant creates `.info` sidecar files for every PGN in the Files section; request to disable this.
**Relevance:** Medium -- cleaner file management.

### #413 -- Translation into Spanish
**Summary:** Contributor offering to translate the UI into Spanish.
**Relevance:** Low -- i18n; we could accept the translation if provided.

### #708 -- Support PGN `[%timestamp]` syntax
**Summary:** Chess.com exports include `[%timestamp N]` alongside `[%clk]`; currently the timestamp clutters comments and is not parsed.
**Relevance:** High -- PGN parsing improvement, benefits chess.com game imports.

### #682 -- Add arrows indicating variation moves
**Summary:** Show purple arrows on board for all variations when current node has multiple children.
**Relevance:** Medium -- visual aid for variation navigation.

---

## BATCH 5: Moderate Enhancements

Features requiring moderate effort (several files, some backend work).

### #637 -- Move annotations from engine generated per move in analysis
**Summary:** Generate move annotations (blunder/mistake/etc.) live during manual analysis without running a full game report.
**Relevance:** High -- bridges analysis and game report features.

### #591 -- UX improvements when building a repertoire
**Summary:** Four requests: (1) rename imported games, (2) move game result to sideline, (3) inline comment editing, (4) preserve engine analysis when switching moves.
**Relevance:** High -- directly improves repertoire workflow.

### #558 -- Adjustable engine strength / ELO for training
**Summary:** UCI `UCI_LimitStrength` and `UCI_Elo` parameters should be exposed in the Play Chess UI for training at lower levels.
**Relevance:** High -- training mode improvement.

### #540 -- UI improvement at small window widths
**Summary:** Add vertical layout option for small screens, reduce sidebar title wrapping.
**Relevance:** Medium -- responsive design improvement.

### #527 -- Changing the order of games in a file
**Summary:** Allow drag-and-drop reordering of games/chapters within a PGN file, similar to engine reordering.
**Relevance:** Medium -- repertoire organization.

### #263 -- Navigate variations with popup selection
**Summary:** When reaching a node with multiple continuations, show a selection popup (like Lichess) to choose which variation to follow.
**Relevance:** High -- critical for variation-heavy repertoire files.

### #445 -- Inline notation improvements
**Summary:** (1) Keep comments truly inline regardless of length, (2) show full move number after comments, (3) fix variation nesting to match Lichess style, (4) shortcut to open position in new analysis tab, (5) right-click to add comments.
**Relevance:** High -- notation display is a core UX element.

### #442 -- Game notation like Lichess (vertical mode)
**Summary:** Add vertical notation layout option, pre-move comments, and variation color coding.
**Relevance:** Medium -- alternative notation display.

### #251 -- Keyboard shortcuts and navigation
**Summary:** Comprehensive list of missing keyboard shortcuts: Save As, Replace move, Play best move, Toggle fullscreen, Toggle specific engine, Generate report, Play modes, Show keybinds.
**Relevance:** High -- power user productivity.

### #252 -- Save reports and analysis back to database
**Summary:** After generating a game report and adding annotations, allow saving the updated game back to the database. Also: auto-add engine best line on blunders.
**Relevance:** High -- critical workflow gap.

### #246 -- Real-time move report during analysis
**Summary:** Like chess.com's analysis, show move classification (blunder/mistake/good) in real-time as you play moves during analysis.
**Relevance:** High -- overlaps with #637.

### #256 -- Database search: both players, scrollable games, piece contrast
**Summary:** (1) Search by both white and black player, (2) scrollable game list, (3) better contrast for black pieces in position editor.
**Relevance:** High -- database usability.

### #208 -- UX improvements related to engines
**Summary:** (1) Click engine name to start/stop, (2) show TB Hits/Nodes metrics, (3) multi-game engine matches from position with temperature parameter.
**Relevance:** Medium -- engine UX refinements.

### #201 -- Sort by time control in database
**Summary:** Filter database games by time control (blitz, rapid, classical only).
**Relevance:** Medium -- database filtering.

### #186 -- Allow multiple reference databases
**Summary:** Select multiple databases as a combined reference database for position search.
**Relevance:** Medium -- useful for users with multiple accounts.

### #306 -- Practice mode considers full lines instead of individual moves
**Summary:** Practice cards should drill full lines from the beginning rather than isolated single moves.
**Relevance:** High -- improves practice mode effectiveness significantly.

### #282 -- Color-coding for variations and comments
**Summary:** Highlight different variations with distinct background colors (default, alternative/blue, better/green, worse/red).
**Relevance:** Medium -- visual clarity for complex variations.

### #243 -- Continuous scrolling games in database
**Summary:** Replace paginated game list with virtual/infinite scroll for large databases.
**Relevance:** Medium -- better UX for large databases (Gigabase, Mega).

### #191 -- Add or update game in personal database (priority: high)
**Summary:** Button to add current analysis board game to an existing database, or update an existing game entry.
**Relevance:** High -- this is upstream's only `priority: high` issue; fundamental workflow gap.

### #226 -- Combine several DBs into a single one
**Summary:** Merge multiple databases into one, via selection or drag-and-drop.
**Relevance:** Medium -- database management.

### #372 -- Lichess casual games are not imported
**Summary:** Lichess game download only imports rated games; casual/unrated games are silently skipped.
**Relevance:** Medium -- related to #393; same underlying API parameter issue.

### #211 -- Ability to filter games on import
**Summary:** When downloading from Lichess, filter by game type (rapid/classical/blitz) and date range.
**Relevance:** Medium -- import customization.

### #307 -- Auto-sync accounts and auto-review settings
**Summary:** (1) Automatically sync game databases from Lichess/chess.com, (2) save analysis report settings, (3) auto-launch report on game open.
**Relevance:** Medium -- workflow automation.

---

## BATCH 6: Large Enhancements / Proposals

Major features requiring significant architecture work.

### #607 -- Integrate Maia 2 for human-aware game analysis
**Summary:** Integrate the open-source Maia 2 chess model to show what real players at various ratings would play, alongside engine analysis.
**Relevance:** High -- differentiated feature, but large integration effort.

### #559 -- AI Move Explanation with Optional Voice Narration
**Summary:** Right-click a move to get AI-generated natural language explanation, optionally read aloud via TTS.
**Relevance:** Medium -- we already have TTS; the AI explanation part is the major work (LLM integration).

### #556 -- Advanced search and filters (opening, tag, style, result, length)
**Summary:** Full-featured search sidebar with ECO code, result, game length, player name, style filters, saved queries.
**Relevance:** High -- significant database UX improvement, but needs backend query infrastructure.

### #453 -- Woodpecker method (spaced repetition) for puzzle training
**Summary:** Create fixed puzzle sets, cycle through them repeatedly with timing and accuracy tracking per cycle.
**Relevance:** High -- training methodology feature.

### #449 -- Bulk game analysis in Game Report
**Summary:** Run game report on all games in a PGN file or database selection, not just one at a time.
**Relevance:** High -- saves enormous time for prolific players. Related to #536 (Mass Review).

### #536 -- Mass Review
**Summary:** Select a database/group of games and batch-review with same settings, saving results to each game.
**Relevance:** High -- same as #449 from a different angle.

### #432 -- Personal puzzles from own mistakes
**Summary:** Generate puzzles from positions where the user blundered in their own games, for targeted training.
**Relevance:** High -- requires game report data + puzzle generation pipeline.

### #360 -- Generate puzzles from imported games
**Summary:** Use tools like chess-puzzle-maker or pgn-tactics-generator to create tactical puzzles from any game.
**Relevance:** High -- blocked on #47 (local puzzle databases).

### #686 -- Generate puzzles from Lichess/Chess.com handle
**Summary:** Enter a username, fetch games, generate tactical puzzles automatically.
**Relevance:** Medium -- combines game import + puzzle generation; depends on #360.

### #339 -- Split view: Analysis + Database side by side
**Summary:** Show engine analysis panel and opening explorer/database panel simultaneously, like Lichess.
**Relevance:** High -- major workflow improvement for opening study.

### #335 -- Move score displayed directly on the board
**Summary:** Show move frequency and engine evaluation as overlays on destination squares.
**Relevance:** Medium -- visual feature, Chessbase-style.

### #616 -- Display arrows with evaluation scores in analysis mode
**Summary:** Show engine evaluation numbers on the blue analysis arrows (like Nibbler GUI).
**Relevance:** High -- improves analysis readability.

### #253 -- Detect duplicate games (including prefix/subset matches)
**Summary:** Detect and deduplicate games where one game is a subset of another (common with DGT boards, TWIC corrections).
**Relevance:** Medium -- database cleanup tool.

### #250 -- Player opening statistics with expanded detail
**Summary:** Show game termination types, average moves, filtering by combined criteria for opening analysis.
**Relevance:** Medium -- advanced statistics.

### #277 -- Plugin API for Extensibility
**Summary:** Full plugin system allowing third-party extensions (Obsidian integration, custom evaluations, etc.).
**Relevance:** Low -- massive architecture project, premature for our fork.

### #278 -- User Profiles
**Summary:** Self-contained user profiles with configurable locations for coaches, students, tournament preparation.
**Relevance:** Low -- significant complexity for niche use case.

### #47 -- Local puzzle databases
**Summary:** Support importing arbitrary puzzle databases in standard formats, not just Lichess puzzles.
**Relevance:** High -- foundational for puzzle features (#360, #432, #686).

### #72 -- Game report improvements (omnibus)
**Summary:** Remaining unchecked items: engine crash with non-multipv engines, live report of NAGs, more keyboard shortcuts, load multiple PGNs, delete all sidelines, limit engine's analyzed moves (`searchmoves`), more default engines.
**Relevance:** High -- game report is a core feature.

### #11 -- Issues and features (omnibus)
**Summary:** Remaining unchecked items: Load FEN/PGN from clipboard shortcut, Write PGN to clipboard, Analyze/Stop all engines shortcuts, Play vs engine shortcut, Generate report shortcut, Load multiple PGNs, Delete all sidelines, Being able to limit searchmoves, More default engines, Local puzzle databases.
**Relevance:** High -- these are accumulated suggestions; several overlap with other issues.

### #1 -- Add support for chess variants
**Summary:** Support King of the Hill, Three-Check, Antichess, Atomic, Horde, Racing Kings, Crazyhouse (Chess960 already done).
**Relevance:** Low -- very large scope; requires different move generation libraries.

### #329 -- Import game from ChessGames.com
**Summary:** Add ChessGames.com as a game import source alongside Lichess and Chess.com.
**Relevance:** Low -- niche import source.

### #378 -- Best move recommend + eval bar smoothing
**Summary:** (1) Best move recommendation display, (2) "{move} was played" analysis annotation, (3) smooth eval bar instead of blinking.
**Relevance:** Medium -- eval bar smoothing is especially relevant.

---

## SKIP LIST

Issues that are not relevant to En Parlant~ (Windows/macOS-only, distribution-specific, already addressed, or questions-not-bugs).

| Issue | Title | Reason |
|---|---|---|
| #702 | "Minor issues" with VirusTotal | VirusTotal/antivirus false positives -- not relevant (we build from source on Linux) |
| #661 | Embed AppImage update information | AppImage distribution -- we install from source |
| #148 | Flatpak, AppImage | Linux packaging formats -- we build from source |
| #165 | Add portable builds | Windows portable builds -- not relevant |
| #270 | Adding signing to installation packages | Windows SmartScreen/EV code signing -- not relevant |
| #543 | Chinese path save error | Windows-specific path encoding issue with settings corruption |
| #546 | Questions about playing vs engines and saving output | Question, not a bug; Windows-specific |
| #563 | Build of master fails: cargo metadata not found | Build issue -- user likely missing Rust/cargo; our build pipeline works |
| #371 | Bad engine architecture (macOS Silicon) | macOS-specific -- Stockfish downloads wrong arch on Apple Silicon |
| #128 | Allow players to play Lichess games on En Croissant | Playing live Lichess games in-app -- extremely large scope, low priority, quasi-cheating concern |
| #131 | Estimate ELO rating | Low priority speculative feature; depends on game analysis infrastructure |
| #152 | Studying plan generator (AI) | AI-generated study plans -- vague, very large scope |
| #153 | Strength and Weakness analysis tool (AimChess) | Large AI/analysis feature -- very complex, low priority |
| #224 | Bot personalities | Bot personalities with lower ELO -- better served by UCI_LimitStrength (#558) |
| #221 | Auto-mistake review | Auto-cycling through mistakes -- subsumed by personal puzzles (#432) |
| #205 | Ability to interact with Lichess Studies | Lichess API integration for studies -- large scope, Lichess-specific |
| #228 | Game Animation (MP4/GIF export) | Export PGN as video -- very large scope, niche |
| #239 | Live games analysis (Lichess broadcasts) | Real-time tournament broadcast analysis -- large scope |
| #268 | Add Null move (--) | PGN null move support -- niche Chessbase feature |
| #429 | Make your own opening book (.bin, .abk) | Opening book creation -- large scope, niche |
| #424 | Cloud engines for game report | Use Lichess/ChessDB cloud evals for reports -- architecture change |
| #423 -- Merge games | Merge database games into repertoire/analysis | Moderate, but vaguely specified |
| #434 | Analyzing while playing against engine | Show eval bar during engine play -- conflicts with fair play |
| #461 | Live update of imported games | Auto-update ongoing games from Lichess/Chess.com links -- large scope |
| #463 | Play with engine from position | Switch sides mid-game, see eval, take back -- partially exists |
| #509 | Fragility of chess positions measurement | Academic paper implementation -- very niche |
| #535 | Converting multiple databases to PGNs at once | Queue multiple DB-to-PGN conversions -- minor UX, low priority |
| #628 | Support eBoard drivers | Electronic board integration via Graham O'Neill drivers -- large hardware integration scope |
| #361 | Player insights (chess.com style) | Full insights dashboard -- very large scope |
| #127 | Opening book support (.bin format) | Opening book format support for engine play -- moderate but niche |
| #108 | Move descriptions in Game Report | Natural language move explanations -- subsumed by #559 (AI explanations) |

---

## Notes on Cross-Issue Dependencies

Several issues form dependency chains worth noting:

1. **Puzzle pipeline:** #47 (local puzzle DBs) blocks #360 (generate puzzles from games) which blocks #432 (personal puzzles) and #686 (puzzles from handle).
2. **Game report chain:** #72 and #637 and #246 all relate to improving move classification; #449 and #536 both request batch analysis.
3. **Engine animation lag:** #530 and #631 are the same fundamental issue (UI stutter during engine analysis); #631 attributes it specifically to Tauri 2.
4. **Lichess casual games:** #372 and #393 both request importing unrated/casual Lichess games.
5. **Notation display:** #445, #442, and #282 all request improvements to how moves and variations are displayed.

## Recommended Priority Order

For En Parlant~ development, the recommended attack order is:

1. **BATCH 1 first** -- quick wins that clean up the codebase and fix obvious UI bugs
2. **BATCH 4 high-relevance items** (#510, #495, #301, #254, #534, #708) -- small effort, high impact
3. **BATCH 2 items** -- moderate bugs that affect daily use (#670, #633, #673, #163)
4. **BATCH 5 high-relevance items** (#191, #252, #306, #263, #445, #251) -- core workflow improvements
5. **BATCH 3** (#530/#631) -- performance investigation, high impact but uncertain effort
6. **BATCH 6** as time/interest allows, starting with #47 (unlocks puzzle pipeline) and #449/#536 (batch analysis)
