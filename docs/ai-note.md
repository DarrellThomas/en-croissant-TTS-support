# A Note from Darrell

*This note is also available in:
[Francais](ai-note-fr.md) |
[Espanol](ai-note-es.md) |
[Deutsch](ai-note-de.md) |
[日本語](ai-note-ja.md) |
[Русский](ai-note-ru.md) |
[中文](ai-note-zh.md) |
[한국어](ai-note-ko.md)*

En Parlant~ is a fork of [En Croissant](https://github.com/franciscoBSalgueiro/en-croissant), the open-source chess study tool by Francisco Salgueiro. This fork adds text-to-speech narration — five providers, eight languages, translated chess vocabulary — so you can hear annotations spoken aloud while your eyes stay on the board. The name means "while speaking" in French. Because this croissant talks back.

This note is about how it was built, and what I think that means.

## Deep Blue, and Everything After

May 11, 1997. Deep Blue beats Kasparov. Game six. The coverage read like an obituary for the human brain. End of an era, all that. Kasparov stormed off, convinced IBM cheated.

But Kasparov didn't quit chess. That part always gets left out. He kept playing. Got better. Studied what the machine did and absorbed it. Then he came up with something nobody expected: Advanced Chess. Humans and computers playing together, as a team. Turns out a strong human paired with a machine could beat the machine alone. The human brought the intuition. The machine brought the grunt work. Together they were something new.

He called it the centaur model. Nearly thirty years later I'm sitting in a pine cabin in East Texas building a chess app with an AI that never gets tired of reading Rust error messages, and I think Kasparov nailed it.

## Built with Claude Code

This fork of En Croissant was built with [Claude Code](https://www.anthropic.com/claude-code), Anthropic's AI coding assistant. Every Rust command, every React component, every bash script in the TTS system. Pair-programmed, human and AI. I'm not going to pretend otherwise.

This is not AI slop. This is co-development. And there's a real difference.

AI slop is typing "make me a chess app" and shipping whatever comes back. Co-development is a human with decades of engineering experience and strong opinions about architecture sitting down with an AI and arguing about error handling. The human says "no, that's wrong, here's why." The AI says "fair, but what about this edge case." The human brings the vision. The AI brings the velocity. Neither builds this thing alone.

## Standing on Francisco's Shoulders

Francisco Salgueiro built En Croissant over years of thoughtful architecture. Late nights debugging Tauri quirks. Careful UI work with Mantine. A PGN parser that actually works. Engine integration, database management, puzzle support. All of it. He built something he cared about and it shows.

I submitted a pull request to add text-to-speech narration. Francisco reviewed it and decided it wasn't the direction he wanted for En Croissant. That's a maintainer's call to make, and I respect it — he knows his project better than anyone. That's how open source works. The GPL lets me fork and build in a different direction, and I'm grateful for that freedom. But I owe him the honesty of saying it straight: without En Croissant, En Parlant~ doesn't exist. Period.

Here's what sits with me, though. Francisco spent years building something with care — making hard decisions, learning the framework, shaping the architecture through hundreds of commits. The TTS feature I added builds on top of all that work. It wouldn't exist without the foundation he laid. An AI helped me move fast, but moving fast on top of someone else's years of effort is not the same thing as doing what they did.

And I don't know what to do with that, honestly. What does craftsmanship mean when someone can extend it at 10x speed? What does it mean to stand on someone's shoulders when the ladder got this tall this fast? I don't have neat answers for any of it. But I'd rather sit with the discomfort than pretend it's not there.

## The State of Things

The chess community gets a better product because tools like Claude Code exist. The gap between "I wish this app could narrate moves" and "it narrates moves in eight languages with five TTS providers" went from months to days. The gap between "dependencies silently fail" and "a setup wizard walks you through it" went from a weekend to an afternoon.

This is happening everywhere. Every domain. Every craft. Software that took teams now takes one person. Features that took sprints now take sessions.

Some of that is great. A solo dev with a good idea can compete with a funded team now. Open-source projects iterate faster than ever. Tools get better, users benefit.

Some of it is genuinely unsettling. When the cost of building drops toward zero, what happens to the people who made a living in that cost? When everyone can ship this fast, what separates good software from bad? I think the answer is taste, judgment, and giving a damn. Those are still human. But I'm not going to sit here and tell you the transition is painless.

## Why Chess

Chess is a refuge for me. I'm not a Grand Master, and I find myself always learning over the decades. It is the one place where I have to think for myself. No autocomplete. No suggestions. Just 64 squares and 32 pieces and whatever my brain can do with them.

The board doesn't care about my tooling. Doesn't care about my GPU or my inference speed. It just asks: can you see what's happening here? That's it. Pattern recognition and calculation under pressure. No shortcuts.

Chess is where I go to remember what it feels like to use my own mind.

Use the machines where they make you stronger. Let them handle the parts that don't require your soul. But keep something where the thinking is entirely yours. One practice. One discipline. One set of 64 squares where you can't delegate, can't prompt your way to the answer.

## A Note on Honesty

I've seen repos with thousands of lines of AI-generated code and zero acknowledgment. People passing off Claude's output as their own in interviews, in client work, in open-source contributions. I get it. There's a stigma. People hear "AI-assisted" and think lesser.

Here's the thing though. I'm an airline captain. Thirty-nine years flying. My cockpit is stuffed with automation. Autopilot, auto-throttle, fly-by-wire, GPS, synthetic vision. Nobody has ever asked me if I'm "really" flying the airplane. The tools don't diminish the skill. They change what the skill is. Judgment, situational awareness, decision-making when nothing is clear. That part is still mine. The tools just let me operate at a level I couldn't reach barehanded.

Software is going through the same shift aviation went through decades ago. The hand-flying purists will always exist, and I am one of them! If you're on one of my planes, every now and then you'll catch me hand-flying the whole thing. Takeoff to touchdown. Because I can. Because that skill matters. But I also know when to let the automation work. Knowing the difference? That's the real skill.

This project was built by a human and an AI working together. I'm proud of both halves of that.

## Show Your Work

Most "built with AI" stops at the label. We went further. The repo includes the actual [Claude Code workflow document](claude-workflow.md) — what the AI knows, what it's told, how sessions work, where the human draws the line. The coding principles that guide every session are in the repo too, including an honest conversation about which classic rules still hold up in the AI era and which ones don't.

If you're curious what AI-assisted development actually looks like — not the marketing version, the real cockpit — it's all there. Open source means open process.

## Be Safe Out There

If you're building with AI, be honest about it. If you're standing on someone else's work, say so. If the pace of change makes you uneasy, good. The people who aren't uneasy aren't paying attention.

We grow. We adapt. A machine beat the world chess champion in 1997 and instead of the game dying, it got bigger than ever. More players, more study, more depth. We're at that same inflection point right now. Every field. All at once.

The question isn't whether AI changes everything. It already did. The question is whether we're honest about it. Whether we build with craft. Whether we know what to hold onto.

Build good things. Give credit. And find your own 64 squares.

We are all Kasparov now. Staring at the board. Wondering what comes next.

Be safe out there.

-- Darrell

---

*En Parlant~ is a fork of [En Croissant](https://github.com/franciscoBSalgueiro/en-croissant) by Francisco Salgueiro, built with [Claude Code](https://www.anthropic.com/claude-code) by Anthropic. The name means "while speaking" in French. Because this croissant talks back.*
