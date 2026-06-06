import { createDefaultRopeParams } from "./no-straight-line-rope.js";

export const STORAGE_KEY = "dwarph.io.experiments.noStraightLine.params";

/** @typedef {import("./no-straight-line-rope.js").RopeParams & {
 *   ropeLineWidth: number
 *   ropeParticleCount: number
 * }} NslParams */

/**
 * @typedef {object} TweakField
 * @property {keyof NslParams} key
 * @property {string} label
 * @property {string} explain
 * @property {number} min
 * @property {number} max
 * @property {number} step
 * @property {number} decimals
 */

/** @type {{ legend: string, fields: TweakField[] }[]} */
export const TWEAK_GROUPS = [
  {
    legend: "Ropes",
    fields: [
      {
        key: "ropeParticleCount",
        label: "Particles",
        explain:
          "Points sampled along each rope path (including word anchors). More = smoother curves and shorter segments; fewer = chunkier. Rebuilds ropes when changed.",
        min: 4,
        max: 32,
        step: 1,
        decimals: 0,
      },
      {
        key: "ropeStiffness",
        label: "Stiffness",
        explain:
          "How hard each rope segment tries to keep its rest length. Lower values feel rubbery and stretch more; higher values stay tighter to the designed curve.",
        min: 0.5,
        max: 1,
        step: 0.01,
        decimals: 2,
      },
      {
        key: "wordPull",
        label: "Word pull",
        explain:
          "How much tension in the rope tugs neighboring words when a segment is stretched past its rest length. No effect while the line is slack.",
        min: 0,
        max: 12,
        step: 0.1,
        decimals: 1,
      },
      {
        key: "ropeDamping",
        label: "Damping",
        explain:
          "Friction on rope interior points. Higher values kill wobble faster; lower values let the line keep swinging after a release.",
        min: 0.9,
        max: 0.999,
        step: 0.001,
        decimals: 3,
      },
      {
        key: "constraintIterations",
        label: "Solver passes",
        explain:
          "How many times per frame the rope constraints are solved. More passes reduce stretch and jitter but cost a little CPU.",
        min: 1,
        max: 16,
        step: 1,
        decimals: 0,
      },
      {
        key: "substeps",
        label: "Substeps",
        explain:
          "Physics slices per frame. More substeps make motion smoother when you fling words or pull hard on the chain.",
        min: 1,
        max: 6,
        step: 1,
        decimals: 0,
      },
      {
        key: "ropeLineWidth",
        label: "Line width",
        explain: "Stroke thickness of the lime rope on screen, in pixels at the Figma frame scale.",
        min: 6,
        max: 28,
        step: 1,
        decimals: 0,
      },
    ],
  },
  {
    legend: "Words",
    fields: [
      {
        key: "wordDamping",
        label: "Damping",
        explain:
          "Friction on word velocity after you release. Higher values stop glide sooner; lower values let throws coast longer.",
        min: 0.9,
        max: 0.999,
        step: 0.001,
        decimals: 3,
      },
      {
        key: "maxReleaseSpeed",
        label: "Max throw speed",
        explain:
          "Caps how fast a word can fly when you flick it on release, in pixels per second. Set to 0 to disable throwing.",
        min: 0,
        max: 3000,
        step: 50,
        decimals: 0,
      },
      {
        key: "sleepSpeed",
        label: "Sleep threshold",
        explain:
          "When every word and rope point moves slower than this (px/s), the scene freezes to save work. Lower values keep subtle motion alive longer.",
        min: 0,
        max: 30,
        step: 0.5,
        decimals: 1,
      },
    ],
  },
  {
    legend: "Drift home",
    fields: [
      {
        key: "homeSpring",
        label: "Homing pull",
        explain:
          "How fast words drift back to the Figma layout after you let go (per second). Zero turns homing off. Default ~0.4 reaches rest in a few seconds.",
        min: 0,
        max: 2,
        step: 0.02,
        decimals: 2,
      },
      {
        key: "homeSnapDistance",
        label: "Snap distance",
        explain:
          "When a word is within this many pixels of its rest spot, it snaps exactly home and stops. Stops endless micro-drift.",
        min: 0.25,
        max: 12,
        step: 0.25,
        decimals: 2,
      },
    ],
  },
];

/** @returns {NslParams} */
export function createDefaultParams() {
  return {
    ...createDefaultRopeParams(),
    ropeLineWidth: 16,
    ropeParticleCount: 12,
  };
}

/** @param {unknown} raw @returns {NslParams} */
export function mergeParams(raw) {
  const base = createDefaultParams();
  if (!raw || typeof raw !== "object") return base;
  const src = /** @type {Record<string, unknown>} */ (raw);
  for (const key of Object.keys(base)) {
    const v = Number(src[key]);
    if (Number.isFinite(v)) {
      base[/** @type {keyof NslParams} */ (key)] = v;
    }
  }
  base.constraintIterations = Math.round(base.constraintIterations);
  base.substeps = Math.round(base.substeps);
  base.ropeLineWidth = Math.round(base.ropeLineWidth);
  base.ropeParticleCount = Math.round(Math.max(4, Math.min(32, base.ropeParticleCount)));
  return base;
}

/** @returns {NslParams} */
export function loadParams() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultParams();
    return mergeParams(JSON.parse(raw));
  } catch {
    return createDefaultParams();
  }
}

/** @param {NslParams} params */
export function saveParams(params) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(params));
  } catch {
    /* ignore */
  }
}
