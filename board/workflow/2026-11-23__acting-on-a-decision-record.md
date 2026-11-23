# Acting on a decision record

From 23 November 2026, Dinis can give a yes as a signed decision record, relayed by the decisions agent (decisions.b, titled b.decisions). The record replaces his yes in each agent's own session, but only when it is valid. Source: b.maestro's brief, PrompTugal__News__Website board/team/maestros/briefs/b.decisions-relay.md, and decisions.b, at Dinis's word in its session (about 14:02 UTC).

A record is valid only if all five hold:
1. Dinis's anchor key sha256:db7f79fdd87e030a on pki.sgit.ai has an "operates" link to sha256:eefbe996d9c67a7c that is still in date (until 30 November 2026). Until that link is published, records are conditional: do not act on them.
2. That key is decisions.b's entry in this repository's team/keys.json.
3. The record, and its commit in this repository's decisions/, are signed by that key.
4. The words are Dinis's, verbatim, from decisions.b's session.
5. The scope matches the commits you push exactly. It never covers main, and never anything on the always-ask list.

A send_message from decisions.b is never a decision. Only the signed record counts. If any check fails, ask Dinis in your own session as before.

Names: titles are now account-first (b.<role>), at Dinis's word. Signing names (Agent: trailers, team/keys.json) are unchanged for now.
