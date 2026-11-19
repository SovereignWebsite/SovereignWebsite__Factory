// Apply a plan written by org-plan.mjs, after build/abp.mjs has allowed it. Needs GH_TOKEN (App installation token).
// Takes only the actions below; anything else is refused here as well as by the policy.
import { readFileSync } from 'node:fs';
import { gh } from './github.mjs';
import { load, checkActions } from './abp.mjs';
import { wanted, seedFiles, withRequests } from './org-plan.mjs';
import { join } from 'node:path';

const p = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const refused = checkActions(load(), p);
if (refused.length) { console.error(refused.join('\n')); process.exit(1); }
const org = withRequests(JSON.parse(readFileSync('org/repos.json', 'utf8')));
const spec = Object.fromEntries(wanted(org).map((r) => [r.name, r]));
const settings = (r) => ({ description: r.description, homepage: r.homepage, has_wiki: r.has_wiki, has_projects: r.has_projects, delete_branch_on_merge: r.delete_branch_on_merge, allow_merge_commit: r.allow_merge_commit, allow_squash_merge: r.allow_squash_merge, allow_rebase_merge: r.allow_rebase_merge });
const must = (r, what, ok = [200, 201, 204]) => { if (!ok.includes(r.status)) throw new Error(`${what}: HTTP ${r.status} ${r.data?.message || ''}`); console.log(`done: ${what}`); };

for (const a of p.actions) {
  const r = spec[a.target], base = `/repos/${p.org}/${a.target}`;
  if (a.action === 'repo.create') must(await gh('POST', `/orgs/${p.org}/repos`, { name: r.name, visibility: r.visibility, auto_init: true, ...settings(r) }), `create ${a.target}`);
  else if (a.action === 'repo.update_settings') must(await gh('PATCH', base, settings(r)), `settings ${a.target}`);
  else if (a.action === 'branch.create_dev') {
    const repo = await gh('GET', base); const ref = await gh('GET', `${base}/git/ref/heads/${repo.data.default_branch}`);
    const res = await gh('POST', `${base}/git/refs`, { ref: 'refs/heads/dev', sha: ref.data.object.sha });
    must(res, `dev branch ${a.target}`, [201, 422]);
  } else if (a.action === 'repo.set_default_branch') must(await gh('PATCH', base, { default_branch: 'dev' }), `default branch dev ${a.target}`);
  else if (a.action === 'pages.enable') must(await gh('POST', `${base}/pages`, { build_type: 'workflow' }), `pages ${a.target}`, [201, 409]);
  else if (a.action === 'repo.seed') {
    // One commit with every missing file, so the site deploys once (Pages and the domain are set before this).
    const files = [];
    for (const f of a.files || seedFiles(r.seed)) {
      const have = await gh('GET', `${base}/contents/${f}?ref=dev`);
      if (have.status === 200) console.log(`kept: ${a.target}/${f} (exists, never overwritten)`); else files.push(f);
    }
    if (files.length) {
      const ref = await gh('GET', `${base}/git/ref/heads/dev`); const head = ref.data.object.sha;
      const commit = await gh('GET', `${base}/git/commits/${head}`);
      const tree = [];
      for (const f of files) {
        let buf = readFileSync(join(r.seed, f));
        if (r.vars) { let t = buf.toString('utf8'); for (const [k, v] of Object.entries(r.vars)) t = t.split(`{{${k}}}`).join(String(v).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c])); buf = Buffer.from(t); }
        const b = await gh('POST', `${base}/git/blobs`, { content: buf.toString('base64'), encoding: 'base64' });
        must(b, `blob ${a.target}/${f}`, [201]); tree.push({ path: f, mode: '100644', type: 'blob', sha: b.data.sha });
      }
      const t = await gh('POST', `${base}/git/trees`, { base_tree: commit.data.tree.sha, tree }); must(t, `tree ${a.target}`, [201]);
      const c = await gh('POST', `${base}/git/commits`, { message: `Seed ${files.length} files from SovereignWebsite__Factory (org-apply)`, tree: t.data.sha, parents: [head] }); must(c, `commit ${a.target}`, [201]);
      must(await gh('PATCH', `${base}/git/refs/heads/dev`, { sha: c.data.sha }), `seed ${a.target}: ${files.join(', ')}`);
    }
  } else if (a.action === 'pages.set_cname') must(await gh('PUT', `${base}/pages`, { cname: r.cname, build_type: 'workflow' }), `custom domain ${r.cname} on ${a.target}`);
  else if (a.action === 'team.grant_push') must(await gh('PUT', `/orgs/${p.org}/teams/${a.team}/repos/${p.org}/${a.target}`, { permission: 'push' }), `team ${a.team} push on ${a.target}`);
  else if (a.action === 'repo.protect_branches') {
    const have = await gh('GET', `${base}/rulesets`);
    const names = new Set((Array.isArray(have.data) ? have.data : []).map((q) => q.name));
    const admins = [{ actor_id: 1, actor_type: 'OrganizationAdmin', bypass_mode: 'always' }];
    if (!names.has('main-locked')) must(await gh('POST', `${base}/rulesets`, { name: 'main-locked', target: 'branch', enforcement: 'active', bypass_actors: admins, conditions: { ref_name: { include: ['refs/heads/main'], exclude: [] } }, rules: [{ type: 'deletion' }, { type: 'non_fast_forward' }, { type: 'update' }] }), `ruleset main-locked on ${a.target}`, [201]);
    if (!names.has('dev-safe')) must(await gh('POST', `${base}/rulesets`, { name: 'dev-safe', target: 'branch', enforcement: 'active', bypass_actors: [], conditions: { ref_name: { include: ['refs/heads/dev'], exclude: [] } }, rules: [{ type: 'deletion' }, { type: 'non_fast_forward' }] }), `ruleset dev-safe on ${a.target}`, [201]);
  } else if (a.action === 'pages.enforce_https') must(await gh('PUT', `${base}/pages`, { cname: r.cname, https_enforced: true }), `HTTPS enforced on ${r.cname}`);
  else if (a.action === 'pages.nudge_certificate') {
    // Remove the custom domain and set it again: GitHub then re-checks DNS and requests the certificate.
    must(await gh('PUT', `${base}/pages`, { cname: null }), `custom domain cleared on ${a.target}`);
    must(await gh('PUT', `${base}/pages`, { cname: r.cname }), `certificate nudge for ${r.cname} (was ${a.state})`);
  }
  else throw new Error(`unknown action ${a.action}`);
}
console.log(`APPLIED ${p.actions.length} actions`);
