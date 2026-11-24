# Plan: provenance in the Factory seed (every site lists every agent that touched it)

By a.factory, 24 Nov 2026 00:12 UTC. From a.maestro's brief board/team/maestros/briefs/2026-11-23-a-site-provenance.md (PrompTugal__News__Website), Dinis's words ~23:00 UTC 23 Nov. Assigned to a.factory by a.maestro (00:09 UTC); factory.c and d.factory review through a.maestro; d.design owns the footer. Not started in code: seed/**, build/** and test/** are not in a.factory's paths (waits on Dinis).

## What exists
- seed/site-template/site/data/agents.json: a hand-kept list ("each site agent adds its own entry"), empty at seed time.
- seed/*/.github/ci/signers.mjs: already refuses a commit with an Agent: trailer that is not signed by a key in team/keys.json or the site's own site/keys/, or whose Claude-Session: is not that key's session. A commit with no Agent: passes only if GitHub verified it (a person).

## The pieces
1. **Generator** `seed/site-template/.github/ci/agents.mjs`, run by build.mjs before the checks: reads `git log` (Agent: and Claude-Session: trailers, dates) and `site/data/provenance.jsonl`, and the Factory's keys (already fetched for signers.mjs), and writes `_site/data/agents.json`: per agent, name, role, account, home (`Site__Agent__<Role>`), sessions, first and last commit, count, signing fingerprint, and the non-commit acts. The Factory bot's seed commits and the request that made the site (path and merge commit) are included. Derived at build time, so it never drifts; the hand-kept file is kept only as extra notes.
2. **Provenance log** `site/data/provenance.jsonl`: one line per non-commit act (started, reviewed, relayed, decided): `{who, what, when, session, ref}`, appended in a commit signed by the agent named in `who`, so signers.mjs already authenticates it. The generator refuses a line whose `who` is not the signer of the commit that added it.
3. **CI check**: signers.mjs stays the gate. Add one rule: a commit that adds provenance lines may add only its own signer's lines. Tests in seed/.../ci tests and test/.
4. **Footer** "Who made this", linking to /agents/: d.design's design; the seed carries a placeholder hook only.
5. **Roll-out**: org-apply adds missing seed files only, so existing sites get agents.mjs but their build.mjs must call it: a one-line change per site, or a seed update path for Dinis to approve. First site: Site__Author__Donna-Freed.

## Open for Dinis
- Paths: seed/**, build/** and test/** for a.factory (with his merge), or this goes to factory.c.
- Whether org-apply may update an existing site's build.mjs (today it never overwrites).
