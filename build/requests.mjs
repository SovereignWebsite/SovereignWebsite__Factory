// Hosted-site requests: requests/<date>__<label>/site.json becomes a repository and <label>[.<group>].sovereignweb.site.
// One request, one site: org-apply creates the repository from seed/site-template (Pages, domain, team, rulesets),
// dns-apply writes the CNAME. A request is merged to dev only with Dinis's merge (policy/abp.json: requests/**).
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// Public requests filed on or after this date must name a keeper and a design reviewer.
export const KEEPER_RULE_FROM = '2026-11-25';
export const LABEL = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;
// Organisations a repository may be moved from (the ABP's transfer-apply limits name the repositories).
export const FROM_OWNERS = ['AgentiCCells'];
// Groups of sites under their own subdomain: <label>.<group>.sovereignweb.site. The official list (requests/README.md),
// agreed by Dinis on 20 Nov 2026 ~12:02 UTC: "I agree with, can you put that on our official guidance"; more will be added.
export const GROUPS = ['artist', 'cv', 'company', 'organisation', 'invest', 'agents', 'designer', 'tool', 'founder', 'startups', 'demo', 'provider', 'talent', 'author', 'platform', 'frameworks', 'presentations', 'manager', 'services', 'sport', 'business', 'template', 'history'];
// Kept only while a live site still uses it, until that site moves.
export const LEGACY_GROUPS = ['artists'];
export const NO_GROUP = {
  agents: "the agents area's own index page, agents.sovereignweb.site",
  'google-maps': 'held at its old address until its Maps key lists the new one (Dinis, 20 Nov 2026)',
  presentations: "the presentations product's own home and shared code, presentations.sovereignweb.site (Dinis, 23 Nov 2026)",
  review: 'design review as a service, review.sovereignweb.site (block 2026-11-24__block-03)',
};
// The starting page a request is seeded with: a public starter page, or a gated holding page that opens a vault.
export const ACCESS = { public: 'seed/site-template', vault: 'seed/gate-template' };
const RESERVED = new Set(['www', 'hub', 'vault', 'api', 'admin', 'mail', 'factory', ...GROUPS, ...LEGACY_GROUPS]);

// Domains a hosted site may sit under. sovereignweb.site is the default (Dinis, 20 Nov 2026 ~11:38 UTC:
// "a better domain ... than sovereignwebsite.site"; ~12:02 UTC: "sovereignweb.site is now fully configured").
// sovereignwebsite.site is kept for the sites that still use it, named in their requests.
export const DEFAULT_DOMAIN = 'sovereignweb.site';
export const DOMAINS = ['sovereignweb.site', 'sovereignwebsite.site'];
export const domain = (r) => r.domain || DEFAULT_DOMAIN;

// The domain an address sits under, if it is one of ours.
export const zoneOf = (h) => DOMAINS.find((d) => h.endsWith(`.${d}`)) || null;

// The address of a hosted site.
// A third-party tool names its provider: <service>.<provider>.tool (Dinis, 22 Nov 2026: "gmail.google.tool"; "use pybot.huggingface.tool").
// An organisation's chapter names its parent the same way: <chapter>.<parent>.organisation (Dinis, 24 Nov 2026, in
// sites.a's session: "london.agentics-foundation.organisation"), so one parent can hold several cities.
// An author's work names its author the same way: <work>.<author>.author (Dinis, 25 Nov 2026 01:44 UTC, in sites.a's
// session: "title.dinis.author.sws"), so one author can hold several books.
// A sport's coach or club names the sport: <name>.<sport>.sport (Dinis, 25 Nov 2026 02:14 UTC, in sites.a's session:
// "what about sport, paddle, Oscar as a category ... you can have other sports").
export const PROVIDER_GROUPS = ['tool', 'organisation', 'author', 'sport', 'template'];
// A template's provider is the area it is a template for, which is a group name (Dinis, 25 Nov 2026:
// "Site__Template__Business__Moving-Van ... we could have templates for other types of areas and types of sites").
export const host = (r) => `${r.label}.${r.provider ? `${r.provider}.` : ''}${r.group ? `${r.group}.` : ''}${domain(r)}`;

