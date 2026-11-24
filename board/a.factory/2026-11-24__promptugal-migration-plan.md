# Plan: agents leave PrompTugal__News__Website for their own repositories

Drafted by a.factory, 24 Nov 2026, at Dinis's word in its session (~02:20 UTC): "can you draft the migration plan and then can you start creating the repos for the agents? Can you start with the router one?"

Earlier in the same session he said: "every agent here should be committing to their own site, their own repo", and "nobody should be touching that repo". He gives the repository as having 8,000 commits and a 12-minute run. Those figures are Dinis's; a.factory has not measured them.

## The rule
1. **Two repositories per agent, and only those two** (R3).
   - The agent type's own site, `Site__Agent__<Role>`. Each copy works in its own area: `accounts/<x>/`, with its status, debriefs, sessions and key (`site/keys/<name>.json`).
   - The one project it works on.
2. **PrompTugal__News__Website is the newsroom's project repository.**
   - Newsroom work stays: stories, places, data, the site, and the specs for it.
   - Agent state leaves, even for newsroom agents: status.json, debriefs/, sessions/, ROLE.md and relays.
   - Cross-project coordination leaves first.
3. **No history is moved.** Each old folder gets one pointer file, MOVED.md, naming its new home. After the cut-over, nothing new lands in the old folder.

## Wave 1: cross-project coordination
This is the heaviest traffic that is not newsroom work, and it touches every account.

| Today in PrompTugal | Goes to | Repository |
|---|---|---|
| board/team/maestros/ (briefs, from-a..d.md, escalation, centre-of-gravity) | maestro | Site__Agent__Maestro (requested) |
| board/team/maestro.a, .b, .c, .d (asks, decision requests, status) | maestro, accounts/a..d/ | Site__Agent__Maestro |
| board/routers/, board/team/router.a, router.c, board/inboxes, inbox.json, inbox-peers.json, board/lanes | router | Site__Agent__Router (**request ready**, work/factory.a-site-agent-router a18a742) |
| board/team/decisions.c, decisions.d | decisions | Site__Agent__Decisions (requested) |
| board/team/abp | abp | Site__Agent__Abp (**new request needed**) |
| board/guidance (cross-team guidance) | maestro | Site__Agent__Maestro |
| board/keys.json, person-keys.json | each agent's own site/keys/; people's keys to the Factory or pki.sgit.ai | to confirm with security |

## Wave 2: SovereignWebsite team agents (state only)
Each has a Site__Agent__ repository requested already. Only its state moves.

| Folder(s) | Site |
|---|---|
| holacracy.d | Holacracy |
| helm.d | Helm |
| counsel.d | Counsel |
| cartographer.d | Cartographer |
| landscape.d | Landscape |
| strategy.d | Strategy |
| studio.d | Studio |
| slides.d | Slides |
| sherpa, sherpa.d | Sherpa |
| accountant, accountant.c, accountant.d | Accountant |
| conductor, conductor.b, conductor.d, pt-conductors | Conductor |
| observability, telemetry.b | Observability |
| security | Security |
| librarian | Library |
| outreach | Outreach |
| synthetic | Synthetic-Users |
| designer, designer.experiments | Design |

## Wave 3: agent types with no site yet (new requests)
- devops: Site__Agent__Devops. Fits the DevOps record 2026-11-24__devops-agent.
- backup: Site__Agent__Backup.
- abp: Site__Agent__Abp (see Wave 1).
- investors, customers, ontologist, rights, gamma-ray, researcher, historian: **newsroom work** (Dinis, 24 Nov ~02:25 UTC in a.factory's session: "Yes, they are the work for the newsroom"). Their work products stay in PrompTugal; no new agent-site requests for them.

## Stays in PrompTugal: newsroom work products
Only the work stays. Each agent's state still moves (rule 2).
- **Newsroom roles:** journalist, journalist.newsroom, reporter.newsroom, correspondent, translator and work-desk (stories, materials, traces).
- **Places:** place.* (22 folders) and data.places, datasci.places, designer.places, detective.places, dev.places, viz.places.
- **Developers:** dev, dev.data, dev.graphs, dev.pages, dev.portugal, dev.search, dev.verify, social.watch.
- **Board files:** spec-*.md, catalogue, schedule, budgets, the story and project files.

## Order of work
1. **Router first.** Dinis merges work/factory.a-site-agent-router, and the Factory bot creates Site__Agent__Router. router.a's first commit there adds only site/keys/router.a.json. Its next commits add accounts/a/, ledger/, lanes/ and inbox/{messages,issues,patches}, and a MOVED.md in board/routers/.
2. **Seed update** (factory.b/c/d, or a.factory with seed/** paths). The agent seed gains:
   - accounts/<x>/ with status.json and debrief.md;
   - provenance.jsonl;
   - the generated agents.json.
   Org apply then refreshes managed seed files in existing sites (c8aab28).
3. **Wave 1, then 2, then 3.** One small move per agent:
   - the agent publishes its key in its site;
   - it copies its live status, as one commit there;
   - it leaves MOVED.md in PrompTugal.
   Each agent's wake prompt then points at its own site. Maestros update the wake prompts they create.
4. **Cut-over.** Once Wave 1 is done, a PrompTugal CI check refuses new commits under board/team/ from agents outside the newsroom roles. The newsroom owns that change.
5. **Measure.** PrompTugal commits per day and run time, before and after (the DevOps agent's first numbers).

## Decisions for Dinis
- The PrompTugal cut-over check (step 4), and its date.
- Whether a.factory gets seed/** to do step 2, or factory.c does it.
