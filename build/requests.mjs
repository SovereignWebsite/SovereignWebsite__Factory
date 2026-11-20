// Hosted-site requests: requests/<date>__<label>/site.json becomes a repository and <label>[.<group>].sovereignweb.site.
// One request, one site: org-apply creates the repository from seed/site-template (Pages, domain, team, rulesets),
// dns-apply writes the CNAME. A request is merged to dev only with Dinis's merge (policy/abp.json: requests/**).
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const LABEL = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;
// Organisations a repository may be moved from (the ABP's transfer-apply limits name the repositories).
export const FROM_OWNERS = ['AgentiCCells'];
// Groups of sites under their own subdomain: <label>.<group>.sovereignweb.site. The official list (requests/README.md),
// agreed by Dinis on 20 Nov 2026 ~12:02 UTC: "I agree with, can you put that on our official guidance"; more will be added.
export const GROUPS = ['artist', 'cv', 'company', 'organisation', 'invest'];
// Kept only while a live site still uses it, until that site moves.
export const LEGACY_GROUPS = ['artists'];
// The starting page a request is seeded with: a public starter page, or a gated holding page that opens a vault.
export const ACCESS = { public: 'seed/site-template', vault: 'seed/gate-template' };
const RESERVED = new Set(['www', 'hub', 'vault', 'api', 'admin', 'mail', 'factory', ...GROUPS, ...LEGACY_GROUPS]);

// Domains a hosted site may sit under. sovereignweb.site is the default (Dinis, 20 Nov 2026 ~11:38 UTC:
// "a better domain ... than sovereignwebsite.site"; ~12:02 UTC: "sovereignweb.site is now fully configured").
// sovereignwebsite.site is kept for the sites that still use it, named in their requests.
export const DEFAULT_DOMAIN = 'sovereignweb.site';
export const DOMAINS = ['sovereignweb.site', 'sovereignwebsite.site'];
export const domain = (r) => r.domain || DEFAULT_DOMAIN;

// The address of a hosted site.
export const host = (r) => `${r.label}.${r.group ? `${r.group}.` : ''}${domain(r)}`;

export function validate(req, folder = '') {
  const e = [];
  if (!req || typeof req !== 'object') return [`${folder}: site.json is not an object`];
  if (!LABEL.test(req.label || '')) e.push(`${folder}: label must be lower-case letters, digits and hyphens, 1 to 40 characters`);
  if (RESERVED.has(req.label)) e.push(`${folder}: label ${req.label} is reserved`);
  if (folder && !folder.endsWith(`__${req.label}`)) e.push(`${folder}: folder must end with __${req.label}`);
  if (!req.title || req.title.length > 80) e.push(`${folder}: title is required, at most 80 characters`);
  if (!req.description || req.description.length > 200) e.push(`${folder}: description is required, at most 200 characters`);
  if (req.group !== undefined && !GROUPS.includes(req.group) && !LEGACY_GROUPS.includes(req.group)) e.push(`${folder}: group must be one of ${GROUPS.join(', ')}`);
  if (req.domain !== undefined && !DOMAINS.includes(req.domain)) e.push(`${folder}: domain must be one of ${DOMAINS.join(', ')}`);
  if (req.access !== undefined && !Object.hasOwn(ACCESS, req.access)) e.push(`${folder}: access must be one of ${Object.keys(ACCESS).join(', ')}`);
  if (!['demo', 'owner'].includes(req.kind)) e.push(`${folder}: kind must be "demo" or "owner"`);
  for (const ch of ['—', '–']) if (JSON.stringify(req).includes(ch)) e.push(`${folder}: no em or en dashes`);
  if (req.from !== undefined) {
    const f = req.from;
    if (!f || typeof f !== 'object') e.push(`${folder}: from must be an object`);
    else {
      if (!FROM_OWNERS.includes(f.owner)) e.push(`${folder}: from.owner must be one of ${FROM_OWNERS.join(', ')}`);
      if (!/^[A-Za-z0-9._-]{1,100}$/.test(f.repo || '')) e.push(`${folder}: from.repo must be a repository name`);
      if (f.address !== undefined && !/^[a-z0-9.-]+$/.test(f.address)) e.push(`${folder}: from.address must be a host name`);
    }
    if (req.signed !== undefined && typeof req.signed !== 'boolean') e.push(`${folder}: signed is true or false`);
    if (!['dry-run', 'real'].includes(req.apply)) e.push(`${folder}: a request with from needs apply "dry-run" or "real"`);
  } else if (req.apply !== undefined) e.push(`${folder}: apply is only for a request with from`);
  return e;
}

export function load(dir = 'requests') {
  const out = [], errors = [];
  if (!existsSync(dir)) return { requests: out, errors };
  for (const f of readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort()) {
    const p = join(dir, f, 'site.json');
    if (!existsSync(p)) { errors.push(`${f}: no site.json`); continue; }
    let req; try { req = JSON.parse(readFileSync(p, 'utf8')); } catch { errors.push(`${f}: site.json is not valid JSON`); continue; }
    const e = validate(req, f); if (e.length) { errors.push(...e); continue; }
    // A moved site: transfer.json records the move. Until it says moved, Org apply and DNS apply leave the request alone.
    let moved = false;
    const t = join(dir, f, 'transfer.json');
    if (req.from && existsSync(t)) { try { moved = JSON.parse(readFileSync(t, 'utf8')).state === 'moved'; } catch { errors.push(`${f}: transfer.json is not valid JSON`); continue; } }
    out.push({ ...req, folder: f, moved });
  }
  const seen = new Set();
  for (const r of out) { if (seen.has(r.label)) errors.push(`label ${r.label} requested twice`); seen.add(r.label); }
  return { requests: out, errors };
}

const repoName = (label) => `Site__${label}`;

// The sites Org apply and DNS apply look after: new ones, and moved ones once the move is recorded.
export const live = (requests) => requests.filter((r) => !r.from || r.moved);

export function repos(requests) {
  return live(requests).map((r) => ({
    name: repoName(r.label),
    description: `${host(r)}: ${r.description}`.slice(0, 350),
    homepage: `https://${host(r)}`,
    pages: true,
    cname: host(r),
    ...(r.from ? { transfer_from: `${r.from.owner}/${r.from.repo}` } : { seed: ACCESS[r.access || 'public'] }),
    vars: { label: r.label, host: host(r), title: r.title, description: r.description, kind: r.kind },
  }));
}

export function dnsRecords(requests) {
  return live(requests).map((r) => ({ zone: domain(r), name: host(r), type: 'CNAME', values: ['sovereignwebsite.github.io'], for: repoName(r.label) }));
}
