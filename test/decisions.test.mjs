// Tests for build/decisions.mjs (record v2 and the CI check). Run from test/run.mjs.
import assert from 'node:assert/strict';
import { writeFileSync, mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { generateKeyPairSync, sign } from 'node:crypto';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import * as D from '../build/decisions.mjs';

const now = new Date('2026-11-23T15:00:00Z');
const rec = { v: 2, id: '2026-11-23__first-push', decided_by: 'Dinis Cruz', words: 'yes for me on those 6 factory commits', session: 'https://claude.ai/code/session_01AbC',
  event_uuid: '17473ce6-7416-42f1-bad8-aed1e97fc3fb', at: '2026-11-23T14:02:37Z', expires: '2026-11-24T14:02:37Z', recorded_by: 'decisions.t@SovereignWebsite.dinis', status: 'in-force',
  scope: { repository: 'SovereignWebsite/SovereignWebsite__IaC', branch: 'dev', paths: ['requests/**', 'seed/**'], commits: 2 } };
const withScope = (s) => ({ ...rec, scope: { ...rec.scope, ...s } });

// 1. The record itself
assert.deepEqual(D.validateRecord(rec, now), [], 'a well formed v2 record passes');
assert.ok(D.validateRecord({ ...rec, v: 1 }, now).length, 'only v2');
assert.ok(D.validateRecord({ ...rec, decided_by: 'conductor.b' }, now).length, 'only Dinis decides');
assert.ok(D.validateRecord({ ...rec, status: 'conditional' }, now).length, 'a conditional record is not in force');
assert.ok(D.validateRecord({ ...rec, event_uuid: undefined }, now).length, 'it names the event of his words');
assert.ok(D.validateRecord(rec, new Date('2026-11-25T00:00:00Z')).some((e) => e.includes('expired')), 'an expired record fails');
assert.ok(D.validateRecord({ ...rec, expires: '2026-12-10T00:00:00Z' }, now).length, 'no record lives more than a week');
assert.ok(D.validateRecord(withScope({ branch: 'main' }), now).length, 'no record covers main');
for (const p of ['policy/**', '.github/workflows/x.yml', 'team/keys.json', 'decisions/**', 'build/decisions.mjs', '**'])
  assert.ok(D.validateRecord(withScope({ paths: [p] }), now).length, `a record cannot cover ${p}`);
assert.ok(D.validateRecord(withScope({ commits: 0 }), now).length, 'it says how many commits');

// 2. Scope against the commits that cite it
const c = (sha, files, patchId = 'a'.repeat(40)) => ({ sha, files, patchId });
const where = { branch: 'dev', repository: 'SovereignWebsite/SovereignWebsite__IaC' };
assert.deepEqual(D.checkScope(rec, [c('1111111', ['requests/x/site.json']), c('2222222', ['seed/a'])], where), [], 'files in the globs are covered');
assert.ok(D.checkScope(rec, [c('1111111', ['build/x.mjs'])], where).length, 'a file outside the globs is not');
assert.ok(D.checkScope(rec, [c('1111111', ['requests/x']), c('2', ['seed/a']), c('3', ['seed/b'])], where).length, 'more commits than it covers');
assert.ok(D.checkScope(rec, [c('1111111', ['requests/x'])], { ...where, branch: 'main' }).length, 'never main');
assert.ok(D.checkScope(rec, [c('1111111', ['requests/x'])], { ...where, repository: 'SovereignWebsite/Other' }).length, 'another repository');
assert.ok(D.checkScope(withScope({ paths: ['requests/**'] }), [c('1111111', ['requests/x', 'policy/abp.json'])], where).length, 'the always-ask list wins');
assert.ok(D.checkScope(withScope({ patch_ids: ['b'.repeat(40)] }), [c('1111111', ['requests/x'])], where).length, 'an unlisted patch-id');

// 3. The operates link. Dinis's real anchor record cannot be a fixture (the leak scan keeps public keys to team/keys.json);
// it was checked by hand against the live register on 23 Nov 2026 at 14:11 UTC: the link to sha256:eefbe996d9c67a7c verifies.
// A made-up anchor, to test revocation (Dinis's private key is never here).
const anchor = generateKeyPairSync('ec', { namedCurve: 'P-256' });
const apem = anchor.publicKey.export({ type: 'spki', format: 'pem' }), afp = D.fingerprintOf(apem);
const st = (o) => { const s = { v: 1, registry: 'pki.sgit.ai', record: afp, signer: afp, ...o }; return { ...s, sig: sign('sha256', Buffer.from(`${D.canonical(s)}\n`), { key: anchor.privateKey, dsaEncoding: 'ieee-p1363' }).toString('base64') }; };
const ident = st({ type: 'identity', created_at: '2026-11-01T00:00:00Z', body: { kind: 'person', bundle: { v: 1, sign: apem, signing_fingerprint: afp } } });
const lnk = (to) => st({ type: 'link', created_at: '2026-11-23T10:00:00Z', body: { to, method: 'operates', on: '2026-11-23', until: '2026-11-25' } });
const { createHash } = await import('node:crypto');
const sid = (s) => `sha256:${createHash('sha256').update(`${D.canonical(s)}\n`).digest('hex')}`;

// 4. End to end: a repository, a recorder key, a signed record and commits that cite it
const dir = mkdtempSync(join(tmpdir(), 'decisions-test-'));
try {
  const git = (...a) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.org', '-c', 'commit.gpgsign=false', ...a], { cwd: dir, encoding: 'utf8' }).trim();
  execFileSync('ssh-keygen', ['-q', '-t', 'ecdsa', '-b', '256', '-N', '', '-C', 'test', '-f', join(dir, '..', `${dir.split('/').pop()}.key`)]);
  const keyFile = join(dir, '..', `${dir.split('/').pop()}.key`);
  const pem = execFileSync('ssh-keygen', ['-e', '-m', 'PKCS8', '-f', `${keyFile}.pub`], { encoding: 'utf8' });
  const kfp = D.fingerprintOf(pem);
  const L = lnk(kfp); // ECDSA signatures differ each time, so one link object throughout
  const index = { records: [{ fp: afp, revoked: null, statements: [ident, L] }] };
  assert.deepEqual(D.checkOperatesLink(index, kfp, now, afp), [], 'a signed link verifies');
  const revoked = { records: [{ ...index.records[0], statements: [ident, L, st({ type: 'revocation', created_at: '2026-11-23T11:00:00Z', body: { revokes: { record: afp, statement: sid(L) }, reason: 'withdrawn' } })] }] };
  assert.ok(D.checkOperatesLink(revoked, kfp, now, afp).length, 'a revoked link does not count');
  const edited = structuredClone(index); edited.records[0].statements[1].body.until = '2027-01-01';
  assert.ok(D.checkOperatesLink(edited, kfp, new Date('2026-12-01T00:00:00Z'), afp).length, 'an edited link does not verify');
  assert.ok(D.checkOperatesLink(index, kfp, new Date('2026-11-26T00:00:00Z'), afp).length, 'not after its until date');
  assert.ok(D.checkOperatesLink(index, kfp, now).length, 'only the pinned anchor counts');

  git('init', '-q', '-b', 'dev');
  const keys = { keys: [{ id: 't', agent: rec.recorded_by, status: 'active', signing_fingerprint: kfp, bundle: { v: 1, sign: pem } }] };
  mkdirSync(join(dir, 'team')); writeFileSync(join(dir, 'team/keys.json'), JSON.stringify(keys)); git('add', '.'); git('commit', '-qm', 'keys');
  const base = git('rev-parse', 'HEAD');
  const put = (r) => {
    mkdirSync(join(dir, 'decisions'), { recursive: true }); const f = join(dir, `decisions/${r.id}.json`);
    writeFileSync(f, `${JSON.stringify(r, null, 2)}\n`);
    execFileSync('ssh-keygen', ['-q', '-Y', 'sign', '-f', keyFile, '-n', D.NAMESPACE, f]);
    git('add', '.'); git('commit', '-qm', `record ${r.id}`);
  };
  const work = (file, id) => { mkdirSync(join(dir, file, '..'), { recursive: true }); writeFileSync(join(dir, file), file); git('add', '.'); git('commit', '-qm', `w ${file}`, '-m', `Decision: ${id}`); };
  put(rec); work('requests/a/site.json', rec.id); work('seed/b', rec.id);
  { const { scanText } = await import('../build/leak-scan.mjs'); const { readFileSync } = await import('node:fs');
    const sig = readFileSync(join(dir, `decisions/${rec.id}.json.sig`), 'utf8');
    assert.deepEqual(scanText(`decisions/${rec.id}.json.sig`, sig), [], 'a decision signature passes the leak scan');
    assert.ok(scanText('docs/x.sig', sig).length, 'the same block anywhere else is still flagged');
    assert.ok(scanText(`decisions/${rec.id}.json.sig`, `${sig}${['to', 'ken'].join('')} = ${(await import('node:crypto')).randomBytes(30).toString('base64')}\n`).length, 'anything beside the block is scanned'); }
  const run = (over = {}) => D.checkPush({ cwd: dir, before: base, after: git('rev-parse', 'HEAD'), branch: 'dev', repository: rec.scope.repository, now, index, anchor: afp, ...over });
  assert.deepEqual((await run()).errors, [], 'a signed, in-scope record passes');
  // the real check pins Dinis's anchor; here the made-up one stands in for it
  assert.ok((await run({ index: undefined })).errors.some((e) => e.includes('could not be read')), 'no register, no pass (fail closed)');
  assert.ok((await run({ branch: 'main' })).errors.length, 'never main');
  assert.ok((await run({ now: new Date('2026-11-25T00:00:00Z') })).errors.length, 'expired');
  const top = git('rev-parse', 'HEAD');
  assert.ok((await D.checkPush({ cwd: dir, before: top, after: top, branch: 'dev', now, index, anchor: afp })).errors.length === 0, 'nothing cites a decision: nothing to check');
  work('build/x.mjs', rec.id);
  assert.ok((await run()).errors.some((e) => e.includes('outside')), 'a third commit, outside the globs, is refused');
  git('reset', '-q', '--hard', top);
  work('requests/c', rec.id);
  assert.ok((await run({ before: top })).errors.some((e) => e.includes('already used')), 'a record is used once');
  git('reset', '-q', '--hard', top);
  writeFileSync(join(dir, `decisions/${rec.id}.json`), `${JSON.stringify({ ...rec, scope: { ...rec.scope, paths: ['**/*'] } }, null, 2)}\n`); git('commit', '-qam', 'edit');
  assert.ok((await run()).errors.some((e) => e.includes('signature')), 'an edited record does not verify');
  git('reset', '-q', '--hard', top);
  work('requests/d', '2026-11-23__nobody');
  assert.ok((await run()).errors.some((e) => e.includes('not committed')), 'a cited record must be committed');
} finally { rmSync(dir, { recursive: true, force: true }); rmSync(`${dir}.key`, { force: true }); rmSync(`${dir}.key.pub`, { force: true }); }
// the real check uses the pinned anchor, not a test one
assert.equal(D.ANCHOR, 'sha256:db7f79fdd87e030a');
