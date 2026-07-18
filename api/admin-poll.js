import { requireAdmin } from '../lib/auth.js';
import { getState, patchState, requireSupabase, supabaseRequest } from '../lib/supabase.js';

function clean(value, max = 500) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function sanitizePoll(poll) {
  const id = clean(poll?.id, 120);
  const question = clean(poll?.question, 800);
  const options = Array.isArray(poll?.options) ? poll.options.map(v => clean(v, 180)).filter(Boolean).slice(0, 8) : [];
  if (!id || !question || options.length < 2) throw new Error('Invalid poll definition');
  return { id, question, options };
}

async function closeLivePolls() {
  await supabaseRequest('polls?status=eq.live', {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ status: 'closed', updated_at: new Date().toISOString() })
  });
}

async function upsertPoll(poll, status = 'live') {
  await supabaseRequest('polls?on_conflict=id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({
      id: poll.id,
      lesson_id: 'when-the-kingdom-falls',
      question: poll.question,
      options: poll.options,
      status,
      updated_at: new Date().toISOString()
    })
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireAdmin(req, res) || !requireSupabase(res)) return;

  const action = clean(req.body?.action, 40);
  const pollId = clean(req.body?.poll_id || req.body?.poll?.id, 120);
  const rawSlideIndex = req.body?.slide_index;
  const slideIndex = rawSlideIndex === null || rawSlideIndex === undefined || rawSlideIndex === ''
    ? null
    : Math.max(0, Math.min(32, Number(rawSlideIndex) || 0));

  try {
    let state = await getState();
    if (action === 'launch') {
      const poll = sanitizePoll(req.body?.poll);
      await closeLivePolls();
      await upsertPoll(poll, 'live');
      const patch = {
        active_poll_id: poll.id,
        poll_prompt_visible: true,
        poll_results_visible: false,
        started: true,
        blackout: false
      };
      if (slideIndex !== null) patch.current_slide = slideIndex;
      state = await patchState(patch);
    } else if (action === 'show_results') {
      if (!pollId) throw new Error('Poll id required');
      if (req.body?.poll) await upsertPoll(sanitizePoll(req.body.poll), 'live');
      state = await patchState({ active_poll_id: pollId, poll_prompt_visible: false, poll_results_visible: true, started: true, blackout: false });
    } else if (action === 'hide_results') {
      state = await patchState({ poll_prompt_visible: false, poll_results_visible: false });
    } else if (action === 'close') {
      if (pollId) {
        await supabaseRequest(`polls?id=eq.${encodeURIComponent(pollId)}`, {
          method: 'PATCH',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({ status: 'closed', updated_at: new Date().toISOString() })
        });
      }
      const clearActive = !pollId || state?.active_poll_id === pollId;
      state = clearActive ? await patchState({ active_poll_id: null, poll_prompt_visible: false, poll_results_visible: false }) : state;
    } else if (action === 'reset') {
      if (!pollId) throw new Error('Poll id required');
      await supabaseRequest(`poll_votes?poll_id=eq.${encodeURIComponent(pollId)}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
    } else {
      return res.status(400).json({ error: 'Unknown poll action' });
    }
    return res.status(200).json({ ok: true, state });
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message, details: error.details || null });
  }
}
