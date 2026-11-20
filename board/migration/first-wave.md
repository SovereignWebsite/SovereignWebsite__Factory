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
