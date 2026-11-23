// Key requests: the Factory publishes an agent's public key in another repository's team/keys.json, after a
// security review, signed by the factory key that repository trusts for key additions. Every step is a signed commit
// here or in the target, so each key has its provenance.
// Dinis Cruz, 22 Nov 2026 (Decision Desk, relayed by conductor.d): "I like factory doing it because that leaves a full
// track record and if infrastructure as code, but the factory agent should merge it after a security review. For tasks
// like this I should not be the bottleneck"; in factory.d's session ~15:30 UTC: "build the factory [signed] key ...
// every time you do here, you should also do a security check and role-based security checks".
//
// keys/<date>__<id>/request.json  { agent, account, session, bundle: { sign }, targets: ["Owner/Repo"], source }
// keys/<date>__<id>/review.<role>.json, one per required review (policy limits.reviews: security and counsel):
//                                 { reviewer, verdict: "pass" | "fail" | "needs-a-person", request_commit,
//                                   checks: [...], actions: [...what the reviewer did or asks, or "none"], notes }
//
// Rules (policy/abp.json pipelines.key-apply), all checked here and again before anything is written:
//   - the request is well formed: an agent name, a claude.ai session, a public signing key that parses, targets on
//     the policy's list, the requester's quote of Dinis or the agent's conductor as source;
//   - roles: request.json last changed by a commit signed by an agent whose role is in requester_roles (factory);
//     each review.<role>.json by an agent of that role (security, counsel); the requester and every reviewer are
//     different agents in different roles; "needs-a-person" stops it until Dinis (or a lawyer) answers in a new review;
//   - the review names the exact commit of the request it reviewed, and the request has not changed since;
//   - verdict "pass"; the target has no live key under that agent name; the commit only adds that one entry.
// Usage: node build/key-requests.mjs check            offline: every request and review well formed and signed
//        node build/key-requests.mjs apply <owner>    for that owner's targets (GH_TOKEN: App token for the owner,
//                                                     FACTORY_SIGNING_KEY_FILE: the factory key, a 0600 file)
// Prints no secret.
import { readFileSync, readdirSync, existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createPublicKey } from 'node:crypto';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { load as loadPolicy } from './abp.mjs';
import { checkSignatures } from './check-signatures.mjs';
import { gh } from './github.mjs';

