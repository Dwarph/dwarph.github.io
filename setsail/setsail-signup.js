// Fill in with the /exec URL from the deployed Apps Script Web App
// (see setsail/apps-script.gs). Nothing will submit until this is set.
const SCRIPT_URL = 'REPLACE_WITH_YOUR_APPS_SCRIPT_URL';

const form = document.getElementById('signupForm');
const platformsField = document.getElementById('platformsField');
const chips = form.querySelectorAll('.ss-chip');

const selected = new Set();

chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    const platform = chip.dataset.platform;
    const isOn = chip.getAttribute('aria-pressed') === 'true';
    chip.setAttribute('aria-pressed', String(!isOn));
    if (isOn) {
      selected.delete(platform);
    } else {
      selected.add(platform);
    }
    platformsField.value = [...selected].join(',');
  });
});

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const fieldGroup = form.querySelector('.ss-field-group');
  const note = form.querySelector('.ss-note');
  const existingError = form.querySelector('.ss-error');
  if (existingError) existingError.remove();

  fetch(SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    body: new URLSearchParams(new FormData(form)),
  })
    .then(() => {
      const confirm = document.createElement('div');
      confirm.className = 'ss-confirm';
      confirm.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>' +
        "<span>You're aboard — we'll write when it's time to set sail.</span>";
      fieldGroup.replaceWith(confirm);
      if (note) note.remove();
      form.querySelectorAll('.ss-chip').forEach((chip) => (chip.disabled = true));
    })
    .catch(() => {
      const error = document.createElement('p');
      error.className = 'ss-error';
      error.textContent = "Couldn't reach the server — check your connection and try again.";
      form.appendChild(error);
    });
});
