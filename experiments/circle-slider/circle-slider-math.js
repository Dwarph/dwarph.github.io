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
 * Perceptual overshoot: ~linear when |raw| ≪ scale, then marginal gain falls like 1/(scale+|raw|)
 * so wind pressure keeps reading even at large displacement — no hard cap on output.
 *
 * @param {number} raw
 * @param {number} scale
 */
export function perceptualOvershootRad(raw, scale) {
  if (!(scale > 0)) return 0;
  const ax = Math.abs(raw);
  return Math.sign(raw) * scale * Math.log(1 + ax / scale);
}

/**
 * Slip move + stretch pair: perceptual for modest |s|, then a **linear tail** past the knee so
 * large wind / unwind still moves the visual every radian (perceptual alone flattens).
 *
 * @param {number} s — peg-clamped wind (rad)
 * @param {number} moveScale
 * @param {number} stretchScale
 * @returns {{ moveRad: number; stretchRad: number }}
 */
export function slipVisualOvershoot(s, moveScale, stretchScale) {
  const knee = 0.72;
  const ax = Math.abs(s);
  if (ax <= knee) {
    return {
      moveRad: perceptualOvershootRad(s, moveScale),
      stretchRad: perceptualOvershootRad(s, stretchScale) * 1.12,
    };
  }
  const sg = Math.sign(s);
  const m0 = perceptualOvershootRad(sg * knee, moveScale);
  const s0 = perceptualOvershootRad(sg * knee, stretchScale) * 1.12;
  const tail = ax - knee;
  const km = 0.092;
  const ks = 0.108;
  return {
    moveRad: m0 + sg * tail * km,
    stretchRad: s0 + sg * tail * ks,
  };
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
