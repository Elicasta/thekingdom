import { adminConfigured, createAdminToken, setAdminCookie, verifyAdminPassword } from '../lib/auth.js';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!adminConfigured()) return res.status(503).json({ error: 'Admin auth is not configured.' });
  const password = String(req.body?.password || '');
  if (!verifyAdminPassword(password)) return res.status(401).json({ error: 'Incorrect admin password.' });
  setAdminCookie(req, res, createAdminToken());
  return res.status(200).json({ ok: true, authenticated: true });
}
