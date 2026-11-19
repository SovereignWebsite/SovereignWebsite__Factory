# Transfer checklists (dry run)

By migration.b@SovereignWebsite.dinis, 19 November 2026. For the four demos recommended to move first. Nothing here has been run. Every step that acts is Dinis's, by hand, unless Dinis approves a pipeline action for it (transfer-request-proposal.md).

## What a transfer keeps and what breaks

Keeps: history, branches, tags, issues, pull requests, releases; github.com/AgentiCCells/<repo> redirects to the new owner for web and git (until a repository of the same name is made again under AgentiCCells).

Breaks or must be re-done:
1. **Pages host.** Under SovereignWebsite the site is served from sovereignwebsite.github.io. The custom domain is cleared by the move and must be set again; HTTPS must be issued again for the new name.
2. **DNS.** `<name>.agenticcells.site` is a CNAME to agenticcells.github.io. Either (a) the site gets `<name>.sovereignwebsite.site` (CNAME to sovereignwebsite.github.io in the Route 53 zone, through org/dns.json), or (b) AgentiCCells changes its CNAME to sovereignwebsite.github.io and the old name stays the custom domain. Pages serves one custom domain per site, so not both. Recommendation: (a), with AgentiCCells keeping a one-page redirect on the old name if it wishes.
3. **Workflows.** pages.yml in all four repositories uses only the built-in GITHUB_TOKEN (pages: write, id-token: write; contents: write for the tag job): no AgentiCCells secrets or App. Anything that pushes to these repositories with the AgentiCCells App token (the AgentiCCells factory pipeline, first pass) stops; that is intended.
4. **The `github-pages` environment** and its rule that dev may deploy: check it after the move and set it again if missing, or deploys from dev fail.
5. **Access.** AgentiCCells teams lose access; the SovereignWebsite team "SovereignWebsite - Agents - CI" gets push only when org/repos.json lists the repository and Org apply runs.
6. **In-repository text.** hub.json (owner, repository, live_address, version_from), README.md, REALITY.md and team/ files name AgentiCCells and the old address; a commit on dev, by an agent with a key in the repository, updates them. Team policies in team/*/POLICY.md name @AgentiCCells agents: they keep working as text, but the agents' keys and the names are AgentiCCells'.
7. **AgentiCCells factory records.** requests/<request>/status.json there still says live at the old address; AgentiCCells may mark it "moved" (its call, its repository).
8. **Signed-commit checks** (from conductor.b@AgentiCCells.dinis, 16:24 UTC): algarve-holiday-homes (and gabriel-dacruz, evals) check each commit against team/keys.json and an `Agent: <role>@AgentiCCells...` trailer. After a move the names and keys either stay as they are, still valid as text, or the repository is re-keyed in a signed commit by a key already listed.
9. **Deployment-anchored CI** (gabriel-dacruz, evals): CI anchors at the last successful github-pages deployment. Whether deployment history survives a transfer is not yet confirmed. If it does not, the first run after the move fails closed. Check this before moving either one.
10. **AgentiCCells Sync site settings** sets the website and team push access through the agenticcells-site-factory App. A moved repository leaves its reach, and agenticcells-team-devs access goes with it.
11. **Links in other sites** to `<name>.agenticcells.site` (other demos, the newsroom) go dead under option (a) unless a redirect is kept.

## Per-site dry-run checklist

Repeat for each row; repository names are AgentiCCells__Site__<X> today, proposed SovereignWebsite name SovereignWebsite__Site__<X> (rename is optional; keeping the name is simpler and keeps the redirect exact).

| Site | Repository | New address |
|---|---|---|
| weather-demo | AgentiCCells__Site__Weather-Demo | weather-demo.sovereignwebsite.site |
| ipma-data | AgentiCCells__Site__IPMA-Data | ipma-data.sovereignwebsite.site |
| algarve-holiday-homes | AgentiCCells__Site__Algarve-Holiday-Homes | algarve-holiday-homes.sovereignwebsite.site |
| london-billboard | AgentiCCells__Site__London-Billboard | london-billboard.sovereignwebsite.site |

Before
- [ ] conductor.b@AgentiCCells.dinis has said the site is not mid-round (no open round, no open pull request). As of 16:24 UTC no round was running; algarve-holiday-homes still has hand-over items open and a stale round-3 branch.
- [ ] Dinis has admin on the source repository (AgentiCCells) and can create repositories in SovereignWebsite.
- [ ] No repository of the same name exists in SovereignWebsite.
- [ ] Note the current Pages settings (custom domain, HTTPS on, build from GitHub Actions) and the `github-pages` environment's branch rule.
- [ ] A Factory commit on dev adds the record `<name>.sovereignwebsite.site CNAME sovereignwebsite.github.io` to org/dns.json and the repository to org/repos.json with `"exists_by": "transfer, Dinis, <date>"`, `"pages": true`, `"cname": "<name>.sovereignwebsite.site"` and no seed. Dinis merges after the transfer, not before, or Org apply would create an empty repository of the same name.

Transfer (Dinis)
- [ ] github.com/AgentiCCells/<repo>/settings, Danger Zone, Transfer, new owner SovereignWebsite.

After
- [ ] Merge the Factory commit; dns-apply UPSERTs the CNAME; Org apply sets Pages, the custom domain, push for the agents' team, branch protection.
- [ ] Check: `dig +short <name>.sovereignwebsite.site CNAME` answers sovereignwebsite.github.io.
- [ ] Check: `https://<name>.sovereignwebsite.site/version.json` serves the same version as before; Enforce HTTPS on once the certificate is issued.
- [ ] Check the `github-pages` environment lets dev deploy; run pages.yml once by hand if no deploy ran.
- [ ] Commit in the repository: hub.json, README.md, REALITY.md to the new owner and address; label "demo" kept on algarve-holiday-homes and london-billboard.
- [ ] Old name: AgentiCCells decides between a redirect page or letting `<name>.agenticcells.site` lapse; until then it answers GitHub's 404.
- [ ] Factory REALITY.md: the move, with the run IDs.

Rollback: transfer back to AgentiCCells (Dinis), set the old custom domain again; the agenticcells.site CNAME was never touched under option (a).
