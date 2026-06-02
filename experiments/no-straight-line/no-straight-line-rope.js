/**
 * Verlet rope + word bodies for “No straight line” experiment.
 */

import { FRAME_WIDTH, FRAME_HEIGHT } from "./no-straight-line-layout.js";

/**
 * @typedef {object} RopeParams
 * @property {number} wordDamping Per-frame velocity retention for words (0–1).
 * @property {number} ropeDamping Per-frame Verlet retention for rope interior points.
 * @property {number} wordPull Rope tension coupling into word velocity.
 * @property {number} constraintIterations Rope segment solver passes per substep.
 * @property {number} substeps
 * @property {number} boundsPad
 * @property {number} ropeStiffness Segment constraint strength (lower = stretchier).
 * @property {number} maxReleaseSpeed Cap throw speed (px/s).
 * @property {number} sleepSpeed Words/ropes below this speed (px/s) count as idle.
 */

/** @returns {RopeParams} */
export function createDefaultRopeParams() {
  return {
    wordDamping: 0.984,
    ropeDamping: 0.972,
    wordPull: 3.2,
    constraintIterations: 5,
    substeps: 2,
    boundsPad: 48,
    ropeStiffness: 0.88,
    maxReleaseSpeed: 1400,
    sleepSpeed: 3,
  };
}

/**
 * @param {{ words: object[], ropes: object[] }} scene
 * @param {RopeParams} params
 */
