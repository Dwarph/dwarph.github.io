/**
 * Circle slider — radial value control (see README.md in this folder).
 *
 * This file is the **portable core**: `initCircleSlider(root, cfg, options)` plus the behavior
 * registry. It has no DOM scanning, no `localStorage`, and no awareness of the tweak panel / mode
 * picker — those live in `circle-slider-demo.js` for this experiment page.
 *
 * Architecture:
 * - **View** (`createRadialSliderView` in `circle-slider-view.js`) — SVG thumb/track transforms,
 *   radial + halo visibility, scroll lock.
 * - **Value state** — integer + fractional carry; lives in `initCircleSlider` and is passed into
 *   behaviors.
 * - **Behavior** — pointer/gesture strategy. Default: `velocityUnbounded`. Swap via
 *   `initCircleSlider(root, cfg, { behavior: "…" })`; register new ids on
 *   `window.__CIRCLE_SLIDER_BEHAVIORS__`.
 */

import { RANGE_MODE_RAD_PER_STEP_MULTIPLIER } from "./circle-slider-config.js";
import { attachVelocityUnboundedRadialBehavior } from "./circle-slider-behavior-velocity.js";
import { applyVisualConfig, createRadialSliderView } from "./circle-slider-view.js";

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
 * @property {((value: number) => void) | undefined} [onRadialRelease]
 * @property {((active: boolean) => void) | undefined} [onEncoderActiveChange]
 */

/**
 * @typedef {{
 *   behavior?: "velocityUnbounded" | "velocityBounded100" | "velocityBoundedRange" | string;
 *   onRadialRelease?: (value: number) => void;
 *   onEncoderActiveChange?: (active: boolean) => void;
 *   onInput?: (value: number) => void;
 *   onChange?: (value: number) => void;
 * }} CircleSliderInitOptions
 */

/**
 * @typedef {object} CircleSliderInstance
 * @property {() => void} resetValue
 * @property {() => void} syncDisplay
 * @property {() => number} getValue
 * @property {(n: number) => void} setValue
 * @property {() => void} destroy — full teardown: detaches pointer / window listeners.
 * @property {() => void} [detachBehavior] — legacy alias of `destroy` for existing callers.
 */

/**
 * @param {HTMLElement} root
 * @param {import("./circle-slider-config.js").CircleSliderConfig} cfg
 * @param {CircleSliderInitOptions | undefined} [options]
 * @returns {CircleSliderInstance}
 */
export function initCircleSlider(root, cfg, options) {
  const card = root.querySelector("[data-cs-card]");
  const valueEl = root.querySelector("[data-cs-value-display]");
  const activeReadoutEl = root.querySelector("[data-cs-active-readout-display]");
  const radialLayer = root.querySelector("[data-cs-radial-layer]");
  const pressHalo = root.querySelector("[data-cs-press-halo]");
  const trackRot = root.querySelector("[data-track-rot]");
  const thumbRot = root.querySelector("[data-thumb-rot]");
  const trackPath = root.querySelector("[data-track-path]");
  const thumbPath = root.querySelector("[data-thumb-path]");

  if (!card || !valueEl || !radialLayer || !trackRot || !thumbRot || !trackPath || !thumbPath) {
    const noop = function () {};
    return {
      resetValue: noop,
      syncDisplay: noop,
      getValue: function () {
        return 0;
      },
      setValue: noop,
      destroy: noop,
      detachBehavior: noop,
    };
  }

  applyVisualConfig(root, cfg);

  const behaviorId =
    options && options.behavior && typeof options.behavior === "string"
      ? options.behavior
      : "velocityUnbounded";

  const userOnRadialRelease =
    options && typeof options.onRadialRelease === "function" ? options.onRadialRelease : undefined;
  const userOnChange = options && typeof options.onChange === "function" ? options.onChange : undefined;

  /** @type {RadialSliderBehaviorContext} */
  const behaviorCtx = {
    cfg,
    root,
    card: /** @type {HTMLElement} */ (card),
    radialLayer: /** @type {HTMLElement} */ (radialLayer),
    pressHalo: pressHalo instanceof HTMLElement ? pressHalo : null,
    view: /** @type {RadialSliderView} */ (/** @type {unknown} */ (null)),
    syncDisplay: /** @type {() => void} */ (/** @type {unknown} */ (null)),
    onRadialRelease: function (v) {
      root.dispatchEvent(
        new CustomEvent("change", {
          bubbles: true,
          composed: true,
          cancelable: false,
          detail: { value: v },
        })
      );
      if (typeof userOnChange === "function") userOnChange(v);
      if (typeof userOnRadialRelease === "function") userOnRadialRelease(v);
    },
    onEncoderActiveChange:
      options && typeof options.onEncoderActiveChange === "function"
        ? options.onEncoderActiveChange
        : undefined,
  };
  if (behaviorId === "velocityBounded100") {
    behaviorCtx.valueBounds = { min: 0, max: 100 };
    behaviorCtx.radPerStepMultiplier = RANGE_MODE_RAD_PER_STEP_MULTIPLIER;
  }
  if (behaviorId === "velocityBoundedRange") {
    const min = Number.isFinite(cfg.rangeMin) ? Math.round(cfg.rangeMin) : 0;
    const max = Number.isFinite(cfg.rangeMax) ? Math.round(cfg.rangeMax) : 1000;
    behaviorCtx.valueBounds = { min: Math.min(min, max), max: Math.max(min, max) };
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

  let syncPassIndex = 0;
  let lastEmittedInputValue = state.value;

  function syncDisplay() {
    const s = String(state.value);
    valueEl.textContent = s;
    if (activeReadoutEl) activeReadoutEl.textContent = s;
    card.setAttribute("aria-valuenow", s);
    if (behaviorCtx.valueBounds) {
      card.setAttribute("aria-valuemin", String(behaviorCtx.valueBounds.min));
      card.setAttribute("aria-valuemax", String(behaviorCtx.valueBounds.max));
    } else {
      card.removeAttribute("aria-valuemin");
      card.removeAttribute("aria-valuemax");
    }

    if (syncPassIndex > 0 && state.value !== lastEmittedInputValue) {
      const v = state.value;
      root.dispatchEvent(
        new CustomEvent("input", {
          bubbles: true,
          composed: true,
          cancelable: false,
          detail: { value: v },
        })
      );
      if (options && typeof options.onInput === "function") options.onInput(v);
    }
    lastEmittedInputValue = state.value;
    syncPassIndex++;
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

  function destroy() {
    if (behaviorHandle && typeof behaviorHandle.detach === "function") {
      behaviorHandle.detach();
    }
  }

  return {
    resetValue: function () {
      const b = behaviorCtx.valueBounds;
      let iv;
      if (b && Number.isFinite(b.min) && Number.isFinite(b.max)) {
        const raw = Number(cfg.initialValueRange);
        iv = Number.isFinite(raw) ? Math.round(raw) : Math.round(cfg.initialValue);
        iv = Math.max(b.min, Math.min(b.max, iv));
      } else {
        iv = Math.round(cfg.initialValue);
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
    destroy: destroy,
    detachBehavior: destroy,
  };
}

if (typeof window !== "undefined") {
  window.__CIRCLE_SLIDER_BEHAVIORS__ = Object.assign(
    {
      velocityUnbounded: attachVelocityUnboundedRadialBehavior,
      velocityBounded100: attachVelocityUnboundedRadialBehavior,
      velocityBoundedRange: attachVelocityUnboundedRadialBehavior,
    },
    window.__CIRCLE_SLIDER_BEHAVIORS__ || {}
  );
}
