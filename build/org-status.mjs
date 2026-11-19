// Report each site repository's Pages state and its latest Pages workflow runs. Changes nothing. Needs GH_TOKEN.
import { readFileSync } from 'node:fs';
import { gh } from './github.mjs';
const org = JSON.parse(readFileSync('org/repos.json', 'utf8'));
const out = ['### Sites'];
for (const r of org.repos.filter((x) => x.pages)) {
  const base = `/repos/${org.org}/${r.name}`;
  const pg = await gh('GET', `${base}/pages`);
  const runs = await gh('GET', `${base}/actions/runs?per_page=3`);
  const p = pg.data || {};
  out.push(`- **${r.name}**: pages HTTP ${pg.status}, status ${p.status ?? 'none'}, build_type ${p.build_type ?? '-'}, cname ${p.cname ?? '-'}, https_enforced ${p.https_enforced ?? '-'}, url ${p.html_url ?? '-'}`);
  for (const w of runs.data?.workflow_runs || []) out.push(`  - run ${w.id} ${w.name} ${w.event} ${w.status}/${w.conclusion ?? '-'} ${w.created_at}`);
  const fails = (runs.data?.workflow_runs || []).filter((w) => w.conclusion === 'failure').slice(0, 1);
  for (const w of fails) {
    const jobs = await gh('GET', `${base}/actions/runs/${w.id}/jobs`);
    for (const j of jobs.data?.jobs || []) for (const s of j.steps || []) if (s.conclusion === 'failure') out.push(`    - failed step: ${j.name} / ${s.name}`);
  }
}
console.log(out.join('\n'));
