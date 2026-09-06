// Set Sail — beta signup backend.
//
// This is NOT loaded by index.html — it runs on Google's infrastructure as
// an Apps Script Web App, deployed from the Google Sheet that collects
// signups. Kept here only so it survives if the Sheet/script is ever
// rebuilt.
//
// The project is two files: this one and apps-script-email.gs. Apps Script
// shares one global scope across a project's files, so the split is purely
// for readability and the file names don't matter.
//
// UPDATING THE LIVE DEPLOYMENT (the usual case):
//
//   1. Back the Sheet up first (File > Make a copy). ensureHeaders()
//      rewrites row 1 on the next write.
//   2. Sheet > Extensions > Apps Script. Paste this file over the existing
//      one, and add apps-script-email.gs as a second script file.
//   3. Run runTests() from the editor. It sends nothing, but it is the
//      cheapest way to trigger the authorisation prompt: this version uses
//      GmailApp where the old one used only MailApp, which is a broader
//      scope, so Google WILL ask to re-authorise even though the script is
//      already deployed. Expect the "hasn't verified this app" screen.
//   4. Deploy > Manage deployments > pencil icon > Version: "New version"
//      > Deploy.
//
//      NOT "New deployment" - that mints a *different* /exec URL and the
//      live form keeps posting to the old one, so signups would silently
//      carry on hitting the previous version. Editing the existing
//      deployment keeps the URL in setsail-signup.js valid.
//   5. Add two time-driven triggers (Triggers > Add trigger):
//        drainPending  - hourly
//        dailyDigest   - daily, ~9am
//   6. Once the Windows Store listing clears certification, set MSSTORE_URL
//      and run notifyWindowsStoreLive() once, by hand, from the editor.
//
// FIRST-TIME SETUP (only if the Sheet/script is being rebuilt): create a
// Sheet, add both files under Extensions > Apps Script, fill in the config
// below, then Deploy > New deployment > "Web app", Execute as "Me", Who has
// access "Anyone", and paste the /exec URL into setsail/setsail-signup.js as
// SCRIPT_URL. Headers are written automatically on the first write, and an
// existing 3-column sheet is migrated in place.
//
// setsail-signup.js posts with `mode: 'no-cors'`, so the response body of a
// *submission* is never read by the page — the JSON below is for anyone
// testing the deployed URL directly, not for the page itself. The one
// response the page does read is doGet's, loaded via a <script> tag (JSONP)
// rather than fetch, since that sidesteps CORS entirely rather than relying
// on Apps Script's uneven cross-origin support.
//
// Guards, all server-side (the only place any of them actually holds):
//   - Honeypot: the form has a hidden "website" field real visitors never
//     see or fill in. If it arrives non-empty, this is a bot — return a
//     normal-looking success without writing anything, so the bot can't
//     tell it was caught.
//   - Email de-dup: a repeat submission updates the existing row rather
//     than adding a second one. It *does* re-send the confirmation (people
//     resubmit precisely because they lost the email), rate-limited by
//     RESEND_COOLDOWN_MS so it can't be used to mailbomb an address.
//   - Daily cap: an abuse ceiling on rows per day. Deliberately NOT tied to
//     the mail quota any more — see the note below.
//
// On quota: Gmail caps sending at 100 recipients/day on a consumer account.
// That used to be what DAILY_LIMIT mirrored, which meant running out of
// email quota *rejected signups* — the worst possible trade, since an
// address costs nothing to store and is the whole point of the form. Now
// every valid signup is always written; only the confirmation is
// rate-limited. Anything that can't be sent today is marked "pending" and
// picked up by drainPending() on the next hourly run.

var DAILY_LIMIT = 1000;              // abuse ceiling on rows/day, not a mail cap
var SEND_QUOTA_RESERVE = 5;          // leave headroom so the digest can always send
var RESEND_COOLDOWN_MS = 60 * 60 * 1000;

