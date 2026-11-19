// Tests for the policy check and the org plan. node test/run.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validate, checkActions, glob, load } from '../build/abp.mjs';
import { plan } from '../build/org-plan.mjs';

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
const live = { SovereignWebsite__Factory: { ...org.defaults, description: org.repos[0].description, default_branch: 'dev', has_dev: true }, Stray: {} };
const pl = plan({ ...org, repos: [org.repos[0]] }, live);
assert.deepEqual(pl.actions, [], 'factory as Dinis made it needs nothing'); assert.deepEqual(pl.unlisted, ['Stray']);
console.log('OK (tests)');
