# Incident: a site published with a key not yet in team/keys.json

Filed by conductor.d@SovereignWebsite.dinis, 22 November 2026, 15:28 UTC, at Dinis Cruz's request (made in chiswick-cheese-market.d's session). The agent's own record: https://github.com/SovereignWebsite/Site__Organisation__Chiswick-Cheese-Market/blob/dev/docs/incidents/2026-11-22__pushed-before-key-published.md (126dc40). For the ABP's owner (Dinis) and the keepers of the policy templates (factory.d; factory.b through conductor.b).

## What happened
- conductor.d started chiswick-cheese-market.d at 14:27 UTC with only the cheese market's repository in its session, and told it to publish its own key in the Factory before committing anywhere.
- Its session could not reach the Factory: the session's permission check refused add_repo with push twice, and the git proxy refused the push (the Factory was not in the session's repository set). Its key commit dd12fb6 passed every Factory check locally.
- At Dinis's word in its session (~14:55 UTC, "Yes add those fixes and make this live") it pushed 49f9ede and 247e88c to the cheese market's dev, signed by a key not yet in team/keys.json. v0.1.13 went live at 14:58 UTC.
- Nothing refused it. Only Dinis noticed.

## Dinis's questions
**A. How do we make sure, by policy, that this does not happen again?**
**B. If Dinis had not noticed it, would the ABP have caught it?**

## Answer to B: no
- build/check-signatures.mjs and build/abp.mjs paths run only on SovereignWebsite__Factory. A site's Pages pipeline checks content (links, HTML, axe, previews, dashes, leaks), not who signed.
- Each site's ABP says so itself: the rules for agents "are followed by the agents and reviewed in their sessions and in the repository's history; they are not yet checked automatically".
- The deviations on conductor.d's board so far (library.d's early push, factory.d's force-push, this one) are all there because the agent reported them. Nothing finds an unreported one.

## Proposals for A (Dinis decides; owners named)
1. **A signer check in every site's Pages pipeline** (factory.d, in seed/*/.github/ci; then each keeper for sites already seeded): before publishing, verify each new commit on dev against the Factory's team/keys.json (the build already fetches it for site/key.json) and refuse to deploy otherwise. An owner's override is a recorded line in the commit message ("Owner override: <quote>, <where>"), which the check reports but lets through.
2. **Start-up order** (conductor.d, from now): a new agent's session gets the Factory as well as its site, or its key is on dev, before it is told to work. conductor.d's own gap here: it started this agent with one repository.
3. **A regular review of every session and repository** (needs Dinis's word for a scheduled task and an agent to run it, for example the security agent): daily, list commits across the SovereignWebsite repositories whose signature or Agent: trailer matches no published key, force-pushes, pushes to main and pushes made before a key landed, and post the report on the board.
4. **Overrides recorded**: every push at an owner's word outside the rules names it in the commit, so the review tells an approved exception from a slip.

## Status
- dd12fb6 still waits for a session that can push to the Factory (Dinis's yes for add_repo in chiswick-cheese-market.d's session).
- The cheese market's commits are otherwise as Dinis asked; nothing is reverted.
