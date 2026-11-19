# REALITY.md: what exists now

Checked 2026-11-19 by conductor.b@SovereignWebsite.dinis. A thing not written here does not exist.

## Exists
- This repository, created by Dinis on 19 November 2026, default branch dev. The team "SovereignWebsite - Agents - CI" has write.
- The GitHub App agenticcells-site-factory is installed on the SovereignWebsite organisation (Dinis, 19 November 2026). Its permissions on this organisation are not yet checked (run "Check GitHub App").
- The skeleton in this commit: policy, org as code, checks, org-apply, tests. Tests run locally and print OK. Not yet run on GitHub.

## Does not exist yet
- The `apply` environment with `FACTORY_APP_ID` (variable) and `FACTORY_APP_PRIVATE_KEY` (secret): without them, Org apply fails at the token step and creates nothing.
- SovereignWebsite__Pattern and SovereignWebsite__Website (Org apply will create them).
- The AWS role for DNS, and the DNS records.
- Branch protection on dev and main.
