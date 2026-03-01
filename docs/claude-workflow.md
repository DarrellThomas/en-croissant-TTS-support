# How We Work with Claude Code

*Back to the [Documentation Index](README.md)*

The [AI note](ai-note.md) says we built this with Claude Code. This page shows you the actual cockpit.

Most "built with AI" claims stop at the label. Here's the full picture: what the AI knows, what it's told, how sessions work, and where the human draws the line. If you're building with AI yourself, or just curious what it actually looks like in practice, this is for you.

## What the AI Knows

Claude Code has a persistent memory file that carries context across sessions. Instead of re-exploring the codebase every conversation, it picks up where we left off. Here's what's in it (sanitized):

### Project Identity
- App name, source location, license, app identifier
- Fork relationship: upstream is En Croissant by Francisco Salgueiro, we maintain our own fork independently
- Why the fork exists: upstream maintainer declined the TTS feature, which is fair — different visions for the same project

### Build Rules
- **pnpm only** — npm breaks vanillaExtract (white screen at runtime, no error, just nothing)
- Node.js 22+ required (Vite 7 needs `crypto.hash`)
- Always `pnpm format && pnpm lint:fix` before committing
- Close the app before overwriting the binary ("Text file busy")
- After moving source directories, `cargo clean` to clear stale path references

### Architecture Knowledge
- Which files own which features (atoms in `atoms.ts`, tree navigation in `tree.ts`, TTS engine in `tts.ts`)
- Why all TTS atoms need `getOnInit: true` (imperative reads via `store.get()` before React subscribes)
- How the audio cache works (`provider:voiceId:lang:text` keys)
- The chessground coordinate fix is CSS-side, not a fork of the library
- Data layout: what lives where, what's symlinked, what survives app restarts

### What It Doesn't Know
The memory doesn't contain API keys, passwords, or credentials. It references their storage locations (localStorage atom names) but never the values. The AI generates code that reads keys from settings — it never sees or handles the actual secrets.

## What the AI Is Told

Beyond the memory file, Claude Code follows rules baked into its system:

- **Don't over-engineer.** Only make changes that are directly requested. A bug fix doesn't need surrounding code cleaned up. Three similar lines of code is better than a premature abstraction.
- **Don't guess URLs.** Never fabricate links or endpoints.
- **Read before editing.** Never propose changes to code it hasn't read.
- **Prefer editing to creating.** Don't create new files unless absolutely necessary.
- **No security vulnerabilities.** Watch for injection, XSS, and OWASP top 10 issues.
- **Ask when uncertain.** If an instruction is ambiguous, ask rather than guess.
- **Measure twice, cut once.** Destructive operations (force push, reset --hard, deleting files) require explicit human approval.

## How Sessions Work

A typical session looks like this:

1. **Human states intent.** "Add caching note to the KittenTTS section." "Remove PostHog telemetry." "The quality ratings are wrong, here's what they should be."

2. **AI reads the relevant files.** It doesn't guess what's in a file. It reads it, understands the current state, then proposes changes. Multiple files are read in parallel when they're independent.

3. **AI makes the change.** Targeted edits to existing files. Not rewrites — surgical modifications that preserve everything around them.

4. **Human reviews.** Every edit is shown before it hits disk. The human approves, rejects, or redirects. "No, that's too soft — say it genuinely sucks." "Move that paragraph up." "That's not what I meant."

5. **Commit when told.** The AI never commits on its own initiative. The human says "commit" or "commit and push." Commits include `Co-Authored-By: Claude Opus 4.6` — always attributed, never hidden.

### What the AI Proposes vs. What Ships

The AI's first suggestion is rarely the final version. A typical exchange:

- AI drafts something reasonable
- Human says "too corporate" or "be more direct" or "that's wrong, here's why"
- AI adjusts
- Human approves

The taste, tone, and final call are always human. The AI handles velocity — reading files, understanding context, making precise edits across a codebase it can hold in memory. The human handles judgment — what to build, how it should feel, when to stop.

## Darrell's Coding Principles

The full principles document lives in the repo at [`.claude/01_UNIVERSAL_PRINCIPLES.md`](../.claude/01_UNIVERSAL_PRINCIPLES.md). It started as Robert C. Martin's *Clean Code* (2008) plus Nate's additions for the AI era. Then we had an honest conversation about what still holds up and what doesn't.

