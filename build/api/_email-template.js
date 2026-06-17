// Shared, email-client-safe HTML template for all outgoing mail.
// Table-based layout + inline styles so it renders consistently across
// Gmail, Outlook, Apple Mail, etc. The leading underscore keeps this file
// from being treated as a deployable serverless route.
const NAVY = '#0A1628';
const NAVY_SOFT = '#122036';
const GOLD = '#F5A800';
const TEXT = '#2b3648';
const MUTED = '#7a8597';
const BORDER = '#e6e9ef';
const PAGE_BG = '#eef1f5';
const SITE = 'https://theway.ge';
const esc = (s) => String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
const credRow = (label, value) => `
  <tr>
    <td style="padding:10px 0;border-bottom:1px solid ${BORDER};">
      <span style="display:block;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:${MUTED};font-weight:700;margin-bottom:4px;">${esc(label)}</span>
      <span style="font-family:'Courier New',Consolas,monospace;font-size:18px;font-weight:700;color:${NAVY};word-break:break-all;">${esc(value)}</span>
    </td>
  </tr>`;
export function renderEmail(o) {
    const year = new Date().getFullYear();
    const preheader = o.preheader ?? o.intro;
    const credBlock = (() => {
        const u = o.credentials?.username;
        const p = o.credentials?.password;
        if (!u && !p)
            return '';
        return `
      <tr><td style="padding:8px 0 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;border:1px solid ${BORDER};border-left:4px solid ${GOLD};border-radius:10px;">
          <tr><td style="padding:18px 22px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${u ? credRow('Username', u) : ''}
              ${p ? credRow('Password', p) : ''}
            </table>
          </td></tr>
        </table>
      </td></tr>`;
    })();
    const ctaBlock = (o.ctaLabel && o.ctaUrl) ? `
      <tr><td style="padding:28px 0 6px;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td align="center" bgcolor="${GOLD}" style="border-radius:10px;">
            <a href="${esc(o.ctaUrl)}" target="_blank"
               style="display:inline-block;padding:14px 34px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:${NAVY};text-decoration:none;border-radius:10px;">
              ${esc(o.ctaLabel)}
            </a>
          </td>
        </tr></table>
      </td></tr>` : '';
    const noteBlock = o.note ? `
      <tr><td style="padding:18px 0 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fbfbfd;border:1px solid ${BORDER};border-radius:10px;">
          <tr><td style="padding:14px 18px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:${MUTED};">
            🔒 ${esc(o.note)}
          </td></tr>
        </table>
      </td></tr>` : '';
    const outroBlock = o.outro ? `
      <tr><td style="padding:22px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:${TEXT};">
        ${esc(o.outro)}
      </td></tr>` : '';
    const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="x-apple-disable-message-reformatting"/>
<title>${esc(o.title)}</title>
</head>
<body style="margin:0;padding:0;background:${PAGE_BG};">
  <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;">${esc(preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAGE_BG};">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 6px 24px rgba(10,22,40,.08);">

        <!-- Header -->
        <tr>
          <td style="background:${NAVY};background-image:linear-gradient(135deg,${NAVY} 0%,${NAVY_SOFT} 100%);padding:34px 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
              <td style="font-family:Arial,Helvetica,sans-serif;">
                <span style="font-size:24px;font-weight:800;letter-spacing:.04em;color:#ffffff;">THE&nbsp;WAY<span style="color:${GOLD};">.</span></span>
                <span style="display:block;margin-top:6px;font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:${GOLD};font-weight:700;">Your Path to Studying in Georgia</span>
              </td>
            </tr></table>
          </td>
        </tr>

        <!-- Gold rule -->
        <tr><td style="height:4px;background:${GOLD};line-height:4px;font-size:0;">&nbsp;</td></tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 8px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:800;color:${NAVY};padding-bottom:14px;">
                ${esc(o.title)}
              </td></tr>
              ${o.greeting ? `<tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:${TEXT};padding-bottom:6px;">${esc(o.greeting)}</td></tr>` : ''}
              <tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:${TEXT};padding-bottom:18px;">
                ${esc(o.intro)}
              </td></tr>
              ${credBlock}
              ${ctaBlock}
              ${noteBlock}
              ${outroBlock}
            </table>
          </td>
        </tr>

        <!-- Sign-off -->
        <tr><td style="padding:26px 40px 36px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:${TEXT};">
          Warm regards,<br/><strong style="color:${NAVY};">The Way Team</strong>
        </td></tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f7f9fb;border-top:1px solid ${BORDER};padding:26px 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:${MUTED};">
                <a href="${SITE}" target="_blank" style="color:${NAVY};font-weight:700;text-decoration:none;">theway.ge</a>
                &nbsp;·&nbsp;
                <a href="mailto:info@theway.ge" style="color:${MUTED};text-decoration:none;">info@theway.ge</a>
              </td></tr>
              <tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:${MUTED};padding-top:10px;">
                You're receiving this email because an account or request was created for you at The Way.
                If this wasn't you, please contact us right away.
              </td></tr>
              <tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#9aa3b2;padding-top:10px;">
                © ${year} The Way · Tbilisi, Georgia
              </td></tr>
            </table>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
    // Plain-text fallback.
    const lines = [];
    lines.push('THE WAY — Your Path to Studying in Georgia');
    lines.push('');
    lines.push(o.title);
    if (o.greeting) {
        lines.push('');
        lines.push(o.greeting);
    }
    lines.push('');
    lines.push(o.intro);
    if (o.credentials?.username || o.credentials?.password) {
        lines.push('');
        if (o.credentials.username)
            lines.push(`Username: ${o.credentials.username}`);
        if (o.credentials.password)
            lines.push(`Password: ${o.credentials.password}`);
    }
    if (o.ctaLabel && o.ctaUrl) {
        lines.push('');
        lines.push(`${o.ctaLabel}: ${o.ctaUrl}`);
    }
    if (o.note) {
        lines.push('');
        lines.push(o.note);
    }
    if (o.outro) {
        lines.push('');
        lines.push(o.outro);
    }
    lines.push('');
    lines.push('Warm regards,');
    lines.push('The Way Team');
    lines.push('');
    lines.push('theway.ge · info@theway.ge');
    const text = lines.join('\n');
    return { html, text };
}
