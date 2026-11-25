// Accessibility: axe-core on every HTML page under the built site (the same pages share-check reads, at any depth),
// served locally. A redirect page (meta refresh) is skipped: it has no content of its own.
// node .github/ci/axe.mjs _site   Needs playwright and @axe-core/playwright (installed by the workflow). Fails on any violation.
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, readdirSync, appendFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
const dir = process.argv[2] || '_site';
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.txt': 'text/plain' };
const server = createServer((q, r) => { let f = join(dir, decodeURI(q.url.split('?')[0])); if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html'); if (!existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' }); r.end(readFileSync(f)); });
await new Promise((ok) => server.listen(0, ok)); const base = `http://127.0.0.1:${server.address().port}`;
const paths = [];
const walk = (d) => { for (const e of readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) { const p = join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith('.html') && !/<meta\s+http-equiv="refresh"/i.test(readFileSync(p, 'utf8'))) { const rel = '/' + p.slice(dir.length).replace(/^[\\/]+/, '').split(/[\\/]/).join('/'); paths.push(rel.endsWith('/index.html') ? rel.slice(0, -'index.html'.length) : rel === '/index.html' ? '/' : rel); } } };
walk(dir);
const b = await chromium.launch(); const rows = []; let bad = 0;
for (const p of [...new Set(paths)].sort((a, b) => (a === '/' ? -1 : b === '/' ? 1 : a.localeCompare(b)))) {
  const ctx = await b.newContext(); const page = await ctx.newPage(); await page.goto(base + p);
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze();
  for (const v of r.violations) console.log(`::error::axe ${p}: ${v.id} (${v.impact}) on ${v.nodes.length} element(s): ${v.help}`);
  rows.push(`| ${p} | ${r.violations.length ? `failed (${r.violations.map((v) => v.id).join(', ')})` : 'passed'} |`); bad += r.violations.length; await ctx.close();
}
await b.close(); server.close();
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, '### Accessibility (axe-core)\n\n| Page | Result |\n|---|---|\n' + rows.join('\n') + '\n\n');
console.log(rows.join('\n')); process.exit(bad ? 1 : 0);
