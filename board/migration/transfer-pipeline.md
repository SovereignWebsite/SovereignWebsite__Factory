# Design: a transfer pipeline under a tight ABP

By migration.b@SovereignWebsite.dinis, 20 November 2026. A design for Dinis; nothing here is built or applied.

Source: Dinis in the migration.b session, 20 Nov 2026: "I agree with the list and yes let's start with those demos sites"; "This process should be automated (via GitHub CI and commits and between domains we control) since moving sites between accounts is going to be a common task"; "I think a dedicated CI action would be a good way to do it"; "this needs to be controlled by a tight ABP".

## Why a dedicated pipeline, not Org apply

Org apply holds the SovereignWebsite installation token and runs hourly. A transfer needs admin on a repository in another organisation. Keeping that power out of Org apply means:

- its own workflow, `transfer-apply.yml`, its own environment, `transfer`, and its own token, minted per run for one repository;
- Org apply keeps `repo.transfer` in `refused_always`, unchanged;
- a bug or a bad request in the hourly converge can never move a repository.

## One request path for new and moved sites

A moved site is a hosted-site request with a `from` block, in the folder the Factory already uses (requests/README.md):

```json
{
  "label": "weather-demo",
  "title": "Weather, from our data",
  "description": "Portugal's weather from the public data PrompTugal.news collects, built by an agentic team.",
  "kind": "demo",
  "from": {
    "owner": "AgentiCCells",
    "repo": "AgentiCCells__Site__Weather-Demo",
    "address": "weather-demo.agenticcells.site"
  },
  "apply": "dry-run"
}
```

- With `from`, Org apply plans nothing for the request until `requests/<id>/transfer.json` (written by the pipeline) says `"state": "moved"`. After that it treats `Site__<label>` like any other site: settings, team push, rulesets, custom domain, HTTPS. It never seeds a moved repository.
- The transfer renames in the same call (`new_name`), so a moved site ends up as `SovereignWebsite/Site__<label>`, the same as a new one. GitHub redirects the old repository URL.
- `apply` is `dry-run` first. The same request is then changed to `real` in a second commit, which Dinis merges.

## What the pipeline does

`transfer-apply`, on a push to dev that changes `requests/*/site.json` where `from` is set, in the `transfer` environment:

1. **Validate** the request against the schema; `from.owner` must be in the ABP allow-list; one request per run.
2. **Preflight**, all read-only, each one able to stop the run:
   - the source exists, is public, and its name matches `AgentiCCells__Site__*`;
   - `SovereignWebsite/Site__<label>` does not exist;
   - no open pull requests and no workflow run in progress in the source (the "mid-round" check);
   - the source's workflows use no `secrets.*` other than GITHUB_TOKEN and no App token;
   - the source has signed-commit checks: report the AgentiCCells keys it trusts (move as they are; re-keying is a later request);
   - record the source's Pages settings, custom domain, `github-pages` environment rule and last deployment.
3. **Dry run** stops here and writes `requests/<id>/transfer.json` with the plan and the findings. It needs no write token at all.
4. **Real**, only if `apply` is `real` and a reviewer approves the run in the `transfer` environment:
   - mint an AgentiCCells installation token for `repositories: [from.repo]`, `permissions: {administration: write}` only;
   - `POST /repos/AgentiCCells/<repo>/transfer` with `new_owner: SovereignWebsite`, `new_name: Site__<label>`;
   - wait until the repository answers under SovereignWebsite; revoke the token;
   - write `transfer.json` `"state": "moved"`, with the run ID.
5. **Converge**, by the existing pipelines with no new power: Org apply (Pages, the custom domain `<label>.sovereignwebsite.site`, team, rulesets, HTTPS) and DNS apply (the CNAME in the sovereignwebsite.site zone, from the request).
6. **Verify**: `https://<label>.sovereignwebsite.site/version.json` serves the same version as before. The result goes into `transfer.json` and the Factory's REALITY.md.

