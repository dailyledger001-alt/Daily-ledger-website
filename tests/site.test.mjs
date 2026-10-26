import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const site = JSON.parse(readFileSync('data/site.json'));
assert.equal(site.signupUrl,'https://app.dailyledger.store/signup');
assert.equal(site.loginUrl,'https://app.dailyledger.store/login');
const pages = readdirSync('dist').filter(f => f.endsWith('.html'));
const vercel = JSON.parse(readFileSync('vercel.json', 'utf8'));
const staticVercel = JSON.parse(readFileSync('dist/vercel.json', 'utf8'));
assert.equal(vercel.buildCommand, 'node build.mjs');
assert.equal(vercel.outputDirectory, 'dist');
for (const config of [vercel, staticVercel]) {
  assert.equal(config.cleanUrls, true, 'Vercel must resolve /pricing to pricing.html');
  assert.equal(config.trailingSlash, false);
  assert(!config.rewrites, 'Do not mask missing pages with a homepage fallback');
}
const sourcePages = readdirSync('src/pages').map(f => readFileSync(join('src/pages', f), 'utf8'));
const partials = readdirSync('src/partials').map(f => readFileSync(join('src/partials', f), 'utf8'));
const titles = new Set(), descriptions = new Set();
assert.equal(pages.length, 16);
for (const source of [...sourcePages,...partials]) assert(!source.includes(site.appUrl), 'App links must come from site.json');
for (const page of pages) {
  const html = readFileSync(join('dist', page), 'utf8');
  const slug = page.slice(0,-5);
  assert(!/\{\{|<x-dc|support\.js|\?plan=|\?trial=|USDT|Trusted by 2|4\.9 average/i.test(html), `${page}: old runtime, placeholder or misleading content`);
  assert.equal((html.match(/<h1\b/g) || []).length,1,`${page}: one h1`);
  const title = html.match(/<title>(.*?)<\/title>/)[1];
  const desc = html.match(/name="description" content="([^"]+)"/)[1];
  assert(title.length < 60 && !titles.has(title),`${page}: title length and uniqueness`); titles.add(title);
  assert(desc.length < 160 && !descriptions.has(desc),`${page}: description length and uniqueness`); descriptions.add(desc);
  assert(html.includes('<meta property="og:image"') && html.includes('<meta name="twitter:image"') && html.includes('rel="canonical"'),`${page}: SEO`);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(ids.length,new Set(ids).size,`${page}: duplicate IDs`);
  const desktop = html.match(/<nav class="desktop-nav"[^>]*>(.*?)<\/nav>/s)[1];
  const active = [...desktop.matchAll(/<a[^>]+aria-current="page"[^>]*data-nav="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(active,['index','features','ai-assistant','pricing','faq'].includes(slug) ? [slug] : [],`${page}: active nav`);
  const mobile = html.match(/<nav aria-label="Mobile navigation">(.*?)<\/nav>/s)[1];
  const mobileActive = [...mobile.matchAll(/<a[^>]+aria-current="page"[^>]*data-nav="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(mobileActive,active,`${page}: mobile active nav`);
  const links = [...html.matchAll(/\b(?:href|src|action)="([^"]+)"/g)].map(m => m[1]);
  for (const link of links) {
    if (/\/(signup|login)(?:[/?#]|$)/i.test(link)) assert([site.signupUrl,site.loginUrl].includes(link),`${page}: exact app login/signup URL`);
    assert(!/vercel\.app|railway\.app|localhost|javascript:|^#$/.test(link),`${page}: disallowed ${link}`);
    assert(!/^\/(login|signup)(?:[?#/]|$)/.test(link),`${page}: relative app link`);
    if (link.startsWith('/')) {
      const [pathname, hash] = link.split('#');
      const target = pathname === '/' ? 'index.html' : pathname.slice(1) + (pathname.includes('.') ? '' : '.html');
      assert(existsSync(join('dist',target)),`${page}: missing ${link}`);
      if (hash && target.endsWith('.html')) assert(readFileSync(join('dist',target),'utf8').includes(`id="${hash}"`),`${page}: missing anchor ${link}`);
    }
    if (link.startsWith('#')) assert(ids.includes(link.slice(1)),`${page}: local anchor ${link}`);
  }
  const count = url => links.filter(link => link === url).length;
  assert(count(site.signupUrl) && count(site.loginUrl),`${page}: missing app journey`);
  assert(!html.includes('Contact us for Lifetime'), `${page}: Lifetime uses signup`);
  assert(html.includes('Credit card required'), `${page}: Pro trial card requirement`);
  assert(!/no-card|trial with no card|trial also needs no card|No card needed to start the trial/.test(html), `${page}: no outdated no-card trial claim`);
  const lifetimeButtons = [...html.matchAll(/<a\b([^>]*)>Get Lifetime[\s\S]*?<\/a>/g)];
  if (['index','pricing'].includes(slug)) assert.equal(lifetimeButtons.length, 1, `${page}: Lifetime signup button`);
  for (const [,attributes] of lifetimeButtons) assert(attributes.includes(`href="${site.signupUrl}"`), `${page}: Lifetime destination`);
  console.log(`${page.padEnd(22)} signup=${count(site.signupUrl)} login=${count(site.loginUrl)}`);
  for (const [,id] of html.matchAll(/aria-controls="([^"]+)"/g)) assert(ids.includes(id),`${page}: missing controlled element`);
  const legal = ['terms','privacy','cookies','refunds','acceptable-use'].includes(slug);
  if (legal) {
    assert(html.includes('<time datetime="2026-10-20">20 October 2026</time>'), `${page}: effective date`);
    assert(!html.includes('[EFFECTIVE DATE]'), `${page}: no date placeholder`);
    assert(html.includes('class="policy-toc"'), `${page}: responsive contents panel`);
  }
  const utility = ['404','thank-you'].includes(slug);
  if (!legal && !utility) assert(html.indexOf('id="shared-faq"') < html.indexOf('id="cta-heading"'),`${page}: FAQ before CTA`);
  else assert(!html.includes('id="shared-faq"'),`${page}: no marketing FAQ on policy/utility`);
  if (slug === '404') assert(!html.includes('id="cta-heading"'), '404: footer without CTA band');
  else assert(html.indexOf('id="cta-heading"') < html.indexOf('<footer'),`${page}: CTA before footer`);
  assert.equal(html.includes('"@type":"FAQPage"'),slug === 'faq');
  const schemas = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map(m => JSON.parse(m[1]));
  const graph = schemas.find(schema => schema['@graph'])?.['@graph'];
  assert(graph?.some(node => node['@type'] === 'Organization' && node.email === 'dailyledger001@gmail.com'), `${page}: organization email schema`);
  assert(graph.some(node => node['@id']?.endsWith('#webpage')), `${page}: WebPage schema`);
  assert(!/support@dailyledger\.store|privacy@dailyledger\.store|security@dailyledger\.store/.test(html), `${page}: old contact email`);
  assert(!/fonts\.googleapis|fonts\.gstatic/.test(html), `${page}: fonts must be self-hosted`);
  if (slug === 'faq') {
    const schema = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
    assert(schema.mainEntity.length >= 25);
    assert(schema.mainEntity.every(q => q.name && q.acceptedAnswer.text));
  }
}
const contact = readFileSync('dist/contact.html','utf8');
const home = readFileSync('dist/index.html','utf8');
assert.equal((home.match(/class="stat-icon"/g) || []).length,4,'Four real SVG icons in the homepage stats cards');
assert(!/width:(14px;height:10px|11px;height:14px);border:1\.8px/.test(home),'No empty email/report icon placeholders');
assert(!/<form\b|<input\b|<textarea\b|data-netlify=/.test(contact), 'Contact page is email-only');
assert(contact.includes(`href="mailto:${site.supportEmail}"`) && contact.includes('Email us'), 'Contact email address and action');
const terms = readFileSync('dist/terms.html','utf8');
assert.equal((terms.match(/<h2 id="policy-/g) || []).length,24,'All 24 Terms sections retained');
assert(terms.includes(site.businessName) && terms.includes('Online checkout is not yet available'));
for (const file of pages) {
  const html = readFileSync(join('dist', file), 'utf8');
  assert(!/\[(COMPANY LEGAL NAME|REGISTERED ADDRESS|CITY, COUNTRY|COUNTRY \/ STATE FOR GOVERNING LAW|COURT LOCATION)\]/.test(html), `${file}: no company/address placeholders`);
}
console.log('All 16 pages passed structure, navigation, links, metadata, FAQ and email-contact checks.');

const localFolder = resolve('Daily Ledger 2 Ring v2');
const localHome = 'Daily Ledger 2 Ring v2.dc.html';
for (const file of [...pages, localHome]) {
  const html = readFileSync(join(localFolder, file), 'utf8');
  assert(!html.includes('<x-dc>') && !html.includes('support.js'), `${file}: old export replaced`);
  const fileUrl = pathToFileURL(join(localFolder, file));
  for (const [,link] of html.matchAll(/\b(?:href|src|action)="([^"]+)"/g)) {
    if (/^(https?:|mailto:)/.test(link)) continue;
    assert(!link.startsWith('/'), `${file}: root-relative link breaks file:// ${link}`);
    const url = new URL(link, fileUrl);
    const target = fileURLToPath(url);
    assert(existsSync(target),`${file}: missing local target ${link}`);
    assert.equal(dirname(target).startsWith(localFolder),true,`${file}: link escapes website folder`);
    if (url.hash && target.endsWith('.html')) assert(readFileSync(target,'utf8').includes(`id="${url.hash.slice(1)}"`),`${file}: missing anchor ${link}`);
  }
  const expected = file === localHome ? 'index' : file.slice(0,-5);
  const desktop = html.match(/<nav class="desktop-nav"[^>]*>(.*?)<\/nav>/s)[1];
  const active = [...desktop.matchAll(/aria-current="page" data-nav="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(active,['index','features','ai-assistant','pricing','faq'].includes(expected) ? [expected] : [],`${file}: local active nav`);
}
assert.equal(readFileSync(join(localFolder,localHome),'utf8'),readFileSync(join(localFolder,'index.html'),'utf8'));
console.log('All 17 local HTML files passed file:// link, anchor, asset and active-navbar checks.');

// Client-confirmed prices and app screenshot allowances must match on Home and Pricing.
const plans = JSON.parse(readFileSync('data/plans.json', 'utf8'));
assert.equal(plans.pro.price, 19.99);
assert.equal(plans.lifetime.price, 99.99);
assert.equal(plans.free.emailRules, 0);
assert.equal(plans.free.reminderEmails, 0);
for (const file of ['index.html', 'pricing.html']) {
  const html = readFileSync(join('dist', file), 'utf8');
  assert(html.includes('$19.99') && html.includes('$99.99'), `${file}: updated prices`);
  assert(!/Confirm in app|Subject to plan|pending confirmation against/.test(html), `${file}: no obsolete plan placeholders`);
  const table = html.match(/<table>[\s\S]*?<\/table>/)[0];
  assert.equal((table.match(/<tr>/g) || []).length, 14, `${file}: all 13 app comparison rows`);
  for (const label of ['Weekly meal generator', 'Repeating tasks', 'Bills, budgets', 'Current-month CSV only']) assert(table.includes(label));
  assert(table.includes('<td>0</td><td>10</td><td>20</td>'));
  assert(table.includes('<td>0</td><td>150</td><td>300</td>'));
  assert(table.includes('<td>Not included</td><td>100</td><td>60</td>'));
}
console.log('Client plan prices, exclusions and all 13 comparison rows passed.');
