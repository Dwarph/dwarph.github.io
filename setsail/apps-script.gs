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
// setsail-signup.js posts with `mode: 'no-cors'`, so the response body of a
// *submission* is never read by the page — the JSON below is for anyone
// testing the deployed URL directly, not for the page itself. The one
// response the page does read is doGet's, loaded via a <script> tag (JSONP)
// rather than fetch, since that sidesteps CORS entirely rather than relying
// on Apps Script's uneven cross-origin support.
//
// Three abuse/quota guards, all server-side (the only place any of them
// actually holds):
//   - Honeypot: the form has a hidden "website" field real visitors never
//     see or fill in. If it arrives non-empty, this is a bot — return a
//     normal-looking success without writing anything, so the bot can't
//     tell it was caught.
//   - Email de-dup: same email submitted twice (any reason: double-click,
//     the page's own localStorage soft-block bypassed, deliberate re-spam)
//     doesn't create a second row or a second notification email.
//   - Daily cap: MailApp.sendEmail has a hard quota — 100/day on a
//     consumer Gmail account (raise DAILY_LIMIT if this is on a Workspace
//     account, which gets more). Once today's row count hits that, new
//     submissions are declined outright rather than risking the quota
//     error mid-send, and the page shows "closed for today" instead of a
//     working form.

var DAILY_LIMIT = 100;

function doPost(e) {
  var honeypot = e.parameter.website;
  if (honeypot) {
    return jsonResponse({ result: 'success' });
  }

  var email = e.parameter.email;
  if (!email) {
    return jsonResponse({ result: 'error', error: 'missing email' });
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var rows = getDataRows(sheet);
  var normalized = email.trim().toLowerCase();
  var existingEmails = rows.map(function (row) {
    return String(row[1]).trim().toLowerCase();
  });

  if (existingEmails.indexOf(normalized) !== -1) {
    return jsonResponse({ result: 'success', note: 'already subscribed' });
  }

  if (countToday(rows) >= DAILY_LIMIT) {
    return jsonResponse({ result: 'closed' });
  }

  var platforms = e.parameter.platforms || ''; // e.g. "macOS,Windows" or ""
  sheet.appendRow([new Date(), email, platforms]);
  var notice = 'New Set Sail beta signup: ' + email +
    (platforms ? ' (' + platforms + ')' : '');
  MailApp.sendEmail('pipturner.work@gmail.com', 'New Set Sail beta signup', notice);
  return jsonResponse({ result: 'success' });
}

// Read-only status check the page polls on load to decide whether to show
// the form or "closed for today". Takes an optional ?callback= for JSONP.
function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var closed = countToday(getDataRows(sheet)) >= DAILY_LIMIT;
  var payload = JSON.stringify({ closed: closed });

  var callback = e.parameter.callback;
  if (callback) {
    return ContentService.createTextOutput(callback + '(' + payload + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(payload).setMimeType(ContentService.MimeType.JSON);
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// All rows below the header, as [Timestamp, Email, Platforms]. getRange
// throws if asked for a 0-row range, which is exactly what a sheet with no
// signups yet (lastRow === 1, just the header — or 0 on a truly blank
// sheet) would otherwise ask for.
function getDataRows(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, 3).getValues();
}

function countToday(rows) {
  var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return rows.filter(function (row) {
    return row[0] instanceof Date &&
      Utilities.formatDate(row[0], Session.getScriptTimeZone(), 'yyyy-MM-dd') === today;
  }).length;
}
