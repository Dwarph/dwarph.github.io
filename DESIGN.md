# Design System — Pip Turner Portfolio (Homepage, Case Studies, Interaction Archive)

## 1. Visual Theme & Atmosphere

The portfolio reads as a **warm editorial surface**: a soft cream page (`#FFFDEF`) with deep brown ink text (`#372C09`), not stark white-on-black tech minimalism. **Outfit** carries display voice (headings, nav, job companies); **Nunito Sans** carries narrative body copy, lists, and UI chrome. The site is **XR- and craft-forward** without neon overload: employer identity shows up as **vertical gradient accents** (FitXR blue, Ultraleap teal–green) on timeline rails, scroll-linked bars, and inline name highlights in prose — never as flat full-bleed blocks behind long reading text.

The **hero** is a framed photograph (fluid max width ~1200px, generous corner radius) with optional **WebGL distortion** and a small circular settings control; it feels like a **matte print in a tray**, lifted by a soft brown-tinted shadow ring. **Navigation** is a **frosted bottom dock** at all breakpoints: a centered pill fixed above the safe area, icon-only with Material Icons, active section marked by a **pink icon** (`#ff8ca8`) — not a background halo.

**Case study pages** and the **Interaction Archive** reuse the same type scale and cream ground so subpages feel like chapters of one book. The archive is a **chronological catalog** of projects: row cards with square media (often video), title, year, italic tags, description, and stacked text links.

**Key Characteristics:**
- Cream ground (`#FFFDEF`) + brown text (`#372C09`) — warm, paper-like
- Outfit (700 display / 400 subdisplay) + Nunito Sans (400/700, italic for metadata)
- Accent yellow focus ring (`#ffc405`); pink highlight for “Pip”, hero stat values, and active nav icon (`#ff8ca8`)
- FitXR gradient: `#48abe9` → `#0179e9`; Ultraleap: `#00eb86` → `#00ceca`
- 15px radius on cards, thumbs, and markdown images; pill nav (`border-radius: 999px`)
- Scroll-driven reveal on desktop (blur + translate); disabled on mobile and when `prefers-reduced-motion`
- CSS is split by ownership:
  - Shared core: `styling/core.css`
  - Homepage: `styling/home.css`
  - Case studies: `styling/case-study.css`
  - Interaction archive: `styling/archive.css`
  - Legacy bundle entrypoint: `styling/homepage.css` (imports the above)

## 2. Color Palette & Roles

### Surfaces & Text
- **Page / card surface** (`#FFFDEF`): `--bg-color` — default background everywhere
- **Primary text** (`#372C09`): `--text-color` — headings, body, borders mixed with alpha
- **Inverted chips** (coming soon, tooltips): text color on `var(--bg-color)` text

### Highlights & Focus
- **Focus ring** (`#ffc405`): `--highlight-yellow` — `:focus-visible` outline on links, buttons, inputs
- **Bio / nav pink** (`#ff8ca8`): `--highlight-pip` — name highlight, hero stat values, active nav icon
- **Accent yellow** (same token as focus in places): CV retry button fill, “joyful and inevitable” bio highlight, dev-only scroll panel accents

### Employer Gradients (brand context, not page chrome)
- **FitXR**: `--fitxr-start` `#48abe9`, `--fitxr-end` `#0179e9` — linear gradient top→bottom, used as **text fill** (`.gradient-fitxr`, `.bio-gradient-fitxr`) and timeline bars
- **Ultraleap**: `--ultraleap-start` `#00eb86`, `--ultraleap-end` `#00ceca` — same treatment (`.gradient-ultraleap`, `.bio-gradient-ultraleap`)

### Utility Alphas (on `rgba(55, 44, 9, …)`)
- Hairline borders: ~`0.07–0.15` opacity on brown
- Dividers / HR: `rgba(55, 44, 9, 0.2)`
- Archive empty / loading surfaces: `rgba(55, 44, 9, 0.05)` base, pulse to `0.15`

### Shadows (representative)
- **Hero frame**: `0 10px 44px rgba(55, 44, 9, 0.08)` + `0 0 0 1px rgba(55, 44, 9, 0.07)`
- **Nav pill**: layered shadow + `1px` inset white highlight for glass edge (on `::before` frosted layer)
- **Coming soon tooltip**: `0 4px 12px rgba(0, 0, 0, 0.15)` (neutral lift)

