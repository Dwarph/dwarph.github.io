# Fry shower

Uses the [circle slider](../circle-slider/) control with copy **“How many chips?”** On release after spinning the dial, **fries** spawn (count follows the current value, capped per burst). They **fall from the top** with simple downward acceleration and **exit off the bottom** — no collisions or stacking — in [`fry-shower-fries.js`](fry-shower-fries.js) (art: [`assets/fry.svg`](assets/fry.svg)); the world caps at **`maxConcurrent`** (default **250**) live fries at once; any extra from a release stays **queued** and spawns as slots open, so you always get the **full dial count**.

Shared behaviour hook: `onRadialRelease` in [`circle-slider.js`](../circle-slider/circle-slider.js) / [`circle-slider-behavior-velocity.js`](../circle-slider/circle-slider-behavior-velocity.js).

## Simulation parameters

Defaults (burst cap, stagger, max concurrent fries, sizes, motion, etc.) live in **`createDefaultFrySimParams()`** in [`fry-shower-fries.js`](fry-shower-fries.js). Edit that function to change behaviour.
