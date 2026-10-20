import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, extname, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), 'dist');
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.webp':'image/webp','.ico':'image/x-icon','.woff2':'font/woff2','.xml':'application/xml','.txt':'text/plain','.webmanifest':'application/manifest+json'};
createServer((req, res) => {
  try {
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(405, {'Content-Type':'text/plain; charset=utf-8', Allow:'GET, HEAD'});
      res.end('Local preview does not send messages. Deploy to Netlify to enable this form.');
      return;
    }
    const url = new URL(req.url, 'http://localhost');
    let path = decodeURIComponent(url.pathname).replace(/\/+$/, '') || '/index';
    let file = resolve(root, '.' + path);
    if (!file.startsWith(root + sep)) { res.writeHead(403); res.end(); return; }
    if (!extname(file)) file += '.html';
    const found = existsSync(file) && statSync(file).isFile();
    if (!found) file = resolve(root, '404.html');
    res.writeHead(found ? 200 : 404, {'Content-Type': types[extname(file)] || 'application/octet-stream'});
    res.end(readFileSync(file));
  } catch { res.writeHead(400); res.end('Bad request'); }
}).listen(4173, '127.0.0.1', () => console.log('Local: http://127.0.0.1:4173'));
