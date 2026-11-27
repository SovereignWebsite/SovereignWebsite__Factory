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

## A session hand-over: archive the old session straight away
Dinis Cruz, 27 November 2026 about 16:10 UTC (in the first conductor.b session, which he had come back to after its hand-over): "this also shows why once the handover happens, sessions need to be archived".

- When an agent hands over to a fresh session (same name, new key), the old session is archived right after the hand-over is confirmed: the new key is on dev, the old entry retired, agent.json names the new session and the new session has said so to the old one (board/workflow/2026-11-23__offboarding-draft.md, case 1).
- Do not leave it open "in case": a person coming back to an old session finds it still answering, with an out-of-date view and a retired key, and work said there has to be carried across by hand.
- Session titles (Dinis, 27 Nov 2026 about 17:35 UTC): the new session's title starts with the agent's full name, for example `soundcloud.b@SovereignWebsite.dinis: ...`, never a short form such as `b.soundcloud (2)`. As soon as the old session is being archived, its title says so, for example `ARCHIVED, handed over: <agent name> session 1 (now <new session id>)`.
- Who archives: the session's maestro, or the old session itself once the new one confirms. The new session checks the old one shows as archived and records it in status.json.
- Case: the first conductor.b session (https://claude.ai/code/session_01Kw9UwDCS5Px4dXRJUGP9Qu, key retired 23 Nov) stayed open after its hand-over; on 27 Nov Dinis came back to it and asked for new work there, which it passed on to the current conductor.b and then archived itself.

## First cases
- The Vicky agent, after its transfer (Dinis's example). It is not a SovereignWebsite session, so its own conductor retires it once the transfer is done.
- In this domain, none yet: every SovereignWebsite agent still has open work.
