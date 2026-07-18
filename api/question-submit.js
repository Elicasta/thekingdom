import { requireSupabase, supabaseRequest } from '../lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireSupabase(res)) return;
  const text = String(req.body?.text || '').replace(/\s+/g, ' ').trim().slice(0, 800);
  if (text.length < 3) return res.status(400).json({ error: 'Question is too short.' });
  try {
    const result = await supabaseRequest('rpc/submit_audience_question', {
      method: 'POST',
      body: JSON.stringify({ p_text: text })
    });
    return res.status(200).json({ ok: true, id: result });
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message, details: error.details || null });
  }
}
