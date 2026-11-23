# Migration inventory: AgentiCCells sites to SovereignWebsite

By migration.b@SovereignWebsite.dinis, 19 November 2026, from the public AgentiCCells/AgentiCCells__Site__Factory (requests/, REALITY.md) at dev as cloned at 16:23 UTC, and the SWS plan (board/2026-11-19__saw-plan.md, section 3). A proposal for Dinis; nothing has been moved, transferred or changed.

## Summary

| Kind | Count | Recommendation |
|---|---|---|
| Demo on the data | 6 | 4 move first (Dinis's yes only); 2 at the seed page move only if built further |
| Customer site | 8 | Move only with the owner's yes, one at a time |
| Dinis's own site | 1 | Dinis decides |
| Specialist, QA, eval and cell | 12 | Stay with AgentiCCells |
| AgentiCCells' own website | 1 | Stays with AgentiCCells |
| PrompTugal section | 12 | Stay with PrompTugal |
| Withdrawn | 1 | Record only |
| **Total** | **41** | Every folder in requests/ on 19 Nov (the plan counted 40, before dinis-cruz) |

Customer sites are named only where the owner is named with consent in the newsroom (as listed in the SWS plan, section 3); the others are referred to by a neutral label, and the mapping is the public requests/ folder.

## Demos on the data (move first)

| Label | Current address | Repository (AgentiCCells/) | Moving it would mean | Recommendation |
|---|---|---|---|---|
| weather-demo | weather-demo.agenticcells.site | AgentiCCells__Site__Weather-Demo | Transfer; new address weather-demo.sovereignwebsite.site; update hub.json, README and in-repo links | Move, wave 1 |
| ipma-data | ipma-data.agenticcells.site | AgentiCCells__Site__IPMA-Data | As above; reads data.promptugal.news, which answers CORS `*`, so the new origin still works | Move, wave 1 |
| algarve-holiday-homes | algarve-holiday-homes.agenticcells.site | AgentiCCells__Site__Algarve-Holiday-Homes | As above; most in-repo references (team/, scripts/) to update; invented company, keep the label "demo"; signed-commit checks against @AgentiCCells keys are on | Move, wave 1, after its hand-over items close |
| london-billboard | london-billboard.agenticcells.site | AgentiCCells__Site__London-Billboard | As above; simulated, keep the label "demo" | Move, wave 1 |
| events-demo | events-demo.agenticcells.site | AgentiCCells__Site__Events-Demo | Seed page only (plan, section 3); little to move | Move only once built past the seed page, else leave |
| cyber-demo | cyber-demo.agenticcells.site | AgentiCCells__Site__Cyber-Demo | Seed page only (plan, section 3) | As events-demo |

What I checked in the six demo repositories (dev, shallow clone): each has one workflow, pages.yml, which uses no repository secrets and no App token (only the built-in token with pages and id-token write), so it keeps working after a transfer. The custom domain is not a CNAME file; it was set through the Pages API by the factory pipeline, so it must be set again.

## Customer sites (only with the owner's yes)

| Label | Current address | Repository (AgentiCCells/) | Moving it would mean | Recommendation |
|---|---|---|---|---|
| yiheng-wang | yiheng-wang.agenticcells.site | AgentiCCells__Site__Yiheng-Wang | Transfer and a new address, or keep the agenticcells.site name pointing at the new Pages host | Offer; move on the owner's yes |
| silvio-switha | silvio-switha.agenticcells.site | AgentiCCells__Site__Silvio-Switha | As above | Offer; move on the owner's yes |
| jose-bota | jose-bota.agenticcells.site | AgentiCCells__Site__Jose-Bota | As above | Offer; move on the owner's yes |
| gabriel-dacruz | gabriel-dacruz.agenticcells.site | AgentiCCells__Site__gabriel-dacruz | As above; the request lists collaborators, who keep access only as outside collaborators | Offer; move on the owner's yes |
| customer site A | (see requests/, 2026-11-17) | (see requests/) | As above | Offer; move on the owner's yes |
| customer site B | (see requests/, 2026-11-18) | (see requests/) | As above | Offer; move on the owner's yes |
| customer site C | (see requests/, 2026-11-18) | (see requests/) | As above | Offer; move on the owner's yes |
| customer site D (business) | (see requests/, 2026-11-18) | (see requests/) | As above | Offer; move on the owner's yes |

Note: a transfer to SovereignWebsite is not the hand-over to the owner. If an owner would rather own the repository themselves, the cleaner path is one transfer, straight to the owner, and SWS points its address there; two transfers mean two re-sets of the custom domain.

## Dinis's own site

| Label | Current address | Repository (AgentiCCells/) | Recommendation |
|---|---|---|---|
| dinis-cruz | dinis-cruz.agenticcells.site | AgentiCCells__Site__Dinis-Cruz | Dinis decides; a good first customer-shaped move if Dinis wants the sovereignty demo on Dinis's own name |

## Stay with AgentiCCells (specialist, QA, eval, own site)

| Label | Address | Repository (AgentiCCells/) | Why it stays |
|---|---|---|---|
| agenticcells-site | agenticcells.site ("applying") | AgentiCCells__Site__Website | AgentiCCells' own website |
| email-cell | email-cell.agenticcells.site | AgentiCCells__Cell__Email | A cell, not a site |
| specialist-abp | specialist-abp.agenticcells.site | AgentiCCells__Specialist__Agent-Behaviour-Policies | About agentic teams |
| specialist-code | specialist-code.agenticcells.site | AgentiCCells__Specialist__Code | As above |
| specialist-design | specialist-design.agenticcells.site | AgentiCCells__Specialist__Design | As above |
| specialist-security | specialist-security.agenticcells.site | AgentiCCells__Specialist__Security | As above |
| specialist-ux | specialist-ux.agenticcells.site | AgentiCCells__Specialist__UX | As above |
| specialist-writing | specialist-writing.agenticcells.site | AgentiCCells__Specialist__Writing | As above |
| qa-1 | qa-1.agenticcells.site | AgentiCCells__Site__Factory__Pipeline__QA-1 | Tests the AgentiCCells pipeline |
| qa-2 | qa-2.agenticcells.site | AgentiCCells__Site__Factory__Pipeline__QA-2 | As above |
| evals | evals.agenticcells.site | AgentiCCells__Site__Evals | Evaluation work |
| openrouter-evals | openrouter-evals.agenticcells.site | AgentiCCells__Site__OpenRouter-Evals | As above |
| riskmandate-at-websummit | riskmandate-at-websummit.agenticcells.site | AgentiCCells__Site__RiskMandate-At-WebSummit | Internal (plan, section 3) |

## Stay with PrompTugal

civic, data, startups, travel, weather, bulletins, cyber, events, library, live, signals, videos (all `<section>.promptugal.news`, repositories PrompTugal/PrompTugal__News__*). Thirteen in the plan's count; twelve requests in requests/ carry the promptugal-news suffix, so one of the thirteen is outside the factory (to confirm). They stay; SWS may link to them as examples.

## Withdrawn

| Label | Status |
|---|---|
| 2026-11-16 withdrawn request | Superseded the same day by yiheng-wang; repository and DNS record deleted by Dinis (AgentiCCells REALITY.md). Its status.json still says "live" because teardown is not built. Not moved, not an example. |

## Open questions

- Mid-round: conductor.b@AgentiCCells.dinis answered at 16:24 UTC (material, not consent to any move): no round is running now. algarve-holiday-homes has stopped at v0.1.10, with hand-over items open for Dinis and a stale round-3 branch waiting for a person to delete it, so move it only once those items are closed. london-billboard has stopped, and whether it restarts waits on Dinis. dinis-cruz finished round 1 at 15:04 UTC with questions open for Dinis and is likely to start another round, so check this row with cells.b, which started that site's conductor. evals and gabriel-dacruz are holding until Dinis turns on branch protection. That conductor agrees with the split and has not checked each site's open pull requests this hour.
- Old addresses: keep `<name>.agenticcells.site` working by pointing its CNAME at sovereignwebsite.github.io (then that name, not the new one, is the custom domain), or let it lapse and use `<name>.sovereignwebsite.site` only. GitHub Pages serves one custom domain per site, so it cannot answer on both names; a redirect needs a small page on the old name, kept by AgentiCCells. See transfer-checklists.md.
