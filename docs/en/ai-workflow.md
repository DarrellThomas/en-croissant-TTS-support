**English** | [Français](../fr/ai-workflow.md) | [Español](../es/ai-workflow.md) | [Deutsch](../de/ai-workflow.md) | [日本語](../ja/ai-workflow.md) | [Русский](../ru/ai-workflow.md) | [中文](../zh/ai-workflow.md) | [한국어](../ko/ai-workflow.md)

# AI Workflow: What Working with a Coding AI Actually Looks Like

*Back to the [Documentation Index](../README.md) | See also: [A Note from Darrell](ai-note.md) | [Claude Code Workflow](../claude-workflow.md)*

The [AI note](ai-note.md) tells you this project was built with Claude Code. The [workflow doc](../claude-workflow.md) shows you the cockpit — what the AI knows, what it's told, how sessions work. This document goes deeper. If you've ever been curious what working with a coding AI actually looks like — not the marketing version, the real thing — this is it.

## 1. What Is a Prompt?

A prompt is text you send to an AI model. Text in, text out. That's really all it is.

But the quality of what comes back depends entirely on what you send in. "Make me a chess app" and "Add a TTS narration feature to this Tauri/React chess GUI that reads SAN move notation aloud in eight languages using the ElevenLabs and Google Cloud TTS APIs" produce very different results. The first gives you something generic. The second gives you something you can actually use.

Here's a real prompt from this project:

> Add a speaker icon to the Comment component that calls speakMove() when clicked. The icon should only appear when TTS is enabled. Use the IconVolume icon from Tabler, same size as the existing action icons.

That's specific enough that the AI can read the relevant file, understand the component structure, and make a targeted edit. No guessing required.

Compare that to:

> Add TTS to the comments

That could mean a dozen things. The AI would have to guess — and guessing produces slop.

## 2. Writing Good Prompts

The difference between a useful AI interaction and a frustrating one is almost always the prompt. Here's what makes prompts work:

**Be specific about what you want.** Not "fix the bug" but "the TTS cache key doesn't include the provider name, so switching from ElevenLabs to Google plays cached ElevenLabs audio instead of generating new audio."

**Include context the AI doesn't have.** The AI can read your code, but it can't read your mind. "The user reported that coordinates are backwards on the board" is less useful than "the CSS in chessgroundBaseOverride.css has ranks and files swapped — Francisco's original had them backwards."

**State your constraints.** "Don't create new files" or "use the existing atom pattern" or "this needs to work without an API key" tell the AI where the guardrails are.

**Say what you don't want.** "Don't add error handling for cases that can't happen" or "don't refactor the surrounding code" prevents over-engineering — the most common AI failure mode.

The pattern is: **intent + context + constraints**. Master that and the AI becomes dramatically more useful.

## 3. Using One Claude to Prompt Another

Here's a technique that sounds recursive but is genuinely powerful: using Claude to design the approach before Claude writes the code.

Claude Code has a "plan mode" that separates thinking from doing. In plan mode, the AI reads files, explores the codebase, and produces a plan — but writes no code. You review the plan, adjust it, then switch to implementation mode where the AI executes.

Why does this work? Because the hardest part of any coding task isn't writing the code. It's figuring out *what* code to write — which files to change, what patterns to follow, what edge cases exist, what the right approach is. Plan mode dedicates full attention to that question before a single line gets written.

From this project: when we restructured the Help menu to add the Language selector, the plan mode conversation explored how Tauri menus work, what atoms already existed, how the doc viewer resolved resource paths, and what the confirmation dialog API looked like. By the time we switched to implementation, the AI had a complete map of the changes. No false starts. No "actually, wait, that approach won't work."

You're essentially using one instance of the AI as a senior architect and another as the developer. Same model, different roles.

## 4. Context Windows and Save States

Every AI conversation has a context window — the total amount of text it can hold in memory at once. Think of it as working memory. When the conversation gets long enough to approach the limit, older messages get compressed to make room for new ones.

This matters because the AI's ability to make good decisions depends on what's in context. If a critical piece of information gets compressed away, the AI might make a decision that contradicts something discussed earlier.

Two strategies for managing this:

**Keep conversations focused.** One task per conversation works better than cramming everything into a marathon session. When you finish adding TTS caching, start a fresh conversation for the menu restructure.

