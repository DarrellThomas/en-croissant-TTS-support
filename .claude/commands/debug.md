# Debug En Parlant~

Systematic bug investigation for En Parlant~. Follows the root-cause-first methodology from the project's bugfix checklist.

If $ARGUMENTS contains a description of a bug or symptom, start there. Otherwise, ask the user to describe what they're seeing.

---

## Bug Fix & PR Pre-Flight Checklist

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

## En Parlant~ Debug Toolkit

### Launch app with output captured
```bash
WEBKIT_DISABLE_DMABUF_RENDERER=1 en-parlant > /tmp/ep-debug.log 2>&1 &
tail -f /tmp/ep-debug.log
```

### Launch in dev mode (HMR + DevTools available)
```bash
cd /data/src/en-parlant && pnpm tauri dev
```

### Check app log
```bash
tail -50 ~/.local/share/org.enparlant.app/logs/en-parlant.log
```

### Typecheck without building
```bash
cd /data/src/en-parlant && pnpm tsc --noEmit
```

### Lint and format
```bash
cd /data/src/en-parlant && pnpm format && pnpm lint:fix
```

### Build (no bundle — fast binary only)
```bash
cd /data/src/en-parlant && pnpm tauri build --no-bundle
```

### Install after build
```bash
cd /data/src/en-parlant && sudo ./install.sh
```

---

## Before Submitting a Fix

### 4. Build and test

At minimum:
- [ ] `pnpm tsc --noEmit` passes (no TypeScript errors)
- [ ] `pnpm format && pnpm lint:fix` passes
- [ ] If UI-affecting: build, install (`sudo ./install.sh`), and visually verify
- [ ] Run a 30-second thought experiment: "Which data actually reaches the user after my change?"

If someone could reasonably ask "Did you test these changes?" — the answer must be yes.

### 5. Verify the fix is complete

- [ ] Does the fix handle the case described in the issue?
- [ ] Does it handle edge cases? (nulls, empty collections, concurrent access)
- [ ] Did you introduce any regressions in adjacent functionality?

### 6. Check procedural basics

- [ ] Clean diff — no unrelated changes
- [ ] Commit message explains *why*, not just *what*

---

## Quick Reference: The Symptom-Fixing Test

Before submitting, ask yourself:

> "Am I changing the code nearest to where the user sees the problem, or the code where the data actually goes wrong?"

If the answer is "nearest to the symptom" — stop and trace deeper.
