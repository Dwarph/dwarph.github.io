#!/usr/bin/env node
/*
 * Builds index.html from changelog.md — the two files in this directory,
 * nothing else. No dependency on the Porthole repo, no dependency on
 * CHANGELOG.md, no dependency on npm.
 *
 * Run it from wherever you happen to be — it finds changelog.md next to
 * itself, not relative to your shell's current directory:
 *
 *   node build.mjs                          (from inside this folder —
 *                                             where you'll usually already be,
 *                                             having just edited changelog.md)
 *   node setsail/changelog/build.mjs        (from the repo root instead)
 *
 * changelog.md is the thing to edit for wording — a headline, a release's
 * title, the lead paragraph at the top, all plain text. Change it, run this,
 * and the page is rebuilt. A new release's *section* still comes from the
 * Porthole repo's scripts/sync-changelog-markdown.mjs (it reads CHANGELOG.md,
 * this doesn't need to) — but once a section exists here, it's yours: this
 * script only ever reads it back out, never regenerates or reformats it.
 *
 * The markdown grammar, in full:
 *
 *   # Changelog
 *
 *   Lead paragraph — one or more lines, ends at the first blank line or the
 *   first release heading.
 *
 *   ## Release Title (v1.2.3)
 *   31 August 2026
 *
 *   - Added: One sentence.
 *   - Fixed: Another sentence.
 *
 *   ## Older Release (v1.2.0)
 *   ...
 *
 * Releases newest first. The date line is copied straight onto the page — write it
 * however you want it to read. Each bullet is `- Category: text`;
 * text may use `` `code` ``, [links](https://...), and *emphasis* — the same
 * subset CHANGELOG.md's own bullets use, run through the same escaping. Any
 * category name works; it just needs a matching `.cl-tag[data-tag="…"]` rule
 * in changelog.css to get its own colour, else it falls back to plain ink.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const MARKDOWN_PATH = path.join(here, 'changelog.md');
const OUT_PATH = path.join(here, 'index.html');

const SITE_URL = 'https://pipturner.co.uk/setsail/changelog';
const OG_IMAGE = 'https://pipturner.co.uk/setsail/assets/og.jpg';
const APP_URL = 'https://pipturner.co.uk/setsail';

/* Parsing -------------------------------------------------------------------- */

const RELEASE_RE = /^## (.+?)\s+\(v(\d+\.\d+\.\d+)\)\s*$/;
const BULLET_RE = /^- ([A-Za-z]+):\s*(.+)$/;

function cmpVersion(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
}

/**
 * Deliberately forgiving: blank lines are skipped wherever they'd only be
 * decorative, because this is a file a person edits by hand and a build that
 * breaks on an extra blank line is a build that gets distrusted.
 */
function parseMarkdown(md) {
  const lines = md.split('\n');
  let i = 0;

  let h1 = 'Changelog';
  while (i < lines.length && !lines[i].startsWith('# ')) i++;
  if (lines[i]?.startsWith('# ')) {
    h1 = lines[i].slice(2).trim();
    i++;
  }

  while (i < lines.length && lines[i].trim() === '') i++;
  const leadLines = [];
  while (i < lines.length && lines[i].trim() !== '' && !RELEASE_RE.test(lines[i])) {
    leadLines.push(lines[i].trim());
    i++;
  }
  const lead = leadLines.join(' ');

  const releases = [];
  let release = null;
  for (; i < lines.length; i++) {
    const line = lines[i];

    const heading = RELEASE_RE.exec(line);
    if (heading) {
      release = { title: heading[1].trim(), version: heading[2], date: '', entries: [] };
      releases.push(release);
      continue;
    }
    if (!release) continue;

    if (!release.date) {
      if (line.trim() !== '') release.date = line.trim();
      continue;
    }

    const bullet = BULLET_RE.exec(line);
    if (bullet) {
      release.entries.push({ category: bullet[1], text: bullet[2].trim() });
    }
  }

  return { h1, lead, releases: releases.sort((a, b) => cmpVersion(b.version, a.version)) };
}

/* Rendering ------------------------------------------------------------------ */

/*
 * Em dashes are normalised out of every string that reaches the page, rather
 * than being fixed in changelog.md once: a release's section is synced in from
 * the Porthole repo's CHANGELOG.md, which currently holds 132 of them, so a
 * one-off find-and-replace here would last exactly until the next release.
 *
 * This is the single choke point that catches them. Every piece of text on the
 * page runs through it — headings, dates, category names — and inline() calls
 * it before doing anything else, so entry text is covered too.
 *
 * The pattern eats the surrounding whitespace rather than swapping the
 * character alone, so a spaced "a — b" and an unspaced "a—b" both land on
 * "a - b" instead of "a  -  b" and "a-b".
 */
let emDashCount = 0;

const noEmDash = (s) =>
  s.replace(/\s*—\s*/g, () => {
    emDashCount++;
    return ' - ';
  });

const escapeHtml = (s) =>
  noEmDash(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Code spans, links, and emphasis — the subset a changelog sentence actually
 *  uses. Escaping runs first, so these patterns match text that can no longer
 *  contain markup of its own. */
function inline(text) {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/(^|\s)\*([^*]+)\*/g, '$1<em>$2</em>');
}

const anchorFor = (version) => `v${version.replace(/\./g, '-')}`;

