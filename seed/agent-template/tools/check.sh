#!/usr/bin/env bash
# Run every check the deploy runs (.github/workflows/pages.yml), here, before you push:
# build, link previews (share-check), quality, HTML validity and accessibility (axe-core).
#   bash tools/check.sh          all checks
#   bash tools/check.sh --fast   skip accessibility (no browser)
# Every new page needs its 14 Open Graph and Twitter tags (copy the <head> of an existing page), or share-check fails.
# Seeded by SovereignWebsite__IaC. Uses the Playwright Chromium already in the container when there is one.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
wf=.github/workflows/pages.yml
grep -q "SWS_GATE: '1'" "$wf" && export SWS_GATE=1
grep -q "SWS_OWN_SITE: '1'" "$wf" && export SWS_OWN_SITE=1
step() { printf '\n== %s\n' "$1"; }
step build;            node .github/ci/build.mjs
step "link previews";  node .github/ci/share-check.mjs _site
step quality;          node .github/ci/quality.mjs _site
step "html validity";  npx --yes html-validate@8.24.0 --config .github/ci/htmlvalidate.json "_site/**/*.html"
if [ "${1:-}" = --fast ]; then printf '\nAll checks passed except accessibility (skipped).\n'; exit 0; fi
step accessibility
t=$(mktemp -d); trap 'rm -rf "$t"' EXIT
pw=$(node -p 'require("path").dirname(require.resolve("playwright/package.json"))' 2>/dev/null || true)
(cd "$t" && npm init -y >/dev/null && npm install --no-save --no-audit --no-fund --loglevel=error @axe-core/playwright@4.10.1 $([ -n "$pw" ] || echo playwright@1.49.1))
if [ -n "$pw" ]; then rm -rf "$t/node_modules/playwright"; ln -s "$pw" "$t/node_modules/playwright"; fi
cp .github/ci/axe.mjs "$t/axe.mjs"; node "$t/axe.mjs" "$PWD/_site"
printf '\nAll checks passed. Safe to push.\n'
