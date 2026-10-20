# Deploy to Netlify

1. Manual deploy: upload the contents of dist/, or Dailyledger-Deploy.zip (index.html must be at the ZIP root).
2. Git deploy: build `node build.mjs`; publish `dist`.
3. Attach `dailyledger.store`, configure your preferred www redirect and check HTTPS.
4. Check `/`, `/pricing`, `/contact`, `/404`, `/sitemap.xml`, `/robots.txt`, `/llms.txt`.
5. Submit `https://dailyledger.store/sitemap.xml` to the marketing Search Console property.
6. Publish the separate app-sitemap.xml on app.dailyledger.store before submitting it for the app property; it contains the real login and signup URLs.

Domain and canonical tags are already set to https://dailyledger.store. There is no contact form. The mailto address is dailyledger001@gmail.com.

Deploy folder contains no source templates, tests, private review notes, reports, design runtime, screenshots or backup ZIPs.
