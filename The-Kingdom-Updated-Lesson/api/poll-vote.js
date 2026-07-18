import { requireSupabase, supabaseRequest } from '../lib/supabase.js';

function clean(value, max) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireSupabase(res)) return;
  const pollId = clean(req.body?.poll_id, 120);
  const voterToken = clean(req.body?.voter_token, 180);
  const optionIndex = Number(req.body?.option_index);
  if (!pollId || !voterToken || !Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex > 7) {
    return res.status(400).json({ error: 'Invalid vote.' });
  }
  try {
    const result = await supabaseRequest('rpc/submit_poll_vote', {
      method: 'POST',
      body: JSON.stringify({ p_poll_id: pollId, p_voter_token: voterToken, p_option_index: optionIndex })
    });
    return res.status(200).json({ ok: true, result });
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message, details: error.details || null });
  }
}
