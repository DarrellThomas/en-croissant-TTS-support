# Universal Programming & Architecture Principles

**Purpose:** These principles apply to ALL projects. Load this prompt before any project-specific work. They are foundations for building maintainable, scalable systems.

---

## A Note on Origins and Context

Most of what follows comes from Robert C. Martin's *Clean Code* (2008) and related works. These were written for Java teams maintaining large codebases over years, in a world where code was expensive to write and cheap to read. The principles underneath are often timeless. The specific rules sometimes aren't. The AI-era principles and quotations attributed to "Nate" come from [Nate B. Jones](https://www.natebjones.com), an AI educator known for his practical, hype-free approach to AI implementation.

We now build in a world where code is cheap to write and the bottleneck is judgment about *what* to write. An AI pair-programmer can refactor an entire file in seconds, find and update every instance of a pattern instantly, and hold an entire codebase in context. The cost of "fixing it later" has collapsed. That changes the calculus on several classic rules.

Each section below is marked:

- **Timeless** — the underlying principle holds regardless of era, language, or tooling
- **Contextual** — the principle is sound but the specific rule reflects a pre-AI or language-specific world; apply the spirit, not the letter

---

## Core Philosophy

> "Architecture is portable, tools are not." — Nate's First Principle

Learn and apply **patterns**, not just tools. Tools change; principles endure. When you understand *why* something works, you can implement it anywhere.

---

## 1. CLEAN CODE FUNDAMENTALS

### 1.1 Naming — *Timeless*

- **Use intention-revealing names.** A name should tell you why it exists, what it does, and how it's used.
- **Avoid disinformation.** Don't use names that obscure meaning or conflict with established meanings.
- **Make meaningful distinctions.** If names must differ, they should differ meaningfully (`getActiveAccount()` vs `getActiveAccountInfo()` is noise).
- **Use pronounceable names.** Code is read by humans. `genymdhms` is unacceptable; `generationTimestamp` is clear.
- **Use searchable names.** Single-letter variables and numeric constants are impossible to grep.
- **Avoid encodings.** No Hungarian notation. No `m_` prefixes. Modern IDEs make these obsolete.
- **Class names are nouns.** `Customer`, `WikiPage`, `Account`, `AddressParser`.
- **Method names are verbs.** `postPayment`, `deletePage`, `save`.

### 1.2 Functions — *Mostly Timeless, Some Contextual*

- **Do one thing.** A function should do one thing, do it well, and do it only. *Timeless.*
- **One level of abstraction per function.** Don't mix high-level concepts with low-level details. *Timeless.*
- **Descriptive names.** Long descriptive names are better than short enigmatic ones. *Timeless.*
- **No side effects.** A function that promises to do one thing should not secretly modify state elsewhere. *Timeless.*
- **Minimal arguments.** Fewer is better. Three or more requires justification. *Timeless.*
- **Small.** Functions should be small. *Contextual.* The original rule ("then smaller than that") optimized for human scanning speed. What actually matters is that a function does one coherent thing. A 40-line function that does one thing well is better than a 15-line function that does two things. Size is a proxy for coherence — coherence is the real principle.
- **No flag arguments.** *Contextual.* In Java this was a strong signal. In TypeScript/React, boolean props and options are idiomatic. Apply judgment — if a boolean makes the function do two unrelated things, refactor. If it's a configuration toggle, it's fine.
- **Command-Query Separation.** Functions should either do something OR answer something, never both. *Contextual.* React hooks (`useState`, `useAtom`, `useReducer`) return both value and setter by design. You can't use modern React idiomatically while following CQS strictly. The principle is sound for your own APIs; don't fight the framework.
- **DRY: Don't Repeat Yourself.** *Contextual.* Duplication that drifts apart is genuinely dangerous. But the cure — extracting every repeated pattern into an abstraction — creates indirection that can be worse than the disease. With AI tooling that can find and update all instances of a pattern instantly, the drift risk drops. Sometimes three similar lines that are readable right here *is* better than a premature abstraction in another file. The real principle: don't let logic drift apart. The rule "never duplicate" is too absolute.
- **Prefer exceptions to error codes.** *Contextual.* Language-dependent. In Rust, `Result<T, E>` is the idiom and it's excellent. In TypeScript, thrown errors are fine. Follow your language.

### 1.3 Comments — *Timeless*

- **Comments are a failure to express yourself in code.** Strive for self-documenting code.
- **Good comments:** Legal notices, explanation of intent, clarification when code cannot be changed, warnings, TODO markers, documentation for public APIs.
- **Bad comments:** Mumbling, redundant comments, misleading comments, mandated comments, journal comments, noise comments, commented-out code.
- **If you must comment, comment the WHY, not the WHAT.** The code shows what; comments explain why.

### 1.4 Formatting — *Timeless*

- **Vertical openness.** Separate concepts with blank lines.
- **Vertical density.** Related code should appear dense.
- **Vertical distance.** Variables declared close to their usage. Related functions near each other.
- **Horizontal alignment is unnecessary.** Modern IDEs handle this.
- **Team rules.** Consistency within a codebase trumps individual preference.

### 1.5 Error Handling — *Mostly Timeless, Some Contextual*

- **Provide context with exceptions.** Include operation attempted and failure type. *Timeless.*
- **Don't swallow errors.** Every error is information. Log it, handle it, or propagate it. *Timeless.*
- **Write try-catch-finally first.** Define scope and behavior from the start. *Timeless.*
- **Use exceptions rather than return codes.** *Contextual.* Language-dependent. Rust's `Result` is a return code and it's better than exceptions. TypeScript uses thrown errors. Follow your language.
- **Don't return null. Don't pass null.** *Contextual.* In Java, null is a landmine — `NullPointerException` at runtime, no compiler help. In TypeScript, `string | null` is a union type — the compiler forces you to handle both cases. Null in TypeScript is explicit, checked, and safe. Don't ban what the type system already handles.

---

## 2. ARCHITECTURE PRINCIPLES — *Timeless*

### 2.1 Separation of Concerns

- **Single Responsibility Principle (SRP).** A class/module should have one and only one reason to change.
- **Separate construction from use.** Main/startup logic should be isolated from runtime behavior.
- **Separate policy from mechanism.** High-level business rules should not know about low-level implementation details.
- **Dependency Injection.** Don't create dependencies; receive them.

### 2.2 Module Design

- **High cohesion.** Elements within a module should be strongly related.
- **Low coupling.** Modules should have minimal dependencies on each other.
- **Information hiding.** Expose only what's necessary.
- **Program to interfaces, not implementations.**

### 2.3 The Law of Demeter

A method `f` of class `C` should only call methods of:
- `C` itself
- Objects created by `f`
- Objects passed as arguments to `f`
- Objects held in instance variables of `C`

**No train wrecks:** `a.getB().getC().doSomething()` violates this law.

### 2.4 Avoid Circular Dependencies

- Module A should never depend on Module B if Module B depends on Module A.
- Use dependency inversion or event-driven patterns to break cycles.
- Circular dependencies indicate unclear module boundaries.

---

## 3. PRINCIPLES-BASED GUIDANCE (AI-Era Building) — *Timeless (and the newest section here)*

> "Principles-based guidance scales way better than rules-based guidance." — Nate's Second Principle

### 3.1 Write Principles, Not Rules

When guiding AI agents or future developers:
- **Principle:** "Use test-driven development"
- **Rule:** "Write a test file named `test_<module>.py` for every module"

The principle allows judgment; the rule is brittle.

### 3.2 Enable Self-Correction

- If an AI agent builds it, the agent can maintain it.
- Keep conversation context and artifacts.
- Document the *build process*, not just the result.
- Design for agent maintainability: clear structure, explicit dependencies, observable state.

### 3.3 Infrastructure vs. Tool Mindset

- **Tool:** Solves a specific problem for you.
- **Infrastructure:** Enables others (including future you, or agents) to build on top.

Ask: "Could this become infrastructure?" Design accordingly.

### 3.4 Clear Over Clever

This was always true, but AI changes *why* it's true. The old reason: humans need to read it. The new reason: the system that built this needs to reconstruct the reasoning and modify it correctly. Explicit structure and documented decisions beat tiny clever abstractions — not because humans are slow readers, but because maintainability now means *agent* maintainability too.

---

## 4. TESTING PRINCIPLES — *Principle Timeless, Ceremony Contextual*

### 4.1 The Principle Behind TDD

Ship tested code. Know that your code works before users find out it doesn't. Build confidence through automated verification.

The strict ceremony — "you may not write production code until you have a failing test" — was designed for a workflow where humans type slowly and think carefully about each function. In an AI-assisted workflow where the feedback loop is already fast (write, run, see it fail, fix in seconds), the ceremony matters less than the outcome. Write tests. Make sure they pass. Whether the test or the code came first is less important than whether both exist.

### 4.2 F.I.R.S.T. Tests — *Timeless*

- **Fast.** Tests should run quickly.
- **Independent.** Tests should not depend on each other.
- **Repeatable.** Tests should work in any environment.
- **Self-validating.** Tests should have boolean output (pass/fail).
- **Timely.** Tests should exist close in time to the code they verify.

### 4.3 One Assert Per Test (guideline, not law)

Each test should verify a single concept. Multiple asserts are acceptable if they verify aspects of the same behavior.

### 4.4 Test Boundary Conditions — *Timeless*

- Empty collections
- Null inputs
- Maximum/minimum values
- Off-by-one errors
- Concurrent access

---

## 5. CONCURRENCY PRINCIPLES — *Timeless*

### 5.1 Keep Concurrency-Related Code Separate

Concurrency design is hard enough without mixing it with business logic.

### 5.2 Limit Scope of Shared Data

Prefer immutable data. Use synchronization sparingly and deliberately.

### 5.3 Use Copies of Data

When possible, avoid sharing by giving each thread its own copy.

### 5.4 Threads Should Be Independent

Design threads to operate without sharing state where possible.

### 5.5 Know Your Execution Models

- Producer-Consumer
- Readers-Writers
- Dining Philosophers

Understand the patterns and their failure modes.

---

## 6. CODE SMELLS TO AVOID — *Timeless*

### Comments
- Inappropriate information
- Obsolete comments
- Redundant comments
- Commented-out code

### Environment
- Build requires more than one step
- Tests require more than one step

### Functions
- Too many arguments
- Output arguments
- Dead functions

### General
- Obvious behavior is unimplemented
- Incorrect behavior at boundaries
- Overridden safeties
- Duplication that drifts apart
- Code at wrong level of abstraction
- Feature envy
- Obscured intent
- Misplaced responsibility
- Magic numbers

### Names
- Names at wrong abstraction level
- Names that don't describe side effects
- Ambiguous names

---

## 7. EMERGENT DESIGN RULES (Kent Beck) — *Timeless*

In priority order:
1. **Runs all the tests.** A system that cannot be verified cannot be trusted.
2. **Contains no duplication.** (With the nuance above: no *drifting* duplication. Deliberate locality is acceptable.)
3. **Expresses the intent of the programmer.** Clear, readable code.
4. **Minimizes the number of classes and methods.** Don't over-engineer.

---

## 8. THE BOY SCOUT RULE — *Timeless in Spirit*

> "Leave the campground cleaner than you found it."

Every time you touch code, leave it better than you found it. Small improvements compound.

The nuance: this doesn't mean gold-plate every file you open. If you're fixing a bug, fix the bug. If you notice something broken nearby, fix that too. But don't refactor a file's entire structure because you happened to change one line in it. Stay focused. The Boy Scout cleaned up the campsite, not the whole forest.

---

## Usage Notes for Claude-Code

When starting any project:
1. Load this principles document first
2. Load project-specific principles (if any)
3. Load project specifications
4. Begin implementation with these principles as your foundation

**Remember:** The timeless principles are non-negotiable. The contextual ones require judgment — and judgment is the whole point.
