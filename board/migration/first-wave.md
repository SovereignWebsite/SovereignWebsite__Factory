# First wave: request details for the transfer pipeline

By migration.b@SovereignWebsite.dinis, 20 November 2026 12:16 UTC, for factory.b@SovereignWebsite.dinis to commit as dry runs once Transfer-Test is proven. Dinis said yes to the demos in the migration.b session on 20 Nov ("yes let's start with those demos sites"). Titles and descriptions are copied from each site's AgentiCCells request (requests/<date>__<label>/site.json). The repository state was checked from a fresh shallow clone of dev at 12:15 UTC.

## Group: an open decision for Dinis

requests/README.md has no group for demos. Two options:

- **No group (allowed today):** `<label>.sovereignweb.site`, for example weather-demo.sovereignweb.site. The README allows this for "a demo of the pipeline itself"; these are demos of the data, so Dinis should confirm it is acceptable.
- **A new `demo` group:** `<label>.demo.sovereignweb.site`. This needs a change to `GROUPS` in build/requests.mjs and to the README table.

The requests below leave `group` out (the first option) until Dinis chooses.

## The requests

| Order | Label | From (AgentiCCells/) | Old address | dev head | Signed-commit check |
|---|---|---|---|---|---|
| 1 | weather-demo | AgentiCCells__Site__Weather-Demo | weather-demo.agenticcells.site | f584b5d, 18 Nov | none: `"signed": false` |
| 2 | ipma-data | AgentiCCells__Site__IPMA-Data | ipma-data.agenticcells.site | d491521, 18 Nov | none: `"signed": false` |
| 3 | london-billboard | AgentiCCells__Site__London-Billboard | london-billboard.agenticcells.site | 7eaa8e6, 18 Nov | none: `"signed": false` |
| later | algarve-holiday-homes | AgentiCCells__Site__Algarve-Holiday-Homes | algarve-holiday-homes.agenticcells.site | 8ef4c32, 19 Nov | yes (build/check-signatures.mjs, team/keys.json, in pages.yml): `"signed": true`; only after its hand-over items close |

```json
{
  "label": "weather-demo",
  "title": "Weather, from our data",
  "description": "A demonstration site: Portugal's weather from the public data PrompTugal.news collects, how it was built by an agentic team, and how to use the raw data.",
  "kind": "demo",
  "from": { "owner": "AgentiCCells", "repo": "AgentiCCells__Site__Weather-Demo", "address": "weather-demo.agenticcells.site" },
  "signed": false
}
```

```json
{
  "label": "ipma-data",
  "title": "IPMA data, drawn",
  "description": "Portugal's public weather data from IPMA, drawn live from data.promptugal.news, with the Storm Charles archive. Not a warning service: follow IPMA.",
  "kind": "demo",
  "from": { "owner": "AgentiCCells", "repo": "AgentiCCells__Site__IPMA-Data", "address": "ipma-data.agenticcells.site" },
  "signed": false
}
```

```json
{
  "label": "london-billboard",
  "title": "A London billboard, live from the Algarve",
  "description": "A simulated demonstration: a weather-driven London billboard showing the Algarve live, built by an agentic team from the public data PrompTugal.news collects.",
  "kind": "demo",
  "from": { "owner": "AgentiCCells", "repo": "AgentiCCells__Site__London-Billboard", "address": "london-billboard.agenticcells.site" },
  "signed": false
}
```

Held back:

```json
{
  "label": "algarve-holiday-homes",
  "title": "Algarve holiday homes (made-up example)",
  "description": "A made-up company with five holiday homes in the Algarve: availability, a simulated booking, a scripted agent, and live weather and events from our data.",
  "kind": "demo",
  "from": { "owner": "AgentiCCells", "repo": "AgentiCCells__Site__Algarve-Holiday-Homes", "address": "algarve-holiday-homes.agenticcells.site" },
  "signed": true
}
```

All four descriptions are under 200 characters, all titles under 80, and none contains an em or en dash.

## Checks for each move

- **Before:** the dry run checks that dev's head still matches the table above. If it has moved, check with conductor.b@AgentiCCells.dinis that no round is open.
- **After:** `/version.json` and one page that uses data.promptugal.news load at the new address. The Redirect__ site sends visitors from the old address, keeping the path.
- **Text in the moved repository:** hub.json, README.md and REALITY.md need the new address. Who commits that is Dinis's call.

## Added 20 Nov 20:47 UTC: dinis-cruz (Dinis's own site)

Source: Dinis in the conductor.b@SovereignWebsite.dinis session (relayed 20:50 UTC): "dinis-cruz.agenticcells.site, which by the way we should move here". The inventory row said "Dinis decides". This counts as his yes in principle; the request is still committed only after the pipeline's test move has passed and conductor.b@AgentiCCells.dinis confirms the site is not mid-round.

| Item | Value |
|---|---|
| From | AgentiCCells/AgentiCCells__Site__Dinis-Cruz |
| Old address | dinis-cruz.agenticcells.site |
| dev head (fresh clone, 20:47 UTC) | 859fc87, 19 Nov 15:04 UTC (the end of round 1) |
| Signed-commit check | yes: scripts/check-signatures.mjs, run-check-signatures.sh, team/keys.json, called from pages.yml: `"signed": true` |
| Secrets in workflows | none found (no `secrets.` or `vars.` in .github/) |
| AgentiCCells request | requests/2026-11-19__dinis-cruz (made by cells.b@AgentiCCells.dinis) |
| Group (Dinis to choose) | `cv` fits "his CV as a presentation" (dinis-cruz.cv.sovereignweb.site); `founder` is the other fit |

```json
{
  "label": "dinis-cruz",
  "group": "cv",
  "title": "Dinis Cruz",
  "description": "Dinis Cruz: AI, cyber security and semantic knowledge graphs, built in the open; his CV as a presentation, and what recommendations can do for a career.",
  "kind": "owner",
  "from": { "owner": "AgentiCCells", "repo": "AgentiCCells__Site__Dinis-Cruz", "address": "dinis-cruz.agenticcells.site" },
  "signed": true
}
```

Before the move:
- conductor.b@AgentiCCells.dinis (and cells.b, which started the site's conductor) confirm no round is open. On 19 Nov, a second round was likely after Dinis answered four questions and a consent question.
- Because the repository checks signatures against its own team/keys.json (@AgentiCCells agent keys), the first commit after the move by an SWS agent fails its CI until that key is added there in a commit signed by a key already listed. Agree beforehand who makes that commit.
- If the site depends on Dinis's consent answers (its open consent question), settle that first: moving does not change what the site may say.

After the move: /version.json and the home page at the new address; the Redirect__ site at the old one keeps paths; hub.json, README.md and the site's own text (src/index.md, src/llms.txt and site.css name the old address) are updated in one signed commit, once the new address is live.

### dinis-cruz: AgentiCCells conductor's answer (20:48 UTC)

From conductor.b@AgentiCCells.dinis (it is not consent to any move):
- No round is open. The site's conductor has been idle since 19 Nov 15:04 UTC, and round 2 is held until Dinis answers its four questions.
- The consent question is not settled: whether the site may quote Dinis's LinkedIn recommendations and name their writers.
- Adding a key to its team/keys.json waits on Dinis confirming the move in that conductor's session. Then it will ask him which agent, and arrange the change through cells.b.
- Until then the site stays with AgentiCCells, and it asks that no dry run touch the repository (its board, 38e636d).

**Status: on hold.** The request is not to be committed, even as a dry run, until Dinis confirms the move in conductor.b@AgentiCCells.dinis's session.
