// Tests for the policy check and the org plan. node test/run.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validate, checkActions, glob, load } from '../build/abp.mjs';
import { plan, seedFiles } from '../build/org-plan.mjs';

const p = load();
assert.deepEqual(validate(p), [], 'policy validates');
assert.ok(glob('board/**', 'board/a/b.md')); assert.ok(!glob('board/**', 'build/x.mjs')); assert.ok(glob('*.md', 'README.md')); assert.ok(!glob('*.md', 'docs/x.md'));
assert.ok(validate({ ...p, agents: { 'x@Y.z': { may_change: ['**'], branches: ['main'] } } }).some((e) => e.includes('main')), 'main refused');
assert.deepEqual(checkActions(p, { pipeline: 'org-apply', actions: [{ action: 'repo.create', target: 'X' }] }), []);
assert.equal(checkActions(p, { pipeline: 'org-apply', actions: [{ action: 'repo.delete', target: 'X' }] }).length, 1, 'delete refused');
assert.equal(checkActions(p, { pipeline: 'org-apply', actions: [{ action: 'repo.rename', target: 'X' }] }).length, 1, 'unlisted refused');
const org = JSON.parse(readFileSync('org/repos.json', 'utf8'));
const fresh = plan(org, {});
assert.ok(fresh.actions.some((a) => a.action === 'pages.enable' && a.target === 'SovereignWebsite__Website'));
assert.deepEqual(checkActions(p, fresh), [], 'a fresh plan is allowed');
const live = { SovereignWebsite__Factory: { ...org.defaults, description: org.repos[0].description, default_branch: 'dev', has_dev: true, teams: { 'sovereignwebsite-agents-ci': 'push' } }, Stray: {} };
const pl = plan({ ...org, repos: [org.repos[0]] }, live);
assert.deepEqual(pl.actions, [], 'factory as Dinis made it needs nothing'); assert.deepEqual(pl.unlisted, ['Stray']);
for (const n of ['SovereignWebsite__Website', 'SovereignWebsite__Org', 'SovereignWebsite__Site']) {
  const f = seedFiles(`seed/${n}`);
  for (const must of ['.github/workflows/pages.yml', 'site/CNAME', 'site/index.html']) assert.ok(f.includes(must), `${n} seeds ${must}`);
  const order = fresh.actions.filter((a) => a.target === n).map((a) => a.action);
  assert.ok(order.indexOf('pages.enable') < order.indexOf('repo.seed') && order.indexOf('pages.set_cname') < order.indexOf('repo.seed'), 'Pages and the domain before the seed, so the one deploy serves the domain');
}
assert.equal(readFileSync('seed/SovereignWebsite__Org/site/CNAME', 'utf8').trim(), 'sovereignwebsite.org');
const { dnsPlan } = await import('../build/dns-plan.mjs');
const dp = dnsPlan(JSON.parse(readFileSync('org/dns.json', 'utf8')), { SW_ZONE_ID_AI: 'Z1' });
assert.deepEqual(dp.errors, []); assert.deepEqual(checkActions(p, dp.plan), [], 'DNS plan allowed');
assert.ok(dp.batches.every((b) => b.batch.Changes.every((c) => c.Action === 'UPSERT')), 'UPSERT only');
assert.equal(dnsPlan({ zones: [{ zone: 'example.com', records: [] }] }).errors.length, 1, 'foreign zone refused');
assert.equal(dnsPlan({ zones: [{ zone: 'sovereignwebsite.ai', records: [{ name: 'evil.example.com', type: 'A', values: ['1.1.1.1'] }] }] }).errors.length, 1, 'record outside zone refused');
assert.ok(fresh.actions.some((a) => a.action === 'team.grant_push'), 'new repositories give the agents team push');
assert.equal(checkActions(p, { pipeline: 'org-apply', actions: [{ action: 'team.grant_admin', target: 'X' }] }).length, 1, 'admin for a team refused');
console.log('OK (tests)');
