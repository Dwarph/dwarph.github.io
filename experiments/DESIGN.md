# Design System — Experiments Sub-site

## 1. Visual Theme & Atmosphere

The experiments area is a **minimal, monochrome lab surface**: pure white (`#ffffff`) with **black typography** and **underlined links** so the focus stays on prototypes, not chrome. The tone is **clinical but friendly** — enough structure (Outfit for titles, subtle cards, soft shadows) to feel designed, without a separate “brand rainbow.” Accent color is effectively **absent**; hierarchy comes from **weight, size, and ink density** (`#000` → `#111` → `#444` → `#666`).

Typography pairs **Outfit** (geometric, confident headings) with **Nunito Sans** (readable UI and body). The **Circle slider** experiment layers a **Paper-style mobile shell** (max width ~390px for the picker) over a **full-width demo stage** where the control can breathe. Motion is **purposeful**: radial track and press halo use **blur + opacity** choreography; **`prefers-reduced-motion`** strips blur and collapses transition durations.

**Key Characteristics:**
- White canvas (`#fff`) with black-first text (`#000` / `#111`) and gray secondary (`#444`, `#666`)
- **Outfit** (700) for display lines (page H1, picker titles, mode row labels, value numeral, badge); **Nunito Sans** for body, hero question, tweak sheet (including section legends)
- **No decorative palette** — `accent-color` on range inputs is near-black (`#111`)
- **Black 2px outlines** for focus-visible and active picker rows (`outline-offset: 2px` or `3px` on the value card)
- **Soft elevation** on picker rows (`0 2px 10px rgba(0,0,0,0.04)`) and tweak panel (`0 -4px 24px rgba(0,0,0,0.08)`)
- **Encoder metaphor** in SVG: grey track (`#c8c8c8`, overridable via `--cs-track-stroke`) and dark thumb (`#1a1a1a`)
- **Safe-area aware** bottom padding on pages and the tweak panel toggle
- **`scrollbar-gutter: stable`** on circle-slider pages to reduce layout shift with scrollbars

## 2. Color Palette & Roles

### Primary Ink
- **True Black** (`#000`): Default page text, links (including `:visited`), primary outlines, skip-link focus text on black bar is inverted — skip link uses `#fff` on `#000` when focused
- **Near Black** (`#111`): Tweak panel body text, range `accent-color`
- **Soft Black** (`#1a1a1a`): Radial thumb stroke (`currentColor` on `.cs-thumb-path`)

### Secondary & Muted
- **Dark Gray** (`#222`): Tweak panel toggle label (uppercase bar)
- **Body Gray** (`#444`): Intro copy, tweak hints
- **Mid Gray** (`#666`): Badge text, legend labels, descriptions, `em` inside tweak labels
- **Border Gray** (`#ccc`, `#ddd`, `#e8e8e8`, `#eee`): Dividers, inputs, cards — lighter as elevation separates sections

### Surfaces
- **White** (`#ffffff`): Page, picker shell, cards, tweak panel sheet
- **Off-white** (`#fafafa`): Badge fill, tweak toggle bar background
- **Hover wash** (`#f0f0f0`, `#f5f5f5`): Toggle hover, button hover

### Semantic / Danger (minimal use)
- **Danger text** (`#a22`) with border (`#c44`): “Reset all settings” — only destructive affordance in the system

### Control-specific (CSS variables)
- **`--cs-track-stroke`**: Default `#c8c8c8` — grey arc; drives halo border via `color-mix` when supported
- **`--cs-halo-blur-rest`**, **`--cs-blur-rest`**: Default `14px` — rest-state blur for radial / halo
- **`--cs-halo-appear-ms`**, **`--cs-radial-appear-ms`**: Default `300ms` — show transitions
- **`--cs-halo-hide-ms`**, **`--cs-radial-hide-ms`**: Default `240ms` — hide transitions
- **`--cs-halo-hide-opacity-delay`**: Default `72ms` — halo opacity lags blur on hide (except arc handoff)

## 3. Typography Rules

### Font roles
- **Outfit** (`--exp-font-display`): short display strings and the **value numeral** — always **700** in experiments CSS.
- **Nunito Sans** (`--exp-font-body`): everything else, including the **“How many?”** hero line, body copy, and the **tweak panel** (legends use Nunito so dense settings stay one voice).

