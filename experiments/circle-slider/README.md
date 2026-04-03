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

7. **Value integration** — Each move applies the **shortest** angular delta between frames (wrap-safe across ±π). That delta is scaled by a **velocity multiplier** unless angular speed is below **`velocityBoostMinOmegaRadPerMs`** (then multiplier stays **1**). Optionally **`minOmegaRadPerMs`** blocks all value change when slower than that threshold, and **`minAngleDeltaDeg`** drops tiny per-frame moves. Fractional accumulation is kept internal so the displayed value stays an **integer**.

8. **No value change before activation** — If the pointer **releases** before crossing the activation radius, the integer **does not** change.

9. **Reduced motion** — `prefers-reduced-motion: reduce` short-circuits long transitions and removes blur (opacity-only).

## Files

| File | Role |
|------|------|
| `index.html` | Markup: prompt, value card, SVG radial |
| `circle-slider.css` | Layout, radial placement, blur-fade transitions |
| `circle-slider.js` | Pointer logic, tweak panel, `localStorage`, live config |
| `README.md` | This document |

## Configuration

Defaults live in **`DEFAULT_CONFIG`** at the top of `circle-slider.js`. Change values there and refresh the page.

| Option | Default | Meaning |
|--------|---------|---------|
| `initialValue` | `114` | Starting integer |
| `activationRadiusPx` | `10` | Drag distance from initial press before engage |
| `rotationOrigin` | `'cardCenter'` | `'cardCenter'` \| `'initialPress'` |
| `maskDeadzoneDeg` | `15` | Track rotation lags thumb until separation exceeds this |
| `radPerStep` | `0.14` | ~Radians of rotation (at velocity multiplier 1) per unit of accumulation before integer steps |
| `velocityOmegaRefRadPerMs` | `0.0035` | Scale for “how fast is fast” angular velocity |
| `velocityGainK` | `2.25` | How much extra gain velocity adds before cap |
| `velocityGainMaxExtra` | `5` | Cap on extra velocity multiplier |
| `velocityBoostMinOmegaRadPerMs` | `0` | **0** = always apply velocity boost; else below this angular speed use multiplier **1** only |
| `minOmegaRadPerMs` | `0` | **0** = off; below this angular speed, **no** integer change (thumb/arc still move) |
| `minAngleDeltaDeg` | `0` | **0** = off; ignore per-frame \|Δθ\| smaller than this (jitter filter) |
| `appearDurationMs` | `300` | Radial show duration |
| `hideDurationMs` | `240` | Radial hide duration |
| `blurAppearPx` | `14` | Blur tuning (paired with `blurHidePx`) |
| `blurHidePx` | `14` | Blur tuning (paired with `blurAppearPx`) |
| `thumbArcDeg` | `16` | Angular thickness of the dark thumb stroke |
| `trackRadius` | `78` | SVG semicircle radius in viewBox units |

The blurred “rest” state uses **`max(blurAppearPx, blurHidePx)`** as `--cs-blur-rest` so you can keep both knobs without the hidden state looking weaker than intended.

The grey track stroke uses a **horizontal linear gradient** in the track’s local space (inside the rotating group) so opacity **ramps to 0 at the arc endpoints** (~22%–78% fully opaque by default). Adjust the `<stop offset="…"/>` values in `index.html` if you want a longer or shorter fade.

### Tweak panel (bottom of page)

A **collapsible bar** exposes the same options as sliders/inputs. Changes apply **live** (no reload). Settings are **saved to `localStorage`** under `dwarph.io.experiments.circleSlider.config.v1` (debounced). **Reset all settings** clears storage and restores `DEFAULT_CONFIG`. **Reset value** sets the displayed integer to **Reset target** (`initialValue`) and clears fractional carry.

`window.__CIRCLE_SLIDER_CONFIG__` still references the live config object; `window.__CIRCLE_SLIDER__.resetValue()` resets the number only.

## Accessibility notes

The value is exposed as a `role="spinbutton"` with `aria-valuenow`. There is **no** `aria-valuemin` / `aria-valuemax` (unbounded). Keyboard nudging is not implemented in this experiment.

## Possible follow-ups

- Keyboard / step helpers for the same control  
- Optional haptics on integer change (where supported)  
