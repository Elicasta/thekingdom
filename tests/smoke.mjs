import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const lessonSource = fs.readFileSync(path.join(root, 'lesson.js'), 'utf8');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(lessonSource, context);
const lesson = context.window.KINGDOM_LESSON;

assert.equal(lesson.title, 'When the Kingdom Falls');
assert.equal(lesson.series, 'The Kingdom');
assert.equal(lesson.slides.length, 33, 'Expected exactly 33 slides');
assert.equal(lesson.polls.length, 4, 'Expected exactly 4 lesson polls');
assert.equal(lesson.reflectionGroups.length, 7, 'Expected seven reflection groups');
assert.equal(lesson.slides[0].type, 'title');
assert.equal(lesson.slides[0].title, 'When the Kingdom Falls');
assert.equal(lesson.slides.at(-1).type, 'closing');
assert.ok(lesson.slides.some(slide => slide.ref === 'Exodus 5:1–2'), 'Missing Pharaoh question slide');
assert.ok(lesson.polls.some(poll => poll.id === 'relief-or-surrender'), 'Missing relief/surrender poll');
assert.ok(lesson.reflectionGroups.some(group => group.title === 'Follow the Two Kingdoms'), 'Missing two-kingdom reflection group');


const appSource = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const permanentRoutes = ['/projector', '/scriptures', '/confidence', '/obslowerthirds', '/obsslides', '/admin', '/remote', '/questions', '/polls'];
for (const route of permanentRoutes) {
  assert.ok(appSource.includes(route.slice(1)), `Missing route support for ${route}`);
  const entry = path.join(root, route.slice(1), 'index.html');
  assert.ok(fs.existsSync(entry), `Missing physical route entry for ${route}`);
  assert.equal(fs.readFileSync(entry, 'utf8'), fs.readFileSync(path.join(root, 'index.html'), 'utf8'), `${route} entry must match index.html`);
}

const vercelConfig = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
const rewrites = new Map((vercelConfig.rewrites || []).map(item => [item.source, item.destination]));
for (const route of permanentRoutes) {
  assert.equal(rewrites.get(route), '/index.html', `Missing explicit Vercel rewrite for ${route}`);
}
assert.ok(fs.existsSync(path.join(root, '404.html')), 'Missing 404.html app fallback');

const requiredFiles = [
  'index.html',
  'styles.css',
  'app.js',
  'lesson.js',
  'vercel.json',
  'supabase/setup.sql',
  'supabase/update-lesson-egypt-jerusalem.sql',
  'supabase/fix-poll-projector.sql',
  'api/admin-login.js',
  'api/admin-state.js',
  'api/admin-poll.js',
  'api/admin-questions.js',
  'api/poll-vote.js',
  'api/question-submit.js',
  'api/public-state.js',
  'api/public-poll-results.js',
  'assets/kingdom-bg.png'
];
for (const file of requiredFiles) {
  assert.ok(fs.existsSync(path.join(root, file)), `Missing ${file}`);
}

const allTextFiles = requiredFiles
  .filter(file => !file.endsWith('.png'))
  .map(file => fs.readFileSync(path.join(root, file), 'utf8'))
  .join('\n');
assert.ok(!/the ministry/i.test(allTextFiles), 'Old visible series branding remains');
assert.ok(!/product launch/i.test(allTextFiles), 'Product-launch language remains');
assert.ok(!/thekingdom5853585/i.test(allTextFiles), 'Stray secret-looking string should not be committed');

const titleRenderSegment = appSource.slice(appSource.indexOf("case 'title':"), appSource.indexOf("case 'statement':"));
assert.equal((titleRenderSegment.match(/slide-title/g) || []).length, 1, 'Title slide should render one title element');

console.log('The Kingdom smoke tests passed.');
