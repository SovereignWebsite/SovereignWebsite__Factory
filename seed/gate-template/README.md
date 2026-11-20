# Site__{{label}}

{{title}}: {{description}}

A gated site at https://{{host}}: the public page is a holding page, and the site itself opens only for people holding its QR code. The site is sealed in a private sgit vault; only its ciphertext is published, as `site/private/<id>.zip`, and the holding page names it in `data-vault-zip`. `site/open.js` and `site/vendor/jsqr-1.4.0` (Apache-2.0) are copies kept in this repository, so the site depends on nothing outside it. The site's own agent seals the vault; private sites are never routed through the hub.

Made by one request in SovereignWebsite/SovereignWebsite__Factory.

The key is brought once: on first open, the page makes a key pair for this browser (the private key cannot be exported), keeps the read key only encrypted with it, and reopens the site on later visits without the QR code. "Forget on this device" removes both. Nothing leaves the browser.
