// Hosted-site requests: requests/<date>__<label>/site.json becomes a repository and <label>.sovereignwebsite.site.
// One request, one site: org-apply creates the repository from seed/site-template (Pages, domain, team, rulesets),
// dns-apply writes the CNAME. A request is merged to dev only with Dinis's merge (policy/abp.json: requests/**).
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const LABEL = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;
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
    out.push({ ...req, folder: f });
  }
  const seen = new Set();
  for (const r of out) { if (seen.has(r.label)) errors.push(`label ${r.label} requested twice`); seen.add(r.label); }
  return { requests: out, errors };
}

const repoName = (label) => `Site__${label}`;

export function repos(requests) {
  return requests.map((r) => ({
    name: repoName(r.label),
    description: `${r.label}.sovereignwebsite.site: ${r.description}`.slice(0, 350),
    homepage: `https://${r.label}.sovereignwebsite.site`,
    pages: true,
    cname: `${r.label}.sovereignwebsite.site`,
    seed: 'seed/site-template',
    vars: { label: r.label, title: r.title, description: r.description, kind: r.kind },
  }));
}

export function dnsRecords(requests) {
  return requests.map((r) => ({ name: `${r.label}.sovereignwebsite.site`, type: 'CNAME', values: ['sovereignwebsite.github.io'], for: repoName(r.label) }));
}
