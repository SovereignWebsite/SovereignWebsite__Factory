// Plan: compare org/repos.json with the organisation and write the actions needed.
// Without GH_TOKEN it plans as if no repository exists (dry plan, used on pull requests).
// Usage: node build/org-plan.mjs [out.json]   prints a Markdown plan, writes the plan JSON.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gh } from './github.mjs';

export function wanted(org) {
  return org.repos.map((r) => ({ ...org.defaults, ...r }));
}

export function plan(org, live) {
  const actions = [];
  for (const r of wanted(org)) {
    const l = live[r.name];
    if (!l) {
      actions.push({ action: 'repo.create', target: r.name });
      actions.push({ action: 'branch.create_dev', target: r.name });
      actions.push({ action: 'repo.set_default_branch', target: r.name });
      if (r.pages) actions.push({ action: 'pages.enable', target: r.name });
      if (r.seed) actions.push({ action: 'repo.seed', target: r.name });
      if (r.cname) actions.push({ action: 'pages.set_cname', target: r.name });
      continue;
    }
    const diff = ['description', 'has_wiki', 'has_projects', 'delete_branch_on_merge', 'allow_merge_commit', 'allow_squash_merge', 'allow_rebase_merge', 'homepage'].filter((k) => r[k] !== undefined && (l[k] ?? null) !== (r[k] ?? null));
    if (diff.length) actions.push({ action: 'repo.update_settings', target: r.name, fields: diff });
    if (l.default_branch !== r.default_branch) {
      if (!l.has_dev) actions.push({ action: 'branch.create_dev', target: r.name });
      actions.push({ action: 'repo.set_default_branch', target: r.name });
    }
    if (r.pages && !l.has_pages) actions.push({ action: 'pages.enable', target: r.name });
    if (r.seed && l.seed_missing?.length) actions.push({ action: 'repo.seed', target: r.name, files: l.seed_missing });
    if (r.cname && l.cname !== r.cname) actions.push({ action: 'pages.set_cname', target: r.name });
  }
  const names = new Set(org.repos.map((r) => r.name));
  const unlisted = Object.keys(live).filter((n) => !names.has(n));
  return { pipeline: 'org-apply', org: org.org, actions, unlisted };
}

export function seedFiles(dir) {
  const out = [];
  const walk = (d) => { for (const e of readdirSync(d, { withFileTypes: true })) { const p = join(d, e.name); e.isDirectory() ? walk(p) : out.push(relative(dir, p)); } };
  if (existsSync(dir)) walk(dir);
  return out.sort();
}

export async function liveRepos(org, spec = {}) {
  const out = {};
  for (let page = 1; ; page++) {
    const r = await gh('GET', `/orgs/${org}/repos?per_page=100&page=${page}`);
    if (r.status !== 200) throw new Error(`listing repositories: HTTP ${r.status}`);
    for (const x of r.data) {
      const dev = await gh('GET', `/repos/${org}/${x.name}/branches/dev`);
      const want = spec[x.name] || {};
      let cname = null, seed_missing = [];
      if (x.has_pages) { const pg = await gh('GET', `/repos/${org}/${x.name}/pages`); cname = pg.data?.cname ?? null; }
      if (want.seed && dev.status === 200) for (const f of seedFiles(want.seed)) { const c = await gh('GET', `/repos/${org}/${x.name}/contents/${f}?ref=dev`); if (c.status === 404) seed_missing.push(f); }
      out[x.name] = { ...x, has_dev: dev.status === 200, cname, seed_missing };
    }
    if (r.data.length < 100) break;
  }
  return out;
}

export function markdown(p) {
  const l = [`### Plan for ${p.org} (${p.actions.length} actions)`];
  for (const a of p.actions) l.push(`- \`${a.action}\` ${a.target}${a.fields ? ` (${a.fields.join(', ')})` : a.files ? ` (${a.files.join(', ')})` : ''}`);
  if (!p.actions.length) l.push('- nothing to do');
  if (p.unlisted?.length) l.push(`\nNot in org/repos.json (reported, never deleted): ${p.unlisted.join(', ')}`);
  return l.join('\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const org = JSON.parse(readFileSync('org/repos.json', 'utf8'));
  const live = process.env.GH_TOKEN ? await liveRepos(org.org, Object.fromEntries(wanted(org).map((r) => [r.name, r]))) : {};
  const p = plan(org, live);
  if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify(p, null, 2));
  console.log(markdown(p));
}
