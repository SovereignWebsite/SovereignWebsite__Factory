// Plan: compare org/repos.json with the organisation and write the actions needed.
// Without GH_TOKEN it plans as if no repository exists (dry plan, used on pull requests).
// Usage: node build/org-plan.mjs [out.json]   prints a Markdown plan, writes the plan JSON.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gh } from './github.mjs';
import { MANAGED, managedFor, staleFiles } from './managed.mjs';
import { load as loadRequests, repos as requestRepos } from './requests.mjs';

// The organisation as code plus one repository per hosted-site request.
export function withRequests(org, dir = 'requests') {
  const { requests, errors } = loadRequests(dir);
  if (errors.length) throw new Error(`requests: ${errors.join('; ')}`);
  return { ...org, repos: [...org.repos, ...requestRepos(requests)] };
}

export function wanted(org) {
  return org.repos.map((r) => ({ ...org.defaults, ...r }));
}

export function plan(org, live) {
  const actions = [], notes = [];
  for (const r of wanted(org)) {
    const l = live[r.name];
    // Renamed (Site__<label> to Site__<Group>__<Name>): rename it this run; the next run converges its settings.
    const was = !l && (r.aka || []).find((n) => live[n]);
    if (was) { actions.push({ action: 'repo.rename', target: was, to: r.name }); continue; }
    if (!l && r.transfer_from) continue; // a moved site: transfer-apply brings it, Org apply never creates it
    if (!l) {
      actions.push({ action: 'repo.create', target: r.name });
      actions.push({ action: 'branch.create_dev', target: r.name });
      actions.push({ action: 'repo.set_default_branch', target: r.name });
      if (r.pages) actions.push({ action: 'pages.enable', target: r.name });
      if (r.cname) actions.push({ action: 'pages.set_cname', target: r.name });
      if (r.seed) actions.push({ action: 'repo.seed', target: r.name });
      for (const [t, perm] of Object.entries(r.teams || {})) if (perm === 'push') actions.push({ action: 'team.grant_push', target: r.name, team: t });
      if (r.protect) actions.push({ action: 'repo.protect_branches', target: r.name });
      for (const [u, perm] of Object.entries(r.collaborators || {})) actions.push({ action: 'repo.invite_collaborator', target: r.name, user: u, permission: perm });
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
    // Managed files (build/managed.mjs): refreshed only from an earlier seeded version; a keeper's own change is kept and reported.
    // Gate (decisions.b, 24 Nov 2026): a site is refreshed only when org/repos.json names it in "refresh_managed", added
    // site by site after the survey and the keeper's warning. Absent or empty: no site is refreshed, only reported.
    if (r.seed && l.managed_shas) {
      const { stale, kept } = staleFiles(r.seed, l.managed_shas, undefined, r.vars || {});
      if (stale.length && !(org.refresh_managed || []).includes(r.name)) notes.push(`${r.name}: ${stale.join(', ')} is an earlier seeded version; refresh waits until org/repos.json lists it in refresh_managed`);
      else if (stale.length) actions.push({ action: 'repo.refresh_managed', target: r.name, files: stale, from: Object.fromEntries(stale.map((f) => [f, l.managed_shas[f]])) });
      for (const f of kept) notes.push(`${r.name}: ${f} differs from the seed and is not a version the IaC seeded; kept as the keeper made it`);
    }
    if (r.cname && l.cname !== r.cname) actions.push({ action: 'pages.set_cname', target: r.name });
    for (const [t, perm] of Object.entries(r.teams || {})) if (perm === 'push' && !(l.teams || {})[t]) actions.push({ action: 'team.grant_push', target: r.name, team: t });
    // A person a request names gets push only, by invitation; an unknown login is reported, never invited.
    for (const [u, perm] of Object.entries(r.collaborators || {})) {
      const have = (l.collaborators || {})[u.toLowerCase()];
      if (have) continue;
      if (l.unknown_users?.includes(u.toLowerCase())) { notes.push(`${r.name}: GitHub user ${u} not found, not invited`); continue; }
      actions.push({ action: 'repo.invite_collaborator', target: r.name, user: u, permission: perm });
    }
    if (r.protect && !l.protected) actions.push({ action: 'repo.protect_branches', target: r.name });
    if (r.cname && l.cname === r.cname && !l.https_enforced) {
      const st = l.cert_state;
      if (st === 'approved' || st === 'issued') actions.push({ action: 'pages.enforce_https', target: r.name });
      // A run by hand that names its repositories (ONLY_REPOS) with the nudge on re-saves the domain whatever the
      // pending state, since a certificate can sit in "new" or "authorization_pending" for hours (uk-driving-test.tool,
      // 24 to 25 Nov 2026). The schedule nudges only missing or failed certificates.
      else if ((process.env.NUDGE_MISSING === 'true' && (!st || !!process.env.ONLY_REPOS)) || ['errored', 'bad_authz', 'authorization_revoked', 'dns_changed', 'destroy_pending'].includes(st)) actions.push({ action: 'pages.nudge_certificate', target: r.name, state: st || 'none' });
    }
  }
  const names = new Set(org.repos.flatMap((r) => [r.name, ...(r.aka || [])]));
  const unlisted = Object.keys(live).filter((n) => !names.has(n));
  return { pipeline: 'org-apply', org: org.org, actions, unlisted, notes };
}

export function seedFiles(dir) {
  const out = [];
  const walk = (d) => { for (const e of readdirSync(d, { withFileTypes: true })) { const p = join(d, e.name); e.isDirectory() ? walk(p) : out.push(relative(dir, p)); } };
  if (existsSync(dir)) walk(dir);
  return out.sort();
}

// Only the repositories a run is about (ONLY_REPOS, from build/org-scope.mjs or by hand), with their old names (aka),
// so a scoped run reads those and nothing else. Without a list, the whole organisation (the full sweep).
export function scoped(org, only) {
  if (!only?.length) return org;
  const keep = new Set(only);
  return { ...org, repos: org.repos.filter((r) => keep.has(r.name)) };
}

export async function liveRepos(org, spec = {}, only = null) {
  const out = {};
  if (only) {
    for (const name of only) {
      const full = await gh('GET', `/repos/${org}/${name}`);
      if (full.status === 404) continue;
      if (full.status !== 200) throw new Error(`reading ${name}: HTTP ${full.status}`);
      out[full.data.name] = await describe(org, full.data, spec);
    }
    return out;
  }
  for (let page = 1; ; page++) {
    const r = await gh('GET', `/orgs/${org}/repos?per_page=100&page=${page}`);
    if (r.status !== 200) throw new Error(`listing repositories: HTTP ${r.status}`);
    for (const listed of r.data) {
      // The list endpoint leaves out the merge settings (delete_branch_on_merge, allow_*_merge), so every run saw
      // them as different and applied them again. The repository's own record has them.
      const full = await gh('GET', `/repos/${org}/${listed.name}`);
      const x = full.status === 200 ? { ...listed, ...full.data } : listed;
      out[x.name] = await describe(org, x, spec);
    }
    if (r.data.length < 100) break;
  }
  return out;
}

async function describe(org, x, spec) {
  const dev = await gh('GET', `/repos/${org}/${x.name}/branches/dev`);
  const want = spec[x.name] || {};
  let cname = null, seed_missing = [];
  let https_enforced = false, cert_state = null;
  if (x.has_pages) { const pg = await gh('GET', `/repos/${org}/${x.name}/pages`); cname = pg.data?.cname ?? null; https_enforced = !!pg.data?.https_enforced; cert_state = pg.data?.https_certificate?.state ?? null; }
  const rs = await gh('GET', `/repos/${org}/${x.name}/rulesets`);
  const names = new Set((Array.isArray(rs.data) ? rs.data : []).map((q) => q.name));
  const isProtected = names.has('main-locked') && names.has('dev-safe');
  const managed_shas = {};
  if (want.seed && dev.status === 200) for (const f of seedFiles(want.seed)) { const c = await gh('GET', `/repos/${org}/${x.name}/contents/${f}?ref=dev`); if (c.status === 404) seed_missing.push(f); else if (managedFor(want.seed).includes(f) && c.data?.sha) managed_shas[f] = c.data.sha; }
  const tm = await gh('GET', `/repos/${org}/${x.name}/teams`);
  const teams = Object.fromEntries((Array.isArray(tm.data) ? tm.data : []).map((t) => [t.slug, t.permission]));
  // Collaborators already there or invited, and named logins that do not exist on GitHub.
  const collaborators = {}, unknown_users = [];
  for (const u of Object.keys(want.collaborators || {})) {
    const ul = u.toLowerCase();
    const c = await gh('GET', `/repos/${org}/${x.name}/collaborators/${u}`);
    if (c.status === 204) { collaborators[ul] = 'member'; continue; }
    const inv = await gh('GET', `/repos/${org}/${x.name}/invitations?per_page=100`);
    if (Array.isArray(inv.data) && inv.data.some((i) => (i.invitee?.login || '').toLowerCase() === ul)) { collaborators[ul] = 'invited'; continue; }
    const usr = await gh('GET', `/users/${u}`);
    if (usr.status === 404) unknown_users.push(ul);
  }
  return { ...x, has_dev: dev.status === 200, cname, seed_missing, managed_shas, teams, https_enforced, cert_state, protected: isProtected, collaborators, unknown_users };
}

export function markdown(p) {
  const l = [`### Plan for ${p.org} (${p.actions.length} actions)${p.scope ? `, only ${p.scope.join(', ')}` : ', every repository'}`];
  for (const a of p.actions) l.push(`- \`${a.action}\` ${a.target}${a.fields ? ` (${a.fields.join(', ')})` : a.files ? ` (${a.files.join(', ')})` : a.team ? ` (${a.team})` : a.state ? ` (certificate ${a.state})` : a.to ? ` to ${a.to}` : a.user ? ` (${a.user}, ${a.permission})` : ''}`);
  if (!p.actions.length) l.push('- nothing to do');
  for (const n of p.notes || []) l.push(`- note: ${n}`);
  if (p.unlisted?.length) l.push(`\nNot in org/repos.json (reported, never deleted): ${p.unlisted.join(', ')}`);
  return l.join('\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const only = (process.env.ONLY_REPOS || '').split(',').map((x) => x.trim()).filter(Boolean);
  const org = scoped(withRequests(JSON.parse(readFileSync('org/repos.json', 'utf8'))), only);
  const names = only.length ? [...new Set(org.repos.flatMap((r) => [r.name, ...(r.aka || [])]))] : null;
  const live = process.env.GH_TOKEN ? await liveRepos(org.org, Object.fromEntries(wanted(org).map((r) => [r.name, r])), names) : {};
  const p = { ...plan(org, live), ...(only.length ? { scope: only } : {}) };
  if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify(p, null, 2));
  console.log(markdown(p));
}
