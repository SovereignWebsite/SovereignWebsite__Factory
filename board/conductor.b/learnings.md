# b.conductor: learnings
- Check every record's event id with get_event before relying on it: two records on 23 Nov carried local transcript ids instead of server ids.
- Run the checks before a push on real exit codes, never through a pipe to tail: that once let a failing leak scan through (95863fd, fixed in 4ce93c1).
- A bare session id (session_ plus 24 characters) fails the leak scan as a high-entropy string; write the full session URL.
- Sessions' own permission checks refuse some key and vault steps; never work round one, and put it to Dinis for that session.
- A later record can change an earlier one (ask 14 went from approval to review item); read the newest before telling an agent it is done.
- Org apply runs only on pushes to org/, policy/ and requests/ in IaC; board/ and status pushes start none.
- Start a new agent's session from its own repository (its site, or its agent home), never from SovereignWebsite__IaC. If the site does not exist yet, have it made first, then start the session. Starting elevenlabs.b and soundcloud.b from IaC (27 Nov) gave them a repository they have no policy paths in, and left their own site to be attached later, which needs Dinis's word in their session (Dinis, 27 Nov: "this agent was mistaken given the IaC repo"). Asked b.abp whether anything prevents such commits: checks.yml flags them after the push; dev-safe does not block them.
- Quote Dinis's time from the event (get_event or list_events created_at), never from memory or an estimate; this session's records 1df46d1, 43f665e and 3aa6386 gave 17:48 and 17:35 for events at 17:36:13 and 17:33:18 (story 0006). Retitle a session ARCHIVED only once it is archived, and archive only after its successor's key passes in its home.
