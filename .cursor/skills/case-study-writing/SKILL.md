---
name: case-study-writing
description: >-
  Rules for writing and editing portfolio case studies (data/casestudies/*.md).
  Use when drafting, rewriting, or reviewing case study copy, overview tables,
  constraints, metrics, or project narratives — especially employer work the
  reader may not know.
---

# Case study writing

**Status:** Draft — refine as new case studies ship.

## Before you write

- Read **other case studies already in this repo** for voice, structure, overview table format, and how metrics are presented. Match what’s working; only invent a new shape when the project genuinely needs it (iteration arc, named framework + chapters, sidequest thread, etc.).
- Before publishing, do a **final prose pass** on the full draft: cut filler transitions, significance inflation, and changelog rhythm; keep the author’s contractions, fragments, and specific names. If a writing-quality skill or similar tool is available in the session, use it on finished copy — don’t rely on this file alone for tone.

## Audience

- Assume the reader knows **nothing** about the employer, product, or domain jargon.
- Explain the product **once**, plainly, in the first screenful — one sentence plus a concrete analogy if it helps and stays accurate.
- **Define project codenames on first use** (internal name → what it actually is for users).
- Spell out or replace acronyms on first use; prefer plain language over internal shorthand.
- Translate internal feature names to what the user sees or feels, unless a brief explanation earns its place.
- Abstract mechanisms to **universal product/UX language** (guided path, locked features, earned rewards) when that keeps the story portable.

## Voice

- Direct, editorial, first person where you owned the work.
- Short paragraphs; mix sentence lengths; fragments OK when they land.
- **Not** marketing fluff, **not** internal wiki tone, **not** changelog prose.
- Personality in section titles is fine when the section earns it — not decorative.

## File structure (repo conventions)

Each case study is a markdown file under `data/casestudies/`. Assets live in `data/casestudies/images/{slug}/`.

Typical top-of-file pattern:

1. Header image — `[![…](./data/casestudies/images/{slug}/header.png "bleed-xl")](…)`
2. `## Overview` — one-paragraph lead, then overview table
3. `### About the project` (or `### The project`) — context for strangers
4. Body — structure varies (see **Narrative shapes** below)
5. `## Impact` — headline outcomes; image optional
6. `## Learnings` (or takeaways) — optional; 2–4 bullets
7. Talk / external link — optional footer

Use `---` between major movements.

## Media

Assets for a case study live under `data/casestudies/images/{slug}/`. Markdown paths are rewritten on publish; prefer `./data/casestudies/images/{slug}/…`. Legacy `./images/casestudies/…` still resolves.

### Still images (markdown)

Standard linked image:

```markdown
[![Descriptive alt text](./data/casestudies/images/{slug}/screen.png "wide")](./data/casestudies/images/{slug}/screen.png)
```

- **Alt text** = visible **caption** and lightbox description. Write it as a short label (the site moves it into `<figcaption>`). Don’t leave “alt text”.
- **Link target** = same file as `src` (click opens lightbox, not navigation).
- **Image `title`** = layout directive, **not** a hover tooltip. The site strips it after applying layout.

**Captions:** Markdown images get a `<figcaption>` from their alt text at render time. For HTML figures (video, side-by-side rows), add `<figcaption>` yourself. Style: centred, slightly smaller body text below the media.

**Layout tokens** (put in the image `title`, space- or comma-separated). The site reads these at render time and wraps the image in `<figure class="cs-media cs-media--…">`:

| Token | Use for |
|-------|--------|
| `wide` | Default in-flow hero for screens, diagrams, prototype grids. Full content column width. |
| `narrow` | Centred, max ~520px. Single UI detail, icon, small mock. |
| `bleed` | Breaks out of the text column (~980px max). Impact strips, wide comps. |
| `bleed-xl` | Wider bleed (~1100px max). Page header, full feedback collages. |
| `left` | Float left beside copy (desktop only; stacks on mobile). |
| `right` | Float right beside copy (desktop only; stacks on mobile). |

Tokens can combine (e.g. `"bleed-xl"` or `"wide, left"`). Unrecognised title text is left alone (still usable as a real tooltip, but prefer only known tokens).

**Default** (no title token): image sits in the column at `max-width: 100%` with rounded corners. No bleed.

**Lightbox:** every case study image opens enlarged on click (unless `data-no-lightbox` is set). Plan crops knowing users can zoom.

**Typical picks:** header + big proof screenshots → `bleed-xl`; most body screenshots → `wide`; impact / testimonial montage → `bleed-xl`; inline detail → `narrow` or float `left` / `right`.

### Video (HTML)

Markdown images don’t cover video. Use a raw `<figure>` when motion is the proof (gameplay loop, interaction):

```html
<figure class="cs-media cs-media--bleed">
  <video autoplay loop muted playsinline preload="metadata" src="./data/casestudies/images/{slug}/clip.mp4"></video>
  <figcaption>Short label for what the clip shows.</figcaption>
</figure>
```

Add `cs-media--wide`, `cs-media--bleed`, or `cs-media--bleed-xl` on the figure to match still-image widths. Videos are full width inside the figure, rounded corners, no lightbox.

Supported formats: whatever the browser plays (`.mp4` in existing case studies).

### Compare slider (HTML)

Use when two **same-aspect** stills are best compared in place (before/after redesign), not side-by-side. Prefer `cs-media-row` when both screens need to be read fully at once without interaction.

```html
<figure class="cs-media cs-media--compare cs-media--bleed-xl">
  <div class="cs-compare">
    <img class="cs-compare__img cs-compare__img--before"
         src="./data/casestudies/images/{slug}/before.png"
         alt="Before: short label"
         data-no-lightbox>
    <img class="cs-compare__img cs-compare__img--after"
         src="./data/casestudies/images/{slug}/after.png"
         alt="After: short label"
         data-no-lightbox>
  </div>
  <figcaption>Drag to compare …</figcaption>
</figure>
```

- Put **`data-no-lightbox`** on both inner images — the slider is the interaction; lightbox would conflict with drag.
- Alt text on each image becomes the corner **Before** / **After** context; add a single `<figcaption>` for the combined caption.
- Match width tokens to neighbours (`wide`, `bleed`, `bleed-xl`).
- On first scroll into view, the slider plays a one-time sweep (0% → 85% → 15% → 50%) so readers discover both images; skipped when `prefers-reduced-motion: reduce` (starts at 50%).

### Formats

- **PNG / JPG / WebP** for stills. PNG for UI and prototypes; JPG for photos if file size matters.
- Keep filenames lowercase; no spaces.


- Lead with **what you did** and **how long it took** — honestly.
- If the project had **parallel workstreams**, say so; don’t imply equal duration (e.g. six months on the main bet vs a two-week sidequest).
- Frame the problem in terms anyone can feel: overwhelm, no obvious first step, broken conversion moment, stalled initiative, etc.

## Overview table

HTML table with class `cs-overview-table` inside `<div class="cs-overview">`. Four rows:

| Row | Purpose |
|-----|--------|
| **Role** | Your scope end-to-end: research, design, prototyping, testing, stakeholders, ship, post-launch monitoring. Squad or “ran the team” only if true. |
| **Constraints** | **What actually limited the work** — ship cadence, platform, safety, team size, process (“small experiments until signal, then double down”). Not design principles or persona platitudes dressed up as constraints. Physical realities (different bodies, room size, headset safety) count when they bound the design. |
| **Output** | Deliverables in **outcome terms** (guided first-week journey, three shipped moves with shared visual language), not version numbers alone. |
| **Impact** | Headline metrics in plain language, and/or qualitative proof (sentiment, adoption rule like “no class ships without these moves”). Match what the body can support. |

Principles (“earn trust before the paywall”, “discard fast”) belong in **narrative**, not the Constraints row.

## Narrative shapes

Pick the shape that matches the project. Both can coexist (main arc + sidequest section).

### A. Iteration arc

For work that shipped in **versions or phases** (V1, V2, pilot → rollout).

Each version section:

1. **What changed** — tenets, mechanisms, what you tested (accurate; don’t simplify into a cleaner story that didn’t happen).
2. **Research** — user testing, pre-build discovery, or live feedback when it drove the next version.
3. **Honest gaps** — what didn’t move yet, noisy samples, bugs mid-test — when relevant.
4. **Metrics** — see **Metrics** below; end the section with what **that version** moved.

Date or phase in the heading helps: `### V2: doubling down *(June–August 2025)*`.

### B. Framework + chapters

For work organised around a **repeatable process** or several **parallel deliverables**.

1. Name the framework once (bold the name, not every bullet).
2. Briefly state how feedback ran (stakeholders, playtests, cadence).
3. One subsection per major deliverable with:
   - Prototype count or effort hint when it adds credibility.
   - **Problem → tries → discard or pivot → what worked** as narrative, not a feature list.
   - Prior art or research borrow when it explains a decision.
   - Media (video, prototype grid) where seeing it matters.

### C. Sidequest / parallel thread

When you were pulled onto something mid-flight:

- Say **when** and **how long** up front.
- Arc: what was broken → what you looked at → what you changed → payoff metric or “hard to move for years” context.
- Don’t use formulaic subheads (`What we did` / `The payoff`); keep it as continuous story.

## Metrics

When you have experiment or analytics lifts:

- **One headline +X% (or single number) per stat** — bold the metric line.
- One short sentence tying it to **user meaning** (more people subscribed, more came back day 2, more finished the plan).
- **No** before/after stacks or multiple percentage points on the same line.
- Note **historical context** when it matters (“strongest result this team had seen”, “paywall had been hard to move for years”).

When you don’t have clean percentages:

- Qualitative impact is fine in Overview and Impact (sentiment quotes, adoption rules, shipping into flagship surfaces).
- Still be specific — a real quote beats “overwhelmingly positive”.

Overview table Impact row and body sections should **not contradict** each other. If they use different aggregations, make that explicit or align them before publish.

## Learnings

Optional closing section. Common patterns:

- 2–4 bullets; **bold lead-in phrase** optional when the body expands the headline.
- Each bullet = one transferable lesson **grounded in this project**, not generic UX wisdom.
- Prefer evidence the reader already saw in the body over abstract morals.

Avoid: “three key takeaways” throat-clearing unless you like the rhythm; numbered-list inflation; repeating the Impact section verbatim.

## Accuracy

- Don’t claim “no onboarding” if something existed — name the **gap** (after subscribe, in the catalogue, at the paywall).
- Don’t collapse versions into a false arc; each version should match what actually shipped and was measured.
- Distinguish **user testing** from **live reviews / production feedback** when both appear (they can disagree — that’s a story).
- Timelines, prototype counts, and metric definitions should match source docs when those exist.

## Checklist before finishing

- [ ] Product and problem explained for a stranger in the first screenful
- [ ] Codenames and jargon defined or replaced once
- [ ] Constraints row = real limits, not principles
- [ ] Timeline reflects actual effort split (including sidequests)
- [ ] Body structure matches the project (iteration vs framework vs both)
- [ ] Metrics: one bold headline per stat; user meaning attached; no contradictions with overview
- [ ] Narrative sections read as story, not changelog
- [ ] Images/videos use correct paths, alt text, and layout tokens (see **Media**)
- [ ] Final prose pass on the full file (see **Before you write**)

## Open (to refine)

- Internal docs as source of truth — when to cite vs abstract
- Whether overview table `<td>` should use HTML (`<em>`, `<strong>`) vs plain text
- Standard metric naming across case studies when the same funnel appears twice
- When compact `+` / `-` punctuation vs standard prose is preferred
- Caption and alt-text conventions for prototype grids and feedback screenshots
- Whether unused layout tokens (`narrow`, `left`, `right`) should appear in more case studies