Google Fonts on experiment pages still loads Outfit **400/700** and Nunito **400/700** (+ italic 400); the experiments stylesheets only **require 700** for Outfit in practice.

### Size tokens (CSS)

Defined on **`.circle-slider-page`** (and mirrored on **`.experiments-page`** for `--exp-size-title` + font vars on the index):

| Token | Value | Used for |
|-------|-------|----------|
| `--exp-size-title` | `1.25rem` | Page `h1`, picker brand, picker section title (“Pick a control”) |
| `--exp-size-label` | `1rem` | Picker mode row title (Standard / Range) |
| `--exp-size-hero` | `2rem` | Prompt above the value card |
| `--exp-size-value` | `34.027px` | Digits inside the value card (Figma export) |
| `--exp-size-sm` | `0.8125rem` (~13px) | Intro blurb, row descriptions, entire tweak sheet body size |
| `--exp-size-meta` | `0.6875rem` (~11px) | Badge, fieldset legends, tweak help, release debug block |

**Index page** (`experiments/index.html`): **1rem** body, **`--exp-size-title`** for the lone **h1** only.

### Principles
- **Few sizes** — secondary copy shares **`--exp-size-sm`** (picker intro and row descriptions); no separate 12px / 14px ladder.
- **Few weights** — tweak field labels are **400**; **700** marks headings, toggle, buttons, legends, and the prompt.
- **Fixed hero sizes** — no fluid `clamp` on page **h1** or **“How many?”** so layout stays predictable on narrow viewports.
- **Tabular numerals** on the value card and tweak **`<output>`** values.
- **Uppercase + tracking** on badge, tweak bar, and fieldset legends only.
- Emphasis in tweak labels: **`em`** with **normal** style and **`#666`**, not italics.

## 4. Component Stylings

### Links
- Color `#000`, **always underlined**; visited matches default (no purple story — stays on-brand for the lab).

### Skip link
- Off-screen until focus; focused: **black bar**, white text, **700** weight, `z-index: 10`.

### Picker shell (Circle slider)
- **Max-width 390px**, centered, **padding 24px 20px 0**, white background (inherits page).
- **Badge**: `#fafafa` fill, `#e8e8e8` border, **6px** radius, uppercase micro label.

### Picker rows (mode buttons)
- **Padding** `16px 14px`, **10px** radius, **1px** `#eee` border, **white** fill.
- **Shadow**: `0 2px 10px rgba(0,0,0,0.04)`.
- **Active / focus-visible**: `outline: 2px solid #000`, `outline-offset: 2px`.
- **Icon column**: 48×48; chevron stroke `#000` at 2px.

### Value card (radial mode)
- **Figma-derived geometry**: width **101px**, padding **10.802px**, radius **7.021px**, white fill.
- **Shadow**: `0 5.401px 19.444px rgba(0,0,0,0.16)` plus zero-spread ring `0 0 0 0 rgba(0,0,0,0.06)` (placeholder stack).
- **Cursor**: `grab` / `grabbing` when active; **`touch-action: none`** on card stack.

### Radial SVG layer
- **Size**: `min(85vw, 280px)` square; **translated** `-50% / -38%` to align with card (design-specific offset).
- **Track**: gradient-faded grey stroke; **thumb**: `#1a1a1a`, round caps.

### Range mode
- Same **stage** and **value** typography as standard mode; native range styling uses **`accent-color: #111`** where applicable.

### Tweak panel (fixed bottom)
- **Root** sets **`font-size: var(--exp-size-sm)`**; children inherit — no mixed 14px / 13px / 0.875rem ladder.
- **Toggle**: full width, `#fafafa` background, **top border** `#e8e8e8`, **`font: inherit`** then **`font-weight: 700`**, **uppercase**, chevron via `▲` with **0.2s** rotate when collapsed.
- **Body**: **max-height** `min(52vh, 28rem)`, scrollable, white, top border `#eee`.
- **Fieldsets**: separated by **top border** `#eee`; first fieldset has no top border.
- **Legends**: **Nunito** **`--exp-size-meta`**, **700**, uppercase, **`#666`**.
- **Range inputs**: `accent-color: #111`; on small screens grid stacks to **one column** (`max-width: 36rem` breakpoint).
- **Buttons**: inherit panel font size, **700** weight; white / `#ccc` border / **6px** radius; danger variant **red** border and text as above.
- **Debug `<pre>`**: monospace stack, **`--exp-size-meta`**, `#f4f4f4` background, `#ddd` border, **6px** radius.

