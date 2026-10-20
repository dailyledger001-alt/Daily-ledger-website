# Dailyledger code and link review

## Scope
Read-only review of the static build, shared JavaScript, page templates, deployment configuration and tests. Expected workload: static marketing pages served by Netlify; no backend writes or contact-form submission.

## Checks passed
- 1,180 link/asset references inspected across 16 hosted pages.
- 16 local page routes and all referenced assets loaded successfully; 17 direct-file HTML entries passed filesystem URL checks.
- App login, signup and forgot-password URLs returned HTTP 200.
- npm test passed: internal links/anchors, exact app URLs, active nav, metadata, schema, sitemap files, robots.txt, llms.txt, email-only contact and FAQ behavior.
- Node syntax checks passed for build.mjs, preview.mjs and site.js.

## Must fix
1. Live marketing routes return 404. https://dailyledger.store/ returns 200, but /about, /acceptable-use, /ai-assistant, /contact, /cookies, /faq, /features, /how-it-works, /pricing, /privacy, /refunds, /security and /terms all returned HTTP 404. The local package contains these pages. Publish the current dist folder/Deploy ZIP to the marketing domain and verify Netlify's publish directory. Until that happens, live navigation to these pages is broken.
2. Public legal pages still contain owner-dependent fields: [MINIMUM AGE] in Terms and Privacy; [REFUND WINDOW IN DAYS] twice in Refunds. Provide the actual business decisions before replacing these fields. Values were not invented.

## Should fix
3. Five paragraphs are direct children of ul rather than following a closed list: four in src/pages/privacy.html and one in src/pages/acceptable-use.html (all on physical line 3). Move each paragraph outside its list. Current link tests do not detect this HTML structure problem; add a targeted guard when fixing it. Invalid list markup can affect assistive-technology reading and document structure.

## Verdict
Resolve the live deployment and remaining content/HTML findings before calling the production website fully verified. This review changed no application source or deployment state.

## Not checked
Production Core Web Vitals, authenticated app flows, real inbox delivery, live Admin settings or legal accuracy. Successful GET responses do not verify account creation or billing.
