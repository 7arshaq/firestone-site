// Preview the GitHub Pages demo locally: serves dist-pages/ under /firestone-site/ the way Pages does
// (folders redirect to a trailing slash and serve index.html; unknown paths get 404.html).
//   npm run build:pages && npm run preview:pages   ->  http://localhost:4000/firestone-site/
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist-pages');
const BASE = '/firestone-site';
const PORT = Number(process.env.PORT) || 4000;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.xml': 'application/xml', '.txt': 'text/plain',
};

function notFound(res) {
  res.writeHead(404, { 'Content-Type': TYPES['.html'] });
  fs.createReadStream(path.join(ROOT, '404.html')).pipe(res);
}

http.createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (url !== BASE && !url.startsWith(BASE + '/')) return notFound(res);
  let file = path.join(ROOT, url.slice(BASE.length));
  if (!file.startsWith(ROOT)) return notFound(res);
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    if (!url.endsWith('/')) { res.writeHead(301, { Location: url + '/' }); return res.end(); }
    file = path.join(file, 'index.html');
  }
  if (!fs.existsSync(file)) return notFound(res);
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`GitHub Pages preview: http://localhost:${PORT}${BASE}/`));
