import 'server-only';
import { Resend } from 'resend';
import { EVENT_DETAILS } from './event';
import { CATEGORIES } from './categories';

const FROM = 'Voices of Strength <onboarding@resend.dev>';

type VolunteerForEmail = {
  id: string;
  first_name: string;
  last_name?: string;
  email: string;
  arrival_time: string | null;
  departure_time: string | null;
  categories: string[];
  cell?: string | null;
  note?: string | null;
};

function formatTime(t: string | null): string {
  if (!t) return '';
  const [hh, mm] = t.split(':').map(Number);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return t;
  const period = hh >= 12 ? 'PM' : 'AM';
  const h12 = hh % 12 || 12;
  return `${h12}:${mm.toString().padStart(2, '0')} ${period}`;
}

function escapeHtml(s: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return s.replace(/[&<>"']/g, (c) => map[c]);
}

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[email] RESEND_API_KEY not set, skipping send');
    return null;
  }
  return new Resend(apiKey);
}

// Shared <style> block: handles Gmail/Apple/iOS dark mode (prefers-color-scheme)
// and Outlook.com dark mode ([data-ogsc]). Each rule defends a button that
// would otherwise become invisible (e.g. black-on-darkened background).
const DARK_MODE_STYLE = `
  <style>
    @media (prefers-color-scheme: dark) {
      .vos-btn-primary {
        background-color: #ffffff !important;
        color: #18181b !important;
        border-color: #ffffff !important;
      }
      .vos-btn-secondary {
        background-color: transparent !important;
        color: #d4d4d8 !important;
        border-color: #71717a !important;
      }
    }
    [data-ogsc] .vos-btn-primary {
      background-color: #ffffff !important;
      color: #18181b !important;
      border-color: #ffffff !important;
    }
    [data-ogsc] .vos-btn-secondary {
      background-color: transparent !important;
      color: #d4d4d8 !important;
      border-color: #71717a !important;
    }
  </style>
`;

// ============================================================
// Confirmation email (on Helper sign-up + on edit/update)
// ============================================================

export async function sendConfirmationEmail(
  v: VolunteerForEmail,
  baseUrl: string,
  isUpdate: boolean,
): Promise<void> {
  const resend = getResend();
  if (!resend || !v.email) return;

  const editUrl = `${baseUrl}/helper?volunteerId=${v.id}`;
  const cancelUrl = `${baseUrl}/helper/cancel?volunteerId=${v.id}`;
  const arrival = formatTime(v.arrival_time);
  const departure = formatTime(v.departure_time);
  const roleNames = v.categories
    .map((id) => CATEGORIES.find((c) => c.id === id)?.name)
    .filter((n): n is string => Boolean(n));

  const dateNoPrefix = EVENT_DETAILS.date.replace(/^[A-Za-z]+, /, '');
  const subject = isUpdate
    ? `Sign-up updated — Voices of Strength Open Mic, ${dateNoPrefix}`
    : `Volunteer sign-up confirmed — Voices of Strength Open Mic, ${dateNoPrefix}`;

  const html = buildConfirmationHtml({
    v,
    arrival,
    departure,
    roleNames,
    editUrl,
    cancelUrl,
    isUpdate,
  });
  const text = buildConfirmationText({
    v,
    arrival,
    departure,
    roleNames,
    editUrl,
    cancelUrl,
    isUpdate,
  });

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: v.email,
      subject,
      html,
      text,
    });
    if (error) console.error('[email] Resend returned an error:', error);
  } catch (err) {
    console.error('[email] send threw:', err);
  }
}

type ConfirmationArgs = {
  v: VolunteerForEmail;
  arrival: string;
  departure: string;
  roleNames: string[];
  editUrl: string;
  cancelUrl: string;
  isUpdate: boolean;
};

