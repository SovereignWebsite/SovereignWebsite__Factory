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
assert.equal(checkActions(p, { pipeline: 'org-apply', actions: [{ action: 'repo.change_visibility', target: 'X' }] }).length, 1, 'unlisted refused');
const org = JSON.parse(readFileSync('org/repos.json', 'utf8'));
const fresh = plan(org, {});
assert.ok(fresh.actions.some((a) => a.action === 'pages.enable' && a.target === 'SovereignWebsite__Website'));
assert.deepEqual(checkActions(p, fresh), [], 'a fresh plan is allowed');
const live = { SovereignWebsite__IaC: { ...org.defaults, description: org.repos[0].description, default_branch: 'dev', has_dev: true, teams: { 'sovereignwebsite-agents-ci': 'push' }, protected: true }, Stray: {} };
const pl = plan({ ...org, repos: [org.repos[0]] }, live);
assert.deepEqual(pl.actions, [], 'factory as Dinis made it needs nothing'); assert.deepEqual(pl.unlisted, ['Stray']);
// The Factory becomes IaC (Dinis, 22 Nov 2026): while GitHub still has the old name, Org apply renames it and creates nothing.
const before = plan({ ...org, repos: [org.repos[0]] }, { SovereignWebsite__Factory: live.SovereignWebsite__IaC });
assert.deepEqual(before.actions, [{ action: 'repo.rename', target: 'SovereignWebsite__Factory', to: 'SovereignWebsite__IaC' }], 'the old name is renamed, never recreated');
assert.deepEqual(checkActions(p, before), [], 'the rename is allowed');
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
const good = { label: 'pipeline-demo', domain: 'sovereignwebsite.site', title: 'A site from one request', description: 'Made by the pipeline.', kind: 'demo' };
assert.equal(R.repos([{ ...good, domain: undefined }])[0].cname, 'pipeline-demo.sovereignweb.site', 'no domain: sovereignweb.site, the default');
assert.ok(R.validate(good, '2026-11-19__pipeline-demo').some((e) => e.includes('needs a group')), 'no group is refused now');
assert.deepEqual(R.validate({ ...good, group: 'demo' }, '2026-11-19__pipeline-demo'), []);
assert.ok(R.validate({ ...good, label: 'Bad_Label' }, '2026-11-19__Bad_Label').length, 'bad label refused');
assert.ok(R.validate({ ...good, label: 'hub' }, '2026-11-19__hub').length, 'reserved label refused at the top level');
assert.deepEqual(R.validate({ ...good, label: 'hub', group: 'agents', agent: 'hub.b@SovereignWebsite.dinis', kind: 'owner' }, '2026-11-19__hub'), [], 'a reserved name is fine inside a group');
assert.deepEqual(R.validate({ ...good, label: 'agents', domain: undefined }, '2026-11-19__agents'), [], "a group's own home page");
assert.ok(R.validate(good, '2026-11-19__other').length, 'folder must match label');
assert.ok(R.validate({ ...good, kind: 'customer' }, '2026-11-19__pipeline-demo').length, 'kind is demo or owner');
const rr = R.repos([good]);
assert.equal(rr[0].name, 'Site__Pipeline-Demo'); assert.equal(rr[0].cname, 'pipeline-demo.sovereignwebsite.site');
const rp = plan({ ...org, repos: [...org.repos, ...rr] }, {});
assert.deepEqual(checkActions(p, rp), [], 'a request plan is allowed by the policy');
assert.deepEqual(R.dnsRecords([good])[0], { zone: 'sovereignwebsite.site', name: 'pipeline-demo.sovereignwebsite.site', type: 'CNAME', values: ['sovereignwebsite.github.io'], for: 'Site__Pipeline-Demo' });
const ec = { label: 'emily-cruz', group: 'artists', domain: 'sovereignwebsite.site', title: 'Emily Cruz', description: 'Actor-musician.', kind: 'owner' };
assert.deepEqual(R.validate(ec, '2026-11-20__emily-cruz'), [], 'a grouped request validates');
assert.ok(R.validate({ ...ec, group: 'shops' }, '2026-11-20__emily-cruz').length, 'only known groups');
assert.ok(R.validate({ ...ec, group: 'person' }, '2026-11-20__emily-cruz').length, 'person is not an official group');
assert.ok(R.validate({ ...good, label: 'artists' }, '2026-11-19__artists').length, 'the old group name stays reserved');
const er = R.repos([ec])[0];
assert.equal(er.name, 'Site__Artist__Emily-Cruz'); assert.equal(er.cname, 'emily-cruz.artists.sovereignwebsite.site'); assert.equal(er.vars.host, 'emily-cruz.artists.sovereignwebsite.site');
assert.equal(R.dnsRecords([ec])[0].name, 'emily-cruz.artists.sovereignwebsite.site');
assert.equal(dnsPlan({ zones: [{ zone: 'sovereignwebsite.site', records: R.dnsRecords([ec]) }] }).errors.length, 0, 'a grouped name is inside the .site zone');
assert.equal(R.repos([good])[0].vars.host, 'pipeline-demo.sovereignwebsite.site', 'no group: the address is unchanged');
assert.equal(readFileSync('seed/site-template/site/CNAME', 'utf8').trim(), '{{host}}');
const gv = { label: '33n-ventures', group: 'invest', domain: 'sovereignwebsite.site', title: 'A firm', description: 'A private preview.', kind: 'owner', access: 'vault' };
assert.deepEqual(R.validate(gv, '2026-11-20__33n-ventures'), [], 'a gated request validates');
assert.ok(R.validate({ ...gv, access: 'secret' }, '2026-11-20__33n-ventures').length, 'access is public or vault');
const gr = R.repos([gv])[0];
assert.equal(gr.seed, 'seed/gate-template'); assert.equal(gr.cname, '33n-ventures.invest.sovereignwebsite.site');
assert.equal(R.repos([good])[0].seed, 'seed/site-template', 'no access: the public starter page');
const gt = seedFiles('seed/gate-template');
for (const must of ['.github/workflows/pages.yml', 'CLAUDE.md', 'site/CNAME', 'site/index.html', 'site/open.js', 'site/robots.txt', 'site/vendor/jsqr-1.4.0/jsQR.js', 'site/vendor/jsqr-1.4.0/LICENSE']) assert.ok(gt.includes(must), `gate template seeds ${must}`);
const gi = readFileSync('seed/gate-template/site/index.html', 'utf8');
for (const id of ['key', 'open', 'file', 'status', 'loading', 'loading-msg', 'dropping', 'viewer', 'tabs', 'close', 'frame', 'viewer-title', 'viewer-meta']) assert.ok(gi.includes(`id="${id}"`), `gate page keeps #${id} for open.js`);
assert.ok(gi.includes('id="forget"') && gi.includes("localStorage.getItem('sv-saved:'"), 'gate page: the key is brought once, and can be forgotten');
assert.ok(gi.includes('data-vault-zip=""') && gi.includes('<script src="open.js">') && gi.includes('noindex'), 'gate page: no vault yet, open.js beside it, not indexed');
const sv = { label: 'sotavento', group: 'invest', domain: 'sovereignweb.site', title: 'A firm', description: 'A private preview.', kind: 'owner', access: 'vault' };
assert.deepEqual(R.validate(sv, '2026-11-20__sotavento'), [], 'a request on the new domain validates');
assert.ok(R.validate({ ...sv, domain: 'example.com' }, '2026-11-20__sotavento').length, 'only our domains');
assert.equal(R.repos([sv])[0].cname, 'sotavento.invest.sovereignweb.site');
assert.equal(R.repos([{ ...sv, label: 'perspace', group: 'company' }])[0].cname, 'perspace.company.sovereignweb.site');
assert.ok(R.validate({ ...good, label: 'artists' }, '2026-11-19__artists').length, 'artists is reserved');
assert.equal(R.repos([good])[0].cname, 'pipeline-demo.sovereignwebsite.site', 'no domain: sovereignwebsite.site');
const { addRequests, ZONE_VAR } = await import('../build/dns-plan.mjs');
const dz = addRequests({ zones: [{ zone: 'sovereignwebsite.site', records: [] }] }, R.dnsRecords([sv, good]));
assert.deepEqual(dz.zones.map((z) => [z.zone, z.records.map((r) => r.name)]), [['sovereignwebsite.site', ['pipeline-demo.sovereignwebsite.site']], ['sovereignweb.site', ['sotavento.invest.sovereignweb.site']]], 'each CNAME in its own zone');
assert.equal(ZONE_VAR['sovereignweb.site'], 'SW_ZONE_ID_WEB_SITE');
assert.deepEqual(dnsPlan(dz).errors, [], 'the new zone is one of ours');
assert.ok(p.pipelines['transfer-apply'].limits.controlled_domains.includes('sovereignweb.site'), 'the new domain is ours for moves too');
// Moves: the old address gets a redirect site, listed after every site so its domain is freed first.
const em = { label: 'emily-cruz', group: 'artist', title: 'E', description: 'An artist.', kind: 'owner', previous: ['emily-cruz.artists.sovereignwebsite.site'] };
assert.deepEqual(R.validate(em, '2026-11-20__emily-cruz'), [], 'a moved request validates');
assert.ok(R.validate({ ...em, previous: ['emily.example.com'] }, '2026-11-20__emily-cruz').length, 'an old address must be on our domains');
assert.ok(R.validate({ ...em, previous: ['emily-cruz.artist.sovereignweb.site'] }, '2026-11-20__emily-cruz').length, 'an old address is not the new one');
assert.ok(R.validate({ ...em, previous: 'x' }, '2026-11-20__emily-cruz').length, 'previous is a list');
const mr2 = R.repos([em, good]);
assert.deepEqual(mr2.map((x) => x.name), ['Site__Artist__Emily-Cruz', 'Site__Pipeline-Demo', 'Redirect__Artist__Emily-Cruz'], 'redirects come after every site');
assert.equal(mr2[0].cname, 'emily-cruz.artist.sovereignweb.site');
assert.equal(mr2[2].cname, 'emily-cruz.artists.sovereignwebsite.site'); assert.equal(mr2[2].seed, 'seed/redirect-template'); assert.equal(mr2[2].vars.to, 'emily-cruz.artist.sovereignweb.site');
const md = R.dnsRecords([em]);
assert.deepEqual(md.map((x) => [x.zone, x.name]), [['sovereignweb.site', 'emily-cruz.artist.sovereignweb.site'], ['sovereignwebsite.site', 'emily-cruz.artists.sovereignwebsite.site']], 'both names keep a CNAME');
const mp = plan({ ...org, repos: [...org.repos, ...mr2] }, {});
assert.deepEqual(checkActions(p, mp), [], 'a move plan is allowed');
const rt = seedFiles('seed/redirect-template');
for (const must of ['.github/workflows/pages.yml', 'CLAUDE.md', 'site/CNAME', 'site/index.html', 'site/404.html']) assert.ok(rt.includes(must), `redirect template seeds ${must}`);
const rh = readFileSync('seed/redirect-template/site/index.html', 'utf8');
assert.ok(rh.includes("location.replace('https://{{to}}' + location.pathname + location.search + location.hash)") && rh.includes('rel="canonical"') && rh.includes('noindex'), 'the redirect keeps the path and the #fragment');
// Names indexed by type and capitalised; the old name is renamed, never recreated.
assert.equal(R.repoName({ label: 'algarve-evolution', group: 'organisation' }), 'Site__Organisation__Algarve-Evolution');
assert.equal(R.repoName({ label: 'emily-cruz', group: 'artist' }), 'Site__Artist__Emily-Cruz');
assert.equal(R.repoName({ label: 'silvio-switha', group: 'cv' }), 'Site__CV__Silvio-Switha');
assert.equal(R.repoName({ label: '33n-ventures', group: 'invest' }), 'Site__Invest__33n-Ventures');
assert.equal(R.repoName({ label: 'weather-demo' }), 'Site__Weather-Demo');
assert.equal(R.repoName({ label: 'aws', group: 'platform', repo_label: 'AWS' }), 'Site__Platform__AWS', 'repo_label keeps its capitals');
assert.equal(R.host({ label: 'aws', group: 'platform', repo_label: 'AWS' }), 'aws.platform.sovereignweb.site', 'repo_label leaves the address');
assert.ok(R.validate({ label: 'aws', group: 'platform', repo_label: 'AWX', title: 'x', description: 'x' }).some((e) => e.includes('repo_label')), 'repo_label must be the same letters');
const ren = R.repos([em])[0];
assert.deepEqual(ren.aka, ['Site__emily-cruz', 'Site__Emily-Cruz']);
const rp2 = plan({ ...org, repos: [...org.repos, ...R.repos([em])] }, { 'Site__emily-cruz': { ...base }, 'Redirect__emily-cruz': { ...base } });
assert.deepEqual(rp2.actions.filter((a) => a.action === 'repo.rename').map((a) => [a.target, a.to]), [['Site__emily-cruz', 'Site__Artist__Emily-Cruz'], ['Redirect__emily-cruz', 'Redirect__Artist__Emily-Cruz']], 'the old names are renamed');
assert.ok(!rp2.actions.some((a) => a.action === 'repo.create' && /Emily-Cruz/.test(a.target)), 'never a second copy');
assert.ok(!rp2.unlisted.includes('Site__emily-cruz'), 'an old name is not reported as unlisted');
assert.deepEqual(checkActions(p, rp2), [], 'a rename is allowed for Org apply');
assert.ok((await import('../build/abp.mjs')).checkTransfer(p.pipelines['transfer-apply'].limits, { action: 'repo.transfer_in', target: 'AgentiCCells/AgentiCCells__Site__Weather-Demo', to: 'SovereignWebsite/Site__Weather-Demo', address_to: 'weather-demo.sovereignweb.site' }).length === 0, 'a transfer to Site__<Name>');
// Agents' own sites: Site__Agent__<Role> (renamed from Site__Agents__<Role>), seeded with a page whose key is copied from team/keys.json at each deploy.
const ag = { label: 'factory', group: 'agents', agent: 'factory.b@SovereignWebsite.dinis', title: 'factory.b', description: 'An agent.', kind: 'owner' };
assert.deepEqual(R.validate(ag, '2026-11-20__factory'), []);
assert.ok(R.validate({ ...ag, group: 'company' }, '2026-11-20__factory').length, 'an agent site is in the agents group');
assert.ok(R.validate({ ...ag, agent: 'not an agent' }, '2026-11-20__factory').length, 'agent is <role>@<Project>.<owner>');
const agr = R.repos([ag])[0];
assert.equal(agr.name, 'Site__Agent__Factory'); assert.ok(agr.aka.includes('Site__Agents__Factory'), 'the plural home is renamed, not made again'); assert.equal(agr.cname, 'factory.agents.sovereignweb.site'); assert.equal(agr.seed, 'seed/agent-template'); assert.equal(agr.vars.agent, 'factory.b@SovereignWebsite.dinis');
assert.equal(R.repos([{ ...good, label: 'agents', domain: undefined }])[0].name, 'Site__Agents');
const apy = readFileSync('seed/agent-template/.github/workflows/pages.yml', 'utf8');
assert.ok(apy.includes('SovereignWebsite__IaC/dev/team/keys.json') && apy.includes('site/key.json'), 'the key is copied from the Factory root at each deploy');
assert.ok(!seedFiles('seed/agent-template').includes('site/key.json'), 'no hand-written key in the template');
// A person named in a request is invited with push only; an unknown login is reported, not invited.
const kc = { label: 'kate-curtis-evans', group: 'founder', title: 'K', description: 'A founder.', kind: 'owner', collaborators: { 'kateandphilce-jpg': 'push' } };
assert.deepEqual(R.validate(kc, '2026-11-20__kate-curtis-evans'), []);
assert.ok(R.validate({ ...kc, collaborators: { 'kateandphilce-jpg': 'admin' } }, '2026-11-20__kate-curtis-evans').length, 'push only');
assert.ok(R.validate({ ...kc, collaborators: { 'not a login': 'push' } }, '2026-11-20__kate-curtis-evans').length, 'a GitHub login');
const kr = R.repos([kc])[0];
const kbase = { ...base, description: kr.description, homepage: kr.homepage, cname: kr.cname, seed_missing: [], cert_state: 'approved', https_enforced: true };
const kp = (l) => plan({ ...org, repos: [kr] }, { [kr.name]: { ...kbase, ...l } });
assert.deepEqual(kp({ collaborators: {} }).actions.filter((a) => a.action === 'repo.invite_collaborator'), [{ action: 'repo.invite_collaborator', target: 'Site__Founder__Kate-Curtis-Evans', user: 'kateandphilce-jpg', permission: 'push' }]);
assert.deepEqual(checkActions(p, kp({ collaborators: {} })), [], 'an invitation with push is allowed');
assert.equal(kp({ collaborators: { 'kateandphilce-jpg': 'invited' } }).actions.filter((a) => a.action === 'repo.invite_collaborator').length, 0, 'not invited twice');
const ku = kp({ collaborators: {}, unknown_users: ['kateandphilce-jpg'] });
assert.equal(ku.actions.filter((a) => a.action === 'repo.invite_collaborator').length, 0); assert.ok(ku.notes[0].includes('not found'), 'an unknown login is reported');
assert.ok(checkActions(p, { pipeline: 'org-apply', actions: [{ action: 'repo.invite_collaborator', target: 'X', user: 'u', permission: 'admin' }] }).length, 'never more than push');
const st = seedFiles('seed/site-template'); for (const must of ['.github/workflows/pages.yml', 'site/CNAME', 'site/index.html']) assert.ok(st.includes(must));
// Moves: a request with a from block, transfer-apply, and the moved site handed to Org apply and DNS apply.
const T = await import('../build/transfer-plan.mjs'), A = await import('../build/transfer-apply.mjs'), { checkTransfer } = await import('../build/abp.mjs');
const mv = { label: 'transfer-test', group: 'demo', domain: 'sovereignwebsite.site', title: 'A move test', description: 'A throwaway repository to prove the move.', kind: 'demo', from: { owner: 'AgentiCCells', repo: 'AgentiCCells__Site__Transfer-Test', address: 'transfer-test.agenticcells.site' }, apply: 'dry-run' };
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
assert.equal(mr[0].name, 'Site__Demo__Transfer-Test'); assert.equal(mr[0].seed, undefined, 'a moved repository is never seeded'); assert.ok(mr[0].transfer_from);
assert.ok(!plan({ ...org, repos: [...org.repos, ...mr] }, {}).actions.some((a) => a.target === 'Site__Demo__Transfer-Test'), 'Org apply never creates a moved repository');
const tp = T.planFor(waiting);
assert.deepEqual(tp.actions, [{ action: 'repo.transfer_in', target: 'AgentiCCells/AgentiCCells__Site__Transfer-Test', to: 'SovereignWebsite/Site__Demo__Transfer-Test', address_from: 'transfer-test.agenticcells.site', address_to: 'transfer-test.demo.sovereignwebsite.site' }]);
assert.ok(checkActions(p, { pipeline: 'transfer-apply', actions: [{ ...tp.actions[0], address_from: 'shop.example.com' }] }).some((x) => x.includes('not a domain we control')), 'a domain outside our control is refused');
assert.ok(checkActions(p, { pipeline: 'transfer-apply', actions: [{ ...tp.actions[0], address_from: 'evilagenticcells.site' }] }).length, 'a look-alike domain is refused');
{ const { keysChange } = await import('../build/abp.mjs');
  const kj = (ks, extra = {}) => JSON.stringify({ about: 'x', ...extra, keys: ks });
  const S = 'https://claude.ai/code/session_A', k = (agent, o = {}) => ({ id: agent.split('@')[0], agent, status: 'active', session: S, bundle: { sign: 'PEM' }, ...o });
  const kc = (before, after, agent = 'a.d@X.y', session = S, canRetireOthers = false) => keysChange({ agent, session, before: kj(before), after: kj(after), canRetireOthers });
  const base = [k('b.d@X.y', { session: 'https://claude.ai/code/session_B' })];
  assert.deepEqual(kc(base, [...base, k('a.d@X.y')]).errors, [], 'an agent publishes its own key'); assert.equal(kc(base, [...base, k('a.d@X.y')]).added.agent, 'a.d@X.y');
  assert.ok(kc(base, [...base, k('c.d@X.y')]).errors.length, "adding another agent's key is refused");
  assert.ok(kc(base, [...base, k('a.d@X.y'), k('a2.d@X.y', { agent: 'a.d@X.y' })]).errors.length, 'at most one key per commit');
  assert.ok(kc(base, [...base, k('a.d@X.y', { session: 'https://claude.ai/code/session_Z' })]).errors.length, "the new key's session must be the commit's");
  assert.ok(kc(base, [...base, k('a.d@X.y', { status: 'retired' })]).errors.length, 'a new key is active');
  assert.ok(kc(base, [...base, k('a.d@X.y', { bundle: {} })]).errors.length, 'a new key has a signing key');
  assert.ok(kc([k('a.d@X.y')], [k('a.d@X.y'), k('a.d.2', { agent: 'a.d@X.y' })]).errors.length, 'one live key per agent name');
  assert.deepEqual(kc([k('a.d@X.y', { status: 'retired' })], [k('a.d@X.y', { status: 'retired' }), k('a.d.2', { agent: 'a.d@X.y' })]).errors, [], 'a retired name may publish a new key');
  assert.deepEqual(kc([k('a.d@X.y')], [k('a.d@X.y', { status: 'retired', retired: '2026-11-22' })]).errors, [], 'an agent retires its own key');
  assert.ok(kc([k('a.d@X.y')], [k('a.d@X.y', { bundle: { sign: 'OTHER' } })]).errors.length, 'an agent may not edit its key in place');
  assert.ok(kc(base, [k('b.d@X.y', { session: 'https://claude.ai/code/session_B', status: 'retired' })]).errors.length, "retiring another agent's key is refused");
  assert.deepEqual(kc(base, [k('b.d@X.y', { session: 'https://claude.ai/code/session_B', status: 'retired' })], 'conductor.d@X.y', S, true).errors, [], "a conductor may retire another agent's key");
  assert.ok(kc(base, [k('b.d@X.y', { session: 'https://claude.ai/code/session_Z' })], 'conductor.d@X.y', S, true).errors.length, "nobody edits another agent's key");
  assert.ok(kc(base, []).errors.length, 'entries are never removed');
  assert.ok(keysChange({ agent: 'a.d@X.y', session: S, before: kj(base), after: kj(base, { about: 'changed' }) }).errors.length, 'the rest of the file is unchanged');
  assert.ok(p.keys_rule.includes('own key'), 'the keys rule text says agents publish their own key'); }
