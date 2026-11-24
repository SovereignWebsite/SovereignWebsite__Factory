// This person's requester key, made in this browser and kept here (security.b's condition, 24 Nov 2026: requester keys
// are made on each person's own device; no keeper ever issues or holds anyone's private half). WebCrypto P-256: the
// private signing key is generated NON-EXTRACTABLE and stored in this browser's IndexedDB, so no script can copy it
// out, and it never leaves this device. The public half is shown so the person can send it to the site's owner, who
// endorses it; the keeper then lists it in requesters.json. Seeded by SovereignWebsite__IaC (a.factory), after
// Chiswick Cheese Market's keyring.js (chiswick-cheese-market.c) and SGit-AI__Website__Web-Summit's (Apache-2.0).
// window.SWSKeyring: { load(), make(), sign(text), forget(), state: { fingerprint, sign } }
(() => {
    'use strict'
    const DB = 'sws-send-keyring', STORE = 'keys', te = new TextEncoder()
    const S = window.crypto && window.crypto.subtle
    const toB64 = (b) => { let s = ''; for (const x of new Uint8Array(b)) s += String.fromCharCode(x); return btoa(s) }
    const idb = () => new Promise((ok, no) => { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => r.result.createObjectStore(STORE); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error) })
    const tx = async (mode, fn) => { const db = await idb(); return new Promise((ok, no) => { const t = db.transaction(STORE, mode), r = fn(t.objectStore(STORE)); t.oncomplete = () => ok(r && r.result); t.onerror = () => no(t.error) }) }
    const state = { fingerprint: '', sign: null, priv: null }
    async function fingerprintOf(jwk) { const d = await S.digest('SHA-256', te.encode(`${jwk.x}.${jwk.y}`)); return 'sha256:' + Array.from(new Uint8Array(d)).map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16) }
    async function load() {
        if (!S || !window.indexedDB) return state
        try { const r = await tx('readonly', (s) => s.get('me')); if (r) Object.assign(state, r) } catch { }
        return state
    }
    async function make() {
        const pair = await S.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign', 'verify'])
        const jwk = await S.exportKey('jwk', pair.publicKey)
        const sign = { kty: 'EC', crv: 'P-256', x: jwk.x, y: jwk.y }
        const rec = { fingerprint: await fingerprintOf(sign), sign, priv: pair.privateKey, made: new Date().toISOString() }
        await tx('readwrite', (s) => s.put(rec, 'me'))
        return Object.assign(state, rec)
    }
    async function sign(text) {
        if (!state.priv) throw new Error('no key in this browser')
        return toB64(await S.sign({ name: 'ECDSA', hash: 'SHA-256' }, state.priv, te.encode(text)))
    }
    async function forget() { await tx('readwrite', (s) => s.delete('me')); Object.assign(state, { fingerprint: '', sign: null, priv: null }) }
    window.SWSKeyring = { load, make, sign, forget, state }
})()
