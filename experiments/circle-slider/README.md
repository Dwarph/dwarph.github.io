# Circle slider

Encoder-style control: **unbounded integers** from **cumulative rotation** after you drag past a small activation radius (not angle → min/max). Visual reference: [Figma — arc layout](https://www.figma.com/design/Vj1RvBCSefbqN2cg0JncY1/Untitled?node-id=1-327).

## Try it

Open `index.html` in a browser (or serve the folder). Use the tweak panel at the bottom for live settings (saved to `localStorage`).

## Behaviour (short)

- Pointer Events on the value card; radial UI fades in after activation, out on release.
- Clockwise increases the value, anticlockwise decreases; shortest angular delta between frames, velocity scaling for flicks.
- `prefers-reduced-motion: reduce` reduces motion and blur.

## Code

| Area | Where |
|------|--------|
| Init API | `circle-slider.js` — `initCircleSlider`, `window.__CIRCLE_SLIDER_BEHAVIORS__` |
| Config defaults | `circle-slider-config.js` — `DEFAULT_CONFIG` |
| Stage markup (SVG + card) | `circle-slider-stage.js` |
| Velocity / encoder behaviour | `circle-slider-behavior-velocity.js` |
| Demo page only | `circle-slider-demo.js` |
| Optional `<circle-slider>` | `circle-slider-element.js`, `registerCircleSliderElement()` |
| Public exports | `circle-slider-bundle-entry.js` |

Extend or swap interaction by registering a behaviour with the same shape as `attachVelocityUnboundedRadialBehavior`, then `initCircleSlider(root, cfg, { behavior: "…" })`.

**Events:** `input` when the integer changes; `change` when the gesture commits. Import from `circle-slider-bundle-entry.js` for `initCircleSlider`, `renderCircleSliderStage`, `DEFAULT_CONFIG`, `registerCircleSliderElement`, etc.

**Package:** `package.json` has `exports` for a future publish; it is `"private": true` for now.

**Accessibility:** Value is `role="spinbutton"` with `aria-valuenow`; unbounded so no min/max. No keyboard nudging in this experiment.
