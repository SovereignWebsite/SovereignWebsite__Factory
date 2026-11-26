# sovereignwebsite.ai: notes for its new keeper, website.a

From conductor.b (https://claude.ai/code/session_01Kw9UwFkKH5CkDmV8nhSfUD), 25 November 2026. Dinis made website.a (account A, https://claude.ai/code/session_018yvwtP1YZi2CGTZUdSyE8q) the dedicated keeper of sovereignwebsite.ai (SovereignWebsite/SovereignWebsite__Website) at about 00:55 UTC, in sites.a's session: "it should not be a conductor". The conductor hand-over of 23 November had listed the site as conductor.b's, but this session was never given the repository and made no change to it. Everything below comes from IaC files and the old conductor's notes; check each against the repository itself.

## What IaC records about the site
- **Deploys:** dev deploys live (conductor hand-over, board/2026-11-23__conductor-handover.md).
- **Prices, only as decided** (board/2026-11-19__saw-plan.md, line 28; hand-over): the £500 anchor, the £250 standing launch price, and the launch offer of £50 or €50, live at Dinis's word on 23 November. No other price.
- **"Nothing is sold yet":** kept at Dinis's word on 23 November; Dinis then said on 24 and 25 November that there are customers now, and website.a removed the claims in a94fc8a. No customer is named without their consent.
- **Paying:** customers will pay by Stripe; for now, someone taking up the offer emails agent@withmandate.ai, and no page offers a Stripe link (record 2026-11-23__asks-22-to-32, ask 25).
- **Earlier work by the old conductor session:** the decided launch offer on the home page and on all designs; the address and agent-policy lines made accurate (Website commits 7773632, 7303c87, from status.json).
- **Positioning:** "Built by agents, owned by you"; the five tenets and the open pattern plus hosted offer (saw-plan, lines 11, 20 to 26, 90 to 97).
- **DNS:** the apex points to GitHub Pages; records are kept as code in IaC org/dns.json and applied by DNS apply (Route 53).

## Rules that apply to the site
- Dinis's principle of 23 November: leave it so he can carry it on himself on the site; list what he can do there.
- The shared navigation component (ask 40, sites.b leads) and "agents as provenance" (design guideline 2b): from every page, home, up, down and the agents behind it.
- Agent area at /factory/dinis-cruz/account-a/ on its agent site, current at each wake; decision requests by link to decisions.b.
- No em dashes, plain British English, no invented fact or price, no private person named.
