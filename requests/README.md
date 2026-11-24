# Hosted-site requests

The official guidance for every new Sovereign Website (SWS) site. One folder per site: `requests/<date>__<label>/site.json`. A request is committed to dev only with Dinis's yes for that site (policy/abp.json lists requests/** as needing his merge; factory.b commits requests sent by other agents, naming on whose behalf). It becomes:

- the repository `SovereignWebsite/Site__<Group>__<Name>` (see Repository names), Pages on, the agents' team with push, rulesets main-locked and dev-safe (Org apply);
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
| `designer` | design portfolios | sarah-cruz.designer.sovereignweb.site |
| `tool` | small useful tools | whois.tool.sovereignweb.site |
| `founder` | founders and their ventures | kate-curtis-evans.founder.sovereignweb.site |
| `startups` | brochure sites for startups, pointing to their own sites | sgit.startups.sovereignweb.site |
| `demo` | demonstrations of the pipeline and of what a site can do | pipeline-demo.demo.sovereignweb.site |
| `provider` | AI model providers a sovereign website can choose | mistral.provider.sovereignweb.site |
| `talent` | anonymised talent profiles, under code names | south-beacon.talent.sovereignweb.site |
| `author` | writers and their work (Dinis, 22 November 2026, for donna-freed: "put her as an author") | donna-freed.author.sovereignweb.site |
| `platform` | unofficial sites about the platforms we use, from their public material, each saying it is not the platform's own (Dinis, 22 November 2026: "Yes, to the platform group, absolutely") | owasp.platform.sovereignweb.site |
| `frameworks` | open frameworks and methods, explained with their tools (Dinis, 22 November 2026: "Wardley Maps in 'frameworks'") | wardley-maps.frameworks.sovereignweb.site |
| `presentations` | presentations, one repository per person, the repository the source of truth (Dinis, 23 November 2026: "presentations cover the whole remit") | dinis-cruz.presentations.sovereignweb.site |
| `agents` | the SWS agents' own sites | factory.agents.sovereignweb.site |

More groups will be added as we go; adding one is a change to `GROUPS` in build/requests.mjs and to this table. Every site has a group (Dinis, 20 November 2026: "Everything should have a group for now"; demos go in `demo`). The only exceptions are listed in `NO_GROUP` in build/requests.mjs: the agents area's own index page, and google-maps, held at its old address until its Maps key lists the new one.

