// "Add to Google Wallet" for the student member card.
//
// Returns { configured:false } until the owner sets two Render env vars:
//   GOOGLE_WALLET_ISSUER_ID       — from pay.google.com/business/console
//   GOOGLE_WALLET_SERVICE_ACCOUNT — JSON key of a service account with the
//                                   "Google Wallet API" enabled
// Then it returns { configured:true, saveUrl } — a signed "save to wallet"
// JWT link that puts the member card (with its QR code) in Google Wallet.
// Apple Wallet needs an Apple Developer pass certificate — see MOBILE.md.
import { createSign } from 'node:crypto';
const getBearer = (req) => {
    const raw = req.headers?.authorization || req.headers?.Authorization;
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (!value)
        return '';
    const m = value.match(/^Bearer\s+(.+)$/i);
    return m?.[1] ?? '';
};
const fetchJson = async (url, init) => {
    const resp = await fetch(url, init);
    const text = await resp.text();
    const json = text ? (() => { try {
        return JSON.parse(text);
    }
    catch {
        return null;
    } })() : null;
    return { ok: resp.ok, status: resp.status, json };
};
const b64url = (input) => (typeof input === 'string' ? Buffer.from(input) : input)
    .toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const getWalletConfig = () => {
    const issuerId = String(process.env.GOOGLE_WALLET_ISSUER_ID || '').trim();
    const raw = String(process.env.GOOGLE_WALLET_SERVICE_ACCOUNT || '').trim();
    if (!issuerId || !raw)
        return null;
    try {
        const sa = JSON.parse(raw);
        if (!sa.client_email || !sa.private_key)
            return null;
        return { issuerId, sa };
    }
    catch {
        return null;
    }
};
export default async function handler(req, res) {
    try {
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        const config = getWalletConfig();
        if (!config) {
            res.status(200).json({ configured: false });
            return;
        }
        const supabaseUrl = String(process.env.SUPABASE_URL || '').trim();
        const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '').trim();
        if (!supabaseUrl || !serviceKey) {
            res.status(500).json({ error: 'Not configured' });
            return;
        }
        const base = supabaseUrl.replace(/\/$/, '');
        const token = getBearer(req);
        if (!token) {
            res.status(401).json({ error: 'Missing token' });
            return;
        }
        const who = await fetchJson(`${base}/auth/v1/user`, {
            method: 'GET',
            headers: { apikey: serviceKey, Authorization: `Bearer ${token}` },
        });
        if (!who.ok || !who.json || typeof who.json.id !== 'string') {
            res.status(401).json({ error: 'Invalid token' });
            return;
        }
        const userId = who.json.id;
        const body = (req.body && typeof req.body === 'object') ? req.body : {};
        const name = (typeof body.name === 'string' ? body.name : 'Student').slice(0, 80);
        const username = (typeof body.username === 'string' ? body.username : '').slice(0, 40);
        const origin = String(process.env.PUBLIC_ORIGIN || 'https://theway.ge').replace(/\/$/, '');
        const verifyUrl = `${origin}/api/verify-member?sid=${encodeURIComponent(userId)}`;
        const { issuerId, sa } = config;
        const classId = `${issuerId}.theway_member`;
        const objectId = `${issuerId}.member-${userId}`;
        const payload = {
            genericClasses: [{ id: classId }],
            genericObjects: [{
                    id: objectId,
                    classId,
                    state: 'ACTIVE',
                    hexBackgroundColor: '#0A1628',
                    cardTitle: { defaultValue: { language: 'en-US', value: 'The Way · Student Member' } },
                    header: { defaultValue: { language: 'en-US', value: name } },
                    subheader: { defaultValue: { language: 'en-US', value: username ? `@${username}` : 'Member card' } },
                    barcode: { type: 'QR_CODE', value: verifyUrl, alternateText: 'Scan to verify' },
                    textModulesData: [
                        { id: 'perks', header: 'Student discounts', body: 'Show this card at any The Way partner in Georgia.' },
                    ],
                }],
        };
        const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
        const claims = b64url(JSON.stringify({
            iss: sa.client_email,
            aud: 'google',
            typ: 'savetowallet',
            iat: Math.floor(Date.now() / 1000),
            origins: [origin],
            payload,
        }));
        const signer = createSign('RSA-SHA256');
        signer.update(`${header}.${claims}`);
        const jwt = `${header}.${claims}.${b64url(signer.sign(sa.private_key))}`;
        res.status(200).json({ configured: true, saveUrl: `https://pay.google.com/gp/v/save/${jwt}` });
    }
    catch (e) {
        res.status(500).json({ error: e instanceof Error ? e.message : 'Unknown error' });
    }
}