## 3. Typography Rules

### Font families
- **Display**: `Outfit` — via `var(--font-display)` on headings, hero, nav, breadcrumbs, card titles.
- **Body**: `Nunito Sans` — `body` uses `var(--font-body)`; prose and UI inherit unless Outfit is set explicitly.
- **Italic**: tags, venues, case study company line, archive tags.
- **Icons**: Material Icons (nav, chevron, external, lock, compare handle). Icon pixel sizes are local, not part of the type scale.
- **Nunito axis**: body prose often sets `font-variation-settings: 'YTLC' 500, 'wdth' 100` for consistent lowercase height.

### Scale tokens (`:root` + one mobile override)

Desktop defaults live in `:root`; at **≤768px** a single `@media` block redefines only the `--fs-*` variables (no per-component font-size laundry list).

| Token | Desktop (rem) | Mobile (rem) | Used for |
|-------|-----------------|--------------|----------|
| `--fs-page-title` | 4 (64px) | 2.5 (40px) | Section titles, hero name, case study page H1 |
| `--fs-role` | 3 (48px) | 2 (32px) | Hero role |
| `--fs-employer` | 3.125 (50px) | 2 (32px) | Job company |
| `--fs-group` | 2.5 (40px) | 1.5 (24px) | “Case Studies” / group labels |
| `--fs-article-h2` | 2.5 (40px) | 2 (32px) | Case study markdown `h2` |
| `--fs-card` | 2 (32px) | 1.25 (20px) | Case/project/archive card titles |
| `--fs-prose-h3` | 2 (32px) | 1.5 (24px) | Markdown `h3` |
| `--fs-prose-h4` | 1.5 (24px) | 1.25 (20px) | Markdown `h4` |
| `--fs-body` | 1.5 (24px) | 1 (16px) | Body, dates, tags text, talks, contact, archive copy, breadcrumbs (Outfit at this size for crumbs) |
| `--fs-ui` | 1.125 (18px) | 1 (16px) | Page status, retry button |
| `--fs-nav` | 1.5 (24px) | 1.25 (20px) | Dock nav (drives Material icon size) |
| `--fs-hero-stat` | `clamp(2.5rem, 8vw, 4rem)` | `clamp(1.75rem, 7vw, 2.5rem)` | Case study metric values (`.cs-hero-stat__value`); groups may override locally |

Supporting tokens: `--lh-display: 1`, `--lh-body: 1.4`. Micro copy (coming soon badge text, small tooltips) uses fixed `rem` where it should not track the body scale.

### Principles
- **One source of truth**: components use `font-size: var(--fs-…)`; mobile adjusts only tokens, not dozens of selectors.
- **Tight display** (`--lh-display`) on Outfit headings; **comfortable reading** (`--lh-body`) on Nunito paragraphs and descriptions.
- **Gradient text** stays only on **FitXR** / **Ultraleap** proper nouns in running copy (existing gradient utilities).
- **Removed** unused utility classes (`.heading-1` … `.body-italic`) — they were not referenced in HTML/JS.

## 4. Component Stylings

### Hero Header (`.homepage-header`)
- Fixed height: **467px** desktop, **371px** mobile; width `min(1200px, 100% - 2× fluid gutter)`
- Corner radius: `clamp(28px, 5.5vw, 56px)` desktop; slightly tighter on mobile
- Inner content: profile image **186×186**, circular; name + role column
- **Profile press target** (`.profile-image-press-target`): invisible hit area over the photo; linked to the bio “Pip” highlight — press triggers bounce (`is-pip-bouncing`) and a WebGL distortion pulse
- Optional **distortion** panel: cream translucent panel, 12px radius, small caps legend, range rows, full-width reset button (8px radius, inverted colors)

### Navigation (`.homepage-nav-shell` / `.homepage-nav` / `.nav-link`)
- **Bottom dock at all breakpoints**: `.homepage-nav-shell` fixed, centered, with safe-area padding; `#homepage-container` gets extra bottom padding so content clears the pill
- Frosted glass: gradient + `backdrop-filter` blur on `.homepage-nav::before` (stronger blur on desktop ≥769px); solid cream fallback when blur unsupported
- Pill container: **999px** radius, layered brown-tinted shadow
- Links: **44×44** circles; **42×42** at ≤768px
- Hover (fine pointer): subtle brown tint background + light shadow
- Active (`.nav-link--active`): **pink icon only** — `.nav-link--active::before` halo is suppressed (`opacity: 0`); background stays transparent
- Scroll spy: `nav-link--active` toggled by `homepageGenerator.js`; `html.home-nav-scrolling` suppresses stuck `:active` scale during scroll on coarse pointers

