// Apply a plan written by org-plan.mjs, after build/abp.mjs has allowed it. Needs GH_TOKEN (App installation token).
// Takes only the actions below; anything else is refused here as well as by the policy.
import { readFileSync } from 'node:fs';
import { gh } from './github.mjs';
import { load, checkActions } from './abp.mjs';
import { wanted } from './org-plan.mjs';

const p = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const refused = checkActions(load(), p);
if (refused.length) { console.error(refused.join('\n')); process.exit(1); }
const org = JSON.parse(readFileSync('org/repos.json', 'utf8'));
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
  else throw new Error(`unknown action ${a.action}`);
}
console.log(`APPLIED ${p.actions.length} actions`);
