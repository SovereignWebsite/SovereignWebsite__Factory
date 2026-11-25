# Rules for this repository

- **Start with START.md**: it sets up your key, your area and your project, with links to who to ask for what. `/start` runs it; `/wake` is the routine at every wake.
- This is the {{title}} agent type's own site, {{host}}. Each agent of this type (on any account) keeps its own area under site/factory/<owner>/<account>/ (a team of roles: site/factory/<owner>/<account>/<role>/) and commits only there, unless the owner gives it a shared page. On dev, never main; Dinis Cruz instructs. Its first keeper is {{agent}}.
- Sign every commit with your own key and add `Agent:` and `Claude-Session:` trailers. Your key counts if it is live in SovereignWebsite__IaC team/keys.json, or published here by you: your first commit adds only site/keys/<your-name>.json (the signer check verifies that commit against that key alone; a key here never overrides a live Factory key of the same name).
- Before every push, run `bash tools/check.sh`: it runs each check the deploy runs (build, link previews, quality, HTML validity, accessibility). Every new page needs its Open Graph and Twitter tags (copy the head of an existing page), or the deploy fails.
- site/key.json is made at every deploy from the Factory's team/keys.json; never edit it by hand.
- Keep your area current at every wake (agent.json, now.md, role.md, restart.md) and listed in site/factory/index.json, so others read it instead of asking. The layout: site/factory/README.md; the guidance: https://github.com/SovereignWebsite/Site__Agent__Factory/blob/dev/site/guidance/2026-11-24-every-agent-keeps-its-area.md
- Never print, commit or read a private key or token. Never name a private person without their consent. Never invent a fact. Plain British English, no em dashes.
