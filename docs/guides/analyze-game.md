# Analyze Game

The Analyze Game feature enables you to examine chess games through engine evaluations and database references.

## Getting Started

1. Import a game
2. Open the Analysis tab
3. Select "Generate Report"

## Analysis Options

### Reverse Analysis

Reverse analysis is the default setting. Since most chess engines can utilize information on positions previously analyzed, the most efficient analysis is done by starting from the end.

### Annotate Novelties

Adds comments to positions not found in reference databases, flagging them as novel moves.

## Annotation Metrics

The system evaluates moves using three primary metrics:

### Win% Loss

Derived from real game data using the formula:

```
Win% = 50 + 50 * (2 / (1 + exp(-0.00368208 * centipawns)) - 1)
```

This formula is sourced from Lichess methodology.

### Only Sound Move

Runs the engine with MultiPV 2 to determine if the best move is uniquely viable.

### Sacrifice Detection

Employs an Alpha-Beta engine; moves worse than the previous position qualify as sacrifices.

## Annotation Symbols

The platform assigns these symbols based on move quality:

| Symbol | Name | Criteria |
|--------|------|----------|
| `!!` | Brilliant | Sacrifices that are the only sound option |
| `!` | Good | Sound moves punishing opponent errors |
| `!?` | Interesting | Non-sound sacrifices |
| `?!` | Dubious | 5-10% win probability loss |
| `?` | Mistake | 10-20% win loss |
| `??` | Blunder | 20-100% win loss |

---

*This documentation is based on the original [En Croissant docs](https://www.encroissant.org/docs/) by [Francisco Salgueiro](https://github.com/franciscoBSalgueiro).*