const MARK = `<svg class="ss-mark" viewBox="0 0 128 128" width="48" height="48" role="img" aria-label="Set Sail home">
        <defs><clipPath id="ss-clip"><rect x="22" y="-11" width="106" height="134" rx="53" /></clipPath></defs>
        <circle cx="64" cy="64" r="51.83" fill="#372C09" />
        <g clip-path="url(#ss-clip)">
          <path d="M20.9178 98.1501C38.1476 78.6284 58.2814 53.3357 60.2346 12.0816C60.3562 9.51319 63.4028 8.16243 65.2447 9.95652C98.4063 42.2571 92.4024 77.6525 89.3727 99.9166C89.1975 101.204 88.2149 102.238 86.9375 102.476C63.3015 106.875 52.0229 108.497 22.6036 103.066C20.3208 102.644 19.3816 99.8905 20.9178 98.1501Z" fill="#EDE8CC" />
        </g>
        <path d="M65.9688 86.6969C47.2937 84.8465 47.9105 78.6782 27.5554 78.6782C27.5554 78.6782 17.4137 78.6782 6.65336 86.6969C10.6432 94.5211 14.8112 100.318 24.4861 108.566C37.9217 118.836 48.9865 122.617 65.9688 122.215C81.9223 121.836 94.9729 115.5 104.482 107.82C109.332 104.476 120.484 91.7349 123.218 82.451C115.644 78.6782 109.593 78.6782 109.593 78.6782C91.8432 76.4595 85.5368 88.6359 65.9688 86.6969Z" fill="#2397DD" />
      </svg>`;

function renderRelease(release) {
  const entries = release.entries
    .map(
      (entry, i) =>
        `        <li class="cl-row${
          i > 0 && entry.category !== release.entries[i - 1].category
            ? ' cl-row--turn'
            : ''
        }">\n` +
        `          <span class="cl-tag" data-tag="${escapeHtml(entry.category)}">${escapeHtml(entry.category)}</span>\n` +
        `          <span class="cl-text">${inline(entry.text)}</span>\n` +
        `        </li>`,
    )
    .join('\n');

  return `      <section class="cl-release">
        <h2 id="${anchorFor(release.version)}">
          ${escapeHtml(release.title)}
          <span class="cl-version">v${release.version}</span>
        </h2>
        <p class="cl-meta">${escapeHtml(release.date)}</p>
        <ul class="cl-entries">
${entries}
        </ul>
      </section>`;
}

function renderPage({ h1, lead, releases }) {
  const sections = releases.map(renderRelease).join('\n\n');

  return `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="description" content="Everything that has changed in Set Sail, the lightweight screen recorder for macOS and Windows.">
  <meta property="og:title" content="Set Sail - Changelog">
  <meta property="og:description" content="Everything that has changed in Set Sail, newest first.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${SITE_URL}">
  <meta property="og:image" content="${OG_IMAGE}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="A tiny sailing boat alone on a wide teal sea, beside the Set Sail name.">
  <meta name="twitter:card" content="summary_large_image">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@700;800&family=Nunito+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">

  <link rel="icon" type="image/svg+xml" href="../assets/icon.svg">
  <link rel="apple-touch-icon" href="../assets/icon.png">

  <link rel="stylesheet" href="../setsail.css">
  <link rel="stylesheet" href="changelog.css">
  <title>Set Sail - Changelog</title>
</head>

<body>
  <div class="cl-sea" aria-hidden="true"></div>

  <main class="cl-page">
    <header class="cl-head">
      <div class="cl-head-top">
        <a class="cl-home" href="../">
          ${MARK}
        </a>
        <a class="ss-btn cl-cta" href="${APP_URL}">
          Get Set Sail
          <span class="cl-cta-go" aria-hidden="true">&#8599;&#65038;</span>
        </a>
      </div>
      <h1 class="ss-title">${escapeHtml(h1)}</h1>
      <p class="ss-lead cl-lead">${inline(lead)}</p>
    </header>

${sections}

    <footer class="cl-foot">
      <p>Set Sail is made by <a href="https://pipturner.co.uk">Pip Turner</a>.
        <a href="../privacypolicy/">Privacy policy</a>.</p>
    </footer>
  </main>
</body>

</html>
`;
}

/* Main ------------------------------------------------------------------- */

const md = readFileSync(MARKDOWN_PATH, 'utf8').replace(/\r\n?/g, '\n');
const parsed = parseMarkdown(md);

if (!parsed.releases.length) {
  console.error(`Refusing to write: no "## Title (vX.Y.Z)" release headings found in ${MARKDOWN_PATH}.`);
  process.exit(1);
}

const bad = [];
for (const release of parsed.releases) {
  if (!release.date) bad.push(`  v${release.version} ("${release.title}") has no date line under its heading.`);
  if (!release.entries.length) bad.push(`  v${release.version} ("${release.title}") has no "- Category: ..." bullets.`);
}
if (bad.length) {
  console.error(`Refusing to write:\n\n${bad.join('\n')}\n`);
  process.exit(1);
}

writeFileSync(OUT_PATH, renderPage(parsed));

const entryCount = parsed.releases.reduce((n, r) => n + r.entries.length, 0);
console.log(`Wrote ${OUT_PATH}`);
console.log(`  ${parsed.releases.length} releases, ${entryCount} entries, from ${path.basename(MARKDOWN_PATH)}.`);
if (emDashCount) {
  console.log(`  Normalised ${emDashCount} em dash${emDashCount === 1 ? '' : 'es'} to " - ".`);
}
