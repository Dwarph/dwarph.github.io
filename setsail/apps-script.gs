// Set Sail — beta signup backend.
//
// This is NOT loaded by index.html — it runs on Google's infrastructure as
// an Apps Script Web App, deployed from the Google Sheet that collects
// signups. Kept here only so it survives if the Sheet/script is ever
// rebuilt. To (re)deploy:
//
//   1. Create a Google Sheet. Add header row: Timestamp, Email, Platforms.
//   2. Extensions > Apps Script, replace the placeholder code with this file.
//   3. Replace YOUR_EMAIL@example.com below with the address to notify.
//   4. Deploy > New deployment > type "Web app" > Execute as "Me",
//      Who has access "Anyone". Copy the /exec URL.
//   5. Paste that URL into setsail/setsail-signup.js as SCRIPT_URL.
//
// setsail-signup.js posts with `mode: 'no-cors'`, so the response body is
// never read by the page — the JSON below is for anyone testing the
// deployed URL directly, not for the page itself.
//
// Two abuse guards, both server-side (the only place either actually holds):
//   - Honeypot: the form has a hidden "website" field real visitors never
//     see or fill in. If it arrives non-empty, this is a bot — return a
//     normal-looking success without writing anything, so the bot can't
//     tell it was caught.
//   - Email de-dup: same email submitted twice (any reason: double-click,
//     the page's own localStorage soft-block bypassed, deliberate re-spam)
//     doesn't create a second row or a second notification email.

function doPost(e) {
  var honeypot = e.parameter.website;
  if (honeypot) {
    return ContentService.createTextOutput(
      JSON.stringify({ result: 'success' })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  var email = e.parameter.email;
  if (!email) {
    return ContentService.createTextOutput(
      JSON.stringify({ result: 'error', error: 'missing email' })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var normalized = email.trim().toLowerCase();
  var existingEmails = sheet
    .getRange(2, 2, Math.max(sheet.getLastRow() - 1, 0), 1)
    .getValues()
    .flat()
    .map(function (e) { return String(e).trim().toLowerCase(); });

  if (existingEmails.indexOf(normalized) !== -1) {
    return ContentService.createTextOutput(
      JSON.stringify({ result: 'success', note: 'already subscribed' })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  var platforms = e.parameter.platforms || ''; // e.g. "macOS,Windows" or ""
  sheet.appendRow([new Date(), email, platforms]);
  var notice = 'New Set Sail beta signup: ' + email +
    (platforms ? ' (' + platforms + ')' : '');
  MailApp.sendEmail('YOUR_EMAIL@example.com', 'New Set Sail beta signup', notice);
  return ContentService.createTextOutput(
    JSON.stringify({ result: 'success' })
  ).setMimeType(ContentService.MimeType.JSON);
}