*Clean Code* was written for Java teams maintaining large codebases over years, in a world where code was expensive to write and cheap to read. The principles underneath are often timeless. The specific rules sometimes aren't. We now build in a world where code is cheap to write and the bottleneck is *judgment about what to write*. That changes things.

### What's Timeless

These hold up regardless of era, language, or tooling:

- **Intention-revealing names.** Always. Forever.
- **Functions do one thing.** The real principle is coherence, not size. A 40-line function that does one thing well is better than a 15-line function that does two things.
- **No side effects.** Still the source of most bugs.
- **Comments explain why, not what.** The code shows what.
- **Single Responsibility.** A module should have one reason to change.
- **Program to interfaces, not implementations.**
- **Law of Demeter.** Train wrecks are still train wrecks.
- **Don't swallow errors.** Every error is information.
- **Architecture is portable, tools are not.**
- **Emergent design:** runs all tests, no duplication, expresses intent, minimizes complexity. In that order.

### What's Contextual

These principles are sound, but the specific rules reflect a pre-AI or language-specific world. We apply the spirit, not the letter:

- **DRY.** Duplication that *drifts apart* is dangerous. But extracting every repeated pattern into an abstraction creates indirection that can be worse than the disease. With AI tooling that can find and update all instances instantly, the drift risk drops. Sometimes three readable lines right here is better than a premature abstraction in another file.
- **"Small, then smaller than that."** The original rule optimized for human scanning speed. What matters is that a function does one coherent thing. Size is a proxy for coherence, and not a great one.
- **Strict TDD ceremony.** "You may not write production code until you have a failing test." The *principle* — ship tested code, know it works — is non-negotiable. The *ceremony* — test must exist before code — was designed for a workflow where humans type slowly. In an AI-assisted workflow where the feedback loop is already fast, the ceremony matters less than the outcome. Write tests. Make sure they pass. Whether the test or the code came first is less important than whether both exist.
- **Don't return null.** In Java, null is a landmine. In TypeScript, `string | null` is a union type the compiler forces you to handle. Don't ban what the type system already makes safe.
- **Command-Query Separation.** React hooks return both value and setter by design. You can't use modern React while following CQS strictly. The principle is sound for your own APIs; don't fight the framework.
- **The Boy Scout Rule.** "Leave the campground cleaner" — yes. But the Boy Scout cleaned up the campsite, not the whole forest. Fix what you touch. Don't refactor a file's entire structure because you changed one line in it.

### AI-Era Additions

These are the newest principles and arguably the most important:

- **Principles-based guidance scales better than rules.** "Use test-driven development" beats "write a test file named `test_<module>.py` for every module." The principle allows judgment; the rule is brittle.
- **If the agent builds it, the agent can maintain it.** Keep conversation context and artifacts. Document the build process, not just the result.
- **Clear over clever.** This was always true, but AI changes *why*. The old reason: humans need to read it. The new reason: the system that built this needs to reconstruct the reasoning and modify it correctly. Explicit structure beats tiny clever abstractions — not because humans are slow, but because maintainability now means agent maintainability too.
- **Could this become infrastructure?** A tool solves a problem for you. Infrastructure enables others to build on top. Design accordingly.

## Where the Human Draws the Line

The AI is a tool. A remarkably good one. But there are things it doesn't do:

- **Product decisions.** What features to build, what to cut, what the app should feel like. "The System TTS quality rating should say 'passable' because it genuinely sucks" — that's a human judgment call based on actually listening to it.
- **Taste.** The AI can write clean prose, but the voice of the AI note, the decision to be blunt about quality, the choice to credit Francisco prominently — those are human choices.
- **Ethics.** Removing PostHog wasn't a refactoring task. It was "the settings page says we don't collect telemetry, but there's an active PostHog API key in the code. That's a lie. Fix it." The AI executed. The human identified the problem and cared about it.
- **Chess.** The board doesn't care about your tooling.

## Why Share This

Because "built with AI" has become meaningless. Everyone says it. Nobody shows it. The interesting question isn't whether AI was involved — it's *how* it was involved, and what the human actually contributed.

This is the answer. The human brings the vision, the taste, the judgment, and the accountability. The AI brings the velocity, the memory, and the tireless willingness to read Rust error messages at 2am.

Neither builds this thing alone. Both are credited. That's the deal.

---

*En Parlant~ is a fork of [En Croissant](https://github.com/franciscoBSalgueiro/en-croissant) by Francisco Salgueiro, built with [Claude Code](https://www.anthropic.com/claude-code) by Anthropic.*
