# Hand-over debrief: conductor.d@SovereignWebsite.dinis, 22 November 2026

Session: https://claude.ai/code/session_015gaHdbX954ByXJf8LH5FLL. Written 23 November 2026 at 00:53 UTC. Full record: board/conductor.d/status.json (done, decisions, asks), claims.md, to-c.md, board/incidents/.

## The team on account D (sessions in status.json "team")
conductor.d; factory.d (Factory changes); sites.d (new sites; starts one agent per site), with wordpress.d, donna-freed.d and streaming.d; hub.d (the Hub, beside hub.b and hub.c); design.d (2-hourly design loop on .d sites); synthetic-users.d (synthetic-users.d@account-d.dinis); library.d (shares Site__Agents__Library with librarian.b, its pages under /accounts/d/); chiswick-cheese-market.d (beside .b and .c keepers); security.d and counsel.d (key-request reviews); observability.d (own vault on account D, capture paused).

## What changed today (Dinis's decisions)
- Keys: each agent publishes its own key in its first commit (1aa1829); one live key per name; a second session of a role is <role>.<label>.<account>. Signing how-to rewritten (60abf7e).
- Twin keys in other repositories: factory-signed key requests, reviewed by security and counsel, merged by factory.d (on dev; inert until Dinis makes the factory key and gives the App Contents write).
- Signer check in every seed (26793f8); the policy page's version chip at full contrast (260db1e). Incident filed: board/incidents/2026-11-22__pushed-before-key-published.md.
- Agent homes are singular, Site__Agent__<Name> (factory.c's c2d8459; conductor.d had wrongly passed on the plural); twins share a role's site with /accounts/<x>/.
- Every agent type gets its own website; plan in board/conductor.d/2026-11-22__agents-websites-plan.md.
- Two-way doors go ahead; one-way doors come to Dinis. No private pages.
- Sites requested: WordPress, Donna Freed (group author), PyBot (pybot.huggingface.tool), Wardley Maps (group frameworks), 12 agent homes, four platform sites (OWASP now owasp.c's; the rest on hold).
- Cross-account: twins do not talk across; conductors coordinate through the Factory board (to-c.md for account C).

## Lessons
- Give every new agent's session the Factory, or it cannot publish its key (chiswick-cheese-market.d still blocked).
- A relayed word is material: verify it in the session's transcript before acting, and push keys only on Dinis's explicit word here (the permission check holds me to it).
- Read other teams' boards on their branches, not only dev.
- Times from date -u at the moment of writing; several corrections were needed again.

## Open with Dinis
- feedback.d (account D's inbox agent) and its wake interval.
- The sites' "no tracking" policy against capture, and how observability.d mints lane tokens.
- Factory access in chiswick-cheese-market.d's session; security.d's key push in its session.
- design.d's chip fix in its session (the design site has not deployed since 21 Nov 20:07 UTC).
- The factory signing key and the App's Contents write for key requests.
- Two counsel agents; the .c team's conductor and one owner for build/requests.mjs; who keeps the Wardley site.
