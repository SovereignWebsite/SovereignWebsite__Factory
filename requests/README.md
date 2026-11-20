# Hosted-site requests

One folder per site: `requests/<date>__<label>/site.json`. Merged to dev with Dinis's yes (policy/abp.json lists requests/** as needing his merge), it becomes:

- the repository `SovereignWebsite/Site__<label>`, seeded from `seed/site-template` with the request's title and description, Pages on, the agents' team with push, rulesets main-locked and dev-safe (Org apply);
- the address `https://<label>.sovereignwebsite.site`, with a CNAME in Route 53 (DNS apply) and HTTPS enforced once GitHub issues the certificate (Org apply, hourly).

```json
{
  "label": "pipeline-demo",
  "title": "A site from one request",
  "description": "Made by the Sovereign Website pipeline from one request folder.",
  "kind": "demo"
}
```

A request may name a `group` to sit under its own subdomain: `"group": "artists"` gives `https://<label>.artists.sovereignwebsite.site`. Groups: `artists`, `cv`, `invest` (Dinis, 20 November 2026).

A request may set `"access": "vault"` for a private site: the repository is seeded with a gated holding page (`seed/gate-template`, the pattern in SovereignWebsite__Vault docs/gated-site.md) instead of the public starter page. The site itself is sealed later in a private vault, published as `site/private/<id>.zip`, and opens only for people holding its QR code. The holding page is public and names the site; the content is not. The repository is still `Site__<label>`, so a label is unique across groups, and a group name cannot be a label.

Rules, checked by build/requests.mjs and the tests: label of lower-case letters, digits and hyphens, at most 40 characters, not reserved (www, hub, vault, api, admin, mail, factory), matching the folder name; title at most 80 characters; description at most 200; kind "demo" or "owner"; no em or en dashes. A request names no private person: an owner's details stay out of this public repository until they agree.

The pipeline never deletes: a request removed from this folder leaves its repository and address in place, for Dinis to retire by hand.
