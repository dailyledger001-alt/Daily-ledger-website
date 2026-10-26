# Dailyledger — deploy guide

## Which folder to deploy

**Upload only `dist/`**, or drag `Dailyledger-Deploy.zip` into Netlify. This is the clean production website for **https://dailyledger.store**. Its index.html is at the root; no Node.js or build installation is needed for a manual upload.

For a Git-connected Netlify deployment, select this project root. `netlify.toml` already uses build command `node build.mjs` and publish directory `dist`.

For Vercel, import this project root with Framework Preset **Other**. The root `vercel.json` sets the build command, `dist` output and clean URLs. If deploying the already-built `dist/` folder (or the extracted deployment ZIP), keep its included `vercel.json` at the upload root and leave build/output overrides empty. It enables `/pricing`, `/features` and all other extensionless links. Netlify's `_redirects` does not configure Vercel. Redeploy after updating configuration; existing deployments do not change automatically.

## Folder map

- `dist/` — deploy this folder. Includes generated HTML, assets, sitemap.xml, robots.txt, llms.txt, app-sitemap.xml, manifest, icons, redirects and manual-deploy headers.
- `Daily Ledger 2 Ring v2/` — direct-file preview. Open `Daily Ledger 2 Ring v2.dc.html` or index.html. Keep this copy for double-click viewing; use dist for hosting.
- `src/` — editable page templates, shared components and assets.
- `data/` — shared plans, domain, app links, business name and contact email.
- `public/` — static files copied to dist.
- `tests/` — regression, SEO and local loading checks.
- `docs/` — reports, review notes and deployment details; not published.
- `Dailyledger-Backup-2026-10-20.zip` — verified recoverable backup of the old design export, previous packages/screenshots and removed unused assets. Do not deploy it.

The obsolete artifacts and design-reference folders, unused image files and design runtime support.js were removed after this backup was verified. Source folders are needed for future edits, so they were retained.

## Build and check

Requires Node.js 24. No npm dependencies or install step.

```sh
npm test
node preview.mjs
```

Preview: http://127.0.0.1:4173. With it running, `node tests/loading.test.mjs` refreshes docs/LOADING-REPORT.md. Every build updates dist and the direct-file copy.

## Domain and account URLs

Marketing: https://dailyledger.store
App login: https://app.dailyledger.store/login
App signup: https://app.dailyledger.store/signup
Contact: dailyledger001@gmail.com

`sitemap.xml` contains the 14 indexable marketing pages. `404` and `thank-you` are noindex and excluded. Login/signup stay on their actual app host; their two URLs are in the separate `app-sitemap.xml`, which should be published on the app host and submitted for that app property. They are also listed in llms.txt. Do not mix hosts into the marketing sitemap or invent marketing authentication pages. The account sidecar file is not advertised as the marketing sitemap in robots.txt.

## Before going live

Attach dailyledger.store and its www alias in Netlify, confirm HTTPS, and submit https://dailyledger.store/sitemap.xml in Search Console. DNS, deployment and Search Console submission were not performed by this local build.

Primary fonts are local WOFF2 with swap rendering and a preload; the footer logo is lazy-loaded. Contact is email-only and opens the visitor’s email app; there is no form submission service. Pro trial copy states credit card required; Free needs no card. All plan buttons, including Lifetime, go to signup.

Local SEO validation checks unique titles/descriptions, the canonical/social domain, JSON-LD entities, sitemap entries, robots.txt and llms.txt. Actual indexing, rich results and production Core Web Vitals require checks after deployment. The plan comparison uses the app screenshot supplied on 26 October 2026, with client-requested $19.99 Pro and $99.99 Lifetime prices and increased Lifetime email allowances of 20 rules and 300 reminders per month. Update the app configuration to match these marketing figures before launch. Outstanding age/refund/legal details still require owner confirmation; no address or personal details were invented.
