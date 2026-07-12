// Client-side branded email body builder, mirroring api/_email-template.ts.
// Used for emails dispatched from the browser via sendMail() (e.g. status
// updates, document notifications). Returns email-client-safe HTML.
//
// Design: "private client" letterhead — warm cream page, white card, navy
// header with a serif wordmark, gold accents, navy credentials panel, gold
// pill CTA, navy footer. Table-based + inline styles (Gmail/Outlook-safe).

export type BrandedEmailCredential = { username?: string; password?: string };

export type BrandedEmailOptions = {
  title: string;
  preheader?: string;
  /** Small gold caps label above the title, e.g. "Your account". */
  eyebrow?: string;
  greeting?: string;
  intro: string;
  credentials?: BrandedEmailCredential;
  ctaLabel?: string;
  ctaUrl?: string;
  note?: string;
  outro?: string;
};

const NAVY = '#0A1628';
const NAVY_2 = '#13294B';
const GOLD = '#F5A800';
const GOLD_SOFT = '#F5C544';
const PAGE_BG = '#F1EDE6';
const CARD_BORDER = '#E8E1D2';
const TEXT = '#41506B';
const HEAD_TEXT = '#182740';
const MUTED = '#8B94A6';
const SITE = 'https://theway.ge';
const SERIF = "Georgia,'Times New Roman',serif";
const SANS = "Arial,Helvetica,sans-serif";

const esc = (s: string): string =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const credRow = (label: string, value: string, last: boolean): string => `
  <tr>
    <td style="padding:13px 0;${last ? '' : 'border-bottom:1px solid rgba(255,255,255,0.09);'}">
      <span style="display:block;font-family:${SANS};font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:rgba(245,240,232,.55);font-weight:700;margin-bottom:5px;">${esc(label)}</span>
      <span style="font-family:'Courier New',Consolas,monospace;font-size:19px;font-weight:700;color:${GOLD_SOFT};word-break:break-all;">${esc(value)}</span>
    </td>
  </tr>`;

