const asString = (v) => (typeof v === 'string' ? v : '');
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
const validateSupabaseEnv = (supabaseUrl, serviceKey) => {
    if (!supabaseUrl || !serviceKey)
        return 'Supabase admin is not configured';
    if (!/^https?:\/\//i.test(supabaseUrl)) {
        return 'SUPABASE_URL is invalid. It must be the Supabase Project URL (https://xxxxx.supabase.co). You likely pasted a key by mistake.';
    }
    if (serviceKey.startsWith('sb_publishable_')) {
        return 'SUPABASE_SERVICE_ROLE_KEY is wrong. You pasted the publishable (public) key. It must be the secret key.';
    }
    if (/^https?:\/\//i.test(serviceKey)) {
        return 'SUPABASE_SERVICE_ROLE_KEY is invalid. It must be the Supabase service role key.';
    }
    if (/\s/.test(serviceKey)) {
        return 'SUPABASE_SERVICE_ROLE_KEY is invalid. It contains whitespace/new lines. Paste the key as a single line.';
    }
    return '';
};
const getForcedInternal2faCode = () => {
    const v = process.env.FORCE_INTERNAL_2FA_CODE;
    return typeof v === 'string' ? v.trim() : '';
};
const authAdminHeaders = (adminKey) => {
    const key = adminKey.trim();
    if (!key)
        return {};
    return { apikey: key, Authorization: `Bearer ${key}` };
};
const postgrestHeaders = (adminKey) => {
    const key = adminKey.trim();
    if (!key)
        return {};
    const isJwtLike = key.startsWith('eyJ') && key.split('.').length === 3;
    return isJwtLike ? { apikey: key, Authorization: `Bearer ${key}` } : { apikey: key };
};
export default async function handler(req, res) {
    try {
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        const supabaseUrl = process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
        const resendKey = process.env.RESEND_API_KEY;
        const envError = validateSupabaseEnv(supabaseUrl, serviceKey);
        if (envError) {
            res.status(500).json({ error: envError });
            return;
        }
        const base = supabaseUrl.replace(/\/$/, '');
        const adminKey = String(serviceKey || '').trim();
        const pgHeaders = postgrestHeaders(adminKey);
        const authHeaders = authAdminHeaders(adminKey);
        const token = getBearer(req);
        if (!token) {
            res.status(401).json({ error: 'Missing token' });
            return;
        }
        const who = await fetchJson(`${base}/auth/v1/user`, {
            method: 'GET',
            headers: { apikey: adminKey, Authorization: `Bearer ${token}` },
        });
        if (!who.ok || !who.json || typeof who.json.id !== 'string') {
            res.status(401).json({ error: 'Invalid token' });
            return;
        }
        const callerId = who.json.id;
        const callerProfile = await fetchJson(`${base}/rest/v1/profiles?id=eq.${encodeURIComponent(callerId)}&select=role&limit=1`, {
            method: 'GET',
            headers: pgHeaders,
        });
        const callerRole = Array.isArray(callerProfile.json) && callerProfile.json[0] && typeof callerProfile.json[0].role === 'string'
            ? callerProfile.json[0].role
            : '';
        if (callerRole !== 'ceo') {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        const body = (req.body && typeof req.body === 'object') ? req.body : {};
        const userId = asString(body.userId).trim();
        const username = asString(body.username).trim() || undefined;
        const password = asString(body.password) || undefined;
        void getForcedInternal2faCode();
        if (!userId) {
            res.status(400).json({ error: 'Missing userId' });
            return;
        }
        if (password) {
            const updated = await fetchJson(`${base}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
                method: 'PUT',
                headers: { ...authHeaders, 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });
            if (!updated.ok) {
                res.status(500).json({ error: 'Failed to update password', details: updated.text });
                return;
            }
        }
        if (username) {
            const patch = {};
            if (username)
                patch.username = username;
            const updatedProfile = await fetchJson(`${base}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`, {
                method: 'PATCH',
                headers: { ...pgHeaders, 'Content-Type': 'application/json' },
                body: JSON.stringify(patch),
            });
            if (!updatedProfile.ok) {
                res.status(500).json({ error: 'Failed to update profile', details: updatedProfile.text });
                return;
            }
        }
        const profile = await fetchJson(`${base}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=email,username,role,name`, {
            method: 'GET',
            headers: pgHeaders,
        });
        const row = Array.isArray(profile.json) ? profile.json[0] : null;
        const email = row && typeof row.email === 'string' ? row.email : '';
        const finalUsername = username ?? (row && typeof row.username === 'string' ? row.username : '');
        const name = row && typeof row.name === 'string' ? row.name : '';
        const role = row && typeof row.role === 'string' ? row.role : '';
        if (email && resendKey) {
            const subject = role === 'student' ? 'Your student account credentials updated' : 'Your account credentials updated';
            const html = `
        <div style="font-family:Arial,sans-serif">
          <h2 style="margin:0 0 12px">Credentials updated</h2>
          <p><b>Name:</b> ${name}</p>
          <p><b>Username:</b> ${finalUsername}${password ? `<br/><b>Password:</b> ${password}` : ''}</p>
        </div>`;
            const text = `Name: ${name}\nUsername: ${finalUsername}${password ? `\nPassword: ${password}` : ''}`;
            await sendResend(resendKey, email, subject, html, text);
        }
        res.status(200).json({ ok: true, emailSent: Boolean(email && resendKey) });
    }
    catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        res.status(500).json({ error: message });
    }
}
