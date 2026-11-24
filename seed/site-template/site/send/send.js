// Send a request to this site's keeper: signed with this browser's own key (keyring.js), sealed to the keeper's public
// key (sgit hybrid envelope v2, RSA-OAEP + AES-GCM, as Chiswick Cheese Market's send.js), and appended to the keeper's
// own lane (the token can only append). Nothing is sent until the keeper has set up inbox.json. Each request carries a
// random id and the time; the keeper refuses replays, anything older than 24 hours and any key not in requesters.json
// (tools/verify-request.mjs). Seeded by SovereignWebsite__IaC (a.factory). No inline script: the CSP allows 'self' only.
(() => {
    'use strict'
    if (window.top !== window.self) { document.documentElement.textContent = 'This page cannot be shown inside another page.'; return }
    const $ = (s) => document.querySelector(s)
    const b64 = (bytes) => { let s = ''; for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b); return btoa(s) }
    const unpem = (pem) => Uint8Array.from(atob(pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '')), (c) => c.charCodeAt(0))
    const K = window.SWSKeyring
    let CFG = null
    const say = (t, bad) => { const el = $('#status'); el.textContent = t; el.className = bad ? 'status bad' : 'status ok' }
    // The exact bytes signed: the same as tools/verify-request.mjs signed().
    const signed = (r) => JSON.stringify({ v: r.v, id: r.id, at: r.at, site: r.site, fingerprint: r.fingerprint, text: r.text, files: r.files || [] })
    async function seal(pem, text) {
        const subtle = crypto.subtle
        const pub = await subtle.importKey('spki', unpem(pem), { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['encrypt'])
        const aes = await subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt'])
        const iv = crypto.getRandomValues(new Uint8Array(12))
        const c = await subtle.encrypt({ name: 'AES-GCM', iv, tagLength: 128 }, aes, new TextEncoder().encode(text))
        const w = await subtle.encrypt({ name: 'RSA-OAEP' }, pub, await subtle.exportKey('raw', aes))
        return btoa(JSON.stringify({ v: 2, w: b64(w), i: b64(iv), c: b64(c) }))
    }
    async function append(text) {
        const enc = await seal(CFG.recipient.encrypt, text)
        const r = await fetch(`${CFG.endpoint}/api/vault/append/write/${CFG.vault_id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ append_token: CFG.append_token, payload: btoa(enc) }) })
        if (!r.ok) throw new Error(r.status === 413 ? 'that is too big for one message' : r.status === 507 ? 'the inbox is full until the keeper reads it' : `the inbox answered ${r.status}`)
    }
    function showKey() {
        const has = !!K.state.priv
        $('#key-none').hidden = has; $('#key-have').hidden = !has
        if (has) { $('#fingerprint').textContent = K.state.fingerprint; $('#public').textContent = JSON.stringify({ fingerprint: K.state.fingerprint, sign: K.state.sign }) }
    }
    async function send(ev) {
        ev.preventDefault()
        if (!CFG || !CFG.set_up) return say('This site’s inbox is not set up yet, so nothing was sent.', true)
        if (!K.state.priv) return say('Make your key first (above).', true)
        const text = $('#text').value.trim(); if (!text) return say('Write your request first.', true)
        const id = b64(crypto.getRandomValues(new Uint8Array(18))).replace(/[+/=]/g, '')
        const r = { v: 1, id, at: new Date().toISOString(), site: CFG.site, fingerprint: K.state.fingerprint, text, files: [] }
        r.sig = await K.sign(signed(r))
        try { say('Sending...'); await append(JSON.stringify(r)); $('#text').value = ''; say(`Sent (request ${id.slice(0, 8)}). The keeper acts on it only if your key is listed for this site.`) } catch (e) { say(`Not sent: ${e.message}`, true) }
    }
    async function main() {
        await K.load(); showKey()
        $('#make').addEventListener('click', async () => { await K.make(); showKey() })
        $('#forget').addEventListener('click', async () => { if (confirm('Remove your key from this browser? You would need a new one listed.')) { await K.forget(); showKey() } })
        $('#copy').addEventListener('click', async () => { try { await navigator.clipboard.writeText($('#public').textContent); say('Public key copied: send it to the site’s owner.') } catch { say('Select the text above and copy it.', true) } })
        $('#form').addEventListener('submit', send)
        try { CFG = await (await fetch('inbox.json', { cache: 'no-store' })).json() } catch { CFG = null }
        $('#not-set-up').hidden = !!(CFG && CFG.set_up)
    }
    main()
})()
