import 'server-only';
import { Resend } from 'resend';
import { EVENT_DETAILS } from './event';
import { CATEGORIES } from './categories';

type VolunteerForEmail = {
  id: string;
  first_name: string;
  email: string;
  arrival_time: string | null;
  departure_time: string | null;
  categories: string[];
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

export async function sendConfirmationEmail(
  v: VolunteerForEmail,
  baseUrl: string,
  isUpdate: boolean,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[email] RESEND_API_KEY not set, skipping send');
    return;
  }
  if (!v.email) return;

  const resend = new Resend(apiKey);

  const editUrl = `${baseUrl}/helper?volunteerId=${v.id}`;
  const arrival = formatTime(v.arrival_time);
  const departure = formatTime(v.departure_time);
  const roleNames = v.categories
    .map((id) => CATEGORIES.find((c) => c.id === id)?.name)
    .filter((n): n is string => Boolean(n));

  const dateNoPrefix = EVENT_DETAILS.date.replace(/^[A-Za-z]+, /, '');
  const subject = isUpdate
    ? `Sign-up updated — Voices of Strength Open Mic, ${dateNoPrefix}`
    : `Volunteer sign-up confirmed — Voices of Strength Open Mic, ${dateNoPrefix}`;

  const html = buildHtml({ v, arrival, departure, roleNames, editUrl, isUpdate });
  const text = buildText({ v, arrival, departure, roleNames, editUrl, isUpdate });

  try {
    const { error } = await resend.emails.send({
      from: 'Voices of Strength <onboarding@resend.dev>',
      to: v.email,
      subject,
      html,
      text,
    });
    if (error) {
      console.error('[email] Resend returned an error:', error);
    }
  } catch (err) {
    console.error('[email] send threw:', err);
  }
}

type TemplateArgs = {
  v: VolunteerForEmail;
  arrival: string;
  departure: string;
  roleNames: string[];
  editUrl: string;
  isUpdate: boolean;
};

function buildText({ v, arrival, departure, roleNames, editUrl, isUpdate }: TemplateArgs): string {
  const lines: string[] = [];

  lines.push(`Hi ${v.first_name},`);
  lines.push('');
  if (isUpdate) {
    lines.push('Your volunteer sign-up has been updated. Your latest availability and roles are below.');
  } else {
    lines.push(`Thank you for signing up to volunteer at the Voices of Strength Open Mic on ${EVENT_DETAILS.date}!`);
  }

  lines.push('', '--- YOUR AVAILABILITY ---', `${arrival} – ${departure}`, '');
  lines.push('--- YOUR ROLES ---');
  if (roleNames.length === 0) lines.push('(none selected)');
  else roleNames.forEach((n) => lines.push(`- ${n}`));

  lines.push('', '--- EVENT DETAILS ---');
  lines.push(`Date: ${EVENT_DETAILS.date}`);
  lines.push(`Location: ${EVENT_DETAILS.location.name}, ${EVENT_DETAILS.location.address}`);
  lines.push(`Headliner: ${EVENT_DETAILS.headliner} - ${EVENT_DETAILS.times.headliner}`);
  lines.push(`Open mic: ${EVENT_DETAILS.times.openMic}`);
  lines.push(`Set-up begins: ${EVENT_DETAILS.times.setUpStart}`);
  lines.push(`Clean-up ends: ${EVENT_DETAILS.times.cleanUpEnd}`);

  lines.push('', '--- UPDATE YOUR AVAILABILITY ---');
  lines.push('If anything changes, use this private link to update your sign-up:');
  lines.push(editUrl);

  lines.push('', '--- IMPORTANT CONTACTS ---');
  for (const c of EVENT_DETAILS.contacts) {
    lines.push(c.role);
    lines.push(c.name);
    lines.push(c.email);
    lines.push(c.phone);
    lines.push('');
  }

  lines.push('--- LINKS ---');
  lines.push(`Performer sign-up form: ${EVENT_DETAILS.urls.performerSignup}`);
  lines.push('');
  lines.push('Eventbrite (for distribution only — volunteers should NOT sign up through Eventbrite):');
  lines.push(EVENT_DETAILS.urls.eventbrite);

  lines.push('', "Thanks again — we'll see you there.");
  return lines.join('\n');
}

function buildHtml({ v, arrival, departure, roleNames, editUrl, isUpdate }: TemplateArgs): string {
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
<title>${e(isUpdate ? 'Sign-up updated' : 'Sign-up confirmed')}</title>
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
              <p style="margin:0 0 12px 0;font-size:15px;">Use this private link to update your sign-up anytime:</p>
              <p style="margin:0 0 12px 0;">
                <a href="${e(editUrl)}" style="display:inline-block;background-color:#18181b;color:#ffffff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:500;font-size:14px;">Update my sign-up</a>
              </p>
              <p style="margin:0 0 0 0;font-size:12px;color:#71717a;word-break:break-all;">Or copy this URL: ${e(editUrl)}</p>
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
