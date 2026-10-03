#!/usr/bin/env node
/*
 * Checks that Set Sail's search and AI-answer facts still agree with each
 * other. No dependencies; run from anywhere:
 *
 *   node setsail/check-seo.mjs
 *
 * Fails (exit 1) on:
 *   - JSON-LD on the landing page or changelog that doesn't parse
 *   - a different number of FAQ questions on the page and in the FAQPage
 *     JSON-LD (both lists are printed, so a renamed or dropped one is easy
 *     to spot)
 *   - a different number of "What it does" lines and featureList entries
 *   - a setsail/ page missing from setsail/sitemap.xml
 *
 * Warns, without failing, when an FAQ answer's wording differs between the
 * page and the JSON-LD. That's allowed (the page can carry a link the
 * JSON-LD can't), but worth a look when one side was edited alone.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const SITE = 'https://pipturner.co.uk';

const errors = [];
const warnings = [];

const read = (rel) => readFileSync(path.join(here, rel), 'utf8');
const text = (html) =>
  html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

function jsonLd(rel) {
  const html = read(rel);
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (!blocks.length) errors.push(`${rel}: no JSON-LD found.`);
  const nodes = [];
  for (const [, body] of blocks) {
    try {
      const data = JSON.parse(body);
      nodes.push(...(data['@graph'] ?? [data]));
    } catch (err) {
      errors.push(`${rel}: JSON-LD doesn't parse (${err.message}).`);
    }
  }
  return { html, nodes };
}

/* Landing page ------------------------------------------------------------ */

const landing = jsonLd('index.html');
const byType = (type) => landing.nodes.find((n) => n['@type'] === type);

const faqHtml = /<div class="ss-faq">([\s\S]*?)<\/div>/.exec(landing.html)?.[1] ?? '';
const visibleFaq = [...faqHtml.matchAll(/<h3>([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>/g)].map(
  ([, q, a]) => ({ q: text(q), a: text(a) }),
);
const ldFaq = (byType('FAQPage')?.mainEntity ?? []).map((e) => ({
  q: e.name,
  a: e.acceptedAnswer?.text ?? '',
}));

if (!visibleFaq.length) errors.push('index.html: no FAQ found in <div class="ss-faq">.');
if (visibleFaq.length !== ldFaq.length) {
  const width = Math.max(...visibleFaq.map((f) => f.q.length), 10);
  const rows = Array.from({ length: Math.max(visibleFaq.length, ldFaq.length) }, (_, i) =>
    `    ${(visibleFaq[i]?.q ?? '-').padEnd(width)}  |  ${ldFaq[i]?.q ?? '-'}`,
  );
  errors.push(
    `index.html: ${visibleFaq.length} FAQ questions on the page, ${ldFaq.length} in the FAQPage JSON-LD.\n` +
      `    ${'On the page'.padEnd(width)}  |  In the JSON-LD\n${rows.join('\n')}`,
  );
} else {
  visibleFaq.forEach((f, i) => {
    if (f.a !== ldFaq[i].a) {
      warnings.push(`FAQ "${f.q}" is worded differently:\n    page:    ${f.a}\n    JSON-LD: ${ldFaq[i].a}`);
    }
  });
}

const featuresHtml = /<ul class="ss-features">([\s\S]*?)<\/ul>/.exec(landing.html)?.[1] ?? '';
const visibleFeatures = [...featuresHtml.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(([, li]) => text(li));
const ldFeatures = byType('SoftwareApplication')?.featureList ?? [];
if (visibleFeatures.length !== ldFeatures.length) {
  errors.push(
    `index.html: ${visibleFeatures.length} "What it does" lines but ${ldFeatures.length} featureList entries in the JSON-LD.`,
  );
}

/* Changelog --------------------------------------------------------------- */

jsonLd('changelog/index.html');

/* Sitemap ----------------------------------------------------------------- */

const sitemap = read('sitemap.xml');
const listed = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc]) => loc.trim()));

function pages(dir) {
  const out = [];
  for (const name of readdirSync(path.join(here, dir))) {
    const rel = path.posix.join(dir, name);
    if (statSync(path.join(here, rel)).isDirectory()) out.push(...pages(rel));
    else if (name === 'index.html') out.push(rel);
  }
  return out;
}
for (const rel of pages('.')) {
  const url = `${SITE}/setsail/${rel.replace(/^\.\//, '').replace(/index\.html$/, '')}`;
  if (!listed.has(url)) errors.push(`sitemap.xml: ${url} isn't listed.`);
}

/* Report ------------------------------------------------------------------ */

for (const w of warnings) console.warn(`warning: ${w}`);
if (errors.length) {
  console.error(`\n${errors.map((e) => `error: ${e}`).join('\n')}\n`);
  process.exit(1);
}
console.log(
  `OK: ${visibleFaq.length} FAQ questions, ${visibleFeatures.length} features, ${listed.size} sitemap pages` +
    (warnings.length ? `, ${warnings.length} warning${warnings.length === 1 ? '' : 's'}.` : '.'),
);
