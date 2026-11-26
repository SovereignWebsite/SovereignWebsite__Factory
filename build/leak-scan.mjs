// The leak scan. Must print OK before every commit and in the Pages workflow.
// Node built-ins only. Written by security@agenticcells.dinis, 2026-11-15.
//
// Scans every file git knows about (tracked, plus untracked files that are not
// ignored, so a new file is caught before its first commit) and the built site/.
// It looks for secret shapes and reports the file, the line and the kind of
// shape. It never prints the matched text: a finding is described, never quoted.
//
// Usage:
//   node build/leak-scan.mjs              scan the working tree and site/
//   node build/leak-scan.mjs --history    scan every commit reachable in this
//                                         clone (git log -p --all); fetch more
//                                         history first in a shallow clone
//
// Public keys are allowed only in team/keys.json and team/keys/*.json, and only
// when those files hold no private part. Any change to the allowlist below must
// be narrow (one path, one kind) and say why.
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Built from parts so that this file does not match its own patterns.
const DASHES = '-'.repeat(5);
const PRIVATE_BLOCK = new RegExp(`${DASHES}BEGIN [A-Z0-9 ]*PRIVATE KEY( BLOCK)?${DASHES}`);
const PUBLIC_BLOCK = new RegExp(`${DASHES}BEGIN (?:RSA |EC )?PUBLIC KEY${DASHES}[\\s\\S]*?${DASHES}END (?:RSA |EC )?PUBLIC KEY${DASHES}`, 'g');
const PUBLIC_BEGIN = new RegExp(`${DASHES}BEGIN (?:RSA |EC |PGP )?PUBLIC KEY( BLOCK)?${DASHES}`);

