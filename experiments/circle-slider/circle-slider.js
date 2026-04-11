/**
 * Circle slider — radial value control (see README.md in this folder).
 *
 * Architecture:
 * - **View** (`createRadialSliderView` in circle-slider-view.js) — SVG thumb/track transforms, radial + halo, scroll lock.
 * - **Value state** — integer + fractional carry; lives in `initCircleSlider` and is passed into behaviors.
 * - **Behavior** — pointer/gesture strategy. Default: **`velocityUnbounded`** (encoder: cumulative angle
 *   delta × velocity, unbounded integer). Swap via `initCircleSlider(root, cfg, { behavior: "…" })`;
 *   register new ids on `window.__CIRCLE_SLIDER_BEHAVIORS__` (e.g. absolute angle → bounded value later).
 *
 * Mutable config + optional localStorage; tweak panel at bottom of page.
 */

import {
  DEFAULT_CONFIG,
  loadStoredConfig,
  normalizeRuntimeConfig,
  RANGE_MODE_RAD_PER_STEP_MULTIPLIER,
} from "./circle-slider-config.js";
import { attachVelocityUnboundedRadialBehavior } from "./circle-slider-behavior-velocity.js";
import { applyVisualConfig, createRadialSliderView } from "./circle-slider-view.js";
import { initModePicker } from "./circle-slider-mode-picker.js";
import { initTweakPanel } from "./circle-slider-tweak-panel.js";

/**
 * @typedef {object} RadialSliderValueState
 * @property {number} value
 * @property {number} valueAcc
 */

/**
 * @typedef {import("./circle-slider-view.js").RadialSliderView} RadialSliderView
 */

/**
 * @typedef {object} RadialSliderBehaviorContext
 * @property {import("./circle-slider-config.js").CircleSliderConfig} cfg
 * @property {HTMLElement} root
 * @property {HTMLElement} card
 * @property {HTMLElement} radialLayer
 * @property {HTMLElement | null} pressHalo
 * @property {RadialSliderView} view
 * @property {() => void} syncDisplay
 * @property {{ min: number; max: number } | null | undefined} valueBounds
 * @property {number | undefined} radPerStepMultiplier
 */

/**
 * @typedef {{ behavior?: string }} CircleSliderInitOptions
 */

/**
 * @param {HTMLElement} root
 * @param {import("./circle-slider-config.js").CircleSliderConfig} cfg
 * @param {CircleSliderInitOptions | undefined} options
 * @returns {{ resetValue: () => void; syncDisplay: () => void; getValue: () => number; setValue: (n: number) => void; detachBehavior?: () => void }}
 */
