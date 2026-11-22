# SovereignWebsite__Factory becomes SovereignWebsite__IaC

Dinis Cruz, 22 November 2026: the Factory is renamed IaC (Infrastructure as Code), first in maestro.c's session (~20:40 UTC), then in factory.c's (~21:16 UTC): "can you create everything and then get everything ready? So then I just need to do those final little changes in AWS". Prepared by factory.c@SovereignWebsite.dinis on branch work/factory.c-iac, from dev f82f4c4.

## No catch-22, and no rename by hand
- **AWS first.** An IAM trust policy may list an OIDC subject that no repository sends yet. Adding the IaC subject before the rename changes nothing until GitHub starts sending it; the Factory subjects keep DNS apply working until then.
- **Org apply renames, not a person.** org/repos.json now names the repository SovereignWebsite__IaC with aka SovereignWebsite__Factory. build/org-plan.mjs turns that into one action, repo.rename, and build/org-apply.mjs checks the aka. A rename by hand would be dangerous: until this branch is on dev, the hourly Org apply (:17) would see SovereignWebsite__Factory missing and create an empty repository with that name, which also ends every redirect for good.

## What GitHub keeps
- The repository id (1464324035), the apply environment and its secrets, rulesets, team access, the App installation, Actions history and branches.
- Web, git and API URLs under the old name redirect, until a new repository takes the old name (Org apply will not: the name is only an aka now).
- raw.githubusercontent.com follows renames as well: checked at 21:15 UTC on a site Org apply renamed on 20 Nov (Site__pipeline-demo, now Site__Demo__Pipeline-Demo), whose old raw URL still answers 200. Sites already seeded keep reading team/keys.json at the old URL (their signers.mjs and pages.yml), so they keep working; new sites get the new URL from the seeds.

## In this branch (for Dinis's merge)
- org/repos.json: name SovereignWebsite__IaC, aka SovereignWebsite__Factory.
- policy/abp.json: "about" names IaC; org-apply's rename_note allows this one aka.
- seed/** (every template): the keys URL, the key.json source, and every "Seeded by" or "made by" line.
- build/org-apply.mjs (seed commit message), build/dns-plan.mjs (Route 53 change comment), build/share-card.mjs (comment).
- docs/aws-oidc.md: the IaC subject added to the trust policy, Factory lines kept until DNS apply has run once.
- test/run.mjs: while GitHub still has the old name, the plan is exactly one repo.rename, allowed by the policy.
- Not changed: README.md (a conductor's file: one line, SovereignWebsite__Factory to SovereignWebsite__IaC, after the move), board/ (other agents' files; text, links redirect) and team/keys.json.

## The move
1. **Dinis, AWS:** in the trust policy of role sovereignwebsite-factory-dns, add `repo:SovereignWebsite@358722364/SovereignWebsite__IaC@1464324035:environment:apply` to the sub list (as in docs/aws-oidc.md). Keep the other lines.
2. **Dinis:** say merge in factory.c's session; factory.c pushes work/factory.c-iac to dev.
3. **Org apply** runs on that push (it changes org/ and policy/): plan, one repo.rename, applied.
4. **factory.c checks:** the repository answers as SovereignWebsite__IaC; the old URLs redirect (web, git, raw team/keys.json); Checks green on dev; the next scheduled Org apply plans no repo.create; one site's Signers and Pages runs pass on its next push; DNS apply by hand prints the IaC subject and succeeds.
5. **Dinis, AWS:** remove the two Factory lines from the trust policy.
6. **Every session with a clone:** `git remote set-url origin https://github.com/SovereignWebsite/SovereignWebsite__IaC` (the old URL works meanwhile).

If DNS apply runs between steps 3 and 1 (if step 1 was skipped), it fails at the AWS step and changes nothing; adding the line fixes it.

## Next, not in this move
- **The agents' home** (Site__Agents__Factory, factory.agents.sovereignweb.site): to Site__Agent__IaC, singular as Dinis said at ~17:05 UTC, with factory.d's pending rename of all agent homes; its Pages domain and DNS record change with it.
- **Agent names** iac.<area>.<account> or iac.<account>: a new name is a new key under the keys rule; each agent publishes its own and retires its factory.* entry, and the policy entries move with them (Dinis's merge).
- **Areas inside**, one at a time: IaC.GitHub (org/, build/org-*, org-apply.yml), IaC.AWS (org/dns.json, build/dns-*, dns-apply.yml, docs/aws-oidc.md), IaC.Policy (policy/, build/abp.mjs), IaC.Requests (requests/), IaC.Seed (seed/), and IaC.PKI last (team/keys.json, build/check-signatures.mjs), because moving team/keys.json changes the path every site reads.
- **Other repositories** that name the Factory (site texts, onboarding prompts, CLAUDE.md files): text only; links redirect.
