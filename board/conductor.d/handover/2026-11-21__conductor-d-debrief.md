# Hand-over debrief: conductor.d@SovereignWebsite.dinis, 21 November 2026

Session: https://claude.ai/code/session_015gaHdbX954ByXJf8LH5FLL. Started by maestro.d (account D) at Dinis Cruz's word, about 22:04 UTC. Written 22 November 2026 at 00:01 UTC.

## What exists
- conductor.d's key and policy entry on Factory dev (maestro.d's b7c8bfd and 5eb7fde, pushed with conductor.d's board at Dinis's word; that one push's "policy paths" check failed, as Dinis accepted, because maestro.d is not in the policy). Key sha256:4a4dabd62c22260e, signing sha256:2b8c79b7d9ae18da.
- Keys on dev in team/keys.json: sites.d, hub.d, streaming.d (e9d4c7e, 6938556, eed8e05) and design.d (a6b001c), each signing line checked against its bundle.
- The team on account D: sites.d, hub.d (started by maestro.d), streaming.d (started by sites.d at Dinis's word, builds Site__Tool__Streaming), design.d (started by conductor.d at Dinis's word, a design loop every 2 hours for the .d sites only, scheduled task trig_01RjNGiysodf39cArd2cLeXm, first wake 22 Nov 00:59 UTC).
- Claims in board/conductor.d/claims.md: streaming.d on Site__Tool__Streaming; design.d's new paths in Site__Agents__Design; notes for sites.b and design.b.

## Decisions by Dinis (in this session)
- "you can push to dev if you need to"; then: push maestro.d's commits with conductor.d's, accepting one red Checks run.
- "merged, push the keys to dev" (sites.d, hub.d, streaming.d); "Can you act on those?" (design.d's key).
- Yes to conductor.b's split: the .b agents keep what they hold; the .d agents take only requests no .b agent has started, each claimed first.
- Start the designer on a schedule: design.d, .d sites only, every 2 hours, committing to Site__Agents__Design.
- streaming.d's name is streaming.d@SovereignWebsite.dinis (in sites.d's session, as sites.d reported).

## Lessons
- check-signatures trusts only the OpenSSH form of bundle.sign: every agent signs with its sgit ECDSA half, never a separate ed25519 key (sites.d first made one).
- The leak scan refuses a public key anywhere but team/keys.json: keep bundles out of the board.
- A team/keys.json push to dev was refused by this session's permission check until Dinis said so explicitly; put keys on a branch first.
- Never rewrite a pushed branch: a superseded one is left unmerged (work/conductor.d-sites-d-key) and a new one made.
- Take every time from date -u at the moment of writing; twice a time was guessed and had to be corrected.

## Open (all with Dinis)
- streaming.d: name it keeper of Site__Tool__Streaming and allow push access, in its session; it holds a signed commit (d98d2d5).
- sites.b: tell it the Streaming build moved to streaming.d (accounts B and D cannot message).
- Read access in their own sessions: hub.d (Factory, Vault, Site__Agents__Hub) and design.d (Factory).
- The first work for sites.d and hub.d.
- Account B's SovereignWebsite wakes are paused until Mon 23 Nov 00:25 UTC; most of design.b's team is paused (Dinis, via maestro.d). The split holds while they are paused.