export const PIPELINE = 'key-apply';
const AGENT = /^[a-z0-9]+(?:[.-][a-z0-9]+)*@[a-z0-9.-]+$/i;
const SESSION = /^https:\/\/claude\.ai\/code\/session_[A-Za-z0-9]+$/;
const REPO = /^[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/;
export const roleOf = (agent) => String(agent || '').split('@')[0].split('.')[0];
const read = (f) => JSON.parse(readFileSync(f, 'utf8'));

export function listRequests(dir = 'keys') {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort()
    .map((folder) => ({ folder, dir: join(dir, folder) }));
}

// The request's own shape, against the policy's limits.
export function validateRequest(req, folder, limits) {
  const e = [], at = (m) => e.push(`${folder}: ${m}`);
  if (!/^\d{4}-\d{2}-\d{2}__[a-z0-9][a-z0-9.-]*$/.test(folder)) at('folder is <date>__<id>');
  if (!AGENT.test(req.agent || '')) at('agent is <role>.<account>@<Project>.<owner>');
  if (!SESSION.test(req.session || '')) at('session is a https://claude.ai/code/session_... link');
  if (!req.account) at('account missing');
  if (!req.source) at('source missing (the words that asked for this key, and where)');
  try { const k = createPublicKey(req.bundle?.sign || ''); if (!['ec', 'ed25519'].includes(k.asymmetricKeyType)) at(`signing key type ${k.asymmetricKeyType} is not EC or Ed25519`); }
  catch { at('bundle.sign is not a public key in PEM form'); }
  if (/PRIVATE KEY/.test(JSON.stringify(req))) at('contains a private key: refused, and the key must be treated as exposed');
  if (!Array.isArray(req.targets) || !req.targets.length) at('targets missing');
  for (const t of req.targets || []) {
    if (!REPO.test(t)) at(`target ${t} is not Owner/Repo`);
    else if (!(limits.targets || []).some((x) => x.toLowerCase() === t.toLowerCase())) at(`target ${t} is not on the policy's key-apply targets`);
  }
  return e;
}

export function validateReview(rev, folder, role = '') {
  const e = [], at = (m) => e.push(`${folder}: review.${role}: ${m}`);
  if (!AGENT.test(rev.reviewer || '')) at('reviewer is an agent name');
  if (!['pass', 'fail', 'needs-a-person'].includes(rev.verdict)) at('verdict is "pass", "fail" or "needs-a-person"');
  if (!/^[0-9a-f]{40}$/.test(rev.request_commit || '')) at('request_commit is the full commit of the request it reviewed');
  if (!Array.isArray(rev.checks) || !rev.checks.length) at('checks: what was checked, one line each');
  if (!Array.isArray(rev.actions) || !rev.actions.length) at('actions: what the reviewer did or asks, one line each, or ["none"]');
  return e;
}

// Who changed a file last, and whether that commit is signed by a published key with its trailers (check-signatures).
export function provenance(cwd, file) {
  const git = (...a) => execFileSync('git', a, { cwd, encoding: 'utf8' }).trim();
  const c = git('log', '-1', '--format=%H', '--', file);
  if (!c) return { error: `${file}: not committed` };
  const agent = git('log', '-1', '--format=%(trailers:key=Agent,valueonly)', c).split('\n').map((s) => s.trim()).filter(Boolean)[0];
  const sig = checkSignatures({ cwd, before: `${c}^`, after: c });
  return { commit: c, agent, signed: !sig.errors.length, errors: sig.errors };
}

// Every rule except the target's live state. Returns { errors, ready } (ready: passed review, may be applied).
export function checkRequest({ cwd = process.cwd(), r, policy = loadPolicy() }) {
  const limits = policy.pipelines?.[PIPELINE]?.limits || {};
  const errors = [];
  const rf = join(r.dir, 'request.json');
  if (!existsSync(rf)) return { errors: [`${r.folder}: no request.json`], ready: false };
  let req; try { req = read(rf); } catch { return { errors: [`${r.folder}: request.json is not valid JSON`], ready: false }; }
  errors.push(...validateRequest(req, r.folder, limits));
  const pr = provenance(cwd, rf);
  if (pr.error) return { errors: [...errors, pr.error], ready: false, req };
  if (!pr.signed) errors.push(`${r.folder}: request.json's commit ${pr.commit.slice(0, 7)} is not signed by a published key: ${pr.errors.join('; ')}`);
  if (!(limits.requester_roles || []).includes(roleOf(pr.agent))) errors.push(`${r.folder}: requested by ${pr.agent}; only roles ${(limits.requester_roles || []).join(', ')} may request a key`);
  // Every required review, each by its own role; requester and reviewers all different agents in different roles.
  const reviews = [], agents = [pr.agent], roles = [roleOf(pr.agent)];
  let complete = true;
  for (const role of limits.reviews || []) {
    const vf = join(r.dir, `review.${role}.json`);
    if (!existsSync(vf)) { complete = false; continue; }
    let rev; try { rev = read(vf); } catch { errors.push(`${r.folder}: review.${role}.json is not valid JSON`); continue; }
    errors.push(...validateReview(rev, r.folder, role));
    const pv = provenance(cwd, vf);
    if (pv.error) { errors.push(pv.error); continue; }
    if (!pv.signed) errors.push(`${r.folder}: review.${role}.json's commit ${pv.commit.slice(0, 7)} is not signed by a published key: ${pv.errors.join('; ')}`);
    if (pv.agent !== rev.reviewer) errors.push(`${r.folder}: review.${role}.json names ${rev.reviewer} but was committed by ${pv.agent}`);
    if (roleOf(pv.agent) !== role) errors.push(`${r.folder}: review.${role}.json committed by ${pv.agent}; only the ${role} role may give it`);
    if (agents.includes(pv.agent) || roles.includes(roleOf(pv.agent))) errors.push(`${r.folder}: ${pv.agent} already acts in this request; the requester and each reviewer must be different agents in different roles`);
    agents.push(pv.agent); roles.push(roleOf(pv.agent));
    if (rev.request_commit !== pr.commit) errors.push(`${r.folder}: the ${role} review is of ${String(rev.request_commit).slice(0, 7)}, but request.json was last changed in ${pr.commit.slice(0, 7)}: review it again`);
    reviews.push({ role, ...rev, commit: pv.commit });
  }
  const ready = !errors.length && complete && reviews.length === (limits.reviews || []).length && reviews.every((v) => v.verdict === 'pass');
  return { errors, ready, complete, req, reviews, request_commit: pr.commit };
}

// What each review checked and what it did or asks, for the run summary.
export const reviewReport = (c) => (c.reviews || []).map((v) => `${v.role} (${v.reviewer}, ${v.verdict}, ${v.commit.slice(0, 7)}): checked ${v.checks.join('; ')}; actions ${v.actions.join('; ')}`);

// The one entry to add in a target's team/keys.json, and the refusal if that agent already has a live key there.
export function addEntry(doc, req, folder) {
  const keys = Array.isArray(doc) ? doc : doc.keys || [];
  if (keys.some((k) => k.agent === req.agent && k.status !== 'retired' && k.status !== 'superseded')) return { skip: `${req.agent} already has a live key` };
  const entry = { id: req.agent.split('@')[0].replace(/\./g, '-'), agent: req.agent, account: req.account, status: 'active', session: req.session, created: folder.slice(0, 10),
    how: `Published by the SovereignWebsite Factory from key request keys/${folder}, after its security and counsel reviews.`, ...(req.fingerprint ? { fingerprint: req.fingerprint } : {}), ...(req.signing_fingerprint ? { signing_fingerprint: req.signing_fingerprint } : {}), bundle: req.bundle };
  const next = Array.isArray(doc) ? [...keys, entry] : { ...doc, keys: [...keys, entry] };
  return { next, entry };
}

export async function apply(owner, { cwd = process.cwd(), policy = loadPolicy() } = {}) {
  const keyFile = process.env.FACTORY_SIGNING_KEY_FILE;
  if (!keyFile || !existsSync(keyFile)) throw new Error('FACTORY_SIGNING_KEY_FILE is not set: the factory key is not in the apply environment yet');
  const factory = policy.pipelines?.[PIPELINE]?.factory_agent;
  if (!factory) throw new Error('policy: pipelines.key-apply.factory_agent missing');
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf8' }).trim();
  for (const r of listRequests(join(cwd, 'keys'))) {
    const c = checkRequest({ cwd, r, policy });
    if (c.errors.length) { console.log(`${r.folder}: not applied: ${c.errors.join('; ')}`); continue; }
    for (const line of reviewReport(c)) console.log(`${r.folder}: review ${line}`);
    if (!c.ready) { console.log(`${r.folder}: not applied: ${c.complete ? 'not every review passed' : 'waiting for every required review'} (${(policy.pipelines?.[PIPELINE]?.limits?.reviews || []).join(', ')})`); continue; }
    for (const t of c.req.targets.filter((x) => x.split('/')[0].toLowerCase() === owner.toLowerCase())) {
      const cur = await gh('GET', `/repos/${t}/contents/team/keys.json?ref=dev`);
      if (cur.status !== 200) { console.log(`${t}: cannot read team/keys.json on dev (HTTP ${cur.status})`); continue; }
      const doc = JSON.parse(Buffer.from(cur.data.content, 'base64').toString('utf8'));
      const a = addEntry(doc, c.req, r.folder);
      if (a.skip) { console.log(`${t}: ${a.skip}; nothing to do`); continue; }
      const dir = mkdtempSync(join(tmpdir(), 'keyapply-'));
      try {
        const g = (...x) => execFileSync('git', x, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
        // The token travels in the environment as an extra header for these git calls only: never in an argument, the
        // remote URL or a log line (a failed git call is reported by step name only).
        const env = { ...process.env, GIT_CONFIG_COUNT: '1', GIT_CONFIG_KEY_0: 'http.extraheader', GIT_CONFIG_VALUE_0: `AUTHORIZATION: basic ${Buffer.from(`x-access-token:${process.env.GH_TOKEN}`).toString('base64')}` };
        const net = (step, args, o = {}) => { try { execFileSync('git', args, { env, stdio: ['ignore', 'ignore', 'ignore'], ...o }); } catch { throw new Error(`${t}: git ${step} failed`); } };
        net('clone', ['clone', '-q', '--depth', '1', '--branch', 'dev', `https://github.com/${t}.git`, dir]);
        writeFileSync(join(dir, 'team/keys.json'), JSON.stringify(a.next, null, 2) + '\n');
        g('add', 'team/keys.json');
        const msg = `team/keys.json: ${c.req.agent}'s public key, from the Factory\n\nKey request: https://github.com/SovereignWebsite/SovereignWebsite__IaC/tree/${head}/keys/${r.folder}\nRequested in ${c.request_commit}.\n${reviewReport(c).map((l) => `Review: ${l}`).join('\n')}\n\nAgent: ${factory}\nKey-Request: keys/${r.folder}`;
        g('-c', 'user.name=SovereignWebsite Factory', '-c', 'user.email=factory@sovereignwebsite.invalid', '-c', 'gpg.format=ssh', '-c', 'gpg.ssh.program=ssh-keygen', '-c', `user.signingkey=${keyFile}`, 'commit', '-q', '-S', '-m', msg);
        net('push', ['push', '-q', 'origin', 'HEAD:dev'], { cwd: dir });
        console.log(`done: ${c.req.agent}'s key added to ${t} (${g('rev-parse', 'HEAD').slice(0, 7)}), signed by the factory key`);
      } finally { rmSync(dir, { recursive: true, force: true }); }
    }
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [cmd, owner] = process.argv.slice(2);
  try {
    if (cmd === 'check') {
      const policy = loadPolicy(), all = listRequests();
      const errs = all.flatMap((r) => checkRequest({ r, policy }).errors);
      if (errs.length) throw new Error(errs.join('\n'));
      console.log(`key requests OK (${all.length})`);
    } else if (cmd === 'apply' && owner) await apply(owner);
    else throw new Error('usage: check | apply <owner>');
  } catch (err) { console.error(err.message); console.error('KEY REQUESTS REFUSED'); process.exit(1); }
}