function buildConfirmationText({
  v,
  arrival,
  departure,
  roleNames,
  editUrl,
  cancelUrl,
  isUpdate,
}: ConfirmationArgs): string {
  const lines: string[] = [];
  lines.push(`Hi ${v.first_name},`, '');
  if (isUpdate) {
    lines.push(
      'Your volunteer sign-up has been updated. Your latest availability and roles are below.',
    );
  } else {
    lines.push(
      `Thank you for signing up to volunteer at the Voices of Strength Open Mic on ${EVENT_DETAILS.date}!`,
    );
  }
  lines.push('', '--- YOUR AVAILABILITY ---', `${arrival} – ${departure}`, '');
  lines.push('--- YOUR ROLES ---');
  if (roleNames.length === 0) lines.push('(none selected)');
  else roleNames.forEach((n) => lines.push(`- ${n}`));

  lines.push('', '--- EVENT DETAILS ---');
  lines.push(`Date: ${EVENT_DETAILS.date}`);
  lines.push(
    `Location: ${EVENT_DETAILS.location.name}, ${EVENT_DETAILS.location.address}`,
  );
  lines.push(
    `Headliner: ${EVENT_DETAILS.headliner} - ${EVENT_DETAILS.times.headliner}`,
  );
  lines.push(`Open mic: ${EVENT_DETAILS.times.openMic}`);
  lines.push(`Set-up begins: ${EVENT_DETAILS.times.setUpStart}`);
  lines.push(`Clean-up ends: ${EVENT_DETAILS.times.cleanUpEnd}`);

  lines.push('', '--- UPDATE OR CANCEL ---');
  lines.push('If anything changes, you can update your sign-up here:');
  lines.push(editUrl);
  lines.push('');
  lines.push('If you can no longer make it, cancel here:');
  lines.push(cancelUrl);

  lines.push('', '--- IMPORTANT CONTACTS ---');
  for (const c of EVENT_DETAILS.contacts) {
    lines.push(c.role, c.name, c.email, c.phone, '');
  }

  lines.push('--- LINKS ---');
  lines.push(`Performer sign-up form: ${EVENT_DETAILS.urls.performerSignup}`);
  lines.push('');
  lines.push(
    'Eventbrite (for distribution only — volunteers should NOT sign up through Eventbrite):',
  );
  lines.push(EVENT_DETAILS.urls.eventbrite);

  lines.push('', "Thanks again — we'll see you there.");
  return lines.join('\n');
}

