/**
 * Fry sprites — fall from the top, drift off the bottom (no collisions / stacking).
 */

const FRY_SRC = new URL("./assets/fry.svg", import.meta.url).href;

/** Natural SVG aspect width / height (from assets/fry.svg viewBox). */
const FRY_AR = 11 / 71;

/** Extra px below the viewport before a fry is removed. */
const CULL_PAD = 96;

/**
 * @typedef {object} FrySimParams
 * @property {number} burstCap Max fries per radial release (ceiling vs dial; unrelated to maxConcurrent).
 * @property {number} encoderTimeScale SUPERHOT factor while radial encoder is active (0–1 typical).
 * @property {number} staggerMinMs Min gap between spawns (ms) when the batch is huge / curve hits zero.
 * @property {number} staggerMaxMs Max gap between spawns (ms) when the batch is small; also caps the curve.
 * @property {number} staggerFastBatch Batch size at/above which stagger hits the min (curve floor).
 * @property {number} staggerSlowBatch Batch size at/below which stagger is staggerMaxMs.
 * @property {number} staggerCurvePower Ease curve: higher = stay fast longer, then ramp up stagger near small batches.
 * @property {number} staggerScheduleSpanMs Target wall-time (ms) from first to last *scheduled* spawn; lightly blended with the curve so large batches stay controlled without feeling glacial. 0 = off.
 * @property {number} maxConcurrent Max fries in the world at once (`bodies.length`).
 * @property {number} displayHeight Mean fry height (px); each spawn samples a size from a Gaussian with this mean.
 * @property {number} frySizeStdDev Standard deviation (px) for fry height; 0 = all fries exactly `displayHeight`.
 * @property {number} fallAccel Downward acceleration (px/s²).
 * @property {number} spawnVxSpread
 * @property {number} spawnAngVSpread
 */

/**
 * Default sim values for the fry shower.
 * @returns {FrySimParams}
 */
export function createDefaultFrySimParams() {
  return {
    burstCap: 1000,
    encoderTimeScale: 0.08,
    staggerMinMs: 40,
    staggerMaxMs: 160,
    staggerFastBatch: 500,
    staggerSlowBatch: 20,
    staggerCurvePower: 3,
    staggerScheduleSpanMs: 12000,
    maxConcurrent: 250,
    displayHeight: 150,
    frySizeStdDev: 30,
    fallAccel: 2600,
    spawnVxSpread: 220,
    spawnAngVSpread: 2.5,
  };
}

/**
 * Stagger between spawns (ms) from batch count, using `staggerMinMs` / `staggerMaxMs` from params.
 * Uses u^gamma between the slow/fast batch thresholds, then clamps to [minMs, maxMs].
 * If `staggerScheduleSpanMs` > 0, blends ~35% toward span/(n-1) (capped by maxMs) with the curve so spacing lifts on huge batches without matching the full span.
 * @param {number} batchCount
 * @param {FrySimParams} p
 */
export function staggerMsForBatchCount(batchCount, p) {
  const n = Math.max(0, Math.round(Number(batchCount)));
  let minMs = Math.max(0, Number(p.staggerMinMs));
  let maxMs = Math.max(0, Number(p.staggerMaxMs));
  if (!Number.isFinite(minMs)) minMs = 0;
  if (!Number.isFinite(maxMs)) maxMs = 150;
  if (minMs > maxMs) minMs = maxMs;

  if (maxMs === 0) return 0;

  let nFast = Math.round(Number(p.staggerFastBatch));
  let nSlow = Math.round(Number(p.staggerSlowBatch));
  if (!Number.isFinite(nFast)) nFast = 500;
  if (!Number.isFinite(nSlow)) nSlow = 20;
  if (nFast < 1) nFast = 1;
  if (nSlow < 0) nSlow = 0;
  if (nSlow >= nFast) nSlow = Math.max(0, nFast - 1);

  const gamma = Math.max(0.25, Number(p.staggerCurvePower));
  const g = Number.isFinite(gamma) ? gamma : 3;

  let out;
  if (n >= nFast) {
    out = 0;
  } else if (n <= nSlow) {
    out = maxMs;
  } else {
    const denom = nFast - nSlow;
    if (denom <= 0) {
      out = maxMs;
    } else {
      const u = (nFast - n) / denom;
      out = maxMs * Math.pow(Math.min(1, Math.max(0, u)), g);
    }
  }

  if (out <= 0) {
    out = Math.min(maxMs, minMs);
  }
  out = Math.min(maxMs, Math.max(minMs, out));

  const span = Math.max(0, Number(p.staggerScheduleSpanMs));
  if (span > 0 && n > 1) {
    let spreadTarget = span / (n - 1);
    if (Number.isFinite(spreadTarget)) {
      spreadTarget = Math.min(maxMs, spreadTarget);
      /* Weight curve more than span (~65/35) so pacing stays snappy; span still lifts huge batches vs curve-only. */
      const blended = out * 0.65 + spreadTarget * 0.35;
      out = Math.max(out, blended);
    }
  }

  return Math.min(maxMs, Math.max(minMs, out));
}

