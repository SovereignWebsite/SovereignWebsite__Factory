// Quality checks on the built site, before anything is deployed. Any error fails the run.
// node .github/ci/quality.mjs _site   Writes a table of the checks to $GITHUB_STEP_SUMMARY.
// Seeded by SovereignWebsite__Factory. No dependencies (HTML validity and axe run as their own steps).
import { readFileSync, readdirSync, existsSync, statSync, appendFileSync } from 'node:fs';
import { join, relative, dirname, posix } from 'node:path';
import { inflateRawSync } from 'node:zlib';
const dir = process.argv[2] || '_site';
const host = existsSync(join(dir, 'CNAME')) ? readFileSync(join(dir, 'CNAME'), 'utf8').trim() : '';
const files = []; const walk = (d) => { for (const e of readdirSync(d, { withFileTypes: true })) { const p = join(d, e.name); e.isDirectory() ? walk(p) : files.push(p); } }; walk(dir);
const pages = files.filter((f) => f.endsWith('.html'));
const results = []; const add = (name, errors, warnings = []) => results.push({ name, errors, warnings });

// 1. Links and assets inside the site: every href and src must resolve to a file in the build.
const internal = [], external = new Map();
for (const p of pages) {
  const h = readFileSync(p, 'utf8'); const at = '/' + relative(dir, p).split('\\').join('/');
  for (const m of h.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    let u = m[1].replace(/&amp;/g, '&');
    if (/^(mailto:|tel:|data:|javascript:|#)/.test(u)) continue;
    if (host && u.startsWith(`https://${host}/`)) u = u.slice(`https://${host}`.length);
    if (/^https?:\/\//.test(u)) { if (!external.has(u)) external.set(u, at); continue; }
    const path = u.split('#')[0].split('?')[0]; if (!path) continue;
    const abs = path.startsWith('/') ? path : posix.join(posix.dirname(at), path);
    const f = join(dir, decodeURI(abs)); const ok = existsSync(f) && (statSync(f).isFile() || existsSync(join(f, 'index.html')));
    if (!ok) internal.push(`${at}: ${u} is not in the site`);
  }
}
add('Internal links and assets', internal);

// 2. External links: 404 or 410 fails; a timeout or other error only warns.
const extErr = [], extWarn = [];
await Promise.all([...external].map(async ([u, at]) => {
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 15000);
    let r = await fetch(u, { method: 'HEAD', redirect: 'follow', signal: ctl.signal }).catch(() => null);
    if (!r || r.status === 405 || r.status === 403) r = await fetch(u, { redirect: 'follow', signal: ctl.signal });
    clearTimeout(t);
    if (r.status === 404 || r.status === 410) extErr.push(`${at}: ${u} answers ${r.status}`);
    else if (r.status >= 400) extWarn.push(`${at}: ${u} answers ${r.status}`);
  } catch (e) { extWarn.push(`${at}: ${u} did not answer (${e.name})`); }
}));
add(`External links (${external.size})`, extErr, extWarn);

// 3. No em dashes in visible text (the house style).
const dash = [];
for (const p of pages) {
  const text = readFileSync(p, 'utf8').replace(/<(script|style)[\s\S]*?<\/\1>/gi, '').replace(/<[^>]+>/g, ' ');
  if (text.includes('\u2014')) dash.push(`${relative(dir, p)}: an em dash in visible text`);
}
add('No em dashes', dash);

// 4. A customer site carries no family strip above its header: only the top-right pop-up. The organisation's
//    own sites (SWS_OWN_SITE=1, set in their pages.yml) keep the family bar.
const strip = process.env.SWS_OWN_SITE === '1' ? [] : pages.filter((p) => /<nav class="family"/.test(readFileSync(p, 'utf8'))).map((p) => `${relative(dir, p)}: the family strip (use build/family-bar.mjs --credit)`);
add('No family strip', strip);

// 5. Leak scan: no private key, token or secret in any published file.
const LEAK = [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, /\bgh[pousr]_[A-Za-z0-9]{30,}/, /\bgithub_pat_[A-Za-z0-9_]{40,}/, /\bAKIA[0-9A-Z]{16}\b/, /\bsk-[A-Za-z0-9_-]{32,}/, /\bxox[abpr]-[A-Za-z0-9-]{20,}/, /\bAIza[0-9A-Za-z_-]{35}\b/];
const leaks = [];
// A zip is opened and every entry inside it is scanned (a sealed vault's entries are ciphertext and pass; a plain zip
// with a key inside does not). A zip that cannot be read fails the scan (security.b, 20 November 2026).
function zipEntries(b) {
  let e = -1; for (let i = b.length - 22; i >= Math.max(0, b.length - 65558); i--) if (b.readUInt32LE(i) === 0x06054b50) { e = i; break; }
  if (e < 0) throw new Error('no end of central directory');
  const n = b.readUInt16LE(e + 10); let p = b.readUInt32LE(e + 16); const out = [];
  for (let k = 0; k < n; k++) {
    if (b.readUInt32LE(p) !== 0x02014b50) throw new Error('damaged central directory');
    const method = b.readUInt16LE(p + 10), csize = b.readUInt32LE(p + 20), nlen = b.readUInt16LE(p + 28), xlen = b.readUInt16LE(p + 30), clen = b.readUInt16LE(p + 32), local = b.readUInt32LE(p + 42);
    const name = b.subarray(p + 46, p + 46 + nlen).toString('utf8');
    const start = local + 30 + b.readUInt16LE(local + 26) + b.readUInt16LE(local + 28); const raw = b.subarray(start, start + csize);
    if (!name.endsWith('/')) { if (method === 0) out.push([name, raw]); else if (method === 8) out.push([name, inflateRawSync(raw)]); else throw new Error(`${name}: compression method ${method}`); }
    p += 46 + nlen + xlen + clen;
  }
  return out;
}
const scan = (label, buf) => { const s = buf.toString('latin1'); for (const re of LEAK) if (re.test(s)) leaks.push(`${label}: matches ${re.source.slice(0, 24)}`); };
for (const f of files) {
  const at = relative(dir, f); const b = readFileSync(f);
  if (f.endsWith('.zip')) { try { for (const [name, data] of zipEntries(b)) scan(`${at}!${name}`, data); } catch (e) { leaks.push(`${at}: not a readable zip (${e.message})`); } continue; }
  if (b.length > 5e6) continue;
  scan(at, b);
}
add('Leak scan', leaks);

const failed = results.filter((r) => r.errors.length);
const lines = ['| Check | Result |', '|---|---|', ...results.map((r) => `| ${r.name} | ${r.errors.length ? `failed (${r.errors.length})` : r.warnings.length ? `passed, ${r.warnings.length} warning(s)` : 'passed'} |`)];
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, '### Quality checks\n\n' + lines.join('\n') + '\n\n');
for (const r of results) { for (const w of r.warnings) console.log(`::warning::${r.name}: ${w}`); for (const e of r.errors) console.log(`::error::${r.name}: ${e}`); }
console.log(lines.join('\n'));
process.exit(failed.length ? 1 : 0);
