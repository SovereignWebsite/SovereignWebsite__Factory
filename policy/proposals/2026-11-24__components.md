# Components: small repositories a site adds (proposal)

Draft by factory.b@SovereignWebsite.dinis, 24 November 2026, at conductor.b's request, with design.b's comments (00:11 UTC) and security.b's review 031 (00:12 UTC, PASS-WITH-CHANGES) folded in. sites.b can comment later; then decisions.b. Nothing here is built yet.

Source: Dinis, in b.maestro's session, about 00:05 UTC on 24 November 2026 (verbatim, dictated: PrompTugal__News__Website board/guidance/2026-11-24-twins-backups-and-browser-components-verbatim.md): "remember that the whole logic here is to create these very small repos that people can use and can contribute, and that's the power of open source. Everything is small little components. So for example, we can have a component which is local models, and anywhere that wants that to implement it, just add that component to the site, and now we have a local model capability, right? Same way, in a way, with the Gmail capability ..." And on policies: "we need to also can create agent behavior and policies that actually run on this environment, run on the browser ... implementing a kind of S harness on the browser so that we can control this too" ("S harness" is the transcription of SHarness, the secure harness). Browser-side policies are abp@'s proposal; the last section says how components would carry them.

## What a component is

One small public repository, `SovereignWebsite/Component__<Name>` (for example `Component__Local-Models`), that publishes one thing a static site can include: a web component (`<sws-local-model>`), its stylesheet, and a README with one example page. It runs in the visitor's browser only: no server, no cookies, no tracking, and nothing leaves the browser unless the component says so on screen first. Its own Pages site is its demo and its documentation.

## How one is requested and made

1. **Request.** An agent or a site's owner asks for it the way sites are asked for today: a file `requests/<date>__<name>/component.json` in SovereignWebsite__IaC with name, purpose, keeper and the first site that wants it. Org apply creates the repository from a new seed, `seed/component-template` (the site template's checks and signer check, plus a `dist/` build).
2. **Build.** The component's keeper builds it in its repository, on dev, under that repository's own policy (site/policy/abp.json, same floor as every site).
3. **Release.** A release is a tag `vX.Y.Z`. CI builds `dist/<name>.js` and `dist/<name>.css`, computes their SHA-384 hashes, and publishes `releases/vX.Y.Z.json` (file, size, hash, the commit, the signer). A tag never moves; a fix is a new version.
4. **Add to a site.** The site's keeper adds one line to the site's `site/components.json` (name, version, the hash from the release file). The site build refuses a release whose `releases/vX.Y.Z.json` is not signed by a key active in the Factory's team/keys.json; it copies the pinned files into the site (`/components/<name>/vX.Y.Z/`), checks the pinned hash against each file it actually copies (not only against the json), and writes the `<script type="module" src=... integrity="sha384-...">` tag. Files are served from the site itself, not a CDN, so strict CSP (`script-src 'self'`) holds and the site keeps working if the component repository moves or goes.
5. **Update.** The site keeper bumps the version and hash on purpose. Nothing updates on its own.

Two kinds of component, both pinned the same way:
- **Web components**, loaded by the pinned script. Each renders a plain fallback inside its element, so a reader without JavaScript still has something that works.
- **Build-time components**, for anything that must work without JavaScript: the release ships an HTML partial and CSS, which the site build inlines into every page (light DOM, plain links, details menus), with at most a small script for enhancement.

The planned wayfinder is a build-time component (guideline 2b: it must work without JavaScript). `<sws-messages>` is a web component whose fallback is the site's QR or connect link.

## The look (design.b)

A component reads only a fixed set of design tokens, each with a safe fallback: `--sws-bg`, `--sws-surface`, `--sws-fg`, `--sws-muted`, `--sws-border`, `--sws-accent`, `--sws-accent-fg`, `--sws-focus`, `--sws-radius`, `--sws-font-body`, `--sws-font-head`, `--sws-space-1` to `--sws-space-4`. Each of a site's designs maps its own tokens onto these in theme.css, light and dark; custom properties pass into shadow DOM. Only two or three pieces are exposed with `::part()` for a design to restyle (input, button, panel). A component has no colours, fonts or images of its own (icons as inline SVG in currentColor), is sized by its container (container queries, no fixed widths), has 44 px targets and visible focus, and respects prefers-reduced-motion. Before a tag, the demo page must render under five reference themes, light and dark, and be axe clean in all ten. design.b adds this to its guidelines as 2c once Dinis says yes.

## First worked example: local models

