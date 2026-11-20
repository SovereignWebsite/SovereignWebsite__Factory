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
const live = { SovereignWebsite__Factory: { ...org.defaults, description: org.repos[0].description, default_branch: 'dev', has_dev: true, teams: { 'sovereignwebsite-agents-ci': 'push' }, protected: true }, Stray: {} };
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
assert.ok(fresh.actions.some((a) => a.action === 'repo.protect_branches' && a.target === 'SovereignWebsite__Hub'), 'new repositories are protected');
const base = { ...org.defaults, default_branch: 'dev', has_dev: true, teams: { 'sovereignwebsite-agents-ci': 'push' }, protected: true, has_pages: true };
const one = (l) => plan({ ...org, repos: [org.repos.find((x) => x.name === 'SovereignWebsite__Site')] }, { SovereignWebsite__Site: { ...base, description: org.repos.find((x) => x.name === 'SovereignWebsite__Site').description, homepage: 'https://sovereignwebsite.site', cname: 'sovereignwebsite.site', seed_missing: [], ...l } }).actions.map((a) => a.action);
assert.deepEqual(one({ cert_state: 'approved' }), ['pages.enforce_https']);
assert.deepEqual(one({ cert_state: 'authorization_pending' }), [], 'never nudge while pending');
assert.deepEqual(one({ cert_state: null }), [], 'no certificate yet: wait, the domain was just set');
assert.deepEqual(one({ cert_state: 'errored' }), ['pages.nudge_certificate']);
process.env.NUDGE_MISSING = 'true'; assert.deepEqual(one({ cert_state: null }), ['pages.nudge_certificate'], 'by hand: nudge a missing certificate'); delete process.env.NUDGE_MISSING;
assert.deepEqual(one({ cert_state: 'approved', https_enforced: true }), []);
assert.equal(checkActions(p, { pipeline: 'org-apply', actions: [{ action: 'ruleset.delete', target: 'X' }] }).length, 1);
const R = await import('../build/requests.mjs');
const good = { label: 'pipeline-demo', title: 'A site from one request', description: 'Made by the pipeline.', kind: 'demo' };
assert.deepEqual(R.validate(good, '2026-11-19__pipeline-demo'), []);
assert.ok(R.validate({ ...good, label: 'Bad_Label' }, '2026-11-19__Bad_Label').length, 'bad label refused');
assert.ok(R.validate({ ...good, label: 'hub' }, '2026-11-19__hub').length, 'reserved label refused');
assert.ok(R.validate(good, '2026-11-19__other').length, 'folder must match label');
assert.ok(R.validate({ ...good, kind: 'customer' }, '2026-11-19__pipeline-demo').length, 'kind is demo or owner');
const rr = R.repos([good]);
assert.equal(rr[0].name, 'Site__pipeline-demo'); assert.equal(rr[0].cname, 'pipeline-demo.sovereignwebsite.site');
const rp = plan({ ...org, repos: [...org.repos, ...rr] }, {});
assert.deepEqual(checkActions(p, rp), [], 'a request plan is allowed by the policy');
assert.deepEqual(R.dnsRecords([good])[0], { name: 'pipeline-demo.sovereignwebsite.site', type: 'CNAME', values: ['sovereignwebsite.github.io'], for: 'Site__pipeline-demo' });
const st = seedFiles('seed/site-template'); for (const must of ['.github/workflows/pages.yml', 'site/CNAME', 'site/index.html']) assert.ok(st.includes(must));
// Moves: a request with a from block, transfer-apply, and the moved site handed to Org apply and DNS apply.
const T = await import('../build/transfer-plan.mjs'), A = await import('../build/transfer-apply.mjs'), { checkTransfer } = await import('../build/abp.mjs');
const mv = { label: 'transfer-test', title: 'A move test', description: 'A throwaway repository to prove the move.', kind: 'demo', from: { owner: 'AgentiCCells', repo: 'AgentiCCells__Site__Transfer-Test', address: 'transfer-test.agenticcells.site' }, apply: 'dry-run' };
const F = '2026-11-20__transfer-test';
assert.deepEqual(R.validate(mv, F), [], 'a move request validates');
assert.ok(R.validate({ ...mv, from: { ...mv.from, owner: 'PrompTugal' } }, F).length, 'only from AgentiCCells');
assert.ok(R.validate({ ...mv, apply: 'yes' }, F).length, 'apply is dry-run or real');
assert.ok(R.validate({ ...mv, from: undefined }, F).length, 'apply only with from');
assert.ok(R.validate({ ...mv, from: { ...mv.from, repo: '../x' } }, F).length, 'from.repo is a name');
const waiting = { ...mv, folder: F, moved: false }, moved = { ...waiting, moved: true };
assert.deepEqual(R.repos([waiting]), [], 'Org apply leaves a move alone until it is recorded');
assert.deepEqual(R.dnsRecords([waiting]), [], 'no CNAME until the move is recorded');
const mr = R.repos([moved]);
assert.equal(mr[0].name, 'Site__transfer-test'); assert.equal(mr[0].seed, undefined, 'a moved repository is never seeded'); assert.ok(mr[0].transfer_from);
assert.ok(!plan({ ...org, repos: [...org.repos, ...mr] }, {}).actions.some((a) => a.target === 'Site__transfer-test'), 'Org apply never creates a moved repository');
const tp = T.planFor(waiting);
assert.deepEqual(tp.actions, [{ action: 'repo.transfer_in', target: 'AgentiCCells/AgentiCCells__Site__Transfer-Test', to: 'SovereignWebsite/Site__transfer-test' }]);
assert.deepEqual(checkActions(p, tp), [], 'a listed move is allowed');
assert.deepEqual(T.pending([waiting, moved, { ...good, folder: 'x', moved: false }]).map((r) => r.folder), [F], 'only unmoved requests with from are pending');
const L = p.pipelines['transfer-apply'].limits;
const tr = (target, to = 'SovereignWebsite/Site__x') => checkTransfer(L, { action: 'repo.transfer_in', target, to });
assert.ok(tr('AgentiCCells/AgentiCCells__Site__Gabriel-DaCruz').length, 'a repository not on the list is refused');
assert.ok(tr('PrompTugal/AgentiCCells__Site__Weather-Demo').length, 'another source organisation is refused');
assert.ok(tr('AgentiCCells/AgentiCCells__Site__Weather-Demo', 'Elsewhere/Site__x').length, 'another target is refused');
assert.ok(tr('AgentiCCells/AgentiCCells__Site__Weather-Demo', 'SovereignWebsite/Other').length, 'the new name is Site__<label>');
assert.deepEqual(tr('AgentiCCells/AgentiCCells__Site__Weather-Demo'), []);
assert.ok(checkActions(p, { pipeline: 'transfer-apply', actions: [tp.actions[0], tp.actions[0]] }).length, 'one move per run');
for (const x of ['repo.delete', 'repo.transfer_out', 'repo.update_settings']) assert.ok(checkActions(p, { pipeline: 'transfer-apply', actions: [{ action: x, target: 'AgentiCCells/AgentiCCells__Site__Weather-Demo' }] }).length, `${x} refused for transfer-apply`);
assert.equal(checkActions(p, { pipeline: 'org-apply', actions: [{ action: 'repo.transfer_in', target: 'AgentiCCells/AgentiCCells__Site__Weather-Demo', to: 'SovereignWebsite/Site__x' }] }).length, 1, 'Org apply may not move');
const checked = { ...tp, findings: ['Pages: workflow'], blockers: [] };
assert.ok(A.refusals(p, checked).some((e) => e.includes('dry-run')), 'a dry run never moves');
assert.deepEqual(A.refusals(p, { ...checked, apply: 'real' }), [], 'a real, checked move is allowed');
assert.ok(A.refusals(p, { ...checked, apply: 'real', blockers: ['1 open pull request(s): mid-round'] }).length, 'a blocker stops the move');
assert.ok(A.refusals(p, { ...tp, apply: 'real' }).length, 'no move without a live preflight');
assert.deepEqual(A.body(tp), { path: '/repos/AgentiCCells/AgentiCCells__Site__Transfer-Test/transfer', data: { new_owner: 'SovereignWebsite', new_name: 'Site__transfer-test' } });
// Preflight against a fake GitHub: what stops a move.
const fake = (over = {}) => async (o, path) => {
  const base = {
    '/repos/AgentiCCells/AgentiCCells__Site__Transfer-Test': { status: 200, data: { full_name: 'AgentiCCells/AgentiCCells__Site__Transfer-Test', private: false, archived: false, fork: false, default_branch: 'dev' } },
    '/repos/SovereignWebsite/Site__transfer-test': { status: 404, data: {} },
  };
  const k = path.split('?')[0];
  return over[k] ?? base[k] ?? (k.endsWith('/pulls') ? { status: 200, data: [] } : k.endsWith('/runs') ? { status: 200, data: { total_count: 0 } } : { status: 404, data: null });
};
globalThis.fetch = async () => ({ ok: false });
const ok = await T.preflight(T.planFor(waiting), fake());
assert.deepEqual(ok.blockers, [], 'a clean source passes');
const taken = await T.preflight(T.planFor(waiting), fake({ '/repos/SovereignWebsite/Site__transfer-test': { status: 200, data: {} } }));
assert.ok(taken.blockers.some((b) => b.includes('already answers')), 'an existing target stops the move');
const pr = await T.preflight(T.planFor(waiting), fake({ '/repos/AgentiCCells/AgentiCCells__Site__Transfer-Test/pulls': { status: 200, data: [{}] } }));
assert.ok(pr.blockers.some((b) => b.includes('mid-round')), 'an open pull request stops the move');
const wfSecret = await T.preflight(T.planFor(waiting), fake({
  '/repos/AgentiCCells/AgentiCCells__Site__Transfer-Test/contents/.github/workflows': { status: 200, data: [{ path: '.github/workflows/x.yml' }] },
  '/repos/AgentiCCells/AgentiCCells__Site__Transfer-Test/contents/.github/workflows/x.yml': { status: 200, data: { content: Buffer.from('token: ${{ secrets.APP_KEY }}').toString('base64') } },
}));
assert.ok(wfSecret.blockers.some((b) => b.includes('APP_KEY')), 'a workflow secret that stays behind stops the move');
console.log('OK (tests)');
