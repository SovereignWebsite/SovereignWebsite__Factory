// Add (or refresh) the family bar on every HTML page of a site: node build/family-bar.mjs <site-dir> <this-site-url>
// Idempotent: replaces an existing <nav class="family"> block; appends its CSS once to style.css if present.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const [dir, self] = process.argv.slice(2);
let bar = readFileSync(join(here, '../seed/shared/family-bar.html'), 'utf8').trim();
if (self) bar = bar.replaceAll(`href="${self}"`, `href="${self}" aria-current="true"`);
const css = readFileSync(join(here, '../seed/shared/family-bar.css'), 'utf8');
let n = 0;
for (const f of readdirSync(dir).filter((x) => x.endsWith('.html'))) {
  const p = join(dir, f); let s = readFileSync(p, 'utf8');
  s = s.replace(/\n?<nav class="family"[\s\S]*?<\/nav>/, '');
  // After the skip link if there is one (keyboard users skip the bar), else straight after <body>.
  if (/<a class="skip"[^>]*>[^<]*<\/a>/.test(s)) s = s.replace(/(<a class="skip"[^>]*>[^<]*<\/a>)/, (m) => `${m}\n${bar}`);
  else s = s.replace(/<body([^>]*)>/, (m) => `${m}\n${bar}`);
  writeFileSync(p, s); n++;
}
const st = join(dir, 'style.css');
if (existsSync(st) && !readFileSync(st, 'utf8').includes('.family{')) writeFileSync(st, readFileSync(st, 'utf8') + '\n' + css);
console.log(`family bar on ${n} pages in ${dir}`);
