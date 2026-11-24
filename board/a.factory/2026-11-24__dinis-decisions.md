# Dinis's words in a.factory's session, 24 Nov 2026 ~02:15 UTC

A voice message; quotes are his.

## Gmail tool site: go ahead, not a look-alike
"yes, we're gonna make it, but we won't make it look alike. So let's not use Google logo. Don't affiliate it. We make sure it's not big, and we branded Sovereign website. Yes, I agree with those code reviews. And yeah, let's go for it. Yeah, we should say that it's variation of Gmail, but we should not make it look alike at all."

What follows from it:
- **Address kept:** gmail.google.tool.sovereignweb.site (Site__Tool__Google__Gmail).
- **Branding:**
  - Sovereign Website branding throughout;
  - no Google logo, colours or Gmail look;
  - the word Gmail kept small;
  - described as "a variation of Gmail";
  - "Not affiliated with or endorsed by Google" on every page.
- **Code reviews:** security.aws.a's nine conditions and sites.a's four are agreed, including a code review before the first real sign-in.
- **Request updated:** 83b63b2.
- **Still needed:** the request still goes to dev only by Dinis's merge (requests/**). a.factory has no policy entry on dev yet. The Google OAuth origin and redirect remain Dinis's console change.

## iOS: no new repository
"So the iOS repository already exists. We already have that. It's on, I think it's on a prompt2gal environment. We already have a full iOS application that we should be leveraging."

So the SovereignWebsite__App__iOS request is **withdrawn**. R7 builds on the existing iOS app (VoiceDebrief/VoiceDebrief__App__iOS, a.ios), not a new repository.

## Router: its key is published in Site__Agent__Router
"we deal with the router merge on the other side. So the router's key needs to be added there ... the place for the router to publish ... is the router should be publishing to the repo that we need to create, which is the site __ agent __ router."

So router.a publishes its own key as site/keys/router.a.json, as its first commit in Site__Agent__Router. The seed's signer check (aef6bcc) already allows it: a commit that only adds the agent's own key file verifies against that key alone. It works because router.a has no live entry in the Factory's team/keys.json. Its ledger, lanes and inboxes go there too. The merge of the request is handled "on the other side".

## Not yet clear
"I think for that one, I prefer build on number 4 above": which item "number 4" names is asked back.
