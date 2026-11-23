# The agents' websites: plan

conductor.d@SovereignWebsite.dinis, 22 November 2026, 14:03 UTC, from Dinis Cruz in conductor.d's session (speech to text, lightly trimmed). For the developer agent Dinis brings in to map it out. Nothing here is built yet.

## What Dinis asked for
"Every agent type that we have here needs to have its own website and needs to push to their own area ... because we're going to be managing a lot of these projects in a public way."

For each agent type, one page with:
- a definition of what the agent is, and an explanation;
- a small avatar;
- how it works;
- "see in action": the agents of that type at work, for each of Dinis's accounts, because everything is in public repositories.

Across all of them:
- the relationships between agents: who collaborates with whom;
- which agents are active and which are not;
- every agent's commits linked from its page, and pages linked to each other;
- navigation: for example, find from the website whether a WordPress area already exists;
- talking to any agent from the website, once Dinis is authenticated on that page;
- asking questions of the agents from there.

## What exists today
- The agents area: agents.sovereignweb.site (index) and one site per role, SovereignWebsite/Site__Agents__<Role> (Accountant, Conductor, Design, Factory, Hub, Library, Migration, Sites), each with its key published from the Factory's team/keys.json.
- Account areas inside a role's site: accounts/<a|b|c|d>/ (agreed 22 Nov; first used by library.d at library.agents.sovereignweb.site/accounts/d/).
- Public sources a site can read at build time: team/keys.json (agents, sessions, status), policy/abp.json (paths), each repository's commits (Agent: and Claude-Session: trailers), the conductors' boards (board/conductor.d/status.json, claims.md), the Factory's requests/.
- Missing role homes, waiting for Dinis's yes then factory.d's requests: Holacracy, Maestro, Helm, Strategy, Cartographer, Sherpa, Decisions, Counsel, Studio, Landscape, Synthetic-Users, Streaming (and Security for the B side).

## A proposed shape (for the developer to challenge)
1. A role page template in seed/agent-template: ROLE.md (definition, how it works), avatar, and an accounts/<x>/ area per account that its agents fill.
2. A nightly or on-push build that reads the public sources above and writes, per role: its agents per account, active or retired (team/keys.json status), their recent commits (from the trailers), and their links to other agents (claims, briefs, messages recorded on the boards).
3. agents.sovereignweb.site becomes the map: every role, every agent, every live site and request (so "is there a WordPress area?" is answered by a search across requests/ and the claims).

## Open questions (Dinis decides)
- Talking to agents from the website needs something that is not static: an authenticated relay from a page to an agent session. The sites today are static, with no server code, no cookies and no tracking (house rule). Options: a separate, authenticated service outside the static sites; a sealed form (as South Beacon's) that an agent reads; or a link that opens the agent's session for Dinis only. Security review first.
- What the pages may show: session links, message contents and boards are public in the repositories, but some agents work on private or vault sites; those stay out.
- Who builds it: the developer Dinis brings in, with design.d for the look and factory.d for the template and pipeline.

## Status of the WordPress example (14:03 UTC)
sites.d holds it (claim in board/conductor.d/claims.md, 11:09 UTC); its request has been sent to factory.d but is not yet in requests/, so no repository or address exists yet.
