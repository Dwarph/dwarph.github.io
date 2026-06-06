# No straight line

Interactive recreation of [Figma Frame 46](https://www.figma.com/design/p7YG1f3dZ5bGNPRePeIo50/Creative-Studio?node-id=4292-33511) — drag each word; lime ropes pull the chain with a light Verlet sim.

**URL:** `/experiments/no-straight-line/`

## Stack

- Vanilla ESM (no build step)
- Custom Verlet ropes + DOM words (`no-straight-line-rope.js`, `no-straight-line-layout.js`)
- Canvas strokes for ropes; Barlow 600 + `#2996ff` poster from Creative Studio

## Tuning

Open **Tweak physics** at the bottom of the page, or edit `createDefaultParams()` in `no-straight-line-config.js`. Settings persist in `localStorage`.

| Param | Role |
|-------|------|
| `ropeParticleCount` | Points per rope path (rebuilds layout when changed) |
| `wordDamping` | Word glide after release (higher = less friction) |
| `ropeDamping` | Interior rope point drift |
| `wordPull` | How much rope tension tugs neighboring words |
| `ropeStiffness` | Lower = stretchier ropes |
| `constraintIterations` | Rope solver passes while moving |
| `maxReleaseSpeed` | Cap throw velocity from pointer |
| `sleepSpeed` | Below this, the scene freezes (still by default) |
| `homeSpring` | Drift speed back toward the Figma layout (~0.4 ≈ a few seconds) |
| `homeSnapDistance` | Snap to rest when closer than this (px) |

Ropes stretch softly while you drag. After you let go, words slowly drift home; the scene sleeps once they settle.

## Assets

- `assets/bg-contours.png` — topographic background (1080×1350 export from Figma Vertical Map)
- `assets/bg-contours@2x.png` — 2× retina variant (2160×2700)
- `assets/rope-*.svg` — reference paths used to seed particle layouts
