const NARROW = matchMedia('(max-width: 899px)');
/* Every master is the same artwork padded out, so the boat keeps its x
 * position and its share of the width - but the aspect changes, and the maths
 * below can no longer assume 2:1. */
/* Boat metrics are measured per master rather than assumed: `landscape` is the
 * real painted 4:3 artwork (boat 156px wide at 51.75% / 49.79%), while `tall`
 * and `portrait` are that same file padded with flat colour, which shifts the
 * boat's vertical fraction as the canvas grows. */
const MASTERS = {
  original:  { iw: 3200, ih: 1600, bx: 0.5170, by: 0.4960, bw: 0.0481, label: 'Original 2.00' },
  landscape: { iw: 3200, ih: 2400, bx: 0.7559, by: 0.4925, bw: 0.0456, label: 'Landscape 1.33' },
  tall:      { iw: 3200, ih: 3600, bx: 0.7559, by: 0.4950, bw: 0.0456, label: 'Tall 0.89' },
  portrait:  { iw: 3200, ih: 4200, bx: 0.7559, by: 0.8200, bw: 0.0456, label: 'Portrait 0.76' },
  auto:      { label: 'Auto' },
};
const BOAT_AR = 130 / 156;

function master() {
  const m = document.body.dataset.master || 'original';
  if (m !== 'auto') return { key: m, ...MASTERS[m] };
  const k = NARROW.matches ? 'portrait' : 'landscape';
  return { key: k, ...MASTERS[k] };
}
const boatY = m => m.by;
const boatX = m => m.bx;

const VARIANTS = [
  { id: 'plate',    label: '1 Wide plate', note: 'The whole frame, uncropped, at the size it wanted' },
  { id: 'banner',   label: '2 Banner',     note: 'Edge to edge - as wide as the display allows' },
  { id: 'water',    label: '3 Open water', note: 'The ocean is the page; the picture moves, the UI never does' },
  { id: 'porthole', label: '4 Porthole',   note: 'The circle you liked, bigger' },
];
// Which CSS variable the size slider drives, and its range, per variant.
const SIZING = {
  plate:    { prop: '--plate-w', min: 480, max: 1600, val: 1120, unit: 'px' },
  porthole: { prop: '--dia',     min: 200, max: 720,  val: 420,  unit: 'px' },
};

const bar = document.getElementById('xpVariants');
const note = document.getElementById('xpNote');
const size = document.getElementById('xpSize');
const sizeVal = document.getElementById('xpSizeVal');

// The boat is 4.8% of the artwork's width and cropping can only enlarge it,
// so the honest readout is its size on screen, live. Shares its maths with the
// offset panel's boatBox() below - two readouts disagreeing on the same number
// is worse than having none.
function boatReport() {
  const shown = [...document.querySelectorAll('.sea')].find(e => getComputedStyle(e).display !== 'none');
  if (!shown) return '';
  const b = measureBoat(shown);
  const r = shown.getBoundingClientRect();
  return `boat ~${Math.round(b.w)}px in a ${Math.round(r.width)}px ocean (${(b.w / r.width * 100).toFixed(1)}% of frame)`;
}

function setVariant(id) {
  const v = VARIANTS.find(x => x.id === id) || VARIANTS[0];
  document.body.dataset.variant = v.id;
  const sz = SIZING[v.id];
  size.disabled = !sz;
  if (sz) {
    size.min = sz.min; size.max = sz.max; size.value = sz.val;
    document.documentElement.style.setProperty(sz.prop, sz.val + sz.unit);
  }
  bar.querySelectorAll('button').forEach(b => b.setAttribute('aria-current', String(b.dataset.v === v.id)));
  if (location.hash.slice(1) !== v.id) history.replaceState(null, '', '#' + v.id);
  sizeVal.textContent = sz ? sz.val + sz.unit : 'n/a';
  note.textContent = v.note + ' - ' + boatReport();
}

VARIANTS.forEach(v => {
  const b = document.createElement('button');
  b.textContent = v.label; b.dataset.v = v.id;
  b.addEventListener('click', () => setVariant(v.id));
  bar.appendChild(b);
});

