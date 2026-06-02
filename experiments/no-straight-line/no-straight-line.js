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
import { createDefaultRopeParams, createRopeSim } from "./no-straight-line-rope.js";

const stage = document.getElementById("nsl-stage");
const frame = document.getElementById("nsl-frame");
const canvas = document.getElementById("nsl-rope-canvas");
const wordsLayer = document.getElementById("nsl-words");

if (!stage || !frame || !canvas || !wordsLayer) {
  throw new Error("Missing #nsl-stage, #nsl-frame, #nsl-rope-canvas, or #nsl-words");
}

const ctx = canvas.getContext("2d");
const params = createDefaultRopeParams();
const scene = buildSceneLayout(12);
const sim = createRopeSim(scene, params);

/** @type {HTMLElement[]} */
const wordEls = [];

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
  scale = Math.min(vw / FRAME_WIDTH, vh / FRAME_HEIGHT);
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
  ctx.lineWidth = 16;

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
    const d = Math.hypot(frameX - w.x, frameY - w.y);
    const radius = w.radius;
    if (d < radius && d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

function onPointerDown(e) {
  if (activePointerId != null) return;
  const pt = clientToFrame(e.clientX, e.clientY);
  const idx = hitTestWord(pt.x, pt.y);
  if (idx < 0) return;

  activePointerId = e.pointerId;
  activeWordIndex = idx;
  dragTrail = [{ x: pt.x, y: pt.y, t: performance.now() }];
  sim.setDragWord(idx, pt.x, pt.y);
  stage.setPointerCapture(e.pointerId);
  stage.classList.add("nsl-stage--dragging");
  wordEls[idx].setPointerCapture(e.pointerId);
  e.preventDefault();
}

function onPointerMove(e) {
  if (e.pointerId !== activePointerId || activeWordIndex == null) return;
  const pt = clientToFrame(e.clientX, e.clientY);
  const t = performance.now();
  dragTrail.push({ x: pt.x, y: pt.y, t });
  if (dragTrail.length > 8) dragTrail.shift();
  sim.setDragWord(activeWordIndex, pt.x, pt.y);
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
  stage.releasePointerCapture(e.pointerId);
  stage.classList.remove("nsl-stage--dragging");
  sim.setDragWord(null, 0, 0, releaseVelocity());
  activePointerId = null;
  activeWordIndex = null;
  dragTrail = [];
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
stage.addEventListener("pointermove", onPointerMove);
stage.addEventListener("pointerup", onPointerUp);
stage.addEventListener("pointercancel", onPointerUp);

requestAnimationFrame(tick);