/** Min / max fry height (px) after Gaussian sample — keeps rare tails visible without DOM blowups. */
const FRY_H_MIN = 8;
const FRY_H_MAX = 900;

/**
 * Box–Muller: one N(0,1) sample.
 * @returns {number}
 */
function gaussian01() {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * @param {number} meanPx
 * @param {number} stdPx
 */
function sampleFryHeightPx(meanPx, stdPx) {
  const m = Math.max(FRY_H_MIN, Number.isFinite(meanPx) && meanPx > 0 ? meanPx : 150);
  const s = Math.max(0, Number.isFinite(stdPx) ? stdPx : 0);
  if (s <= 0) {
    return Math.min(FRY_H_MAX, Math.max(FRY_H_MIN, Math.round(m)));
  }
  const z = gaussian01();
  const h = Math.round(m + s * z);
  return Math.min(FRY_H_MAX, Math.max(FRY_H_MIN, h));
}

/**
 * @typedef {object} FryBody
 * @property {number} x
 * @property {number} y
 * @property {number} w
 * @property {number} h
 * @property {number} vx
 * @property {number} vy
 * @property {number} ang
 * @property {number} angV
 * @property {HTMLElement} el
 */

/**
 * @param {{
 *   layer: HTMLElement;
 *   params?: FrySimParams;
 *   onFrySpawned?: () => void;
 *   getTimeScale?: () => number;
 *   isSpawnAllowed?: () => boolean;
 * }} opts
 */
export function createFryShower(opts) {
  const layer = opts.layer;
  const getTimeScale = typeof opts.getTimeScale === "function" ? opts.getTimeScale : null;
  const isSpawnAllowed = typeof opts.isSpawnAllowed === "function" ? opts.isSpawnAllowed : null;
  const onFrySpawned = typeof opts.onFrySpawned === "function" ? opts.onFrySpawned : null;
  /** @type {FrySimParams} */
  const params = opts.params ?? createDefaultFrySimParams();

  /** @type {FryBody[]} */
  const bodies = [];

  /** Scheduled fries not yet spawned (release may add faster than cap allows). */
  let pendingSpawns = 0;

  /** Fries left to spawn for the current release batch (dial sync when not in SUPERHOT mode). */
  let remainingToSpawn = 0;

  /** @type {number[]} */
  let pendingTimeouts = [];

  let rafId = 0;
  let lastTs = 0;
  /** rAF id when waiting for isSpawnAllowed() before draining the stagger queue. */
  let spawnWaitRaf = 0;

  const prefersReduced =
    typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function maxConcurrent() {
    const n = Math.round(Number(params.maxConcurrent));
    return Math.max(1, Number.isFinite(n) && n > 0 ? n : 250);
  }

  /** Create one fry (caller ensures `bodies.length < maxConcurrent`). */
  function spawnOne() {
    const meanRaw = Number(params.displayHeight);
    const meanH = Math.max(FRY_H_MIN, Number.isFinite(meanRaw) && meanRaw > 0 ? meanRaw : 150);
    const stdRaw = Number(params.frySizeStdDev);
    const stdH = Number.isFinite(stdRaw) && stdRaw >= 0 ? stdRaw : 45;
    const displayHeight = sampleFryHeightPx(meanH, stdH);
    const displayWidth = displayHeight * FRY_AR;
    const w = displayWidth;
    const h = displayHeight;

    const wrap = document.createElement("div");
    wrap.className = "fp-fry";
    wrap.style.setProperty("--fp-w", `${w}px`);
    wrap.style.setProperty("--fp-h", `${h}px`);

    const img = document.createElement("img");
    img.className = "fp-fry__img";
    img.src = FRY_SRC;
    img.alt = "";
    img.width = Math.round(w);
    img.height = Math.round(h);
    img.decoding = "async";
    wrap.appendChild(img);

    const x = Math.random() * Math.max(8, window.innerWidth - w - 16) + 4;
    const y = -h - Math.random() * 60;

    const vxSpread = Math.max(0, Number(params.spawnVxSpread) || 0);
    const angSpread = Math.max(0, Number(params.spawnAngVSpread) || 0);

    /** @type {FryBody} */
    const body = {
      x,
      y,
      w,
      h,
      vx: (Math.random() - 0.5) * 2 * vxSpread,
      vy: 0,
      ang: (Math.random() - 0.5) * 0.5,
      angV: (Math.random() - 0.5) * 2 * angSpread,
      el: wrap,
    };

    wrap.style.transform = `translate3d(${body.x}px, ${body.y}px, 0) rotate(${body.ang}rad)`;
    layer.appendChild(wrap);
    bodies.push(body);
    remainingToSpawn = Math.max(0, remainingToSpawn - 1);
    if (onFrySpawned) onFrySpawned();
  }

  function scheduleSpawnDrainWhenAllowed() {
    if (!isSpawnAllowed || isSpawnAllowed()) return;
    if (spawnWaitRaf) return;
    function waitFrame() {
      spawnWaitRaf = 0;
      if (isSpawnAllowed && !isSpawnAllowed()) {
        spawnWaitRaf = requestAnimationFrame(waitFrame);
        return;
      }
      flushSpawnQueue();
      ensureTickLoop();
    }
    spawnWaitRaf = requestAnimationFrame(waitFrame);
  }

  /** Drain queue while under the concurrent cap (never drops a release count). */
  function flushSpawnQueue() {
    if (isSpawnAllowed && !isSpawnAllowed()) return;
    const cap = maxConcurrent();
    while (pendingSpawns > 0 && bodies.length < cap) {
      pendingSpawns -= 1;
      spawnOne();
    }
  }

  function ensureTickLoop() {
    if (!rafId && (bodies.length > 0 || pendingSpawns > 0)) {
      lastTs = 0;
      rafId = requestAnimationFrame(tick);
    }
  }

  function syncDom() {
    for (const b of bodies) {
      b.el.style.transform = `translate3d(${b.x}px, ${b.y}px, 0) rotate(${b.ang}rad)`;
    }
  }

  function tick(ts) {
    const rawDt = lastTs ? Math.min((ts - lastTs) / 1000, 0.055) : 0.016;
    let scale = getTimeScale ? Number(getTimeScale()) : 1;
    if (!Number.isFinite(scale) || scale < 0) scale = 1;
    scale = Math.min(Math.max(scale, 0), 4);
    const dt = rawDt * scale;
    lastTs = ts;

    flushSpawnQueue();

    const gRaw = Number(params.fallAccel);
    const g = Number.isFinite(gRaw) && gRaw > 0 ? gRaw : 2600;
    const vh = window.innerHeight;

    if (bodies.length > 0) {
      for (let i = bodies.length - 1; i >= 0; i -= 1) {
        const b = bodies[i];
        b.vy += g * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.ang += b.angV * dt;
        b.angV *= 0.998;

        if (b.y > vh + CULL_PAD) {
          b.el.remove();
          bodies.splice(i, 1);
        }
      }
      syncDom();
    }

    flushSpawnQueue();

    if (bodies.length === 0 && pendingSpawns === 0) {
      rafId = 0;
      lastTs = 0;
      return;
    }

    rafId = requestAnimationFrame(tick);
  }

  /**
   * @param {number} value
   */
  function release(value) {
    const burstCap = Math.max(1, Math.round(params.burstCap));
    const n = Math.min(Math.max(0, Math.abs(Math.round(Number(value)))), burstCap);
    if (n === 0) {
      for (const id of pendingTimeouts) window.clearTimeout(id);
      pendingTimeouts = [];
      pendingSpawns = 0;
      if (spawnWaitRaf) cancelAnimationFrame(spawnWaitRaf);
      spawnWaitRaf = 0;
      remainingToSpawn = 0;
      return;
    }

    for (const id of pendingTimeouts) window.clearTimeout(id);
    pendingTimeouts = [];
    pendingSpawns = 0;
    if (spawnWaitRaf) cancelAnimationFrame(spawnWaitRaf);
    spawnWaitRaf = 0;
    remainingToSpawn = n;

    if (prefersReduced) {
      const one = document.createElement("div");
      one.className = "fp-fry fp-fry--reduced fp-fry--toast";
      one.textContent = `${n} chip${n === 1 ? "" : "s"}`;
      layer.appendChild(one);
      remainingToSpawn = 0;
      window.setTimeout(() => one.remove(), 400);
      return;
    }

    const staggerMs = Math.max(0, staggerMsForBatchCount(n, params));
    for (let i = 0; i < n; i += 1) {
      const id = window.setTimeout(() => {
        pendingSpawns += 1;
        flushSpawnQueue();
        scheduleSpawnDrainWhenAllowed();
        ensureTickLoop();
      }, i * staggerMs);
      pendingTimeouts.push(id);
    }
    ensureTickLoop();
  }

  function clearPile() {
    for (const id of pendingTimeouts) window.clearTimeout(id);
    pendingTimeouts = [];
    pendingSpawns = 0;
    remainingToSpawn = 0;
    if (spawnWaitRaf) cancelAnimationFrame(spawnWaitRaf);
    spawnWaitRaf = 0;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    lastTs = 0;
    while (bodies.length) {
      const b = bodies.pop();
      if (b) b.el.remove();
    }
  }

  window.addEventListener("resize", () => {
    if (bodies.length) syncDom();
  });

  function getRemainingToSpawn() {
    return remainingToSpawn;
  }

  return { release, clearPile, getRemainingToSpawn };
}