// --- Config -----------------------------------------------------------
// Fill these in. TESTFLIGHT_URL: App Store Connect > TestFlight > the
// external group's public link. MSSTORE_URL: Partner Center > Product
// identity > URL.
var TESTFLIGHT_URL = 'https://testflight.apple.com/join/4W2dFvxB';
// Product ID 9MXCL0SRB1M9 is allocated, but the listing is still in
// certification and the URL currently returns HTTP 410, so this stays empty
// on purpose: buildConfirmation() says the build is in review rather than
// handing someone a dead link.
//
// When it goes live, swap the empty string for:
//   'https://apps.microsoft.com/detail/9MXCL0SRB1M9'
// then run notifyWindowsStoreLive() once. Verify it loads signed-out first,
// since a publisher sees their own listing before the public does.
//
// The share button's ?cid=DevShareMCLPCS is deliberately dropped. It tags
// the traffic as a developer share, which is not what an email is, and the
// listing resolves without it. Add a campaign tag of your own if you ever
// want to tell email installs apart from the rest.
var MSSTORE_URL    = '';

// support@pipturner.co.uk is a real mailbox, but not a Gmail one, so it is
// only usable as a From address if it has been added under Gmail's
// "Send mail as" (which needs that provider's SMTP details). sendMail()
// checks rather than assumes: unverified, mail goes out as the script
// account and this address is still used for Reply-To, so replies land in
// the right inbox either way.
var FROM_EMAIL     = 'support@pipturner.co.uk';
var FROM_NAME      = 'Set Sail';
var REPLY_TO       = 'support@pipturner.co.uk';
var DIGEST_TO      = 'pipturner.work@gmail.com';

var SITE_URL       = 'https://pipturner.co.uk/setsail/';
var CHANGELOG_URL  = 'https://pipturner.co.uk/setsail/changelog/';
// Gmail strips inline SVG, so the mark has to be a hosted raster. Leave
// blank to render the email without a logo rather than a broken image.
var LOGO_URL       = 'https://pipturner.co.uk/setsail/assets/email-logo.png';

// Column layout. Status/LastSent were added after launch; ensureHeaders()
// migrates older 3-column sheets on the next write.
//
// Status is one of:
//   sent          confirmation delivered, with every link the person asked for
//   sent-partial  delivered, but Windows was requested while MSSTORE_URL was
//                 still empty, so that half of the email had nothing to click.
//                 notifyWindowsStoreLive() clears these once the listing is up.
//   pending       not sent yet (mail quota spent, or a send threw).
//                 drainPending() retries hourly.
var COL_TIMESTAMP = 0;
var COL_EMAIL     = 1;
var COL_PLATFORMS = 2;
var COL_STATUS    = 3;
var COL_LASTSENT  = 4;
var NUM_COLS      = 5;
var HEADERS = ['Timestamp', 'Email', 'Platforms', 'Status', 'LastSent'];

function doPost(e) {
  var honeypot = e.parameter.website;
  if (honeypot) {
    return jsonResponse({ result: 'success' });
  }

  var email = e.parameter.email;
  if (!email) {
    return jsonResponse({ result: 'error', error: 'missing email' });
  }

  var platforms = e.parameter.platforms || ''; // e.g. "macOS,Windows" or ""
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  ensureHeaders(sheet);

  var rows = getDataRows(sheet);
  var normalized = email.trim().toLowerCase();
  var existingIndex = -1;
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][COL_EMAIL]).trim().toLowerCase() === normalized) {
      existingIndex = i;
      break;
    }
  }

  if (existingIndex !== -1) {
    handleRepeatSignup(sheet, rows, existingIndex, email, platforms);
    return jsonResponse({ result: 'success', note: 'already subscribed' });
  }

  if (countToday(rows) >= DAILY_LIMIT) {
    return jsonResponse({ result: 'closed' });
  }

  // Write first, send second: the address is the thing worth keeping, so it
  // must not depend on the mail step succeeding.
  sheet.appendRow([new Date(), email, platforms, 'pending', '']);
  deliverConfirmation(sheet, sheet.getLastRow(), email, platforms);
  return jsonResponse({ result: 'success' });
}

