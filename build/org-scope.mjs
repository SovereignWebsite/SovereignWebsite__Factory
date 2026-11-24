// Which repositories a push to dev is about, so Org apply plans and acts on only those (Dinis, 24 Nov 2026
// in a.factory's session: "keep it focused on the actions that I'm working on and reviewing"). Every repository in the
// organisation is read only by the full sweep: by hand with no repos named, and on the schedule (every sixth hour).
// Before this, each push and each hour read every repository (about 6 calls each, plus one per seed file), and the
// App's hourly API limit ran out (Org apply runs 45303564742 and 45303739269, 24 Nov 2026 01:15 UTC).
//
// A push names a repository when it adds or changes requests/<folder>/site.json (or transfer.json): the site's
// repository and its redirect sites. It also names a repository when it adds or changes that repository's entry in
// org/repos.json. A removed request names nothing: the pipeline never deletes. policy/**, seed/** and the rest name
// nothing; the full sweep picks them up.
// Usage: node build/org-scope.mjs <before> <after>   prints the names, comma separated (empty: nothing in scope).
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { load, repos, repoName, host } from './requests.mjs';

export function scope({ changed, requests, orgBefore, orgAfter }) {
  const names = new Set();
  const folders = new Set(changed.map((f) => f.match(/^requests\/([^/]+)\/(site|transfer)\.json$/)?.[1]).filter(Boolean));
  const all = repos(requests);
  for (const r of requests.filter((x) => folders.has(x.folder))) {
    const name = repoName(r);
    for (const x of all) if (x.name === name || x.homepage === `https://${host(r)}`) names.add(x.name);
  }
  if (changed.includes('org/repos.json')) {
    const was = Object.fromEntries((orgBefore?.repos || []).map((r) => [r.name, JSON.stringify(r)]));
    for (const r of orgAfter?.repos || []) if (was[r.name] !== JSON.stringify(r)) names.add(r.name);
  }
  return [...names].sort();
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [before, after = 'HEAD'] = process.argv.slice(2);
  const git = (...a) => execFileSync('git', a, { encoding: 'utf8' }).trim();
  const changed = git('diff', '--name-only', before, after).split('\n').filter(Boolean);
  const show = (rev) => { try { return JSON.parse(git('show', `${rev}:org/repos.json`)); } catch { return { repos: [] }; } };
  const { requests, errors } = load('requests');
  if (errors.length) throw new Error(`requests: ${errors.join('; ')}`);
  console.log(scope({ changed, requests, orgBefore: show(before), orgAfter: JSON.parse(readFileSync('org/repos.json', 'utf8')) }).join(','));
}