function initCircleSlider(root, cfg, options) {
  const card = root.querySelector("[data-cs-card]");
  const valueEl = root.querySelector("[data-cs-value-display]");
  const radialLayer = root.querySelector("[data-cs-radial-layer]");
  const pressHalo = root.querySelector("[data-cs-press-halo]");
  const trackRot = root.querySelector("[data-track-rot]");
  const thumbRot = root.querySelector("[data-thumb-rot]");
  const trackPath = root.querySelector("[data-track-path]");
  const thumbPath = root.querySelector("[data-thumb-path]");

  if (!card || !valueEl || !radialLayer || !trackRot || !thumbRot || !trackPath || !thumbPath) {
    return {
      resetValue: function () {},
      syncDisplay: function () {},
      getValue: function () {
        return 0;
      },
      setValue: function () {},
    };
  }

  applyVisualConfig(root, cfg);

  const behaviorId =
    options && options.behavior && typeof options.behavior === "string"
      ? options.behavior
      : "velocityUnbounded";

  /** @type {RadialSliderBehaviorContext} */
  const behaviorCtx = {
    cfg,
    root,
    card: /** @type {HTMLElement} */ (card),
    radialLayer: /** @type {HTMLElement} */ (radialLayer),
    pressHalo: pressHalo instanceof HTMLElement ? pressHalo : null,
    view: /** @type {RadialSliderView} */ (/** @type {unknown} */ (null)),
    syncDisplay: /** @type {() => void} */ (/** @type {unknown} */ (null)),
  };
  if (behaviorId === "velocityBounded100") {
    behaviorCtx.valueBounds = { min: 0, max: 100 };
    behaviorCtx.radPerStepMultiplier = RANGE_MODE_RAD_PER_STEP_MULTIPLIER;
  }

  /** @type {RadialSliderValueState} */
  const state = {
    value: (function () {
      const b = behaviorCtx.valueBounds;
      const raw =
        b && Number.isFinite(b.min) && Number.isFinite(b.max)
          ? cfg.initialValueRange
          : cfg.initialValue;
      const iv = Math.round(Number(raw));
      if (b && Number.isFinite(b.min) && Number.isFinite(b.max)) {
        return Math.max(b.min, Math.min(b.max, iv));
      }
      return iv;
    })(),
    valueAcc: 0,
  };

  function syncDisplay() {
    valueEl.textContent = String(state.value);
    card.setAttribute("aria-valuenow", String(state.value));
    if (behaviorCtx.valueBounds) {
      card.setAttribute("aria-valuemin", String(behaviorCtx.valueBounds.min));
      card.setAttribute("aria-valuemax", String(behaviorCtx.valueBounds.max));
    } else {
      card.removeAttribute("aria-valuemin");
      card.removeAttribute("aria-valuemax");
    }
  }

  const view = createRadialSliderView({
    radialLayer: /** @type {HTMLElement} */ (radialLayer),
    pressHalo: pressHalo instanceof HTMLElement ? pressHalo : null,
    thumbRot,
    trackRot,
  });

  behaviorCtx.view = view;
  behaviorCtx.syncDisplay = syncDisplay;

  syncDisplay();

  const w = typeof window !== "undefined" ? window : undefined;
  const registry =
    w && w.__CIRCLE_SLIDER_BEHAVIORS__
      ? w.__CIRCLE_SLIDER_BEHAVIORS__
      : { velocityUnbounded: attachVelocityUnboundedRadialBehavior };
  const attachBehavior =
    typeof registry[behaviorId] === "function" ? registry[behaviorId] : attachVelocityUnboundedRadialBehavior;
  const behaviorHandle = attachBehavior(behaviorCtx, state);

  return {
    resetValue: function () {
      let iv = Math.round(cfg.initialValue);
      const b = behaviorCtx.valueBounds;
      if (b && Number.isFinite(b.min) && Number.isFinite(b.max)) {
        iv = Math.max(b.min, Math.min(b.max, iv));
      }
      state.value = iv;
      state.valueAcc = 0;
      syncDisplay();
    },
    syncDisplay: syncDisplay,
    getValue: function () {
      return state.value;
    },
    /**
     * @param {number} n
     */
    setValue: function (n) {
      const v = Math.round(Number(n));
      if (!Number.isFinite(v)) return;
      const b = behaviorCtx.valueBounds;
      state.value =
        b && Number.isFinite(b.min) && Number.isFinite(b.max) ? Math.max(b.min, Math.min(b.max, v)) : v;
      state.valueAcc = 0;
      syncDisplay();
    },
    detachBehavior: function () {
      if (behaviorHandle && typeof behaviorHandle.detach === "function") {
        behaviorHandle.detach();
      }
    },
  };
}

if (typeof window !== "undefined") {
  window.__CIRCLE_SLIDER_BEHAVIORS__ = Object.assign(
    {
      velocityUnbounded: attachVelocityUnboundedRadialBehavior,
      velocityBounded100: attachVelocityUnboundedRadialBehavior,
    },
    window.__CIRCLE_SLIDER_BEHAVIORS__ || {}
  );
}

const stored = loadStoredConfig();
/** @type {import("./circle-slider-config.js").CircleSliderConfig} */
const cfg = Object.assign({}, DEFAULT_CONFIG, stored || {});
normalizeRuntimeConfig(cfg);

const root = document.getElementById("circle-slider");
const rangeRoot = document.getElementById("circle-slider-range");
const panel = document.getElementById("cs-tweak-panel");

if (root) {
  const api = initCircleSlider(root, cfg);
  /** @type {{ resetValue: () => void; syncDisplay: () => void; getValue: () => number; setValue: (n: number) => void; detachBehavior?: () => void } | null} */
  let rangeApi = null;
  if (rangeRoot instanceof HTMLElement) {
    rangeApi = initCircleSlider(rangeRoot, cfg, { behavior: "velocityBounded100" });
  }
  window.__CIRCLE_SLIDER_CONFIG__ = cfg;
  window.__CIRCLE_SLIDER__ = {
    config: cfg,
    resetValue: api.resetValue,
    getValue: api.getValue,
    setValue: api.setValue,
    rangeResetValue: rangeApi ? rangeApi.resetValue : undefined,
    rangeGetValue: rangeApi ? rangeApi.getValue : undefined,
    rangeSetValue: rangeApi ? rangeApi.setValue : undefined,
  };

  initModePicker(api, rangeApi);

  if (panel) {
    initTweakPanel(panel, cfg, root, api, rangeRoot instanceof HTMLElement ? rangeRoot : null, rangeApi);
  }
}
