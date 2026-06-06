/**
 * Figma Frame 46 layout — 1080×1350 design space.
 */

export const FRAME_WIDTH = 1080;
export const FRAME_HEIGHT = 1350;

/** @typedef {{ id: string, text: string, restX: number, restY: number, collisionRadiusX: number, collisionRadiusY: number }} WordDef */

/** @typedef {{ left: number, top: number, width: number, height: number, viewBoxW: number, viewBoxH: number, d: string }} RopePathDef */

/** @type {WordDef[]} */
export const WORD_DEFS = [
  { id: "no", text: "No", restX: 174, restY: 127, collisionRadiusX: 82, collisionRadiusY: 38 },
  { id: "journey", text: "journey", restX: 769.5, restY: 357, collisionRadiusX: 200, collisionRadiusY: 38 },
  { id: "is", text: "is", restX: 711.5, restY: 587, collisionRadiusX: 44, collisionRadiusY: 38 },
  { id: "a", text: "a", restX: 239.5, restY: 781, collisionRadiusX: 34, collisionRadiusY: 38 },
  { id: "straight", text: "straight", restX: 732.5, restY: 895, collisionRadiusX: 210, collisionRadiusY: 38 },
  { id: "line", text: "line", restX: 373.5, restY: 1202, collisionRadiusX: 96, collisionRadiusY: 38 },
];

/** Figma export bounds + path `d` (local viewBox units). */
/** @type {RopePathDef[]} */
export const ROPE_PATH_DEFS = [
  {
    left: 271,
    top: 144,
    width: 356.882,
    height: 137.609,
    viewBoxW: 367.884,
    viewBoxH: 148.611,
    d: "M5.50026 5.50026C9.18374 10.2474 29.379 27.4174 58.746 37.2955C151.973 68.6537 249.503 45.0572 269.734 53.2033C287.608 60.4 304.838 73.7038 327.298 92.2862C334.053 97.7054 341.843 103.434 347.478 110.423C353.113 117.411 356.356 125.486 362.383 143.11",
  },
  {
    left: 663.72,
    top: 448.66,
    width: 63.236,
    height: 92.059,
    viewBoxW: 74.238,
    viewBoxH: 103.06,
    d: "M5.50002 5.50002C5.58907 10.8247 9.43907 25.8471 18.2528 35.9308C26.7366 45.637 36.4857 52.9673 46.6298 64.6737C50.8556 69.7763 55.1608 74.3637 60.0352 79.7582C62.4871 82.9583 64.8952 87.0978 68.7365 97.5589",
  },
  {
    left: 250.92,
    top: 627.64,
    width: 401.192,
    height: 112.116,
    viewBoxW: 412.192,
    viewBoxH: 123.116,
    d: "M406.692 5.5C401.491 5.5 382.899 5.5 340.551 9.29208C276.877 14.9939 235.257 30.1317 223.06 36.177C204.509 45.371 184.916 60.3165 157.39 71.1841C92.9926 96.6095 53.2748 89.5383 30.2699 93.4277C24.8315 97.1318 20.219 101.495 16.2884 105.972C14.3277 108.23 12.4362 110.46 5.5 117.616",
  },
  {
    left: 243.21,
    top: 837.65,
    width: 337.492,
    height: 39.075,
    viewBoxW: 348.493,
    viewBoxH: 50.0751,
    d: "M5.50125 28.9182C10.7863 31.4926 47.3999 40.4972 105.229 44.5109C125.817 45.9398 160.494 23.2226 188.953 8.8733C196.722 4.95612 235.436 5.34159 290.365 5.73776C317.288 5.93194 326.276 11.3725 331.369 14.6898C333.674 16.543 335.409 18.741 337.211 20.9045C339.013 23.0681 340.83 25.1307 342.993 28.1949",
  },
  {
    left: 369.66,
    top: 984.23,
    width: 374.416,
    height: 182.227,
    viewBoxW: 385.416,
    viewBoxH: 193.221,
    d: "M367.086 5.5C367.086 8.82396 369.672 26.8529 376.271 51.5307C380.007 65.5034 380.342 80.5661 379.59 92.9878C378.576 109.755 359.53 120.665 331.376 138.969C300.952 158.749 250.761 170.474 201.626 182.87C161.59 192.97 128.255 184.739 103.067 181.222C54.3206 176.799 20.4073 175.593 14.9166 178.274C12.2115 179.661 9.67158 181.104 5.50022 184.404",
  },
];

let _pathSampler = null;

function getPathSampler() {
  if (_pathSampler) return _pathSampler;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.style.position = "absolute";
  svg.style.visibility = "hidden";
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  svg.appendChild(path);
  document.body.appendChild(svg);
  _pathSampler = path;
  return path;
}

/**
 * Map local viewBox coords to frame space.
 * @param {number} lx
 * @param {number} ly
 * @param {RopePathDef} def
 */
export function localToFrame(lx, ly, def) {
  return {
    x: def.left + (lx / def.viewBoxW) * def.width,
    y: def.top + (ly / def.viewBoxH) * def.height,
  };
}

/**
 * Sample `count` points along a rope path in frame coordinates.
 * @param {RopePathDef} def
 * @param {number} count
 * @returns {{ x: number, y: number }[]}
 */
export function sampleRopePath(def, count) {
  const pathEl = getPathSampler();
  pathEl.setAttribute("d", def.d);

  const len = pathEl.getTotalLength();
  const n = Math.max(2, count);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const p = pathEl.getPointAtLength(t * len);
    pts.push(localToFrame(p.x, p.y, def));
  }
  return pts;
}

/**
 * @param {number} particleCount Per rope segment (including endpoints).
 */
export function buildSceneLayout(particleCount = 12) {
  const words = WORD_DEFS.map((w) => ({
    ...w,
    x: w.restX,
    y: w.restY,
    vx: 0,
    vy: 0,
    radiusX: w.collisionRadiusX,
    radiusY: w.collisionRadiusY,
    anchorA: { x: 0, y: 0 },
    anchorB: { x: 0, y: 0 },
    hasAnchorA: false,
    hasAnchorB: false,
  }));

  const ropes = ROPE_PATH_DEFS.map((def, i) => {
    const rest = sampleRopePath(def, particleCount);
    return {
      index: i,
      def,
      rest,
      segmentLengths: [],
      particles: rest.map((p) => ({
        x: p.x,
        y: p.y,
        px: p.x,
        py: p.y,
      })),
    };
  });

  for (let i = 0; i < ropes.length; i++) {
    const pts = ropes[i].rest;
    const start = pts[0];
    const end = pts[pts.length - 1];
    const w0 = words[i];
    const w1 = words[i + 1];

    w0.anchorB = { x: start.x - w0.restX, y: start.y - w0.restY };
    w0.hasAnchorB = true;
    w1.anchorA = { x: end.x - w1.restX, y: end.y - w1.restY };
    w1.hasAnchorA = true;

    const segmentLengths = [];
    for (let j = 1; j < pts.length; j++) {
      const dx = pts[j].x - pts[j - 1].x;
      const dy = pts[j].y - pts[j - 1].y;
      segmentLengths.push(Math.hypot(dx, dy));
    }
    ropes[i].segmentLengths = segmentLengths;
    ropes[i].pathLength = segmentLengths.reduce((sum, len) => sum + len, 0);
  }

  return { words, ropes };
}

/**
 * Catmull-Rom → cubic Bézier path for canvas.
 * @param {{ x: number, y: number }[]} pts
 * @returns {string}
 */
export function catmullRomPath(pts) {
  if (pts.length < 2) return "";
  if (pts.length === 2) {
    return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;
  }

  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}
