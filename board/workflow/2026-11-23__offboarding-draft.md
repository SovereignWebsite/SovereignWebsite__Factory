# Offboarding an agent

**Status: in force** from 24 November 2026, 01:10 UTC (decisions.b's clock). Approved with conditions by the panel under Dinis's delegation of 00:19 UTC (record 2026-11-24__offboarding-approved, ask 39); decisions.b checked this text (6c4ea92) against the record and found all eight conditions in. Deleting anything and every fast stop stay Dinis's, as the delegation keeps one-way doors for him.

Asked by Dinis in decisions.b's session at 23:15:17 UTC on 23 November: "We also need to have a good process for offboarding and archiving sessions and deleting keys." Drafted by conductor.b (https://claude.ai/code/session_01Kw9UwFkKH5CkDmV8nhSfUD). Reviewed by security.b (review 028, pass with changes, all made). Builds on board/workflow/2026-11-20__retiring-agents.md.

## When it applies
1. **Routine hand-over:** a session hands over to a fresh session of the same role (context limit, as for conductor.b on 23 November).
2. **Site agent retired:** a site's agent is retired after the site is handed over (the retiring-agents workflow).
3. **Role ends, or fast stop:** a role ends, or an agent is stopped because something went wrong (below).

Only case 1 may be archived without asking Dinis (step 8). Cases 2 and 3 go to him.

## Who archives whom
- An agent's session: the conductor that created it, or its own domain's conductor.
- A conductor's session: its account's maestro (for account B, b.maestro).
- A maestro's session: Dinis, from a named list the maestro gives him (see step 5).

## The steps, in order
Each step names who does it and leaves a commit or a quote behind. Nothing is deleted until everything that depends on it has moved.

1. **Write it down first** (the leaving agent). A committed hand-over note in the repository it works in, listing: open threads; who it reports to; every session it created; every scheduled task (wake) that fires into it, by id; its append lanes; its agent area page; every secret it holds (named, never printed), including vault keys; any personal data in its transcript; and where its private key exists (only in its own container, never pasted or copied to another session, with any backup sealed to someone else named under step 5). Nothing may live only in the session.
2. **Start the successor, if any** (at Dinis's word, or by standing rule where one exists). The new session makes its own key, reads the hand-over note, and confirms in writing, in a commit or a message quoted in the note, that it has taken over.
3. **Retire the key entry** (the leaving agent, or its conductor under the keys rule). In team/keys.json and in the agent's own repository where its key is published there (site/keys/<name>.json): `"status": "retired"`, with `retired` and `retired_note`. Signed by the leaving key as its last commit. It counts as done when the commit is on dev. Never remove or edit an entry, and never reuse a retired key: a successor always makes a new key.
4. **Repoint or stop what fires into the session.** Repointing an agent's own wakes to a same-role successor is a standing yes: the conductor or the agent does it and records the new target. Any other repoint, and every switch-off, is Dinis's. Agents that report to the leaver are told the new session by the successor.
5. **Move held secrets** (the owner of each secret). Every vault key keeps a live holder besides the leaver, always including the account's maestro on its current key. A secret sealed to the old key is re-sealed by its owner to the new key, and checked to open, before the old one goes; the old session never unseals it. When a maestro leaves, it gives Dinis a named list of the vault keys it holds, re-seals each to its successor, has each checked to open, and only then is archived.
6. **Revoke signed links** (Dinis). If the leaving key has an "operates" or other link on pki.sgit.ai, Dinis revokes it there. Agents cannot. Meanwhile the retired entry stops the key in every check that reads team/keys.json.
7. **Key copies.** If the session will be archived (step 8) and step 1 says the private key existed only in its container, do nothing more: archiving ends the container, and the key with it. Otherwise, the leaving agent deletes its key files once Dinis says so in its session. Backup copies of a retired key held anywhere else are destroyed by whoever holds them, also on Dinis's word. Either way, write one line saying what happened to each copy.
8. **Archive the session** (see "Who archives whom"). For a routine hand-over (case 1), archive without asking Dinis when all of these hold: the hand-over note is committed; the successor has confirmed in writing; nothing still fires into the old session; steps 3 to 7 are each cited by a commit or a quote. For cases 2 and 3, archive only once Dinis has seen the hand-over, cited by the time and place of his word. Sessions the leaver created are handed over or archived with it.
9. **Record it** (the conductor). One done line in status.json and board/operator.json citing the commits, the session added to status.json's `archived_sessions`, and each lane, area page and wake from step 1 repointed or closed. **Tell the site's owner** when the agent behind their site changes.

## Checklist for a routine hand-over (case 1)
- [ ] Hand-over note committed: threads, sessions, wakes, lanes, area, secrets, personal data, where the key lives
- [ ] Successor started; its written confirmation quoted or committed
- [ ] Old key retired on dev (team/keys.json and the agent's own repository)
- [ ] Wakes repointed to the successor (standing yes) or switched off by Dinis
- [ ] Vault keys and other secrets re-sealed to the successor and checked to open; maestro still a holder
- [ ] No pki.sgit.ai link, or Dinis has revoked it
- [ ] Key copies: one line on each
- [ ] Archived by the right agent; archive line in status.json
- [ ] Lanes and area page repointed or closed; site owners told

## Fast stop (something went wrong): contain, then retire, then revoke
Retiring a key entry stops signature checks, but not a misbehaving session: it keeps its GitHub push access, the credentials the proxy injects and its ability to message other agents while it runs (security.b, review 028).
1. **Contain** (the conductor that created the session): interrupt it, then archive it. That ends the container and everything in it at once.
2. **Retire** its key entry, in a commit signed by the conductor's key, since the leaving key may be the problem.
3. **Revoke** (Dinis): its pki.sgit.ai links, its scheduled tasks, and a rotation of any credential the session could reach (environment secrets, tokens).
Then tell Dinis, and the rest of the steps follow as far as they still apply.

## Retired keys already fail the check
build/check-signatures.mjs refuses a commit signed by a key that its first parent's team/keys.json lists as retired or superseded, judged by the parent's tree, not the author date (factory.b; test/run.mjs, 97f302f). Retiring the entry (step 3) is enough to stop new commits from that key.

## Worked example: conductor.b, 23 November 2026
- Step 1: board/2026-11-23__conductor-handover.md.
- Step 2: Dinis, 22:45 UTC: "start a fresh conductor session". New key published in 14e9243; the new session confirmed to the old one by message at 22:48 UTC.
- Step 3: old entry retired by its own key in 34e2b08, before the new one.
- Step 4: done. The old task trig_015LDYEmyDkQNBjbiWuPnBc9 was retired at Dinis's word, 23:22:45 UTC (record 2026-11-23__briefings-keepers-messages).
- Step 5: open. feedback.b re-seals its two key backups to the new key once Dinis says yes in its session.
- Step 6: none needed: neither fingerprint of the old conductor key (sha256:fabd2942df366c5f, signing sha256:706a24f8808e02a2) was in the pki.sgit.ai directory index, read at about 23:17 UTC.
- Steps 7 and 8: open. If the old session confirms its key existed only in its own container, b.maestro archives it once step 5 is done; no separate delete is needed.