// Exact shapes: [kind, regex]. Order matters only for the report.
const SHAPES = [
  ['private key block', PRIVATE_BLOCK],
  ['AWS access key id', /\b(?:AKIA|ASIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA)[0-9A-Z]{16}\b/],
  ['AWS secret access key assignment', /aws_?secret_?(?:access_?)?key\s*["']?\s*[:=]\s*["']?[A-Za-z0-9\/+]{40}(?![A-Za-z0-9\/+])/i],
  ['GitHub token', /\bgh[pousr]_[A-Za-z0-9]{36,}/],
  ['GitHub fine-grained token', /\bgithub_pat_[A-Za-z0-9_]{22,}/],
  ['sgit vault or read key', /\bsgit_(?:private_vault|private_read|vk1|rk1)_[A-Za-z0-9:]{8,}/],
  ['JSON Web Token', /\beyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/],
  ['Google OAuth access token', /\bya29\.[A-Za-z0-9_-]{20,}/],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['Slack token', /\bxox[abprs]-[A-Za-z0-9-]{10,}/],
  ['Anthropic or OpenAI API key', /\bsk-(?:ant-)?[A-Za-z0-9_-]{20,}/],
];

// sgit vault key without its prefix: {passphrase}:{vault_id}. sgit generates a
// 24-character lowercase alphanumeric passphrase and an 8-character vault id.
// The passphrase side must mix letters and digits and not be pure hex, so that
// "sha256:<fingerprint>" and "<commit>:<path>" do not count.
const VAULT_PAIR = /(?<![A-Za-z0-9_\/.-])([a-z0-9]{16,64}):([a-z0-9]{4,24})(?![A-Za-z0-9_\/.-])/g;
function vaultPair(line) {
  for (const m of line.matchAll(VAULT_PAIR)) {
    const p = m[1];
    if (/[a-z]/.test(p) && /[0-9]/.test(p) && !/^[0-9a-f]+$/.test(p)) return true;
  }
  return false;
}

// A secret-looking value assigned to a secret-looking name.
const ASSIGN = /\b(?:pass(?:word|phrase)|secret|token|api_?key|private_?key|access_?key)\w*["']?\s*[:=]\s*["']?([A-Za-z0-9\/+_=.-]{16,})/gi;

function entropy(s) {
  const n = {};
  for (const c of s) n[c] = (n[c] || 0) + 1;
  let h = 0;
  for (const k in n) { const p = n[k] / s.length; h -= p * Math.log2(p); }
  return h;
}

// Long high-entropy strings. Pure hex of 40 characters is a git object id and
// is allowed (pinned actions, commit references); longer hex is flagged.
const LONG = /[A-Za-z0-9+\/_-]{32,}={0,2}/g;
function highEntropy(line) {
  for (const m of line.matchAll(LONG)) {
    const s = m[0].replace(/=+$/, '');
    if (/^[0-9a-f]+$/i.test(s)) { if (s.length >= 48 && entropy(s) >= 3.5) return true; continue; }
    if (s.includes('/') && !/[+=]/.test(m[0]) && s.split('/').some((seg) => /^[a-z][a-z.-]*$/.test(seg))) continue; // a path or URL
    const classes = [/[a-z]/, /[A-Z]/, /[0-9]/].filter((r) => r.test(s)).length;
    if (classes >= 3 && entropy(s) >= 4.3) return true;
  }
  return false;
}

// Narrow allowlist: [path, kind, reason]. Keep each entry to one file and one kind.
const ALLOW = [
  // The GitHub OIDC subject for the AWS trust policy, with the organisation's and
  // repository's public numeric IDs (factory@, 2026-11-16). Not a secret.
  ['docs/aws-oidc.md', 'long high-entropy string', 'OIDC subject with public numeric IDs'],
  ['docs/SETUP.md', 'long high-entropy string', 'the same OIDC subject, in the setup steps'],
];
const allowed = (path, kind) => ALLOW.some(([p, k]) => p === path && k === kind);

const PUBLIC_KEY_FILES = (p) => p === 'team/keys.json' || /^team\/keys\/[a-z0-9-]+\.json$/.test(p);
// A decision record's detached signature (decisions/<id>.json.sig, build/decisions.mjs): public, and base64 by nature.
// Skipped only when the whole file is one SSH SIGNATURE armour block; anything else in it is scanned as usual.
const DECISION_SIG = /^decisions\/\d{4}-\d{2}-\d{2}__[a-z0-9-]+\.json\.sig$/;
const SSH_SIG_ONLY = /^-----BEGIN SSH SIGNATURE-----\n(?:[A-Za-z0-9+\/=]{1,76}\n)+-----END SSH SIGNATURE-----\n?$/;

// Returns a list of {line, kind} for one file's text. Never returns the match.
export function scanText(path, text) {
  const found = [];
  const add = (line, kind) => { if (!allowed(path, kind)) found.push({ line, kind }); };
  let body = text;
  if (DECISION_SIG.test(path) && SSH_SIG_ONLY.test(text)) return found;
  if (PUBLIC_KEY_FILES(path)) {
    if (/private|passphrase|secret|seed/i.test(text)) add(0, 'public key file mentions a private part');
    // Blank the allowed public key blocks, keeping line numbers.
    body = text.replace(PUBLIC_BLOCK, (b) => b.replace(/[^\n]/g, ' '));
  }
  body.split('\n').forEach((line, i) => {
    const n = i + 1;
    for (const [kind, re] of SHAPES) if (re.test(line)) add(n, kind);
    if (PUBLIC_BEGIN.test(line)) add(n, 'public key outside team/keys');
    if (vaultPair(line)) add(n, 'sgit vault key shape (passphrase:vault_id)');
    for (const m of line.matchAll(ASSIGN)) {
      const v = m[1];
      if (/[0-9]/.test(v) && /[A-Za-z]/.test(v) && entropy(v) >= 3.5) { add(n, 'secret-looking value assigned to a secret name'); break; }
    }
    if (highEntropy(line)) add(n, 'long high-entropy string');
  });
  return found;
}

function isBinary(buf) { return buf.subarray(0, 8000).includes(0); }

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

function scanTree() {
  const files = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: root })
    .toString().split('\0').filter(Boolean);
  const siteDir = join(root, 'site');
  // Factory adaptation (factory@, 2026-11-15): this repository builds no site, so site/ is scanned only if it exists.
  const siteFiles = existsSync(siteDir) ? walk(siteDir).map((p) => p.slice(root.length + 1)) : [];
  const paths = [...new Set([...files, ...siteFiles])];
  const errors = [];
  let count = 0, skipped = 0;
  for (const p of paths) {
    const full = join(root, p);
    if (!existsSync(full) || statSync(full).isDirectory()) continue; // deleted in the working tree
    const buf = readFileSync(full);
    if (isBinary(buf)) { skipped++; continue; }
    count++;
    for (const f of scanText(p, buf.toString('utf8'))) errors.push(`${p}:${f.line}: ${f.kind}`);
  }
  return { errors, count, skipped };
}

function scanHistory() {
  // Added lines only: a removed line was already caught when it was added.
  const log = execFileSync('git', ['log', '-p', '--all', '--no-color', '--no-ext-diff', '--format=commit %H'], { cwd: root, maxBuffer: 1 << 30 }).toString();
  const errors = [];
  let commit = '', file = '', commits = 0;
  const byFile = new Map(); // commit+file -> added lines
  const flush = () => {
    for (const [key, lines] of byFile) {
      const [c, f] = key.split('\t');
      const found = scanText(f, lines.join('\n'));
      for (const x of found) errors.push(`${c.slice(0, 7)} ${f}: ${x.kind}`);
    }
    byFile.clear();
  };
  for (const line of log.split('\n')) {
    if (line.startsWith('commit ')) { flush(); commit = line.slice(7); commits++; file = ''; continue; }
    if (line.startsWith('+++ ')) { file = line.startsWith('+++ b/') ? line.slice(6) : ''; continue; }
    if (file && line.startsWith('+')) {
      const k = `${commit}\t${file}`;
      if (!byFile.has(k)) byFile.set(k, []);
      byFile.get(k).push(line.slice(1));
    }
  }
  flush();
  return { errors: [...new Set(errors)], count: commits };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const history = process.argv.includes('--history');
  const { errors, count, skipped } = history ? scanHistory() : scanTree();
  if (errors.length) {
    console.error(errors.join('\n'));
    console.error(`FAILED (${errors.length}) in ${count} ${history ? 'commits' : 'files'}`);
    process.exit(1);
  }
  console.log(history ? `OK (${count} commits)` : `OK (${count} files, ${skipped} binary skipped)`);
}
