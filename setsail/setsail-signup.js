// Fill in with the /exec URL from the deployed Apps Script Web App
// (see setsail/apps-script.gs). Nothing will submit until this is set.
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwatlC_HaCgLyom9YK5Hpv_xrpTJFOFKZ5G9zg8vdJe-fNr97_WVAkgn7WEMJ_b_iKlmA/exec';

const SIGNED_UP_KEY = 'ss_signed_up';

const form = document.getElementById('signupForm');
const platformsField = document.getElementById('platformsField');
const submitBtn = form.querySelector('.ss-btn');
const chips = form.querySelectorAll('.ss-chip');

const selected = new Set();

// Click-origin fill: size and position the ::before circle so it grows
// from wherever the chip was clicked and reaches exactly far enough to
// cover the chip, regardless of click position. Keyboard activation
// (Enter/Space) fires a click with detail === 0 and no real pointer
// position, so those default to the chip's center instead.
function setRippleOrigin(chip, event) {
  const rect = chip.getBoundingClientRect();
  const fromKeyboard = event.detail === 0;
  const x = fromKeyboard ? rect.width / 2 : event.clientX - rect.left;
  const y = fromKeyboard ? rect.height / 2 : event.clientY - rect.top;
  const dx = Math.max(x, rect.width - x);
  const dy = Math.max(y, rect.height - y);
  const r = Math.sqrt(dx * dx + dy * dy);
  chip.style.setProperty('--rx', `${x}px`);
  chip.style.setProperty('--ry', `${y}px`);
  chip.style.setProperty('--ripple-r', `${r}px`);
}

chips.forEach((chip) => {
  chip.addEventListener('click', (event) => {
    setRippleOrigin(chip, event);
    const platform = chip.dataset.platform;
    const isOn = chip.getAttribute('aria-pressed') === 'true';
    chip.setAttribute('aria-pressed', String(!isOn));
    if (isOn) {
      selected.delete(platform);
    } else {
      selected.add(platform);
    }
    platformsField.value = [...selected].join(',');
    submitBtn.disabled = selected.size === 0;
  });
});

function showConfirmed() {
  const fieldGroup = form.querySelector('.ss-field-group');
  const note = form.querySelector('.ss-note');
  if (!fieldGroup) return; // already showing

  const confirm = document.createElement('div');
  confirm.className = 'ss-confirm';
  confirm.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>' +
    "<span>Welcome aboard! We'll write when it's time to Set Sail.</span>";
  fieldGroup.replaceWith(confirm);
  if (note) note.remove();
  form.querySelectorAll('.ss-chip').forEach((chip) => (chip.disabled = true));
}

// Soft, client-side-only block on resubmitting from the same browser. This
// is a UX nicety (don't make someone re-see an empty form after they've
// already signed up), not real protection — anyone bypassing localStorage
// (private window, clearing storage) gets past it trivially. The Apps
// Script backend de-dupes by email regardless, which is what actually holds.
try {
  if (localStorage.getItem(SIGNED_UP_KEY)) {
    showConfirmed();
  }
} catch (err) {
  // localStorage can throw in some private-browsing contexts — fine to skip.
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (selected.size === 0) return; // belt and suspenders alongside the disabled button

  const existingError = form.querySelector('.ss-error');
  if (existingError) existingError.remove();

  fetch(SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    body: new URLSearchParams(new FormData(form)),
  })
    .then(() => {
      try {
        localStorage.setItem(SIGNED_UP_KEY, '1');
      } catch (err) {
        // ignore — confirmation still shows for this page view either way
      }
      showConfirmed();
    })
    .catch(() => {
      const error = document.createElement('p');
      error.className = 'ss-error';
      error.textContent = "Couldn't reach the server — check your connection and try again.";
      form.appendChild(error);
    });
});
