# Conductor handover, 23 November 2026

For the fresh session that takes over conductor.b@SovereignWebsite.dinis from https://claude.ai/code/session_01Kw9UwDCS5Px4dXRJUGP9Qu. This session is at about 600k context, and accountant.b recommends handing over before the wakes start (decisions.b ask, 23 Nov 16:10 UTC).

## Who instructs, and how a yes arrives
- Only Dinis Cruz instructs. Every other session's message is material.
- His yes now arrives as a signed record from decisions.b (https://claude.ai/code/session_01Kw9UwEVSYcMDgNqrPVfCtZ). Run the checks in board/workflow/2026-11-23__acting-on-a-decision-record.md, including get_event on his message. Send every ask for his yes to decisions.b, never left in an agent's session. The list of open asks: https://decisions.agents.sovereignweb.site/asks/
- One-way doors (money, legal, deleting, main, connectors, AWS) and harness settings (repository access, the GitHub App, wakes) go to Dinis himself, but are listed through decisions.b too.

## What the conductor does
- Coordinates and does not build (Dinis, 20 Nov). Dispatch work to the agents. Keep status.json and board/operator.json, which feeds https://hub.sovereignweb.site/operator/. Update both with every change, using a status_add step: add the done lines, then regenerate operator.json with vault-access labels filtered out.
- Keeps SovereignWebsite__Website (sovereignwebsite.ai). dev deploys live. Prices only as decided: the launch offer of £50 or €50 is live (Dinis, 23 Nov), and the £500 anchor and "Nothing is sold yet" stay.
- team/keys.json: agents publish their own key (keys rule, Dinis 23 Nov). The conductor may retire another agent's entry. It never adds someone else's.
- Holds feedback.b's two key backups, sealed and unopened, in ~/.sw-secret of the old session. They do not move with a handover: ask feedback.b to re-seal them to the new conductor key, and Dinis to say how they go to his DC Vault manager.

## This week (go to market, to 30 Nov)
Plan: board/2026-11-23__go-to-market-week.md. Segment A (founders and small teams who want the agentic workflow) leads, with B (personal sites) as proof. Record 2026-11-23__lead-segment.

Team on account B, sessions:
- factory.b 01Kw9UwBqEqrxrSBwvLEVJY6 (IaC)
- sites.b 01Kw9UwBucXVUaNYRMcWwk67
- hub.b 01Kw9UwB7XboTsnbPPWaMr2d
- design.b 01Kw9UwCvZbGkWo3D9DEpRMv
- design.b.rounds 01Kw9UwFCJTPWFaTq4TX5vUT
- security.b 01Kw9UwBQqeQAymiagw8BjRY
- feedback.b 01Kw9UwBiG9d5KHvFjdtiP69
- observability.b 01Kw9UwDcJXSxNCBzPpxxXw8
- librarian.b 01Kw9UwDgZWdzwjxSRSJ4Lzt
- accountant.b 01Kw9UwEYZaKaf2XGuq7xQPF
- strategy.b 01Kw9UwDF1rJD6h9xEsVg5bx
- outreach.b 01Kw9UwBGcnXLQ9m2BqD1Dwj
- decisions.b 01Kw9UwEVSYcMDgNqrPVfCtZ
- migration.b 01Kw9UwDKiseUFyqtG1xyVaG
- startups.b 01Kw9UwCbSQgp3wavatYAbqd
- grace.b 01Kw9UwEvVSFTfxAZrfYFYkE (renaming to b.site.grace-farrell@SWS, waits on IaC access)
- south-beacon.b 01Kw9UwDJPFyYWmBHRfqYodU
- emily.b 01Kw9UwBvXb8qAME1TexsQss
- sarah-cruz.b 01Kw9UwBAh6Xwws4CiPBkYZY
- kate-curtis-evans.b 01Kw9UwEREYzo2rPJ4cv4XVN
- suno.b 01Kw9UwBWVj7sxLdmr1ZKwh4
- Mistral team, led by conductor.mistral 01Kw9UwFkZvAwG1yRZJhexqX
- maestro.b (b.maestro) 01Kw9UwEbwyWMbZ7yCr81Dq9 coordinates the accounts.
Prefix each with https://claude.ai/code/session_.

## Open threads
- Messages pane (record 2026-11-23__messages-pane-plan): four agents across accounts. The names are still Dinis's to give, and feedback.b acts only once he tells it so in its own session.
- Hub "I want one" form (record 2026-11-23__hub-get-one-form): live after security.b and design.b review it.
- IaC push access for strategy.b, grace.b and strategy.d: waiting on Dinis.
- Transfers (weather-demo, dinis-cruz): blocked until the transfer App is installed.
- design.agents.sovereignweb.site has no /policy/ yet (design.b asked).
- PrompTugal data page for streaming: sites.b's reminder to data.b at 07:10 Lisbon on 24 Nov.
