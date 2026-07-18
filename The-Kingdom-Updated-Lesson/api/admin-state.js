import { requireAdmin } from '../lib/auth.js';
import { getState, patchState, requireSupabase } from '../lib/supabase.js';

const ALLOWED = new Set([
  'current_slide', 'started', 'started_at', 'blackout', 'active_scripture',
  'scripture_visible', 'active_poll_id', 'poll_results_visible', 'reload_token'
]);

function sanitize(body) {
  const patch = {};
  for (const [key, value] of Object.entries(body || {})) {
    if (!ALLOWED.has(key)) continue;
    if (key === 'current_slide') patch[key] = Math.max(0, Math.min(22, Number(value) || 0));
    else if (['started', 'blackout', 'scripture_visible', 'poll_results_visible'].includes(key)) patch[key] = Boolean(value);
    else if (key === 'reload_token') patch[key] = Math.max(0, Number(value) || 0);
    else if (key === 'active_scripture') patch[key] = value && typeof value === 'object' ? value : null;
    else if (key === 'active_poll_id') patch[key] = value ? String(value).slice(0, 120) : null;
    else if (key === 'started_at') patch[key] = value ? new Date(value).toISOString() : null;
  }
  return patch;
}

export default async function handler(req, res) {
  if (!requireAdmin(req, res) || !requireSupabase(res)) return;
  try {
    if (req.method === 'GET') return res.status(200).json({ state: await getState() });
    if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });
    const patch = sanitize(req.body);
    const state = await patchState(patch);
    return res.status(200).json({ ok: true, state });
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message, details: error.details || null });
  }
}