The pipeline commits only `requests/<id>/transfer.json`, signed by the pipeline's own key, which is listed in team/keys.json.

## The old address ("between domains we control")

Pages serves one custom domain per site, so the old name needs its own small page. That page belongs to AgentiCCells, so it goes through AgentiCCells' own factory, under its own ABP:

- a request there for a redirect stub at `<label>.agenticcells.site` that sends visitors to `https://<label>.sovereignwebsite.site` (a meta refresh plus a canonical link);
- the SovereignWebsite pipeline never writes to AgentiCCells' DNS or repositories. It only prints the request AgentiCCells needs to make.

## The ABP entry (proposed)

```json
"transfer-apply": {
  "runs_on": ["push to dev that changes a request with a from block"],
  "environment": "transfer",
  "environment_rules": {
    "required_reviewers": ["Dinis Cruz"],
    "deployment_branches": ["dev"]
  },
  "allowed": ["repo.transfer_in"],
  "limits": {
    "from_owners": ["AgentiCCells"],
    "from_repo_pattern": "AgentiCCells__Site__*",
    "to_owner": "SovereignWebsite",
    "to_name": "Site__<label>",
    "per_run": 1,
    "kinds_without_owner_consent": ["demo"],
    "owner_kind_needs": "a consent record named in the request, merged by Dinis",
    "never_from": ["AgentiCCells__Site__Factory*", "AgentiCCells__Specialist__*", "AgentiCCells__Cell__*", "PrompTugal/*"]
  },
  "refused_always": [
    "repo.transfer_out", "repo.delete", "repo.archive", "repo.make_private",
    "repo.transfer_without_dry_run", "dns.write_outside_sovereignwebsite_zones",
    "write to any AgentiCCells or PrompTugal repository"
  ],
  "note": "A real transfer needs, in order: a dry-run request on dev, a second commit changing apply to real, and Dinis approving the run in the transfer environment. The token is minted per run for one repository, with administration: write only, and revoked after."
}
```

New rows in `privileges`:

- `github-app:agenticcells-site-factory` on the AgentiCCells installation, `administration:write`, per-run and per-repository, for transfer-apply only;
- if GitHub requires it for a transfer into an organisation, the same App's right to create repositories in SovereignWebsite (it already holds administration:write there for Org apply).

## What must be proved before the demos

1. Correction (factory.b@SovereignWebsite.dinis, 20 Nov ~10:08 UTC, from GitHub's App permissions page): `POST /repos/{owner}/{repo}/transfer` takes a user access token only, not an installation token, so step 4 cannot use the installation token above. factory.b is putting two options to Dinis: (A) a user token for Dinis through the App, held in the `transfer` environment with Dinis as required reviewer, or (B) Dinis's click, with everything else automated. factory.b also proposes an explicit list of repositories in the ABP instead of a pattern. Whichever is chosen, **test first** with a throwaway repository (for example `AgentiCCells__Site__Transfer-Test`).
2. Whether deployment history and the `github-pages` environment survive the move (asked by the AgentiCCells conductor; it matters for `gabriel-dacruz` and `evals`, not the demos).
3. If (1) fails, the pipeline still runs everything except step 4, and the transfer stays one click by Dinis, with the dry run's findings in hand.

## Order for the demos (Dinis's yes, 20 Nov)

1. Build transfer-apply, the schema and tests; change the ABP (Dinis merges).
2. Prove it on the throwaway repository.
3. weather-demo: dry run, then real.
4. ipma-data, then london-billboard.
5. algarve-holiday-homes once its hand-over items are closed.
6. events-demo and cyber-demo only if built past the seed page.

## Who builds it

factory.b@SovereignWebsite.dinis builds the pipeline, with this design as its base; migration.b stays on `board/migration/**` (conductor.b, relaying Dinis, 20 Nov ~10:02 UTC). Changes to `.github/`, `build/` and `policy/` wait for Dinis's merge.
