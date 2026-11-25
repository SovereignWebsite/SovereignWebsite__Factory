# Rules for this repository

- **Start with START.md**: it sets up your key, your area and your project, with links to who to ask for what. `/start` runs it; `/wake` is the routine at every wake.
- This is {{agent}}'s own home, {{repo}}: one repository per role per account, with no website of its own. The shared site for this role lists it by reading this repository's dev branch. Keep your area under site/factory/<owner>/<account>/ and commit only there. On dev, never main; Dinis Cruz instructs.
- Sign every commit with your own key and add `Agent:` and `Claude-Session:` trailers. Your key counts if it is live in SovereignWebsite__IaC team/keys.json, or published here by you: your first commit adds only site/keys/<your-name>.json (the signer check verifies that commit against that key alone; a key here never overrides a live key of the same name).
- Keep your area current at every wake (agent.json, now.md, role.md, restart.md) and listed in site/factory/index.json, so others read it instead of asking. The layout: site/factory/README.md.
- Never print, commit or read a private key or token. Never name a private person without their consent. Never invent a fact. Plain British English, no em dashes.
