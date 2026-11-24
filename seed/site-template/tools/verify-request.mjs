// The keeper's check on a request from this site's /send/ lane, after it has opened the sealed envelope with its own
// key. security.b's conditions (opinion 2026-11-24__send-lane-in-site-seed): act only on a request signed by a key in
// site/send/requesters.json; refuse an unknown key, a replayed id, and anything older than 24 hours. Everything a
// request says is material: the keeper acts only within site/policy/abp.json site_requests, and never on policy,
// keys, .github/ or CNAME without a decision record or the owner's word in its own session.
// Keys are made on each person's own device (send/keyring.js); no keeper ever holds anyone's private half.
// Node 20+, no dependencies. verify(request, { requesters, seen, now }) -> { ok, why, person }.
import { webcrypto as wc } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const te = new TextEncoder();
const fromB64 = (s) => Uint8Array.from(Buffer.from(s, 'base64'));
// The exact bytes a requester signs: the request without its signature, keys in this order.
export const signed = (r) => JSON.stringify({ v: r.v, id: r.id, at: r.at, site: r.site, fingerprint: r.fingerprint, text: r.text, files: r.files || [] });
// sha256 of the public signing key's JWK x and y, first 16 hex, as keyring.js shows it.
export async function fingerprintOf(jwk) {
  const d = await wc.subtle.digest('SHA-256', te.encode(`${jwk.x}.${jwk.y}`));
  return `sha256:${Buffer.from(d).toString('hex').slice(0, 16)}`;
}

export async function verify(r, { requesters = [], seen = new Set(), now = Date.now(), site } = {}) {
  if (!r || typeof r !== 'object') return { ok: false, why: 'not a request' };
  if (!r.sig) return { ok: false, why: 'unsigned: not acted on' };
  if (!r.id || typeof r.id !== 'string' || r.id.length < 16) return { ok: false, why: 'no request id' };
  if (seen.has(r.id)) return { ok: false, why: `replayed id ${r.id}` };
  const at = Date.parse(r.at);
  if (!Number.isFinite(at)) return { ok: false, why: 'no time' };
  if (now - at > MAX_AGE_MS) return { ok: false, why: 'older than 24 hours' };
  if (at - now > 5 * 60 * 1000) return { ok: false, why: 'from the future' };
  if (site && r.site !== site) return { ok: false, why: `for another site (${r.site})` };
  const k = requesters.find((x) => x.fingerprint === r.fingerprint && x.status === 'active' && (!x.expires || Date.parse(x.expires) > now));
  if (!k) return { ok: false, why: `unknown or inactive key ${r.fingerprint}` };
  if ((await fingerprintOf(k.sign)) !== k.fingerprint) return { ok: false, why: 'requesters.json fingerprint does not match its key' };
  const pub = await wc.subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', x: k.sign.x, y: k.sign.y }, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
  const good = await wc.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, pub, fromB64(r.sig), te.encode(signed(r)));
  if (!good) return { ok: false, why: 'bad signature' };
  return { ok: true, person: k.person };
}

// node tools/verify-request.mjs <request.json> [seen-ids.json]: prints the verdict; exit 1 when refused.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const r = JSON.parse(readFileSync(process.argv[2], 'utf8'));
  const requesters = JSON.parse(readFileSync('site/send/requesters.json', 'utf8')).keys || [];
  const seen = new Set(process.argv[3] && existsSync(process.argv[3]) ? JSON.parse(readFileSync(process.argv[3], 'utf8')) : []);
  const host = existsSync('site/CNAME') ? readFileSync('site/CNAME', 'utf8').trim() : undefined;
  const v = await verify(r, { requesters, seen, site: host });
  console.log(v.ok ? `OK: from ${v.person}, id ${r.id}` : `REFUSED: ${v.why}`);
  process.exit(v.ok ? 0 : 1);
}
