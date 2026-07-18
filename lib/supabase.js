const DEFAULT_SUPABASE_URL = 'https://jxddmdtwcosxljjkzcvc.supabase.co';

function cleanBaseUrl(value) {
  return String(value || '').replace(/\/+$/, '');
}

function serverUrl() {
  return cleanBaseUrl(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL);
}

function serverKey() {
  return process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

export function supabaseConfigured() {
  return Boolean(serverUrl() && serverKey());
}

export function requireSupabase(res) {
  if (!supabaseConfigured()) {
    res.status(503).json({ error: 'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY.' });
    return false;
  }
  return true;
}

export async function supabaseRequest(path, options = {}) {
  const url = serverUrl();
  const key = serverKey();
  if (!url || !key) throw new Error('Supabase environment variables are missing');

  const headers = {
    apikey: key,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  // Legacy service_role keys are JWTs and may be used as bearer tokens.
  // New sb_secret_ keys belong only in the apikey header.
  if (key.startsWith('eyJ')) headers.Authorization = `Bearer ${key}`;

  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers
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
