export default async function handler(_req, res) {
    res.status(410).json({ error: '2FA is disabled' });
}
