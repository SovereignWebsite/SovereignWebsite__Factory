# REALITY.md: what exists now

Checked 2026-11-19 by conductor.b@SovereignWebsite.dinis. A thing not written here does not exist.

## Exists
- This repository, created by Dinis on 19 November 2026, default branch dev. The team "SovereignWebsite - Agents - CI" has write.
- The GitHub App agenticcells-site-factory is installed on the SovereignWebsite organisation (Dinis, 19 November 2026). Its permissions on this organisation are not yet checked (run "Check GitHub App").
- First runs on GitHub (19 Nov 15:33 UTC, commit 058cd0f): Checks passed; Org apply failed at the token step, as expected without the apply environment, and created nothing.
- The skeleton: policy, org as code, checks, org-apply, tests. Tests run locally and print OK. Not yet run on GitHub.

- Org apply, run 44557482808 (19 Nov 15:41 UTC): created SovereignWebsite__Website, __Org and __Site (public, dev default), Pages on from a workflow, seeded site/, CNAME and CLAUDE.md, set the apex domains .ai, .org and .site; 19 actions, all allowed by the policy.
- Route 53 zones for the three domains (zone IDs in the apply environment, Dinis, 19 Nov).

- The AWS role sovereignwebsite-factory-dns (Dinis, 15:50 UTC). DNS apply, run 44559783507 (15:53 UTC): assumed the role through OIDC with the numeric-ID subject recorded in docs/aws-oidc.md, and UPSERTed the apex A and www CNAME records in the three zones.
- Rulesets main-locked and dev-safe on every repository (Org apply, 19 Nov 16:20 UTC). SovereignWebsite__Hub and SovereignWebsite__Vault created by Org apply, with Pages, domains and DNS records.
- Sites served by GitHub Pages over http (checked against GitHub's servers 16:27 UTC): sovereignwebsite.ai, .org and .site with their first real versions. HTTPS not yet: no certificate issued.

- HTTPS: GitHub issued no certificate until one by-hand Org apply with nudge_missing_certificates (17:47 UTC) cleared and re-set the five custom domains; all five served over HTTPS by 17:48 UTC, and HTTPS is enforced on all five (checked 18:32 UTC: http answers 301).
- Site content: sovereignwebsite.ai has the ten pages of Dinis's brief; sovereignwebsite.org has the seven principles and the maturity model (licence not set); sovereignwebsite.site the hosted-side page; every page carries the family bar. The Vault drop page and the Hub gallery are hub.b's (SovereignWebsite__Vault d00a900, SovereignWebsite__Hub 6fc6b75).

## Does not exist yet
- The `apply` environment with `FACTORY_APP_ID` (variable) and `FACTORY_APP_PRIVATE_KEY` (secret): without them, Org apply fails at the token step and creates nothing.
- The DNS records for the three apexes (org/dns.json lists them).
- Public DNS still answers from the old registrar nameservers (worldnic.com) at 15:53 UTC; the apexes are not served by GitHub Pages until the Route 53 delegation propagates.
- Branch protection on dev and main.
