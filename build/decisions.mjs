// Decisions: Dinis's approvals as signed records, so an agent can push without asking him again in its own session.
// Dinis, 23 November 2026, in factory.b's session: "we need to have a workflow for you to push. All these things, including
// these decisions, so I have a centralized place to go ... I want to do it through decisions."
// The rules an agent follows are in board/workflow/2026-11-23__acting-on-a-decision-record.md; this file is the machine part,
// as security.b's review 027 proposed and decisions.b agreed (record v2, 23 Nov 2026 ~14:10 UTC).
//
// A record (decisions/<id>.json, with an SSH signature decisions/<id>.json.sig, namespace "sovereignwebsite-decision") holds
// Dinis's words verbatim, the session and event where he said them, the agent that recorded it, an expiry, and a scope:
// repository, branch (never main), path globs, a number of commits, and optionally the commits' git patch-ids.
// The acting agent adds a "Decision: <id>" trailer to each commit the record covers. On every push, `ci` checks each such commit:
//   1. the record is well formed, in force and not expired;
//   2. its signature verifies against the recorder's live key in team/keys.json as it was BEFORE the push (a push cannot
//      bring its own key), and that key's published PEM hashes to its published signing fingerprint;
//   3. pki.sgit.ai, read live (no cache, fail closed), shows Dinis's anchor key (pinned here, never read from the register)
//      with a signed "operates" link to that key, in date and not revoked;
//   4. the branch and repository match, every changed file is inside the globs and outside the always-ask list, the number
//      of commits is within the record's, and each patch-id is listed when the record lists them;
//   5. the id has not been used before: no commit already on the branch carries it.
// Not checkable here, so each agent does it by hand before pushing: Dinis's words are in the recorder's session as a message
// a person typed (get_event on the record's event_uuid). CI's pass is necessary, never sufficient.
// Prints no secret. Node built-ins, git and ssh-keygen only.
// Usage: node build/decisions.mjs ci <before> <after> [--branch dev] [--repository owner/name] [--index file.json]
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash, createPublicKey, verify } from 'node:crypto';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { glob } from './abp.mjs';
import { usable } from './check-signatures.mjs';

// Dinis's own key on pki.sgit.ai (his anchor), pinned: the register is read for links, never for who Dinis is.
export const ANCHOR = 'sha256:db7f79fdd87e030a';
export const INDEX_URL = 'https://pki.sgit.ai/directory/index.json';
export const NAMESPACE = 'sovereignwebsite-decision';
// Changes Dinis keeps for himself: no record covers them; they come to him in the acting agent's own session.
export const ALWAYS_ASK = ['policy/**', '.github/**', 'team/keys.json', 'org/**', 'decisions/**', 'build/abp.mjs', 'build/check-signatures.mjs',
  'build/decisions.mjs', 'build/org-apply.mjs', 'build/transfer-*.mjs', 'build/github.mjs'];
const SESSION = /^https:\/\/claude\.ai\/code\/session_[A-Za-z0-9]+$/;
const AGENT = /^[a-z0-9]+(?:[.-][a-z0-9]+)*@[A-Za-z0-9.-]+$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const PATCH_ID = /^[0-9a-f]{40}$/;
const MAX_LIFE_MS = 7 * 24 * 3600e3; // a record lives hours or days, never longer than a week

