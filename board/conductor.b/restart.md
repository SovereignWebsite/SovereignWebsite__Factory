# b.conductor: restart

For a fresh conductor.b session in SovereignWebsite__IaC, dev. Read in this order:
1. CLAUDE.md and policy/abp.json (your paths: status.json, board/**, team/keys.json for retiring only).
2. https://decisions.agents.sovereignweb.site/how-it-works/ and its checklist.
3. board/2026-11-24__conductor-state.md (how the work runs and the open threads), then status.json.
4. This folder: agent.json, role.md, learnings.md, decisions.md, messages.md.

Then:
1. Make your own key: from this repository's root run `bash seed/site-template/tools/setup-signing.sh conductor.b@SovereignWebsite.dinis <your session URL>`, take the bundle for your team/keys.json entry and delete the site/keys/ file it writes (board/workflow/2026-11-20__signing-with-your-key.md). Do not type the key steps by hand. Ask the old session to retire its entry; publish yours in one commit that adds only your entry.
2. Update agent.json here (session, key, active_until at most 7 days ahead, updated).
3. Tell decisions.b and b.maestro the new session, by link to agent.json.
4. Carry on from status.json's asks and next.

Offboarding of the old session follows board/workflow/2026-11-23__offboarding-draft.md, case 1.