export function createRopeSim(scene, params) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** @type {number | null} */
  let dragWordIndex = null;

  function wordAnchor(word, which) {
    const off = which === "a" ? word.anchorA : word.anchorB;
    return { x: word.x + off.x, y: word.y + off.y };
  }

  function isWordFixed(i) {
    return dragWordIndex === i;
  }

  function clampWordToBounds(w) {
    const pad = params.boundsPad;
    if (w.x < pad) {
      w.x = pad;
      w.vx = 0;
    } else if (w.x > FRAME_WIDTH - pad) {
      w.x = FRAME_WIDTH - pad;
      w.vx = 0;
    }
    if (w.y < pad) {
      w.y = pad;
      w.vy = 0;
    } else if (w.y > FRAME_HEIGHT - pad) {
      w.y = FRAME_HEIGHT - pad;
      w.vy = 0;
    }
  }

  function isSceneActive() {
    if (dragWordIndex != null) return true;
    const min = params.sleepSpeed;
    for (const w of scene.words) {
      if (Math.hypot(w.vx, w.vy) > min) return true;
    }
    for (const rope of scene.ropes) {
      for (let j = 1; j < rope.particles.length - 1; j++) {
        const p = rope.particles[j];
        const vx = p.x - p.px;
        const vy = p.y - p.py;
        if (Math.hypot(vx, vy) > min) return true;
      }
    }
    return false;
  }

  function freezeScene() {
    for (const w of scene.words) {
      w.vx = 0;
      w.vy = 0;
    }
    pinRopeEnds();
    for (const rope of scene.ropes) {
      for (const p of rope.particles) {
        p.px = p.x;
        p.py = p.y;
      }
    }
  }

  function separateWords() {
    const words = scene.words;
    for (let pass = 0; pass < 4; pass++) {
      for (let i = 0; i < words.length; i++) {
        for (let j = i + 1; j < words.length; j++) {
          const wi = words[i];
          const wj = words[j];
          const minDist = wi.radius + wj.radius;
          let dx = wj.x - wi.x;
          let dy = wj.y - wi.y;
          let dist = Math.hypot(dx, dy);
          if (dist >= minDist || dist < 1e-6) continue;

          const overlap = minDist - dist;
          const ux = dist < 1e-6 ? 1 : dx / dist;
          const uy = dist < 1e-6 ? 0 : dy / dist;
          const fi = isWordFixed(i);
          const fj = isWordFixed(j);

          if (fi && fj) continue;
          if (fi && !fj) {
            wj.x += ux * overlap;
            wj.y += uy * overlap;
            clampWordToBounds(wj);
            continue;
          }
          if (fj && !fi) {
            wi.x -= ux * overlap;
            wi.y -= uy * overlap;
            clampWordToBounds(wi);
            continue;
          }

          const half = overlap * 0.5;
          wi.x -= ux * half;
          wi.y -= uy * half;
          wj.x += ux * half;
          wj.y += uy * half;
          clampWordToBounds(wi);
          clampWordToBounds(wj);
        }
      }
    }
  }

  function pinRopeEnds() {
    for (let r = 0; r < scene.ropes.length; r++) {
      const rope = scene.ropes[r];
      const particles = rope.particles;
      const w0 = scene.words[r];
      const w1 = scene.words[r + 1];
      const start = wordAnchor(w0, "b");
      const end = wordAnchor(w1, "a");
      const p0 = particles[0];
      const pN = particles[particles.length - 1];
      p0.x = start.x;
      p0.y = start.y;
      p0.px = start.x;
      p0.py = start.y;
      pN.x = end.x;
      pN.y = end.y;
      pN.px = end.x;
      pN.py = end.y;
    }
  }

  function satisfyRopeSegments(iterations) {
    const stiff = params.ropeStiffness;
    for (const rope of scene.ropes) {
      const parts = rope.particles;
      for (let k = 0; k < iterations; k++) {
        for (let i = 0; i < parts.length - 1; i++) {
          const a = parts[i];
          const b = parts[i + 1];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy) || 0.0001;
          const restLen = rope.segmentLengths[i] ?? dist;
          const diff = ((restLen - dist) / dist) * stiff * 0.5;
          const ox = dx * diff;
          const oy = dy * diff;
          if (i > 0) {
            a.x -= ox;
            a.y -= oy;
          }
          if (i < parts.length - 2) {
            b.x += ox;
            b.y += oy;
          }
        }
      }
    }
    pinRopeEnds();
  }

  function applyRopePullToWords(dt) {
    for (let r = 0; r < scene.ropes.length; r++) {
      const rope = scene.ropes[r];
      const parts = rope.particles;
      const w0 = scene.words[r];
      const w1 = scene.words[r + 1];
      if (dragWordIndex !== r && dragWordIndex !== r + 1) {
        const p1 = parts[1];
        const anchor0 = wordAnchor(w0, "b");
        const dx0 = p1.x - anchor0.x;
        const dy0 = p1.y - anchor0.y;
        w0.vx += dx0 * params.wordPull * dt;
        w0.vy += dy0 * params.wordPull * dt;
      }
      if (dragWordIndex !== r + 1 && dragWordIndex !== r) {
        const pN = parts[parts.length - 2];
        const anchor1 = wordAnchor(w1, "a");
        const dx1 = pN.x - anchor1.x;
        const dy1 = pN.y - anchor1.y;
        w1.vx += dx1 * params.wordPull * dt;
        w1.vy += dy1 * params.wordPull * dt;
      }
    }
  }

  function integrate(dt) {
    const wordDamp = params.wordDamping;
    const ropeDamp = params.ropeDamping;

    for (let i = 0; i < scene.words.length; i++) {
      const w = scene.words[i];
      if (isWordFixed(i)) continue;

      w.vx *= wordDamp;
      w.vy *= wordDamp;
      w.x += w.vx * dt;
      w.y += w.vy * dt;
      clampWordToBounds(w);
    }

    for (const rope of scene.ropes) {
      for (let j = 1; j < rope.particles.length - 1; j++) {
        const p = rope.particles[j];
        const vx = (p.x - p.px) * ropeDamp;
        const vy = (p.y - p.py) * ropeDamp;
        p.px = p.x;
        p.py = p.y;
        p.x += vx;
        p.y += vy;
      }
    }
  }

  function solveSoftRopes(dt) {
    pinRopeEnds();
    applyRopePullToWords(dt);
    satisfyRopeSegments(params.constraintIterations);
    separateWords();
    pinRopeEnds();
  }

  function step(dt) {
    if (reducedMotion) return;

    if (!isSceneActive()) {
      freezeScene();
      return;
    }

    const sub = Math.max(1, params.substeps);
    const subDt = dt / sub;
    for (let s = 0; s < sub; s++) {
      integrate(subDt);
      solveSoftRopes(subDt);
    }

    if (!isSceneActive()) {
      freezeScene();
    }
  }

  /**
   * @param {number | null} index
   * @param {number} [x]
   * @param {number} [y]
   * @param {{ vx: number, vy: number } | null} [releaseVel]
   */
  function setDragWord(index, x, y, releaseVel = null) {
    if (index == null) {
      const released = dragWordIndex;
      dragWordIndex = null;
      if (released != null && releaseVel) {
        const w = scene.words[released];
        let vx = releaseVel.vx;
        let vy = releaseVel.vy;
        const speed = Math.hypot(vx, vy);
        const max = params.maxReleaseSpeed;
        if (speed > max && speed > 0) {
          const s = max / speed;
          vx *= s;
          vy *= s;
        }
        w.vx = vx;
        w.vy = vy;
      }
      solveSoftRopes(1 / 60);
      return;
    }
    dragWordIndex = index;
    const w = scene.words[index];
    w.x = x;
    w.y = y;
    w.vx = 0;
    w.vy = 0;
    clampWordToBounds(w);
    solveSoftRopes(1 / 60);
  }

  function resetToRest() {
    dragWordIndex = null;
    for (const w of scene.words) {
      w.x = w.restX;
      w.y = w.restY;
      w.vx = 0;
      w.vy = 0;
    }
    for (const rope of scene.ropes) {
      for (let i = 0; i < rope.particles.length; i++) {
        const p = rope.rest[i];
        const pt = rope.particles[i];
        pt.x = p.x;
        pt.y = p.y;
        pt.px = p.x;
        pt.py = p.y;
      }
    }
  }

  if (reducedMotion) {
    resetToRest();
  } else {
    freezeScene();
  }

  return {
    get reducedMotion() {
      return reducedMotion;
    },
    get dragWordIndex() {
      return dragWordIndex;
    },
    step,
    setDragWord,
    resetToRest,
    pinRopeEnds,
  };
}