export function validateRecord(d, now = new Date()) {
  const e = [];
  if (!d || typeof d !== 'object') return ['a decision is a JSON object'];
  if (d.v !== 2) e.push('v must be 2');
  if (!/^\d{4}-\d{2}-\d{2}__[a-z0-9-]+$/.test(d.id || '')) e.push('id must be <date>__<name>');
  if (d.decided_by !== 'Dinis Cruz') e.push('decided_by must be Dinis Cruz: only Dinis decides');
  if (typeof d.words !== 'string' || d.words.trim().length < 2) e.push('words: Dinis\'s words, verbatim');
  if (!SESSION.test(d.session || '')) e.push('session: the claude.ai session where he said it');
  if (!UUID.test(d.event_uuid || '')) e.push('event_uuid: the event of his message in that session');
  if (!AGENT.test(d.recorded_by || '')) e.push('recorded_by: the agent that recorded it, <role>@<Project>.<owner>');
  if (d.status !== 'in-force') e.push(`status is ${d.status || 'missing'}: only an in-force record counts`);
  const at = Date.parse(d.at), exp = Date.parse(d.expires);
  if (Number.isNaN(at)) e.push('at: when he said it (ISO time, UTC)');
  if (Number.isNaN(exp)) e.push('expires: an ISO time');
  else {
    if (exp <= now.getTime()) e.push(`expired at ${d.expires}`);
    if (!Number.isNaN(at) && (exp <= at || exp - at > MAX_LIFE_MS)) e.push('expires must be after at, and within a week of it');
  }
  const s = d.scope;
  if (!s || typeof s !== 'object') return [...e, 'scope is missing'];
  if (!/^[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/.test(s.repository || '')) e.push('scope.repository: owner/name');
  if (!s.branch) e.push('scope.branch is missing');
  if (s.branch === 'main') e.push('scope: no decision covers a push or merge to main');
  if (!Array.isArray(s.paths) || !s.paths.length) e.push('scope.paths: the globs it covers');
  else for (const p of s.paths) if (ALWAYS_ASK.some((a) => glob(a, p) || glob(p, a))) e.push(`scope.paths: ${p} overlaps the always-ask list`);
  if (!Number.isInteger(s.commits) || s.commits < 1) e.push('scope.commits: how many commits it covers');
  if (s.patch_ids !== undefined && (!Array.isArray(s.patch_ids) || s.patch_ids.some((x) => !PATCH_ID.test(x)))) e.push('scope.patch_ids: git patch-id --stable values');
  return e;
}

// The commits that cite the record: each { sha, files, patchId }.
export function checkScope(d, commits, { branch, repository } = {}) {
  const e = [], s = d.scope || {};
  if (branch !== undefined && branch !== s.branch) e.push(`pushed to ${branch}, the record covers ${s.branch}`);
  if (branch === 'main') e.push('no decision covers main');
  if (repository !== undefined && repository !== s.repository) e.push(`pushed to ${repository}, the record covers ${s.repository}`);
  if (commits.length > s.commits) e.push(`${commits.length} commits cite ${d.id}, it covers ${s.commits}`);
  for (const c of commits) {
    for (const f of c.files) {
      if (ALWAYS_ASK.some((a) => glob(a, f))) e.push(`${c.sha.slice(0, 7)}: ${f} is on the always-ask list`);
      else if (!(s.paths || []).some((p) => glob(p, f))) e.push(`${c.sha.slice(0, 7)}: ${f} is outside the record's paths`);
    }
    if (Array.isArray(s.patch_ids) && !s.patch_ids.includes(c.patchId)) e.push(`${c.sha.slice(0, 7)}: its patch-id is not one the record lists`);
  }
  return e;
}

export const fingerprintOf = (pem) => `sha256:${createHash('sha256').update(createPublicKey(pem).export({ type: 'spki', format: 'der' })).digest('hex').slice(0, 16)}`;

// The recorder's key as published before the push: live, its PEM matching its signing fingerprint.
export function recorderKey(keysDoc, agent) {
  const keys = (Array.isArray(keysDoc) ? keysDoc : keysDoc?.keys || []).filter((k) => k.agent === agent && usable(k) && k.bundle?.sign);
  if (keys.length !== 1) return { error: `${agent} has ${keys.length} live keys in team/keys.json, needs exactly one` };
  const k = keys[0];
  try { if (fingerprintOf(k.bundle.sign) !== k.signing_fingerprint) return { error: `${agent}: its key does not hash to its signing fingerprint` }; }
  catch { return { error: `${agent}: its published key cannot be read` }; }
  return { key: k };
}

// ssh-keygen -Y verify over the record's exact bytes. The OpenSSH form is derived from the published PEM, nothing else.
export function verifyRecordSignature(bytes, sig, key) {
  const dir = mkdtempSync(join(tmpdir(), 'decision-'));
  try {
    const pem = join(dir, 'k.pem'); writeFileSync(pem, key.bundle.sign);
    const ssh = execFileSync('ssh-keygen', ['-i', '-m', 'PKCS8', '-f', pem], { encoding: 'utf8' }).trim().split(' ').slice(0, 2).join(' ');
    const signers = join(dir, 'signers'), sigFile = join(dir, 'r.sig');
    writeFileSync(signers, `${key.agent} namespaces="${NAMESPACE}" ${ssh}\n`); writeFileSync(sigFile, sig);
    const r = spawnSync('ssh-keygen', ['-Y', 'verify', '-f', signers, '-I', key.agent, '-n', NAMESPACE, '-s', sigFile], { input: bytes, encoding: 'utf8' });
    return r.status === 0 ? [] : ['the record\'s signature does not verify against its recorder\'s key'];
  } catch { return ['the record\'s signature could not be checked']; }
  finally { rmSync(dir, { recursive: true, force: true }); }
}

// pki.sgit.ai statements are signed over their key-sorted compact JSON, without "sig", plus a newline (ECDSA P-256, r||s).
export const canonical = (v) => Array.isArray(v) ? `[${v.map(canonical).join(',')}]`
  : v && typeof v === 'object' ? `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canonical(v[k])}`).join(',')}}` : JSON.stringify(v);
const signed = (st, pem) => { const { sig, ...rest } = st; try { return verify('sha256', Buffer.from(`${canonical(rest)}\n`), { key: pem, dsaEncoding: 'ieee-p1363' }, Buffer.from(sig || '', 'base64')); } catch { return false; } };
// A revocation names a statement by the sha256 of its full canonical form, signature included, plus a newline.
const statementId = (st) => `sha256:${createHash('sha256').update(`${canonical(st)}\n`).digest('hex')}`;

// The register's own index says it is not the authority: only the signed statements in it are trusted, each checked here.
export function checkOperatesLink(index, to, now = new Date(), anchor = ANCHOR) {
  const rec = (index?.records || []).find((r) => r.fp === anchor);
  if (!rec) return [`pki.sgit.ai has no record for Dinis's anchor ${anchor}`];
  if (rec.revoked) return ['pki.sgit.ai marks Dinis\'s anchor record revoked'];
  const own = (st) => st.signer === anchor && st.record === anchor;
  const id = (rec.statements || []).find((st) => st.type === 'identity' && own(st));
  const pem = id?.body?.bundle?.sign;
  let fp; try { fp = pem && fingerprintOf(pem); } catch { /* unreadable */ }
  if (fp !== anchor || id.body.bundle.signing_fingerprint !== anchor || !signed(id, pem)) return ['Dinis\'s anchor identity on pki.sgit.ai does not verify against the pinned fingerprint'];
  const mine = (rec.statements || []).filter((st) => own(st) && signed(st, pem));
  const revoked = new Set(mine.filter((st) => st.type === 'revocation').map((st) => st.body?.revokes?.statement));
  const today = now.toISOString().slice(0, 10);
  const links = mine.filter((st) => st.type === 'link' && st.body?.to === to && st.body?.method === 'operates' && !revoked.has(statementId(st)))
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  if (!links.length) return [`pki.sgit.ai has no signed, unrevoked "operates" link from ${anchor} to ${to}`];
  const { on, until } = links[0].body;
  if (!(on <= today && today <= until)) return [`the latest "operates" link to ${to} runs ${on} to ${until}, not today (${today})`];
  return [];
}

