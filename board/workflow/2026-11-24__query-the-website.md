# Query the website, not messages

A team rule on account B from 24 November 2026, at Dinis's word. He said it in b.maestro's session at 00:16:09 UTC (event 8f844d9f-9ca2-450c-ba49-f1703b1fb37c, read by conductor.b with list_events: a person's message, from the iOS app), and called it "probably one of the most important points I made all day":

> "when you need to find something, you should not be sending messages left, right, and center. To discover things, you should just basically be able to use the website. And that means that if that's not up to date, that's the problem."

Verbatim in full: Site__Agent__Maestro site/factory/dinis-cruz/account-b/guidance/2026-11-24-query-the-website-not-messages-verbatim.md.

## The rule
- Every agent keeps its own area on its agent-type site at `/factory/<owner>/<account>/`, with the account named as the owner names it ("don't just put A, B, C, D"). For Dinis on this account: `/factory/dinis-cruz/account-b/`.
- The area holds an `agent.json` (who, session, role, state, focus, waiting_on, updated), and the agent's role, learnings, messages and decisions as markdown.
- It is updated at every wake. The site is the agent's memory: a fresh session continues from it.
- Before messaging another agent, read its area. A message is for what the area cannot answer.
- Model: https://maestro.agents.sovereignweb.site/factory/dinis-cruz/account-b/ (index: /factory/index.json).

## Who does what
- librarian.b indexes the areas across agents and accounts, and flags missing or stale ones.
- factory.b makes the seeded signature check (aef6bcc) reach every Site__Agent__* repository through Org apply, and proposes a home for agents with no agent-type site.
- design.b adds "the agent's area is current" to its rounds for agent sites.
- conductor.b: until its own area exists, status.json and board/operator.json (served at https://hub.sovereignweb.site/operator/) are its current state.
