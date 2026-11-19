# REALITY.md: what exists now

Checked 2026-11-19 by conductor.b@SovereignWebsite.dinis. A thing not written here does not exist.

## Exists
- This repository, created by Dinis on 19 November 2026, default branch dev. The team "SovereignWebsite - Agents - CI" has write.
- The GitHub App agenticcells-site-factory is installed on the SovereignWebsite organisation (Dinis, 19 November 2026). Its permissions on this organisation are not yet checked (run "Check GitHub App").
- First runs on GitHub (19 Nov 15:33 UTC, commit 058cd0f): Checks passed; Org apply failed at the token step, as expected without the apply environment, and created nothing.
- The skeleton: policy, org as code, checks, org-apply, tests. Tests run locally and print OK. Not yet run on GitHub.

## Does not exist yet
- The `apply` environment with `FACTORY_APP_ID` (variable) and `FACTORY_APP_PRIVATE_KEY` (secret): without them, Org apply fails at the token step and creates nothing.
- SovereignWebsite__Website (sovereignwebsite.ai), SovereignWebsite__Org (sovereignwebsite.org) and SovereignWebsite__Site (sovereignwebsite.site): planned in org/repos.json with seeds in seed/; Org apply will create them, turn Pages on, seed site/ and a Pages workflow, and set each apex domain.
- The DNS records for the three apexes (org/dns.json lists them).
- The AWS role for DNS, and the DNS records.
- Branch protection on dev and main.
