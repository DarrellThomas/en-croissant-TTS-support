# Proposal Research & Write-Up

You are writing a feature proposal for **en-parlant**, a Tauri + React + Rust chess GUI (fork of en-croissant) located at `/data/src/en-parlant`.

The topic or feature idea is: **$ARGUMENTS**

---

## Your job

Produce a thorough, honest proposal document. Not a sales pitch — a structured investigation that a developer can use to decide whether and how to build something.

---

## Phase 1: Research (do both in parallel)

**1a. Codebase audit** — Use the Explore agent to answer:
- Does anything related to this feature already exist in the codebase?
- What existing code would be extended, replaced, or in conflict?
- What are the key files and data structures involved?
- Is there a natural integration point, or would this require invasive changes?

Key dirs to check: `src/`, `src-tauri/src/`, `src-tauri/Cargo.toml`, `.claude/`

**1b. External research** — Use the general-purpose agent to answer:
- Do open-source libraries or services already solve this problem?
- What do competing chess platforms (Lichess, Chess.com, ChessBase) do here?
- What are the known failure modes or anti-patterns for this class of feature?
- What does the broader ecosystem (Rust crates, npm packages, protocols) offer?

---

## Phase 2: Analysis

After research completes, think through all of the following. Be honest about negatives.

**Upside**
- What problem does this solve, and for whom?
- What is the realistic best-case outcome?
- Does it unlock other future features?

**Downside / Cost**
- What is the implementation complexity (rough estimate in phases or days)?
- What new dependencies, infrastructure, or operational burden does it add?
- What existing behavior could break or degrade?

**Edge Cases**
- What are the non-obvious failure modes?
- What happens under poor network conditions, missing data, or unexpected user behavior?
- What are the platform-specific concerns (Linux/Windows/Mac, Tauri constraints)?

**Blind Spots**
- What assumptions are baked in that might be wrong?
- What does this feature implicitly depend on that doesn't exist yet?
- What user behavior might differ from what we expect?

**Alternatives Considered**
- What other approaches were evaluated?
- Why is this approach better than those, or why is it not?

---

## Phase 3: Write the proposal

Determine the next proposal number by listing files in `/data/src/en-parlant/proposals/` and incrementing from the highest existing number.

Write the file to:
```
/data/src/en-parlant/proposals/<NNN>-<slug>.md
```

Where `<NNN>` is zero-padded to 3 digits and `<slug>` is a short kebab-case name derived from the topic.

---

## Proposal document format

```markdown
# Proposal <NNN>: <Title>

**Status:** Draft
**Date:** <today>
**Author:** Darrell Thomas

---

## 1. Problem Statement
[2-3 sentences: what problem does this solve and for whom]

## 2. Proposed Solution
[High-level description of the approach]

## 3. Current State Audit
[What exists today in the codebase that is relevant. Key files, data structures, gaps.]

## 4. Feature Breakdown
[The meat. Describe the feature in enough detail that a developer could implement it.
Break into phases if the work is large. Each phase should be independently shippable.]

## 5. Upside
[Honest assessment of the value this delivers]

## 6. Downside / Cost
[Implementation effort, new dependencies, operational burden, maintenance cost]

## 7. Edge Cases
[Non-obvious failure modes, platform concerns, user behavior surprises]

## 8. Blind Spots
[Assumptions that might be wrong. What this implicitly depends on that doesn't exist yet.]

## 9. Alternatives Considered
[Other approaches evaluated and why they were rejected or deferred]

## 10. Build Order
[Ordered list of phases/steps. Each phase delivers value without requiring the next.]

## 11. Open Questions
[Things that need a decision before or during implementation]
```

---

## Ground rules

- Do not start writing the document until both research agents have completed
- Do not soften negatives to make the proposal look better — honest downsides are more useful than optimism
- If a feature depends on something that doesn't exist yet (e.g., multiplayer before a teaching plugin), call that out explicitly in the build order
- If an open-source solution already solves the problem well, say so and propose using it rather than building from scratch
- Keep section lengths proportional to their importance — a two-line edge case is fine; a five-paragraph "Problem Statement" is not
