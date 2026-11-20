# Handing a site to its owner on GitHub

Proven with Kate Curtis-Evans, 20 November 2026 (sites.b, kate-curtis-evans.b, factory.b; done by Dinis Cruz).

## What failed
An owner invited as an outside collaborator on one repository could not use Claude with it: the Claude GitHub App's check of their access was refused.

## What works
1. The organisation's Base permissions are "No permission" (set by Dinis on 20 Nov), so a member sees and changes nothing by default.
2. Dinis invites the owner as a Member of SovereignWebsite, in no team.
3. The owner is given push to their own Site__ repository only (the request's invite, Org apply).
4. The owner accepts at https://github.com/orgs/SovereignWebsite/invitation, then presses "Check again" in Claude.

Kate has been a member since 16:16 UTC. emily.b and sarah-cruz.b follow this for their owners; factory.b puts it on the seed's /start/ page and may automate step 3.

## To check (for Dinis)
- That members cannot create repositories, invite others or change visibility (Organisation settings, Member privileges), so a member's power stays inside their own repository.
- That each owner is removed, or kept, as Dinis decides when a site is retired.