size.addEventListener('input', () => {
  const sz = SIZING[document.body.dataset.variant];
  if (!sz) return;
  document.documentElement.style.setProperty(sz.prop, size.value + sz.unit);
  // Both breakpoints follow the slider, so the effect is visible at whatever
  // width the page is being viewed at.
  sizeVal.textContent = size.value + sz.unit;
  requestAnimationFrame(() => {
    note.textContent = VARIANTS.find(v => v.id === document.body.dataset.variant).note + ' - ' + boatReport();
  });
});

const flag = (el, cls) => el.addEventListener('change', () => document.body.classList.toggle(cls, el.checked));
flag(document.getElementById('xpDrift'), 'xp-drift');
flag(document.getElementById('xpMark'), 'xp-mark');
// Contrast treatments for Open Water. Default is 'focus': it is the only one
// that clears AA on the sail without flattening the rest of the ocean.
const FIXES = [['plate-cream','Plate cream'], ['plate-frost','Plate frost'], ['plate-dark','Plate dark'], ['frost','Frost'], ['focus','Focus'], ['raw','Raw']];
const fixBox = document.getElementById('xpFix');
fixBox.append('Contrast ');
FIXES.forEach(([id, label]) => {
  const b = document.createElement('button');
  b.textContent = label; b.dataset.fix = id;
  b.addEventListener('click', () => setFix(id));
  fixBox.appendChild(b);
});
function setFix(id) {
  document.body.dataset.fix = id;
  fixBox.querySelectorAll('button').forEach(b => b.setAttribute('aria-current', String(b.dataset.fix === id)));
}
setFix('plate-cream');
const offBox = document.getElementById('xpOffset');
offBox.addEventListener('change', () => document.body.classList.toggle('xp-offset', offBox.checked));

const q = new URLSearchParams(location.search);
/* Chrome visibility. `h` toggles, the state persists so it survives reloads
   (including the service-worker eviction reload), and ?bare=1 additionally
   removes the restore handle for clean screenshots. */