Rules: a label may be used in more than one group, so one label finds all of a person's sites (Dinis, 23 November 2026: "allow labels to be used in different groups"); each site's address and repository name must still be unique, and a group name cannot be a label (except a group's own home, listed in `NO_GROUP`). When a label is shared, its bare old names (`Site__<label>`, `Redirect__<label>`) are not used to rename anything.

A `tool` site about a third party's service names that party: `"provider": "huggingface"` gives `pybot.huggingface.tool.sovereignweb.site` and `Site__Tool__Huggingface__Pybot` (Dinis, 22 November 2026: "gmail.google.tool"; "use pybot.huggingface.tool").

## Repository names: `Site__<Group>__<Name>`

Repositories are indexed by type, with capitalised names (Dinis, 20 November 2026: "the repo should be Site__Organisation__Algarve-Evolution, Site__Artist__Emily-Cruz (note the capitalisation on the names)"). The group is capitalised (`cv` is `CV`), and each word of the label starts with a capital: `emily-cruz` in `artist` is `Site__Artist__Emily-Cruz`; a site with no group is `Site__<Name>`, for example `Site__Weather-Demo`. A redirect site is `Redirect__<Group>__<Name>`. A repository made under an older name is renamed by Org apply, never made again; GitHub keeps redirecting the old name. A label whose capitals differ from that rule gives them in `"repo_label"`, the same letters (for example `"repo_label": "AWS"` for `Site__Platform__AWS`, Dinis, 22 November 2026); the address does not change. A site still on the old domain names it: `"domain": "sovereignwebsite.site"` (and `artists`, the old group, is kept only until emily-cruz moves).

## Moving a site to a new address

Change the request's address (its group, or drop `"domain": "sovereignwebsite.site"`) and list the old address in `previous`:

```json
"previous": ["emily-cruz.artists.sovereignwebsite.site"]
```

Org apply moves the site's repository to the new address and makes `Redirect__<Group>__<Name>`, a one-page site at the old address that sends every visitor, with the same path, query and `#fragment` (so a vault key still opens), to the new one. DNS apply keeps a CNAME for both names. Old addresses never vanish. Check the site's own content for the old address after a move.

## Agents' own sites

Each SWS agent has its own site, `<role>.agents.sovereignweb.site` (repository `Site__Agent__<Role>`, singular since 22 November 2026, Dinis: "It's not agents, it's agent"; Org apply renamed the plural ones), and `agents.sovereignweb.site` is the shared page for all of them (Dinis, 20 November 2026: "each of the agents here to manage their own site, including publishing their own keys to their site, which becomes a way to authenticate those agents and what they signed"). A request names the agent: `"group": "agents", "agent": "<role>@SovereignWebsite.dinis"`. The site is seeded from `seed/agent-template`. Its public key is never written by hand: every deploy (and once a day) copies the agent's active entry from this repository's `team/keys.json` into `site/key.json`. So `team/keys.json` stays the one root that the commit checks trust, and a key that is only on an agent's site counts for nothing. Each agent keeps its own site; only that agent commits there, under the repository's CLAUDE.md. All agents work through the same GitHub access, so this rule is enforced by signed commits, not by GitHub permissions.

## People who write to their own site

A request may name the people who may push to its repository, by GitHub login, with push (write) only: `"collaborators": { "<login>": "push" }`. Org apply invites them; a login GitHub does not know is reported in the run summary, never invited. They push to dev like the agents (main stays locked). An owner who uses Claude with their repository must also be an organisation member: as an outside collaborator Claude's GitHub check fails ("SovereignWebsite needs reconnecting"), even with the Claude App on all repositories (Kate Curtis-Evans, 20 November 2026). The route that works, done by Dinis by hand for now: the organisation's base permission is "No permission" (the agents' team holds the repositories), the owner is invited as a member with no teams and keeps their direct write on their own repository, accepts at https://github.com/orgs/SovereignWebsite/invitation (the email's link may not offer it), then presses "Check again" in Claude. Each site's /start/ page says the same.

## Public or private

- **Public** (the default): seeded from `seed/site-template`, a starter page the site's agents replace, plus the owner's and visitors' pages every customer site keeps (Dinis, 20 November 2026: "every site, in addition to the admin, also has the start page ... that link ... for the agents ... LLMs.txt"): `/start/` (taking the site over: GitHub, the invitation, the first change, asking for one more pass), `/agents/` with `/llms.txt` and `/data/agents.json` (using the site through your own AI), and `/admin/` (how the site was made). They are linked from the header, the footer and the top-right Sovereign Website pop-up. Org apply adds any of these files a site does not yet have; it never overwrites one. Every page also carries its link preview (Dinis, 20 November 2026: "we are missing the social media link preview image"): the Open Graph and Twitter tags and a 1200x630 JPEG share card under 300 KB at `site/assets/share/card-1200x630.jpg`. The seed's card is neutral; the site's agent replaces it with one made from the owner's own photo, name and one line (`node build/share-card.mjs <photo> "<name>" "<line>" <out.jpg>`). The site's deploy runs `.github/ci/share-check.mjs`, which fails when a page lacks a tag or the card is the wrong size or type, and warns while the card is still the seed's.

## The site pipeline: checks, version, deploy

Every site's `.github/workflows/pages.yml` runs on each push to dev, after the AgentiCCells site pipeline (Dinis, 20 November 2026: "the Git versions are created by the CI pipeline ... a check for broken links ... check for problems, look at add tag ... and then push"):

1. **Version** from the git tags: `v<major>.<minor>.<patch>`, the patch one more than the last tag's. Major and minor sit in the workflow (`VERSION_BASE`), set by a person.
2. **Build** `_site/` from `site/` (`.github/ci/build.mjs`): `version.json` (version, short commit, date, run URL) and a small chip on every page, `v0.1.N · abc1234 · date`, linking to the run. Never typed by hand.
3. **Checks**, any of which stops the run: link previews (`share-check.mjs`); internal links and assets, external links (404 or 410 fails, other errors warn), no em dashes in visible text, no family strip, leak scan (`quality.mjs`); HTML validity (html-validate); accessibility (axe-core on the home page, each top-level page and each design under `designs/`).
4. **Deploy** to Pages, then **tag** the released commit. The run's summary lists every check, so `/admin/` and the design back office can link to the latest run.
- **Private**, `"access": "vault"`: seeded from `seed/gate-template`, a gated holding page. The holding page is public and names the site; the site itself is sealed in a private sgit vault, published only as ciphertext (`site/private/<id>.zip`), and opens in the browser only for people holding its QR code. Everything the page needs (`open.js`, `vendor/jsqr-1.4.0`) is in the site's own repository. Private sites are made, sealed and handed over by the site's own agent: they are never routed through the hub or listed on it (Dinis, 20 November 2026: "all vault/private sites should not be visible at all by the hub.b session and website").

## Design brief before the first build

Register every new site request with design.b at M0, when the request is made (block 2026-11-24__block-03). design.b sends five ideas from the owner's world as a brief, made from its template (https://design.agents.sovereignweb.site/briefs/TEMPLATE.html; all briefs at /briefs/); its link goes in the request as `"design_brief": "https://design.agents.sovereignweb.site/briefs/<slug>.html"`, where `<slug>` is the request's slug (its docs/briefs/<slug>.md in Site__Agents__Design also works). The repository is still created at once from the neutral seed; the keeper's first real build waits for the brief. Org status lists requests made since 24 November 2026 that have none yet (agents' own sites and private vault sites are not briefed).

## Rules checked by build/requests.mjs and the tests

- label: lower-case letters, digits and hyphens, at most 40 characters, matching the folder name, not reserved (www, hub, vault, api, admin, mail, factory, or a group name);
- title at most 80 characters; description at most 200; kind `demo` or `owner`; no em or en dashes;
- group, domain and access only from the lists above;
- design_brief, when present, a docs/briefs/<name>.md in Site__Agents__Design, or a page on https://design.agents.sovereignweb.site/.

A request names no private person: an owner's details stay out of this public repository until they agree. Every site Dinis asks for has the person's or organisation's approval for a public address (Dinis, 20 November 2026).

The pipeline never deletes: a request removed from this folder leaves its repository and address in place, for Dinis to retire by hand.