### Bio Interactions (About section)
- **Inline highlights** (`.bio-interactive-highlight`): pressable spans for “Pip” (pink), “joyful and inevitable” (yellow), “FitXR” / “Ultraleap” (gradient text), and company anchor links
- **Joyful easter egg**: clicking “joyful and inevitable” (`.bio-joyful-trigger`) spawns SVG doodles in the CV–Work whitespace (`bioJoyfulDoodles.js`)
- Shared press/hover/focus styles in `core.css`; yellow `:focus-visible` ring on all bio highlights

### Work Timeline & Cards
- Desktop: **96px** logo column, **16px** wide vertical **gradient bar** aligned to case lists; scroll-driven **`.job-timeline-scroll-bar`** duplicates bar as you read
- Case study **image** height **194px**, top corners **15px**; whole card is often a single `<a>` (`.case-study-card-link`)
- **Project** rows (other work): **194px** thumb, **15px** radius, horizontal row desktop → stacked mobile
- **Coming soon**: desktop tooltip (fixed, pill); mobile **badge** with lock icon

### Case Study Article (markdown in `.case-study-section .case-study-content`)
- Page title: `var(--fs-page-title)`; company line: italic, `var(--fs-body)`
- Shared `h2`–`h4` rule sets Outfit + weight; each level only sets `font-size` (`--fs-article-h2`, `--fs-prose-h3`, `--fs-prose-h4`)
- Paragraph spacing bottom **20px** (`--spacing-lg`)
- Images & iframes: **100%** max width, **15px** radius, vertical margin **20px**, `cursor: zoom-in`
- Links: underline, same text color; hover **opacity 0.7**
- `hr`: 1px `rgba(55, 44, 9, 0.2)`

**Overview table** (`.cs-overview-table` inside `.cs-overview`): label/value rows at top of case study; Outfit bold labels, Nunito values, subtle row dividers.

**Hero stats** (`.cs-hero-stat`): pink Outfit value (`--fs-hero-stat`) + Nunito label; single stat or grouped (`.cs-hero-stat-group--2` / `--3`) for recap strips.

**Magazine boxouts** (`.cs-boxout`): add `[boxout]` to a heading in markdown — content until the next same-or-higher heading (or `---`) wraps in a white bleed panel. Marker stripped at render time (`caseStudyPageGenerator.js`).

**Media layouts** (`figure.cs-media`): layout tokens in image `title` (space- or comma-separated) become classes — `wide`, `narrow`, `bleed` (~980px), `bleed-xl` (~1100px), `left` / `right` (floated desktop), `compare`. Side-by-side pairs use `.cs-media-row`. Figcaptions: centered, 0.8 opacity.

**Compare slider** (`.cs-compare`): before/after stills with draggable handle; inner images need `data-no-lightbox`. Initialized by `caseStudyCompare.js`.

**Image lightbox**: click any case study image (unless `data-no-lightbox`) to zoom; Escape or backdrop click closes. Compare slider images opt out by default.

*Authoring detail for case studies: see `.cursor/skills/case-study-writing/SKILL.md`.*

### Interaction Archive
- Breadcrumb only at top (no shared hero header); section title + intro paragraph with optional employer gradient spans
- **Horizontal rule** under intro block
- **Project row**: like homepage project card — **194×194** media (video or image), title Outfit + `var(--fs-card)`, year/tags/description/links on `var(--fs-body)` with `var(--lh-body)` for prose
- **Empty state**: centered message, generous vertical padding
- **Loading video**: pulsing placeholder + spinner (brown-tinted)
- **Filters not shipped**: `.archive-filters` styles remain in `styling/archive.css` but are not rendered by `interactionArchiveGenerator.js` — do not document or build filter UI unless re-enabled in JS