`Component__Local-Models` gives a site `<sws-local-model>`: a text box that runs a small open model in the visitor's browser (WebGPU where present, WebAssembly otherwise).
- The runtime library is vendored into the component's `dist/` at a pinned version, with its licence, and hashed like the rest.
- Model weights are large, so they are not copied into each site. The component lists each allowed model in `models.json` with its source address, exact file hashes and licence; it downloads only those. The hash, not the host, makes the weights trustworthy: each file is hashed while it streams and marked usable only when the whole file matches; on a mismatch it is deleted and the reader told; unverified bytes never reach the runtime. Verified files are cached in the browser.
- The site's CSP adds the exact download hosts to `connect-src` (hosts, not file URLs: CSP ignores the path after a redirect, and model hosts redirect to their CDN); a wildcard only where a CDN name really varies. The download card says which host sees the reader's IP address, as on /browser/local/. Mirroring the weights to a host we run is for availability or privacy only, a choice for Dinis, not needed for integrity.
- Nothing is fetched until the reader taps. Before download, a card shows the model name, its licence (linked), the exact size in MB from models.json, the host it comes from, "Runs on this device. What you type stays in your browser.", and Download and Not now. Then a progress bar (x of y MB) with Cancel. On a phone or with Save-Data on, it says so and defaults to Not now; above the phone size limit it says the model will not fit rather than try. Once cached: "Loaded from this device" and a Remove model button, so consent can be undone.
- The text box has a visible label; the answer region is aria-live polite; Send is disabled until ready, with a Stop button while it writes. It is labelled "A small model running on this device", with no avatar or name that suggests a person. Prompts and answers never leave the browser.
- Open questions for the keeper, not decided here: which runtime, which models (licence must allow it), and the size limit for a phone.

## Who keeps what

- Each component has one keeper agent, named in its request and in its repository's policy, with its key published as for sites (site/keys/<name>.json).
- A site's keeper decides which components and versions that site uses.
- factory.b keeps the component seed, the request format and the build step that checks hashes.
- design.b keeps the look: the token contract, the parts a design may restyle, and the ten-theme release check.

## What needs Dinis's yes

- Creating each component repository (as for a new site: a request under a decision record).
- The component seed and the site build step that checks hashes (a change to seed/**/.github/ci, always-ask once 88c6dd7 is in force).
- Any component that sends data off the visitor's browser, or loads code or data from outside the site: each source by name.
- A component's licence when it vendors third-party code or models.

Routine work needs no yes from him: a keeper releasing a new version, or a site keeper moving to a newer pinned version.

## Conditions of approval (block 2026-11-24__block-01, item 53)

Approved as a proposal by decisions.b's panel under Dinis's delegation, with these conditions:
- each component has its own budget before it is built;
- the per-page sandboxing harness goes to security.b for review before it is built;
- the first component built is one a visitor can use on day one (strategy.b proposes the Calendar backup from a digital twin).

## Security review before pinning (security.b, review 031)

- A component's first release, and any later version that adds network access, storage, a new outside source, a worker or WebAssembly, goes to security.b for review before any site pins it. Plain version bumps do not.
- Components never use innerHTML with site or model text, and never read web storage, cookies or keys of the page they sit in. The component seed's README says so, and its CI greps for it.

## Follow-up: policies that run in the browser (abp@PrompTugal.dinis)

abp@'s proposal, v0 (PrompTugal__News__Website board/abp/browser-abp.md and board/abp/browser-manifest.schema.json, on its dev as 92b30d3f8): policies stay data plus one pure function, decide(input, who, policy), bundled for the browser. Each component release ships one signed manifest, `abp.manifest.json` (version tag `browser-abp/v0`, JSON Schema 2020-12, SHA-384 file hashes to match `releases/vX.Y.Z.json`):
- loads: exact origins and hashed files;
- may_send: hosts it may send to (default none);
- storage, and browser permissions it needs;
- needs_owner_yes and never, as in a site's ABP.

Enforced in three layers:
1. CSP, Permissions-Policy and iframe sandbox, generated by the site build from the manifests of the components it pins;
2. one harness per page, not one inside each component (a component cannot police itself): decide() runs in the page's harness, and each component runs in its own sandboxed iframe or worker, reaching fetch, WebSocket, postMessage and storage only through it; deny by default, with a log;
3. a public decision log that identifies no reader.

Observe first, then enforce. Split: factory.b builds the harness and the build step that validates the manifests against the schema and generates the headers; abp@ keeps the policy language, the schema and its fixtures (changed together when the build needs it); security.b reviews each manifest (with its first-release review above). This fits the pinning here: the manifest is one more hashed file in releases/vX.Y.Z.json.
