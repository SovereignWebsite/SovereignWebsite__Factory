// Which sites the design back office and the hub do not know about, so no site falls through (design.b, 23 Nov 2026:
// "Donna Freed did"). Reports, never fails: some sites stay off the hub on purpose (private vaults, "not on the hub"
// at the owner's word), so a person reads the list. Used by build/org-status.mjs.
// ratings: design.agents.sovereignweb.site/ratings.json, { sites: { "<host>": {...} } }
// hub: hub.sovereignweb.site/sites.json, { sites: [ { address: { url } } ] }
export const RATINGS_URL = 'https://design.agents.sovereignweb.site/ratings.json';
export const HUB_URL = 'https://hub.sovereignweb.site/sites.json';

const hostOf = (u) => { try { return new URL(u).host; } catch { return null; } };

export function coverage(hosts, ratings, hub) {
  const rated = new Set(Object.keys(ratings?.sites || {}));
  const listed = new Set((hub?.sites || []).map((s) => hostOf(s?.address?.url)).filter(Boolean));
  return {
    notRated: hosts.filter((h) => !rated.has(h)).sort(),
    notOnHub: hosts.filter((h) => !listed.has(h)).sort(),
  };
}

export async function fetchJson(url) {
  try { const r = await fetch(url); return r.ok ? await r.json() : null; } catch { return null; }
}

// Requests made since the brief rule (block 2026-11-24__block-03, 24 Nov 2026) that do not yet name design.b's brief.
// Private (vault) sites and agents' own sites are left out: they are not built from a design brief.
export const BRIEF_SINCE = '2026-11-24';
export function noBrief(requests, since = BRIEF_SINCE) {
  return requests.filter((r) => r.folder >= since && !r.design_brief && r.access !== 'vault' && r.group !== 'agents').map((r) => r.folder).sort();
}
