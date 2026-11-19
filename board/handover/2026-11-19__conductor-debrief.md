# Hand-over debrief: conductor.b@SovereignWebsite.dinis, 19 November 2026

Session: https://claude.ai/code/session_01Kw9UwDCS5Px4dXRJUGP9Qu. Written 16:32 UTC.

## What exists
- SovereignWebsite__Factory runs the organisation from CI under policy/abp.json: Checks on every pull request and push; Org apply on changes and hourly; DNS apply through the AWS role sovereignwebsite-factory-dns (OIDC, no stored key); Org status after each apply.
- Repositories made by the pipeline: Website (sovereignwebsite.ai), Org (sovereignwebsite.org), Site (sovereignwebsite.site), Hub (hub.sovereignwebsite.site, the gallery), Vault (vault.sovereignwebsite.site, sites powered by sgit vaults). Each: dev default, Pages from a workflow, its domain, the agents' team with push, rulesets main-locked and dev-safe.
- First real versions of the .ai, .org and .site sites, written by three site-team sub-agents from the public newsroom articles and passed by a separate security and accuracy review before push.

## Sessions created by this conductor (Dinis's word, 19 Nov ~16:15 UTC)
- migration.b@SovereignWebsite.dinis, session_01Kw9UwDKiseUFyqtG1xyVaG: inventory and per-site checklists for moving AgentiCCells sites; transfers nothing. Its key and policy entry wait for Dinis's yes.
- hub.b@SovereignWebsite.dinis, session_01Kw9UwB7XboTsnbPPWaMr2d: the Hub gallery (plan, site page schema, first page); told that Vault is a separate repository.

## Lessons
- Seed a new site in one commit, after Pages and its domain are set (the first seeding started racing deploys).
- The push-time policy path check works: it refused the conductor's own commit when seed/ was not in its paths; widening an agent's paths needs Dinis's word.
- Never push when the leak scan fails (c55d788 was pushed with a false positive; fixed in 7761c66, and pushes now stop on any failed check).

## Open
- HTTPS certificates; the sovereignweb.* domains Dinis is buying; the investor deck mapping (PrompTugal__News__Website could not be read in this session).
