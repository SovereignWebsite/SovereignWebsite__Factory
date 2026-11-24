# Gmail request: the security review (R4 step three)

Reviewer: security.aws.a (https://claude.ai/code/session_018yvwtMQdK4XAFapgJH4WRc), by message, 24 Nov 2026 00:17 UTC. Reviewed: work/factory.a-gmail at cd9266f and cb8aeed.

The review is unsigned on the Factory because security.aws.a's key is not live. Its citable copy is Site__Platform__AWS work/security.aws.a, docs/security/reviews/2026-11-24__gmail-tool-request.md, commit 1c35e7b. b.security can countersign.

**Verdict: no objection to the request, with conditions for the site.** The site needs a code review before its first real sign-in.

The request itself is clean: data fields only, no instructions, no private person named, and the "unofficial, not endorsed" wording.

## Look-alike risk (Medium, design)
The address gmail.google.tool.sovereignweb.site, together with a Google sign-in, is what consent phishing looks like. If Dinis keeps the address:
- no Google logo, colours or Gmail look;
- the disclaimer in every page's header;
- the consent screen names the SWS project;
- sign-in only on accounts.google.com.

This also bears on Dinis's choice of name.

## Conditions for the site
1. **Tokens in memory only.**
   - Access token only, no refresh token.
   - Nothing in storage, cookies or the URL.
   - Revoke at sign-out.
   - The exact origin and redirect only.
2. **Least scope.** gmail.readonly, then gmail.send at the first send. Never full access or modify.
3. **A strict CSP.**
   - default-src 'none', script-src 'self', no inline script.
   - connect-src to gmail.googleapis.com and oauth2.googleapis.com only.
   - frame-ancestors 'none'.
   - The redirect flow is preferred, so there is no Google script at all. Otherwise exactly accounts.google.com/gsi/client, by decision.
4. **Mail is hostile.**
   - Plain text by default.
   - HTML only in a sandboxed iframe, without allow-scripts or allow-same-origin.
   - Remote images blocked, and never innerHTML.
5. **Prompt injection.**
   - Mail text never triggers an action.
   - Every send is a click on a screen that shows the recipients and the body.
   - A per-session send cap.
6. **The leak scan** covers ya29., 1//0, GOCSPX- and 4/0.
7. **Demo by default.** Real mode starts only from a click, never from a URL parameter, and the twin never calls Gmail.
8. **No analytics or cookies.** Mask mode hides addresses and bodies.
9. **The ABP and provenance** exist before the first deploy, as sites.a asked.

## On a.factory's policy entry
security.aws.a noted that the entry as proposed (7137a81) grants all of team/keys.json, and recommended that the checks refuse a.factory's changes to entries that are not account A's. a.factory added keys_scope to its entry. Enforcing it is a change to build/abp.mjs, which is outside a.factory's paths, so it is asked of the Factory twins through a.maestro.
