/*
  Public browser configuration.
  Fill these two values after creating the Supabase project and running
  supabase/setup.sql. Never put a service_role or secret key in this file.
*/
window.KINGDOM_CONFIG = Object.freeze({
  supabaseUrl: "https://YOUR_PROJECT_REF.supabase.co",
  supabasePublishableKey: "YOUR_SUPABASE_PUBLISHABLE_KEY",
  pollRefreshMs: 5000
});
