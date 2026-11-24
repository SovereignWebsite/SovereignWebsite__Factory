// Managed seed files: the few files Org apply may bring up to date in a site that already exists.
// repo.seed only adds missing files and never overwrites. A managed file is replaced only when the site's copy is
// exactly an earlier version the IaC itself seeded (its git blob id is in seed/managed-history.json), so a keeper's
// own change is never overwritten: it is reported instead. Source: conductor.b, 24 Nov 2026 00:22 UTC, so that
// aef6bcc (site-published keys) reaches every existing site; needs Dinis's yes (policy/abp.json, org-apply).
// Usage: node build/managed.mjs record    adds the current seed versions to the history (run after changing one)
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const MANAGED = ['.github/ci/signers.mjs'];
export const HISTORY = 'seed/managed-history.json';
// The id git gives a file's content (what the contents API returns as sha).
export const blobSha = (buf) => createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${buf.length}\0`), buf])).digest('hex');
export const history = (file = HISTORY) => (existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')).versions : {});

// repoShas: { path: blob sha on the site's dev } for the managed files it has. Returns { stale, kept }.
export function staleFiles(seedDir, repoShas, hist = history()) {
  const stale = [], kept = [];
  for (const f of MANAGED) {
    const p = join(seedDir, f);
    if (!existsSync(p) || !repoShas[f]) continue;
    const cur = blobSha(readFileSync(p));
    if (repoShas[f] === cur) continue;
    if ((hist[f] || []).includes(repoShas[f])) stale.push(f); else kept.push(f);
  }
  return { stale, kept };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv[2] !== 'record') { console.error('usage: node build/managed.mjs record'); process.exit(2); }
  const h = history();
  for (const d of readdirSync('seed')) for (const f of MANAGED) {
    const p = join('seed', d, f); if (!existsSync(p)) continue;
    const s = blobSha(readFileSync(p)); h[f] = h[f] || []; if (!h[f].includes(s)) h[f].push(s);
  }
  writeFileSync(HISTORY, JSON.stringify({ about: 'Every version of each managed seed file the IaC has seeded (git blob ids). build/managed.mjs.', versions: h }, null, 2) + '\n');
  console.log(`recorded: ${Object.entries(h).map(([f, v]) => `${f} ${v.length}`).join(', ')}`);
}