assert.deepEqual(checkActions(p, tp), [], 'a listed move is allowed');
assert.deepEqual(T.pending([waiting, moved, { ...good, folder: 'x', moved: false }]).map((r) => r.folder), [F], 'only unmoved requests with from are pending');
const L = p.pipelines['transfer-apply'].limits;
const tr = (target, to = 'SovereignWebsite/Site__x') => checkTransfer(L, { action: 'repo.transfer_in', target, to, address_to: 'x.sovereignwebsite.site' });
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
assert.deepEqual(A.body(tp), { path: '/repos/AgentiCCells/AgentiCCells__Site__Transfer-Test/transfer', data: { new_owner: 'SovereignWebsite', new_name: 'Site__Demo__Transfer-Test' } });
// Preflight against a fake GitHub: what stops a move.
const fake = (over = {}) => async (o, path) => {
  const base = {
    '/repos/AgentiCCells/AgentiCCells__Site__Transfer-Test': { status: 200, data: { full_name: 'AgentiCCells/AgentiCCells__Site__Transfer-Test', private: false, archived: false, fork: false, default_branch: 'dev' } },
    '/repos/SovereignWebsite/Site__Demo__Transfer-Test': { status: 404, data: {} },
  };
  const k = path.split('?')[0];
  return over[k] ?? base[k] ?? (k.endsWith('/pulls') ? { status: 200, data: [] } : k.endsWith('/runs') ? { status: 200, data: { total_count: 0 } } : { status: 404, data: null });
};
globalThis.fetch = async () => ({ ok: false });
const ok = await T.preflight(T.planFor(waiting), fake());
assert.deepEqual(ok.blockers, [], 'a clean source passes');
const taken = await T.preflight(T.planFor(waiting), fake({ '/repos/SovereignWebsite/Site__Demo__Transfer-Test': { status: 200, data: {} } }));
assert.ok(taken.blockers.some((b) => b.includes('already answers')), 'an existing target stops the move');
const pr = await T.preflight(T.planFor(waiting), fake({ '/repos/AgentiCCells/AgentiCCells__Site__Transfer-Test/pulls': { status: 200, data: [{}] } }));
assert.ok(pr.blockers.some((b) => b.includes('mid-round')), 'an open pull request stops the move');
const wfSecret = await T.preflight(T.planFor(waiting), fake({
  '/repos/AgentiCCells/AgentiCCells__Site__Transfer-Test/contents/.github/workflows': { status: 200, data: [{ path: '.github/workflows/x.yml' }] },
  '/repos/AgentiCCells/AgentiCCells__Site__Transfer-Test/contents/.github/workflows/x.yml': { status: 200, data: { content: Buffer.from('token: ${{ secrets.APP_KEY }}').toString('base64') } },
}));
const signedRepo = fake({ '/repos/AgentiCCells/AgentiCCells__Site__Transfer-Test/contents/team/keys.json': { status: 200, data: {} } });
assert.ok((await T.preflight(T.planFor(waiting), signedRepo)).blockers.some((b) => b.includes('signed')), 'a signed repository the request does not expect stops the move');
assert.deepEqual((await T.preflight(T.planFor({ ...waiting, signed: true }), signedRepo)).blockers, [], 'a signed repository the request expects passes');
assert.ok(R.validate({ ...mv, signed: 'yes' }, F).length, 'signed is a boolean');
assert.ok(wfSecret.blockers.some((b) => b.includes('APP_KEY')), 'a workflow secret that stays behind stops the move');
// The family links: the bar on our own sites, the small top-right pop-up credit on customers' sites (never both, never twice).
{
  const { mkdtempSync, writeFileSync: w, readFileSync: r } = await import('node:fs');
  const { execFileSync } = await import('node:child_process');
  const { tmpdir } = await import('node:os');
  const d = mkdtempSync(tmpdir() + '/fam-');
  w(d + '/index.html', '<html><body><a class="skip" href="#m">Skip</a>\n<nav class="family"><ul></ul></nav><main id="m"></main><footer>Owner</footer></body></html>');
  const run = (...a) => execFileSync('node', ['build/family-bar.mjs', d, ...a]);
  run('--credit'); run('--credit');
  const c = r(d + '/index.html', 'utf8');
  assert.ok(!c.includes('<nav class="family"'), 'the credit replaces the bar at the top');
  assert.equal(c.split('class="family-credit"').length, 2, 'one credit after two runs');
  assert.ok(c.indexOf('family-credit') > c.indexOf('class="skip"') && c.indexOf('family-credit') < c.indexOf('<main'), 'the credit comes before the content, after the skip link');
  run('https://sovereignwebsite.site/');
  const b = r(d + '/index.html', 'utf8');
  assert.ok(b.includes('<nav class="family"') && !b.includes('family-credit"'), 'the bar replaces the credit on our own sites');
  const t = r('seed/site-template/site/index.html', 'utf8');
  assert.ok(t.includes('class="family-credit"') && !t.includes('<nav class="family"'), 'new sites start with the credit, not the bar');
  assert.ok(r('seed/shared/family-credit.css', 'utf8').includes('[data-family-credit="off"]'), 'the owner can turn the credit off with one attribute');
}
// Every customer site starts with Start here, Use with your AI (llms.txt, data/agents.json) and How this site was made.
{
  const sf = seedFiles('seed/site-template');
  for (const must of ['site/start/index.html', 'site/agents/index.html', 'site/admin/index.html', 'site/llms.txt', 'site/data/agents.json']) assert.ok(sf.includes(must), `site-template seeds ${must}`);
  const j = JSON.parse(readFileSync('seed/site-template/site/data/agents.json', 'utf8').replaceAll('{{host}}', 'x.y').replaceAll('{{repo}}', 'Site__X'));
  assert.ok(Array.isArray(j.agents) && j.agents.length === 0, 'agents.json starts empty: each site agent adds itself, nothing invented');
  for (const p of ['index.html', 'start/index.html', 'agents/index.html', 'admin/index.html']) {
    const h = readFileSync('seed/site-template/site/' + p, 'utf8');
    for (const l of ['href="/start/"', 'href="/agents/"', 'href="/admin/"']) assert.ok(h.includes(l), `${p} links ${l}`);
    assert.ok(h.includes('class="family-credit"') && !h.includes('<nav class="family"'), `${p} carries the pop-up, not the bar`);
  }
}
// Link previews: every template page has its Open Graph and Twitter tags, the seed card is a 1200x630 JPEG under
// 300 KB, and the site's own deploy runs the share check, which fails a page without them.
{
  const { mkdtempSync, cpSync, writeFileSync: w, readFileSync: r, readdirSync: ls } = await import('node:fs');
  const { execFileSync } = await import('node:child_process');
  const { tmpdir } = await import('node:os');
  assert.ok(seedFiles('seed/site-template').includes('site/assets/share/card-1200x630.jpg'), 'the template seeds a share card');
  assert.ok(r('seed/site-template/.github/workflows/pages.yml', 'utf8').includes('node .github/ci/share-check.mjs _site'), 'the deploy runs the share check');
  const d = mkdtempSync(tmpdir() + '/share-'); cpSync('seed/site-template', d, { recursive: true });
  const fill = (p) => { for (const e of ls(p, { withFileTypes: true })) { const q = p + '/' + e.name; if (e.isDirectory()) fill(q); else if (/\.(html|txt|json)$|CNAME$/.test(e.name)) w(q, r(q, 'utf8').replaceAll('{{host}}', 'a.cv.sovereignweb.site').replaceAll('{{title}}', 'A').replaceAll('{{description}}', 'B').replaceAll('{{repo}}', 'Site__CV__A')); } };
  fill(d + '/site');
  const check = () => { try { execFileSync('node', ['.github/ci/build.mjs'], { cwd: d, stdio: 'pipe' }); execFileSync('node', ['.github/ci/share-check.mjs', '_site'], { cwd: d, stdio: 'pipe' }); return 0; } catch (e) { return e.status; } };
  assert.equal(check(), 0, 'a fresh site passes the share check');
  w(d + '/site/start/index.html', r(d + '/site/start/index.html', 'utf8').replace(/<meta property="og:image" [^>]*>/, ''));
  assert.equal(check(), 1, 'a page without og:image fails the deploy');
}
// The site pipeline: build makes version.json and the chip on every page; quality fails on a broken internal link,
// an em dash in visible text, the family strip or a leaked key; pages.yml versions from tags, then deploys, then tags.
{
  const { mkdtempSync, cpSync, rmSync, writeFileSync: w, readFileSync: r, readdirSync: ls } = await import('node:fs');
  const { execFileSync } = await import('node:child_process');
  const { tmpdir } = await import('node:os');
  const wf = r('seed/site-template/.github/workflows/pages.yml', 'utf8');
  for (const step of ['node .github/ci/build.mjs', 'node .github/ci/quality.mjs _site', 'html-validate@8.24.0 --config .github/ci/htmlvalidate.json', 'node .github/ci/axe.mjs _site', 'git push origin "$VERSION"']) assert.ok(wf.includes(step), `pages.yml runs ${step}`);
  assert.ok(!wf.includes('--preset'), 'html-validate takes its config file, not an unknown --preset option');
  assert.ok(wf.indexOf('quality.mjs') < wf.indexOf('upload-pages-artifact') && wf.indexOf('deploy-pages') < wf.indexOf('git tag "$VERSION"'), 'checks before deploy, tag after deploy');
  const d = mkdtempSync(tmpdir() + '/ci-'); cpSync('seed/site-template', d, { recursive: true });
  const fill = (p) => { for (const e of ls(p, { withFileTypes: true })) { const q = p + '/' + e.name; if (e.isDirectory()) fill(q); else if (/\.(html|txt|json)$|CNAME$/.test(e.name)) w(q, r(q, 'utf8').replaceAll('{{host}}', 'a.cv.sovereignweb.site').replaceAll('{{title}}', 'A').replaceAll('{{description}}', 'B').replaceAll('{{repo}}', 'Site__CV__A')); } };
  fill(d + '/site');
  const run = (f, ...a) => { try { execFileSync('node', [f, ...a], { cwd: d, stdio: 'pipe', env: { ...process.env, SITE_VERSION: 'v0.1.7', GITHUB_SHA: 'abcdef1234567', GITHUB_STEP_SUMMARY: '' } }); return 0; } catch (e) { return e.status; } };
  assert.equal(run('.github/ci/build.mjs'), 0);
  const v = JSON.parse(r(d + '/_site/version.json', 'utf8')); assert.equal(v.version, 'v0.1.7'); assert.equal(v.commit, 'abcdef1');
  assert.ok(r(d + '/_site/start/index.html', 'utf8').includes('<a class="sws-version"'), 'the chip is on every page');
  { const h = r(d + '/_site/index.html', 'utf8'), i = h.indexOf('class="sws-version"'); assert.ok(h.lastIndexOf('<footer', i) > h.lastIndexOf('</footer>', i), 'the chip sits inside a footer landmark'); }
  assert.ok(r('seed/site-template/.github/ci/axe.mjs', 'utf8').includes("'best-practice'"), 'axe runs the best-practice rules too');
  const local = (f) => { const s = r(f, 'utf8').replace(/ href="https?:[^"]*"/g, ' href="/"'); w(f, s); };
  for (const p of ['index.html', 'start/index.html', 'agents/index.html', 'admin/index.html', 'policy/index.html']) local(d + '/_site/' + p);
  assert.equal(run('.github/ci/quality.mjs', '_site'), 0, 'a fresh site passes the quality checks');
  const home = d + '/_site/index.html'; const ok = r(home, 'utf8');
  w(home, ok.replace('</main>', '<a href="/missing/">x</a></main>')); assert.equal(run('.github/ci/quality.mjs', '_site'), 1, 'a broken internal link fails');
  w(home, ok.replace('</main>', '<p>a \u2014 b</p></main>')); assert.equal(run('.github/ci/quality.mjs', '_site'), 1, 'an em dash fails');
  w(home, ok.replace('<main', '<nav class="family"></nav><main')); assert.equal(run('.github/ci/quality.mjs', '_site'), 1, 'the family strip fails');
  w(home, ok.replace('</main>', '<p>-----BEGIN OPENSSH PRIVATE' + ' KEY-----</p></main>')); assert.equal(run('.github/ci/quality.mjs', '_site'), 1, 'a private key fails');
  w(home, ok); { const pf = d + '/_site/policy/abp.json', pol = r(pf, 'utf8'); { const j = JSON.parse(pol); j.roles.keeper.branches = ['main']; w(pf, JSON.stringify(j)); } assert.equal(run('.github/ci/quality.mjs', '_site'), 1, 'a policy that lets an agent push to main fails'); { const j = JSON.parse(pol); j.roles.keeper.never = j.roles.keeper.never.filter((x) => x !== 'push to main'); w(pf, JSON.stringify(j)); } assert.equal(run('.github/ci/quality.mjs', '_site'), 1, 'a policy that drops a core rule fails'); { const j = JSON.parse(pol); j.pipelines.pages.allowed.push('push to main'); w(pf, JSON.stringify(j)); } assert.equal(run('.github/ci/quality.mjs', '_site'), 1, 'a policy that widens the pipeline fails'); { const j = JSON.parse(pol); j.repository = 'SovereignWebsite/SovereignWebsite/Site__Cv__A'; w(pf, JSON.stringify(j)); } assert.equal(run('.github/ci/quality.mjs', '_site'), 1, 'a doubled SovereignWebsite/ prefix fails'); rmSync(pf); assert.equal(run('.github/ci/quality.mjs', '_site'), 1, 'a site with no policy fails'); w(pf, pol); }
}
// A gated (vault) site runs the same pipeline, but publishes nothing about the private site beyond its holding page.
{
  const g = seedFiles('seed/gate-template');
  for (const must of ['.github/workflows/pages.yml', '.github/ci/build.mjs', '.github/ci/quality.mjs', '.github/ci/share-check.mjs', 'site/assets/share/card-1200x630.jpg']) assert.ok(g.includes(must), `gate-template seeds ${must}`);
  for (const never of ['site/start/index.html', 'site/agents/index.html', 'site/admin/index.html', 'site/llms.txt', 'site/data/agents.json']) assert.ok(!g.includes(never), `gate-template never seeds ${never}`);
  assert.equal(readFileSync('seed/gate-template/.github/workflows/pages.yml', 'utf8').replace("          SWS_GATE: '1'\n", ''), readFileSync('seed/site-template/.github/workflows/pages.yml', 'utf8'), 'one pipeline for both templates (the gate adds only SWS_GATE)');
}
// Agent sites: the same pipeline, plus the key copied from team/keys.json, a daily refresh that makes no new
// version, and the family bar allowed. The version chip's CSS is a file, for a strict style-src 'self'.
{
  const a = readFileSync('seed/agent-template/.github/workflows/pages.yml', 'utf8');
  for (const must of ['team/keys.json', 'site/key.json', "SWS_OWN_SITE: '1'", 'node .github/ci/build.mjs', "if: github.event_name != 'schedule'"]) assert.ok(a.includes(must), `agent pages.yml has ${must}`);
  assert.ok(a.indexOf('site/key.json') < a.indexOf('node .github/ci/build.mjs'), 'the key is written before the build');
  const b = readFileSync('seed/site-template/.github/ci/build.mjs', 'utf8');
  assert.ok(b.includes('/assets/sws-version.css') && !b.includes("'<style>"), 'the chip CSS is a file, not inline');
  for (const t of ['gate-template', 'agent-template']) for (const f of ['build.mjs', 'quality.mjs', 'share-check.mjs', 'axe.mjs']) assert.equal(readFileSync(`seed/${t}/.github/ci/${f}`, 'utf8'), readFileSync(`seed/site-template/.github/ci/${f}`, 'utf8'), `${t} ci/${f} matches the site template`);
}
// The leak scan opens every zip: a sealed vault (manifest plus ciphertext) passes, a plain zip with a key inside
// fails, and a file named .zip that is not a zip fails. family-bar.mjs reaches pages in subfolders.
{
  const { mkdtempSync, mkdirSync, writeFileSync: w, readFileSync: r } = await import('node:fs');
  const { execFileSync } = await import('node:child_process');
  const { tmpdir } = await import('node:os');
  const { randomBytes, crc32 } = await import('node:crypto').then((c) => ({ randomBytes: c.randomBytes })).then(async (o) => ({ ...o, crc32: (await import('node:zlib')).crc32 }));
  const zip = (entries) => { const parts = [], cd = []; let off = 0;
    for (const [name, data] of entries) { const n = Buffer.from(name), h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt32LE(crc32(data), 14); h.writeUInt32LE(data.length, 18); h.writeUInt32LE(data.length, 22); h.writeUInt16LE(n.length, 26);
      const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt32LE(crc32(data), 16); c.writeUInt32LE(data.length, 20); c.writeUInt32LE(data.length, 24); c.writeUInt16LE(n.length, 28); c.writeUInt32LE(off, 42);
      parts.push(h, n, data); cd.push(c, n); off += 30 + n.length + data.length; }
    const cdb = Buffer.concat(cd), e = Buffer.alloc(22); e.writeUInt32LE(0x06054b50, 0); e.writeUInt16LE(entries.length, 8); e.writeUInt16LE(entries.length, 10); e.writeUInt32LE(cdb.length, 12); e.writeUInt32LE(off, 16);
    return Buffer.concat([...parts, cdb, e]); };
  const d = mkdtempSync(tmpdir() + '/zip-'); mkdirSync(d + '/private');
  const q = () => { try { execFileSync('node', ['seed/gate-template/.github/ci/quality.mjs', d], { stdio: 'pipe' }); return 0; } catch (e) { return e.status; } };
  w(d + '/index.html', '<html><body><main>x</main></body></html>');
  mkdirSync(d + '/policy'); w(d + '/policy/index.html', '<html><body><main>p</main></body></html>'); w(d + '/policy/abp.json', r('seed/gate-template/site/policy/abp.json', 'utf8').replace(/{{[a-z]+}}/g, 'x'));
  w(d + '/private/v.zip', zip([['manifest.json', Buffer.from('{"v":1}')], ['objects/ab', randomBytes(4096)]]));
  assert.equal(q(), 0, 'a sealed vault (ciphertext entries) passes the leak scan');
  w(d + '/private/v.zip', zip([['notes.txt', Buffer.from('-----BEGIN OPENSSH PRIVATE' + ' KEY-----')]]));
  assert.equal(q(), 1, 'a plain zip with a key inside fails');
  w(d + '/private/v.zip', randomBytes(2048));
  assert.equal(q(), 1, 'a .zip that is not a readable zip fails');
  w(d + '/private/v.zip', zip([['manifest.json', Buffer.from('{"v":1}')], ['objects/cd', Buffer.from('Dear Sam, a private letter. '.repeat(100))]]));
  assert.equal(q(), 1, 'a vault entry that is plaintext, not ciphertext, fails on a gated site');
  w(d + '/private/v.zip', zip([['manifest.json', Buffer.from('{"v":1}')], ['objects/ab', randomBytes(4096)]]));
  w(d + '/data.bin', zip([['k.txt', Buffer.from('-----BEGIN RSA PRIVATE' + ' KEY-----')]]));
  assert.equal(q(), 1, 'a zip under another name is found by its content and opened');
  w(d + '/data.bin', Buffer.from('x')); w(d + '/k.js', 'const k = "sgit_' + 'vk1_' + 'abcd1234efgh5678";');
  assert.equal(q(), 1, 'an sgit vault key in a page or script fails');
  w(d + '/k.js', 'const k = "abcdefgh1234ijkl5678mnop' + ':' + 'qrst9876";');
  assert.equal(q(), 1, 'a bare sgit vault key (passphrase:vault_id) fails');
  w(d + '/k.js', 'const t = "ey' + 'JhbGciOiJIUzI1NiJ9.ey' + 'JzdWIiOiIxMjM0NTYifQ.abcdefghijklmnop";');
  assert.equal(q(), 1, 'a JSON Web Token fails');
  w(d + '/k.js', 'const ok = "sha256:01baa0ccc31e0120";');
  assert.equal(q(), 0, 'a fingerprint is not a vault key');
  w(d + '/elsewhere.zip', zip([['manifest.json', Buffer.from('{}')], ['objects/x', Buffer.from('plain words here. '.repeat(100))]]));
  assert.equal(q(), 1, 'a vault outside private/ is held to ciphertext too');
  w(d + '/elsewhere.zip', zip([['manifest.json', Buffer.from('{}')], ['objects/x', randomBytes(2048)]]));
  const big = Buffer.alloc(9 * 1024 * 1024, 0x61); Buffer.from('-----BEGIN EC PRIVATE' + ' KEY-----').copy(big, 4 * 1024 * 1024 - 10);
  w(d + '/data.bin', big);
  assert.equal(q(), 1, 'a file over 5 MB is scanned, across its piece boundaries');
  const s = mkdtempSync(tmpdir() + '/fam2-'); mkdirSync(s + '/designs');
  for (const p of ['index.html', 'designs/a.html']) w(s + '/' + p, '<html><body><main>x</main><footer>f</footer></body></html>');
  execFileSync('node', ['build/family-bar.mjs', s, '--credit']);
  assert.ok(r(s + '/designs/a.html', 'utf8').includes('class="family-credit"'), 'family-bar.mjs reaches designs/*.html');
}
{ const t = readFileSync('seed/site-template/.github/ci/quality.mjs', 'utf8'), l = readFileSync('build/leak-scan.mjs', 'utf8');
  for (const m of l.matchAll(/^\s+\['[^']+', (\/.*\/[a-z]*)\],$/gm)) assert.ok(t.includes(m[1]), `the site leak scan has the Factory shape ${m[1].slice(0, 30)}`); }
{ const R = await import('../build/requests.mjs'); const st = { label: 'sgit', group: 'startups', title: 'sgit', description: 'A brochure.', kind: 'demo' }; assert.equal(R.repoName(st), 'Site__Startups__Sgit'); assert.equal(R.host(st), 'sgit.startups.sovereignweb.site'); }
{ const R = await import('../build/requests.mjs'); const pv = { label: 'mistral', group: 'provider', title: 'Mistral', description: 'A demo.', kind: 'demo' }; assert.equal(R.repoName(pv), 'Site__Provider__Mistral'); assert.equal(R.host(pv), 'mistral.provider.sovereignweb.site'); }
// Every site has a group (demo for demos), with the NO_GROUP exceptions; a capitalised ungrouped repository is renamed.
{ const R = await import('../build/requests.mjs'); const F = new Set(['2026-11-20__x']);
  assert.ok(R.validate({ label: 'x', title: 'X', description: 'Y.', kind: 'demo' }, '2026-11-20__x', F).some((e) => e.includes('needs a group')), 'a site with no group is refused');
  const d = { label: 'pipeline-demo', group: 'demo', title: 'P', description: 'D.', kind: 'demo', previous: ['pipeline-demo.sovereignwebsite.site', 'pipeline-demo.sovereignweb.site'] };
  assert.equal(R.repoName(d), 'Site__Demo__Pipeline-Demo'); assert.equal(R.host(d), 'pipeline-demo.demo.sovereignweb.site');
  const rs = R.repos([d]); assert.ok(rs[0].aka.includes('Site__Pipeline-Demo'), 'the ungrouped capitalised name is an aka');
  assert.deepEqual(rs.slice(1).map((x) => x.cname), d.previous, 'both old addresses keep a redirect');
  assert.ok(rs[1].aka.includes('Redirect__Pipeline-Demo'), 'the existing redirect repository is renamed, not made again'); }
// liveRepos reads each repository's own record, so the merge settings the list endpoint leaves out are compared
// against real values and not applied again on every run.
{ const src = readFileSync('build/org-plan.mjs', 'utf8');
  assert.ok(/gh\('GET', `\/repos\/\$\{org\}\/\$\{listed\.name\}`\)/.test(src), "liveRepos fetches each repository's full record");
  const want = { ...org.defaults, name: 'R', description: 'd' }; const have = { ...org.defaults, description: 'd', default_branch: 'dev', has_dev: true, teams: { 'sovereignwebsite-agents-ci': 'push' }, protected: true };
  assert.ok(!plan({ ...org, repos: [want] }, { R: have }).actions.some((a) => a.action === 'repo.update_settings'), 'settings that match are not applied again'); }
{ const S = await import('../build/check-signatures.mjs'); assert.equal(S.usable({ status: 'active' }), true); assert.equal(S.usable({}), true); assert.equal(S.usable({ status: 'retired', retired: '2026-11-21' }), false); assert.equal(S.usable({ status: 'superseded' }), false); }
{ const R = await import('../build/requests.mjs'); const t = { label: 'south-beacon', group: 'talent', title: 'South Beacon', description: 'A profile.', kind: 'owner' }; assert.equal(R.repoName(t), 'Site__Talent__South-Beacon'); assert.equal(R.host(t), 'south-beacon.talent.sovereignweb.site'); }
{ const g = readFileSync('seed/gate-template/site/policy/abp.json', 'utf8') + readFileSync('seed/gate-template/site/policy/index.html', 'utf8'); const gp = JSON.parse(readFileSync('seed/gate-template/site/policy/abp.json', 'utf8')); assert.ok(!g.includes('{{repo}}') && !('site' in gp) && !('repository' in gp), 'a gated site\'s policy names neither its repository nor its address'); }
{ const { fill } = await import('../build/fill.mjs'); assert.equal(JSON.parse(fill('{"t":"{{title}}"}', { title: 'A "B" & <C>' }, 'x.json')).t, 'A "B" & <C>', 'JSON values are exact'); assert.equal(fill('<p>{{title}}</p>', { title: 'A & B' }, 'x.html'), '<p>A &amp; B</p>', 'HTML values are escaped'); }
{ const { readdirSync: ls } = await import('node:fs'); for (const t of ls('seed').filter((x) => /-template$|^SovereignWebsite__/.test(x))) { const f = `seed/${t}/site/policy/index.html`; let h; try { h = readFileSync(f, 'utf8'); } catch { continue; } assert.ok(!/<style|\sstyle=/.test(h) && h.includes('href="/policy/policy.css"'), `${f}: no inline style, so a strict CSP site can carry it`); readFileSync(`seed/${t}/site/policy/policy.css`, 'utf8'); } }
{ const X = await import('../build/external-collaborators.mjs'); const list = X.loadList(); const g = list.grants[0];
  assert.deepEqual(X.validateList(list), [], 'external collaborators list is well formed'); assert.deepEqual(checkActions(p, X.allActions(list)), [], 'every external grant is in the policy');
  const act = (x) => checkActions(p, { pipeline: X.PIPELINE, actions: [{ action: 'repo.add_collaborator', target: g.repository, user: g.user, permission: 'push', ...x }] });
  assert.equal(act({ permission: 'admin' }).length, 1, 'admin refused'); assert.equal(act({ permission: 'maintain' }).length, 1, 'maintain refused');
  assert.equal(act({ user: 'someone-else' }).length, 1, 'an unlisted login refused'); assert.equal(act({ target: 'PrompTugal/Other' }).length, 1, 'an unlisted repository refused');
  assert.equal(checkActions(p, { pipeline: X.PIPELINE, actions: [{ action: 'repo.remove_collaborator', target: g.repository, user: g.user }] }).length, 1, 'removal refused');
  assert.ok(X.validateList({ grants: [{ ...g, repository: 'SovereignWebsite/Site__X' }] }).length, 'a SovereignWebsite repository uses its request');
  assert.ok(X.validateList({ grants: [{ ...g, permission: 'admin' }] }).length && X.validateList({ grants: [{ ...g, source: '' }] }).length, 'push only, with a source');
  const wf = readFileSync('.github/workflows/org-apply.yml', 'utf8'); const owners = [...new Set(list.grants.map((x) => x.repository.split('/')[0]))];
  for (const o of owners) assert.ok(wf.includes(`owner: ${o}`) && wf.includes(`external-collaborators.mjs apply ${o}`), `Org apply mints a token and applies for ${o}`); }
{ const { spawnSync } = await import('node:child_process'); const { mkdtempSync } = await import('node:fs'); const { tmpdir } = await import('node:os'); const T = await import('../build/transfer-plan.mjs'); const { load: loadReq } = await import('../build/requests.mjs');
  const todo = T.pending(loadReq('requests').requests); for (const r of todo) assert.deepEqual(checkActions(p, T.planFor(r)), [], `the move ${r.folder} is allowed by the policy`);
  const out = `${mkdtempSync(`${tmpdir()}/tp-`)}/plan.json`, run = spawnSync(process.execPath, ['build/transfer-plan.mjs', out], { encoding: 'utf8' });
  assert.equal(run.status, 0, `the dry move plan passes: ${run.stderr}`); const tp = JSON.parse(readFileSync(out, 'utf8'));
  assert.ok(tp.actions.length <= 1, 'one move per run'); if (todo.length > 1) assert.equal(tp.actions.length, 0, 'several pending and none named: nothing moves'); }
// End to end: an agent publishes its own key and is verified against it; a key for another name, or a second live key, is not.
{ const { execFileSync: x } = await import('node:child_process'); const fs = await import('node:fs'); const { tmpdir } = await import('node:os');
  const { checkSignatures } = await import('../build/check-signatures.mjs'); const { checkPaths } = await import('../build/abp.mjs');
  const d = fs.mkdtempSync(`${tmpdir()}/keys-`), r = `${d}/r`, git = (...a) => x('git', ['-C', r, '-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'gpg.format=ssh', '-c', 'gpg.ssh.program=ssh-keygen', ...a], { encoding: 'utf8' }).trim();
  const key = (n) => { x('ssh-keygen', ['-q', '-t', 'ecdsa', '-b', '256', '-N', '', '-f', `${d}/${n}`]); return { id: n, agent: `${n}@X.y`, status: 'active', session: `https://claude.ai/code/session_${n}`, bundle: { sign: x('ssh-keygen', ['-e', '-m', 'PKCS8', '-f', `${d}/${n}.pub`], { encoding: 'utf8' }) } }; };
  const [A, B, C] = ['a', 'b', 'c'].map(key); fs.mkdirSync(`${r}/build`, { recursive: true }); fs.mkdirSync(`${r}/team`); x('git', ['init', '-q', r]);
  for (const f of ['check-signatures.mjs', 'abp.mjs']) fs.copyFileSync(`build/${f}`, `${r}/build/${f}`);
  const keys = (ks) => { fs.writeFileSync(`${r}/team/keys.json`, JSON.stringify({ keys: ks }, null, 1)); git('add', '-A'); };
  keys([A]); git('-c', 'commit.gpgsign=false', 'commit', '-q', '-m', 'init'); const init = git('rev-parse', 'HEAD');
  const commit = (signer, agent, msg) => git('-c', `user.signingkey=${d}/${signer}`, 'commit', '-q', '-S', '-m', msg, '-m', `Agent: ${agent}@X.y\nClaude-Session: https://claude.ai/code/session_${agent}`);
  keys([A, B]); commit('b', 'b', 'b publishes its key'); const good = git('rev-parse', 'HEAD');
  assert.deepEqual(checkSignatures({ cwd: r, before: init }).errors, [], 'a commit that publishes its own key verifies against it');
  assert.deepEqual(checkPaths({ version: 1, agents: {} }, { base: init, head: good, cwd: r }).errors, [], 'publishing its own key needs no policy entry');
  keys([A, B, { ...C, agent: 'z@X.y', id: 'z' }]); commit('c', 'c', 'c adds a key named z');
  assert.equal(checkSignatures({ cwd: r, before: good }).errors.length, 1, 'a key for another name does not verify'); git('reset', '-q', '--hard', good);
  keys([A, B, { ...C, agent: 'b@X.y', id: 'b2', session: B.session }]); commit('c', 'b', 'a second live key for b');
  assert.equal(checkSignatures({ cwd: r, before: good }).errors.length, 1, 'a second live key under one name does not verify'); git('reset', '-q', '--hard', good);
  keys([A, B, C]); fs.writeFileSync(`${r}/other.txt`, 'x'); git('add', '-A'); commit('c', 'c', 'c publishes and changes another file');
  assert.equal(checkPaths({ version: 1, agents: {} }, { base: good, cwd: r }).errors.length, 1, 'a key plus any other file still needs a policy entry');
  fs.rmSync(d, { recursive: true, force: true }); }
{ const R = await import('../build/requests.mjs'); for (const g of [...R.GROUPS, ...R.LEGACY_GROUPS]) assert.ok(R.GROUP_NAMES[g], `group ${g} has its capitalised name (else Site__undefined__...)`); }
// The signer check seeded into every site (incident 2026-11-22__pushed-before-key-published).
{ const fs = await import('node:fs'); const { execFileSync: x } = await import('node:child_process'); const { tmpdir } = await import('node:os');
  const seeds = ['site-template', 'gate-template', 'agent-template', 'redirect-template', 'SovereignWebsite__Website', 'SovereignWebsite__Org', 'SovereignWebsite__Site', 'SovereignWebsite__Hub', 'SovereignWebsite__Vault'];
  const one = readFileSync('seed/site-template/.github/ci/signers.mjs', 'utf8');
  for (const t of seeds) { assert.equal(readFileSync(`seed/${t}/.github/ci/signers.mjs`, 'utf8'), one, `${t} carries the same signer check`); assert.ok(readFileSync(`seed/${t}/.github/workflows/signers.yml`, 'utf8').includes('node .github/ci/signers.mjs "$BEFORE" "$AFTER"'), `${t} runs it on every push`); }
  for (const t of ['site-template', 'gate-template', 'agent-template']) { const y = readFileSync(`seed/${t}/.github/workflows/pages.yml`, 'utf8'); assert.ok(y.indexOf('signers.mjs') > 0 && y.indexOf('signers.mjs') < y.indexOf('.github/ci/build.mjs'), `${t}: the signer check runs before the build, so a refused commit is not deployed`); }
  const { checkSigners } = await import('../seed/site-template/.github/ci/signers.mjs');
  const d = fs.mkdtempSync(`${tmpdir()}/signers-`), r = `${d}/r`, git = (...a) => x('git', ['-C', r, '-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'gpg.format=ssh', '-c', 'gpg.ssh.program=ssh-keygen', ...a], { encoding: 'utf8' }).trim();
  const key = (n) => { x('ssh-keygen', ['-q', '-t', 'ecdsa', '-b', '256', '-N', '', '-f', `${d}/${n}`]); return { agent: `${n}@X.y`, status: 'active', session: `https://claude.ai/code/session_${n}`, bundle: { sign: x('ssh-keygen', ['-e', '-m', 'PKCS8', '-f', `${d}/${n}.pub`], { encoding: 'utf8' }) } }; };
  const A = key('a'); key('b'); x('git', ['init', '-q', r]); fs.writeFileSync(`${r}/f`, '0'); git('add', '-A'); git('-c', 'commit.gpgsign=false', 'commit', '-q', '-m', 'init'); const base = git('rev-parse', 'HEAD');
  const c = (signer, msg, agent) => { fs.writeFileSync(`${r}/f`, msg); git('add', '-A'); git(...(signer ? ['-c', `user.signingkey=${d}/${signer}`] : ['-c', 'commit.gpgsign=false']), 'commit', '-q', ...(signer ? ['-S'] : []), '-m', msg, ...(agent ? ['-m', `Agent: ${agent}@X.y\nClaude-Session: https://claude.ai/code/session_${agent}`] : [])); return git('rev-parse', 'HEAD'); };
  const good = c('a', 'by a, published', 'a'), early = c('b', 'by b, key not published', 'b'), person = c(null, 'an owner edits on GitHub'), anon = c(null, 'unsigned, no trailer'), ov = c('b', 'by b\n\nOwner override: "make this live", the owner\'s session', 'b');
  const res = await checkSigners({ cwd: r, before: base, after: ov, keys: [A], personVerified: async (sha) => ({ verified: sha === person, login: 'owner', type: 'User' }) });
  // No Agent: trailer: only a GitHub User or the Factory's App, never Claude's shared "claude" login (kate-curtis-evans.b).
  { const S = await import('../seed/site-template/.github/ci/signers.mjs');
    const only = async (p) => (await checkSigners({ cwd: r, before: `${person}^`, after: person, keys: [A], personVerified: async () => p })).refused.length;
    assert.equal(await only({ verified: true, login: 'claude', type: 'User' }), 1, 'no trailer, verified as the shared "claude" login: refused');
    assert.equal(await only({ verified: true, login: 'some-app[bot]', type: 'Bot' }), 1, 'no trailer, verified as another bot: refused');
    assert.equal(await only({ verified: true, login: 'owner', type: 'Organization' }), 1, 'no trailer, verified as a non-User account: refused');
    assert.equal(await only({ verified: true, login: S.FACTORY_BOT, type: 'Bot' }), 0, 'the Factory\'s own App (Org apply seeding) passes');
    assert.equal(await only({ verified: true, login: 'owner', type: 'User' }), 0, 'an owner editing on GitHub passes'); }
  assert.equal(res.checked, 5); assert.deepEqual(res.ok.map((s) => s.slice(0, 7)), [good.slice(0, 7)], 'a published key passes');
  assert.deepEqual(res.refused.map((s) => s.slice(0, 7)).sort(), [early.slice(0, 7), anon.slice(0, 7)].sort(), 'an unpublished key and an unverified commit are refused');
  assert.equal(res.people.length, 1, "a person's verified commit is listed"); assert.equal(res.overrides.length, 1, 'an owner override is listed, not refused');
  assert.equal((await checkSigners({ cwd: r, before: 'f'.repeat(40), after: good, keys: [A], personVerified: async () => null })).checked, 1, 'an unknown old head (a force push) checks only the new head');
  { fs.mkdirSync(`${r}/.github/ci`, { recursive: true }); fs.writeFileSync(`${r}/.github/ci/people.json`, JSON.stringify({ people: ['Owner'] })); git('add', '-A'); git('-c', 'commit.gpgsign=false', 'commit', '-q', '-m', 'the site names its owner');
    const head0 = git('rev-parse', 'HEAD'); const own = c(null, 'the owner\'s own Claude, under the owner\'s account', 'claude');
    const as = (login, type = 'User') => async (sha) => ({ verified: sha === own, login, type });
    const r2 = await checkSigners({ cwd: r, before: head0, after: own, keys: [A], personVerified: as('owner') });
    assert.deepEqual(r2.refused, [], 'an Agent: commit with no published key that GitHub verifies is the owner\'s commit');
    assert.equal(r2.people.length, 1, 'and it is listed as a person\'s commit');
    const r3 = await checkSigners({ cwd: r, before: head0, after: own, keys: [A], personVerified: async () => ({ verified: false }) });
    assert.equal(r3.refused.length, 1, 'unverified and unpublished is still refused'); git('reset', '-q', '--hard', head0);
    assert.ok(r2.people[0].includes('by owner') && !r2.ok.length, 'listed as the person\'s commit, never as the agent\'s');
    for (const [login, type, why] of [['claude', 'User', 'Claude\'s shared signer'], ['someone-else', 'User', 'a person the site does not name'], ['owner', 'Bot', 'an account GitHub does not call a User'], ['owner', null, 'an author with no GitHub account'], ['dependabot[bot]', 'User', 'a bot']])
      assert.equal((await checkSigners({ cwd: r, before: head0, after: own, keys: [A], personVerified: as(login, type) })).refused.length, 1, `GitHub verified as ${why}: refused (kate-curtis-evans.b, block-05)`);
    git('reset', '-q', '--hard', head0);
    const posing = c('b', 'signed with another key, names a team agent with a published key', 'a');
    const r4 = await checkSigners({ cwd: r, before: head0, after: posing, keys: [A], personVerified: async () => ({ verified: true, login: 'owner', type: 'User' }) });
    assert.equal(r4.refused.length, 1, 'a name with a published key still needs that key, GitHub verified or not (emily.b, security.b, block-05)'); git('reset', '-q', '--hard', head0); }
  // Keys the site publishes itself, one file per agent at site/keys/<name>.json (Dinis, 23 Nov 2026, record 2026-11-23__asks-2-8-31-revised).
  const G = key('g'), H = key('h'), none = async () => null, run = (b, a) => checkSigners({ cwd: r, before: b, after: a, keys: [A], personVerified: none });
  const put = (files, signer, agent, extra) => { fs.mkdirSync(`${r}/site/keys`, { recursive: true }); for (const [n, k] of Object.entries(files)) fs.writeFileSync(`${r}/site/keys/${n}.json`, JSON.stringify(k)); if (extra) fs.writeFileSync(`${r}/f`, extra); git('add', '-A'); git('-c', `user.signingkey=${d}/${signer}`, 'commit', '-q', '-S', '-m', 'keys', '-m', `Agent: ${agent}@X.y\nClaude-Session: https://claude.ai/code/session_${agent}`); return git('rev-parse', 'HEAD'); };
  const top = git('rev-parse', 'HEAD');
  const pub = put({ g: G }, 'g', 'g');
  assert.deepEqual((await run(top, pub)).refused, [], 'an agent publishes its own key in the site (site/keys/g.json), signed by that key');
  const byG = c('g', 'by g, key in the site', 'g');
  assert.deepEqual((await run(pub, byG)).refused, [], 'a later commit by that key passes');
  git('reset', '-q', '--hard', top);
  const sneak = put({ g: G }, 'g', 'g', 'and another change');
  assert.equal((await run(top, sneak)).refused.length, 1, 'a key added together with any other change does not vouch for itself');
  git('reset', '-q', '--hard', pub);
  const other = put({ h: H }, 'g', 'h');
  assert.equal((await run(pub, other)).refused.length, 1, 'an agent cannot publish a key for someone else and sign as them');
  git('reset', '-q', '--hard', pub);
  const misfiled = put({ x: H }, 'h', 'h');
  assert.equal((await run(pub, misfiled)).refused.length, 1, 'a key whose file name is not its agent does not count');
  git('reset', '-q', '--hard', pub);
  const swap = put({ g: { ...G, bundle: H.bundle } }, 'h', 'g');
  assert.equal((await run(pub, swap)).refused.length, 1, 'changing an existing key file is not a self-publication');
  git('reset', '-q', '--hard', top);
  const claim = put({ a: { ...G, agent: 'a@X.y', session: A.session } }, 'g', 'a');
  assert.equal((await run(top, claim)).refused.length, 1, 'a site cannot claim a Factory agent\'s name with another key (security.b, review 029)');
  git('reset', '-q', '--hard', top);
  const same = put({ a: A }, 'a', 'a');
  assert.deepEqual((await run(top, same)).refused, [], 'publishing the same key the Factory lists for that agent is fine');
  fs.rmSync(d, { recursive: true, force: true }); }
// Key requests: roles, signatures, a security and a counsel review each bound to the exact request (build/key-requests.mjs).
{ const fs = await import('node:fs'); const { execFileSync: x } = await import('node:child_process'); const { tmpdir } = await import('node:os');
  const K = await import('../build/key-requests.mjs'); const lim = p.pipelines['key-apply'].limits;
  assert.deepEqual(lim.requester_roles, ['factory']); assert.deepEqual(lim.reviews, ['security', 'counsel']); assert.ok(p.pipelines['key-apply'].refused_always.includes('repo.remove_key'));
  const d = fs.mkdtempSync(`${tmpdir()}/keyreq-`), r = `${d}/r`, git = (...a) => x('git', ['-C', r, '-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'gpg.format=ssh', '-c', 'gpg.ssh.program=ssh-keygen', ...a], { encoding: 'utf8' }).trim();
  const key = (n) => { x('ssh-keygen', ['-q', '-t', 'ecdsa', '-b', '256', '-N', '', '-f', `${d}/${n}`]); return { id: n, agent: `${n}@X.y`, status: 'active', session: `https://claude.ai/code/session_${n.replace(/\W/g, '')}`, bundle: { sign: x('ssh-keygen', ['-e', '-m', 'PKCS8', '-f', `${d}/${n}.pub`], { encoding: 'utf8' }) } }; };
  const keys = ['factory.d', 'security.d', 'counsel.d', 'security.e', 'factory.e'].map(key), N = key('data.d');
  fs.mkdirSync(`${r}/build`, { recursive: true }); fs.mkdirSync(`${r}/team`); x('git', ['init', '-q', r]);
  for (const f of ['check-signatures.mjs', 'abp.mjs']) fs.copyFileSync(`build/${f}`, `${r}/build/${f}`);
  fs.writeFileSync(`${r}/team/keys.json`, JSON.stringify({ keys })); git('add', '-A'); git('-c', 'commit.gpgsign=false', 'commit', '-q', '-m', 'init');
  const commit = (who, msg) => { git('add', '-A'); git('-c', `user.signingkey=${d}/${who}`, 'commit', '-q', '-S', '-m', msg, '-m', `Agent: ${who}@X.y\nClaude-Session: https://claude.ai/code/session_${who.replace(/\W/g, '')}`); return git('rev-parse', 'HEAD'); };
  const pol = { pipelines: { 'key-apply': { limits: lim } } }, R = { folder: '2026-11-22__data-d', dir: `${r}/keys/2026-11-22__data-d` }, chk = () => K.checkRequest({ cwd: r, r: R, policy: pol });
  const req = { agent: 'data.d@PrompTugal.dinis', account: 'D', session: 'https://claude.ai/code/session_abc', bundle: { sign: N.bundle.sign }, targets: ['PrompTugal/PrompTugal__News__Data'], source: 'test' };
  fs.mkdirSync(R.dir, { recursive: true }); fs.writeFileSync(`${R.dir}/request.json`, JSON.stringify(req)); let rc = commit('factory.d', 'request');
  assert.deepEqual(chk().errors, []); assert.equal(chk().ready, false, 'no reviews: not ready');
  const review = (role, who, o = {}) => { fs.writeFileSync(`${R.dir}/review.${role}.json`, JSON.stringify({ reviewer: `${who}@X.y`, verdict: 'pass', request_commit: rc, checks: ['key parses'], actions: ['none'], ...o })); return commit(who, `${role} review`); };
  review('security', 'security.d'); assert.equal(chk().ready, false, 'security alone is not enough');
  review('counsel', 'counsel.d', { actions: ['asked data.d to confirm the licence of its notes'] }); let c = chk(); assert.deepEqual(c.errors, []); assert.equal(c.ready, true, 'security and counsel both pass: ready');
  assert.ok(K.reviewReport(c).some((l) => l.startsWith('counsel') && l.includes('asked data.d')), 'the run reports each review and its actions');
  review('counsel', 'counsel.d', { verdict: 'needs-a-person' }); assert.equal(chk().ready, false, 'needs-a-person stops it');
  review('counsel', 'security.e'); assert.ok(chk().errors.some((e) => e.includes('only the counsel role')), 'a counsel review by another role is refused');
  review('counsel', 'counsel.d', { reviewer: 'other.d@X.y' }); assert.ok(chk().errors.some((e) => e.includes('but was committed by')), 'a review must be committed by the reviewer it names');
  review('counsel', 'counsel.d', { actions: undefined }); assert.ok(chk().errors.some((e) => e.includes('actions')), 'a review must report its actions');
  review('counsel', 'counsel.d'); fs.writeFileSync(`${R.dir}/request.json`, JSON.stringify({ ...req, account: 'B' })); commit('factory.d', 'request changed after review');
  assert.ok(chk().errors.some((e) => e.includes('review it again')), 'a request changed after its reviews needs new reviews');
  assert.ok(K.validateRequest({ ...req, targets: ['Evil/Repo'] }, R.folder, lim).some((e) => e.includes('not on the policy')), 'an unlisted target is refused');
  assert.ok(K.validateRequest({ ...req, bundle: { sign: 'nope' } }, R.folder, lim).length, 'a key that does not parse is refused');
  assert.ok(K.validateRequest({ ...req, note: ['-----BEGIN', 'PRIVATE', 'KEY-----'].join(' ') }, R.folder, lim).some((e) => e.includes('private key')), 'a private key is refused');
  const a = K.addEntry({ keys: [keys[0]] }, req, R.folder); assert.equal(a.next.keys.length, 2); assert.equal(a.entry.agent, req.agent); assert.ok(K.addEntry(a.next, req, R.folder).skip, 'a live key under that name is not added twice');
  fs.rmSync(d, { recursive: true, force: true }); }
{ const { glob } = await import('../build/abp.mjs'); for (const [a, role] of [['security.d@SovereignWebsite.dinis', 'security'], ['counsel.d@SovereignWebsite.dinis', 'counsel']]) { const m = p.agents[a].may_change; assert.deepEqual(m, [`keys/**/review.${role}.json`], `${a} writes only its own reviews`); assert.ok(!m.some((g) => glob(g, 'keys/2026-11-22__x/request.json')), `${a} cannot change a request`); } }
{ const R = await import('../build/requests.mjs'); const pb = { label: 'pybot', group: 'tool', provider: 'huggingface', title: 'PyBot', description: 'x', kind: 'owner' };
  assert.equal(R.host(pb), 'pybot.huggingface.tool.sovereignweb.site', '<service>.<provider>.tool'); assert.equal(R.repoName(pb), 'Site__Tool__Huggingface__Pybot'); assert.deepEqual(R.validate(pb, '2026-11-22__pybot'), []);
  assert.ok(R.validate({ ...pb, group: 'artist' }, '2026-11-22__pybot').some((e) => e.includes('provider')), 'provider is for tool sites only');
  assert.ok(R.validate({ ...pb, provider: 'Hugging Face' }, '2026-11-22__pybot').some((e) => e.includes('provider')), 'provider is a lower-case name');
  assert.equal(R.host({ label: 'whois', group: 'tool' }), 'whois.tool.sovereignweb.site', 'a tool with no provider is unchanged'); }
{ const { mkdtempSync, cpSync } = await import('node:fs'); const { execFileSync } = await import('node:child_process'); const { tmpdir } = await import('node:os');
  assert.ok(readFileSync('seed/gate-template/.github/workflows/pages.yml', 'utf8').includes("SWS_GATE: '1'"), 'the gate pipeline sets SWS_GATE');
  const d = mkdtempSync(tmpdir() + '/gate-'); cpSync('seed/gate-template', d, { recursive: true });
  execFileSync('node', ['.github/ci/build.mjs'], { cwd: d, stdio: 'pipe', env: { ...process.env, SWS_GATE: '1', GITHUB_RUN_ID: '42', GITHUB_SERVER_URL: 'https://github.com', GITHUB_REPOSITORY: 'SovereignWebsite/Site__Invest__Secret-Name' } });
  const all = readFileSync(d + '/_site/version.json', 'utf8') + readFileSync(d + '/_site/index.html', 'utf8');
  assert.ok(!all.includes('Secret-Name') && all.includes('href="/version.json"'), 'a gated site publishes no run link and no repository name'); }
{ const R = await import('../build/requests.mjs'); const h = { label: 'presentations', title: 'P', description: 'x', kind: 'demo' }; assert.deepEqual(R.validate(h, '2026-11-23__presentations'), [], 'the presentations home needs no group'); assert.equal(R.repoName(h), 'Site__Presentations'); assert.equal(R.host(h), 'presentations.sovereignweb.site'); const p = { label: 'ana', group: 'presentations', title: 'A', description: 'x', kind: 'owner' }; assert.equal(R.repoName(p), 'Site__Presentations__Ana'); assert.equal(R.host(p), 'ana.presentations.sovereignweb.site'); }
{ const R = await import('../build/requests.mjs'); const { mkdtempSync, mkdirSync, writeFileSync: w } = await import('node:fs'); const { tmpdir } = await import('node:os');
  const d = mkdtempSync(tmpdir() + '/req-'); const put = (f, j) => { mkdirSync(`${d}/${f}`); w(`${d}/${f}/site.json`, JSON.stringify(j)); };
  put('2026-11-21__ana', { label: 'ana', group: 'cv', title: 'A', description: 'x', kind: 'owner' });
  put('2026-11-23__ana', { label: 'ana', group: 'presentations', title: 'A', description: 'x', kind: 'owner' });
  let L = R.load(d); assert.deepEqual(L.errors, [], 'one label in two groups is allowed');
  const rs = R.repos(L.requests); assert.deepEqual(rs.map((x) => x.name).sort(), ['Site__CV__Ana', 'Site__Presentations__Ana']);
  assert.ok(rs.every((x) => !(x.aka || []).some((a) => /^Site__ana$|^Site__Ana$/.test(a))), 'a shared label claims no bare old name');
  put('2026-11-24__ana', { label: 'ana', group: 'cv', title: 'A', description: 'x', kind: 'owner' });
  L = R.load(d); assert.ok(L.errors.some((e) => e.includes('a.cv.sovereignweb.site') || e.includes('ana.cv.sovereignweb.site')), 'the same label in the same group is refused');
  const one = R.repos([{ label: 'bo', group: 'cv', title: 'B', description: 'x', kind: 'owner' }]); assert.ok(one[0].aka.includes('Site__Bo'), 'a label used once keeps its bare old name'); }
{ const { readdirSync: ls } = await import('node:fs'); const R = '@media (max-width:599px)';
  for (const t of ['site', 'gate', 'agent']) assert.ok(readFileSync(`seed/${t}-template/.github/ci/build.mjs`, 'utf8').includes(`${R}{.sws-version{font-size:15px}}`), `${t}: the version chip is 15px on a phone (design.b)`);
  for (const f of ['seed/site-template/site/index.html', 'seed/agent-template/site/index.html', 'seed/site-template/site/policy/policy.css', 'seed/shared/family-credit.css']) assert.ok(readFileSync(f, 'utf8').includes(`${R}{footer,.family-credit,.family,.site-links{font-size:15px}}`), `${f}: footer chrome is 15px on a phone`); }
{ const C = await import('../build/coverage.mjs');
  const c = C.coverage(['a.x.site', 'b.x.site', 'c.x.site'], { sites: { 'a.x.site': {}, 'c.x.site': {} } }, { sites: [{ address: { url: 'https://a.x.site/' } }, { address: {} }] });
  assert.deepEqual(c, { notRated: ['b.x.site'], notOnHub: ['b.x.site', 'c.x.site'] }, 'coverage lists the sites the design ratings and the hub miss'); }
{ const R = await import('../build/requests.mjs'); const C = await import('../build/coverage.mjs');
  const h = { label: 'ana', group: 'cv', title: 'A', description: 'x', kind: 'owner' };
  assert.deepEqual(R.validate({ ...h, design_brief: 'https://design.agents.sovereignweb.site/briefs/ana.html' }, '2026-11-24__ana'), [], 'a design brief link on design.agents passes');
  assert.deepEqual(R.validate({ ...h, design_brief: 'https://github.com/SovereignWebsite/Site__Agents__Design/blob/dev/docs/briefs/ana.md' }, '2026-11-24__ana'), [], 'a brief in design.b\'s docs/briefs passes');
  assert.ok(R.validate({ ...h, design_brief: 'https://example.org/brief' }, '2026-11-24__ana').length, 'a brief elsewhere is refused');
  assert.deepEqual(C.noBrief([{ ...h, folder: '2026-11-24__ana' }, { ...h, folder: '2026-11-20__old' }, { ...h, folder: '2026-11-24__b', design_brief: 'https://design.agents.sovereignweb.site/x' }, { ...h, group: 'agents', folder: '2026-11-24__c' }, { ...h, access: 'vault', folder: '2026-11-24__d' }]), ['2026-11-24__ana'], 'Org status lists only new, unbriefed, public, non-agent requests'); }
{ const { KNOWN } = await import('../build/check-signatures.mjs');
  assert.deepEqual(Object.keys(KNOWN).sort(), ['5eb7fdecd2ac785ee071848a474c6cbff5e1a389', 'b7c8bfd79c263051d8e9ec35fe2cf70b59bf6e87'], 'the known failing commits are exactly the two named ones; only Dinis adds one');
  for (const [sha, why] of Object.entries(KNOWN)) assert.ok(/^[0-9a-f]{40}$/.test(sha) && why.length > 20, `${sha.slice(0, 7)} is a full id with its reason`); }
// Managed seed files (build/managed.mjs): refreshed only from an earlier seeded version, never over a keeper's change.
{ const M = await import('../build/managed.mjs'); const fs = await import('node:fs');
  const f = '.github/ci/signers.mjs', cur = M.blobSha(fs.readFileSync(`seed/site-template/${f}`)), hist = M.history();
  for (const d of fs.readdirSync('seed').filter((x) => fs.existsSync(`seed/${x}/${f}`))) assert.ok(hist[f].includes(M.blobSha(fs.readFileSync(`seed/${d}/${f}`))), `seed/${d}: the current ${f} is in seed/managed-history.json (run node build/managed.mjs record)`);
  const old = hist[f].find((x) => x !== cur);
  assert.deepEqual(M.staleFiles('seed/site-template', { [f]: old }), { stale: [f], kept: [] }, 'an earlier seeded version is refreshed');
  assert.deepEqual(M.staleFiles('seed/site-template', { [f]: cur }), { stale: [], kept: [] }, 'the current version is left alone');
  assert.deepEqual(M.staleFiles('seed/site-template', { [f]: 'a'.repeat(40) }), { stale: [], kept: [f] }, 'a keeper\'s own change is kept and reported');
  const one = org.repos.find((r) => r.seed) || null;
  if (one) { const pl2 = plan({ ...org, repos: [one] }, { [one.name]: { ...org.defaults, ...one, default_branch: 'dev', has_dev: true, has_pages: !!one.pages, cname: one.cname ?? null, https_enforced: true, teams: one.teams || {}, protected: true, seed_missing: [], managed_shas: { [f]: old } } });
    assert.ok(pl2.actions.some((a) => a.action === 'repo.refresh_managed' && a.files.includes(f) && a.from[f] === old), 'Org apply plans the refresh with the version it saw');
    assert.deepEqual(checkActions(p, pl2), [], 'the refresh is an allowed Org apply action'); } }
await import('./decisions.test.mjs');
console.log('OK (tests)');

// Org apply scoped to what a push is about (build/org-scope.mjs; Dinis, 24 Nov 2026: "keep it focused on the actions
// that I'm working on and reviewing"): a request names its own repository, a removed request or a policy change names
// none, and an org/repos.json change names the entries it adds or changes.
{
  const { scope } = await import('../build/org-scope.mjs');
  const { scoped } = await import('../build/org-plan.mjs');
  const { load: loadReq } = await import('../build/requests.mjs');
  const { requests } = loadReq('requests');
  const org = JSON.parse(readFileSync('org/repos.json', 'utf8'));
  const router = requests.find((r) => r.label === 'router' && r.group === 'agents');
  if (router) assert.deepEqual(scope({ changed: [`requests/${router.folder}/site.json`], requests, orgBefore: org, orgAfter: org }), ['Site__Agent__Router'], 'a request names its own repository');
  assert.deepEqual(scope({ changed: ['policy/abp.json', 'seed/site-template/site/index.html', 'requests/1999-01-01__gone/site.json'], requests, orgBefore: org, orgAfter: org }), [], 'policy, seed and removed requests name nothing');
  const after = { ...org, repos: org.repos.map((r) => r.name === 'SovereignWebsite__Hub' ? { ...r, description: 'changed' } : r) };
  assert.deepEqual(scope({ changed: ['org/repos.json'], requests, orgBefore: org, orgAfter: after }), ['SovereignWebsite__Hub'], 'an org entry names itself');
  const moved = requests.find((r) => (r.previous || []).length && (!r.from || r.moved));
  if (moved) assert.ok(scope({ changed: [`requests/${moved.folder}/site.json`], requests, orgBefore: org, orgAfter: org }).some((n) => n.startsWith('Redirect__')), 'a moved site names its redirect too');
  const one = scoped(org, ['SovereignWebsite__Hub']);
  assert.deepEqual(one.repos.map((r) => r.name), ['SovereignWebsite__Hub'], 'a scoped plan wants only the named repositories');
  assert.deepEqual(plan(one, {}).actions.map((a) => a.target).filter((t) => t !== 'SovereignWebsite__Hub'), [], 'and acts on nothing else');
  assert.equal(scoped(org, []), org, 'no list: every repository');
}
console.log('OK (org scope)');

// CLAUDE.md is a managed file on agent sites only, compared and written filled with each site's own values: an earlier
// seeded version (any site's values) is refreshed, a keeper's own change is kept, and customer sites are never touched.
{
  const M = await import('../build/managed.mjs'); const { fill } = await import('../build/fill.mjs'); const fs = await import('node:fs');
  const vars = { title: 'CRM agents', host: 'crm.agents.sovereignweb.site', agent: 'a.crm.dev@SovereignWebsite.dinis', repo: 'Site__Agent__CRM', label: 'crm', description: 'x', kind: 'owner' };
  const earlier = M.earlierTemplates('seed/agent-template', 'CLAUDE.md');
  assert.ok(earlier.length >= 2, 'earlier agent CLAUDE.md versions are kept as text');
  const oldSha = M.blobSha(Buffer.from(fill(earlier[0], vars, 'CLAUDE.md')));
  assert.deepEqual(M.staleFiles('seed/agent-template', { 'CLAUDE.md': oldSha }, undefined, vars), { stale: ['CLAUDE.md'], kept: [] }, 'an earlier seeded agent CLAUDE.md is refreshed');
  const curSha = M.blobSha(M.seedContent('seed/agent-template', 'CLAUDE.md', vars));
  assert.deepEqual(M.staleFiles('seed/agent-template', { 'CLAUDE.md': curSha }, undefined, vars), { stale: [], kept: [] }, 'the current one is left alone');
  assert.deepEqual(M.staleFiles('seed/agent-template', { 'CLAUDE.md': 'b'.repeat(40) }, undefined, vars), { stale: [], kept: ['CLAUDE.md'] }, 'a keeper\'s own CLAUDE.md is kept and reported');
  assert.ok(!M.managedFor('seed/site-template').includes('CLAUDE.md'), 'a customer site\'s CLAUDE.md is never managed');
  assert.ok(M.seedContent('seed/agent-template', 'CLAUDE.md', vars).toString().includes('crm.agents.sovereignweb.site'), 'the refresh is written filled');
  assert.ok(fs.readFileSync('seed/agent-template/CLAUDE.md', 'utf8').includes('START.md'), 'agent sites start with START.md');
}
console.log('OK (managed CLAUDE.md)');

// A chapter names its parent organisation (Dinis, 24 Nov 2026: "london.agentics-foundation.organisation").
{
  const R = await import('../build/requests.mjs');
  const r = { label: 'london', group: 'organisation', provider: 'agentics-foundation', title: 'T', description: 'D', kind: 'owner' };
  assert.deepEqual(R.validate(r, '2026-11-24__london'), [], 'an organisation chapter may name its parent');
  assert.equal(R.host(r), 'london.agentics-foundation.organisation.sovereignweb.site');
  assert.equal(R.repoName(r), 'Site__Organisation__Agentics-Foundation__London');
  assert.ok(R.validate({ ...r, group: 'artist' }, '2026-11-24__london').some((e) => /provider/.test(e)), 'other groups still may not');
}
console.log('OK (organisation chapters)');

// Every public site names its keeper and design reviewer, for requests filed from 2026-11-25 (Dinis, 24 Nov 2026).
{
  const R = await import('../build/requests.mjs');
  const base = { label: 'x', group: 'tool', title: 'T', description: 'D', kind: 'demo' };
  assert.deepEqual(R.validate(base, '2026-11-24__x'), [], 'requests filed before the rule are unchanged');
  assert.equal(R.validate(base, '2026-11-25__x').filter((e) => /names its (keeper|design)/.test(e)).length, 2, 'a new public request without keeper and design is incomplete');
  assert.deepEqual(R.validate({ ...base, keeper: 'a.x@SovereignWebsite.dinis', design: 'design.b@SovereignWebsite.dinis' }, '2026-11-25__x'), [], 'with both it is complete');
  assert.ok(R.validate({ ...base, keeper: 'not a name', design: 'design.b@SovereignWebsite.dinis' }, '2026-11-25__x').some((e) => /keeper must be an agent name/.test(e)));
  assert.deepEqual(R.validate({ ...base, access: 'vault' }, '2026-11-25__x'), [], 'private vault sites are exempt');
  assert.deepEqual(R.validate({ label: 'x', group: 'agents', agent: 'a.x@SovereignWebsite.dinis', title: 'T', description: 'D', kind: 'owner' }, '2026-11-25__x'), [], 'agent sites are their own keeper');
}
console.log('OK (keeper and design)');

// A scoped run by hand with the nudge re-saves a domain whose certificate is stuck pending; the schedule does not.
{
  const { plan } = await import('../build/org-plan.mjs');
  const org = { org: 'SovereignWebsite', defaults: {}, repos: [{ name: 'Site__X', cname: 'x.tool.sovereignweb.site', pages: true, default_branch: 'dev' }] };
  const live = { Site__X: { default_branch: 'dev', has_dev: true, has_pages: true, cname: 'x.tool.sovereignweb.site', https_enforced: false, cert_state: 'authorization_pending', teams: {}, protected: true } };
  const saved = { m: process.env.NUDGE_MISSING, o: process.env.ONLY_REPOS };
  process.env.NUDGE_MISSING = 'true'; delete process.env.ONLY_REPOS;
  assert.ok(!plan(org, live).actions.some((a) => a.action === 'pages.nudge_certificate'), 'the schedule leaves a pending certificate alone');
  process.env.ONLY_REPOS = 'Site__X';
  assert.ok(plan(org, live).actions.some((a) => a.action === 'pages.nudge_certificate' && a.state === 'authorization_pending'), 'a scoped run by hand re-saves it');
  if (saved.m === undefined) delete process.env.NUDGE_MISSING; else process.env.NUDGE_MISSING = saved.m;
  if (saved.o === undefined) delete process.env.ONLY_REPOS; else process.env.ONLY_REPOS = saved.o;
}
console.log('OK (scoped certificate nudge)');

// Every site seed carries tools/check.sh, which runs each check its deploy runs, so an agent finds a failure before it
// pushes (sites.a and startup-grants.a, 25 Nov 2026: new design pages failed share-check at deploy, runs 45517939062
// and 45518494287). Each .github/ci script the workflow runs must also be run by check.sh.
{
  const { existsSync } = await import('node:fs');
  for (const t of ['site-template', 'gate-template', 'agent-template']) {
    const sh = readFileSync(`seed/${t}/tools/check.sh`, 'utf8'), wf = readFileSync(`seed/${t}/.github/workflows/pages.yml`, 'utf8');
    for (const s of new Set([...wf.matchAll(/\.github\/ci\/(build|share-check|quality|axe)\.mjs/g)].map((m) => m[0]))) assert.ok(sh.includes(s), `${t}: check.sh runs ${s}`);
    assert.ok(sh.includes('html-validate@' + wf.match(/html-validate@([\d.]+)/)[1]), `${t}: check.sh uses the workflow's html-validate`);
    assert.ok(readFileSync(`seed/${t}/CLAUDE.md`, 'utf8').includes('bash tools/check.sh'), `${t}: CLAUDE.md says to run it`);
    assert.ok(existsSync(`seed/${t}/.github/ci/axe.mjs`));
  }
}
console.log('OK (local checks before a push)');
