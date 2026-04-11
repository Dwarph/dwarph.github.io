# Circle slider experiment

Encoder-style control: the value is **unbounded integers**, driven by **cumulative rotation** after activation (not by angle mapped to min/max). Reference layout and arc language: [Figma — iPhone frame / arc](https://www.figma.com/design/Vj1RvBCSefbqN2cg0JncY1/Untitled?node-id=1-327).

## Behaviour (agreed plan)

1. **Pointer input** — Uses **Pointer Events** with `setPointerCapture` on the value card so **mouse, pen, and touch** share one implementation (good for desktop testing).

2. **Activation** — On `pointerdown`, record the **initial press point**. The rotational control **does nothing** until the pointer moves farther than **`activationRadiusPx`** from that point (small default, fully configurable). This avoids accidental value changes from press wobble.

3. **After activation** — The **radial UI** (gray track + dark thumb segment) **appears** with a **blur + opacity** transition. **Releasing** the pointer runs a matching **blur-fade-out**.

4. **Rotation origin (configurable)** — Angle for `atan2` uses either:
   - **`cardCenter`** — pivot at the center of the value card’s bounding box (default knob feel), or  
   - **`initialPress`** — pivot at the first `pointerdown` position (alternative feel; try both and pick).

5. **Direction** — **Clockwise** motion **increases** the integer; **anticlockwise** **decreases** it (using the browser’s `atan2(dy, dx)` convention with +Y down).

6. **Thumb vs track** — The **dark segment** follows the **pointer angle** immediately. The **gray track** is a fixed semicircle in local SVG space; its **bisector** (middle of the arc) is kept aligned with an **`arcCenterAngle`** that **lags** the thumb by **`maskDeadzoneDeg`**. On **activation**, `arcCenterAngle` is set to the thumb angle so the arc is **centred on the initial thumb direction**. The track group uses a fixed offset from `arcCenterAngle` (including a **π flip** so SVG/screen space matches `atan2`, not the arc facing 180° wrong).

7. **Value integration** — Each move applies the **shortest** angular delta between frames (wrap-safe across ±π), scaled by a **velocity multiplier** (tweak panel: **flick boost** + defaults in `DEFAULT_CONFIG` in `circle-slider-config.js` for reference ω, gain *k*, optional floors / jitter filters). Fractional accumulation stays internal so the displayed value stays an **integer**.

8. **No value change before activation** — If the pointer **releases** before crossing the activation radius, the integer **does not** change.

9. **Reduced motion** — `prefers-reduced-motion: reduce` short-circuits long transitions and removes blur (opacity-only).

## Files

| File | Role |
|------|------|
| `index.html` | Markup: prompt, value card, SVG radial |
| `circle-slider.css` | Layout, radial placement, blur-fade transitions |
| `circle-slider.js` | Entry (ES module): boot, `initCircleSlider`, `window.__CIRCLE_SLIDER__` |
| `circle-slider-config.js` | `DEFAULT_CONFIG`, `localStorage` load/save, runtime normalisation |
| `circle-slider-math.js` | Geometry helpers, velocity multiplier, arc path builders |
| `circle-slider-view.js` | `applyVisualConfig`, `createRadialSliderView` |
| `circle-slider-behavior-velocity.js` | `attachVelocityUnboundedRadialBehavior` (encoder + bounded slip) |
| `circle-slider-tweak-panel.js` | Tweak panel wiring |
| `circle-slider-mode-picker.js` | Standard / range mode UI |
| `README.md` | This document |

## Architecture (view vs behaviour)

The scripts split the control into:

1. **View** — `createRadialSliderView(...)`: SVG thumb/track transforms, radial layer + press halo visibility, page scroll lock. Shared by all interaction styles.
2. **Value state** — `{ value, valueAcc }` owned by `initCircleSlider`; behaviours read/update it and call `syncDisplay()`.
3. **Behaviour** — pointer / gesture strategy, registered by string id. Default: **`velocityUnbounded`** (`attachVelocityUnboundedRadialBehavior`): the encoder described in *Behaviour (agreed plan)* below (velocity-scaled deltas, unbounded integer).

**Adding another behaviour** (e.g. absolute angle → bounded value): implement a function with the same signature as `attachVelocityUnboundedRadialBehavior(ctx, state)` returning `{ detach() }`. The script assigns **`window.__CIRCLE_SLIDER_BEHAVIORS__`** on load (merging in `velocityUnbounded`). Register **before** `circle-slider.js` by setting `window.__CIRCLE_SLIDER_BEHAVIORS__`, or **after** load by extending the map:

```js
window.__CIRCLE_SLIDER_BEHAVIORS__ = Object.assign(window.__CIRCLE_SLIDER_BEHAVIORS__ || {}, {
  myAbsolute: function (ctx, state) {
    /* …attach listeners, return… */
    return { detach: function () { /* remove listeners */ } };
  },
});
```

Then `initCircleSlider(root, cfg, { behavior: "myAbsolute" })`. The default boot path still uses `velocityUnbounded`. `api.detachBehavior()` is available if you need to tear down and re-init with another behavior.

## Configuration

Defaults live in **`DEFAULT_CONFIG`** in `circle-slider-config.js`. The **tweak panel** exposes a short set; everything else is still in **`DEFAULT_CONFIG`** if you want to edit the file.

**Tweak panel (live + `localStorage`):** circle **size** (`trackRadius`), **grey / black stroke widths** (`trackStrokeWidth`, `thumbStrokeWidth`), **thumb span** (`thumbArcDeg`), **one fade duration** (sets both `appearDurationMs` and `hideDurationMs`), **one blur** (sets both `blurAppearPx` and `blurHidePx`), **sensitivity** (`radPerStep`), **flick boost** (`velocityGainMaxExtra`), **activation** drag, **pivot**, **arc lag**.

**Code-only in `DEFAULT_CONFIG` (defaults shown):** `velocityOmegaRefRadPerMs`, `velocityGainK`, `velocityBoostMinOmegaRadPerMs`, `minOmegaRadPerMs`, `minAngleDeltaDeg`.

| Option | Default | Meaning |
|--------|---------|---------|
| `trackRadius` | `78` | Semicircle radius (SVG units) |
| `trackStrokeWidth` | `3` | Grey arc stroke width |
| `thumbStrokeWidth` | `7` | Black thumb stroke width |
| `thumbArcDeg` | `16` | Angular length of thumb along the ring |
| `appearDurationMs` / `hideDurationMs` | `300` | Radial show/hide (panel keeps them equal) |
| `blurAppearPx` / `blurHidePx` | `14` | Blur for fade (panel keeps them equal) |
| `radPerStep` | `0.14` | Radians per step at multiplier 1 (lower → more sensitive) |
| `velocityGainMaxExtra` | `5` | Extra velocity multiplier cap (flick boost) |
| … | … | See `DEFAULT_CONFIG` for the full list |

The blurred “rest” state uses **`max(blurAppearPx, blurHidePx)`** as `--cs-blur-rest`.

The grey track stroke uses a **horizontal linear gradient** in the track’s local space (inside the rotating group) so opacity **ramps to 0 at the arc endpoints** (~22%–78% fully opaque by default). Adjust the `<stop offset="…"/>` values in `index.html` if you want a longer or shorter fade.

### Mobile / touch

- **`touch-action: none`** on the value card and card stack so the browser does not steal the gesture for scroll.
- **Scroll lock** while pressing: **`overflow: hidden`** on **`html`** and **`body`** (no **`position: fixed`** on the body, so the scrollbar does not disappear and the layout does not jump sideways). **`overscroll-behavior: none`** on **`html`** still targets **Chrome pull-to-refresh**. **`window` `pointermove`** uses **`preventDefault`** for the active gesture to block touch scrolling on the page.
- **`pointermove` / `pointerdown`** use `{ passive: false }` and **`preventDefault`** on moves so scrolling does not win.
- **Window-level** `pointermove` / `pointerup` / `pointercancel` during a gesture so behaviour still works if **`setPointerCapture`** fails (common on some iOS builds).
- **Layout**: **`main`** is a flex column with **`min-height`** tied to the viewport so **`.cs-stage`** can **`flex: 1`** and vertically centre the control; the empty **Figma slot** is **`display: none`** so it never shifts the group sideways on wide screens. Radial uses **`translateZ(0)`**, **`-webkit-filter`**, and **visibility** timing to avoid invisible SVG/blur glitches on WebKit.

### Tweak panel (bottom of page)

A **collapsible bar** exposes a **reduced** set of sliders (see above); changes apply **live**. Settings save to **`localStorage`** (`dwarph.io.experiments.circleSlider.config.v1`, debounced). **Reset all** restores **`DEFAULT_CONFIG`**. **Reset value** uses **Reset target** (`initialValue`) and clears fractional carry.

`window.__CIRCLE_SLIDER_CONFIG__` still references the live config object; `window.__CIRCLE_SLIDER__.resetValue()` resets the number only.

## Accessibility notes

The value is exposed as a `role="spinbutton"` with `aria-valuenow`. There is **no** `aria-valuemin` / `aria-valuemax` (unbounded). Keyboard nudging is not implemented in this experiment.

## Possible follow-ups

- Keyboard / step helpers for the same control  
- Optional haptics on integer change (where supported)  
