/**
 * @typedef {'cardCenter' | 'initialPress'} RotationOrigin
 */

/**
 * @typedef {object} CircleSliderConfig
 * @property {number} initialValue
 * @property {number} activationRadiusPx
 * @property {RotationOrigin} rotationOrigin
 * @property {boolean} requireOutsideCardToActivate
 * @property {number} maskDeadzoneDeg
 * @property {number} radPerStep
 * @property {number} sensitivityRampMin
 * @property {number} sensitivityRampSpanPx
 * @property {number} velocityOmegaRefRadPerMs
 * @property {number} velocityGainK
 * @property {number} velocityGainMaxExtra
 * @property {number} velocityBoostMinOmegaRadPerMs
 * @property {number} minOmegaRadPerMs
 * @property {number} minAngleDeltaDeg
 * @property {number} appearDurationMs
 * @property {number} hideDurationMs
 * @property {number} blurAppearPx
 * @property {number} blurHidePx
 * @property {number} thumbArcDeg
 * @property {number} trackRadius
 * @property {number} trackStrokeWidth
 * @property {number} thumbStrokeWidth
 * @property {number} releaseInwardCosMin
 * @property {number} releaseDirectionMinSpeedPx
 */

export const MIN_PRESS_HALO_MS = 220;

/**
 * Range mode (0–100) scales effective {@link CircleSliderConfig.radPerStep} by this factor so values
 * change more slowly than the unbounded standard slider for the same tweak-panel setting.
 * Higher = less sensitive (more radians per integer step).
 */
export const RANGE_MODE_RAD_PER_STEP_MULTIPLIER = 2.35;

export const STORAGE_KEY = "dwarph.io.experiments.circleSlider.config.v1";

/** @type {CircleSliderConfig} */
export const DEFAULT_CONFIG = {
  initialValue: 114,
  activationRadiusPx: 10,
  rotationOrigin: "cardCenter",
  requireOutsideCardToActivate: true,
  maskDeadzoneDeg: 15,
  radPerStep: 0.14,
  sensitivityRampMin: 0.22,
  sensitivityRampSpanPx: 52,
  velocityOmegaRefRadPerMs: 0.0035,
  velocityGainK: 2.25,
  velocityGainMaxExtra: 5,
  velocityBoostMinOmegaRadPerMs: 0,
  minOmegaRadPerMs: 0,
  minAngleDeltaDeg: 0,
  appearDurationMs: 300,
  hideDurationMs: 300,
  blurAppearPx: 14,
  blurHidePx: 14,
  thumbArcDeg: 16,
  trackRadius: 78,
  trackStrokeWidth: 3,
  thumbStrokeWidth: 7,
  releaseInwardCosMin: 0.94,
  releaseDirectionMinSpeedPx: 2.2,
};

/** @type {string[]} */
export const VISUAL_CONFIG_KEYS = [
  "trackRadius",
  "thumbArcDeg",
  "trackStrokeWidth",
  "thumbStrokeWidth",
  "appearDurationMs",
  "hideDurationMs",
  "blurAppearPx",
  "blurHidePx",
];

let saveTimer = null;

/**
 * @returns {Partial<CircleSliderConfig> | null}
 */
export function loadStoredConfig() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (!s) return null;
    const o = JSON.parse(s);
    return o && typeof o === "object" ? o : null;
  } catch {
    return null;
  }
}

/**
 * @param {CircleSliderConfig} cfg
 */
export function saveStoredConfig(cfg) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  } catch {
    /* quota / private mode */
  }
}

/**
 * @param {CircleSliderConfig} cfg
 */
export function scheduleSaveConfig(cfg) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(function () {
    saveTimer = null;
    saveStoredConfig(cfg);
  }, 400);
}

/**
 * Mutates loaded config into a valid runtime shape (defaults, clamps, coupled fields).
 * @param {CircleSliderConfig} cfg
 */
export function normalizeRuntimeConfig(cfg) {
  if (cfg.rotationOrigin !== "initialPress") cfg.rotationOrigin = "cardCenter";
  if (typeof cfg.requireOutsideCardToActivate !== "boolean") {
    cfg.requireOutsideCardToActivate = DEFAULT_CONFIG.requireOutsideCardToActivate;
  }
  cfg.initialValue = Math.round(Number(cfg.initialValue)) || DEFAULT_CONFIG.initialValue;
  {
    const c = Number(cfg.releaseInwardCosMin);
    cfg.releaseInwardCosMin = Number.isFinite(c)
      ? Math.min(1, Math.max(0, c))
      : DEFAULT_CONFIG.releaseInwardCosMin;
  }
  {
    const s = Number(cfg.releaseDirectionMinSpeedPx);
    cfg.releaseDirectionMinSpeedPx =
      Number.isFinite(s) && s >= 0 ? Math.min(8, s) : DEFAULT_CONFIG.releaseDirectionMinSpeedPx;
  }
  cfg.blurHidePx = cfg.blurAppearPx;
  cfg.hideDurationMs = cfg.appearDurationMs;
}
