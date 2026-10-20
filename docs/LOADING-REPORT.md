# Loading checks

All 16 routes and their referenced CSS, JavaScript, images and fonts returned HTTP 200. Unknown routes returned the custom space-themed 404 with status 404.

| Page | HTML KB | All referenced assets KB | Assets | Local HTML response ms |
|---|---:|---:|---:|---:|
| /404 | 11.5 | 155.6 | 8 | 147.8 |
| /about | 16.3 | 133.9 | 7 | 6.4 |
| /acceptable-use | 14.6 | 133.9 | 7 | 4.1 |
| /ai-assistant | 19.6 | 133.9 | 7 | 3.5 |
| /contact | 17 | 133.9 | 7 | 3.4 |
| /cookies | 15.4 | 133.9 | 7 | 3.3 |
| /faq | 36.3 | 133.9 | 7 | 3.7 |
| /features | 36 | 133.9 | 7 | 2.6 |
| /how-it-works | 20.4 | 133.9 | 7 | 3 |
| / | 100.9 | 135.5 | 8 | 4.4 |
| /pricing | 21 | 133.9 | 7 | 3 |
| /privacy | 23.6 | 133.9 | 7 | 3.5 |
| /refunds | 15.8 | 133.9 | 7 | 3.6 |
| /security | 19.5 | 133.9 | 7 | 5 |
| /terms | 30 | 133.9 | 7 | 4.4 |
| /thank-you | 12 | 133.9 | 7 | 3.8 |

Asset totals conservatively include every font declared by the stylesheets and below-the-fold images, plus backgrounds declared for other pages; browsers request only the font faces actually used and defer lazy images. Measurements use the local preview without compression and do not represent mobile network speed, rendering time, Lighthouse, or production Core Web Vitals. Run Lighthouse/PageSpeed against the deployed domain for those measurements.
