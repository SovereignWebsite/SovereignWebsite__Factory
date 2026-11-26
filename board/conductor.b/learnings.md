# b.conductor: learnings
- Check every record's event id with get_event before relying on it: two records on 23 Nov carried local transcript ids instead of server ids.
- Run the checks before a push on real exit codes, never through a pipe to tail: that once let a failing leak scan through (95863fd, fixed in 4ce93c1).
- A bare session id (session_ plus 24 characters) fails the leak scan as a high-entropy string; write the full session URL.
- Sessions' own permission checks refuse some key and vault steps; never work round one, and put it to Dinis for that session.
- A later record can change an earlier one (ask 14 went from approval to review item); read the newest before telling an agent it is done.
- Org apply runs only on pushes to org/, policy/ and requests/ in IaC; board/ and status pushes start none.