### Shared Utilities
- **Skip link**: first focusable, high contrast flip from off-screen
- **Breadcrumbs** (subpages): one `:is()` rule — Outfit at `var(--fs-body)`, separator and current share styles; current **opacity 0.7**
- **Return home** (`.subpage-return-home`): pink Outfit link with chevron, below case study and archive content (`renderReturnHomeLink()` in `utils.js`)
- **Page status** (loading / error): `var(--fs-ui)`; retry button Outfit at `var(--fs-ui)` on **yellow** fill

## 5. Layout Principles

### Content Width
- Primary column: **max-width 730px** (`.homepage-section`, breadcrumbs, case study body, return-home link) — comfortable measure for long-form case studies
- Hero “frame” wider: **max 1200px** with side gutters `clamp(16px, 4vw, 48px)`
- Case study bleed media: `bleed` ~980px, `bleed-xl` ~1100px (viewport-capped with header gutters)

### Spacing Tokens (CSS variables)
- `--spacing-xs` 5px through `--spacing-3xl` 50px for component gaps
- Section rhythm: `--space-section` `clamp(2.75rem, 4.5vw, 3.5rem)`; after headings `--space-after-heading` `clamp(1.25rem, 2.2vw, 1.625rem)`
- Mobile-specific: `--mobile-job-gap` 40px between jobs, `--mobile-card-gap` 25px between cards

### Whitespace Philosophy
- **One-column narrative**: scrolling tells a single story (About → Work → Projects → Talks → Contact)
- **Work blocks** group employer context, then **case studies** as vertical gallery — timeline reinforces tenure without a separate infographic page
- **Archive** prioritizes **skimmable rows** (thumb + headline) over dense grids — appropriate for many short pieces

### Border Radius Scale
- **15px**: images, project thumbs, archive tiles, markdown figures
- **12px**: distortion panel
- **8px**: small controls (reset, scroll panel)
- **16–24px**: coming soon badge / tooltip
- **50% / 999px**: profile, nav pills, nav links, timeline caps

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat | No shadow | Main reading column on cream |
| Frame | Soft brown shadow + 1px ring | Hero header |
| Nav | Multi-layer + inset white hairline | Bottom frosted dock |
| Controls | Light lift on hover (translate/scale) | Distortion trigger, nav links |
| Tooltip / badge | Neutral `rgba(0,0,0,0.15)` | Coming soon |
| Boxout bleed | White panel via `::before` pseudo | Magazine callouts in case studies |

**Shadow philosophy:** Depth uses **warm brown ambient** (`rgba(55, 44, 9, …)`) so elevation feels paper-on-desk, not cold neutral gray — consistent with ink + cream palette.

## 7. Do's and Don'ts

### Do
- Use **CSS variables** (`--bg-color`, `--text-color`, `--font-display`, `--font-body`, `--fs-*`, gradients) for new UI on these templates
- Keep **long-form content** inside the **730px** column for readability
- Prefer **`var(--fs-*)`** for type size; add a new token only if nothing in the table is close enough
- Preserve **15px** media radius for visual consistency across homepage, case studies, archive
- Respect **focus-visible** yellow outline and skip links for keyboard users
- Honor **`prefers-reduced-motion`**: no scroll-blur reveals; shorter transitions
- Scroll reveal tuning: `window.scrollAnimConfig` in devtools, or `createScrollAnimPanel()` from console on desktop (no default UI panel)

### Don't
- Don’t introduce a third display font on homepage / case study / archive without updating the system
- Don’t use **pure black** or **pure white** as the default pair — the palette is intentionally warm
- Don’t place low-contrast text on the FitXR/Ultraleap gradients except as **gradient text** with fallback readability in mind
- Don’t shrink touch targets below **40px** on the nav dock (current: 44px / 42px mobile)
- Don’t animate large blurs on mobile — current CSS already disables scroll-driven blur there
- Don’t use `data-no-lightbox` on compare-slider inner images unless you intend to allow lightbox over drag

## 8. Responsive Behavior

### Primary Breakpoint
| Name | Width | Key behavior |
|------|-------|----------------|
| Mobile | **≤768px** | Single column; **type scale** from `:root` token overrides only; bottom nav dock; stacked work + timeline; case/project images full width **194px** height; scroll reveals off; boxouts lose horizontal bleed (inset padding) |
| Desktop | **≥769px** | Wider hero; bottom nav dock (stronger frosted blur); side-by-side project rows; scroll-linked reveals and timeline bar; floated `left`/`right` case study media |

