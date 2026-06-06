import { createDefaultRopeParams } from "./no-straight-line-rope.js";

/** @typedef {import("./no-straight-line-rope.js").RopeParams & {
 *   ropeLineWidth: number
 *   ropeParticleCount: number
 * }} NslParams */

/** @returns {NslParams} */
export function createDefaultParams() {
  return {
    ...createDefaultRopeParams(),
    ropeLineWidth: 16,
    ropeParticleCount: 12,
  };
}
