# Agent instructions

## Persistent preferences and skills

When the user asks for something that could reasonably be treated as **long-lived guidance** — for example: a standing preference, a workflow they want repeated, domain rules, tooling conventions, or anything that sounds like it should become a **Cursor skill** or **remembered rule** — do **not** silently add it to this file or create a new skill.

Instead:

1. **Recognize** that the request may warrant updating `AGENTS.md` (capture the key fact here) or **creating a new skill** (for richer, step-by-step procedures the agent should load when relevant).
2. **Ask the user first** whether they want you to persist it, and if so, whether they prefer a short entry in `AGENTS.md` or a dedicated skill (and where, if they use a specific skills location).
3. **Only after they confirm**, add the distilled key information to `AGENTS.md` and/or create the skill as agreed.

If the user explicitly says to remember something or to add a rule, still confirm the exact wording and placement when it is ambiguous.

## User preferences

- **Do not assume OS, browser, or device** unless the user has stated them explicitly. Avoid iOS/Android/desktop or Chrome/Safari-specific explanations or fixes as “the” case unless they apply to what the user said they use.
- **Vague requests** — ask a short clarifying question (goal, constraints, “what does good look like?”) before committing to a solution; don’t guess the whole problem from one underspecified sentence.
- **Ambiguous feedback** — when the user reacts to work in loose terms (“kinda broken”, “feels off”, “not right”) without specifics, ask a few targeted questions (what they expected vs saw, scope, repro) before changing code or locking onto one root cause; don’t assume a single interpretation.
- **Questions** — when the user asks a question (not a direct “do X” task), talk it through with them first: trade-offs, options, and what you’d need to know before recommending or building something—rather than jumping straight to a single answer or implementation.
