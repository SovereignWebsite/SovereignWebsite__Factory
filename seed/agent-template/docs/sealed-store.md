> Copied unchanged from SovereignWebsite/Site__Platform__AWS docs/sealed-store.md (aws.c@SovereignWebsite.dinis, 22 November 2026), seeded into every new site as guidance for any page that holds a token. "What this site seals" describes the AWS Platform site; a site that holds tokens lists its own. The code it describes is that site's site/sealed-store.js.

# The sealed store: keeping a sign-in across a refresh, sealed to this site and this browser

Written by aws.c@SovereignWebsite.dinis, 22 November 2026, for this site and as guidance for every Sovereign Website page that holds a token.

Named "sealed store", not "vault", so it is not confused with sgit vaults (Dinis, 22 Nov 2026).

Dinis Cruz, 22 Nov 2026, in aws.c's session: "this has to survive refresh ... create a public and private key for that browser session, for this website, which should survive browser restart. And that public private key should never be known. And then you can use the public key to encrypt these details so that only this page ... can be saved so that it survives refresh." And: "everybody should be doing this".

## The rule
A page that holds a token, a short-lived credential or a private identifier keeps it either in memory only, or in the sealed store. Never as plain text in localStorage, sessionStorage, IndexedDB, a cookie, the URL or a log.

## How it works (site/sealed-store.js)
1. **The device key.** On first use the page makes an ECDH P-256 key pair with WebCrypto, with the private key **non-extractable**: the browser keeps its bytes and lets only this origin use it. No script, this page included, can read or export it. Both halves are kept as CryptoKey objects in IndexedDB (database `sws-sealed-store`), which the browser stores without exposing them.
2. **Sealing** a record (a JSON value under a name, with an expiry): a fresh one-off ECDH key pair; its shared secret with the device public key, through WebCrypto's deriveKey, gives an AES-GCM 256 key for this record only. The record keeps the one-off public key, a random 12-byte IV, the ciphertext and the expiry. The origin and the record's name are bound in as AES-GCM additional data, so a record cannot be moved to another name or site.
3. **Opening**: the device private key and the record's one-off public key give the same AES key. A record past its expiry, or one that will not decrypt, is deleted and treated as absent.
4. **Ending it**: Sign out deletes the sealed session. Forget this device deletes the whole database: the key pair and everything sealed with it.

## What this site seals
- `session`: the Google ID token and the STS credentials, each with its own expiry; the record ends when the last of them does (at most about an hour).
- `accounts`: the AWS account IDs and their names (kept ten years, or until Forget this device). The page and the repository never hold them.

## What it protects, and what it does not
- **Protects**: the stored bytes are useless off this browser profile (copied files, a synced backup, another site, a browser extension reading storage without running in this page); a stolen record cannot be opened anywhere else; nothing readable sits in storage.
- **Does not protect against**: a script running inside this page, which can ask the browser to use the key (hence the strict Content Security Policy: scripts only from this site and Google's sign-in); or someone using this browser profile while a session is still valid. Short expiries limit both.
- **Next, if wanted**: a passkey (WebAuthn with the PRF extension) can add a second factor, so that opening the sealed store also needs a touch or a face; its interface stays the same.

## Checked by
The end-to-end test signs in (Google and AWS stubbed), reloads, and checks: the session and account come back; the device private key reports `extractable: false`; no token, access key or account ID appears in the stored bytes or in localStorage; Forget this device leaves nothing to restore.
