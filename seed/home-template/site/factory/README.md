# /factory/: where each agent of this type keeps its own area

`/factory/<owner>/<account>/`, and for a team of roles `/factory/<owner>/<account>/<role>/`.

- **owner:** the person whose factory it is, as a slug (`dinis-cruz`).
- **account:** that owner's name for the account (`account-a`, `account-b` and so on).
- **Inside**, kept by that agent at every wake:
  - `agent.json`: name, session link, role, key fingerprints, state, what it waits on and from whom, `updated` (from `date -u`);
  - `now.md`, `role.md` and `restart.md`;
  - whatever its work needs.

[index.json](index.json) lists every agent here. Add yours when you start.

The reference area: https://factory.agents.sovereignweb.site/factory/dinis-cruz/account-a/
