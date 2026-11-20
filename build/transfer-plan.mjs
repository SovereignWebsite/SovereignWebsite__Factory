// Plan a move: one hosted-site request with a from block becomes one repo.transfer_in action, with a read-only preflight.
// Without tokens it plans from the files alone (used by Checks). With SRC_TOKEN (the factory App on the source organisation,
// read) and GH_TOKEN (the factory App on SovereignWebsite, read) it checks the live repositories; any blocker stops the move.
// Usage: node build/transfer-plan.mjs <out.json> [request folder]   prints a Markdown plan, writes the plan JSON.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { gh } from './github.mjs';
import { load, host, repoName } from './requests.mjs';

export const TO_OWNER = 'SovereignWebsite';

// The requests still to move. With a folder, only that one.
export function pending(requests, folder) {
  const p = requests.filter((r) => r.from && !r.moved);
  return folder ? p.filter((r) => r.folder === folder) : p;
}

export function planFor(r) {
  return {
    pipeline: 'transfer-apply',
    request: r.folder,
    apply: r.apply,
    from: r.from,
    actions: [{ action: 'repo.transfer_in', target: `${r.from.owner}/${r.from.repo}`, to: `${TO_OWNER}/${repoName(r)}`, address_from: r.from.address, address_to: host(r) }],
    address: host(r),
    signed: r.signed === true,
    findings: [],
    blockers: [],
  };
}

// Read-only checks. get(owner, path) answers { status, data } with the right token for that owner.
export async function preflight(plan, get) {
  const { owner, repo } = plan.from, [, name] = plan.actions[0].to.split('/');
  const f = (s) => plan.findings.push(s), stop = (s) => plan.blockers.push(s);
  const src = await get(owner, `/repos/${owner}/${repo}`);
  if (src.status !== 200) { stop(`source ${owner}/${repo}: HTTP ${src.status}`); return plan; }
  if (src.data.full_name !== `${owner}/${repo}`) stop(`source ${owner}/${repo} answers as ${src.data.full_name} (already moved or renamed)`);
  if (src.data.private) stop('source is private; only public sites move');
  if (src.data.archived) stop('source is archived');
  if (src.data.fork) stop('source is a fork');
  const dst = await get(TO_OWNER, `/repos/${TO_OWNER}/${name}`);
  if (dst.status !== 404) stop(`${TO_OWNER}/${name} already answers (HTTP ${dst.status})`);
  const prs = await get(owner, `/repos/${owner}/${repo}/pulls?state=open&per_page=100`);
  if (Array.isArray(prs.data) && prs.data.length) stop(`${prs.data.length} open pull request(s): mid-round`);
  for (const st of ['in_progress', 'queued']) {
    const runs = await get(owner, `/repos/${owner}/${repo}/actions/runs?status=${st}&per_page=1`);
    if (runs.data?.total_count) stop(`${runs.data.total_count} workflow run(s) ${st}`);
  }
  const wf = await get(owner, `/repos/${owner}/${repo}/contents/.github/workflows?ref=${src.data.default_branch}`);
  for (const w of Array.isArray(wf.data) ? wf.data : []) {
    const c = await get(owner, `/repos/${owner}/${repo}/contents/${w.path}?ref=${src.data.default_branch}`);
    const text = c.data?.content ? Buffer.from(c.data.content, 'base64').toString('utf8') : '';
    const used = [...new Set([...text.matchAll(/secrets\.([A-Za-z0-9_]+)/g)].map((m) => m[1]))].filter((s) => s !== 'GITHUB_TOKEN');
    if (used.length) stop(`${w.path} uses secrets ${used.join(', ')}, which stay behind`);
    if (/create-github-app-token/.test(text)) stop(`${w.path} mints an App token, which will not work after the move`);
  }
  // Signed-commit checks: a SovereignWebsite agent's commit fails them until the repository lists its key.
  const keys = await get(owner, `/repos/${owner}/${repo}/contents/team/keys.json?ref=${src.data.default_branch}`);
  const sigs = await get(owner, `/repos/${owner}/${repo}/contents/build/check-signatures.mjs?ref=${src.data.default_branch}`);
  const isSigned = keys.status === 200 || sigs.status === 200;
  if (isSigned && !plan.signed) stop('the repository checks signed commits (team/keys.json or build/check-signatures.mjs) but the request does not say "signed": true');
  else if (isSigned) f('signed-commit checks present, as the request says: keys move as they are; re-keying is a later request');
  else if (plan.signed) f('the request says signed, but no signed-commit check was found');
  const pg = await get(owner, `/repos/${owner}/${repo}/pages`);
  if (pg.status === 200) f(`Pages: ${pg.data.build_type || 'legacy'}, custom domain ${pg.data.cname || 'none'}, HTTPS ${pg.data.https_enforced ? 'enforced' : 'not enforced'}`);
  else f('Pages: off');
  const env = await get(owner, `/repos/${owner}/${repo}/environments`);
  if (env.status === 200) f(`environments: ${(env.data.environments || []).map((e) => e.name).join(', ') || 'none'}`);
  const gp = await get(owner, `/repos/${owner}/${repo}/environments/github-pages/deployment-branch-policies`);
  if (gp.status === 200) { plan.pages_branches = (gp.data.branch_policies || []).map((b) => b.name); f(`github-pages may deploy from: ${plan.pages_branches.join(', ') || 'protected branches only'} (set again after the move if missing)`); }
  const rs = await get(owner, `/repos/${owner}/${repo}/rulesets`);
  if (Array.isArray(rs.data)) f(`rulesets: ${rs.data.map((x) => x.name).join(', ') || 'none'}`);
  const addr = plan.from.address;
  if (addr) {
    try { const v = await fetch(`https://${addr}/version.json`); if (v.ok) { const j = await v.json(); plan.version_before = j.version ?? j; f(`version before: ${JSON.stringify(plan.version_before)}`); } }
    catch { f(`https://${addr}/version.json did not answer`); }
  }
  return plan;
}

export function markdown(p) {
  const a = p.actions[0];
  const l = [`### Transfer plan: ${p.request} (${p.apply})`, `- \`repo.transfer_in\` ${a.target} to ${a.to}, address ${p.address}`];
  for (const x of p.findings) l.push(`- ${x}`);
  for (const x of p.blockers) l.push(`- **blocker:** ${x}`);
  l.push(p.blockers.length ? '\nStopped: fix the blockers first.' : p.apply === 'real' ? '\nReady: the apply job waits for Dinis in the transfer environment.' : '\nDry run: nothing moves. Change apply to "real" in a second commit to move.');
  return l.join('\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [out = 'transfer-plan.json', folder] = process.argv.slice(2);
  const { requests, errors } = load('requests');
  if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
  const todo = pending(requests, folder);
  if (!todo.length) { writeFileSync(out, JSON.stringify({ pipeline: 'transfer-apply', actions: [] }, null, 2)); console.log('### Transfer plan\n- nothing to move'); process.exit(0); }
  if (todo.length > 1) { console.error(`more than one request to move (${todo.map((r) => r.folder).join(', ')}): name one`); process.exit(1); }
  const p = planFor(todo[0]);
  if (process.env.SRC_TOKEN && process.env.GH_TOKEN) await preflight(p, (o, path) => gh('GET', path, null, o === TO_OWNER ? process.env.GH_TOKEN : process.env.SRC_TOKEN));
  else p.findings.push('no tokens: planned from the files only, no preflight');
  writeFileSync(out, JSON.stringify(p, null, 2));
  console.log(markdown(p));
}
