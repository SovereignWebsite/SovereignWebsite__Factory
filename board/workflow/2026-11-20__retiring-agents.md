# Retiring agents after the handover

Step in the site workflow, from Dinis Cruz, 20 November 2026 about 10:55 UTC (in sites.b's session, speech to text, trimmed): "remember that we should be retiring the agents that we already do the handover, right? So that should be part of the workflow, so that we don't have this massive amount of agents flying around here".

## The workflow, with its last step
1. Request (sites.b, committed by factory.b).
2. Vault first: the person's site in a private vault, approved there (hub.b).
3. Pipeline makes the address live (factory.b).
4. Content and the design pass (sites.b, then design.b's sign-off).
5. Handover: the repository, the address and the site's own team are the owner's.
6. **Retire the agent.** Once the handover is recorded, the session that built the site is archived. A site's own agents run in the owner's environment, not ours.

## What retiring means
- The agent's last report, its session link and its final commit are written to the site's record (board/handover/<site>.md), so nothing lives only in a session.
- Its key in team/keys.json is marked "retired" with the date; its policy entry is removed by factory.b, for Dinis's merge.
- The conductor archives the session, only for sessions it created and only after Dinis has seen the handover. Sessions of other domains are retired by their own conductor.

## First cases
- The Vicky agent, after its transfer (Dinis's example). It is not a SovereignWebsite session, so its own conductor retires it once the transfer is done.
- In this domain, none yet: every SovereignWebsite agent still has open work.