*Bottom dock:* Nav is always **horizontal bottom**, centered, with safe-area padding. Homepage gets extra **padding-bottom** so final sections aren’t covered.

### Touch & Motion
- Hero: `touch-action: none` while interacting with distortion (avoid scroll fighting gesture)
- Nav: on coarse pointers, **suppress stuck `:active` scale** during scroll (`html.home-nav-scrolling`)
- Archive mobile: media container uses **aspect-ratio padding** trick for square video area

### Content Collapsing
- Work jobs: desktop two-column (logo rail + content); mobile **logo+text row** then description then case list with slim **10px** gradient column
- Case study media rows: side-by-side desktop → stacked mobile

## 9. Agent Prompt Guide

### Quick Token Reference
- Background: `#FFFDEF` (`--bg-color`)
- Text / ink: `#372C09` (`--text-color`)
- Focus: `#ffc405` (`--highlight-yellow`)
- Active / personal accent: `#ff8ca8` (`--highlight-pip`)
- FitXR wordmark gradient: `#48abe9` → `#0179e9`
- Ultraleap wordmark gradient: `#00eb86` → `#00ceca`
- Card / image radius: **15px**
- Article measure: **730px** max width
- Fonts: `--font-display` (Outfit), `--font-body` (Nunito Sans); sizes: `--fs-page-title` … `--fs-body`, `--fs-hero-stat` (see typography table in section 3)

### Example Prompts

**Homepage hero**
“Framed hero: max width 1200px, height 467px desktop, background photo `object-fit: cover`, corner radius `clamp(28px, 5.5vw, 56px)`, shadow `0 10px 44px rgba(55,44,9,0.08)` + `0 0 0 1px rgba(55,44,9,0.07)`. Foreground: circular 186px profile with press target, Outfit name `var(--fs-page-title)` / 700, role `var(--fs-role)` / 400, text `#372C09`.”

**Work case study card**
“Cream page. Card link: image 194px tall, top radius 15px, below it Outfit title `var(--fs-card)` / 700, italic tags `var(--fs-body)` / 400, description `var(--fs-body)` + line-height `var(--lh-body)`. Hover: image and title opacity ~0.8 / 0.7.”

**Case study markdown**
“Column max-width 730px. Markdown: `h2` `var(--fs-article-h2)`, `h3` `var(--fs-prose-h3)`, `h4` `var(--fs-prose-h4)`, body `var(--fs-body)` + `var(--lh-body)`. Images 15px radius, zoom-in cursor, lightbox on click. Links underlined `#372C09`, hover opacity 0.7.”

**Case study hero stat**
“Pink Outfit value at `var(--fs-hero-stat)` / 700, Nunito label at `var(--fs-body)` below. Two-up group: `.cs-hero-stat-group--2` with equal columns.”

**Case study boxout**
“White bleed panel: `[boxout]` on heading. Content bleeds past 730px column on desktop via `::before` full-width white fill; 15px media radius inside.”

**Case study compare slider**
“`figure.cs-media--compare` wrapping `.cs-compare` with before/after images (`data-no-lightbox`). Draggable vertical handle with Material chevrons; labels ‘Before’ / ‘After’. Cream page, 15px radius on container.”

**Interaction archive row**
“Row: 194px square media, Outfit title `var(--fs-card)`, meta `var(--fs-body)` (bold year, italic tags), description + links on body scale. Mobile: stack.”

**Nav pill**
“Bottom-centered frosted pill, radius 999px, backdrop blur on `::before`, layered brown shadow. Links 44px circles (42px mobile); icons follow `var(--fs-nav)`; active state pink icon only (`--highlight-pip`), no background halo.”

**Return home**
“Below 730px column: pink Outfit link `var(--fs-body)` / 700, chevron_left Material icon, no underline. Hover opacity 0.8.”

### Iteration Checklist
1. Start from **cream + brown** — check contrast for any new accent
2. Add color through **employer gradients** or small highlights, not full-screen washes
3. Keep **730px** reading column for case study / archive prose
4. Match **15px** rounding on all major imagery
5. Test **≤768px** and **`prefers-reduced-motion`**
6. Verify focus rings (**yellow**) on any new interactive control
7. For case study content patterns, check **case-study-writing** skill before inventing new markup
