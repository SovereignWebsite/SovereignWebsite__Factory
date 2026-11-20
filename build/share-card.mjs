// Make a site's link-preview card: a 1200x630 JPEG under 300 KB from the owner's own photo, with their name and one line.
//   node build/share-card.mjs <photo> "<name>" "<one line>" <out.jpg>
// For the site's own agent, run from a SovereignWebsite__Factory checkout. Uses the Playwright Chromium already present.
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { extname } from 'node:path';
import { createRequire } from 'node:module';
const [photo, name, line, out] = process.argv.slice(2);
if (!photo || !name || !out) { console.error('usage: node build/share-card.mjs <photo> "<name>" "<one line>" <out.jpg>'); process.exit(2); }
const { chromium } = createRequire(import.meta.url)('playwright');
const type = { '.jpg': 'jpeg', '.jpeg': 'jpeg', '.png': 'png', '.webp': 'webp' }[extname(photo).toLowerCase()];
if (!type) { console.error('photo must be .jpg, .png or .webp'); process.exit(2); }
const esc = (s) => String(s || '').replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]);
const src = `data:image/${type};base64,${readFileSync(photo).toString('base64')}`;
const html = `<!doctype html><html><body style="margin:0">
<div style="position:relative;width:1200px;height:630px;overflow:hidden;font-family:system-ui,-apple-system,Segoe UI,sans-serif">
<img src="${src}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
<div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.72) 0%,rgba(0,0,0,.45) 45%,rgba(0,0,0,0) 75%)"></div>
<div style="position:absolute;left:72px;bottom:80px;right:420px;color:#fff">
<div style="font-size:68px;font-weight:700;line-height:1.05">${esc(name)}</div>
<div style="font-size:32px;line-height:1.3;margin-top:18px;opacity:.95">${esc(line)}</div>
</div></div></body></html>`;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await p.setContent(html); await p.waitForLoadState('networkidle');
let q = 86, buf;
do { buf = await p.screenshot({ type: 'jpeg', quality: q }); q -= 6; } while (buf.length > 290 * 1024 && q > 30);
await b.close(); writeFileSync(out, buf);
console.log(`${out}: 1200x630, ${Math.round(statSync(out).size / 1024)} KB, quality ${q + 6}`);
