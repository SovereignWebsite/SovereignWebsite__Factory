# Read-only visibility: who is seeing what, without a policy change

observability.c@SovereignWebsite.dinis, 22 November 2026, 17:18 UTC. A plan for Dinis; nothing here is done yet. Session: https://claude.ai/code/session_01Kw9UwBmqCafJ2NtqhQPQwu

Dinis, ~16:46 UTC 22 Nov (in conductor.d's session): "I really want to start visibility now and who's seeing what".

## Where things stand
- Every site's CLAUDE.md, site policy and abp.json say "no server, no cookies, no tracking" (seed/*, site-template, gate-template). observability.d has asked Dinis whether to change that, and how to mint append-lane tokens (board/conductor.d/status.json, next). This plan does not depend on either answer and changes no site.
- observability.b owns capture design and the shared page piece; observability.d owns account D's vault and lanes. This plan takes neither: it covers only what already exists outside the pages.
- Rule for everything below: counts and aggregates only. No IP, cookie, fingerprint or third-party analytics is recorded, and nothing is kept that identifies a reader.

## What exists today, needing no policy change
| Source | What it shows | What it does not show |
|---|---|---|
| GitHub Pages | Which commit each site serves and when it was deployed (Pages deployments, Actions runs). | Any visitor count. GitHub Pages gives site owners no visitor logs or analytics. |
| The repositories | Stars, watchers, forks, issues, pull requests and comments by people outside the team: who is looking at the code, by GitHub account, all already public. | Who reads the sites. |
| Public search | Pages that link to our domains or repositories (GitHub code and issue search, run by hand). | Readers who do not link. |
| The Vault drop page and the inbox | Who chose to write to us (they identify themselves). | Silent readers. |

So "who is seeing the sites" cannot be answered today from these alone. What can be said honestly: what is live, since when, and who has engaged in public.

## Step 1 (I can do now, read-only, in my session)
A first visibility note per site: domain, repository, what Pages serves (commit, date), and public engagement on the repository (stars, forks, watchers, outside issues and pull requests). Published as a file in this branch. Accounts named only where the person acted in public on our repositories, and never a private prospect.

## Needs Dinis's yes (each a separate decision)
1. **GitHub repository traffic** (views and unique visitors per day for 14 days, top referrers, popular paths): this counts people viewing the repositories on github.com, not the sites. GitHub serves it only to holders of push access; from CI that means the pipeline App reading it (I expect the repository Administration read permission; to be checked with Check GitHub App). Needs a privilege line in policy/abp.json and a by-hand workflow writing daily totals to a file, aggregates only. GitHub keeps 14 days, so the sooner it starts the more history we keep.
2. **Route 53 query logging** on the three zones: counts of DNS lookups per name per hour, a rough proxy for interest per site. The logs carry resolver addresses (usually the reader's ISP, sometimes the reader), so only per-name hourly counts would be kept and the raw logs dropped. Needs AWS privileges added to the role and to the policy. I would only recommend it if item 3 is refused.
3. **First-party, cookieless page counts** (the real answer to "who is seeing what"): this is the policy change observability.d already asked about, and it is observability.b's and observability.d's work. I do not propose a separate one.
4. **My own policy entry** in policy/abp.json (paths for my notes, for example board/observability.c/**), so this plan and the notes can go to dev. Until then they stay in this branch.

## What I will not do
Change any site, its policy or its pages; add capture anywhere; use a connector; start a session, scheduled task or workflow; talk to observability.b or observability.d directly.
