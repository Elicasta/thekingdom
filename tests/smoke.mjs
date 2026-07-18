import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const html = read("index.html");
const css = read("styles.css");
const js = read("app.js");
const config = read("config.js");
const sql = read("supabase/setup.sql");
const sw = read("sw.js");

assert.match(html, /The Kingdom/);
assert.match(html, /When the Kingdom Falls/);
assert.match(html, /id="view-polls"/);
assert.match(html, /id="view-reflect"/);
assert.match(html, /src="config\.js"/);
assert.match(html, /Anonymous response/);
assert.match(html, /<span class="feature-number">12<\/span>/);
assert.match(css, /--ember:\s*#d65f3e/i);
assert.match(css, /\.poll-results/);
assert.doesNotMatch(`${html}\n${css}\n${js}`, /The Ministry|Matthew 10 Series|tm_name/i);
assert.equal((js.match(/type: "poll"/g) || []).length, 3);
assert.equal((js.match(/label: "/g) || []).length >= 23, true);
assert.match(js, /submit_kingdom_poll_vote/);
assert.match(js, /get_kingdom_poll_results/);
assert.match(js, /clear_kingdom_poll_votes/);
assert.match(js, /if \(\/\^eyJ\/i\.test\(APP_CONFIG\.supabasePublishableKey\)\)/);
assert.match(js, /Reflection answers still remain only on this phone/);
assert.match(config, /supabasePublishableKey/);
assert.doesNotMatch(config, /sb_secret_|eyJ[a-zA-Z0-9_-]{20,}/);
assert.match(sql, /enable row level security/i);
assert.match(sql, /security definer/gi);
assert.match(sql, /revoke all on table public\.kingdom_poll_votes/i);
assert.match(sql, /grant execute on function public\.submit_kingdom_poll_vote/i);
assert.match(sql, /grant execute on function public\.clear_kingdom_poll_votes/i);
assert.match(sql, /unique \(poll_id, device_id\)/i);
assert.match(sw, /config\.js/);
assert.match(sw, /cache: "no-store"/);

new vm.Script(js, { filename: "app.js" });
new vm.Script(config, { filename: "config.js" });
new vm.Script(sw, { filename: "sw.js" });
console.log("Smoke checks passed.");