// A repeat submission. Keep the original signup date (so countToday and the
// digest stay honest), refresh the platform selection if it changed, and
// re-send the confirmation unless one went out recently.
function handleRepeatSignup(sheet, rows, index, email, platforms) {
  var rowNumber = index + 2; // +1 for the header, +1 for 1-based rows
  var row = rows[index];

  if (platforms && String(row[COL_PLATFORMS]) !== platforms) {
    sheet.getRange(rowNumber, COL_PLATFORMS + 1).setValue(platforms);
    row[COL_PLATFORMS] = platforms;
  }

  var lastSent = row[COL_LASTSENT];
  if (lastSent instanceof Date && (Date.now() - lastSent.getTime()) < RESEND_COOLDOWN_MS) {
    return; // too soon — silently do nothing, the client sees success either way
  }
  deliverConfirmation(sheet, rowNumber, email, String(row[COL_PLATFORMS] || ''));
}

// Try to send now; fall back to the pending queue if the daily mail quota
// is spent. Either way the row keeps a truthful Status.
function deliverConfirmation(sheet, rowNumber, email, platforms) {
  if (MailApp.getRemainingDailyQuota() <= SEND_QUOTA_RESERVE) {
    setRowStatus(sheet, rowNumber, 'pending', null);
    return false;
  }
  try {
    var mail = buildConfirmation(platforms);
    sendMail(email, mail.subject, mail.htmlBody, mail.plainBody);
    // A Windows signup sent while MSSTORE_URL is still empty got an email
    // with nothing to click. Mark it so notifyWindowsStoreLive() can find
    // exactly those people once the listing clears certification, rather
    // than mailing the whole list again.
    setRowStatus(sheet, rowNumber, isPartial(platforms) ? 'sent-partial' : 'sent', new Date());
    return true;
  } catch (err) {
    // Leave it pending so drainPending() retries rather than dropping it.
    setRowStatus(sheet, rowNumber, 'pending', null);
    console.error('Confirmation send failed for row ' + rowNumber + ': ' + err);
    return false;
  }
}

// True when the email we can send right now is missing a link the person
// actually asked for. Only Windows can be in this state, and only while
// MSSTORE_URL is empty.
function isPartial(platforms) {
  return !MSSTORE_URL && normalizePlatforms(platforms).win;
}

// Run this by hand, once, after filling in MSSTORE_URL. Re-sends the
// confirmation to everyone who signed up for Windows while the Store
// listing was still in certification, and only to them.
function notifyWindowsStoreLive() {
  if (!MSSTORE_URL) {
    throw new Error('MSSTORE_URL is still empty. Fill it in first, or this re-sends the same incomplete email.');
  }
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  ensureHeaders(sheet);
  var rows = getDataRows(sheet);
  var sent = 0;

  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][COL_STATUS]) !== 'sent-partial') continue;
    if (MailApp.getRemainingDailyQuota() <= SEND_QUOTA_RESERVE) break;
    var email = String(rows[i][COL_EMAIL]).trim();
    if (!email) continue;
    if (deliverConfirmation(sheet, i + 2, email, String(rows[i][COL_PLATFORMS] || ''))) {
      sent++;
    }
  }
  Logger.log('Re-sent to ' + sent + ' Windows signup(s).');
  return sent;
}

function setRowStatus(sheet, rowNumber, status, sentAt) {
  sheet.getRange(rowNumber, COL_STATUS + 1).setValue(status);
  if (sentAt) sheet.getRange(rowNumber, COL_LASTSENT + 1).setValue(sentAt);
}

// Hourly trigger. Works oldest-first so a backlog clears in signup order,
// and stops as soon as the quota headroom is gone rather than throwing.
function drainPending() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  ensureHeaders(sheet);
  var rows = getDataRows(sheet);
  var sent = 0;

  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][COL_STATUS]) !== 'pending') continue;
    if (MailApp.getRemainingDailyQuota() <= SEND_QUOTA_RESERVE) break;
    var email = String(rows[i][COL_EMAIL]).trim();
    if (!email) continue;
    if (deliverConfirmation(sheet, i + 2, email, String(rows[i][COL_PLATFORMS] || ''))) {
      sent++;
    }
  }
  return sent;
}

