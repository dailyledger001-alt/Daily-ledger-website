import { readFileSync, writeFileSync, mkdirSync, readdirSync, cpSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

process.chdir(dirname(fileURLToPath(import.meta.url)));
const read = p => readFileSync(p, 'utf8');
const plans = JSON.parse(read('data/plans.json'));
const site = JSON.parse(read('data/site.json'));
const partials = Object.fromEntries(readdirSync('src/partials').filter(f => f.endsWith('.html')).map(f => [f.slice(0, -5), read(join('src/partials', f))]));
const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function render(source, stack = []) {
  source = source.replace(/<!--\s*include:([\w-]+)\s*-->/g, (_, name) => {
    if (!(name in partials)) throw new Error(`Missing partial ${name}`);
    if (stack.includes(name)) throw new Error(`Circular include: ${[...stack, name].join(' → ')}`);
    return render(partials[name], [...stack, name]);
  });
  return source.replace(/\{\{\s*(plans|site)\.([\w.]+)\s*\}\}/g, (_, root, path) => {
    const value = path.split('.').reduce((o, k) => o?.[k], root === 'plans' ? plans : site);
    if (value == null || typeof value === 'object') throw new Error(`Unknown value ${root}.${path}`);
    return escape(value);
  });
}
// Only the generated output in this project is removed.
rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });
cpSync('public', 'dist', { recursive: true });
cpSync('src/assets', 'dist/assets', { recursive: true });
const pages = readdirSync('src/pages').filter(f => f.endsWith('.html'));
for (const file of pages) {
  const slug = file.slice(0, -5);
  let html = render(read(join('src/pages', file))).replace(/<a\b[^>]*\bdata-nav="([\w-]+)"[^>]*>/g, (tag, nav) => nav === slug ? tag.replace('data-nav=', 'aria-current="page" data-nav=') : tag);
  if (slug === 'faq') {
    const entries = [...html.matchAll(/<button[^>]*data-faq[^>]*>([\s\S]*?)<\/button>\s*<\/h3>\s*<div[^>]*class="faq-answer"[^>]*>([\s\S]*?)<\/div>/g)];
    const plain = s => s.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
    const schema = {'@context':'https://schema.org','@type':'FAQPage',mainEntity:entries.map(([,q,a]) => ({'@type':'Question',name:plain(q).replace(/\s*\+$/, ''),acceptedAnswer:{'@type':'Answer',text:plain(a)}}))};
    html = html.replace('</head>', `<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script></head>`);
  }
  const canonical = site.siteUrl + (slug === 'index' ? '/' : '/' + slug);
  const name = html.match(/<title>(.*?)<\/title>/)[1].replace(/ \| Daily Ledger$/, '').replace(/&amp;/g, '&');
  const organization = {'@type':'Organization','@id':site.siteUrl+'/#organization',name:site.businessName,url:site.siteUrl,email:site.supportEmail,logo:site.siteUrl+'/assets/img/dl-logo-full.webp',contactPoint:{'@type':'ContactPoint',contactType:'customer support',email:site.supportEmail}};
  const webpage = {'@type':slug === 'contact' ? 'ContactPage' : slug === 'about' ? 'AboutPage' : 'WebPage','@id':canonical+'#webpage',url:canonical,name,inLanguage:'en',isPartOf:{'@id':site.siteUrl+'/#website'},publisher:{'@id':organization['@id']}};
  const graph = [organization,{'@type':'WebSite','@id':site.siteUrl+'/#website',url:site.siteUrl,name:'Daily Ledger',publisher:{'@id':organization['@id']}},webpage];
  if (slug !== 'index' && !['404','thank-you'].includes(slug)) graph.push({'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:site.siteUrl+'/'},{'@type':'ListItem',position:2,name,item:canonical}]});
  if (slug === 'index') graph.push({'@type':'SoftwareApplication',name:'Daily Ledger',url:site.appUrl,applicationCategory:'LifestyleApplication',operatingSystem:'Web browser',offers:{'@type':'Offer',price:plans.free.price,priceCurrency:'USD',url:site.signupUrl},description:'A personal planner for tasks, habits, goals, money, workouts, meals, reminders and reports.'});
  html = html.replace('</head>', `<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@graph':graph}).replace(/</g,'\\u003c')}</script></head>`);
  if (/\{\{|<!--\s*include:/.test(html)) throw new Error(`Unresolved template in ${file}`);
  writeFileSync(join('dist', file), html);
}
writeFileSync('dist/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${site.siteUrl}/sitemap.xml\n`);
writeFileSync('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<!-- Login and signup use ${site.appUrl}. Their URLs are in app-sitemap.xml, to publish on the app host. -->\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.filter(f => !['404.html','thank-you.html'].includes(f)).map(f => `  <url><loc>${site.siteUrl}${f === 'index.html' ? '/' : '/' + f.slice(0,-5)}</loc></url>`).join('\n')}\n</urlset>\n`);
writeFileSync('dist/app-sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<!-- Account routes: publish this file on ${site.appUrl}, alongside the app. -->\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${site.loginUrl}</loc></url>\n  <url><loc>${site.signupUrl}</loc></url>\n</urlset>\n`);
const publicPages = pages.filter(file => !['404.html','thank-you.html'].includes(file));
const pageLinks = publicPages.map(file => {
  const title = read(join('dist',file)).match(/<title>(.*?)<\/title>/)[1].replace(/ \| Daily Ledger$/, '').replace(/&amp;/g, '&');
  return `- [${title}](${site.siteUrl}${file === 'index.html' ? '/' : '/' + file.slice(0,-5)})`;
}).join('\n');
writeFileSync('dist/llms.txt', `# ${site.businessName}\n\n> Daily Ledger is a personal planner for tasks, habits, goals, money, workouts, meals, reminders and reports.\n\n## Official website\n\n${site.siteUrl}\n\n## Public pages\n\n${pageLinks}\n\n## Account access\n\n- [Login](${site.loginUrl}): Sign in to the Daily Ledger app.\n- [Sign up](${site.signupUrl}): Create a Daily Ledger account.\n- [Forgot password](${site.forgotPasswordUrl}): Recover account access.\n\n## Plans and AI\n\nThe Free plan does not require a credit card. The ${plans.trialDays}-day Pro trial requires a credit card. The AI assistant is a Pro/Lifetime feature; it proposes actions and saves nothing until the user confirms. Current prices and allowances are on the Pricing page and in the app.\n\n## Contact\n\n${site.supportEmail}\n\n## Sitemap\n\n${site.siteUrl}/sitemap.xml\n`);
// Keep the user's existing HTML entry point usable by double-click, without a server.
const localFolder = 'Daily Ledger 2 Ring v2';
const localHome = 'Daily Ledger 2 Ring v2.dc.html';
const oldEntry = join(localFolder, localHome);
mkdirSync(localFolder, { recursive: true });
cpSync('dist/assets', join(localFolder, 'assets'), { recursive: true });
for (const file of readdirSync('dist').filter(f => !f.endsWith('.html') && f !== 'assets')) {
  cpSync(join('dist', file), join(localFolder, file));
}
function localLink(url) {
  const [, pathname, suffix = ''] = url.match(/^([^?#]*)(.*)$/);
  if (!pathname || pathname === '/') return encodeURIComponent(localHome) + suffix;
  const name = pathname.slice(1);
  return name + (pages.includes(name + '.html') ? '.html' : '') + suffix;
}
for (const file of pages) {
  const html = read(join('dist', file)).replace(/\b(href|src|action)="(\/(?!\/)[^"]*)"/g, (_, attr, url) => `${attr}="${localLink(url)}"`);
  writeFileSync(join(localFolder, file), html);
  if (file === 'index.html') writeFileSync(oldEntry, html);
}
const manifest = read(join(localFolder, 'site.webmanifest')).replace(/"\/icon-/g, '"icon-').replace(/"start_url":\s*"\/"/, `"start_url": "${encodeURIComponent(localHome)}"`);
writeFileSync(join(localFolder, 'site.webmanifest'), manifest);
console.log(`Built ${pages.length} hosted pages into dist/ and file-friendly pages into ${localFolder}/`);
