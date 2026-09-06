// Set Sail — beta confirmation email.
//
// Second file of the Apps Script project (see apps-script.gs for the
// plumbing). Kept separate so the wording and layout can be iterated on
// without touching the signup/queue logic.
//
// >>> THE COPY BELOW IS A FIRST DRAFT, pending review. <<<
//
// Email-client constraints this has to live inside, all of which bite late
// if ignored:
//   - Inline styles and table layout only. No flexbox, no custom
//     properties, no external stylesheet — setsail.css can't be reused
//     here, only its values.
//   - Web fonts mostly don't load (Outlook especially), so every font-family
//     carries a deliberate fallback stack rather than landing on Times.
//   - Gmail strips inline SVG, so the mark is a hosted PNG (LOGO_URL).
//   - Dark mode inverts unpredictably, so every background and text colour
//     is stated explicitly rather than inherited.

// Set Sail's palette, from setsail/setsail.css. The portfolio's DESIGN.md
// (cream/brown) is a different system — deliberately not used here.
var C_SURFACE = '#FAFAF7';
var C_INK     = '#1C1C1A';
var C_MUTED   = '#5F5F5C';
var C_ACCENT  = '#1F6F9F';   // links and icons, per .ss-link
var C_BUTTON  = '#A8D8F5';   // primary button fill, per .ss-btn — powder
                             // blue with dark ink, not a dark fill with
                             // white text
var C_HAIRLINE = '#E6E6E1';

var F_DISPLAY = "'Outfit','Segoe UI',Roboto,Helvetica,Arial,sans-serif";
var F_BODY    = "'Nunito Sans','Segoe UI',Roboto,Helvetica,Arial,sans-serif";

// "macOS,Windows" -> { mac: true, win: true }. Tolerates whitespace, casing
// and ordering, because this arrives as a free-form string built from the
// chips' data-platform attributes rather than a validated enum.
function normalizePlatforms(raw) {
  var parts = String(raw || '').split(',').map(function (p) {
    return p.trim().toLowerCase();
  });
  var mac = parts.indexOf('macos') !== -1;
  var win = parts.indexOf('windows') !== -1;
  // Nothing recognised (empty, or a value the form stopped using): send
  // both rather than an email with no way in.
  if (!mac && !win) return { mac: true, win: true };
  return { mac: mac, win: win };
}

// Pure — builds the whole email from a platforms string and returns
// { subject, htmlBody, plainBody }. No Sheet or Mail access, so runTests()
// can exercise every variant without sending anything.
function buildConfirmation(platformsRaw) {
  var p = normalizePlatforms(platformsRaw);
  var both = p.mac && p.win;

  var lead = both
    ? 'Thanks for joining the Set Sail beta. Here’s how to get it running on both your machines.'
    : p.mac
      ? 'Thanks for joining the Set Sail beta. Here’s how to get it running on your Mac.'
      : 'Thanks for joining the Set Sail beta. Here’s how to get it running on your PC.';

  var html = [];
  html.push('<div style="margin:0;padding:32px 16px;background:' + C_SURFACE + ';">');
  html.push('<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:' + C_SURFACE + ';">');
  html.push('<tr><td align="center">');
  html.push('<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="480" style="width:100%;max-width:480px;text-align:left;">');

  if (LOGO_URL) {
    html.push('<tr><td align="center" style="padding-bottom:18px;">' +
      '<img src="' + LOGO_URL + '" width="56" height="56" alt="Set Sail" ' +
      'style="display:block;width:56px;height:56px;border:0;">' +
      '</td></tr>');
  }

  html.push('<tr><td align="center" style="padding-bottom:8px;">' +
    '<h1 style="margin:0;font-family:' + F_DISPLAY + ';font-size:32px;line-height:1.15;font-weight:800;letter-spacing:-0.7px;color:' + C_INK + ';">' +
    'Welcome aboard!</h1></td></tr>');

  html.push('<tr><td align="center" style="padding-bottom:4px;">' +
    '<p style="margin:0;font-family:' + F_BODY + ';font-size:17px;line-height:27px;color:' + C_MUTED + ';">' +
    lead + '</p></td></tr>');

  if (p.mac) html.push(platformBlock('On macOS', [
    'Install TestFlight from the Mac App Store — it’s Apple’s free app for running betas.',
    'Open the invite below and choose Accept.',
    'Install Set Sail from TestFlight, and you’re away.'
  ], TESTFLIGHT_URL, 'Open the TestFlight invite',
    'TestFlight builds expire after 90 days — it’ll nudge you when a fresh one lands.'));

  if (p.win) html.push(platformBlock('On Windows', [
    'Open the link below — it’ll hand off to the Microsoft Store app.',
    'Hit Get to install.'
  ], MSSTORE_URL, 'Open in the Microsoft Store', ''));

  html.push('<tr><td style="padding-top:32px;border-top:1px solid ' + C_HAIRLINE + ';">' +
    '<p style="margin:0 0 12px;font-family:' + F_BODY + ';font-size:15px;line-height:24px;color:' + C_MUTED + ';">' +
    'Hit a snag, or spotted something odd? Just reply to this email — it comes straight to me.</p>' +
    '<p style="margin:0 0 12px;font-family:' + F_BODY + ';font-size:15px;line-height:24px;color:' + C_MUTED + ';">' +
    'Curious what’s changed? <a href="' + CHANGELOG_URL + '" style="color:' + C_ACCENT + ';text-decoration:underline;">Read the changelog</a>.</p>' +
    '<p style="margin:0;font-family:' + F_BODY + ';font-size:15px;line-height:24px;color:' + C_INK + ';">— Pip</p>' +
    '</td></tr>');

  html.push('<tr><td style="padding-top:24px;">' +
    '<p style="margin:0;font-family:' + F_BODY + ';font-size:13px;line-height:20px;color:' + C_MUTED + ';">' +
    'You’re getting this because you signed up for the Set Sail beta at ' +
    '<a href="' + SITE_URL + '" style="color:' + C_MUTED + ';text-decoration:underline;">pipturner.co.uk/setsail</a>. ' +
    'Want out? Reply and say so.</p></td></tr>');

  html.push('</table></td></tr></table></div>');

  return {
    subject: 'Welcome aboard — your Set Sail beta invite',
    htmlBody: html.join(''),
    plainBody: buildPlain(p, lead)
  };
}

