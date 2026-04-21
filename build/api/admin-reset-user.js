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
        const userId = asString(body.userId).trim();
        const username = asString(body.username).trim() || undefined;
        const password = asString(body.password) || undefined;
        const twoFactorCode = asString(body.twoFactorCode).trim() || undefined;
        if (!userId) {
            res.status(400).json({ error: 'Missing userId' });
            return;
        }
        if (password) {
            const updated = await fetchJson(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
                method: 'PUT',
                headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });
            if (!updated.ok) {
                res.status(500).json({ error: 'Failed to update password', details: updated.text });
                return;
            }
        }
        if (username || twoFactorCode) {
            const patch = {};
            if (username)
                patch.username = username;
            if (twoFactorCode)
                patch.two_factor_code = twoFactorCode;
            const updatedProfile = await fetchJson(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`, {
                method: 'PATCH',
                headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(patch),
            });
            if (!updatedProfile.ok) {
                res.status(500).json({ error: 'Failed to update profile', details: updatedProfile.text });
                return;
            }
        }
        const profile = await fetchJson(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=email,username,two_factor_code,role,name`, {
            method: 'GET',
            headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
        });
        const row = Array.isArray(profile.json) ? profile.json[0] : null;
        const email = row && typeof row.email === 'string' ? row.email : '';
        const finalUsername = username ?? (row && typeof row.username === 'string' ? row.username : '');
        const final2fa = twoFactorCode ?? (row && typeof row.two_factor_code === 'string' ? row.two_factor_code : '');
        const name = row && typeof row.name === 'string' ? row.name : '';
        const role = row && typeof row.role === 'string' ? row.role : '';
        if (email) {
            const subject = role === 'student' ? 'Your student account credentials updated' : 'Your account credentials updated';
            const html = `
        <div style="font-family:Arial,sans-serif">
          <h2 style="margin:0 0 12px">Credentials updated</h2>
          <p><b>Name:</b> ${name}</p>
          <p><b>Username:</b> ${finalUsername}${password ? `<br/><b>Password:</b> ${password}` : ''}${final2fa ? `<br/><b>2FA:</b> ${final2fa}` : ''}</p>
        </div>`;
            const text = `Name: ${name}\nUsername: ${finalUsername}${password ? `\nPassword: ${password}` : ''}${final2fa ? `\n2FA: ${final2fa}` : ''}`;
            await sendResend(resendKey, email, subject, html, text);
        }
        res.status(200).json({ ok: true, emailSent: Boolean(email) });
    }
    catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        res.status(500).json({ error: message });
    }
}
