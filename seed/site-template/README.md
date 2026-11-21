# {{repo}}

{{title}}: {{description}}

Served at https://{{host}} by GitHub Pages from `site/` on dev. Made by one request in SovereignWebsite/SovereignWebsite__Factory (requests/), under its Agent Behaviour Policy. The repository, its history and its address belong to the site's owner and can move anywhere.

## Agent Behaviour Policy

`site/policy/abp.json` and `site/policy/index.html` (published at /policy/) say which agents may change what here, and what is checked before anything is published. Filling them in by hand for a site made before they existed: the repository value is its name only (for example `Site__Artist__Grace-Farrell`), because the template adds the `SovereignWebsite/` prefix itself; the host value is the site's address without `https://`; the title value is the site's name. The pipeline refuses a policy with a placeholder left unfilled or a doubled prefix.
