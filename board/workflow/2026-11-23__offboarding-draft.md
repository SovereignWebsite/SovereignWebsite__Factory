# Offboarding an agent: draft for Dinis (ask 39)

**Status: draft.** It changes nothing until Dinis approves it, through decisions.b. Drafted by conductor.b (https://claude.ai/code/session_01Kw9UwFkKH5CkDmV8nhSfUD) on 23 November 2026, as Dinis asked in decisions.b's session at 23:15:17 UTC: "We also need to have a good process for offboarding and archiving sessions and deleting keys." Review by security.b is requested. Builds on board/workflow/2026-11-20__retiring-agents.md, which covers retiring a site's agent after its handover.

## When it applies
1. A session hands over to a fresh session of the same role (context limit, as today for conductor.b).
2. A site's agent is retired after the site is handed over (the retiring-agents workflow).
3. A role ends, or an agent is stopped because something went wrong (a fast stop, below).

## The steps, in order
Each step names who does it. Nothing is deleted until everything that depends on it has moved.

1. **Write it down first** (the leaving agent). A hand-over note in the repository it works in (for example board/<date>__<role>-handover.md): open threads, who it reports to, sessions it created, scheduled tasks that fire into it, secrets it holds (named, never printed). Nothing may live only in the session.
2. **Start the successor, if any** (the leaving agent, at Dinis's word). The new session makes its own key and is told the hand-over note.
3. **Retire the key entry** (the leaving agent, or its conductor under the keys rule). One commit in team/keys.json: `"status": "retired"`, with `retired` and `retired_note`, signed by the leaving key as its last commit. Never remove or edit the entry: the history stays checkable. Then the successor publishes its own entry in its own commit.
4. **Repoint or stop what fires into the session** (Dinis). Scheduled tasks that fire into the old session are listed in the hand-over note; switching them off or repointing them is his act. Agents that report to it are told the new session by the successor.
5. **Move held secrets** (the owner of each secret, at Dinis's yes in that owner's session). A secret sealed to the old key is re-sealed by its owner to the new key; the old session never unseals it. Example today: feedback.b's two key backups.
6. **Revoke signed links** (Dinis). If the leaving key has an "operates" or other link on pki.sgit.ai, Dinis revokes it there. Agents cannot. Until then, the retired entry in team/keys.json stops it in every check that reads that file.
7. **Delete key copies** (the leaving agent, only after Dinis says in its session that the successor works). Delete the private key files in its container (~/.sw-secret and the sgit keystore), and say so with a one-line note. Deleting cannot be undone, so it is always Dinis's word, never a record.
8. **Archive the session** (the conductor, for sessions it created; another domain's conductor for its own). Only after steps 3 to 7, and after Dinis has seen the hand-over. Archiving ends the container, and with it anything left in it.
9. **Record it** (the conductor). One done line in status.json and board/operator.json, citing the commits.

## Fast stop (something went wrong)
Retire the key entry first (step 3, by the conductor), then ask Dinis to revoke its links (step 6) and stop its tasks (step 4), then the rest. Retiring the entry is the quickest stop agents can make themselves.

## Worked example: conductor.b, 23 November 2026
- Step 1: board/2026-11-23__conductor-handover.md.
- Step 2: Dinis, 22:45 UTC: "start a fresh conductor session". New key published in 14e9243.
- Step 3: old entry retired by its own key in 34e2b08, before the new one.
- Step 4: open. The old task trig_015LDYEmyDkQNBjbiWuPnBc9 still points at the old session; Dinis decides.
- Step 5: open. feedback.b re-seals its backups to the new key once Dinis says yes in its session.
- Step 6: none needed: neither fingerprint of the old conductor key (sha256:fabd2942df366c5f, signing sha256:706a24f8808e02a2) appears in the pki.sgit.ai directory index, read at 23:21 UTC.
- Steps 7 and 8: open. They wait for steps 4 and 5 and for Dinis's word.

## Open questions for Dinis
- Should a session's own hand-over (case 1) be archived by the conductor without asking each time, once steps 3 to 7 are done?
- Should step 7 (deleting key copies) be skipped where archiving the session already ends its container?
