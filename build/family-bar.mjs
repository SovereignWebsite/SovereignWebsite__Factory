// Add (or refresh) the family links on every HTML page of a site.
//   node build/family-bar.mjs <site-dir> <this-site-url>            the family bar, for the organisation's own sites
//   node build/family-bar.mjs <site-dir> --credit                   a small top-right pop-up menu, for customers' sites
// Customer sites are the owner's (Dinis, 20 November 2026: "this is not a website about us ... a little thing
// ... that points to our multiple sites"; "I'm happy that just shows on some top right pop-up menu"), so they carry
// the pop-up credit, never the bar.
// Idempotent: each run removes any bar or credit it made before, then adds one; its CSS goes once into style.css if present.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const [dir, arg] = process.argv.slice(2);
const credit = arg === '--credit';
const seed = (f) => readFileSync(join(here, '../seed/shared', f), 'utf8');
let block = seed(credit ? 'family-credit.html' : 'family-bar.html').trim();
if (!credit && arg) block = block.replaceAll(`href="${arg}"`, `href="${arg}" aria-current="true"`);
const css = seed(credit ? 'family-credit.css' : 'family-bar.css');
let n = 0;
for (const f of readdirSync(dir).filter((x) => x.endsWith('.html'))) {
  const p = join(dir, f); let s = readFileSync(p, 'utf8');
  s = s.replace(/\n?<nav class="family"[\s\S]*?<\/nav>/, '').replace(/\n?<details class="family-credit">[\s\S]*?<\/details>/, '');
  if (credit) {
    // Straight after <body> (and after the skip link if there is one): CSS puts it in the top right corner.
    if (/<a class="skip"[^>]*>[^<]*<\/a>/.test(s)) s = s.replace(/(<a class="skip"[^>]*>[^<]*<\/a>)/, (m) => `${m}\n${block}`);
    else s = s.replace(/<body([^>]*)>/, (m) => `${m}\n${block}`);
  } else if (/<a class="skip"[^>]*>[^<]*<\/a>/.test(s)) {
    // After the skip link if there is one (keyboard users skip the bar), else straight after <body>.
    s = s.replace(/(<a class="skip"[^>]*>[^<]*<\/a>)/, (m) => `${m}\n${block}`);
  } else s = s.replace(/<body([^>]*)>/, (m) => `${m}\n${block}`);
  writeFileSync(p, s); n++;
}
const st = join(dir, 'style.css');
const mark = credit ? '.family-credit{' : '.family{';
if (existsSync(st) && !readFileSync(st, 'utf8').includes(mark)) writeFileSync(st, readFileSync(st, 'utf8') + '\n' + css);
console.log(`family ${credit ? 'credit' : 'bar'} on ${n} pages in ${dir}`);
