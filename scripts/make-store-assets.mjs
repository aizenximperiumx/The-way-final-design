// Generates the Google Play / App Store marketing assets from the raw
// phone screenshots in store/raw/ and the brand sources in assets/.
//
//   node scripts/make-store-assets.mjs
//
// Outputs:
//   store/play-icon-512.png       — Play Store listing icon
//   store/feature-graphic.png     — Play Store feature graphic (1024×500)
//   store/screens/NN-*.png        — framed 1080×1920 store screenshots
//
// Re-run after replacing any raw screenshot (raw shots are 375×812 captures
// of the app; see MOBILE.md for how to take them).

import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const NAVY = '#0A1628';
const NAVY2 = '#0D1F3C';
const GOLD = '#F5A800';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ── Framed store screenshots (1080×1920, Play-compliant ≤ 2:1) ──────────────
const SHOTS = [
  ['01-welcome.png',  'Your journey starts here',  'From first document to residency — guided'],
  ['02-home.png',     'One home for everything',   'Perks, news and your next step'],
  ['03-journey.png',  'Watch your case move',      'Every stage, live from your advisor'],
  ['04-card.png',     'Your student card',         'QR discounts at partner stores'],
  ['05-georgia.png',  'Life in Georgia, decoded',  'SIM, banks, transport and halal food'],
  ['06-advisor.png',  'Your advisor, one tap away','Real humans, not bots'],
  ['07-arabic.png',   'English & العربية',         'The whole app, in your language'],
  ['08-applock.png',  'Private by design',         'PIN-protected — your data stays yours'],
];

const W = 1080, H = 1920;          // canvas
const PW = 680, PH = 1472;         // phone image (keeps 375:812 ratio)
const PX = (W - PW) / 2, PY = 330; // phone position
const R = 34;                      // corner radius

const bgSvg = (title, sub) => `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${NAVY}"/>
      <stop offset="0.5" stop-color="${NAVY2}"/>
      <stop offset="1" stop-color="${NAVY}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.42" r="0.62">
      <stop offset="0" stop-color="${GOLD}" stop-opacity="0.14"/>
      <stop offset="1" stop-color="${GOLD}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <g text-anchor="middle">
    <text x="${W / 2}" y="128" font-family="Segoe UI, Arial, sans-serif" font-size="26"
      font-weight="700" letter-spacing="10" fill="${GOLD}">THE WAY</text>
    <text x="${W / 2}" y="216" font-family="Georgia, 'Times New Roman', serif" font-size="62"
      font-weight="700" fill="#FFFFFF">${esc(title)}</text>
    <text x="${W / 2}" y="272" font-family="Segoe UI, Arial, sans-serif" font-size="30"
      fill="rgba(245,240,232,0.62)">${esc(sub)}</text>
  </g>
  <rect x="${PX - 3}" y="${PY - 3}" width="${PW + 6}" height="${PH + 6}" rx="${R + 3}"
    fill="none" stroke="${GOLD}" stroke-opacity="0.55" stroke-width="3"/>
</svg>`;

const roundMask = Buffer.from(
  `<svg width="${PW}" height="${PH}"><rect width="${PW}" height="${PH}" rx="${R}" fill="#fff"/></svg>`
);

// Hides the browser scrollbar captured at the right edge of the raw shots:
// a strip with the app's own background gradient, so it blends invisibly.
const SCROLLBAR_W = 26;
const scrollbarCover = Buffer.from(`
<svg width="${SCROLLBAR_W}" height="${PH}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${NAVY}"/>
      <stop offset="0.55" stop-color="${NAVY2}"/>
      <stop offset="1" stop-color="${NAVY}"/>
    </linearGradient>
  </defs>
  <rect width="${SCROLLBAR_W}" height="${PH}" fill="url(#g)"/>
</svg>`);

async function frameShot(file, title, sub) {
  const phone = await sharp(`store/raw/${file}`)
    .resize(PW, PH, { fit: 'cover', position: 'top' })
    .composite([
      { input: scrollbarCover, left: PW - SCROLLBAR_W, top: 0 },
      { input: roundMask, blend: 'dest-in' },
    ])
    .png()
    .toBuffer();

  await sharp(Buffer.from(bgSvg(title, sub)))
    .composite([{ input: phone, left: PX, top: PY }])
    .png()
    .toFile(`store/screens/${file}`);
  console.log(`✓ store/screens/${file}`);
}

// ── Feature graphic (1024×500) ──────────────────────────────────────────────
async function featureGraphic() {
  const mark = await sharp('assets/icon-foreground.png')
    .resize(440, 440)
    .png()
    .toBuffer();

  const svg = `
<svg width="1024" height="500" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${NAVY}"/>
      <stop offset="1" stop-color="${NAVY2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.22" cy="0.5" r="0.55">
      <stop offset="0" stop-color="${GOLD}" stop-opacity="0.20"/>
      <stop offset="1" stop-color="${GOLD}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1024" height="500" fill="url(#bg)"/>
  <rect width="1024" height="500" fill="url(#glow)"/>
  <g>
    <text x="430" y="180" font-family="Segoe UI, Arial, sans-serif" font-size="24"
      font-weight="700" letter-spacing="9" fill="${GOLD}">THE WAY</text>
    <text x="426" y="266" font-family="Georgia, 'Times New Roman', serif" font-size="68"
      font-weight="700" fill="#FFFFFF">Study in Georgia</text>
    <text x="430" y="330" font-family="Segoe UI, Arial, sans-serif" font-size="27"
      fill="rgba(245,240,232,0.66)">Admission&#160;&#160;•&#160;&#160;Documents&#160;&#160;•&#160;&#160;Visa&#160;&#160;•&#160;&#160;Arrival</text>
    <rect x="430" y="368" width="64" height="4" fill="${GOLD}"/>
  </g>
</svg>`;

  await sharp(Buffer.from(svg))
    .composite([{ input: mark, left: -10, top: 30 }])
    .png()
    .toFile('store/feature-graphic.png');
  console.log('✓ store/feature-graphic.png');
}

// ── Play listing icon (512×512) ─────────────────────────────────────────────
async function playIcon() {
  await sharp('assets/icon.png').resize(512, 512).png().toFile('store/play-icon-512.png');
  console.log('✓ store/play-icon-512.png');
}

mkdirSync('store/screens', { recursive: true });
await playIcon();
await featureGraphic();
for (const [f, t, s] of SHOTS) await frameShot(f, t, s);
console.log('Done.');
