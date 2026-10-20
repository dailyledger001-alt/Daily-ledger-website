import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const base = 'http://127.0.0.1:4173';
const rows = [];
for (const file of readdirSync('dist').filter(file => file.endsWith('.html'))) {
  const path = file === 'index.html' ? '/' : '/' + file.slice(0,-5);
  const started = performance.now();
  const response = await fetch(base + path);
  assert.equal(response.status,200, path);
  const html = await response.text();
  const elapsed = performance.now() - started;
  const assets = new Set([...html.matchAll(/(?:src|href)="(\/assets\/[^"#]+)"/g)].map(m => m[1]));
  for (const asset of [...assets]) {
    if (asset.endsWith('.css')) {
      const css = readFileSync(join('dist',asset.slice(1)),'utf8');
      for (const [,url] of css.matchAll(/url\(['"]?([^'"\)]+)['"]?\)/g)) {
        if (/^(data:|https?:)/.test(url)) continue;
        const pathname = new URL(url,base + asset).pathname;
        assets.add(pathname);
      }
    }
  }
  let assetBytes = 0;
  for (const asset of assets) {
    const result = await fetch(base + asset);
    assert.equal(result.status,200,`${file}: missing asset ${asset}`);
    assetBytes += statSync(join('dist', asset.slice(1))).size;
  }
  rows.push({page:path,htmlKB:+(Buffer.byteLength(html)/1024).toFixed(1),allReferencedAssetsKB:+(assetBytes/1024).toFixed(1),localHtmlResponseMs:+elapsed.toFixed(1),assets:assets.size});
}
const missing = await fetch(base+'/this-page-does-not-exist');
assert.equal(missing.status,404);
assert((await missing.text()).includes('space-scene'));
const report = '# Loading checks\n\nAll 16 routes and their referenced CSS, JavaScript, images and fonts returned HTTP 200. Unknown routes returned the custom space-themed 404 with status 404.\n\n'+
  '| Page | HTML KB | All referenced assets KB | Assets | Local HTML response ms |\n|---|---:|---:|---:|---:|\n'+
  rows.map(r=>`| ${r.page} | ${r.htmlKB} | ${r.allReferencedAssetsKB} | ${r.assets} | ${r.localHtmlResponseMs} |`).join('\n')+
  '\n\nAsset totals conservatively include every font declared by the stylesheets and below-the-fold images, plus backgrounds declared for other pages; browsers request only the font faces actually used and defer lazy images. Measurements use the local preview without compression and do not represent mobile network speed, rendering time, Lighthouse, or production Core Web Vitals. Run Lighthouse/PageSpeed against the deployed domain for those measurements.\n';
mkdirSync('docs', { recursive: true });
writeFileSync('docs/LOADING-REPORT.md',report);
console.table(rows);
console.log('All page and asset loading checks passed.');
