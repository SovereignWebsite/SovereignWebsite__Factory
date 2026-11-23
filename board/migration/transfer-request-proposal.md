# Proposal: a transfer as a Factory request (not applied)

By migration.b@SovereignWebsite.dinis, 19 November 2026. A proposal only. Today transfers are done by Dinis by hand; this changes only if Dinis approves a pipeline action for them.

## Where the policy stands

- policy/abp.json lists `repo.transfer` under org-apply `refused_always`. That stays: Org apply should never transfer.
- A transfer into SovereignWebsite needs admin on the source repository (AgentiCCells). The pipeline App's token for the SovereignWebsite installation cannot do it; an AgentiCCells installation token with administration: write could, which is a privilege the ABP does not list today and would be a cross-organisation power.

## The request

A file `requests/transfer/<date>__<label>.json`, committed by an agent on dev, merged by Dinis:

```json
{
  "schema": 1,
  "kind": "transfer-in",
  "label": "weather-demo",
  "from": { "owner": "AgentiCCells", "repo": "AgentiCCells__Site__Weather-Demo" },
  "to": { "owner": "SovereignWebsite", "repo": "AgentiCCells__Site__Weather-Demo" },
  "address": "weather-demo.sovereignwebsite.site",
  "consent": { "by": "Dinis Cruz", "what": "demo on the data; no other owner" },
  "source_conductor_ok": "link to the AgentiCCells conductor's note that the site is not mid-round",
  "requested_by": "migration.b@SovereignWebsite.dinis"
}
```

For a customer site, `consent` must point to the owner's yes in a public place they agreed to (or say "kept outside git" and Dinis vouches), and the label alone is used until they consent to be named.

## Two ways to run it

**Option 1 (recommended): plan in CI, transfer by hand.** A new read-only pipeline, `transfer-plan`, runs on the pull request: checks the request schema, that the source exists and the target name is free, lists the source's workflows and any `secrets.` or `vars.` they use, its Pages settings and custom domain, and prints the dry-run checklist from transfer-checklists.md filled in. After merge, Dinis clicks Transfer. Then org/repos.json and org/dns.json changes (in the same pull request) are applied by the existing Org apply and dns-apply on the next run. No new privilege. ABP change: add `transfer-plan` with `allowed: ["read repository"]`.

**Option 2: the pipeline transfers.** A `transfer-apply` pipeline in a new environment `transfer`, with required reviewer Dinis, using a token that has administration: write on the AgentiCCells repository named in the request (the AgentiCCells App, scoped by repository at token time). ABP change: a new pipeline with `allowed: ["repo.transfer_in"]`, limited to `from.owner` AgentiCCells and `to.owner` SovereignWebsite, one repository per request, never a customer site without `consent`; and a new privileges row for the AgentiCCells App. org-apply keeps `repo.transfer` refused. This is more power than the job needs for a handful of moves; worth it only if there are many.

## What would need Dinis's merge

policy/abp.json (new pipeline), .github/workflows/ (new workflow), build/ (the planner), and a schema for requests/transfer/. None of it is written; this file is the proposal.
