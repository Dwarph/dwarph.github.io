// Fill in with the /exec URL from the deployed Apps Script Web App
// (see setsail/apps-script.gs). Nothing will submit until this is set.
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxFp2g4aiT8loG4Mj_hWissMwW6AgdKbLMsnbcOxSi9B4HdL0OU7ARHQ6j6MC_ATv6k1Q/exec';

const SIGNED_UP_KEY = 'ss_signed_up';

// :focus-visible alone isn't enough for the email field: browsers treat
// text-editable elements as always "focus-visible" even after a mouse
// click (the reasoning being you might start typing), unlike buttons where
// a click already correctly suppresses the ring. Track the most recent
// input modality and suppress the ring for the mouse case ourselves.
document.addEventListener('mousedown', () => {
  document.body.classList.add('ss-mouse-user');
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') document.body.classList.remove('ss-mouse-user');
});

const form = document.getElementById('signupForm');
const platformsField = document.getElementById('platformsField');
const submitBtn = form.querySelector('.ss-btn');
const chips = form.querySelectorAll('.ss-chip');
const emailInput = form.querySelector('input[type="email"]');

const selected = new Set();

// Recomputed on every chip toggle and email keystroke. The submit button
// stays disabled — rather than letting an invalid submit show a validation
// message — for as long as either condition isn't met; hovering the
// disabled button explains why via its tooltip (a static hint, not tied to
// which specific condition is unmet).
function updateSubmitState() {
  submitBtn.disabled = selected.size === 0 || !emailInput.checkValidity();
}
emailInput.addEventListener('input', updateSubmitState);
updateSubmitState();

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
    updateSubmitState();
  });
});

const ERROR_ICON =
  '<svg viewBox="0 -960 960 960" fill="currentColor"><path d="M508.5-291.5Q520-303 520-320t-11.5-28.5Q497-360 480-360t-28.5 11.5Q440-337 440-320t11.5 28.5Q463-280 480-280t28.5-11.5ZM440-440h80v-240h-80v240Zm40 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>';

function showError(message) {
  const existing = form.querySelector('.ss-error');
  if (existing) existing.remove();

  const error = document.createElement('div');
  error.className = 'ss-error';
  error.innerHTML = ERROR_ICON + `<span>${message}</span>`;
  form.appendChild(error);
}

// Caches checkSignupsOpen()'s result for a while so reloading the page (or
// opening it in a second tab) doesn't spend another call on a status that's
// very unlikely to have changed in the meantime — worth being stingy about
// given Apps Script's own daily quota is what this whole feature exists to
// protect. A failed/timed-out check gets cached too (as "open", matching
// the fail-open default), so a flaky endpoint isn't retried on every reload
// either.
const STATUS_CACHE_KEY = 'ss_signup_status';
const STATUS_CACHE_TTL_MS = 15 * 60 * 1000;

function getCachedSignupStatus() {
  try {
    const cached = JSON.parse(localStorage.getItem(STATUS_CACHE_KEY));
    if (!cached || Date.now() - cached.checkedAt > STATUS_CACHE_TTL_MS) return null;
    return cached;
  } catch (err) {
    return null;
  }
}

function setCachedSignupStatus(closed) {
  try {
    localStorage.setItem(STATUS_CACHE_KEY, JSON.stringify({ closed, checkedAt: Date.now() }));
  } catch (err) {
    // ignore — worst case this check just runs again next load
  }
}

// Loaded via a JSONP <script> tag rather than fetch: Apps Script's
// cross-origin support is inconsistent enough for POST that the submit
// itself is fire-and-forget (see below), and a <script> tag sidesteps that
// question entirely for this read instead of gambling on it working.
// Resolves to `{ closed: true|false }`, or null if the check couldn't
// complete for any reason (blocked, slow, script error) — treated as "fail
// open" so a network hiccup never blocks a real signup.
function checkSignupsOpen() {
  return new Promise((resolve) => {
    const callbackName = `ssSignupStatus${Date.now()}`;
    let settled = false;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      delete window[callbackName];
      script.remove();
      resolve(result);
    };

    window[callbackName] = (data) => finish(data);

    const script = document.createElement('script');
    script.src = `${SCRIPT_URL}?callback=${callbackName}`;
    script.onerror = () => finish(null);
    document.body.appendChild(script);

    setTimeout(() => finish(null), 4000);
  });
}

