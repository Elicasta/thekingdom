import { requireSupabase, supabaseRequest } from '../lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireSupabase(res)) return;
  const pollId = String(req.query?.poll_id || '').trim().slice(0, 120);
  if (!pollId) return res.status(400).json({ error: 'Poll id required' });
  try {
    const results = await supabaseRequest('rpc/get_poll_results', {
      method: 'POST',
      body: JSON.stringify({ p_poll_id: pollId })
    });
    res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
    res.setHeader('CDN-Cache-Control', 'no-store');
    res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
    return res.status(200).json({ ok: true, results: Array.isArray(results) ? results : [] });
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message, details: error.details || null });
  }
}
