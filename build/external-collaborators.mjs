// Collaborators on repositories outside the SovereignWebsite organisation, from org/external-collaborators.json.
// Only adds a listed login, with push (write), on a listed repository; never removes, never lowers a role, never admin or maintain.
// Every grant must also be listed in policy/abp.json (pipeline external-collaborators, limits.grants).
// Usage:
//   node build/external-collaborators.mjs check            offline: the list is well formed and allowed by the policy
//   node build/external-collaborators.mjs apply <owner>    plan against GitHub for that owner's grants, check, then apply
//                                                          (GH_TOKEN: an App installation token for that owner)
// Prints no secret.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { gh } from './github.mjs';
import { load, validate, checkActions } from './abp.mjs';

export const PIPELINE = 'external-collaborators';
const LOGIN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const REPO = /^[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/;

export const loadList = (file = 'org/external-collaborators.json') => JSON.parse(readFileSync(file, 'utf8'));

// The list's own shape.
export function validateList(list) {
  const e = [];
  if (!Array.isArray(list?.grants)) return ['grants missing'];
  for (const g of list.grants) {
    if (!REPO.test(g.repository || '')) e.push(`${g.repository}: repository is <owner>/<name>`);
    else if (g.repository.split('/')[0].toLowerCase() === 'sovereignwebsite') e.push(`${g.repository}: a SovereignWebsite repository takes collaborators from its request, not here`);
    if (!LOGIN.test(g.user || '')) e.push(`${g.repository}: ${g.user} is not a GitHub login`);
    if (g.permission !== 'push') e.push(`${g.repository}: ${g.user} may only have push (write)`);
    if (!g.source) e.push(`${g.repository}: ${g.user} needs a source (Dinis's words)`);
  }
  return e;
}

// The actions that would give every grant, as if none were there yet (for the offline check).
export const allActions = (list) => ({ pipeline: PIPELINE, actions: list.grants.map((g) => ({ action: 'repo.add_collaborator', target: g.repository, user: g.user, permission: g.permission })) });

// What GitHub has for one grant: 'push' or higher already, 'invited', 'lower' (read or triage), or 'none'.
async function state(g) {
  const [o, r] = g.repository.split('/');
  const p = await gh('GET', `/repos/${o}/${r}/collaborators/${g.user}/permission`);
  if (p.status !== 200 && p.status !== 404) throw new Error(`${g.repository}: cannot read ${g.user}'s permission (HTTP ${p.status} ${p.data?.message || ''}); is the App installed on it?`);
  const role = p.status === 200 ? (p.data?.role_name || p.data?.permission || 'none') : 'none';
  if (['write', 'push', 'maintain', 'admin'].includes(role)) return 'has';
  // On a public repository anyone reads as 'read', so a pending invitation is checked before adding.
  const inv = await gh('GET', `/repos/${o}/${r}/invitations?per_page=100`);
  if (inv.status !== 200) throw new Error(`${g.repository}: cannot read invitations (HTTP ${inv.status} ${inv.data?.message || ''}); does the App have Administration on it?`);
  if (inv.data.some((i) => (i.invitee?.login || '').toLowerCase() === g.user.toLowerCase())) return 'invited';
  return role === 'none' ? 'none' : 'lower';
}

export async function apply(owner, p = load(), list = loadList()) {
  const errs = [...validate(p), ...validateList(list), ...checkActions(p, allActions(list))];
  if (errs.length) throw new Error(errs.join('\n'));
  const mine = list.grants.filter((g) => g.repository.split('/')[0].toLowerCase() === owner.toLowerCase());
  const plan = { pipeline: PIPELINE, owner, actions: [] };
  for (const g of mine) {
    const s = await state(g);
    console.log(`${g.repository}: ${g.user} ${s === 'has' ? 'already has push or more' : s}`);
    if (s === 'none' || s === 'lower') plan.actions.push({ action: 'repo.add_collaborator', target: g.repository, user: g.user, permission: 'push' });
  }
  const refused = checkActions(p, plan);
  if (refused.length) throw new Error(refused.join('\n'));
  for (const a of plan.actions) {
    const [o, r] = a.target.split('/');
    const res = await gh('PUT', `/repos/${o}/${r}/collaborators/${a.user}`, { permission: 'push' });
    if (![201, 204].includes(res.status)) throw new Error(`add ${a.user} to ${a.target} (push): HTTP ${res.status} ${res.data?.message || ''}`);
    console.log(`done: ${a.user} on ${a.target} with push (${res.status === 201 ? 'invitation sent' : 'role set'})`);
  }
  if (!plan.actions.length) console.log(`${owner}: nothing to do`);
  return plan;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [cmd, owner] = process.argv.slice(2);
  try {
    if (cmd === 'check') {
      const p = load(), list = loadList();
      const errs = [...validateList(list), ...checkActions(p, allActions(list))];
      if (errs.length) throw new Error(errs.join('\n'));
      console.log(`external collaborators OK (${list.grants.length} grant${list.grants.length === 1 ? '' : 's'})`);
    } else if (cmd === 'apply' && owner) await apply(owner);
    else throw new Error('usage: check | apply <owner>');
  } catch (err) { console.error(err.message); console.error('EXTERNAL COLLABORATORS REFUSED'); process.exit(1); }
}