### Experiments index list
- **Max-width** `40rem` wrapper; list **padding-left** `1.25rem`; item spacing **0.35rem**; “Back” block **margin-top** `2rem`.

## 5. Layout Principles

### Spacing (observed scale)
- **4px, 6px, 8px, 10px, 12px, 14px, 16px, 20px, 24px** and **rem** equivalents (`0.5rem`, `0.75rem`, `1rem`, `1.5rem`, `2rem`, `4rem` gap above value card for prompt)
- Page **padding** `1.5rem`; circle-slider adds **bottom** `max(5rem, calc(4.5rem + env(safe-area-inset-bottom)))` so content clears the tweak bar

### Width & containment
- **Picker**: cap at **390px** — reads as a **phone frame** without simulating a device chrome.
- **Main column**: flex **column**, **align center**; children often **width: 100%** with **max-width: 100%** to avoid overflow.
- **Stage vertical centering**: **`.cs-stage__fill`** flex siblings **above and below** the control consume remaining height so the encoder sits **optically centered** in the viewport.

### Whitespace philosophy
- **Prototype-first**: generous **viewport min-heights** on mode panels (**`min(72vh, 640px)`** for both standard and range) so the demo feels like an **app screen**, not a documentation block.
- **Index stays compact** — single column, small H1, short list; frictionless return to the main site.

### Border radius scale
- **~7px** — value card (precise from design export)
- **6px** — badge, tweak inputs/buttons, debug panel
- **10px** — picker rows
- **4px** — number input in tweaks
- **50%** — circular halo ring (pseudo-element on `.cs-press-halo`)

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (0) | No shadow | Page background, plain sections |
| Picker row (1) | `0 2px 10px rgba(0,0,0,0.04)` + `#eee` border | Selectable mode tiles |
| Value card (2) | `0 5.401px 19.444px rgba(0,0,0,0.16)` (+ optional ring) | Draggable surface |
| Sheet / chrome (3) | `0 -4px 24px rgba(0,0,0,0.08)` | Fixed tweak drawer lifting over content |

**Shadow philosophy:** Shadows are **tight and neutral** — just enough to separate **interactive sheets** from the page. There is **no colored glow**; depth reads as **paper lift**, not neon elevation.

## 7. Do's and Don'ts

### Do
- Keep **foreground text** on white at **`#000`–`#222`** for normal reading; use **`#666`** only for secondary labels.
- Use **Outfit 700** only for **short titles and big numerals**; use **Nunito** for paragraphs, the **hero question**, and **form chrome** (including uppercase legends).
- Preserve **underline + black** link pattern on experiment pages unless a control explicitly needs a button.
- Reuse **`outline: 2px solid #000`** with small **offset** for keyboard focus on custom components.
- Respect **`prefers-reduced-motion`** when adding animation (match existing blur-off + instant-ish transitions pattern).
- Honor **safe-area** on bottom-fixed UI (`env(safe-area-inset-bottom)`).

### Don't
- Don’t introduce **saturated brand accents** without updating this document — the sub-site reads as **monochrome**.
- Don’t use **pure decoration** that competes with the **demo control** (the encoder is the hero).
- Don’t **`position: fixed`** the whole page for scroll lock — use the **html/body overflow** pattern already used to avoid **horizontal jump** when scrollbars disappear.
- Don’t shrink the **“How many?”** prompt with **vw-based** type on small screens — fixed size keeps **layout stable**.
- Don’t remove **tabular numerals** on **live counts** — prevents jitter when values change.

## 8. Responsive Behavior

### Breakpoints & rules (from CSS)
| Context | Rule | Effect |
|---------|------|--------|
| Tweak panel | `max-width: 36rem` (~576px) | Tweak rows become **single column**; range **full width**; outputs **left-aligned** |
| Radial / range controls | `min(85vw, 280px)` | Control **tracks viewport** on phones, caps at **280px** |
| Row gap (encoder) | `clamp(1rem, 4vw, 3.9375rem)` | **Breathing room** between future side slots and card |
| Pointer coarse | `@media (pointer: coarse)` | **Disables filter blur** on press halo for compositing reliability; **opacity-only** transitions |