export function validate(req, folder = '') {
  const e = [];
  if (!req || typeof req !== 'object') return [`${folder}: site.json is not an object`];
  if (!LABEL.test(req.label || '')) e.push(`${folder}: label must be lower-case letters, digits and hyphens, 1 to 40 characters`);
  // Reserved names guard the top level only; a group's own home page (label = group, no group) is allowed.
  if (!req.group && RESERVED.has(req.label) && !GROUPS.includes(req.label)) e.push(`${folder}: label ${req.label} is reserved`);
  if (folder && !folder.endsWith(`__${req.label}`)) e.push(`${folder}: folder must end with __${req.label}`);
  if (!req.title || req.title.length > 80) e.push(`${folder}: title is required, at most 80 characters`);
  if (!req.description || req.description.length > 200) e.push(`${folder}: description is required, at most 200 characters`);
  // Every site has a group (Dinis, 20 Nov 2026 ~21:05 UTC: "Everything should have a group for now"), but for the two
  // named here: a group's own index page, and a site held where it is.
  if (req.group === undefined && !NO_GROUP[req.label]) e.push(`${folder}: a site needs a group (one of ${GROUPS.join(', ')})`);
  if (req.group !== undefined && !GROUPS.includes(req.group) && !LEGACY_GROUPS.includes(req.group)) e.push(`${folder}: group must be one of ${GROUPS.join(', ')}`);
  // repo_label: the label's own capitals in the repository name, same letters (Dinis, 22 Nov 2026: "should be Site__Platform__AWS").
  if (req.repo_label !== undefined && (typeof req.repo_label !== 'string' || !/^[A-Za-z0-9-]+$/.test(req.repo_label) || req.repo_label.toLowerCase() !== req.label)) e.push(`${folder}: repo_label must be the label's own letters, only the capitals changed`);
  if (req.provider !== undefined && (!PROVIDER_GROUPS.includes(req.group) || typeof req.provider !== 'string' || !/^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/.test(req.provider) || (RESERVED.has(req.provider) && !(req.group === 'template' && GROUPS.includes(req.provider))))) e.push(`${folder}: provider is the third party's name in lower case (letters, digits, hyphens), for a tool site, the parent of an organisation's chapter, the author of an author's work, or the sport of a coach or club`);
  if (req.domain !== undefined && !DOMAINS.includes(req.domain)) e.push(`${folder}: domain must be one of ${DOMAINS.join(', ')}`);
  // design.b's brief for the site's first build (block 2026-11-24__block-03): optional when the request lands, so the
  // repository is never held up; the keeper's first real build waits for it, and Org status lists requests without one.
  if (req.design_brief !== undefined && (typeof req.design_brief !== 'string' || !/^https:\/\/(design\.agents\.sovereignweb\.site\/\S+|github\.com\/SovereignWebsite\/Site__Agents?__Design\/blob\/dev\/docs\/briefs\/[A-Za-z0-9._-]+\.md)$/.test(req.design_brief))) e.push(`${folder}: design_brief is the link to design.b's brief: a docs/briefs/<name>.md in Site__Agents__Design, or a page on https://design.agents.sovereignweb.site/`);
  if (req.previous !== undefined) {
    if (!Array.isArray(req.previous) || !req.previous.length) e.push(`${folder}: previous is a list of the site's old addresses`);
    else for (const p of req.previous) {
      if (typeof p !== 'string' || !/^[a-z0-9.-]+$/.test(p) || !zoneOf(p)) e.push(`${folder}: previous address ${p} is not on one of our domains`);
      else if (p === host(req)) e.push(`${folder}: previous address ${p} is the site's own address`);
    }
  }
  // Every public site has a keeper and design rounds from the start (Dinis, 24 Nov 2026 ~22:41 UTC, in a.maestro's
  // session: "every website that we create that has a public element always has a keeper, at least to do a couple
  // rounds in the beginning, and actually should also have the design element to this"). Required for public requests
  // filed from 2026-11-25; agent sites are their own keeper.
  const AGENT_NAME = /^[a-z0-9.-]+@[A-Za-z0-9.-]+$/;
  for (const k of ['keeper', 'design']) if (req[k] !== undefined && (typeof req[k] !== 'string' || !AGENT_NAME.test(req[k]))) e.push(`${folder}: ${k} must be an agent name, <role>@<Project>.<owner>`);
  const filed = (folder.match(/^(\d{4}-\d{2}-\d{2})__/) || [])[1];
  if (filed && filed >= KEEPER_RULE_FROM && req.access !== 'vault' && req.group !== 'agents' && !req.from) for (const k of ['keeper', 'design']) if (req[k] === undefined) e.push(`${folder}: a public site names its ${k} (requests/README.md, "Keeper and design")`);
  // An agent home: Site__Agent__<Role>__<Provider>__<Number>, its label <role>-<provider>-<number>.
  if (req.home !== undefined) {
    const h = req.home;
    if (!h || typeof h !== 'object' || Array.isArray(h)) e.push(`${folder}: home is { "role", "provider", "number" }`);
    else {
      if (req.group !== 'agents') e.push(`${folder}: an agent home is in the agents group`);
      if (typeof h.role !== 'string' || !/^[a-z][a-z0-9-]{0,30}$/.test(h.role)) e.push(`${folder}: home.role is the role in lower case (letters, digits, hyphens)`);
      if (h.role_label !== undefined && (typeof h.role_label !== 'string' || !/^[A-Za-z0-9-]+$/.test(h.role_label) || h.role_label.toLowerCase() !== h.role)) e.push(`${folder}: home.role_label must be the role's own letters, only the capitals changed`);
      if (!HOME_PROVIDERS[h.provider]) e.push(`${folder}: home.provider is one of ${Object.keys(HOME_PROVIDERS).join(', ')}`);
      if (!Number.isInteger(h.number) || h.number < 1 || h.number > 999) e.push(`${folder}: home.number is the account number, 1 to 999`);
      if (typeof h.role === 'string' && HOME_PROVIDERS[h.provider] && Number.isInteger(h.number) && req.label !== homeLabel(h)) e.push(`${folder}: an agent home's label is ${homeLabel(h)}`);
    }
  }
  if (req.keep_address !== undefined && (req.keep_address !== true || !req.from || !req.from.address)) e.push(`${folder}: keep_address is only ever true, on a moved site with from.address`);
  if (req.pages !== undefined && req.pages !== false) e.push(`${folder}: pages is only ever false (no website, no custom domain, no DNS record)`);
  if (req.pages === false && req.group !== 'agents') e.push(`${folder}: only an agent home goes without a website`);
  // Old repository names Org apply may rename from (it refuses any other rename, build/org-apply.mjs).
  if (req.aka !== undefined && (!Array.isArray(req.aka) || !req.aka.every((n) => typeof n === 'string' && /^(Site|Redirect)__[A-Za-z0-9-]+(__[A-Za-z0-9-]+)*$/.test(n)))) e.push(`${folder}: aka is a list of old repository names, Site__... or Redirect__...`);
  if (req.agent !== undefined) {
    if (!/^[a-z0-9.-]+@[A-Za-z0-9.-]+$/.test(req.agent)) e.push(`${folder}: agent must be <role>@<Project>.<owner>`);
    if (req.group !== 'agents') e.push(`${folder}: an agent's site is in the agents group`);
    if (req.access !== undefined) e.push(`${folder}: an agent's site is public`);
  }
  if (req.collaborators !== undefined) {
    const c = req.collaborators;
    if (!c || typeof c !== 'object' || Array.isArray(c)) e.push(`${folder}: collaborators is { "<GitHub login>": "push" }`);
    else for (const [u, perm] of Object.entries(c)) {
      if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(u)) e.push(`${folder}: collaborator ${u} is not a GitHub login`);
      if (perm !== 'push') e.push(`${folder}: collaborator ${u} may only have push (write)`);
    }
  }
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
  // A label may be used in several groups, so one label finds all of a person's sites (Dinis, 23 Nov 2026: "allow labels
  // to be used in different groups ... that label will allow me to find all dinis-cruz related sites"). The address and
  // the repository name stay unique.
  const seenHost = new Map(), seenRepo = new Map();
  for (const r of out) {
    const h = host(r), n = repoName(r);
    if (seenHost.has(h)) errors.push(`${r.folder}: ${h} is already requested by ${seenHost.get(h)}`); else seenHost.set(h, r.folder);
    if (seenRepo.has(n)) errors.push(`${r.folder}: ${n} is already requested by ${seenRepo.get(n)}`); else seenRepo.set(n, r.folder);
  }
  return { requests: out, errors };
}

