export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jxddmdtwcosxljjkzcvc.supabase.co';
  const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
  return res.status(200).json({
    supabaseUrl,
    supabaseAnonKey: supabasePublishableKey,
    supabasePublishableKey,
    realtimeConfigured: Boolean(supabaseUrl && supabasePublishableKey)
  });
}
