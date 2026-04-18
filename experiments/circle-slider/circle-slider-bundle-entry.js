/**
 * Barrel entry for embedding or a future npm package: re-exports the public surface of the control.
 *
 * Import from this file for a single import graph:
 *   import { initCircleSlider, renderCircleSliderStage, DEFAULT_CONFIG } from "./circle-slider-bundle-entry.js";
 */

export { initCircleSlider } from "./circle-slider.js";
export { renderCircleSliderStage } from "./circle-slider-stage.js";
export {
  DEFAULT_CONFIG,
  loadStoredConfig,
  normalizeRuntimeConfig,
  saveStoredConfig,
  scheduleSaveConfig,
  STORAGE_KEY,
  VISUAL_CONFIG_KEYS,
} from "./circle-slider-config.js";
export { applyVisualConfig, createRadialSliderView } from "./circle-slider-view.js";
export { CircleSliderElement, registerCircleSliderElement } from "./circle-slider-element.js";