// One platform section: label, numbered steps, a bulletproof (table-based)
// button, and an optional footnote.
function platformBlock(label, steps, url, cta, note) {
  var out = [];
  out.push('<tr><td style="padding-top:30px;">');
  out.push('<p style="margin:0 0 10px;font-family:' + F_BODY + ';font-size:12px;line-height:1;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;color:' + C_MUTED + ';">' +
    label + '</p>');

  out.push('<ol style="margin:0 0 18px;padding-left:20px;font-family:' + F_BODY + ';font-size:16px;line-height:26px;color:' + C_INK + ';">');
  for (var i = 0; i < steps.length; i++) {
    out.push('<li style="margin:0 0 4px;">' + steps[i] + '</li>');
  }
  out.push('</ol>');

  out.push('<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>' +
    '<td bgcolor="' + C_BUTTON + '" style="border-radius:999px;">' +
    '<a href="' + url + '" style="display:inline-block;padding:14px 26px;border-radius:999px;' +
    'font-family:' + F_BODY + ';font-size:16px;line-height:1;font-weight:600;color:' + C_INK + ';text-decoration:none;">' +
    cta + '</a></td></tr></table>');

  if (note) {
    out.push('<p style="margin:12px 0 0;font-family:' + F_BODY + ';font-size:14px;line-height:22px;color:' + C_MUTED + ';">' +
      note + '</p>');
  }
  out.push('</td></tr>');
  return out.join('');
}

// Not an afterthought — some clients show only this.
function buildPlain(p, lead) {
  var out = ['Welcome aboard!', '', lead, ''];

  if (p.mac) {
    out.push('ON MACOS');
    out.push('1. Install TestFlight from the Mac App Store - it\'s Apple\'s free app for running betas.');
    out.push('2. Open the invite below and choose Accept.');
    out.push('3. Install Set Sail from TestFlight, and you\'re away.');
    out.push('');
    out.push(TESTFLIGHT_URL);
    out.push('');
    out.push('TestFlight builds expire after 90 days - it\'ll nudge you when a fresh one lands.');
    out.push('');
  }

  if (p.win) {
    out.push('ON WINDOWS');
    out.push('1. Open the link below - it\'ll hand off to the Microsoft Store app.');
    out.push('2. Hit Get to install.');
    out.push('');
    out.push(MSSTORE_URL);
    out.push('');
  }

  out.push('Hit a snag, or spotted something odd? Just reply to this email - it comes straight to me.');
  out.push('');
  out.push('Curious what\'s changed? ' + CHANGELOG_URL);
  out.push('');
  out.push('- Pip');
  out.push('');
  out.push('You\'re getting this because you signed up for the Set Sail beta at ' + SITE_URL + ' - want out? Reply and say so.');
  return out.join('\n');
}

// Run from the Apps Script editor. Exercises parsing and all three shapes
// without sending mail, and writes each HTML variant to Logger so it can be
// pasted into a browser or an email-render tester.
function runTests() {
  var cases = ['macOS', 'Windows', 'macOS,Windows', '', ' windows , MACOS ', 'Linux'];
  var failures = [];

  cases.forEach(function (input) {
    var p = normalizePlatforms(input);
    var mail = buildConfirmation(input);

    if (!mail.subject) failures.push(input + ': empty subject');
    if (!mail.htmlBody || !mail.plainBody) failures.push(input + ': empty body');
    if (p.mac && mail.htmlBody.indexOf(TESTFLIGHT_URL) === -1) failures.push(input + ': missing TestFlight link');
    if (p.win && mail.htmlBody.indexOf(MSSTORE_URL) === -1) failures.push(input + ': missing Store link');
    if (!p.mac && mail.htmlBody.indexOf(TESTFLIGHT_URL) !== -1) failures.push(input + ': unexpected TestFlight link');
    if (!p.win && mail.htmlBody.indexOf(MSSTORE_URL) !== -1) failures.push(input + ': unexpected Store link');
    if (p.mac && mail.plainBody.indexOf(TESTFLIGHT_URL) === -1) failures.push(input + ': plain missing TestFlight link');
    if (p.win && mail.plainBody.indexOf(MSSTORE_URL) === -1) failures.push(input + ': plain missing Store link');

    Logger.log('--- "' + input + '" -> mac:' + p.mac + ' win:' + p.win +
      ' | html ' + mail.htmlBody.length + ' chars, plain ' + mail.plainBody.length + ' chars');
  });

  // Unrecognised input must still produce a usable email, not a dead end.
  var fallback = normalizePlatforms('Linux');
  if (!fallback.mac || !fallback.win) failures.push('Linux: fallback should include both platforms');

  if (failures.length) {
    Logger.log('FAILED (' + failures.length + '):\n  ' + failures.join('\n  '));
    throw new Error(failures.length + ' test failure(s) — see the log.');
  }
  Logger.log('All ' + cases.length + ' cases passed.');
  return 'ok';
}