function buildConfirmationHtml({
  v,
  arrival,
  departure,
  roleNames,
  editUrl,
  cancelUrl,
  isUpdate,
}: ConfirmationArgs): string {
  const e = escapeHtml;

  const updateBanner = isUpdate
    ? `<tr><td style="padding:14px 24px;background:#fef3c7;color:#92400e;font-size:14px;border-bottom:1px solid #fde68a;"><strong>Updated availability</strong> — your latest sign-up details are below.</td></tr>`
    : '';

  const greeting = isUpdate
    ? 'Your volunteer sign-up has been updated.'
    : `Thank you for signing up to volunteer at the Voices of Strength Open Mic on ${e(EVENT_DETAILS.date)}!`;

  const rolesBlock =
    roleNames.length > 0
      ? `<ul style="margin:0;padding-left:20px;">${roleNames.map((n) => `<li style="margin:4px 0;font-size:15px;">${e(n)}</li>`).join('')}</ul>`
      : `<p style="margin:0;color:#71717a;font-style:italic;font-size:15px;">(none selected)</p>`;

  const contactsBlocks = EVENT_DETAILS.contacts
    .map((c) => {
      const phoneDigits = c.phone.replace(/\D/g, '');
      return `
        <table cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
          <tr><td style="font-weight:600;color:#3f3f46;font-size:13px;">${e(c.role)}</td></tr>
          <tr><td style="font-size:14px;color:#18181b;padding-top:2px;">${e(c.name)}</td></tr>
          <tr><td style="font-size:14px;padding-top:2px;"><a href="mailto:${e(c.email)}" style="color:#3f3f46;text-decoration:underline;">${e(c.email)}</a></td></tr>
          <tr><td style="font-size:14px;padding-top:2px;"><a href="tel:${phoneDigits}" style="color:#3f3f46;text-decoration:underline;">${e(c.phone)}</a></td></tr>
        </table>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${e(isUpdate ? 'Sign-up updated' : 'Sign-up confirmed')}</title>
${DARK_MODE_STYLE}
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#18181b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
          <tr>
            <td style="padding:24px 24px 20px;border-bottom:1px solid #e4e4e7;">
              <h1 style="margin:0;font-size:22px;font-weight:600;color:#18181b;">Voices of Strength Open Mic</h1>
              <p style="margin:4px 0 0 0;font-size:14px;color:#52525b;">${e(EVENT_DETAILS.date)}</p>
            </td>
          </tr>
          ${updateBanner}
          <tr>
            <td style="padding:24px;">
              <p style="margin:0 0 12px 0;font-size:16px;">Hi ${e(v.first_name)},</p>
              <p style="margin:0 0 24px 0;font-size:15px;line-height:1.5;">${greeting}</p>
              <h2 style="margin:0 0 8px 0;font-size:12px;font-weight:600;color:#71717a;letter-spacing:0.06em;text-transform:uppercase;">Your availability</h2>
              <p style="margin:0 0 24px 0;font-size:15px;">${e(arrival)} – ${e(departure)}</p>
              <h2 style="margin:0 0 8px 0;font-size:12px;font-weight:600;color:#71717a;letter-spacing:0.06em;text-transform:uppercase;">Your roles</h2>
              <div style="margin:0 0 24px 0;">${rolesBlock}</div>
              <h2 style="margin:0 0 8px 0;font-size:12px;font-weight:600;color:#71717a;letter-spacing:0.06em;text-transform:uppercase;">Need to change something?</h2>
              <p style="margin:0 0 12px 0;">
                <a href="${e(editUrl)}" class="vos-btn-primary" style="display:inline-block;background-color:#18181b;color:#ffffff;padding:10px 18px;border:2px solid #18181b;border-radius:8px;text-decoration:none;font-weight:500;font-size:14px;">Update my sign-up</a>
              </p>
              <p style="margin:0;">
                <a href="${e(cancelUrl)}" class="vos-btn-secondary" style="display:inline-block;background-color:transparent;color:#71717a;padding:9px 17px;border:1px solid #d4d4d8;border-radius:8px;text-decoration:none;font-weight:500;font-size:13px;">Cancel my sign-up</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 24px;border-top:1px solid #e4e4e7;">
              <h2 style="margin:0 0 12px 0;font-size:12px;font-weight:600;color:#71717a;letter-spacing:0.06em;text-transform:uppercase;">Event details</h2>
              <table cellpadding="0" cellspacing="0" style="width:100%;font-size:14px;color:#27272a;">
                <tr><td style="padding:4px 0;color:#71717a;width:100px;vertical-align:top;">Location</td><td style="padding:4px 0;">${e(EVENT_DETAILS.location.name)}<br><span style="color:#52525b;">${e(EVENT_DETAILS.location.address)}</span></td></tr>
                <tr><td style="padding:4px 0;color:#71717a;vertical-align:top;">Headliner</td><td style="padding:4px 0;">${e(EVENT_DETAILS.headliner)} · ${e(EVENT_DETAILS.times.headliner)}</td></tr>
                <tr><td style="padding:4px 0;color:#71717a;vertical-align:top;">Open mic</td><td style="padding:4px 0;">${e(EVENT_DETAILS.times.openMic)}</td></tr>
                <tr><td style="padding:4px 0;color:#71717a;vertical-align:top;">Set-up</td><td style="padding:4px 0;">begins at ${e(EVENT_DETAILS.times.setUpStart)}</td></tr>
                <tr><td style="padding:4px 0;color:#71717a;vertical-align:top;">Clean-up</td><td style="padding:4px 0;">ends at ${e(EVENT_DETAILS.times.cleanUpEnd)}</td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 24px;border-top:1px solid #e4e4e7;">
              <h2 style="margin:0 0 12px 0;font-size:12px;font-weight:600;color:#71717a;letter-spacing:0.06em;text-transform:uppercase;">Important contacts</h2>
              ${contactsBlocks}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 24px;border-top:1px solid #e4e4e7;">
              <h2 style="margin:0 0 12px 0;font-size:12px;font-weight:600;color:#71717a;letter-spacing:0.06em;text-transform:uppercase;">Links</h2>
              <p style="margin:0 0 12px 0;font-size:14px;">
                <a href="${e(EVENT_DETAILS.urls.performerSignup)}" style="color:#18181b;text-decoration:underline;">Performer sign-up form</a>
              </p>
              <p style="margin:0;font-size:14px;color:#27272a;">
                <a href="${e(EVENT_DETAILS.urls.eventbrite)}" style="color:#18181b;text-decoration:underline;">Eventbrite event</a><br>
                <span style="font-size:12px;color:#71717a;">For distribution only — volunteers should not sign up via Eventbrite.</span>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 24px;border-top:1px solid #e4e4e7;background-color:#fafafa;">
              <p style="margin:0;font-size:13px;color:#52525b;">Thanks again — we&apos;ll see you there.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ============================================================
// Cancellation notification (to event team) + cancellation receipt (to helper)
// ============================================================

export async function sendCancellationEmails(
  v: VolunteerForEmail,
  baseUrl: string,
): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const helperFullName = `${v.first_name} ${v.last_name ?? ''}`.trim();
  const dateNoPrefix = EVENT_DETAILS.date.replace(/^[A-Za-z]+, /, '');
  const signupUrl = `${baseUrl}/helper`;

  const arrival = formatTime(v.arrival_time);
  const departure = formatTime(v.departure_time);
  const roleNames = v.categories
    .map((id) => CATEGORIES.find((c) => c.id === id)?.name)
    .filter((n): n is string => Boolean(n));

  // 1. Notify the event team contacts. In EMAIL_TEST_MODE the recipient list
  // is replaced with the volunteer's own email so you can verify the message
  // without spamming Jordyn / Jake / Arza during testing.
  const testMode = process.env.EMAIL_TEST_MODE === '1';
  const contactsTo = testMode
    ? v.email
      ? [v.email]
      : []
    : EVENT_DETAILS.contacts.map((c) => c.email);

  if (contactsTo.length === 0) {
    console.log(
      '[email] No recipients for cancellation notification (test mode + no volunteer email?)',
    );
  } else {
    if (testMode) {
      console.log(
        `[email] EMAIL_TEST_MODE=1 — routing contacts notification to ${v.email} instead of Jordyn/Jake/Arza`,
      );
    }
    try {
      const { error } = await resend.emails.send({
        from: FROM,
        to: contactsTo,
        subject: `Volunteer canceled (${helperFullName}) — Voices of Strength, ${dateNoPrefix}`,
        html: buildCancellationNotificationHtml({
          v,
          helperFullName,
          arrival,
          departure,
          roleNames,
        }),
        text: buildCancellationNotificationText({
          v,
          helperFullName,
          arrival,
          departure,
          roleNames,
        }),
      });
      if (error) console.error('[email] Resend (contacts) error:', error);
    } catch (err) {
      console.error('[email] notification send threw:', err);
    }
  }

  // 2. Send the helper a confirmation receipt.
  if (v.email) {
    try {
      const { error } = await resend.emails.send({
        from: FROM,
        to: v.email,
        subject: `Sign-up canceled — Voices of Strength Open Mic, ${dateNoPrefix}`,
        html: buildCancellationConfirmationHtml({ v, signupUrl }),
        text: buildCancellationConfirmationText({ v, signupUrl }),
      });
      if (error) console.error('[email] Resend (helper) error:', error);
    } catch (err) {
      console.error('[email] confirmation send threw:', err);
    }
  }
}

type NotificationArgs = {
  v: VolunteerForEmail;
  helperFullName: string;
  arrival: string;
  departure: string;
  roleNames: string[];
};

function buildCancellationNotificationText({
  v,
  helperFullName,
  arrival,
  departure,
  roleNames,
}: NotificationArgs): string {
  const lines: string[] = [];
  lines.push(
    'A volunteer has canceled their sign-up for the upcoming Voices of Strength Open Mic.',
    '',
    '--- CANCELED VOLUNTEER ---',
    helperFullName,
  );
  if (v.cell) lines.push(v.cell);
  if (v.email) lines.push(v.email);
  lines.push('', '--- THEY WERE SIGNED UP FOR ---');
  if (arrival || departure) {
    lines.push(`Availability: ${arrival || '?'} – ${departure || '?'}`);
  }
  if (roleNames.length > 0) {
    lines.push(`Roles: ${roleNames.join(', ')}`);
  } else {
    lines.push('Roles: (none selected)');
  }
  if (v.note) {
    lines.push('', `Note: ${v.note}`);
  }
  lines.push('', `Event date: ${EVENT_DETAILS.date}`);
  lines.push('', '— Voices of Strength Volunteer Portal');
  return lines.join('\n');
}

function buildCancellationNotificationHtml({
  v,
  helperFullName,
  arrival,
  departure,
  roleNames,
}: NotificationArgs): string {
  const e = escapeHtml;
  const rolesText =
    roleNames.length > 0 ? roleNames.join(', ') : '(none selected)';
  const cellLine = v.cell
    ? `<p style="margin:2px 0;font-size:14px;color:#27272a;">${e(v.cell)}</p>`
    : '';
  const emailLine = v.email
    ? `<p style="margin:2px 0;font-size:14px;color:#27272a;"><a href="mailto:${e(v.email)}" style="color:#3f3f46;">${e(v.email)}</a></p>`
    : '';
  const noteBlock = v.note
    ? `<div style="margin-top:16px;padding:12px;background:#f4f4f5;border-radius:8px;font-size:14px;color:#27272a;font-style:italic;border-left:3px solid #d4d4d8;">${e(v.note)}</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>Volunteer canceled</title>
${DARK_MODE_STYLE}
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#18181b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
          <tr>
            <td style="padding:20px 24px;background:#fef2f2;border-bottom:1px solid #fecaca;">
              <p style="margin:0;font-size:13px;font-weight:600;color:#991b1b;letter-spacing:0.06em;text-transform:uppercase;">Volunteer canceled</p>
              <h1 style="margin:6px 0 0 0;font-size:20px;font-weight:600;color:#18181b;">${e(helperFullName)}</h1>
              <p style="margin:4px 0 0 0;font-size:14px;color:#52525b;">Voices of Strength Open Mic · ${e(EVENT_DETAILS.date)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <h2 style="margin:0 0 8px 0;font-size:12px;font-weight:600;color:#71717a;letter-spacing:0.06em;text-transform:uppercase;">Contact</h2>
              ${cellLine}
              ${emailLine}

              <h2 style="margin:20px 0 8px 0;font-size:12px;font-weight:600;color:#71717a;letter-spacing:0.06em;text-transform:uppercase;">They were signed up for</h2>
              <p style="margin:2px 0;font-size:14px;color:#27272a;">Availability: ${e(arrival)} – ${e(departure)}</p>
              <p style="margin:2px 0;font-size:14px;color:#27272a;">Roles: ${e(rolesText)}</p>

              ${noteBlock}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px;border-top:1px solid #e4e4e7;background-color:#fafafa;">
              <p style="margin:0;font-size:12px;color:#71717a;">Their sign-up has been removed from the dashboard.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

type ConfirmationCancelArgs = {
  v: VolunteerForEmail;
  signupUrl: string;
};

function buildCancellationConfirmationText({
  v,
  signupUrl,
}: ConfirmationCancelArgs): string {
  return [
    `Hi ${v.first_name},`,
    '',
    `Your sign-up for the Voices of Strength Open Mic on ${EVENT_DETAILS.date} has been canceled. We've let the event team know.`,
    '',
    "We're sorry you can't make it, and hope to see you at a future event.",
    '',
    'If you change your mind, you can sign up again here:',
    signupUrl,
    '',
    '— Voices of Strength',
  ].join('\n');
}

function buildCancellationConfirmationHtml({
  v,
  signupUrl,
}: ConfirmationCancelArgs): string {
  const e = escapeHtml;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>Sign-up canceled</title>
${DARK_MODE_STYLE}
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#18181b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
          <tr>
            <td style="padding:24px 24px 20px;border-bottom:1px solid #e4e4e7;">
              <h1 style="margin:0;font-size:22px;font-weight:600;color:#18181b;">Voices of Strength Open Mic</h1>
              <p style="margin:4px 0 0 0;font-size:14px;color:#52525b;">${e(EVENT_DETAILS.date)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <p style="margin:0 0 12px 0;font-size:16px;">Hi ${e(v.first_name)},</p>
              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.5;">Your sign-up for the Voices of Strength Open Mic on ${e(EVENT_DETAILS.date)} has been canceled. We&apos;ve let the event team know.</p>
              <p style="margin:0 0 24px 0;font-size:15px;line-height:1.5;color:#52525b;">We&apos;re sorry you can&apos;t make it, and hope to see you at a future event.</p>
              <p style="margin:0 0 8px 0;">
                <a href="${e(signupUrl)}" class="vos-btn-primary" style="display:inline-block;background-color:#18181b;color:#ffffff;padding:10px 18px;border:2px solid #18181b;border-radius:8px;text-decoration:none;font-weight:500;font-size:14px;">Sign up again</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px;border-top:1px solid #e4e4e7;background-color:#fafafa;">
              <p style="margin:0;font-size:13px;color:#52525b;">— Voices of Strength</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
