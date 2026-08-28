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
// deployed URL directly (e.g. with curl), not for the page itself.

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var email = e.parameter.email;
  if (!email) {
    return ContentService.createTextOutput(
      JSON.stringify({ result: 'error', error: 'missing email' })
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
