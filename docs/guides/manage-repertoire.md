# Manage Repertoire

## What is a repertoire?

A repertoire is a collection of chess variations that you want to study, usually organized by opening. The system stores it as a standard PGN file but includes specialized Build and Train modes for constructing and memorizing specific lines.

## Creating a Repertoire

You can start from the main screen by clicking **Create Repertoire**, or navigate to the Files page, select **Create**, and choose **Repertoire**. Once opened, variations can be added immediately.

## Build Mode

Open Build mode by selecting the **Build** button in the side panel.

### Setting a Starting Position

1. Make the relevant opening moves (e.g., Ruy Lopez moves)
2. Click **Set as Start** to establish the repertoire root

Build mode displays commonly played moves from each position using reference database data, showing win rates and current coverage.

### Navigation

- **Go to your next gap** — jumps to the next uncovered position
- **Go to your biggest gap** — jumps to the position with the most uncovered lines

### Coverage

Coverage measures your preparation depth for opponent responses. A variation is "completely covered" when extended to a position with fewer games than the target threshold specified in **Settings > Repertoire**.

The system automatically handles transpositions, recognizing when positions reachable through different move orders have already been prepared.

## Train Mode

After building lines, click **Train** to drill them. The interface shows repertoire positions and requires you to find the correct move.

### Spaced Repetition

Rate your recall difficulty on a scale of 1-4 after each move. The system prioritizes difficult moves using spaced repetition. Keyboard shortcuts **1-4** enable quick rating.

### Progress Tracking

The progress bar displays:
- Current session practice percentage
- Moves practiced count
- Correct/incorrect statistics
- Overall accuracy percentage

When positions require review, a symbol appears next to the filename in the Files page.

---

*This documentation is based on the original [En Croissant docs](https://www.encroissant.org/docs/) by [Francisco Salgueiro](https://github.com/franciscoBSalgueiro).*
