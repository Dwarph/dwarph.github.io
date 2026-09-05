/*
 * TEMPORARY exploration page - delete setsail/explore/ before committing.
 *
 * Deliberately does NOT load ../setsail-signup.js: that file posts to the live
 * Apps Script endpoint on submit, and this page exists to be clicked at. The
 * few lines below reproduce only the visual behaviour that matters for judging
 * a treatment - the chip's click-origin ripple and the button's enabled state.
 */

const VARIANTS = [
  { id: 'plate',     label: '1 Plate',     zoom: 250, note: 'Contained crop, page unchanged' },
  { id: 'porthole',  label: '2 Porthole',  zoom: 430, note: 'The illustration becomes the mark' },
  { id: 'tide',      label: '3 Tide',      zoom: null, note: 'Band on the bottom edge, masked' },
  { id: 'window',    label: '4 Window',    zoom: null, note: 'Full bleed, content on a card' },
  { id: 'overboard', label: '5 Overboard', zoom: null, note: 'Full bleed, content on the water' },
  { id: 'split',     label: '6 Split',     zoom: null, note: 'Sea on top, form on cream' },
];

const bar = document.getElementById('xpVariants');
const note = document.getElementById('xpNote');
const zoom = document.getElementById('xpZoom');

function setVariant(id) {
  const v = VARIANTS.find(x => x.id === id) || VARIANTS[0];
  document.body.dataset.variant = v.id;
  note.textContent = v.note;
  zoom.disabled = v.zoom === null;
  if (v.zoom !== null) {
    zoom.value = v.zoom;
    document.documentElement.style.setProperty('--sea-zoom', v.zoom + '%');
  }
  bar.querySelectorAll('button').forEach(b => b.setAttribute('aria-current', String(b.dataset.v === v.id)));
  if (location.hash.slice(1) !== v.id) history.replaceState(null, '', '#' + v.id);
}

VARIANTS.forEach(v => {
  const b = document.createElement('button');
  b.textContent = v.label;
  b.dataset.v = v.id;
  b.addEventListener('click', () => setVariant(v.id));
  bar.appendChild(b);
});

zoom.addEventListener('input', () => {
  document.documentElement.style.setProperty('--sea-zoom', zoom.value + '%');
});

const flag = (el, cls) => el.addEventListener('change', () => document.body.classList.toggle(cls, el.checked));
flag(document.getElementById('xpDrift'), 'xp-drift');
// Scrim is on by default for every variant that puts cream text on water;
// unticking it shows the AA failure rather than hiding it.
const scrimBox = document.getElementById('xpScrim');
scrimBox.addEventListener('change', () => document.body.classList.toggle('xp-noscrim', !scrimBox.checked));
flag(document.getElementById('xpHard'), 'xp-hard');

// ?bare=1 hides the switcher so screenshots show only the proposal.
if (new URLSearchParams(location.search).get('bare')) document.body.classList.add('xp-bare');

setVariant(location.hash.slice(1) || 'plate');
window.addEventListener('hashchange', () => setVariant(location.hash.slice(1)));

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
