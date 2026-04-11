/** @type {const} */
export const TAU = Math.PI * 2;

/** Track arc midpoint in SVG space (thumb at −90°). */
export const TRACK_ARC_BISECTOR_RAD = Math.PI / 2 + Math.PI;

/**
 * @param {number} t
 */
export function smoothstep01(t) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return t * t * (3 - 2 * t);
}

export function shortestAngleDiff(a, b) {
  let d = b - a;
  while (d > Math.PI) d -= TAU;
  while (d < -Math.PI) d += TAU;
  return d;
}

/**
 * @param {number} omegaAbs
 * @param {{ velocityOmegaRefRadPerMs: number; velocityGainK: number; velocityGainMaxExtra: number }} cfg
 */
export function velocityMultiplier(omegaAbs, cfg) {
  const ref = cfg.velocityOmegaRefRadPerMs;
  const x = ref > 0 ? omegaAbs / ref : 0;
  const extra = Math.min(x * cfg.velocityGainK, cfg.velocityGainMaxExtra);
  return 1 + extra;
}

/**
 * @param {DOMRect} rect
 */
export function rectCenter(rect) {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

/**
 * @param {number} cx
 * @param {number} cy
 * @param {number} x
 * @param {number} y
 */
export function angleAt(cx, cy, x, y) {
  return Math.atan2(y - cy, x - cx);
}

/**
 * @param {number} r
 */
export function trackArcPath(r) {
  const x0 = r * Math.cos(Math.PI);
  const y0 = r * Math.sin(Math.PI);
  const x1 = r;
  const y1 = 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 1 1 ${x1} ${y1}`;
}

/**
 * @param {number} r
 * @param {number} halfSpanRad
 */
export function thumbArcPath(r, halfSpanRad) {
  const a0 = -halfSpanRad;
  const a1 = halfSpanRad;
  const x0 = r * Math.cos(a0);
  const y0 = r * Math.sin(a0);
  const x1 = r * Math.cos(a1);
  const y1 = r * Math.sin(a1);
  return `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`;
}

/**
 * Same arc topology as thumbArcPath, but extends only on one end by stretchRad (+ = longer toward +θ).
 */
export function thumbArcPathDirectedStretch(r, baseHalfRad, stretchRad) {
  let a0 = -baseHalfRad;
  let a1 = baseHalfRad;
  if (stretchRad > 0) {
    a1 += stretchRad;
  } else if (stretchRad < 0) {
    a0 += stretchRad;
  }
  const x0 = r * Math.cos(a0);
  const y0 = r * Math.sin(a0);
  const x1 = r * Math.cos(a1);
  const y1 = r * Math.sin(a1);
  return `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`;
}