// Daily trigger. Replaces the old per-signup notification, which doubled
// every send — with a confirmation now going to the signup too, that would
// have halved the effective daily ceiling to 50.
function dailyDigest() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var rows = getDataRows(sheet);
  var today = countToday(rows);
  var pending = rows.filter(function (r) { return String(r[COL_STATUS]) === 'pending'; }).length;
  var partial = rows.filter(function (r) { return String(r[COL_STATUS]) === 'sent-partial'; }).length;

  var todaysRows = rows.filter(function (r) { return isToday(r[COL_TIMESTAMP]); });
  var lines = todaysRows.map(function (r) {
    return '  ' + r[COL_EMAIL] + (r[COL_PLATFORMS] ? '  (' + r[COL_PLATFORMS] + ')' : '') +
      '  [' + (r[COL_STATUS] || '?') + ']';
  });

  var body = 'Set Sail beta signups\n\n' +
    'New today: ' + today + '\n' +
    'Total: ' + rows.length + '\n' +
    'Awaiting send: ' + pending + '\n' +
    (partial
      ? 'Waiting on the Windows Store listing: ' + partial +
        ' (run notifyWindowsStoreLive() once MSSTORE_URL is set)\n'
      : '') +
    'Mail quota left today: ' + MailApp.getRemainingDailyQuota() + '\n\n' +
    (lines.length ? 'Today:\n' + lines.join('\n') + '\n' : 'No new signups today.\n');

  MailApp.sendEmail(DIGEST_TO, 'Set Sail signups — ' + today + ' new', body);
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

// Every send goes through here, so swapping Gmail for an email service
// later (Brevo's free tier is 300/day, SES is 50k/day for pennies) is a
// change to this function alone.
function sendMail(to, subject, htmlBody, plainBody) {
  // Reply-To is set unconditionally: support@ is a real mailbox whether or
  // not Gmail can send *as* it, so replies should reach it either way.
  var options = { htmlBody: htmlBody, name: FROM_NAME, replyTo: REPLY_TO };
  // `from` is different: passing an address Gmail hasn't verified throws,
  // so it only goes on once the alias actually exists.
  if (FROM_EMAIL && GmailApp.getAliases().indexOf(FROM_EMAIL) !== -1) {
    options.from = FROM_EMAIL;
  }
  GmailApp.sendEmail(to, subject, plainBody, options);
}

// Writes the header row on a blank sheet, and widens an older 3-column
// sheet to include Status/LastSent, so an existing deployment picks up the
// new layout without anyone editing the Sheet by hand.
function ensureHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, NUM_COLS).setValues([HEADERS]);
    return;
  }
  var width = Math.max(sheet.getLastColumn(), 1);
  var current = sheet.getRange(1, 1, 1, Math.min(width, NUM_COLS)).getValues()[0];
  if (String(current[COL_STATUS] || '') !== 'Status' || String(current[COL_LASTSENT] || '') !== 'LastSent') {
    sheet.getRange(1, 1, 1, NUM_COLS).setValues([HEADERS]);
  }
}

// All rows below the header, padded to NUM_COLS. getRange throws if asked
// for a 0-row range, which is exactly what a sheet with no signups yet
// (lastRow === 1, just the header — or 0 on a truly blank sheet) would
// otherwise ask for.
function getDataRows(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, NUM_COLS).getValues();
}

function isToday(value) {
  if (!(value instanceof Date)) return false;
  var tz = Session.getScriptTimeZone();
  return Utilities.formatDate(value, tz, 'yyyy-MM-dd') ===
    Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
}

function countToday(rows) {
  return rows.filter(function (row) { return isToday(row[COL_TIMESTAMP]); }).length;
}
