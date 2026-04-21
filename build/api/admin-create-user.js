import { randomBytes } from 'crypto';
const asString = (v) => (typeof v === 'string' ? v : '');
const asStringArray = (v) => (Array.isArray(v) ? v.filter(x => typeof x === 'string') : []);
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
    return { ok: resp.ok, status: resp.status, text, json };
};
const sendResend = async (apiKey, to, subject, html, text) => {
    const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            from: 'The Way <no-reply@theway.ge>',
            to: [to],
            subject,
            html,
            text,
        }),
    });
    if (!resp.ok) {
        const details = await resp.text();
        throw new Error(details || 'Failed to send email');
    }
};
const randomPassword = () => {
    const buf = randomBytes(16).toString('base64url');
    return `Tw-${buf}`;
};
const random2fa = () => String(Math.floor(100000 + Math.random() * 900000));
export default async function handler(req, res) {
    try {
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        const supabaseUrl = process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const resendKey = process.env.RESEND_API_KEY;
        if (!supabaseUrl || !serviceKey) {
            res.status(500).json({ error: 'Supabase admin is not configured' });
            return;
        }
        if (!resendKey) {
            res.status(500).json({ error: 'Email is not configured' });
            return;
        }
        const token = getBearer(req);
        if (!token) {
            res.status(401).json({ error: 'Missing token' });
            return;
        }
        const who = await fetchJson(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
            method: 'GET',
            headers: { apikey: serviceKey, Authorization: `Bearer ${token}` },
        });
        if (!who.ok || !who.json || typeof who.json.id !== 'string') {
            res.status(401).json({ error: 'Invalid token' });
            return;
        }
        const callerId = who.json.id;
        const callerProfile = await fetchJson(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/profiles?id=eq.${encodeURIComponent(callerId)}&select=role`, {
            method: 'GET',
            headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
        });
        const callerRole = Array.isArray(callerProfile.json) && callerProfile.json[0] && typeof callerProfile.json[0].role === 'string'
            ? callerProfile.json[0].role
            : '';
        if (callerRole !== 'ceo') {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        const body = (req.body && typeof req.body === 'object') ? req.body : {};
        const email = asString(body.email).trim();
        const passwordIn = asString(body.password);
        const usernameIn = asString(body.username).trim();
        const role = asString(body.role).trim();
        const name = asString(body.name).trim();
        const phone = asString(body.phone).trim() || undefined;
        const twoFactorIn = asString(body.twoFactorCode).trim();
        const staffUniversities = asStringArray(body.staffUniversities);
        const allowedRoles = new Set(['ceo', 'sales', 'ops', 'staff', 'agency_staff', 'agency']);
        if (!email || !role || !name) {
            res.status(400).json({ error: 'Missing fields' });
            return;
        }
        if (!allowedRoles.has(role)) {
            res.status(400).json({ error: 'Invalid role' });
            return;
        }
        const password = passwordIn || randomPassword();
        const base = supabaseUrl.replace(/\/$/, '');
        const usernameBase = (usernameIn || role).toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 10) || 'user';
        let username = usernameIn || `${usernameBase}${Math.floor(100 + Math.random() * 900)}`;
        for (let i = 0; i < 6; i++) {
            const check = await fetchJson(`${base}/rest/v1/profiles?username=eq.${encodeURIComponent(username)}&select=id&limit=1`, {
                method: 'GET',
                headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
            });
            if (check.ok && Array.isArray(check.json) && check.json.length === 0)
                break;
            username = `${usernameBase}${Math.floor(100 + Math.random() * 900)}${i}`;
        }
        const twoFactorCode = twoFactorIn || random2fa();
        const created = await fetchJson(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/admin/users`, {
            method: 'POST',
            headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, email_confirm: true }),
        });
        if (!created.ok || !created.json || typeof created.json.id !== 'string') {
            res.status(500).json({ error: 'Failed to create auth user', details: created.text });
            return;
        }
        const id = created.json.id;
        const inserted = await fetchJson(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/profiles`, {
            method: 'POST',
            headers: {
                apikey: serviceKey,
                Authorization: `Bearer ${serviceKey}`,
                'Content-Type': 'application/json',
                Prefer: 'return=representation',
            },
            body: JSON.stringify({
                id,
                email,
                username,
                role,
                name,
                phone,
                two_factor_code: twoFactorCode,
                points: 0,
                staff_universities: staffUniversities.length ? staffUniversities : null,
            }),
        });
        if (!inserted.ok) {
            res.status(500).json({ error: 'Failed to create profile', details: inserted.text });
            return;
        }
        const html = `
      <div style="font-family:Arial,sans-serif">
        <h2 style="margin:0 0 12px">Your account is ready</h2>
        <p><b>Username:</b> ${username}<br/><b>Password:</b> ${password}<br/><b>2FA:</b> ${twoFactorCode ?? ''}</p>
      </div>`;
        const text = `Username: ${username}\nPassword: ${password}\n2FA: ${twoFactorCode ?? ''}`;
        await sendResend(resendKey, email, 'Your account credentials', html, text);
        res.status(200).json({ id, email, username, role, name, emailSent: true });
    }
    catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        res.status(500).json({ error: message });
    }
}
