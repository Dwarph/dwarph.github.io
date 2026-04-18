/**
 * @typedef {'cardCenter' | 'initialPress'} RotationOrigin
 */

/**
 * @typedef {object} CircleSliderConfig
 * @property {number} initialValue
 * @property {number} initialValueRange — default / reset for bounded range mode (`velocityBounded100`, `velocityBoundedRange`)
 * @property {number} [rangeMin] — with `velocityBoundedRange`, minimum value (default 0)
 * @property {number} [rangeMax] — with `velocityBoundedRange`, maximum value (default 1000)
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
  initialValueRange: 50,
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
    const hasCustomRange =
      Number.isFinite(cfg.rangeMin) && Number.isFinite(cfg.rangeMax);
    if (hasCustomRange) {
      const rMin = Math.round(Number(cfg.rangeMin));
      const rMax = Math.round(Number(cfg.rangeMax));
      cfg.rangeMin = Math.min(rMin, rMax);
      cfg.rangeMax = Math.max(rMin, rMax);
      const r = Number(cfg.initialValueRange);
      cfg.initialValueRange = Number.isFinite(r)
        ? Math.round(Math.max(cfg.rangeMin, Math.min(cfg.rangeMax, r)))
        : Math.round((cfg.rangeMin + cfg.rangeMax) / 2);
    } else {
      const r = Number(cfg.initialValueRange);
      cfg.initialValueRange = Number.isFinite(r)
        ? Math.round(Math.max(0, Math.min(100, r)))
        : DEFAULT_CONFIG.initialValueRange;
    }
  }
  {
    const c = Number(cfg.releaseInwardCosMin);
    cfg.releaseInwardCosMin = Number.isFinite(c)
      ? Math.min(1, Math.max(0, c))
      : DEFAULT_CONFIG.releaseInwardCosMin;
  }
  {
    const s = Number(cfg.releaseDirectionMinSpeedPx);
    cfg.releaseDirectionMinSpeedPx =
      Number.isFinite(s) && s >= 0 ? Math.min(3, s) : DEFAULT_CONFIG.releaseDirectionMinSpeedPx;
  }

  /*
   * Clamp to the same min/max as the tweak panel range inputs (`index.html`). Values outside those
   * bounds (from older defaults or manual `localStorage`) make range controls invalid: the browser
   * clamps the thumb while `cfg` still holds the raw number — feels "broken" until Reset syncs.
   */
  {
    const n = Number(cfg.trackRadius);
    cfg.trackRadius = Number.isFinite(n) ? Math.round(clamp(n, 52, 92)) : DEFAULT_CONFIG.trackRadius;
  }
  {
    let v = Number(cfg.trackStrokeWidth);
    v = Number.isFinite(v) ? clamp(v, 1, 10) : DEFAULT_CONFIG.trackStrokeWidth;
    cfg.trackStrokeWidth = Math.round(v * 2) / 2;
  }
  {
    let v = Number(cfg.thumbStrokeWidth);
    v = Number.isFinite(v) ? clamp(v, 3, 16) : DEFAULT_CONFIG.thumbStrokeWidth;
    cfg.thumbStrokeWidth = Math.round(v * 2) / 2;
  }
  {
    const n = Number(cfg.thumbArcDeg);
    cfg.thumbArcDeg = Number.isFinite(n) ? Math.round(clamp(n, 8, 36)) : DEFAULT_CONFIG.thumbArcDeg;
  }
  {
    let v = Number(cfg.appearDurationMs);
    v = Number.isFinite(v) ? clamp(v, 120, 600) : DEFAULT_CONFIG.appearDurationMs;
    cfg.appearDurationMs = Math.round(v / 10) * 10;
  }
  {
    const n = Number(cfg.blurAppearPx);
    cfg.blurAppearPx = Number.isFinite(n) ? Math.round(clamp(n, 0, 28)) : DEFAULT_CONFIG.blurAppearPx;
  }
  {
    let v = Number(cfg.radPerStep);
    v = Number.isFinite(v) ? clamp(v, 0.05, 0.35) : DEFAULT_CONFIG.radPerStep;
    cfg.radPerStep = Math.round(v * 100) / 100;
  }
  {
    let v = Number(cfg.velocityGainMaxExtra);
    v = Number.isFinite(v) ? clamp(v, 0, 10) : DEFAULT_CONFIG.velocityGainMaxExtra;
    cfg.velocityGainMaxExtra = Math.round(v * 2) / 2;
  }
  {
    let v = Number(cfg.sensitivityRampMin);
    v = Number.isFinite(v) ? clamp(v, 0.05, 1) : DEFAULT_CONFIG.sensitivityRampMin;
    cfg.sensitivityRampMin = Math.round(v * 100) / 100;
  }
  {
    const n = Number(cfg.sensitivityRampSpanPx);
    cfg.sensitivityRampSpanPx = Number.isFinite(n)
      ? Math.round(clamp(n, 0, 120) / 2) * 2
      : DEFAULT_CONFIG.sensitivityRampSpanPx;
  }
  {
    const n = Number(cfg.activationRadiusPx);
    cfg.activationRadiusPx = Number.isFinite(n)
      ? Math.round(clamp(n, 2, 48))
      : DEFAULT_CONFIG.activationRadiusPx;
  }
  {
    const n = Number(cfg.maskDeadzoneDeg);
    cfg.maskDeadzoneDeg = Number.isFinite(n)
      ? Math.round(clamp(n, 0, 40))
      : DEFAULT_CONFIG.maskDeadzoneDeg;
  }

  cfg.blurHidePx = cfg.blurAppearPx;
  cfg.hideDurationMs = cfg.appearDurationMs;
}

/**
 * @param {number} x
 * @param {number} lo
 * @param {number} hi
 */
function clamp(x, lo, hi) {
  if (x < lo) return lo;
  if (x > hi) return hi;
  return x;
}
