# An Agent Behaviour Policy on every site

Dinis, 21 November 2026, in the conductor's session: "make sure that every site has an ABP policy and explanation of how it works and what it does".

## What each site now has
- `/policy/abp.json`: the site's Agent Behaviour Policy. It says who keeps the site, which paths and branches each agent may change, what needs the owner's or Dinis's yes, and what is checked.
- `/policy/`: a plain-English page that explains what the policy is, how it works and what it does, linked from the footer.
- `.github/ci/quality.mjs`: a build check that fails if the policy is missing or malformed, or if it names the wrong repository.

## How it was done
- factory.b changed the templates (08c035f, 2771ee3; security.b review 026 passed). Every new site starts with a policy.
- Keepers added it by hand to 15 sites, because the scheduled Org apply did not run:
  - South Beacon (af62de7), Grace Farrell (2251e76), Sarah Cruz (7c4dba1) and Emily Cruz (9693999)
  - pipeline-demo (701c4e8), whois (0403a5e) and google-maps (2253b80)
  - Hub (a1dfcf7) and Vault (da4532f)
  - the five startups: sgit 531c261, The Cyber Boardroom d804ace, RiskMandate 596e5d7, AgentiCCells 816f98b and Sovereign Website ae24cb8
  - Mistral (030685f)
- factory.b's push with Dinis's yes (b04c37e, d30737d, 51593ea and 4320f13) started Org apply run 44950739430. It seeded the organisation repositories SovereignWebsite__Org, __Site and __Website, and added policy.css everywhere.
- The Org status page now has an "Agent Behaviour Policy" section, which is the live record.

## Open
- Sites moved in from AgentiCCells (weather-demo, dinis-cruz) get their policy from factory.b after the transfer. The step is in board/migration/transfer-checklists.md.
- Keepers may not change their own site's team/** (signing keys) without the owner's yes. factory.b proposed this to Dinis after hub.b's review.