// Repository names are indexed by type, capitalised (Dinis, 20 Nov 2026 ~12:28 UTC: "the repo should be
// Site__Organisation__Algarve-Evolution, Site__Artist__Emily-Cruz (note the capitalisation on the names)").
// A site without a group is Site__<Name>. The old name, Site__<label>, is kept as aka so Org apply renames it.
export const GROUP_NAMES = { artist: 'Artist', cv: 'CV', company: 'Company', organisation: 'Organisation', invest: 'Invest', agents: 'Agent', designer: 'Designer', tool: 'Tool', founder: 'Founder', startups: 'Startups', demo: 'Demo', provider: 'Provider', talent: 'Talent', author: 'Author', platform: 'Platform', frameworks: 'Frameworks', artists: 'Artist' , presentations: 'Presentations', manager: 'Manager', services: 'Services', sport: 'Sport', business: 'Business', template: 'Template', history: 'History' };
export const cap = (label) => label.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('-');
const suffix = (r) => `${r.group ? `${GROUP_NAMES[r.group]}__` : ''}${r.provider ? `${cap(r.provider)}__` : ''}${r.repo_label || cap(r.label)}`;
// Per-account agent homes (Dinis, 25 Nov 2026, relayed by a.maestro: one repository per role per account,
// Site__Agent__<Role>__<Provider>__<Number>, each segment one meaning, preferably no custom domain). The provider is a
// platform from this list, written with its own capitals; its account code (cl-N, gpt-N, ...) starts the agent ids.
export const HOME_PROVIDERS = { claude: { name: 'Claude', code: 'cl' }, chatgpt: { name: 'ChatGPT', code: 'gpt' }, mistral: { name: 'Mistral', code: 'mi' }, gemini: { name: 'Gemini', code: 'gem' } };
const homeName = (h) => `Site__Agent__${h.role_label || cap(h.role)}__${HOME_PROVIDERS[h.provider].name}__${h.number}`;
export const homeLabel = (h) => `${h.role}-${h.provider}-${h.number}`;
export const repoName = (r) => (r.home ? homeName(r.home) : `Site__${suffix(r)}`);
// A site with "pages": false has no website: no Pages, no custom domain, no DNS record. Its address names the repository.
export const hasPages = (r) => r.pages !== false;
export const where = (r) => (hasPages(r) ? host(r) : `github.com/SovereignWebsite/${repoName(r)}`);
const aka = (name, ...old) => { const a = [...new Set(old)].filter((o) => o !== name); return a.length ? { aka: a } : {}; };

