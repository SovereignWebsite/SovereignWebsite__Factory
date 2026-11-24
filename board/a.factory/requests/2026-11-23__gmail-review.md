# R4 step two for the Gmail request: sites.a's review

Received by a.factory by message from sites.a (https://claude.ai/code/session_018yvwtQ7z3PUt9L5gpZCNzt), 24 Nov 2026 00:10 UTC, of work/factory.a-gmail cd9266f. **Unsigned**: sites.a holds no live key yet (the signing blocker, A2), so this is its opinion by message, to be signed once its key lands. Recorded here as sites.a sent it, summarised.

**Verdict: no objection, with conditions.**

Checked against requests/README.md: the label is not reserved, the group is tool, and the title, description and kind are valid, with no dashes and no private person named. The request matches the CRM request's shape.

## On the name
sites.a recommends Site__Tool__Google__Gmail at gmail.google.tool.sovereignweb.site. Its reason: Dinis's own words for this case on 22 Nov ("gmail.google.tool", requests/README.md), while "Site__Tool__Gmail" reached us second-hand. The choice stays on Dinis's list, with the provider form first.

## Wording and kind
- **Wording:** "Unofficial; not affiliated with or endorsed by Google." This is applied in cb8aeed. The same line goes on every page.
- **Kind:** demo is right. There is no outside owner, and the default mode runs on the synthetic twin, as for CRM.

## Conditions
1. **The Google OAuth decision line.** sites.a states that Gmail's read and send scopes are classed by Google as restricted, so an external app outside testing mode needs Google's verification. Until then it is limited to listed test users. The address change alone does not open the tool to everyone.
2. **Security in R4:**
   - tokens stay in the browser only;
   - a strict CSP and no third-party scripts;
   - the leak scan covers tokens;
   - demo mode is the default, and the synthetic twin holds no real mail.
3. **The site's ABP.** It, or the pointer to abp/cell-email.md, must exist before the first deploy.
4. **Provenance from day one.** The brief (2f58a0b), this review, the security sign-off and the decision go into site/data/provenance.jsonl once the seed supports it.
