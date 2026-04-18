/**
 * Circle slider — experiment page bootstrap.
 *
 * This file is **demo-only**: it builds the stage markup for Standard and Range, loads / saves
 * config to `localStorage`, wires the mode picker and tweak panel, and exposes the debug globals.
 * The portable core (`initCircleSlider`) lives in `circle-slider.js` and has no awareness of any
 * of this.
 */

import { initCircleSlider } from "./circle-slider.js";
import {
  DEFAULT_CONFIG,
  loadStoredConfig,
  normalizeRuntimeConfig,
} from "./circle-slider-config.js";
import { renderCircleSliderStage } from "./circle-slider-stage.js";
import { initModePicker } from "./circle-slider-mode-picker.js";
import { initTweakPanel } from "./circle-slider-tweak-panel.js";
import { registerCircleSliderElement } from "./circle-slider-element.js";

registerCircleSliderElement();

const stored = loadStoredConfig();
/** @type {import("./circle-slider-config.js").CircleSliderConfig} */
const cfg = Object.assign({}, DEFAULT_CONFIG, stored || {});
normalizeRuntimeConfig(cfg);

const standardPanel = document.getElementById("cs-panel-standard");
const rangePanel = document.getElementById("cs-panel-range");
const tweakPanel = document.getElementById("cs-tweak-panel");

/** @type {HTMLElement | null} */
let standardRoot = null;
if (standardPanel instanceof HTMLElement) {
  standardRoot = renderCircleSliderStage(standardPanel, {
    gradientId: "cs-track-edge-fade",
    stageId: "circle-slider",
    stageAriaLabel: "Circle slider",
    cardAriaLabel: "Value, press and drag outward to adjust",
    initialDisplayValue: cfg.initialValue,
  });
}

/** @type {HTMLElement | null} */
let rangeRoot = null;
if (rangePanel instanceof HTMLElement) {
  rangeRoot = renderCircleSliderStage(rangePanel, {
    gradientId: "cs-range-track-edge-fade",
    stageId: "circle-slider-range",
    stageAriaLabel: "Circle slider, 0 to 100",
    cardAriaLabel: "Value from 0 to 100, press and drag outward to adjust",
    initialDisplayValue: cfg.initialValueRange,
    cardAriaValueMin: 0,
    cardAriaValueMax: 100,
  });
}

if (standardRoot) {
  const api = initCircleSlider(standardRoot, cfg);
  /** @type {ReturnType<typeof initCircleSlider> | null} */
  let rangeApi = null;
  if (rangeRoot) {
    rangeApi = initCircleSlider(rangeRoot, cfg, { behavior: "velocityBounded100" });
  }

  window.__CIRCLE_SLIDER_CONFIG__ = cfg;
  window.__CIRCLE_SLIDER__ = {
    config: cfg,
    resetValue: api.resetValue,
    getValue: api.getValue,
    setValue: api.setValue,
    destroy: api.destroy,
    rangeResetValue: rangeApi ? rangeApi.resetValue : undefined,
    rangeGetValue: rangeApi ? rangeApi.getValue : undefined,
    rangeSetValue: rangeApi ? rangeApi.setValue : undefined,
    rangeDestroy: rangeApi ? rangeApi.destroy : undefined,
  };

  initModePicker(api, rangeApi);

  if (tweakPanel) {
    initTweakPanel(tweakPanel, cfg, standardRoot, api, rangeRoot, rangeApi);
  }
}