**Save states.** Claude Code can save conversation transcripts as JSONL files. These are complete records — every message, every tool call, every file read. You can resume a conversation from a save state, picking up exactly where you left off with full context restored. This is how multi-day features get built without losing continuity.

The memory file (described in the [workflow doc](../claude-workflow.md)) serves a different purpose. It's a persistent knowledge base that survives across conversations — project structure, build rules, architectural decisions. The context window is ephemeral; the memory file is permanent.

## 5. Skills and Slash Commands

Claude Code supports "skills" — reusable prompts stored as markdown files in the `.claude/commands/` directory. You invoke them with a slash command, like `/translate-docs`.

This project uses a `/translate-docs` skill that automates translating documentation into seven languages. The skill file contains the full instructions: which files to translate, what nav bar format to use, how to handle code blocks and links, what tone to maintain. Instead of explaining all that every time, you just type `/translate-docs` and the AI knows exactly what to do.

Skills are powerful because they encode *process*, not just *information*. The memory file says "translations live in `docs/{lang}/`." The skill says "here's exactly how to create a new translation: read the English source, preserve all markdown formatting, translate prose but not code, add the nav bar with the current language bolded, link to existing translations."

You can build skills for any recurring workflow: running tests, deploying, reviewing PRs, updating changelogs. They turn tribal knowledge into repeatable automation.

## 6. Principles Over Rules

This project is guided by principles files in the `.claude/` directory. There's a universal principles document and a project-specific one. They don't say "always use semicolons" or "functions must be under 20 lines." They say things like:

- **Intention-revealing names.** Always.
- **Don't over-engineer.** Three similar lines is better than a premature abstraction.
- **Read before editing.** Never propose changes to code you haven't read.
- **Measure twice, cut once.** Destructive operations require explicit approval.

Why principles instead of rules? Because rules are brittle. "Use test-driven development" works in most cases, but mandating "write a test file named `test_<module>.py` for every module" breaks down when you're writing a UI component that's better tested by running the app. Principles allow judgment. Rules don't.

The AI follows these principles because they're in its context at the start of every session. They're not suggestions — they're operating constraints. And because they're *principles*, the AI can apply them to novel situations the rule-writer never anticipated.

## 7. The Human's Job

Everything described above is about how the AI works. Here's the part that matters more: what the human does.

**Taste.** The AI can write clean prose, but the decision to be blunt about TTS quality ratings ("passable" for system TTS because it genuinely doesn't sound good) — that's a human call based on actually listening to the output.

**Judgment.** When we found an active PostHog API key in the codebase while the settings page said "we don't collect telemetry," the AI didn't identify the contradiction. The human did. The AI removed the code. The human recognized it was wrong.

**Product decisions.** What features to build, what to cut, what the app should feel like, who it's for. The AI doesn't have opinions about these things. It has capabilities.

**Ethics.** Crediting Francisco prominently. Being honest about AI involvement. Choosing transparency over polish. These aren't engineering decisions. They're character decisions.

The cockpit metaphor from the [AI note](ai-note.md) holds: the pilot doesn't hand-fly every second of every flight, but the pilot is always in command. The automation handles the parts that don't require your soul. The pilot handles everything else.

## 8. Try It Yourself

If you want to see what this looks like in practice:

**Explore this repo's `.claude/` directory.** The principles files, the skills, the memory structure — it's all there. Open source means open process.

**Try Claude Code.** It's available at [claude.com/claude-code](https://www.anthropic.com/claude-code). Start with a small project. The learning curve isn't the AI — it's learning to write good prompts and knowing when to direct vs. when to delegate.

**Read the workflow doc.** The [Claude Code Workflow](../claude-workflow.md) document shows the specific mechanics: what the AI knows, how sessions work, the coding principles that guide every interaction.

**Start small.** Don't try to build a chess app with TTS narration on day one. Start with "read this file and explain what it does." Then "add a comment to this function." Then "refactor this to use the existing pattern." Build your intuition for what works.

The tools are here. The question is the same one it's always been: what are you going to build with them?

---

*En Parlant~ is a fork of [En Croissant](https://github.com/franciscoBSalgueiro/en-croissant) by Francisco Salgueiro, built with [Claude Code](https://www.anthropic.com/claude-code) by Anthropic.*
