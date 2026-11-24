#!/usr/bin/env bash
# Make this agent's own signing key and wire git to sign with it, in this session only.
# Usage, from the root of this repository:  bash tools/setup-signing.sh <agent-name> <session-url>
#   e.g. bash tools/setup-signing.sh a.crm.dev@SovereignWebsite.dinis https://claude.ai/code/session_...
# It never prints, commits or copies the private half: that stays in ~/.sg-send and ~/.sw-secret (mode 600) and
# ends with the session. It writes the PUBLIC key file site/keys/<name>.json for your first commit.
# Steps follow SovereignWebsite__IaC board/workflow/2026-11-20__signing-with-your-key.md.
set -euo pipefail
AGENT="${1:?agent name, e.g. a.crm.dev@SovereignWebsite.dinis}"; SESSION="${2:?your session URL}"
NAME="${AGENT%@*}"; LABEL="$(printf '%s' "$NAME" | tr '.' '-')-sovereignwebsite"
SECRET="$HOME/.sw-secret"; umask 077; mkdir -p "$SECRET"; chmod 700 "$SECRET"
command -v sgit >/dev/null || pip install -q sgit-ai==0.27.0
command -v ssh-keygen >/dev/null || { apt-get install -y -qq openssh-client >/dev/null 2>&1 || { apt-get update -qq >/dev/null 2>&1 && apt-get install -y -qq openssh-client >/dev/null 2>&1; }; }
[ -f "$SECRET/sgit-pass" ] || python3 -c "import secrets;print(secrets.token_urlsafe(32))" > "$SECRET/sgit-pass"
if [ ! -f "$SECRET/bundle.json" ]; then
  FP=$(cat "$SECRET/sgit-pass" "$SECRET/sgit-pass" | sgit pki keygen --label "$LABEL" 2>/dev/null | sed -n 's/^ *Fingerprint: *\(sha256:[0-9a-f]*\).*/\1/p' | head -1)
  [ -n "$FP" ] || { echo "keygen failed: record it as a signing blocker in your now.md and tell your maestro" >&2; exit 1; }
  sgit pki export "$FP" > "$SECRET/bundle.json"
fi
python3 - "$SECRET" "$AGENT" "$SESSION" <<'PY'
import json, os, sys, glob
from cryptography.hazmat.primitives import serialization as s
secret, agent, session = sys.argv[1:4]
b = json.load(open(f"{secret}/bundle.json"))
d = glob.glob(os.path.expanduser(f"~/.sg-send/keys/{b['fingerprint'].replace(':','_')}"))[0]
pw = open(f"{secret}/sgit-pass", "rb").read().strip()
k = s.load_pem_private_key(open(f"{d}/signing_private.pem", "rb").read(), password=pw)
out = f"{secret}/signing"
open(out, "wb").write(k.private_bytes(s.Encoding.PEM, s.PrivateFormat.OpenSSH, s.NoEncryption())); os.chmod(out, 0o600)
pub = k.public_key().public_bytes(s.Encoding.OpenSSH, s.PublicFormat.OpenSSH).decode()
name = agent.split("@")[0]; os.makedirs("site/keys", exist_ok=True)
entry = {"agent": agent, "session": session, "status": "active", "fingerprint": b["fingerprint"], "signing_fingerprint": b["signing_fingerprint"],
         "ssh": pub, "bundle": b, "how": "Made by the agent in its own session with sgit pki keygen (tools/setup-signing.sh). Only the public half is here. A session key: it ends with its session."}
open(f"site/keys/{name}.json", "w").write(json.dumps(entry, indent=2) + "\n")
print(f"public key written: site/keys/{name}.json (signing {b['signing_fingerprint']})")
PY
ssh-keygen -y -f "$SECRET/signing" | cut -d' ' -f1-2 | diff -q - <(python3 -c "import json;print(json.load(open('site/keys/$NAME.json'))['ssh'])") >/dev/null || { echo "key check failed: the OpenSSH key does not match the bundle" >&2; exit 1; }
git config gpg.format ssh; git config user.signingkey "$SECRET/signing"; git config commit.gpgsign true; git config gpg.ssh.program ssh-keygen
echo "git signs with your key in this clone. Next: commit ONLY site/keys/$NAME.json, with trailers Agent: $AGENT and Claude-Session: $SESSION (START.md step 3)."
