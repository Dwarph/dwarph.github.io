# Design decisions: homepage & case studies

This document captures the conventions embodied in the current implementation so new work stays consistent. It is derived from the site’s code and data (`index.html`, case study HTML shells, `js/homepageGenerator.js`, `js/caseStudyPageGenerator.js`, `js/header.js`, `styling/core.css`, `styling/home.css`, `styling/case-study.css`, `styling/archive.css`, and `data/`).

---

## Visual system

- **Palette**: Warm off-white background (`#FFFDEF`), deep brown text (`#372C09`). Accent highlights: pink for “Pip”, yellow for emphasis phrases, plus **company gradients** — FitXR (blue) and Ultraleap (teal/green) — used for job titles and inline company names in prose.
- **Typography**: **Outfit** for headings and **Nunito Sans** for body. Fonts load from the HTML shell (not from CSS `@import`) to avoid duplicate requests. Typographic scale tokens live in `core.css` (desktop defaults with a **768px** breakpoint for mobile).
- **Icons**: **Material Icons** for link affordances — `north_east` for external links, `chevron_right` for internal navigation — so users can scan link type quickly.
- **Layout width**: Main content uses a **~730px** max width on desktop (`clamp` horizontal padding). Case study long-form content follows the same section constraints.
- **Spacing**: Tokenized CSS variables (`--spacing-*`, `--space-section`, `--space-block`, etc.) with **mobile-first** hierarchy: larger gaps between jobs than between cards than within cards.

---

## Shared chrome (header & navigation)

- **One header implementation** (`renderHeader` in `header.js`): banner image, profile image, name, role. Structure is intentionally identical on every page so spacing does not drift.
- **Homepage vs subpages**:
  - On the **homepage**, the profile image and name/role are **not** links (avoids useless focus stops).
  - On **subpages** (case studies, etc.), profile and name/role **link home** with clear `aria-label`s.
- **Image reveal**: After inject, `initHeaderImageReveal` fades images in after decode; **`prefers-reduced-motion: reduce`** skips animation and shows content immediately.
- **Primary nav** (homepage only): anchor links to `#about`, `#work`, `#projects`, `#talks`, `#contact`.

---

## Homepage structure & content

- **Data source**: `data/homepageData.json` drives everything; the page shell is a minimal container + scripts.
- **Section order**: **About → Work → Projects → Talks → Contact**, each a `homepage-section` with a shared **section title** pattern.
- **About**: Bio is plain text in JSON; specific phrases (“Pip”, “Ultraleap”, “FitXR”, “joyful and inevitable”) get **automatic inline styling** in code. Paragraphs split on blank lines. CV is a **download** link with external-style icon.
- **Work**:
  - Each job has logo, dates, role, description, optional **Case Studies** and **Other Work** groupings.
  - **Ultraleap** uses the heading **“Case Studies & Other Work”**; other companies use **“Case Studies”** only for the first group.
  - **Timeline**: When a job has case studies or other work, a **vertical gradient bar** and scroll-linked UI (`scrollAnim.js`) tie the job block together; desktop vs mobile use different DOM anchors so the bar aligns to the visible layout.
  - **Mobile** reorders blocks (logo + meta, then description, then case study stack in a dedicated container) so reading order stays sensible.
- **Projects & Talks**: Card/list patterns parallel case study cards (whole-card links where applicable, lazy images with dimensions to limit layout shift).
- **Contact**: Social and email; external links use the same icon language.

---

## Case study pages

- **Routing**: One static HTML file per case study (e.g. `prosho.html`) whose filename (without `.html`) is the **key** used to load data and markdown.
- **Data**: `data/caseStudiesData.json` lists metadata (`key`, `title`, `company` line, image paths, etc.). Long-form body lives in **`data/casestudies/<key>.md`**.
- **Rendering**: **Showdown** converts Markdown to HTML; paths in markdown are rewritten so `./images/casestudies/...` and `./data/casestudies/images/...` resolve correctly when deployed.
- **Layout**: Shared header → **breadcrumb** (`Home / Current title`) → `h1` title + italic **company line** → Markdown body inside `.case-study-content`.
- **Intro paragraph (exception)**: For **Hyperion Showcase** (`prosho`), a fixed HTML intro is injected in JS (not from markdown) for a consistent branded lead-in; prefer moving such copy into data/markdown if more case studies need the same pattern.
- **Styling**: Core prose styling lives under `.case-study-section .case-study-content` in `case-study.css` (headings, lists, images with **15px radius**, tables, code, horizontal rules). Case study HTML may also load `styling/markdownStyling.css` where needed for extra Markdown-specific rules.
- **Loading & errors**: Container uses `aria-busy` while fetching; **retry** helpers in `utils.js` reduce flaky-network failures; failures show a centered **Try again** control. Unknown keys render a **not found** state with link back home.
- **Document title**: Set dynamically to `Pip Turner - <case study title>` (or a not-found title).

---

## Cards, links & “coming soon”

- **Whole-card links**: If a case study or project has a URL, the **`<a>` wraps the entire card** for a large hit target; inner content uses non-link titles to avoid nested interactive elements.
- **Link resolution**: Explicit `link` in data, or internal `key.html`, or no link; **coming soon** entries show a lock/badge and are non-navigable.
- **External** links get `target="_blank"` and `rel="noopener noreferrer"`.

---

## Motion & scroll

- **Scroll-driven effects** (`scrollAnim.js`): Section fade-in and timeline bar growth are configurable; respect for reduced motion should stay aligned with header behavior when changing animation defaults.
- **Homepage** may register a service worker (`sw.js`) for caching; case study shells may omit it — follow the pattern of the page you edit.

---

## Accessibility

- **Skip link** to main content (`#about` on home, `#case-study-content` on case studies).
- **Focus**: Visible focus ring using the yellow highlight token; `:focus-visible` pattern to avoid mouse focus clutter.
- **Landmarks**: `header`, `nav`, `role="article"` on static cards, `aria-label` on icon-only or terse controls, breadcrumb `aria-current="page"` on the current segment.

---

## Performance habits

- Preload critical header images and font CSS; header/profile images use **`fetchpriority="high"`** and eager load; below-the-fold images use **`loading="lazy"`** with width/height.
- Avoid duplicate font loading between HTML and CSS.

---

## How to add or change content

1. **Homepage**: Edit `data/homepageData.json` (and assets under `images/` as referenced).
2. **New case study**: Add an entry to `caseStudiesData.json`, add `<key>.md` under `data/casestudies/`, copy a case study HTML shell from an existing page, adjust meta/JSON-LD/title in the shell, and link from homepage work data via `link` or `key`.

Keeping new UI inside these patterns (shared header, tokens, section width, link iconography, and data-driven copy) preserves a coherent portfolio experience across homepage and case studies.
