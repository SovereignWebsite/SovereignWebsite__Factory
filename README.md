# SovereignWebsite__Factory

The control repository of the Sovereign Agentic Website (SAW): the SovereignWebsite organisation as code, and, next, the requests for hosted sites on sovereignwebsite.site. Everything is done by CI, under an Agent Behaviour Policy (`policy/abp.json`).

Dinis Cruz, 19 November 2026 (in the conductor session recorded in team/keys.json): "let's take the opportunity to add as much automation (via CI pipelines) as possible, and then use our ABP to control it"; "let's try to do this completely from the CI pipeline and if we need to add more privs to the GH App and the AWS Role, we'll add them".

## How it works

| Path | What it is |
|---|---|
| `policy/abp.json` | The ABP: what each agent may change, what each pipeline may do, and every privilege the GitHub App and the AWS role hold, with the reason. Anything not listed is refused. |
| `org/repos.json` | The organisation's repositories. `org-apply` creates the missing ones and keeps their settings. It never deletes, transfers, archives or makes private. |
| `org/dns.json` | The DNS for sovereignwebsite.ai, .com and .site (applied once the AWS role exists). |
| `requests/` | Hosted-site requests (next stage, on the AgentiCCells site factory's pattern). |
| `team/keys.json` | Public keys of the agents that commit here; every commit is signed and names its session. |
| `board/` | The SAW plan: strategy, team, sites and pipeline, deck draft. |

Pipelines (`.github/workflows/`):
- **Checks** (every pull request and push to dev, read-only, no secrets): tests, policy validation, leak scan, signed commits and policy paths, and a dry plan of the organisation checked against the policy.
- **Org apply** (push to dev changing `org/` or `policy/`, or by hand, in the `apply` environment): plan against the live organisation, check against the policy, apply with the pipeline App's token.
- **Check GitHub App** (by hand): mints the App's token and lists what it can see.

Releases from dev to main are merged only by Dinis.

## Credits

`build/leak-scan.mjs` and `build/check-signatures.mjs` are from AgentiCCells/AgentiCCells__Site__Factory (Apache-2.0), unchanged. Code Apache-2.0; text CC BY 4.0.
