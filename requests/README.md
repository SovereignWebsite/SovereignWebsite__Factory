# Hosted-site requests

The official guidance for every new Sovereign Website (SWS) site. One folder per site: `requests/<date>__<label>/site.json`. A request is committed to dev only with Dinis's yes for that site (policy/abp.json lists requests/** as needing his merge; factory.b commits requests sent by other agents, naming on whose behalf). It becomes:

- the repository `SovereignWebsite/Site__<label>`, Pages on, the agents' team with push, rulesets main-locked and dev-safe (Org apply);
- the address `https://<label>.<group>.sovereignweb.site`, with a CNAME in Route 53 (DNS apply) and HTTPS enforced once GitHub issues the certificate (Org apply, hourly; a missing certificate is nudged every sixth hour).

```json
{
  "label": "perspace",
  "group": "company",
  "title": "Perspace",
  "description": "A private preview. Scan, paste or drop the QR code you were given to open it.",
  "kind": "owner",
  "access": "vault"
}
```

## Addresses: `<name>.<group>.sovereignweb.site`

sovereignweb.site is the domain for new sites (Dinis, 20 November 2026: "a better domain ... than sovereignwebsite.site"). Each site sits under the group that says what it is. The groups, agreed by Dinis on 20 November 2026 ("I agree with, can you put that on our official guidance, so that it is followed on new sites created"):

| Group | For | Example |
|---|---|---|
| `artist` | creative portfolios | emily-cruz.artist.sovereignweb.site |
| `cv` | career profiles | silvio-switha.cv.sovereignweb.site |
| `company` | companies | perspace.company.sovereignweb.site |
| `organisation` | groups that are not companies | algarve-evolution.organisation.sovereignweb.site |
| `invest` | investment firms | sotavento.invest.sovereignweb.site |

More groups will be added as we go; adding one is a change to `GROUPS` in build/requests.mjs and to this table. A demo of the pipeline itself may have no group (`<name>.sovereignweb.site`).

Rules: the repository is always `Site__<label>`, so a label is unique across all groups, and a group name cannot be a label. A site still on the old domain names it: `"domain": "sovereignwebsite.site"` (and `artists`, the old group, is kept only until emily-cruz moves).

## Public or private

- **Public** (the default): seeded from `seed/site-template`, a starter page the site's agents replace.
- **Private**, `"access": "vault"`: seeded from `seed/gate-template`, a gated holding page. The holding page is public and names the site; the site itself is sealed in a private sgit vault, published only as ciphertext (`site/private/<id>.zip`), and opens in the browser only for people holding its QR code. Everything the page needs (`open.js`, `vendor/jsqr-1.4.0`) is in the site's own repository. Private sites are made, sealed and handed over by the site's own agent: they are never routed through the hub or listed on it (Dinis, 20 November 2026: "all vault/private sites should not be visible at all by the hub.b session and website").

## Rules checked by build/requests.mjs and the tests

- label: lower-case letters, digits and hyphens, at most 40 characters, matching the folder name, not reserved (www, hub, vault, api, admin, mail, factory, or a group name);
- title at most 80 characters; description at most 200; kind `demo` or `owner`; no em or en dashes;
- group, domain and access only from the lists above.

A request names no private person: an owner's details stay out of this public repository until they agree. Every site Dinis asks for has the person's or organisation's approval for a public address (Dinis, 20 November 2026).

The pipeline never deletes: a request removed from this folder leaves its repository and address in place, for Dinis to retire by hand.
