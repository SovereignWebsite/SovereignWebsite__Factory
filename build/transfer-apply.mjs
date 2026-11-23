// Move one repository, from a plan made by transfer-plan.mjs and checked against policy/abp.json.
// Runs only in the transfer environment, after Dinis approves the run. Token: TRANSFER_USER_TOKEN, a user access token
// (GitHub accepts no installation token for this call). Without it, prints the one call for Dinis to make, and moves nothing.
// Writes <out> (transfer.json for requests/<id>/) with the result. Prints no token.
// Usage: node build/transfer-apply.mjs <plan.json> <out.json>
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { gh } from './github.mjs';
import { load, checkActions, validate } from './abp.mjs';

export function refusals(policy, plan) {
  const e = [...validate(policy), ...checkActions(policy, plan)];
  if ((plan.actions || []).length !== 1) e.push('a transfer plan has exactly one action');
  if (plan.apply !== 'real') e.push(`request ${plan.request} is apply "${plan.apply}", not "real"`);
  if (plan.blockers?.length) e.push(`preflight blockers: ${plan.blockers.join('; ')}`);
  if (!plan.findings?.length || plan.findings.some((f) => f.startsWith('no tokens'))) e.push('no live preflight in this plan');
  return e;
}

export function body(plan) {
  const [owner, repo] = plan.actions[0].target.split('/'), [new_owner, new_name] = plan.actions[0].to.split('/');
  return { path: `/repos/${owner}/${repo}/transfer`, data: { new_owner, new_name } };
}

export async function move(plan, token, { wait = (ms) => new Promise((r) => setTimeout(r, ms)), tries = 60 } = {}) {
  const b = body(plan);
  const r = await gh('POST', b.path, b.data, token);
  if (r.status !== 202) return { state: 'failed', http: r.status, message: r.data?.message ?? null };
  for (let i = 0; i < tries; i++) {
    const t = await gh('GET', `/repos/${plan.actions[0].to}`, null, token);
    if (t.status === 200 && t.data.full_name === plan.actions[0].to) return { state: 'moved', http: 202 };
    await wait(10000);
  }
  return { state: 'accepted, not yet visible', http: 202 };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [planFile, out = 'transfer.json'] = process.argv.slice(2);
  const plan = JSON.parse(readFileSync(planFile, 'utf8'));
  if (!plan.actions?.length) { console.log('nothing to move'); process.exit(0); }
  const e = refusals(load(), plan);
  if (e.length) { console.error(e.join('\n')); console.error(`TRANSFER REFUSED (${e.length})`); process.exit(1); }
  const b = body(plan), record = { request: plan.request, from: plan.actions[0].target, to: plan.actions[0].to, run: process.env.GITHUB_RUN_ID || null, at: new Date().toISOString(), version_before: plan.version_before ?? null, pages_branches: plan.pages_branches ?? null, findings: plan.findings,
    old_name: `GitHub redirects github.com/${plan.actions[0].target} only while no repository takes that name again: AgentiCCells must not reuse it`,
    old_address: plan.from?.address ? `for AgentiCCells' own factory: a redirect page at ${plan.from.address} to https://${plan.address}` : null };
  if (!process.env.TRANSFER_USER_TOKEN) {
    Object.assign(record, { state: 'waiting for Dinis', how: `gh api -X POST ${b.path} -f new_owner=${b.data.new_owner} -f new_name=${b.data.new_name}` });
    console.log(`No TRANSFER_USER_TOKEN in the transfer environment. Dinis makes the one call:\n\n    ${record.how}\n\nor github.com/${plan.actions[0].target}/settings, Transfer, to ${b.data.new_owner}, name ${b.data.new_name}.`);
  } else {
    Object.assign(record, await move(plan, process.env.TRANSFER_USER_TOKEN));
    console.log(`${record.from} to ${record.to}: ${record.state}`);
  }
  writeFileSync(out, JSON.stringify(record, null, 2) + '\n');
  if (record.state === 'failed') process.exit(1);
}
