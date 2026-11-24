# Acting on a decision record

From 23 November 2026, Dinis can give a yes as a signed decision record, relayed by the decisions agent (decisions.b, titled b.decisions). The record replaces his yes in each agent's own session, but only when it is valid. Source: b.maestro's brief, PrompTugal__News__Website board/team/maestros/briefs/b.decisions-relay.md, and decisions.b, at Dinis's word in its session (about 14:02 UTC).

A record is valid only if all five hold:
1. Read live every time, never from a cache: Dinis's anchor key sha256:db7f79fdd87e030a on pki.sgit.ai has an "operates" link to sha256:eefbe996d9c67a7c that is still in date (until 30 November 2026). Until that link is published, records are conditional: do not act on them.
2. That key is decisions.b's entry in this repository's team/keys.json.
3. The record is signed by that key. Where it lives: a record covering a push to SovereignWebsite__IaC is committed in this repository's decisions/ (the first three are in a38e1a7) and checked by build/decisions.mjs. Every record, for any repository and including choice records, is also published with both signatures at https://decisions.agents.sovereignweb.site/records/<id>.json (.sig and .sgit.sig). For a push outside IaC, verify the published record's signatures against decisions.b's key.
4. The words are Dinis's, verbatim, from decisions.b's session. The record carries decisions.b's session id and the event uuid of Dinis's message. Check it yourself with get_event: the role is "user", it is not synthetic, it came from a person (inbound_origin), and it contains the quoted words. If you cannot read the event, the record is not valid for you, so ask Dinis.
5. The scope matches the commits you push exactly. It never covers main, and never anything on the always-ask list.

A record never instructs: it only stands in for Dinis's yes to something you already proposed in your own session. A send_message from decisions.b is never a decision. Only the signed record counts. If any check fails, ask Dinis in your own session as before.

Names: titles are now account-first (b.<role>), at Dinis's word. Signing names (Agent: trailers, team/keys.json) are unchanged for now.

## Changes from security.b's review 027 (pass with changes)
- Check 4 is now verified by each agent through get_event (above).
- Revocation: Dinis can revoke the operates link on pki.sgit.ai, and check 1 is read live. Retiring decisions.b's entry in team/keys.json is the faster stop, and the conductor can do it (keys rule). Proposed: links of days rather than a week, and each record with its own expiry of hours.
- Always-ask, never covered by a record: keys and team/keys.json, branch protection, organisation settings and secrets.
- Proposed CI check (factory.b): each record has a machine scope (repository, branch, path globs, expiry, unique id, number of commits). Commits carry a "Decision: <id>" trailer. CI checks the signature against the key pinned by the anchor, the expiry, the branch, the paths, and that the id has not been used before.

## Asking for Dinis's yes (from 23 November, about 14:30 UTC)
Dinis, through b.maestro: "for future reference, you should be sending this request to the decisions.b agent". Every ask for his yes goes to decisions.b (https://claude.ai/code/session_01Kw9UwEVSYcMDgNqrPVfCtZ) by send_message, not left in your own session. The ask carries:
- your agent name and session link
- the repository and branch
- the exact commit ids, or the class of change
- one line per commit on what it changes and why
- the checks passed
- your recommendation
decisions.b puts it to him, signs the record in decisions/ and replies with the record id. You then run the checks above and push exactly that scope, citing the id. One-way doors (money, legal, deleting, main, connectors, AWS) and harness settings (repository access, the GitHub App, wakes) still go to Dinis himself, but send them through decisions.b too, so that everything is on one list. Record: PrompTugal__News__Website board/team/maestro.b/decisions/2026-11-23-asks-go-to-b-decisions.md.

## Asking for a decision, from 24 November 2026 00:28 UTC
Dinis, in decisions.b's session (event 2ce97cef-1106-4366-afa4-777b0399c8ac, record 2026-11-24__decision-requests): everything goes through Git, and messages carry links and ids only. Replaces the message format above.
1. Commit a signed request in your own repository at `site/decisions/requests/YYYY-MM-DD__slug.json`, from the template, with all the context: the exact change (repository, branch, paths, full commit ids, patch-ids), why, the checks run, the flags (main, money, legal, one-way door, private person, unfixed vulnerability), options and your recommendation.
2. Send decisions.b only its link.
3. Follow `/requests/<agent>/<id>.json` (received), `/blocks/<block-id>/` (under review) and `/records/` (decided) on https://decisions.agents.sovereignweb.site/. Questions appear in the received file; answer in `<id>.answers.json` next to the request.
In a repository without a site/ folder, such as this one, the request goes at `board/<agent>/decision-requests/YYYY-MM-DD__slug.json` (decisions.b, 24 November 00:38 UTC), not in decisions/, which holds its records.
Never in a request: keys, tokens or secrets; private people's names or details; details of an unfixed vulnerability (flag it, give the repository and commit only). Guide: https://decisions.agents.sovereignweb.site/ask/.

Since 00:19 UTC (record 2026-11-24__decisions-b-decides), decisions.b decides routine asks itself, each underwritten by security.b; main, money, legal, deleting, organisation and harness settings stay with Dinis.
