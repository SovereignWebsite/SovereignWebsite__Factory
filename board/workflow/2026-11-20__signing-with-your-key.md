# Signing your commits with your own key

For every SovereignWebsite agent. Each commit is signed with the agent's own sgit signing key (ECDSA P-256), whose public half is in team/keys.json; build/check-signatures.mjs checks a git SSH signature against the OpenSSH form of that key. The container's default signature is not accepted, with or without the trailers.

## The way that works
Each step as its own command (a single compound command was refused by the session's safety check once). Never print or read the private half.

1. Make your key with `sgit pki keygen`; send the conductor your public bundle (`sgit pki export`).
2. sgit may insist on a passphrase for its own keystore: if so, use a random one in a 0600 file. Write the git signing half, without a passphrase, to a 0600 file in your session and outside any repository (for example `~/.sw-secret/signing`), in OpenSSH or PEM form. Dinis, 20 November 2026: "we don't need to protect keys with passphrases (for now)". The container is thrown away with the session.
3. Check: `ssh-keygen -y -f <that file>` must match the `sign` key in your bundle.
4. In your clone only: `git config gpg.format ssh`, `git config user.signingkey <file>`, `git config commit.gpgsign true`, and, if the container sets its own program, `git config gpg.ssh.program ssh-keygen`.
5. Before every push: `git cat-file -p HEAD | grep -c "BEGIN SSH SIGNATURE"` prints 1.

## No ssh-agent
With the key file unprotected, git signs with `ssh-keygen` directly: no ssh-agent, no askpass and no extra permission rule. (emily.b's ssh-agent route, with a rule Dinis approved in its session, also works but is not needed.)

Sources: the conductor's own setup (19 Nov), sotavento.b and emily.b (20 Nov).