// The sites Org apply and DNS apply look after: new ones, and moved ones once the move is recorded.
export const live = (requests) => requests.filter((r) => !r.from || r.moved);

// A moved address keeps working: each old address gets a small redirect site, Redirect__<label>, sending every path
// (and its query and #fragment, so a vault key still opens) to the new address. Listed after every site, so Org apply
// frees the old custom domain on Site__<label> before it gives it to the redirect.
// A label used by more than one request: its bare old names (Site__<label>, Redirect__<label>) could belong to either
// site, so neither claims them as aka and Org apply renames nothing by them.
const shared = (requests) => { const c = {}; for (const r of requests) c[r.label] = (c[r.label] || 0) + 1; return (label) => c[label] > 1; };

export function redirects(requests) {
  const isShared = shared(requests);
  return live(requests).flatMap((r) => (r.previous || []).map((from, i) => {
    const n = i ? `-${i + 1}` : '';
    return { from, to: host(r), label: r.label, name: `Redirect__${suffix(r)}${n}`, old: isShared(r.label) ? [] : [`Redirect__${r.label}${n}`, `Redirect__${cap(r.label)}${n}`] };
  }));
}

export function repos(requests) {
  return [...sites(requests), ...redirects(requests).map((x) => ({
    name: x.name,
    ...aka(x.name, ...x.old),
    description: `${x.from}: moved to https://${x.to}`,
    homepage: `https://${x.to}`,
    pages: true,
    cname: x.from,
    seed: 'seed/redirect-template',
    vars: { from: x.from, to: x.to, label: x.label },
  }))];
}

function sites(requests) {
  const isShared = shared(requests);
  return live(requests).map((r) => ({
    name: repoName(r),
    // Agent homes are singular, Site__Agent__<Name> (Dinis, 22 Nov 2026 ~17:05 UTC: "It's not agents, it's agent"); the plural is kept as aka so Org apply renames.
    ...aka(repoName(r), ...(isShared(r.label) || r.home ? [] : [`Site__${r.label}`, `Site__${cap(r.label)}`]), ...(r.group === 'agents' && !r.home ? [`Site__Agents__${r.repo_label || cap(r.label)}`] : []), ...(r.aka || [])),
    description: `${where(r)}: ${r.description}`.slice(0, 350),
    // A moved site may keep its old address for a while ("keep_address": true): Pages stays on from.address while the new
    // address's DNS record is added ahead of time, and the domain switches when the request drops the flag (a
    // certificate slot free under Let's Encrypt's weekly limit; Mondweep's site, 25 Nov 2026).
    ...(hasPages(r) ? { homepage: `https://${r.keep_address ? r.from.address : host(r)}`, pages: true, cname: r.keep_address ? r.from.address : host(r) } : { pages: false }),
    ...(r.from ? { transfer_from: `${r.from.owner}/${r.from.repo}` } : { seed: !hasPages(r) ? 'seed/home-template' : r.agent ? 'seed/agent-template' : ACCESS[r.access || 'public'] }),
    ...(r.collaborators ? { collaborators: r.collaborators } : {}),
    vars: { label: r.label, repo: repoName(r), host: where(r), title: r.title, description: r.description, kind: r.kind, ...(r.agent ? { agent: r.agent } : {}) },
  }));
}

export function dnsRecords(requests) {
  return [
    ...live(requests).filter(hasPages).map((r) => ({ zone: domain(r), name: host(r), type: 'CNAME', values: ['sovereignwebsite.github.io'], for: repoName(r) })),
    ...redirects(requests).map((x) => ({ zone: zoneOf(x.from), name: x.from, type: 'CNAME', values: ['sovereignwebsite.github.io'], for: x.name })),
  ];
}
