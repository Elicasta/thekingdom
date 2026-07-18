function cleanBaseUrl(value) {
  return String(value || '').replace(/\/+$/, '');
}

export function supabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function requireSupabase(res) {
  if (!supabaseConfigured()) {
    res.status(503).json({ error: 'Supabase is not configured.' });
    return false;
  }
  return true;
}

export async function supabaseRequest(path, options = {}) {
  const url = cleanBaseUrl(process.env.SUPABASE_URL);
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase environment variables are missing');
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) {
    const error = new Error(typeof data === 'object' && data?.message ? data.message : `Supabase request failed (${response.status})`);
    error.status = response.status;
    error.details = data;
    throw error;
  }
  return data;
}

export async function getState() {
  const rows = await supabaseRequest('presentation_state?id=eq.main&select=*');
  return Array.isArray(rows) ? rows[0] || null : null;
}

export async function patchState(patch) {
  const payload = { ...patch, updated_at: new Date().toISOString() };
  const rows = await supabaseRequest('presentation_state?id=eq.main', {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(payload)
  });
  return Array.isArray(rows) ? rows[0] || null : null;
}
