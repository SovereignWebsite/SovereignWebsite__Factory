# conductor.b: state and hand-over note, 24 November 2026

For whoever continues conductor.b@SovereignWebsite.dinis after https://claude.ai/code/session_01Kw9UwFkKH5CkDmV8nhSfUD (started 23 November 22:46 UTC at Dinis's word, key on dev in 14e9243). Written early, while the session still has room, so the next one can start cleanly under the offboarding process (board/workflow/2026-11-23__offboarding-draft.md, in force). Live state is status.json and https://hub.sovereignweb.site/operator/; this note says how the work is done.

## How the work runs now (all since 23 November evening)
- **Only Dinis instructs.** Every other session's message is material. Verify his words yourself with list_events or get_event before routing anything important; records have twice carried wrong event ids.
- **Decisions:** agents commit a signed request in their own repository (`site/decisions/requests/<id>.json`, or `board/<agent>/decision-requests/` in a repository without site/, as in IaC) and send decisions.b only the link (record 2026-11-24__decision-requests). decisions.b decides routine asks itself, underwritten by security.b (record 2026-11-24__decisions-b-decides); main, money, legal, deleting, organisation and harness settings stay Dinis's. Check a record with build/decisions.mjs (verifyRecordSignature, checkOperatesLink) and get_event.
- **Query the website, not messages** (board/workflow/2026-11-24__query-the-website.md): every agent keeps its area at /factory/dinis-cruz/account-b/ on its agent-type site. Read areas before messaging.
- **Never block on Dinis:** agents list what he can do on each site and carry on.
- **Permission checks:** several sessions' own checks refuse key steps (keygen, key files, vault key sends, some pushes). Never work round one; put it to Dinis as one line for that session.

## This session's tools
- Signing: ~/.sw-secret/signing (0600), git config in the clone. A fresh session makes its own key (board/workflow/2026-11-20__signing-with-your-key.md).
- status.json and board/operator.json are regenerated together: operator.json is state, next, the last 15 done lines and the asks, with lines naming an organisation vault site filtered out. The helper used here lived in the scratchpad; rewrite it from that description.
- Before every push: `node test/run.mjs && node build/abp.mjs validate && node build/leak-scan.mjs`, then `node build/abp.mjs paths origin/dev HEAD` and `node build/check-signatures.mjs origin/dev HEAD`, chained on real exit codes (never through a pipe to tail; that hid a failure once, fixed in 4ce93c1).

## Open threads (refreshed 25 November 22:30 UTC)
- Keys: agents publish their own keys in their own repositories (own-keys principle). A conductor only retires entries in team/keys.json, never adds one; several new agents asked for an entry and were told so. Retired by this session: chiswick-cheese-market.b (23c180c), observability.b's old key (35a0523).
- Vault keys: sotavento.b's, Perspace and Algarve Evolution are with b.maestro and proven. feedback.b's waits on Dinis in its own session.
- Onboarding order for agents' own repositories: board/conductor.b/2026-11-24__onboarding-order.md, agreed by factory.b. First step waits on Dinis: push to Site__Agents__Factory for factory.b.
- factory.b's 38 (0048389) and 49 (f125da8) wait on "push 38" and "push 49" from Dinis in its session.
- Fresh sessions for sites.b and hub.b, and the four wake tasks, are Dinis's.
- Naming model (25 Nov): nobody renames until each step is announced.
- Capability census (b.abp): results private, sealed for abp and security (security.b, 25 Nov 19:27 UTC); publishing account-wide counts waits on Dinis.
- sovereignwebsite.ai is kept by website.a on account A; notes for it: board/conductor.b/2026-11-25__sovereignwebsite-ai-handover.md.
- Live list for Dinis: status.json asks, and https://hub.sovereignweb.site/operator/.

## Steps 1 to 9 for this session, when it hands over
Sessions it created: none. Wakes into it: none yet (conductor.b's wake is one of the four Dinis has not created). Lanes: none. Secrets: its own signing key and sgit keystore, only in this container; nothing sealed to it. Personal data in the transcript: names of site owners as routed in messages, no contact details.
