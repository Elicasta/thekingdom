import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const appSource = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
assert.ok(appSource.includes('/api/public-state'), 'Missing cross-network public state polling');
assert.ok(appSource.includes('/api/public-poll-results'), 'Missing public poll-results fallback');
assert.ok(appSource.includes('return realtimeSubscribed ? 2000 : 300'), 'Fallback state polling should target 300 ms');
assert.ok(appSource.includes("updateConnectionUI('realtime')"), 'Realtime status handling missing');

assert.ok(appSource.includes('poll_prompt_visible'), 'Projector poll prompt state missing');
assert.ok(appSource.includes('renderPollPromptOverlay'), 'Projector poll prompt renderer missing');
assert.ok(appSource.includes('slide_index: slideIndex'), 'Poll launch must send its matching slide index');

const adminStateSource = fs.readFileSync(path.join(root, 'api/admin-state.js'), 'utf8');
assert.ok(adminStateSource.includes('Math.min(32'), 'Admin state must allow all 33 slides');
assert.ok(adminStateSource.includes('poll_prompt_visible'), 'Admin state must accept projector poll prompts');

const adminPollSource = fs.readFileSync(path.join(root, 'api/admin-poll.js'), 'utf8');
assert.ok(adminPollSource.includes('poll_prompt_visible: true'), 'Launching a poll must display its prompt');
assert.ok(adminPollSource.includes('current_slide = slideIndex') || adminPollSource.includes('patch.current_slide = slideIndex'), 'Launching a poll must move to its matching slide');
assert.ok(adminPollSource.includes('closeLivePolls'), 'Launching a poll must close stale live polls');

const serverSource = fs.readFileSync(path.join(root, 'lib/supabase.js'), 'utf8');
assert.ok(serverSource.includes('https://jxddmdtwcosxljjkzcvc.supabase.co'), 'Known Supabase project URL fallback missing');

const required = [
  'api/public-state.js',
  'api/public-poll-results.js',
  'supabase/fix-cross-network-sync.sql',
  'supabase/fix-poll-projector.sql'
];
for (const file of required) assert.ok(fs.existsSync(path.join(root, file)), `Missing ${file}`);

const repairSql = fs.readFileSync(path.join(root, 'supabase/fix-cross-network-sync.sql'), 'utf8');
for (const pollId of ['ignored-warning', 'where-drift-happens', 'relief-or-surrender', 'mercy-response']) {
  assert.ok(repairSql.includes(pollId), `Repair SQL missing poll ${pollId}`);
}
assert.ok(repairSql.includes('supabase_realtime'), 'Repair SQL must enable Realtime publication');
assert.ok(repairSql.includes('submit_poll_vote'), 'Repair SQL must restore poll vote function');

const { supabaseRequest } = await import('../lib/supabase.js');
const originalFetch = global.fetch;
const originalEnv = { ...process.env };
let capturedHeaders = null;

global.fetch = async (_url, options) => {
  capturedHeaders = options.headers;
  return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } });
};

process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SECRET_KEY = 'sb_secret_test';
delete process.env.SUPABASE_SERVICE_ROLE_KEY;
await supabaseRequest('presentation_state?select=*');
assert.equal(capturedHeaders.apikey, 'sb_secret_test');
assert.equal(capturedHeaders.Authorization, undefined, 'New secret keys must not be sent as bearer JWTs');

process.env.SUPABASE_SECRET_KEY = '';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJlegacy-service-role';
await supabaseRequest('presentation_state?select=*');
assert.equal(capturedHeaders.Authorization, 'Bearer eyJlegacy-service-role');

global.fetch = originalFetch;
process.env = originalEnv;

console.log('Cross-network sync tests passed.');
