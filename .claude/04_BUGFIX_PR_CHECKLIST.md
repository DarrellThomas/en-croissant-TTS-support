# Bug Fix & PR Pre-Flight Checklist

**Origin:** en-croissant PR campaign debrief (2026-03-01). 4 of 12 PRs failed because we fixed symptoms instead of root causes. This checklist exists to prevent that failure mode.

---

## Before Writing Any Code

### 1. Trace the full data path

Do not touch code until you can answer all three:

- **Where does the data originate?** (database row, API response, user input, mmap index, etc.)
- **What transformations does it pass through?** (query → filter → map → serialize → render)
- **Where does the user see it?** (UI component, CLI output, file on disk)

Find the **earliest point** where the data diverges from expected. That's where the fix goes — not at the symptom.

**The anti-pattern we're preventing:** Changing the code nearest to the visible symptom.

Examples from our failures:
- Cache invalidation doesn't help if the database still has orphaned rows (#713)
- ORDER BY doesn't help if the wrong rows were already selected (#715)
- `useRef` doesn't help if the parent component overwrites the value every render (#714)
- CSS tweaks don't help if your selectors target the wrong DOM structure (#699)

### 2. Read the relevant code — all of it

Before proposing a fix, read:
- The function where the bug manifests
- The function(s) that call it
- The function(s) it calls
- The data structures involved

"A few minutes of reading would have prevented each mistake." — debrief

### 3. Ask: "Does this change actually affect the data the user sees?"

Write a one-sentence explanation of **why** your change fixes the problem, in terms of the data flow. If you can't write that sentence, you haven't found the root cause yet.

---

## Before Submitting a PR

### 4. Build and test

At minimum:
- [ ] `cargo test` / `npm test` / equivalent passes
- [ ] If UI-affecting: build, install, and visually verify against real data
- [ ] Run a 30-second thought experiment: "Which data actually reaches the user after my change?"

If a maintainer could reasonably ask "Did you test these changes?" — the answer must be yes.

### 5. Verify the fix is complete

- [ ] Does the fix handle the case described in the issue?
- [ ] Does it handle edge cases? (nulls, empty collections, concurrent access)
- [ ] Did you introduce any regressions in adjacent functionality?

### 6. Check procedural basics

- [ ] Correct fork and branch (`git remote -v`)
- [ ] Clean diff — no unrelated changes
- [ ] Commit message explains *why*, not just *what*

---

## Before Building Large Features

### 7. Ask the maintainer first

Before investing more than ~2 hours on a feature PR:
- Open a discussion or issue comment
- One sentence: "Would you accept [approach X], or do you prefer [approach Y]?"
- Understand the maintainer's philosophy on dependencies, complexity, and scope

We built an entire TTS feature with paid API dependencies (#704). The maintainer wanted local-only. One paragraph would have saved the effort.

---

## When You Receive Feedback

### 8. Read the feedback twice

Maintainer feedback is often precise and diagnostic. Extract the root cause from their words before jumping to a new implementation.

Example: *"it will simply order the 10 first games that the search function finds"* — that one sentence contained the entire diagnosis of #715.

### 9. Rework properly

When reworking:
- Go back to step 1 (trace the data path)
- Don't patch your patch — fix the actual root cause
- Test the rework against real data before resubmitting

---

## Quick Reference: The Symptom-Fixing Test

Before submitting, ask yourself:

> "Am I changing the code nearest to where the user sees the problem, or the code where the data actually goes wrong?"

If the answer is "nearest to the symptom" — stop and trace deeper.
