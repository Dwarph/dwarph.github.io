# Set Sail: search and AI answers

How Set Sail gets found, what's already wired up in this repo, and the few
things only Pip can do (they need a login). No paid tools anywhere.

## What's in the repo

- `setsail/index.html`: a descriptive `<title>` and description, a canonical
  URL, JSON-LD (`SoftwareApplication`, `Person`, `FAQPage`), and the "What it
  does" and "Questions" plate below the fold. **Keep the FAQ answers and the
  `FAQPage` JSON-LD in step.** Each answer leads with its one-line answer, so
  it can be quoted on its own.
- `setsail/changelog/build.mjs`: canonical URL, `<time datetime>` on each
  release, and JSON-LD with the current version and every release. All
  generated, so nothing to maintain beyond running the build.
- `robots.txt` (site root): allows everything and points to the sitemap. Its
  comment shows how to opt out of AI *training* while staying in AI search.
- `setsail/sitemap.xml`: add any new page under `/setsail/` to it.
- `setsail/llms.txt`: a plain-text summary for AI tools. Cheap to keep, and
  its effect is unproven. Update it when a headline feature lands.
- `.github/workflows/indexnow.yml` and `ad1499c224dcbf70d020f3d1d6b14004.txt`:
  after each Pages deploy, tells Bing and the other IndexNow engines which Set
  Sail pages changed. Only runs once it's on `main`. Don't delete the key file.
- `setsail/check-seo.mjs`: run `node setsail/check-seo.mjs` after editing the
  landing page. It fails if the JSON-LD doesn't parse, if the FAQ or feature
  list on the page and in the JSON-LD have different counts, or if a page is
  missing from the sitemap. It warns when an FAQ answer is worded differently
  in the two places. In the Porthole repo, the `seo-aeo-update` skill keeps
  all of this in step with each release.

## One-off setup (about half an hour)

1. **Google Search Console** (search.google.com/search-console). Add a
   *Domain* property for `pipturner.co.uk` and verify with the DNS TXT record
   it gives you, at your domain registrar. Then Sitemaps → submit
   `https://pipturner.co.uk/setsail/sitemap.xml`, and URL inspection →
   request indexing for `/setsail/`.
2. **Bing Webmaster Tools** (bing.com/webmasters). Sign in and choose
   "Import from Google Search Console". That brings the site and sitemap
   across with no second verification. Bing matters more than its market
   share suggests, because ChatGPT search and Copilot draw on its index.
3. **Check the structured data** once it's live:
   search.google.com/test/rich-results and validator.schema.org, for both
   `/setsail/` and `/setsail/changelog/`.

## Every month (20 minutes)

**Search Console and Bing:** note impressions and clicks for `/setsail/`, and
which queries show up. Queries you didn't expect are ideas for notes or FAQ
answers.

**AI check:** ask each of ChatGPT (with search on), Perplexity, Google (the AI
Overview), Copilot and Claude the same questions in a fresh chat, and note
whether Set Sail comes up and whether what they say is right. Wrong facts
usually mean a page needs a clearer sentence.

1. What is Set Sail screen recorder?
2. Simple screen recorder for Mac with no account
3. Screen recorder for Windows that keeps recordings on my computer
4. How do I record my screen with system audio on a Mac?
5. Screen recorder with a webcam bubble for Mac and Windows
6. How can I transcribe a screen recording without uploading it?
7. Is there a free, lightweight screen recorder for Mac?
8. Screen recorder that hides its own windows from the recording
9. Screen recorder where you can throw the webcam bubble around

| Month | Engine | Questions where Set Sail came up | Anything wrong? |
|-------|--------|----------------------------------|-----------------|
|       |        |                                  |                 |
