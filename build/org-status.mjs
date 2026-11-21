// Report each site repository's Pages state, its latest Pages workflow runs, and whether it has its Agent Behaviour
// Policy (site/policy/abp.json and site/policy/index.html on dev). Changes nothing. Needs GH_TOKEN.
import { readFileSync } from 'node:fs';
import { gh } from './github.mjs';
import { wanted, withRequests } from './org-plan.mjs';
const org = withRequests(JSON.parse(readFileSync('org/repos.json', 'utf8')));
const policy = [];
const out = ['### Sites'];
for (const r of wanted(org).filter((x) => x.pages)) {
  const base = `/repos/${org.org}/${r.name}`;
  const pg = await gh('GET', `${base}/pages`);
  const runs = await gh('GET', `${base}/actions/runs?per_page=3`);
  const p = pg.data || {};
  out.push(`- **${r.name}**: pages HTTP ${pg.status}, status ${p.status ?? 'none'}, build_type ${p.build_type ?? '-'}, cname ${p.cname ?? '-'}, https_enforced ${p.https_enforced ?? '-'}, certificate ${p.https_certificate?.state ?? 'none'}${p.https_certificate?.description ? ` (${p.https_certificate.description})` : ''}, url ${p.html_url ?? '-'}`);
  // A redirect publishes only a redirect, so it carries no policy.
  if (!r.name.startsWith('Redirect__')) {
    const has = await Promise.all(['site/policy/abp.json', 'site/policy/index.html'].map((f) => gh('GET', `${base}/contents/${f}?ref=dev`).then((x) => x.status === 200)));
    policy.push(`- ${r.name}: policy ${has.every(Boolean) ? 'present' : `missing (${['abp.json', 'index.html'].filter((_, i) => !has[i]).join(', ')})`}`);
  }
  for (const w of runs.data?.workflow_runs || []) out.push(`  - run ${w.id} ${w.name} ${w.event} ${w.status}/${w.conclusion ?? '-'} ${w.created_at}`);
  const fails = (runs.data?.workflow_runs || []).filter((w) => w.conclusion === 'failure').slice(0, 1);
  for (const w of fails) {
    const jobs = await gh('GET', `${base}/actions/runs/${w.id}/jobs`);
    for (const j of jobs.data?.jobs || []) for (const s of j.steps || []) if (s.conclusion === 'failure') out.push(`    - failed step: ${j.name} / ${s.name}`);
  }
}
out.push('', '### Agent Behaviour Policy', ...policy);
console.log(out.join('\n'));