### Touch targets & gestures
- Picker rows are **full-width buttons** with **16px** vertical padding — comfortable tap rows.
- Value card is **small (101px)** — acceptable because **gesture hits the ring stack**; ensure **touch-action: none** on the stack during drag.
- **Scroll locking** on drag: `html` + `.circle-slider-page` get **`cs-scroll-lock`** (overflow hidden, `touch-action: none`, `overscroll-behavior: none`).

### Collapsing strategy
- **Tweak panel** expands **upward** from bottom; content scrolls **inside** capped height.
- **Mode panels** swap with **`hidden`** + **`display: none !important`** guard so only one paints.

### Reduced motion
- **`prefers-reduced-motion: reduce`**: radial + halo **no blur**, transitions **~0.01ms**, active card **scale(1)**.

## 9. Agent Prompt Guide

### Quick color reference
- Background: `#ffffff`
- Primary text / links: `#000000`
- Secondary body: `#444444`
- Muted / meta: `#666666`
- Borders: `#eeeeee` (light), `#e8e8e8` (bars), `#cccccc` (inputs)
- Thumb / strong focus: `#1a1a1a` / `#111111`
- Danger: text `#aa2222`, border `#cc4444`

### Example component prompts
- “Add an experiment index row: **Nunito** **1rem** black text, link **underlined** `#000`, list indent **1.25rem**; page **h1** uses **`--exp-size-title`** + **Outfit 700**.”
- “Create a **picker row** button: white background, **10px** radius, **1px** `#eee` border, shadow `0 2px 10px rgba(0,0,0,0.04)`, **16px 14px** padding; **Outfit** **`--exp-size-label`** **700** title + **Nunito** **`--exp-size-sm`** description `#666`; active state **2px black outline**, **2px** offset.”
- “Build the **value card**: **101px** wide, **10.802px** padding, **7.021px** radius, **Outfit** **700** **`--exp-size-value`** tabular number, shadow `0 5.401px 19.444px rgba(0,0,0,0.16)`.”
- “Style a **bottom sheet**: panel **`font-size: var(--exp-size-sm)`**; toggle **`font: inherit`**, **`font-weight: 700`**, **uppercase**, **#222**, `#fafafa` bg, top border `#e8e8e8`; sheet shadow `0 -4px 24px rgba(0,0,0,0.08)`.”
- “Add a **range** input: `accent-color: #111`, track width `min(85vw, 280px)`.”

### Iteration guide
1. Start from **white + black type** — add gray only for **hierarchy**, not decoration.
2. **Outfit** for **compact display** (titles, mode names, value digit); **Nunito** for **everything else**, including tweak legends.
3. Stick to the **six tokens** in §3 — if you need another size, extend the token table and the root variables, do not sprinkle raw `px`/`rem`.
4. Use **subtle 4% shadows** for tiles; **stronger shadow** only on the **floating card** or **drawer**.
5. Match **focus** to **2px black outline** patterns used on picker rows and value card.
6. When animating appearance, prefer **opacity + blur** with **`cubic-bezier(0.16, 1, 0.3, 1)`** for show and **`cubic-bezier(0.4, 0, 0.2, 1)`** for hide — then **test `prefers-reduced-motion`**.
7. Cap **prototype chrome** near **390px** when mimicking **mobile Paper** frames; let the **demo stage** use **full width**.

## 10. Parameter tweak panels ([Dialkit](https://github.com/joshpuckett/dialkit))

For **live-tweak UIs** on experiments (physics, animation, layout constants), prefer **[Dialkit](https://github.com/joshpuckett/dialkit)** (`DialRoot` + `useDialKit`) over ad hoc HTML forms. It keeps panels consistent, gives presets/shortcuts/copy, and scales to new demos.

- **Stack**: React + Dialkit + Motion (peer); ship a **bundled** entry (e.g. esbuild) for static pages, plus **`dialkit/styles.css`** (or copy `node_modules/dialkit/dist/styles.css` into the experiment).
- **Production**: set **`productionEnabled`** on `DialRoot` so the FAB/panel appears on GitHub Pages, not only in dev.
- **Wiring**: keep a **mutable params object** in vanilla simulation code; a small React bridge **`useEffect`**-syncs `useDialKit` values into that object each frame the store updates. Use **`onAction`** for one-shot controls (e.g. clear all fries).
- **Simpler demos**: fixed constants or a single `createDefault*Params()` in plain JS (see [Fry shower](fry-picker/) `createDefaultFrySimParams` in `fry-picker-fries.js`) when a tweak panel is not worth the bundle.
