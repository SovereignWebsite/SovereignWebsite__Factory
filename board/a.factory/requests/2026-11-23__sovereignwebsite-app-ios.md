# Request: SovereignWebsite/SovereignWebsite__App__iOS (R7, the first R4 case)

By a.factory@SovereignWebsite.dinis, 23 November 2026 23:57 UTC (`date -u`). A repository request for Dinis's merge. a.factory creates nothing: the Factory's CI bot creates the repository when the entry below lands in org/repos.json.

## What it is
The Sovereign Website app for iOS: edit a website from an iOS app with Apple Intelligence models, in three tiers (feedback on a site that exists; edits made locally; a website from scratch), voice-driven, published to GitHub or other hosts, or kept on the device or in iCloud as a zip. Owner: a.ios (account A, https://claude.ai/code/session_018yvwtM1iAswu3fdUqUxbWT).

## The R4 chain

| Step | Who | Evidence | State |
|---|---|---|---|
| 1. Brief | a.maestro | PrompTugal__News__Website board/team/maestros/briefs/2026-11-23-a-any-agent-routing-chain-of-evidence-ios.md (R4, R7) and 2026-11-23-a-r7-sovereign-website-ios-app.md, from Dinis's words in a.maestro's session (~16:45 and ~19:00 UTC) | done |
| 2. Sites review | d.sites | Unsigned: d.sites has no commit rights yet. The only record is a.maestro's relay line in PrompTugal__News__Website board/team/maestros/from-a.md (22:24Z), from d.maestro's vault line (a.maestro, 24 Nov 00:09 UTC): no objection to the name (an app, so the Site__<Group>__<Name> rule does not apply), with two conditions (below) | done, unsigned |
| 3. Factory | a.factory | This file and the entry below, signed | done |
| 4. Security | security (a security agent) | review for abuse and prompt injection | pending |
| 5. Decision | b.decisions, on Dinis's word | a decision record naming the repository | pending |
| 6. Merge | Dinis | the org/repos.json entry to dev | pending |

## d.sites's conditions (to carry into the repository's README and CLAUDE.md)
1. The first page says what recorded voice is kept, where and for how long, with nothing unsealed.
2. For tier two, name whose key signs the pushed HTML, and keep that push a one-way door for the owner.

## Naming
No naming rule for apps exists in the Factory: requests/README.md covers `Site__<Group>__<Name>` and `Redirect__<Group>__<Name>` only. The organisation's own repositories use `SovereignWebsite__<Name>` (org/repos.json), and VoiceDebrief's app is `VoiceDebrief__App__iOS`, so `SovereignWebsite__App__iOS` follows both. Proposed: record `SovereignWebsite__App__<Platform>` as the rule for apps in requests/README.md once Dinis agrees.

## The entry for org/repos.json (proposed)
Not a site: no Pages, no domain, no seed. Public and dev-default from `defaults`.

```json
{
  "name": "SovereignWebsite__App__iOS",
  "description": "The Sovereign Website app for iOS: change a website by voice, with on-device models, and publish it where you choose.",
  "pages": false
}
```

org/** is not in a.factory's proposed paths (requests/**, team/keys.json, board/a.factory/**). The site request format (requests/<date>__<label>/site.json) makes only Site__ repositories. So this entry is committed either by factory.c (which holds org/**) or by a.factory if Dinis adds org/repos.json to its paths. Dinis's choice.

## Dinis's parts, one-way
- Creating the repository (this merge, or a b.decisions record naming it).
- Whether the repository is public (the default) or private: an app's signing and TestFlight settings may argue for private.
- Apple developer account and TestFlight (R8 actions and A4) are outside this request.
