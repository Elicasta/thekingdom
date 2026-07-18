import { getState, requireSupabase } from '../lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireSupabase(res)) return;
  try {
    const state = await getState();
    if (!state) return res.status(404).json({ error: 'Presentation state was not found.' });
    res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
    res.setHeader('CDN-Cache-Control', 'no-store');
    res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
    return res.status(200).json({ ok: true, state });
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message, details: error.details || null });
  }
}
