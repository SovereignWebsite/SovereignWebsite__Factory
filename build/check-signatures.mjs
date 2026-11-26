// Every commit is signed by its agent's own published key and names its session.
// Dinis Cruz, 18 November 2026 ~23:55 UTC (in cyber.b@PrompTugal.dinis's session), confirmed for every
// agent ~01:10 UTC 19 November (PrompTugal__News__Website board/guidance/2026-11-19-signed-commits-paid-search-and-free-embeds.md,
// section 2): "every single agent that runs in here should have published its public key on the repo that it maintains
// ... every then commit is signed by that key ... you should also include the session ID".
// Pattern: cyber.b@'s scripts/check-signatures.mjs in PrompTugal__News__Cyber (commit c8fff24, Apache-2.0, same team).
//
// Usage: node build/check-signatures.mjs <before> <after>   the range to check (run by plan.yml on pull requests)
// For each commit in before..after (merges and side branches included) that is not the commit that added this
// file or older than it:
//   1. it carries a git SSH signature that verifies against a key in its (first) PARENT's team/keys.json (status not
//      "superseded" or "retired"), never the keys in the commit itself: a new or rotated key is added by a commit signed with a
//      key already listed, or by a person (the commit that adds this check is reviewed and merged by Dinis);
//      or, the one exception, a commit by which an agent publishes its own key (policy/abp.json keys_rule: it adds exactly
//      one entry, its own, and changes nothing else in team/keys.json, checked by keysChange in build/abp.mjs) verifies
//      against that one new key only (Dinis, 22 Nov 2026: "it is the agents (when they start) that need to push their key");
//   2. the key's agent is the commit's one Agent: trailer;
//   3. its one Claude-Session: trailer is the session recorded with that key.
// No commit is exempt by its author or committer, which anyone can set. The factory's own workflow commits are on
// dev only and never in a pull request's range. One failure refuses the whole range (exit 1). In a pull request,
// pass the head commit, not GitHub's synthetic merge commit. Controls per security@'s ruling of 19 Nov 01:30 UTC.
// Both controls follow signals.b@'s review of this pattern (PrompTugal__News__Signals 0101639), relayed by conductor.b@.
// The OpenSSH form of each key is derived from its published PEM (bundle.sign) with ssh-keygen; nothing else is trusted.
// Needs git 2.34+ and ssh-keygen. Prints OK or each failing commit and exits 1. History is never rewritten.
import { execFileSync, spawnSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { keysChange } from './abp.mjs';

export const SELF = 'build/check-signatures.mjs';
const AGENT = /^[a-z0-9]+(?:[.-][a-z0-9]+)*@[a-z0-9.-]+$/i;
// A key signs new commits only while it is live. A retired key (its session finished) is refused for every commit whose
// parent already lists it as retired; commits made before that keep verifying against their own parent's keys. This uses
// the parent's tree, not a date, because commit dates are set by whoever makes the commit.
export const usable = (k) => k.status !== 'superseded' && k.status !== 'retired';
const lines = (s) => (s ? s.split('\n').map((x) => x.trim()).filter(Boolean) : []);
// Known commits that fail the rules and stay in history (history is never rewritten). Each entry is a full commit id,
// who made it and why it fails; only Dinis (or a decision under his delegation) adds one. A known commit is skipped only
// while it is an ancestor of main (block 2026-11-24__block-01, item 49); every other failure still fails.
export const KNOWN = {
  b7c8bfd79c263051d8e9ec35fe2cf70b59bf6e87: 'made in maestro.d (account-d)\'s session, 21 Nov 2026 22:14 UTC, carrying conductor.d\'s policy entry; trailer "Agent: maestro.d (account-d)", signed by a key never published in team/keys.json',
  '5eb7fdecd2ac785ee071848a474c6cbff5e1a389': 'made in maestro.d (account-d)\'s session, 21 Nov 2026 22:14 UTC, carrying conductor.d\'s public key (sent by conductor.d); trailer "Agent: maestro.d (account-d)", signed by a key never published in team/keys.json',
};
export const MAIN = 'refs/remotes/origin/main';

export function checkSignatures({ cwd = process.cwd(), before, after = 'HEAD' } = {}) {
  const git = (...a) => execFileSync('git', a, { cwd, encoding: 'utf8' }).trim();
  const tryGit = (...a) => { try { return git(...a); } catch { return null; } };
  const first = lines(git('log', '--format=%H', '--diff-filter=A', '--reverse', after, '--', SELF))[0];
  if (!first) return { errors: [`cannot find the commit that added ${SELF}`], checked: 0, skipped: 0 };
  const from = before && !/^0+$/.test(before) && tryGit('rev-parse', '--verify', '--quiet', `${before}^{commit}`);
  const range = lines(git('rev-list', ...(from ? [`${from}..${after}`] : [after])));
  // Out of scope: the commit that added this file (reviewed by a person) and everything older than it.
  const older = new Set(lines(git('rev-list', first)));
  const onMain = (c) => { try { execFileSync('git', ['merge-base', '--is-ancestor', c, MAIN], { cwd, stdio: 'ignore' }); return true; } catch { return false; } };
  const inScope = new Set(range.filter((c) => !older.has(c) && !(KNOWN[c] && onMain(c))));

  const dir = mkdtempSync(join(tmpdir(), 'sigcheck-'));
  const cache = new Map();
  // The allowed signers published in a commit's tree: { file, sessionOf }.
  const signersAt = (rev) => {
    const blob = tryGit('rev-parse', '--verify', '--quiet', `${rev}:team/keys.json`);
    if (!blob) return null;
    if (cache.has(blob)) return cache.get(blob);
    const doc = JSON.parse(git('cat-file', 'blob', blob));
    const r = signersFor(Array.isArray(doc) ? doc : doc.keys || []); cache.set(blob, r); return r;
  };
  // The allowed signers for a list of keys: { file, sessionOf }.
  const signersFor = (keys) => {
    const signers = [], sessionOf = new Map();
    for (const k of keys) {
      const agent = k.agent, pemText = k.bundle?.sign ?? k.public_key?.sign;
      if (!agent || !AGENT.test(agent) || !pemText || !usable(k)) continue;
      const pem = join(dir, `${seq}-${signers.length}.pem`); writeFileSync(pem, pemText);
      const ssh = execFileSync('ssh-keygen', ['-i', '-m', 'PKCS8', '-f', pem], { encoding: 'utf8' }).trim().split(' ').slice(0, 2).join(' ');
      signers.push(`${agent} namespaces="git" ${ssh}`);
      if (!sessionOf.has(agent)) sessionOf.set(agent, new Set());
      if (k.session) sessionOf.get(agent).add(k.session);
    }
    const file = join(dir, `allowed_signers_${seq++}`); writeFileSync(file, signers.join('\n') + '\n');
    return { file, sessionOf };
  };
  let seq = 0;

  try {
    const errors = []; let checked = 0;
    for (const c of range) {
      if (!inScope.has(c)) continue;
      checked++;
      const subject = git('log', '-1', '--format=%s', c);
      const parent = signersAt(`${c}^1`);
      if (!parent) { errors.push(`${c.slice(0, 7)} ${subject}: its parent has no team/keys.json`); continue; }
      const agents = lines(git('log', '-1', '--format=%(trailers:key=Agent,valueonly)', c));
      const sessions = lines(git('log', '-1', '--format=%(trailers:key=Claude-Session,valueonly)', c));
      const verify = (file) => spawnSync('git', ['-c', 'gpg.format=ssh', '-c', 'gpg.ssh.program=ssh-keygen', '-c', `gpg.ssh.allowedSignersFile=${file}`, 'verify-commit', c], { cwd, encoding: 'utf8' });
      let v = verify(parent.file), signers = parent;
      if (v.status !== 0) {
        // The one exception: the commit by which an agent publishes its own key, verified against that key alone.
        const show = (rev) => tryGit('show', `${rev}:team/keys.json`) || '{}';
        const own = agents.length === 1 && keysChange({ agent: agents[0], session: sessions[0], before: show(`${c}^1`), after: show(c) });
        if (own && !own.errors.length && own.added) { try { signers = signersFor([own.added]); v = verify(signers.file); } catch { /* an unreadable key verifies nothing */ } }
      }
      if (v.status !== 0) { errors.push(`${c.slice(0, 7)} ${subject}: no valid signature by a key in its parent's team/keys.json, nor by the one key it publishes for itself`); continue; }
      const principal = (`${v.stdout}\n${v.stderr}`.match(/Good "git" signature for (\S+)/) || [])[1];
      if (!principal || agents.length !== 1 || agents[0] !== principal) { errors.push(`${c.slice(0, 7)} ${subject}: signed by ${principal || 'unknown'}, Agent: ${agents.join(', ') || 'none'}`); continue; }
      if (sessions.length !== 1 || !(signers.sessionOf.get(principal) || new Set()).has(sessions[0])) errors.push(`${c.slice(0, 7)} ${subject}: Claude-Session: missing or not the session published with ${principal}'s key`);
    }
    return { errors, checked, skipped: range.length - checked };
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [before, after] = process.argv.slice(2);
  const r = checkSignatures({ before, after: after || 'HEAD' });
  if (r.errors.length) { console.error(r.errors.join('\n')); console.error(`FAILED (${r.errors.length} of ${r.checked} commits checked)`); process.exit(1); }
  console.log(`OK (${r.checked} signed commits checked, ${r.skipped} not after the check skipped)`);
}
