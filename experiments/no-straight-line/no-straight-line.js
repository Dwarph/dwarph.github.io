/**
 * “No journey is a straight line” — draggable words + Verlet ropes.
 */

import {
  FRAME_WIDTH,
  FRAME_HEIGHT,
  WORD_DEFS,
  buildSceneLayout,
  catmullRomPath,
} from "./no-straight-line-layout.js";
import { createRopeSim } from "./no-straight-line-rope.js";
import { createDefaultParams } from "./no-straight-line-config.js";
import { ellipseNormDist } from "./no-straight-line-colliders.js";

const stage = document.getElementById("nsl-stage");
const frame = document.getElementById("nsl-frame");
const canvas = document.getElementById("nsl-rope-canvas");
const wordsLayer = document.getElementById("nsl-words");

if (!stage || !frame || !canvas || !wordsLayer) {
  throw new Error("Missing #nsl-stage, #nsl-frame, #nsl-rope-canvas, or #nsl-words");
}

const ctx = canvas.getContext("2d");
const params = createDefaultParams();
const scene = buildSceneLayout(params.ropeParticleCount);
const sim = createRopeSim(scene, params);

/** @type {HTMLElement[]} */
const wordEls = [];

const DISPLAY_SCALE = 0.8;
let scale = 1;
let offsetX = 0;
let offsetY = 0;
/** @type {number | null} */
let activePointerId = null;
let activeWordIndex = null;
let lastT = performance.now();
/** @type {{ x: number, y: number, t: number }[]} */
let dragTrail = [];

function fitStage() {
  const vw = stage.clientWidth;
  const vh = stage.clientHeight;
  scale = Math.min(vw / FRAME_WIDTH, vh / FRAME_HEIGHT) * DISPLAY_SCALE;
  offsetX = (vw - FRAME_WIDTH * scale) / 2;
  offsetY = (vh - FRAME_HEIGHT * scale) / 2;
  frame.style.setProperty("--nsl-scale", String(scale));
  frame.style.width = `${FRAME_WIDTH}px`;
  frame.style.height = `${FRAME_HEIGHT}px`;
  frame.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(FRAME_WIDTH * dpr);
  canvas.height = Math.round(FRAME_HEIGHT * dpr);
  canvas.style.width = `${FRAME_WIDTH}px`;
  canvas.style.height = `${FRAME_HEIGHT}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function clientToFrame(clientX, clientY) {
  const rect = stage.getBoundingClientRect();
  const x = (clientX - rect.left - offsetX) / scale;
  const y = (clientY - rect.top - offsetY) / scale;
  return { x, y };
}

function mountWords() {
  for (let i = 0; i < scene.words.length; i++) {
    const def = WORD_DEFS[i];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "nsl-word";
    btn.textContent = def.text;
    btn.dataset.wordIndex = String(i);
    btn.setAttribute("aria-label", `Drag word: ${def.text}`);
    wordsLayer.appendChild(btn);
    wordEls.push(btn);
  }
}

function updateWordDOM() {
  for (let i = 0; i < scene.words.length; i++) {
    const w = scene.words[i];
    const el = wordEls[i];
    el.style.transform = `translate(-50%, -50%) translate(${w.x}px, ${w.y}px)`;
    el.classList.toggle("nsl-word--dragging", sim.dragWordIndex === i);
  }
}

function drawRopes() {
  ctx.clearRect(0, 0, FRAME_WIDTH, FRAME_HEIGHT);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#E4FE5B";
  ctx.lineWidth = params.ropeLineWidth ?? 16;

  for (const rope of scene.ropes) {
    const pts = rope.particles.map((p) => ({ x: p.x, y: p.y }));
    const path = new Path2D(catmullRomPath(pts));
    ctx.stroke(path);
  }
}

function hitTestWord(frameX, frameY) {
  let best = -1;
  let bestDist = Infinity;
  for (let i = 0; i < scene.words.length; i++) {
    const w = scene.words[i];
    const nd = ellipseNormDist(w, frameX, frameY);
    if (nd < 1 && nd < bestDist) {
      bestDist = nd;
      best = i;
    }
  }
  return best;
}

function wordIndexFromTarget(target) {
  const el = target instanceof Element ? target.closest(".nsl-word") : null;
  if (!el) return -1;
  const idx = Number(el.dataset.wordIndex);
  return Number.isFinite(idx) ? idx : -1;
}

function bindDragWindowListeners(on) {
  const opt = { capture: true };
  if (on) {
    window.addEventListener("pointermove", onPointerMove, opt);
    window.addEventListener("pointerup", onPointerUp, opt);
    window.addEventListener("pointercancel", onPointerUp, opt);
  } else {
    window.removeEventListener("pointermove", onPointerMove, opt);
    window.removeEventListener("pointerup", onPointerUp, opt);
    window.removeEventListener("pointercancel", onPointerUp, opt);
  }
}

function onPointerDown(e) {
  if (activePointerId != null) return;
  if (e.button !== 0) return;

  const pt = clientToFrame(e.clientX, e.clientY);
  let idx = wordIndexFromTarget(e.target);
  if (idx < 0) idx = hitTestWord(pt.x, pt.y);
  if (idx < 0) return;

  activePointerId = e.pointerId;
  activeWordIndex = idx;
  dragTrail = [{ x: pt.x, y: pt.y, t: performance.now() }];
  sim.setDragWord(idx, pt.x, pt.y);
  updateWordDOM();
  drawRopes();
  stage.setPointerCapture(e.pointerId);
  bindDragWindowListeners(true);
  stage.classList.add("nsl-stage--dragging");
  e.preventDefault();
}

function onPointerMove(e) {
  if (e.pointerId !== activePointerId || activeWordIndex == null) return;
  const pt = clientToFrame(e.clientX, e.clientY);
  const t = performance.now();
  dragTrail.push({ x: pt.x, y: pt.y, t });
  if (dragTrail.length > 8) dragTrail.shift();
  sim.setDragWord(activeWordIndex, pt.x, pt.y);
  updateWordDOM();
  drawRopes();
  e.preventDefault();
}

function releaseVelocity() {
  if (dragTrail.length < 2) return null;
  const first = dragTrail[0];
  const last = dragTrail[dragTrail.length - 1];
  const dt = (last.t - first.t) / 1000;
  if (dt < 0.008) return null;
  return {
    vx: (last.x - first.x) / dt,
    vy: (last.y - first.y) / dt,
  };
}

function onPointerUp(e) {
  if (e.pointerId !== activePointerId) return;
  const vel = releaseVelocity();
  activePointerId = null;
  activeWordIndex = null;
  dragTrail = [];
  try {
    stage.releasePointerCapture(e.pointerId);
  } catch {
    /* ignore */
  }
  bindDragWindowListeners(false);
  stage.classList.remove("nsl-stage--dragging");
  sim.setDragWord(null, 0, 0, vel);
}

function tick(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now;
  sim.step(dt);
  updateWordDOM();
  drawRopes();
  requestAnimationFrame(tick);
}

mountWords();
fitStage();
sim.pinRopeEnds();
updateWordDOM();
drawRopes();

window.addEventListener("resize", fitStage);
stage.addEventListener("pointerdown", onPointerDown);
stage.addEventListener("lostpointercapture", (e) => {
  if (e.pointerId === activePointerId) onPointerUp(e);
});

requestAnimationFrame(tick);