export function renderBrandedEmail(o: BrandedEmailOptions): string {
  const year = new Date().getFullYear();
  const preheader = o.preheader ?? o.intro;
  const eyebrow = o.eyebrow ?? 'The Way · Georgia';

  const credBlock = (() => {
    const u = o.credentials?.username;
    const p = o.credentials?.password;
    if (!u && !p) return '';
    return `
      <tr><td style="padding:10px 0 4px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${NAVY}" style="background:${NAVY};background-image:linear-gradient(135deg,${NAVY},${NAVY_2});border-radius:14px;">
          <tr><td style="padding:20px 26px;">
            <span style="display:block;font-family:${SANS};font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:${GOLD};font-weight:700;padding-bottom:4px;">Your access</span>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${u ? credRow('Username', u, !p) : ''}
              ${p ? credRow('Temporary password', p, true) : ''}
            </table>
          </td></tr>
        </table>
      </td></tr>`;
  })();

  const ctaBlock = (o.ctaLabel && o.ctaUrl) ? `
      <tr><td style="padding:30px 0 4px;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td align="center" bgcolor="${GOLD}" style="border-radius:999px;">
            <a href="${esc(o.ctaUrl)}" target="_blank"
               style="display:inline-block;padding:15px 42px;font-family:${SANS};font-size:14px;font-weight:800;letter-spacing:.02em;color:${NAVY};text-decoration:none;border-radius:999px;">
              ${esc(o.ctaLabel)}
            </a>
          </td>
        </tr></table>
        <span style="display:block;padding-top:12px;font-family:${SANS};font-size:12px;line-height:18px;color:${MUTED};">
          Or copy this link: <a href="${esc(o.ctaUrl)}" target="_blank" style="color:${MUTED};text-decoration:underline;word-break:break-all;">${esc(o.ctaUrl)}</a>
        </span>
      </td></tr>` : '';

  const noteBlock = o.note ? `
      <tr><td style="padding:22px 0 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF6ED;border:1px solid #EEE4CC;border-radius:12px;">
          <tr><td style="padding:14px 20px;">
            <span style="display:block;font-family:${SANS};font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#B07E00;font-weight:700;padding-bottom:4px;">Please note</span>
            <span style="font-family:${SANS};font-size:13px;line-height:20px;color:#6E6A5E;">${esc(o.note)}</span>
          </td></tr>
        </table>
      </td></tr>` : '';

  const outroBlock = o.outro ? `
      <tr><td style="padding:24px 0 0;font-family:${SANS};font-size:15px;line-height:25px;color:${TEXT};">
        ${esc(o.outro)}
      </td></tr>` : '';

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="x-apple-disable-message-reformatting"/>
<title>${esc(o.title)}</title>
</head>
<body style="margin:0;padding:0;background:${PAGE_BG};">
  <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;">${esc(preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${PAGE_BG}" style="background:${PAGE_BG};">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" width="620" cellpadding="0" cellspacing="0" style="width:620px;max-width:100%;background:#ffffff;border:1px solid ${CARD_BORDER};border-radius:18px;overflow:hidden;">

        <!-- Gold hairline -->
        <tr><td style="height:5px;background:${GOLD};line-height:5px;font-size:0;">&nbsp;</td></tr>

        <!-- Header -->
        <tr>
          <td bgcolor="${NAVY}" style="background:${NAVY};background-image:linear-gradient(135deg,${NAVY} 0%,${NAVY_2} 100%);padding:36px 46px;">
            <span style="font-family:${SERIF};font-size:26px;font-weight:700;letter-spacing:.14em;color:#ffffff;">THE&nbsp;WAY<span style="color:${GOLD};">.</span></span>
            <span style="display:block;margin-top:7px;font-family:${SANS};font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:${GOLD};font-weight:700;">Study · Live · Belong — Georgia</span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:42px 46px 10px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="font-family:${SANS};font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:${GOLD};font-weight:800;padding-bottom:12px;">
                ${esc(eyebrow)}
              </td></tr>
              <tr><td style="font-family:${SERIF};font-size:27px;line-height:34px;font-weight:700;color:${HEAD_TEXT};padding-bottom:16px;">
                ${esc(o.title)}
              </td></tr>
              ${o.greeting ? `<tr><td style="font-family:${SANS};font-size:15px;line-height:25px;color:${HEAD_TEXT};font-weight:700;padding-bottom:8px;">${esc(o.greeting)}</td></tr>` : ''}
              <tr><td style="font-family:${SANS};font-size:15px;line-height:25px;color:${TEXT};padding-bottom:16px;">
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
        <tr><td style="padding:30px 46px 40px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            <tr><td style="padding-bottom:14px;"><span style="display:inline-block;width:44px;height:2px;background:${GOLD};font-size:0;line-height:2px;">&nbsp;</span></td></tr>
            <tr><td style="font-family:${SANS};font-size:15px;line-height:24px;color:${TEXT};">
              Warm regards,<br/><span style="font-family:${SERIF};font-size:16px;font-weight:700;color:${HEAD_TEXT};">The Way Team</span>
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr>
          <td bgcolor="${NAVY}" style="background:${NAVY};padding:28px 46px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="font-family:${SERIF};font-size:14px;letter-spacing:.14em;color:#ffffff;padding-bottom:10px;">THE&nbsp;WAY<span style="color:${GOLD};">.</span></td></tr>
              <tr><td style="font-family:${SANS};font-size:12px;line-height:20px;padding-bottom:12px;">
                <a href="${SITE}" target="_blank" style="color:${GOLD};font-weight:700;text-decoration:none;">theway.ge</a>
                <span style="color:rgba(245,240,232,.35);">&nbsp;·&nbsp;</span>
                <a href="mailto:info@theway.ge" style="color:rgba(245,240,232,.65);text-decoration:none;">info@theway.ge</a>
              </td></tr>
              <tr><td style="font-family:${SANS};font-size:11px;line-height:17px;color:rgba(245,240,232,.45);padding-bottom:8px;">
                You are receiving this email because an account or request was created for you at The Way.
                If this wasn't you, please contact us right away.
              </td></tr>
              <tr><td style="font-family:${SANS};font-size:11px;color:rgba(245,240,232,.35);">
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
}
