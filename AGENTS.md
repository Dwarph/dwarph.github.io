# Agent instructions

## Persistent preferences and skills

When the user asks for something that could reasonably be treated as **long-lived guidance** — for example: a standing preference, a workflow they want repeated, domain rules, tooling conventions, or anything that sounds like it should become a **Cursor skill** or **remembered rule** — do **not** silently add it to this file or create a new skill.

Instead:

1. **Recognize** that the request may warrant updating `AGENTS.md` (capture the key fact here) or **creating a new skill** (for richer, step-by-step procedures the agent should load when relevant).
2. **Ask the user first** whether they want you to persist it, and if so, whether they prefer a short entry in `AGENTS.md` or a dedicated skill (and where, if they use a specific skills location).
3. **Only after they confirm**, add the distilled key information to `AGENTS.md` and/or create the skill as agreed.

If the user explicitly says to remember something or to add a rule, still confirm the exact wording and placement when it is ambiguous.

## MCP servers

If a task **depends on** an MCP server (tools, auth, or resources) and that server is **unavailable**, **fails to respond**, **returns an error indicating it is not connected**, or **cannot be used** (for example: missing tool descriptors, auth required but not completed, timeout, or “server not found”):

1. **Stop** — do not continue the task by guessing, substituting another tool without saying so, or working around the missing integration silently.
2. **Tell the user clearly** what failed (which server or capability, and the symptom).
3. **Prompt them to fix it** — e.g. enable the MCP server in Cursor, complete authentication, check network, or adjust configuration — and wait for them to confirm it is working before resuming work that needs that server.

If the task can be completed **without** that MCP (and you are sure of that), say so and proceed only on that reduced scope; otherwise treat unavailability as a blocker.

## DESIGN.md

When work touches **UI, layout, typography, color, motion, or product copy** in this repo, **look for `DESIGN.md`** in the project root and in **ancestor directories** of the files you are changing (same idea as nested `AGENTS.md`). **Read and use** the nearest relevant `DESIGN.md` for tokens, patterns, tone, and constraints before inventing new visual or UX conventions. If multiple apply, prefer the **more specific** (deeper) file and reconcile with parents when they conflict.

## User preferences

- **Do not assume OS, browser, or device** unless the user has stated them explicitly. Avoid iOS/Android/desktop or Chrome/Safari-specific explanations or fixes as “the” case unless they apply to what the user said they use.
- **Vague requests** — ask a short clarifying question (goal, constraints, “what does good look like?”) before committing to a solution; don’t guess the whole problem from one underspecified sentence.
- **Ambiguous feedback** — when the user reacts to work in loose terms (“kinda broken”, “feels off”, “not right”) without specifics, ask a few targeted questions (what they expected vs saw, scope, repro) before changing code or locking onto one root cause; don’t assume a single interpretation.
- **Questions** — when the user asks a question (not a direct “do X” task), talk it through with them first: trade-offs, options, and what you’d need to know before recommending or building something—rather than jumping straight to a single answer or implementation.

## Code organization

- Avoid **monolithic “grab-bag” files** that accrue unrelated responsibilities (e.g. one huge CSS/JS file spanning multiple pages/features). Prefer splitting by **ownership** (per-page/per-feature modules) with a small shared `core` for genuinely shared tokens/utilities.
- If you need a compatibility layer, keep it as a **thin entrypoint** (e.g. a legacy file that only imports/includes the new modules) rather than continuing to add new rules to the monolith.
