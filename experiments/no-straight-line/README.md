# No straight line

Interactive recreation of [Figma Frame 46](https://www.figma.com/design/p7YG1f3dZ5bGNPRePeIo50/Creative-Studio?node-id=4292-33511) — drag each word; lime ropes pull the chain with a light Verlet sim.

**URL:** `/experiments/no-straight-line/`

## Stack

- Vanilla ESM (no build step)
- Custom Verlet ropes + DOM words (`no-straight-line-rope.js`, `no-straight-line-layout.js`)
- Canvas strokes for ropes; Barlow 600 + `#2996ff` poster from Creative Studio

## Tuning

Edit `createDefaultRopeParams()` in `no-straight-line-rope.js`:

| Param | Role |
|-------|------|
| `wordDamping` | Word glide after release (higher = less friction) |
| `ropeDamping` | Interior rope point drift |
| `wordPull` | How much rope tension tugs neighboring words |
| `ropeStiffness` | Lower = stretchier ropes |
| `constraintIterations` | Rope solver passes while moving |
| `maxReleaseSpeed` | Cap throw velocity from pointer |
| `sleepSpeed` | Below this, the scene freezes (still by default) |

Words stay where you leave them; no spring back to the Figma layout. Ropes stretch softly while you drag; everything goes still once motion dies down.

## Assets

- `assets/bg-contours.png` — topographic overlay (from Figma Vertical Map)
- `assets/rope-*.svg` — reference paths used to seed particle layouts
