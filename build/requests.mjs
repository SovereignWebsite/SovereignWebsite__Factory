// Hosted-site requests: requests/<date>__<label>/site.json becomes a repository and <label>.sovereignwebsite.site.
// One request, one site: org-apply creates the repository from seed/site-template (Pages, domain, team, rulesets),
// dns-apply writes the CNAME. A request is merged to dev only with Dinis's merge (policy/abp.json: requests/**).
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const LABEL = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;
// Organisations a repository may be moved from (the ABP's transfer-apply limits name the repositories).
export const FROM_OWNERS = ['AgentiCCells'];
const RESERVED = new Set(['www', 'hub', 'vault', 'api', 'admin', 'mail', 'factory']);

export function validate(req, folder = '') {
  const e = [];
  if (!req || typeof req !== 'object') return [`${folder}: site.json is not an object`];
  if (!LABEL.test(req.label || '')) e.push(`${folder}: label must be lower-case letters, digits and hyphens, 1 to 40 characters`);
  if (RESERVED.has(req.label)) e.push(`${folder}: label ${req.label} is reserved`);
  if (folder && !folder.endsWith(`__${req.label}`)) e.push(`${folder}: folder must end with __${req.label}`);
  if (!req.title || req.title.length > 80) e.push(`${folder}: title is required, at most 80 characters`);
  if (!req.description || req.description.length > 200) e.push(`${folder}: description is required, at most 200 characters`);
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
    description: `${r.label}.sovereignwebsite.site: ${r.description}`.slice(0, 350),
    homepage: `https://${r.label}.sovereignwebsite.site`,
    pages: true,
    cname: `${r.label}.sovereignwebsite.site`,
    ...(r.from ? { transfer_from: `${r.from.owner}/${r.from.repo}` } : { seed: 'seed/site-template' }),
    vars: { label: r.label, title: r.title, description: r.description, kind: r.kind },
  }));
}

export function dnsRecords(requests) {
  return live(requests).map((r) => ({ name: `${r.label}.sovereignwebsite.site`, type: 'CNAME', values: ['sovereignwebsite.github.io'], for: repoName(r.label) }));
}