const trailers = (git, sha, key) => git('log', '-1', `--format=%(trailers:key=${key},valueonly)`, sha).split('\n').map((x) => x.trim()).filter(Boolean);

// Every commit in before..after that cites a record. `index` is the pki.sgit.ai directory (fetched live by the CLI).
export async function checkPush({ cwd = process.cwd(), before, after, branch, repository, now = new Date(), index, anchor = ANCHOR }) {
  const git = (...a) => execFileSync('git', a, { cwd, encoding: 'utf8', maxBuffer: 64 << 20 }).trim();
  const fresh = !before || /^0+$/.test(before);
  const shas = git('rev-list', '--reverse', fresh ? after : `${before}..${after}`).split('\n').filter(Boolean);
  const cited = new Map();
  for (const sha of shas) for (const id of trailers(git, sha, 'Decision')) {
    if (!cited.has(id)) cited.set(id, []);
    const files = git('diff-tree', '--no-commit-id', '--name-only', '-r', '-m', sha).split('\n').filter(Boolean);
    const patchId = (execFileSync('git', ['patch-id', '--stable'], { cwd, input: git('show', sha), encoding: 'utf8' }).split(' ')[0] || '').trim();
    cited.get(id).push({ sha, files, patchId });
  }
  if (!cited.size) return { errors: [], ids: [] };
  if (fresh) return { errors: ['a push that cites a decision needs a branch that already exists'], ids: [...cited.keys()] };
  const errors = [];
  const keysBefore = JSON.parse(git('show', `${before}:team/keys.json`));
  const used = new Set(git('log', `--format=%(trailers:key=Decision,valueonly)`, before).split('\n').map((x) => x.trim()).filter(Boolean));
  const link = new Map();
  for (const [id, commits] of cited) {
    const fail = (m) => errors.push(`${id}: ${m}`);
    if (!/^\d{4}-\d{2}-\d{2}__[a-z0-9-]+$/.test(id)) { fail('not a record id'); continue; }
    let bytes, sig;
    // The signed bytes are the file exactly as committed.
    const blob = (p) => execFileSync('git', ['cat-file', 'blob', `${after}:${p}`], { cwd, stdio: ['ignore', 'pipe', 'ignore'] });
    try { bytes = blob(`decisions/${id}.json`); sig = blob(`decisions/${id}.json.sig`).toString('utf8'); }
    catch { fail(`decisions/${id}.json and its .sig are not committed`); continue; }
    let d; try { d = JSON.parse(bytes.toString('utf8')); } catch { fail('the record is not JSON'); continue; }
    if (d.id !== id) fail(`the file holds record ${d.id}`);
    for (const m of validateRecord(d, now)) fail(m);
    if (used.has(id)) fail('already used by a commit on this branch');
    const k = recorderKey(keysBefore, d.recorded_by);
    if (k.error) fail(k.error);
    else {
      for (const m of verifyRecordSignature(bytes, sig, k.key)) fail(m);
      const to = k.key.signing_fingerprint;
      if (!link.has(to)) link.set(to, index ? checkOperatesLink(index, to, now, anchor) : ['pki.sgit.ai could not be read']);
      for (const m of link.get(to)) fail(m);
    }
    for (const m of checkScope(d, commits, { branch, repository })) fail(m);
  }
  return { errors, ids: [...cited.keys()] };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const a = process.argv.slice(2), opt = (n) => { const i = a.indexOf(`--${n}`); return i < 0 ? undefined : a[i + 1]; };
  const [cmd, before, after] = a;
  if (cmd !== 'ci' || !before || !after) { console.error('usage: node build/decisions.mjs ci <before> <after> [--branch dev] [--repository owner/name] [--index file.json]'); process.exit(2); }
  const branch = opt('branch') ?? process.env.GITHUB_REF_NAME, repository = opt('repository') ?? process.env.GITHUB_REPOSITORY;
  const needs = execFileSync('git', ['log', '--format=%(trailers:key=Decision,valueonly)', /^0+$/.test(before) ? after : `${before}..${after}`], { encoding: 'utf8' }).trim();
  let index;
  if (needs) {
    try { index = opt('index') ? JSON.parse(readFileSync(opt('index'), 'utf8')) : await (await fetch(INDEX_URL, { cache: 'no-store', signal: AbortSignal.timeout(20000) })).json(); }
    catch { index = undefined; } // fail closed: checkPush refuses without it
  }
  const r = await checkPush({ before, after, branch, repository, index });
  if (r.errors.length) { console.error(r.errors.join('\n')); console.error(`DECISION REFUSED (${r.errors.length})`); process.exit(1); }
  console.log(r.ids.length ? `DECISION OK: ${r.ids.join(', ')}` : 'DECISION OK: no commit cites a decision');
}