function showClosedForToday() {
  const fieldGroup = form.querySelector('.ss-field-group');
  const note = form.querySelector('.ss-note');
  if (!fieldGroup) return;

  const closed = document.createElement('div');
  closed.className = 'ss-closed';
  closed.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>' +
    '<span>Beta sign-ups are closed for today - return tomorrow ye land lubber!</span>';
  fieldGroup.replaceWith(closed);
  if (note) note.remove();
  form.querySelectorAll('.ss-chip').forEach((chip) => (chip.disabled = true));
}

function showConfirmed() {
  const fieldGroup = form.querySelector('.ss-field-group');
  const note = form.querySelector('.ss-note');
  if (!fieldGroup || fieldGroup.classList.contains('ss-confirming')) return; // already showing

  const btn = fieldGroup.querySelector('.ss-btn');
  const emailField = fieldGroup.querySelector('input[type="email"]');

  // Measure the button's real rendered width before switching it to
  // position:absolute, so the grow-to-full-width animation starts from its
  // true size instead of a guessed one.
  fieldGroup.style.setProperty('--ss-btn-start-width', `${btn.getBoundingClientRect().width}px`);
  fieldGroup.classList.add('ss-confirming');

  btn.innerHTML =
    '<span class="ss-btn-label ss-btn-label-old">Join the beta</span>' +
    '<span class="ss-btn-label ss-btn-label-new">' +
    '<span class="ss-confirm-badge">' +
    '<span class="ss-confirm-ring"></span>' +
    '<svg class="ss-confirm-check" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>' +
    '</span>' +
    '<span>Welcome aboard!</span>' +
    '</span>';
  btn.disabled = true;
  emailField.disabled = true;

  if (note) note.remove();
  form.querySelectorAll('.ss-chip').forEach((chip) => (chip.disabled = true));
}

// Soft, client-side-only block on resubmitting from the same browser. This
// is a UX nicety (don't make someone re-see an empty form after they've
// already signed up), not real protection — anyone bypassing localStorage
// (private window, clearing storage) gets past it trivially. The Apps
// Script backend de-dupes by email regardless, which is what actually holds
// — but this is checked again at submit time too (not just here), since a
// second tab open from before the first one signed up would otherwise have
// no way to know that and would fire a submission call we already know
// locally is redundant, which matters against a service with its own daily
// call quota.
try {
  if (localStorage.getItem(SIGNED_UP_KEY)) {
    showConfirmed();
  } else {
    const cached = getCachedSignupStatus();
    if (cached) {
      if (cached.closed) showClosedForToday();
    } else {
      checkSignupsOpen().then((status) => {
        const closed = !!(status && status.closed);
        setCachedSignupStatus(closed);
        if (closed) showClosedForToday();
      });
    }
  }
} catch (err) {
  // localStorage can throw in some private-browsing contexts — fine to skip.
}

form.addEventListener('submit', (e) => {
  e.preventDefault();

  try {
    if (localStorage.getItem(SIGNED_UP_KEY)) {
      showConfirmed(); // this tab missed it, but another tab already signed up
      return;
    }
  } catch (err) {
    // localStorage can throw in some private-browsing contexts — fall through.
  }

  const cached = getCachedSignupStatus();
  if (cached && cached.closed) {
    showClosedForToday();
    return;
  }

  // The button is disabled whenever either of these isn't met — this is
  // just defense in depth alongside that (e.g. a stale synthetic submit).
  if (selected.size === 0 || !emailInput.checkValidity()) return;

  const existingError = form.querySelector('.ss-error');
  if (existingError) existingError.remove();

  // Read the form's data before showConfirmed() disables the email field
  // and chips — disabled form controls are excluded from FormData, so
  // capturing this after disabling them would silently submit an empty
  // email.
  const body = new URLSearchParams(new FormData(form));

  // Show the confirmation — and disable the button/field, so a second
  // click or Enter press can't fire a second submit — immediately rather
  // than waiting on the Apps Script round-trip, which can take a couple of
  // seconds. This is a fire-and-forget beacon, not something worth
  // blocking the UI on.
  showConfirmed();
  try {
    localStorage.setItem(SIGNED_UP_KEY, '1');
  } catch (err) {
    // ignore — confirmation still shows for this page view either way
  }

  fetch(SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    body,
  }).catch(() => {
    showError("Couldn't reach the server — check your connection and try again.");
  });
});
