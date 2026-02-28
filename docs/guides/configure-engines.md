# Configure Engines

To set up an engine, navigate to the Engines page, select your desired engine, and adjust settings displayed on the right side of the screen.

## General Settings

- **Name** and version identification
- **ELO rating** (estimated engine strength)
- **Custom image** selection

## Search Settings

These parameters control engine analysis duration, corresponding to UCI protocol commands:

| Setting | Description |
|---------|-------------|
| **Time** | Analysis duration in seconds |
| **Depth** | Search to a specific ply level |
| **Nodes** | Maximum node count for evaluation |
| **Infinite** | Unlimited analysis mode |

## Advanced Settings (UCI Options)

- **MultiPV** — The number of variations the engine will output
- **Threads** — Processing thread allocation
- **Hash** — Memory allocation in MB for position storage

## Important Warning

> **Uci_Chess960** is automatically enabled in games with the header `Variant 'Chess960'`, so you should **not** enable it in the engine settings. Enabling it manually can compromise standard chess analysis and reporting features.

---

*This documentation is based on the original [En Croissant docs](https://www.encroissant.org/docs/) by [Francisco Salgueiro](https://github.com/franciscoBSalgueiro).*
