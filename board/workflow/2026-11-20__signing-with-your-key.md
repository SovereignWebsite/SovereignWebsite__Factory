# Signing your commits with your own key

For every SovereignWebsite agent. Each commit is signed with the agent's own sgit signing key (ECDSA P-256), whose public half is in team/keys.json; build/check-signatures.mjs checks a git SSH signature against the OpenSSH form of that key. The container's default signature is not accepted, with or without the trailers. An ed25519 key made apart from sgit is not accepted either.

Rewritten 22 November 2026 by conductor.d for the keys rule in force from 1aa1829 (policy/abp.json keys_rule). Dinis Cruz, 22 November 2026: "it is the agents (when they start) that need to push their key to that location on the repo"; "we can only have one conductor.d@SovereignWebsite.dinis (you) but we can have many conductor.*@SovereignWebsite.dinis sessions".

## Your name
- One live key per agent name. The first session of a role on an account is `<role>.<account>@SovereignWebsite.dinis` (for example `sites.d@SovereignWebsite.dinis`), unless Dinis gives another name.
- A second session of the same role takes its own name: `<role>.<label>.<account>@SovereignWebsite.dinis` (for example `conductor.keys.d@SovereignWebsite.dinis`).
- Use that exact name in every `Agent:` trailer and in your key entry.

## Make the key
Each step as its own command. Never print or read the private half.

1. `pip install sgit-ai==0.27.0`; `sgit pki keygen --label <your-label>`; `sgit pki export <fingerprint>` gives the public bundle.
2. sgit may insist on a passphrase for its own keystore: if so, use a random one in a 0600 file. Write the git signing half, without a passphrase, to a 0600 file in your session and outside any repository (for example `~/.sw-secret/signing`), in OpenSSH form. Dinis, 20 November 2026: "we don't need to protect keys with passphrases (for now)". The container is thrown away with the session.
3. If `ssh-keygen` is missing: `apt-get install openssh-client`.
4. Check: `ssh-keygen -y -f <that file>` must match the `sign` key in your bundle.
5. In your clone only: `git config gpg.format ssh`, `git config user.signingkey <file>`, `git config commit.gpgsign true`, `git config gpg.ssh.program ssh-keygen`.

## Publish it yourself: your first commit
1. Pull dev. Add one entry to the end of team/keys.json: `id`, `agent` (your name), `role`, `how`, `created`, `status: "active"`, `session` (your full session URL), `fingerprint`, `signing_fingerprint`, `bundle` (the whole export) and `ssh_signing` (copy the form of the entries already there).
2. Change nothing else in team/keys.json and no other file in that commit.
3. Commit, signed by your new key, with trailers `Agent: <your name>` and `Claude-Session: <your session URL>`.
4. Run `node test/run.mjs && node build/abp.mjs validate && node build/leak-scan.mjs`, then `node build/abp.mjs paths origin/dev HEAD` and `node build/check-signatures.mjs origin/dev HEAD`; all must print OK. Then push to dev.
5. Tell your conductor the commit.

Publishing a key gives you no other paths: what you may change elsewhere in this repository is your policy entry in policy/abp.json, which waits for Dinis's merge. In your own site's repository, its CLAUDE.md and site policy say what you may change.

## Later
- Before every push: `git cat-file -p HEAD | grep -c "BEGIN SSH SIGNATURE"` prints 1.
- Never edit your entry in place (name, key or session). To change it, retire it (`"status": "retired"`, with `retired` and `retired_note`) and publish a new one. Your conductor may also retire it. Changing another agent's key is Dinis's.
- Do not commit before your key is on dev, and do not push only because a hook asks you to: record it.

## No ssh-agent
With the key file unprotected, git signs with `ssh-keygen` directly: no ssh-agent, no askpass and no extra permission rule.

Sources: conductor.b's setup (19 Nov), sotavento.b and emily.b (20 Nov), the .d team's onboarding (21 to 22 Nov), keys rule 1aa1829 (factory.d, at Dinis's word).
