// ─────────────────────────────────────────────────────────────────────────────
// Push notification sender — Firebase Cloud Messaging HTTP v1, pure Node
// (no SDK). Configured entirely by ONE env var on Render:
//
//   FIREBASE_SERVICE_ACCOUNT = the full JSON of a Firebase service-account key
//     (Firebase console → Project settings → Service accounts → Generate key)
//
// Without the env var every function here is a silent no-op — exactly like
// the Resend email pattern. The leading underscore keeps this file from
// being treated as a deployable route.
// ─────────────────────────────────────────────────────────────────────────────
import { createSign } from 'node:crypto';
const getServiceAccount = () => {
    const raw = String(process.env.FIREBASE_SERVICE_ACCOUNT || '').trim();
    if (!raw)
        return null;
    try {
        const j = JSON.parse(raw);
        if (typeof j.project_id === 'string' && typeof j.client_email === 'string' && typeof j.private_key === 'string') {
            return { project_id: j.project_id, client_email: j.client_email, private_key: j.private_key, token_uri: j.token_uri };
        }
    }
    catch { /* malformed JSON */ }
    return null;
};
export const pushConfigured = () => getServiceAccount() !== null;
// ── OAuth2 access token (JWT bearer grant, RS256-signed with node:crypto) ───
let cachedToken = null;
const b64url = (input) => Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
async function getAccessToken(sa) {
    const now = Math.floor(Date.now() / 1000);
    if (cachedToken && cachedToken.expiresAt - 60 > now)
        return cachedToken.token;
    try {
        const tokenUri = sa.token_uri || 'https://oauth2.googleapis.com/token';
        const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
        const claims = b64url(JSON.stringify({
            iss: sa.client_email,
            scope: 'https://www.googleapis.com/auth/firebase.messaging',
            aud: tokenUri,
            iat: now,
            exp: now + 3600,
        }));
        const signer = createSign('RSA-SHA256');
        signer.update(`${header}.${claims}`);
        const signature = b64url(signer.sign(sa.private_key));
        const jwt = `${header}.${claims}.${signature}`;
        const resp = await fetch(tokenUri, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `grant_type=${encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')}&assertion=${encodeURIComponent(jwt)}`,
        });
        const json = (await resp.json().catch(() => null));
        if (!resp.ok || !json?.access_token)
            return null;
        cachedToken = { token: json.access_token, expiresAt: now + (json.expires_in ?? 3600) };
        return json.access_token;
    }
    catch {
        return null;
    }
}
/**
 * Send a push to every registered device of the given users.
 * Returns tokens FCM reports as dead (uninstalled app) so the caller can
 * prune them from app_state.pushTokens.
 */
export async function sendPushToUsers(tokensMap, userIds, message) {
    const sa = getServiceAccount();
    if (!sa || !tokensMap || userIds.length === 0)
        return { sent: 0, deadTokens: [] };
    const targets = [];
    for (const uid of userIds) {
        for (const entry of tokensMap[uid] ?? []) {
            if (entry && typeof entry.token === 'string' && entry.token)
                targets.push(entry.token);
        }
    }
    if (targets.length === 0)
        return { sent: 0, deadTokens: [] };
    const access = await getAccessToken(sa);
    if (!access)
        return { sent: 0, deadTokens: [] };
    let sent = 0;
    const deadTokens = [];
    for (const token of targets.slice(0, 50)) {
        try {
            const resp = await fetch(`https://fcm.googleapis.com/v1/projects/${encodeURIComponent(sa.project_id)}/messages:send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access}` },
                body: JSON.stringify({
                    message: {
                        token,
                        notification: { title: message.title.slice(0, 200), body: message.body.slice(0, 500) },
                        data: message.link ? { link: message.link } : {},
                        android: { notification: { color: '#F5A800', icon: 'ic_stat_icon_config_sample' } },
                        apns: { payload: { aps: { sound: 'default' } } },
                    },
                }),
            });
            if (resp.ok) {
                sent += 1;
            }
            else {
                const text = await resp.text().catch(() => '');
                if (resp.status === 404 || text.includes('UNREGISTERED') || text.includes('INVALID_ARGUMENT')) {
                    deadTokens.push(token);
                }
            }
        }
        catch { /* network hiccup — skip this token */ }
    }
    return { sent, deadTokens };
}
/** Remove dead device tokens from the map (returns a new map). */
export function prunePushTokens(tokensMap, deadTokens) {
    if (!deadTokens.length)
        return tokensMap;
    const dead = new Set(deadTokens);
    const out = {};
    for (const [uid, entries] of Object.entries(tokensMap)) {
        const kept = (entries ?? []).filter(e => e && !dead.has(e.token));
        if (kept.length)
            out[uid] = kept;
    }
    return out;
}
