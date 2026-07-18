import { requireAdmin } from '../lib/auth.js';
import { requireSupabase, supabaseRequest } from '../lib/supabase.js';

const VALID_STATUS = new Set(['new', 'answered', 'hidden']);

export default async function handler(req, res) {
  if (!requireAdmin(req, res) || !requireSupabase(res)) return;
  try {
    if (req.method === 'GET') {
      const questions = await supabaseRequest('audience_questions?select=id,text,status,created_at,updated_at&order=created_at.desc&limit=250');
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({ ok: true, questions: Array.isArray(questions) ? questions : [] });
    }
    if (req.method === 'PATCH') {
      const id = String(req.body?.id || '').trim();
      const status = String(req.body?.status || '').trim();
      if (!id || !VALID_STATUS.has(status)) return res.status(400).json({ error: 'Valid question id and status required' });
      const rows = await supabaseRequest(`audience_questions?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({ status, updated_at: new Date().toISOString() })
      });
      return res.status(200).json({ ok: true, question: Array.isArray(rows) ? rows[0] || null : null });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message, details: error.details || null });
  }
}
