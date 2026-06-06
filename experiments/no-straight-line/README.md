# No straight line

Interactive recreation of [Figma Frame 46](https://www.figma.com/design/p7YG1f3dZ5bGNPRePeIo50/Creative-Studio?node-id=4292-33511) — drag each word; lime ropes pull the chain with a light Verlet sim.

**URL:** `/experiments/no-straight-line/`

## Stack

- Vanilla ESM (no build step)
- Custom Verlet ropes + DOM words (`no-straight-line-rope.js`, `no-straight-line-layout.js`)
- Canvas strokes for ropes; Barlow 600 + `#2996ff` poster from Creative Studio

## Tuning

Edit `createDefaultParams()` in `no-straight-line-config.js` and `createDefaultRopeParams()` in `no-straight-line-rope.js`.

Ropes stretch softly while you drag. After you let go, words slowly drift home; the scene sleeps once they settle.

## Assets

- `assets/bg-contours.png` — topographic background (1080×1350 export from Figma Vertical Map)
- `assets/bg-contours@2x.png` — 2× retina variant (2160×2700)
- `assets/rope-*.svg` — reference paths used to seed particle layouts