const CHROME_KEY = 'ss-explore-chrome-hidden';
function setChrome(hidden) {
  document.body.classList.toggle('xp-bare', hidden);
  try { localStorage.setItem(CHROME_KEY, hidden ? '1' : '0'); } catch (e) {}
}
if (q.get('bare')) {
  document.body.classList.add('xp-bare', 'xp-shot');
} else {
  try { setChrome(localStorage.getItem(CHROME_KEY) === '1'); } catch (e) {}
}
document.getElementById('xpHide').addEventListener('click', () => setChrome(true));
document.getElementById('xpRestore').addEventListener('click', () => setChrome(false));
addEventListener('keydown', e => {
  if (e.key.toLowerCase() !== 'h' || e.metaKey || e.ctrlKey || e.altKey) return;
  if (/^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
  setChrome(!document.body.classList.contains('xp-bare'));
});
setVariant(location.hash.slice(1) || 'plate');
window.addEventListener('hashchange', () => setVariant(location.hash.slice(1)));
if (q.get('size')) {
  const sz = SIZING[document.body.dataset.variant];
  if (sz) { document.documentElement.style.setProperty(sz.prop, q.get('size') + sz.unit); size.value = q.get('size'); }
}
if (q.get('fix')) setFix(q.get('fix'));
if (q.get('offset')) { document.body.classList.add('xp-offset'); document.getElementById('xpOffset').checked = true; }
if (q.get('master')) document.body.dataset.master = q.get('master');
if (q.get('mark')) { document.body.classList.add('xp-mark'); document.getElementById('xpMark').checked = true; }

/* --- Minimal reproduction of the real chip + button behaviour ------------ */

const form = document.getElementById('signupForm');
const chips = [...form.querySelectorAll('.ss-chip')];
const email = form.querySelector('input[type="email"]');
const submit = form.querySelector('.ss-btn');

function refresh() {
  const picked = chips.some(c => c.getAttribute('aria-pressed') === 'true');
  submit.disabled = !(picked && email.validity.valid && email.value);
}

chips.forEach(chip => {
  chip.addEventListener('click', e => {
    const r = chip.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    // Radius to the furthest corner, so the circle always covers the chip.
    const far = Math.hypot(Math.max(x, r.width - x), Math.max(y, r.height - y));
    chip.style.setProperty('--rx', x + 'px');
    chip.style.setProperty('--ry', y + 'px');
    chip.style.setProperty('--ripple-r', far + 'px');
    chip.setAttribute('aria-pressed', String(chip.getAttribute('aria-pressed') !== 'true'));
    refresh();
  });
});
email.addEventListener('input', refresh);


/* --- Image offset panel: zoom, x, y --------------------------------------
 *
 * Two independent sets of values, because the two breakpoints need genuinely
 * different numbers: wide has horizontal room and needs little zoom, one
 * column has none and has to move the boat vertically, which costs far more.
 * The panel edits whichever one is currently in play and says which.
 */
const OFF = {
  wide:   { zoom: 118, x: 4,  y: 50, mode: 'right', vars: ['--bleed-zoom', '--bleed-x', '--bleed-y'] },
  narrow: { zoom: 172, x: 50, y: 0,  mode: 'below', vars: ['--bleed-zoom-sm', '--bleed-x-sm', '--bleed-y-sm'] },
};

/* Centring the boat in a gutter is a rule, not a pair of numbers: the gutter
 * moves with the window, so it has to be recomputed rather than dialled in.
 *
 * background-position also accepts a length, which places the image's LEFT
 * edge that far from the container's - far easier to solve than percentages.
 * With the boat at 51.7% / 49.6% of the artwork:
 *
 *     left = targetX - 0.517 * renderedWidth
 *
 * The catch is that the image must still cover the viewport, so `left` is
 * pinned to [W - renderedWidth, 0]. That bounds how far the boat can reach,
 * and the reach is bought with zoom - so when a target is out of range the
 * zoom is raised to the minimum that reaches it, and the panel says so.
 */
const MODES = [['right', 'Right gutter'], ['left', 'Left gutter'],
               ['below', 'Below UI'], ['above', 'Above UI'], ['manual', 'Manual']];

function gutterTarget(mode) {
  const hero = document.querySelector('.ss-hero');
  if (!hero) return null;
  const h = hero.getBoundingClientRect();
  const W = innerWidth, H = innerHeight;
  switch (mode) {
    case 'right': return { x: (h.right + W) / 2, y: H / 2 };
    case 'left':  return { x: h.left / 2,        y: H / 2 };
    case 'below': return { x: W / 2, y: (h.bottom + H) / 2 };
    case 'above': return { x: W / 2, y: h.top / 2 };
    default: return null;
  }
}

/* How much flat fill is showing, per edge, at the current settings. Zooming
 * out below `cover` is a legitimate thing to want - it is how you see the
 * extended canvas - so this reports the fill rather than preventing it. */
function flatFill(el) {
  const m = master(), AR = m.iw / m.ih;
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  const bs = cs.backgroundSize;
  let rw, rh;
  if (bs === 'cover') {
    const sc = Math.max(r.width / m.iw, r.height / m.ih);
    rw = m.iw * sc; rh = m.ih * sc;
  } else if (bs.startsWith('auto')) {
    rh = r.height * parseFloat(bs.split(' ')[1]) / 100;
    rw = rh * AR;
  } else {
    rw = r.width * parseFloat(bs) / 100; rh = rw / AR;
  }
  const lx = resolvePos(cs.backgroundPositionX, r.width, rw);
  const ly = resolvePos(cs.backgroundPositionY, r.height, rh);
  return {
    left: Math.max(0, Math.round(lx)),
    right: Math.max(0, Math.round(r.width - (lx + rw))),
    top: Math.max(0, Math.round(ly)),
    bottom: Math.max(0, Math.round(r.height - (ly + rh))),
  };
}

let autoNote = '';
const panel = document.getElementById('xpOffsets');
const oZoom = document.getElementById('oZoom');
const oX = document.getElementById('oX');
const oY = document.getElementById('oY');
const out = document.getElementById('xpOut');
const bpLabel = document.getElementById('xpBp');
const bp = () => (NARROW.matches ? 'narrow' : 'wide');

function applyOffsets() {
  autoNote = '';
  for (const key of ['wide', 'narrow']) {
    const st = OFF[key];
    // Only the breakpoint actually in play can be solved, since the maths
    // needs the live viewport and the measured UI box.
    if (st.mode !== 'manual' && key === bp()) {
      const t = gutterTarget(st.mode);
      if (t) {
        const m = master(), AR = m.iw / m.ih;
        const W = innerWidth, H = innerHeight;
        // Never smaller than `cover`. Zooming out below it is what exposed the
        // flat fill down the side; the gutter can always be reached by zooming
        // IN instead, which costs a little boat size and no border at all.
        const coverW = Math.max(W, H * AR);
        const rw = Math.max(coverW, t.x / m.bx, (t.y / m.by) * AR);
        const rh = rw / AR;
        // Offsets stay inside [viewport - rendered, 0] so an edge can never
        // come into frame.
        const lx = Math.min(0, Math.max(W - rw, t.x - m.bx * rw));
        const ly = Math.min(0, Math.max(H - rh, t.y - m.by * rh));
        st.zoom = Math.round(rh / H * 100);
        document.documentElement.style.setProperty(st.vars[0], st.zoom + '%');
        document.documentElement.style.setProperty(st.vars[1], lx + 'px');
        document.documentElement.style.setProperty(st.vars[2], ly + 'px');
        continue;
      }
    }
    document.documentElement.style.setProperty(st.vars[0], st.zoom + '%');
    document.documentElement.style.setProperty(st.vars[1], st.x + '%');
    document.documentElement.style.setProperty(st.vars[2], st.y + '%');
  }
}

/* Where the boat actually lands, read from computed style rather than from the
   slider values, so it stays honest if any CSS overrides them. Boat centre is
   at 51.7% / 49.6% of the artwork and is 4.8% of its width. */
/* background-position comes back as a percentage in manual mode and as a
 * length in the gutter modes, and the two resolve completely differently -
 * treating "719.428px" as 719% put the boat 2700px off screen in the readout
 * while the page itself was correct. Resolve by unit, once, for both readers. */
function resolvePos(str, container, rendered) {
  const v = parseFloat(str) || 0;
  return String(str).trim().endsWith('%') ? (container - rendered) * v / 100 : v;
}

function measureBoat(el) {
  const m = master(), AR = m.iw / m.ih;
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  const bs = cs.backgroundSize;
  let rw, rh;
  if (bs === 'cover') {
    const sc = Math.max(r.width / m.iw, r.height / m.ih);
    rw = m.iw * sc; rh = m.ih * sc;
  } else if (bs.startsWith('auto')) {
    rh = r.height * parseFloat(bs.split(' ')[1]) / 100;
    rw = rh * AR;
  } else {
    rw = r.width * parseFloat(bs) / 100;
    rh = rw / AR;
  }
  const ox = resolvePos(cs.backgroundPositionX, r.width, rw);
  const oy = resolvePos(cs.backgroundPositionY, r.height, rh);
  const bw = m.bw * rw, bh = bw * BOAT_AR;
  const cx = r.left + ox + boatX(m) * rw, cy = r.top + oy + boatY(m) * rh;
  return { l: cx - bw / 2, t: cy - bh / 2, r: cx + bw / 2, b: cy + bh / 2, w: bw };
}

function boatBox() {
  const sea = document.querySelector('.sea--bleed');
  if (!sea || getComputedStyle(sea).display === 'none') return null;
  return measureBoat(sea);
}

function report() {
  const b = boatBox();
  if (!b) { out.textContent = ''; return; }
  const hero = document.querySelector('.ss-hero').getBoundingClientRect();
  const hits = !(b.r < hero.left || b.l > hero.right || b.b < hero.top || b.t > hero.bottom);
  const off = b.l < 0 || b.t < 0 || b.r > innerWidth || b.b > innerHeight;
  const pct = (b.w / innerWidth * 100).toFixed(1);
  const state = hits
    ? '<span class="xp-bad">overlaps the UI</span>'
    : off ? '<span class="xp-bad">partly off screen</span>'
          : '<span class="xp-ok">clear of the UI</span>';
  let extra = '';
  const st = OFF[bp()];
  if (st.mode !== 'manual') {
    const hero = document.querySelector('.ss-hero').getBoundingClientRect();
    const gut = st.mode === 'right' ? innerWidth - hero.right
              : st.mode === 'left'  ? hero.left
              : st.mode === 'below' ? innerHeight - hero.bottom
              : hero.top;
    const span = st.mode === 'right' || st.mode === 'left' ? b.w : (b.b - b.t);
    extra = gut <= 0
      ? `<br><span class="xp-bad">no gutter &mdash; the UI reaches that edge</span>`
      : `<br>gutter ${Math.round(gut)}px &mdash; ` +
        (gut > span
          ? `<span class="xp-ok">boat fits with ${Math.round((gut - span) / 2)}px each side</span>`
          : `<span class="xp-bad">boat is bigger than the gutter</span>`);
  }
  const sea = document.querySelector('.sea--bleed');
  if (sea) {
    const f = flatFill(sea);
    const edges = [['L', f.left], ['R', f.right], ['T', f.top], ['B', f.bottom]].filter(e => e[1] > 0);
    extra += edges.length
      ? `<br>flat fill: ${edges.map(e => e[0] + ' ' + e[1] + 'px').join(', ')}`
      : '<br>artwork covers the viewport';
  }
  out.innerHTML = `boat <b>${Math.round(b.w)}px</b> (${pct}% of width)<br>at ${Math.round(b.l)},${Math.round(b.t)} &mdash; ${state}${extra}`;
  // Keep the bar's note in step - it reads the same measurement, and two
  // readouts drifting apart is worse than one.
  const v = VARIANTS.find(x => x.id === document.body.dataset.variant);
  if (v) note.textContent = v.note + ' - ' + boatReport();
}

function setMode(m) {
  OFF[bp()].mode = m;
  applyOffsets();
  syncPanel();
}

function syncPanel() {
  const s = OFF[bp()];
  document.getElementById('xpModes').querySelectorAll('button')
    .forEach(b => b.setAttribute('aria-current', String(b.dataset.m === s.mode)));
  const mk = document.body.dataset.master || 'original';
  document.getElementById('xpMasters').querySelectorAll('button')
    .forEach(b => b.setAttribute('aria-current', String(b.dataset.k === mk)));
  const auto = s.mode !== 'manual';
  oX.closest('label').classList.toggle('is-auto', auto);
  oY.closest('label').classList.toggle('is-auto', auto);
  oZoom.closest('label').classList.toggle('is-auto', auto);
  oZoom.value = s.zoom;
  document.getElementById('vZoom').textContent = s.zoom + '%';
  if (s.mode === 'manual') {
    oX.value = s.x; oY.value = s.y;
    document.getElementById('vX').textContent = s.x + '%';
    document.getElementById('vY').textContent = s.y + '%';
  } else {
    const cs = getComputedStyle(document.querySelector('.sea--bleed'));
    document.getElementById('vX').textContent = Math.round(parseFloat(cs.backgroundPositionX)) + 'px';
    document.getElementById('vY').textContent = Math.round(parseFloat(cs.backgroundPositionY)) + 'px';
  }
  bpLabel.textContent = bp() === 'narrow'
    ? `one column (${innerWidth}px) - vertical travel needed`
    : `wide (${innerWidth}px) - horizontal travel is enough`;
  report();
}

Object.entries(MASTERS).forEach(([key, m]) => {
  const b = document.createElement('button');
  b.textContent = m.label; b.dataset.k = key;
  b.addEventListener('click', () => {
    document.body.dataset.master = key;
    applyOffsets();
    syncPanel();
  });
  document.getElementById('xpMasters').appendChild(b);
});

MODES.forEach(([m, label]) => {
  const b = document.createElement('button');
  b.textContent = label; b.dataset.m = m;
  b.addEventListener('click', () => setMode(m));
  document.getElementById('xpModes').appendChild(b);
});

[['oZoom', 'zoom', 'vZoom'], ['oX', 'x', 'vX'], ['oY', 'y', 'vY']].forEach(([id, key, lab]) => {
  document.getElementById(id).addEventListener('input', e => {
    OFF[bp()][key] = +e.target.value;
    document.getElementById(lab).textContent = e.target.value + '%';
    applyOffsets();
    report();
  });
});

/* The gutter modes solve to a closed form in pure CSS, because the only
 * unknowns on a horizontal gutter are the viewport and the UI's max-width:
 *
 *   targetX(right gutter) = 0.75W + UIw/4
 *   left = targetX - 0.517 * renderedWidth,  renderedWidth = 2 * zoom * 100vh
 *
 * so left = calc(75vw + (UIw/4)px - (103.4 * zoom)vh), and no JS is needed on
 * the real page. The vertical gutters do NOT reduce this way - they depend on
 * the hero's rendered height, which CSS cannot read - so those are emitted as
 * the measured pixel values with a warning.
 */
function offsetCSS(state, sel) {
  const m = master(), AR = m.iw / m.ih;
  const uiw = document.querySelector('.ss-hero').getBoundingClientRect().width;
  if (state.mode === 'right' || state.mode === 'left') {
    // Solve the width that puts the boat on the gutter centre with the image's
    // own edge flush to the viewport's:
    //   gutter centre = 0.75W + uiw/4      (right gutter)
    //   boat sits at bx of the artwork  ->  width = centre / bx
    // which lands background-position exactly on `left` (or `right`).
    const side = state.mode === 'right' ? 'left' : 'right';
    const vw = (75 / m.bx).toFixed(2);
    const px = (uiw / 4 / m.bx).toFixed(1);
    const vh = (100 * AR).toFixed(2);
    return `${sel} {\n  background-image: url('assets/ocean.webp');\n  background-repeat: no-repeat;\n` +
      `  /* Width solved so the boat lands on the gutter centre. The max() is a\n` +
      `     floor at \`cover\` - below it the artwork stops filling the viewport\n` +
      `     and you get flat colour down the side. */\n` +
      `  background-size: max(calc(${vw}vw + ${px}px), 100vw, ${vh}vh) auto;\n` +
      `  background-position: ${side} center;\n}`;
  }
  if (state.mode === 'manual') {
    return `${sel} {\n  background-size: auto ${state.zoom}%;\n  background-position: ${state.x}% ${state.y}%;\n}`;
  }
  const cs = getComputedStyle(document.querySelector('.sea--bleed'));
  return `${sel} {\n  background-size: auto ${state.zoom}%;\n  /* NOTE: a vertical gutter depends on the hero's rendered height, which\n     CSS cannot measure - these are the values at ${innerWidth}x${innerHeight}\n     and will drift if the copy or type size changes. */\n  background-position: ${Math.round(parseFloat(cs.backgroundPositionX))}px ${Math.round(parseFloat(cs.backgroundPositionY))}px;\n}`;
}

document.getElementById('xpCopy').addEventListener('click', () => {
  const css = offsetCSS(OFF.wide, '.ss-sea') + '\n\n@media (max-width: 899px) {\n' +
    offsetCSS(OFF.narrow, '  .ss-sea').split('\n').join('\n') + '\n}';
  navigator.clipboard.writeText(css).then(() => {
    const b = document.getElementById('xpCopy');
    b.textContent = 'Copied';
    setTimeout(() => (b.textContent = 'Copy CSS'), 1200);
  });
});

// URL params for the offset state, so a specific setup can be linked rather
// than re-dialled: ?mode=right&zoom=73
{
  const qp = new URLSearchParams(location.search);
  if (qp.get('mode')) OFF[bp()].mode = qp.get('mode');
  if (qp.get('zoom')) OFF[bp()].zoom = +qp.get('zoom');
}

function togglePanel() {
  const on = document.body.classList.contains('xp-offset') && document.body.dataset.variant === 'water';
  panel.hidden = !on;
  if (on) syncPanel();
}
NARROW.addEventListener('change', syncPanel);
// syncPanel() also refreshes the readouts, which must stay live even when the
// panel is hidden - otherwise a screenshot or an embed reports stale numbers.
addEventListener('resize', () => { applyOffsets(); syncPanel(); });
new MutationObserver(togglePanel).observe(document.body, { attributes: true, attributeFilter: ['class', 'data-variant'] });
// The painted 4:3 file is now the real artwork, so it is the default.
if (!document.body.dataset.master) document.body.dataset.master = 'landscape';
applyOffsets();
togglePanel();
