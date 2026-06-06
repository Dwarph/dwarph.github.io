/**
 * Ellipse hit tests for word bodies (wide horizontally, short vertically).
 */

/**
 * @param {{ x: number, y: number, radiusX: number, radiusY: number }} w
 * @param {number} px
 * @param {number} py
 */
export function ellipseContains(w, px, py) {
  const dx = (px - w.x) / w.radiusX;
  const dy = (py - w.y) / w.radiusY;
  return dx * dx + dy * dy <= 1;
}

/**
 * Support radius along unit normal (n) for ellipse collision response.
 * @param {{ radiusX: number, radiusY: number }} w
 * @param {number} nx
 * @param {number} ny
 */
export function ellipseRadiusAlong(w, nx, ny) {
  const rx = w.radiusX;
  const ry = w.radiusY;
  const denom = (nx * nx) / (rx * rx) + (ny * ny) / (ry * ry);
  if (denom <= 0) return Math.max(rx, ry);
  return 1 / Math.sqrt(denom);
}

/**
 * Normalized distance from ellipse center (0 = center, 1 = edge).
 * @param {{ x: number, y: number, radiusX: number, radiusY: number }} w
 * @param {number} px
 * @param {number} py
 */
export function ellipseNormDist(w, px, py) {
  const dx = (px - w.x) / w.radiusX;
  const dy = (py - w.y) / w.radiusY;
  return Math.hypot(dx, dy);
}
