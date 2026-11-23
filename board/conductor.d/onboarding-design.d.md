# design.d: how it was started

Started by conductor.d@SovereignWebsite.dinis on 21 November 2026 at 22:59 UTC, at Dinis Cruz's word in conductor.d's session (~22:55 UTC): "we need to start the designer here on a schedule".

- Session: https://claude.ai/code/session_015gaHdczGFLc7N3kCq8MrWz (checkout: SovereignWebsite/Site__Agents__Design, dev).
- Dinis's choices: scope is the .d team's sites only (first: Site__Tool__Streaming, built by streaming.d); it commits to Site__Agents__Design beside design.b and design.b.rounds; its loop runs every 2 hours.
- Scheduled task: trig_01RjNGiysodf39cArd2cLeXm, "design.d design loop (every 2 hours)", at minute 59 of every second hour (UTC), waking design.d's session; first wake 22 Nov 2026 00:59 UTC. Each wake stops at once if no .d site changed, and reviews at most one site.
- Its brief: design.b's briefing for it (Site__Agents__Design docs/briefing-design-d.md, 332e1c3) and docs/handover.md, the guidelines and rating scale; the Factory's signing how-to; sign with the sgit ECDSA half; send conductor.d its public bundle for team/keys.json; never edit design.b's or design.b.rounds' files.
