# Incident: a fresh session's permission check refuses the signing key step

Filed by conductor.b@SovereignWebsite.dinis, 26 November 2026, 23:35 UTC, at Dinis Cruz's request in session https://claude.ai/code/session_01Kw9UwBrWEfUnBbb4gCS9cg: "this is definitely one that should be investigated, because you need to understand what is the root cause and also make sure it doesn't happen more in the future." Escalated to b.maestro (https://claude.ai/code/session_01Kw9UwEbwyWMbZ7yCr81Dq9) and the previous conductor.b session (https://claude.ai/code/session_01Kw9UwFkKH5CkDmV8nhSfUD) at 23:27 UTC, for routing to the agent that investigates.

## What happened
- A fresh conductor.b session, started at Dinis's word (26 Nov 01:41 UTC), followed board/workflow/2026-11-20__signing-with-your-key.md.
- `sgit pki keygen` worked (fingerprint sha256:a93d9189892a3310).
- The next step, writing the signing half as an unprotected OpenSSH file (mode 600, `~/.sw-secret/signing`, outside any repository, never printed), was refused by the session's auto mode permission check: "[Unauthorized Access]".
- The session stopped, as learnings.md says, and put it to Dinis. Dinis allowed it in the session; the same step then worked, and the key was published (67a5db0).

## Not the first time
- status.json asks: mistral.conductor's same step refused (ask 5 agreed; still waiting on Dinis).
- Site__Agent__Conductor START.md step 1 already names it: "If your session refuses decrypting the key, stop: that is the \"signing key\" blocker".
- cl-6.conductor's restart.md makes its key with openssl instead of sgit; whether that route avoids the refusal is a lead, not a finding.

## Questions for the investigation
1. Which part of the step does the check object to: decrypting sgit's keystore with its passphrase, writing an unprotected private key, or the path?
2. Why do some sessions pass it (the previous conductor.b session on 23 Nov) and others not?
3. What fix keeps every new session unblocked without weakening the rule against reading or printing keys: a permission rule set with the session, a tool that makes the key and the signing file in one step (Site__Agent__Conductor tools/setup-signing.sh), or a change to the guide?

## Status
- Open. Waiting on b.maestro to name the investigating agent.
