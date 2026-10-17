// Firestone site server — zero dependencies.
//  - serves dist/ with clean URLs (same paths as the original site)
//  - /api/forms       quote, contact and career submissions (+ CV upload)
//  - /api/settings    public office/contact details (used for live updates)
//  - /api/admin/*     password-protected admin: offices + map pins, contacts,
//                     socials, form inbox. Saving settings rebuilds the site.
// Usage: node server.mjs [--watch]   (PORT and ADMIN_PASSWORD env vars optional)
import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { execFile, execFileSync } from 'node:child_process';
import { blocksToMd, slugify } from './public/js/md.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, 'dist');
const DATA = path.join(ROOT, 'data');
const UPLOADS = path.join(DATA, 'uploads');
const MEDIA = path.join(DATA, 'media');
const PORT = Number(process.env.PORT) || 3000;
fs.mkdirSync(UPLOADS, { recursive: true });
fs.mkdirSync(MEDIA, { recursive: true });

// builds run in their own process so they always use the current templates
const BUILD = [path.join(ROOT, 'build/build.mjs')];
if (!fs.existsSync(path.join(DIST, 'index.html'))) execFileSync(process.execPath, BUILD, { cwd: ROOT, stdio: 'inherit' });

// ---------------------------------------------------------------- storage helpers
const readJSON = (f, fallback) => { try { return JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8')); } catch (e) { return fallback; } };
async function writeJSON(f, data) {
  const file = path.join(DATA, f), tmp = file + '.tmp';
  await fsp.writeFile(tmp, JSON.stringify(data, null, 2));
  await fsp.rename(tmp, file);
}

// ---------------------------------------------------------------- admin password (scrypt)
function hashPassword(pw, salt = crypto.randomBytes(16).toString('hex')) {
  return { salt, hash: crypto.scryptSync(pw, salt, 64).toString('hex') };
}
function adminRecord() {
  let rec = readJSON('admin.json', null);
  if (!rec) {
    // no shared default: without ADMIN_PASSWORD a random one-time password is generated and printed once
    const initial = process.env.ADMIN_PASSWORD || crypto.randomBytes(9).toString('base64url');
    rec = { ...hashPassword(initial), mustChange: !process.env.ADMIN_PASSWORD };
    fs.writeFileSync(path.join(DATA, 'admin.json'), JSON.stringify(rec, null, 2));
    console.log(process.env.ADMIN_PASSWORD
      ? 'Admin password set from ADMIN_PASSWORD.'
      : `Admin created. One-time password: ${initial}  (shown only now; change it after your first login)`);
  }
  return rec;
}
adminRecord();
const sessions = new Map(); // token -> expiry
const SESSION_MS = 12 * 60 * 60 * 1000;

// ---------------------------------------------------------------- rate limiting
const hits = new Map();
function limited(key, max, windowMs) {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  arr.push(now); hits.set(key, arr);
  return arr.length > max;
}

// ---------------------------------------------------------------- http helpers
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.pdf': 'application/pdf' };
const SEC = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'X-Frame-Options': 'SAMEORIGIN', 'Permissions-Policy': 'camera=(), microphone=(), geolocation=()' };

function send(res, status, body, headers = {}) {
  res.writeHead(status, { ...SEC, ...headers });
  res.end(body);
}
const json = (res, status, obj, headers = {}) => send(res, status, JSON.stringify(obj), { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > limit) { reject(Object.assign(new Error('too large'), { status: 413 })); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); } catch (e) { reject(Object.assign(new Error('bad json'), { status: 400 })); } });
    req.on('error', reject);
  });
}
const ipOf = (req) => (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || '';
const cookies = (req) => Object.fromEntries((req.headers.cookie || '').split(';').map((c) => c.trim().split('=')).filter((p) => p[0]).map(([k, ...v]) => [k, decodeURIComponent(v.join('='))]));
function authed(req) {
  const tok = cookies(req).fs_admin || (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const exp = tok && sessions.get(tok);
  if (!exp || exp < Date.now()) { if (tok) sessions.delete(tok); return false; }
  return tok;
}

// ---------------------------------------------------------------- static files
async function serveStatic(req, res, urlPath) {
  let p = decodeURIComponent(urlPath.split('?')[0]);
  if (p.includes('\0')) return send(res, 400, 'Bad request');
  let file = path.normalize(path.join(DIST, p));
  if (!file.startsWith(DIST)) return send(res, 403, 'Forbidden');
  let st = await fsp.stat(file).catch(() => null);
  if (st?.isDirectory()) {
    // canonical URLs have no trailing slash (matches the original site); /admin/ is the exception
    if (p.length > 1 && p.endsWith('/') && !p.startsWith('/admin')) return send(res, 301, '', { Location: p.replace(/\/+$/, '') });
    file = path.join(file, 'index.html'); st = await fsp.stat(file).catch(() => null);
  }
  if (!st && !path.extname(file)) { const f2 = path.join(DIST, p, 'index.html'); st = await fsp.stat(f2).catch(() => null); if (st) file = f2; }
  if (!st) {
    const nf = await fsp.readFile(path.join(DIST, '404.html')).catch(() => 'Not found');
    return send(res, 404, nf, { 'Content-Type': TYPES['.html'] });
  }
  const ext = path.extname(file).toLowerCase();
  const type = TYPES[ext] || 'application/octet-stream';
  const etag = `"${st.size.toString(16)}-${st.mtimeMs.toString(16)}"`;
  // HTML, JS, CSS and JSON revalidate by ETag so deploys show up immediately
  const cache = ['.html', '.json', '.js', '.css', '.xml', '.webmanifest'].includes(ext) ? 'no-cache' : p.startsWith('/vendor/') ? 'public, max-age=604800' : 'public, max-age=86400';
  if (req.headers['if-none-match'] === etag) return send(res, 304, '', { ETag: etag, 'Cache-Control': cache });
  const headers = { 'Content-Type': type, ETag: etag, 'Cache-Control': cache, Vary: 'Accept-Encoding' };
  const compressible = /text|javascript|json|xml|svg|manifest/.test(type);
  const data = await fsp.readFile(file);
  if (compressible && /\bgzip\b/.test(req.headers['accept-encoding'] || '') && data.length > 1024) {
    headers['Content-Encoding'] = 'gzip';
    return send(res, 200, req.method === 'HEAD' ? '' : zlib.gzipSync(data), headers);
  }
  send(res, 200, req.method === 'HEAD' ? '' : data, headers);
}

// ---------------------------------------------------------------- validation
const str = (v, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : Array.isArray(v) ? v.map((x) => String(x).slice(0, 100)).join(', ').slice(0, max) : '');
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function cleanSettings(input, current) {
  const s = structuredClone(current);
  if (input.company) for (const k of ['name', 'short', 'tagline', 'primaryPhone', 'quotePhone', 'whatsapp', 'email', 'googleReviewUrl', 'reviewCount']) if (k in input.company) s.company[k] = str(input.company[k], 300);
  if (input.company && 'rating' in input.company) s.company.rating = Math.max(0, Math.min(5, Number(input.company.rating) || 0));
  if (input.social) for (const k of ['facebook', 'instagram', 'linkedin']) if (k in input.social) {
    const u = str(input.social[k], 300);
    s.social[k] = /^https:\/\//i.test(u) || u === '' ? u : s.social[k];
  }
  if (Array.isArray(input.offices)) {
    s.offices = input.offices.slice(0, 12).map((o, i) => {
      const lat = Number(o.lat), lng = Number(o.lng);
      if (!isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) throw Object.assign(new Error(`Office ${i + 1}: latitude/longitude are out of range`), { status: 400 });
      const city = str(o.city, 60);
      if (!city) throw Object.assign(new Error(`Office ${i + 1}: city is required`), { status: 400 });
      return {
        id: (str(o.id, 40) || city).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'office-' + (i + 1),
        city, label: str(o.label, 40), address: str(o.address, 300),
        phones: (Array.isArray(o.phones) ? o.phones : String(o.phones || '').split(/[,\n]/)).map((p) => str(p, 30)).filter(Boolean).slice(0, 5),
        email: EMAIL.test(str(o.email, 120)) ? str(o.email, 120) : '',
        lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6,
      };
    });
  }
  if (input.forms) {
    const w = str(input.forms.webhookUrl, 500);
    s.forms.webhookUrl = w === '' || /^https:\/\//i.test(w) ? w : s.forms.webhookUrl;
    if ('notifyEmail' in input.forms) s.forms.notifyEmail = str(input.forms.notifyEmail, 120);
  }
  if (input.about && Array.isArray(input.about.collage)) {
    const okUrl = (u) => /^\/(img\/about|media)\/[\w.-]+\.(webp|jpe?g|png)$/i.test(u);
    s.about = { collage: input.about.collage.slice(0, 24).map((p) => ({ full: str(p.full, 200), duo: str(p.duo, 200) || str(p.full, 200), caption: str(p.caption, 80) })).filter((p) => okUrl(p.full) && okUrl(p.duo)) };
  }
  if (input.analytics && 'gtm' in input.analytics) { const g = str(input.analytics.gtm, 20); s.analytics.gtm = /^GTM-[A-Z0-9]+$/i.test(g) || g === '' ? g : s.analytics.gtm; }
  return s;
}

// ---------------------------------------------------------------- API
let rebuilding = Promise.resolve();
const runBuild = () => new Promise((res) => execFile(process.execPath, BUILD, { cwd: ROOT }, (err, out, errOut) => { if (err) console.error('Build failed:', errOut || err.message); else process.stdout.write(out); res(); }));
const rebuild = () => (rebuilding = rebuilding.then(runBuild));

async function api(req, res, url) {
  const ip = ipOf(req);
  const route = url.pathname;

  if (route === '/api/settings' && req.method === 'GET') {
    const s = readJSON('settings.json', {});
    return json(res, 200, { company: s.company, social: s.social, offices: s.offices });
  }

  if (route === '/api/forms' && req.method === 'POST') {
    if (limited('form:' + ip, 8, 60_000)) return json(res, 429, { error: 'Too many submissions — try again in a minute.' });
    const body = await readBody(req, 8 * 1024 * 1024);
    const type = ['quote', 'contact', 'career'].includes(body.type) ? body.type : null;
    const d = body.data || {};
    if (!type) return json(res, 400, { error: 'Unknown form' });
    if (d.company_website) return json(res, 200, { ok: true, ref: 'FS-0' }); // honeypot
    const entry = {
      id: crypto.randomUUID(), ref: 'FS-' + Date.now().toString(36).toUpperCase().slice(-6), type, status: 'new', createdAt: new Date().toISOString(),
      name: str(d.name, 120), phone: str(d.phone, 40), email: str(d.email, 160),
      fields: {},
    };
    if (!entry.name || !entry.phone || !EMAIL.test(entry.email)) return json(res, 400, { error: 'Name, phone and a valid email are required.' });
    for (const [k, v] of Object.entries(d)) if (!['name', 'phone', 'email', 'attachment', 'company_website'].includes(k)) entry.fields[k] = str(v, 5000);
    if (d.attachment?.data) {
      const m = /^data:([^;]+);base64,(.+)$/.exec(d.attachment.data);
      const ext = path.extname(str(d.attachment.name, 120)).toLowerCase();
      if (!m || !['.pdf', '.doc', '.docx'].includes(ext)) return json(res, 400, { error: 'Attach a PDF or Word document.' });
      const buf = Buffer.from(m[2], 'base64');
      if (buf.length > 5 * 1024 * 1024) return json(res, 413, { error: 'Attach a file under 5 MB.' });
      const fname = `${entry.id}${ext}`;
      await fsp.writeFile(path.join(UPLOADS, fname), buf);
      entry.attachment = { file: fname, name: str(d.attachment.name, 120), size: buf.length };
    }
    const list = readJSON('submissions.json', []);
    list.unshift(entry);
    await writeJSON('submissions.json', list.slice(0, 5000));
    const hook = readJSON('settings.json', {}).forms?.webhookUrl;
    if (hook) fetch(hook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...entry, attachment: entry.attachment?.name }) }).catch((e) => console.warn('Webhook failed:', e.message));
    console.log(`New ${type} submission ${entry.ref} from ${entry.name}`);
    return json(res, 200, { ok: true, ref: entry.ref });
  }

  // ---- admin
  if (route === '/api/admin/login' && req.method === 'POST') {
    if (limited('login:' + ip, 6, 60_000)) return json(res, 429, { error: 'Too many attempts — wait a minute.' });
    const { password = '' } = await readBody(req, 10_000);
    const rec = adminRecord();
    const { hash } = hashPassword(String(password), rec.salt);
    if (!crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(rec.hash, 'hex'))) return json(res, 401, { error: 'Wrong password.' });
    const tok = crypto.randomBytes(32).toString('hex');
    sessions.set(tok, Date.now() + SESSION_MS);
    return json(res, 200, { ok: true, mustChange: !!rec.mustChange }, { 'Set-Cookie': `fs_admin=${tok}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_MS / 1000}` });
  }
  if (!route.startsWith('/api/admin/')) return json(res, 404, { error: 'Not found' });
  const tok = authed(req);
  if (!tok) return json(res, 401, { error: 'Sign in required.' });

  if (route === '/api/admin/logout' && req.method === 'POST') { sessions.delete(tok); return json(res, 200, { ok: true }, { 'Set-Cookie': 'fs_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' }); }
  if (route === '/api/admin/me') return json(res, 200, { ok: true, mustChange: !!adminRecord().mustChange });
  if (route === '/api/admin/settings' && req.method === 'GET') return json(res, 200, readJSON('settings.json', {}));
  if (route === '/api/admin/settings' && req.method === 'PUT') {
    const input = await readBody(req, 200_000);
    const next = cleanSettings(input, readJSON('settings.json', {}));
    await writeJSON('settings.json', next);
    await rebuild();
    return json(res, 200, { ok: true, settings: next });
  }
  if (route === '/api/admin/password' && req.method === 'POST') {
    const { current = '', next = '' } = await readBody(req, 10_000);
    const rec = adminRecord();
    const { hash } = hashPassword(String(current), rec.salt);
    if (!crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(rec.hash, 'hex'))) return json(res, 400, { error: 'Current password is wrong.' });
    if (String(next).length < 10) return json(res, 400, { error: 'Use at least 10 characters.' });
    await writeJSON('admin.json', { ...hashPassword(String(next)), mustChange: false });
    sessions.clear(); sessions.set(tok, Date.now() + SESSION_MS);
    return json(res, 200, { ok: true });
  }
  // ---- articles (blog) written/edited in the admin
  if (route === '/api/admin/posts' && req.method === 'GET') {
    const posts = readJSON('posts.json', []);
    const dir = path.join(ROOT, 'content/pages');
    const imported = fs.readdirSync(dir).filter((f) => f.startsWith('blog__')).map((f) => {
      const pg = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      const by = (pg.byline || []).filter((x) => x && x !== '•');
      return { slug: f.slice(6, -5), title: pg.title, category: pg.category || '', author: by.find((x) => !/\d/.test(x)) || '', date: '', read: by.find((x) => /min/i.test(x)) || '', excerpt: pg.metaDescription || '', body: blocksToMd(pg.blocks) };
    });
    return json(res, 200, { posts, imported });
  }
  const pm = route.match(/^\/api\/admin\/posts\/([a-z0-9-]+)$/);
  if (pm && req.method === 'PUT') {
    const b = await readBody(req, 600_000);
    const slug = slugify(str(b.slug, 80) || str(b.title, 120));
    if (!str(b.title, 200)) return json(res, 400, { error: 'Give the article a title.' });
    if (!slug) return json(res, 400, { error: 'The web address (slug) is empty.' });
    const posts = readJSON('posts.json', []).filter((p) => p.slug !== pm[1] && p.slug !== slug);
    const cover = str(b.cover, 300);
    const post = {
      slug, title: str(b.title, 200), category: str(b.category, 60) || 'Fire safety', author: str(b.author, 80), date: str(b.date, 30) || new Date().toISOString().slice(0, 10),
      read: str(b.read, 30), excerpt: str(b.excerpt, 400), cover: /^\/media\/[\w.-]+$/.test(cover) ? cover : '', body: typeof b.body === 'string' ? b.body.slice(0, 200_000) : '',
      published: b.published !== false, updatedAt: new Date().toISOString(),
    };
    posts.unshift(post);
    if (pm[1] !== slug && fs.existsSync(path.join(ROOT, 'content/pages', `blog__${pm[1]}.json`))) posts.push({ slug: pm[1], hidden: true });
    await writeJSON('posts.json', posts);
    await rebuild();
    return json(res, 200, { ok: true, post });
  }
  if (pm && req.method === 'DELETE') {
    let posts = readJSON('posts.json', []).filter((p) => p.slug !== pm[1]);
    if (fs.existsSync(path.join(ROOT, 'content/pages', `blog__${pm[1]}.json`))) posts.push({ slug: pm[1], hidden: true });
    await writeJSON('posts.json', posts);
    await rebuild();
    return json(res, 200, { ok: true });
  }
  if (route === '/api/admin/media' && req.method === 'POST') {
    const b = await readBody(req, 8 * 1024 * 1024);
    const m = /^data:image\/(png|jpe?g|webp|gif);base64,(.+)$/.exec(String(b.data || ''));
    if (!m) return json(res, 400, { error: 'Upload a PNG, JPG, WebP or GIF image.' });
    const buf = Buffer.from(m[2], 'base64');
    if (buf.length > 6 * 1024 * 1024) return json(res, 413, { error: 'Use an image under 6 MB.' });
    const name = `${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}.${m[1].replace('jpeg', 'jpg')}`;
    await fsp.writeFile(path.join(MEDIA, name), buf);
    return json(res, 200, { ok: true, url: '/media/' + name });
  }
  if (route === '/api/admin/resolve-map' && req.method === 'POST') {
    // Expand a shared Google Maps short link so the admin can read its coordinates
    let { url: u = '' } = await readBody(req, 10_000);
    const ok = (x) => { try { const h = new URL(x).hostname; return /(^|\.)(goo\.gl|g\.co|google\.[a-z.]+)$/i.test(h); } catch (e) { return false; } };
    for (let i = 0; i < 5 && ok(u); i++) {
      const r = await fetch(u, { redirect: 'manual', headers: { 'User-Agent': 'Mozilla/5.0' } }).catch(() => null);
      const loc = r?.headers.get('location');
      if (!loc) break;
      u = new URL(loc, u).toString();
    }
    return json(res, 200, { url: u });
  }
  if (route === '/api/admin/submissions' && req.method === 'GET') return json(res, 200, readJSON('submissions.json', []));
  const m = route.match(/^\/api\/admin\/submissions\/([\w-]+)$/);
  if (m) {
    const list = readJSON('submissions.json', []);
    const i = list.findIndex((x) => x.id === m[1]);
    if (i < 0) return json(res, 404, { error: 'Not found' });
    if (req.method === 'PATCH') {
      const { status } = await readBody(req, 10_000);
      if (['new', 'read', 'done'].includes(status)) list[i].status = status;
      await writeJSON('submissions.json', list);
      return json(res, 200, list[i]);
    }
    if (req.method === 'DELETE') {
      const [gone] = list.splice(i, 1);
      if (gone.attachment) await fsp.rm(path.join(UPLOADS, gone.attachment.file), { force: true });
      await writeJSON('submissions.json', list);
      return json(res, 200, { ok: true });
    }
  }
  const up = route.match(/^\/api\/admin\/uploads\/([\w-]+\.(pdf|docx?))$/);
  if (up && req.method === 'GET') {
    const file = path.join(UPLOADS, up[1]);
    const entry = readJSON('submissions.json', []).find((x) => x.attachment?.file === up[1]);
    const data = await fsp.readFile(file).catch(() => null);
    if (!data) return json(res, 404, { error: 'File not found' });
    return send(res, 200, data, { 'Content-Type': TYPES['.' + up[2]] || 'application/octet-stream', 'Content-Disposition': `attachment; filename="${(entry?.attachment?.name || up[1]).replace(/[^\w.\- ]/g, '_')}"`, 'Cache-Control': 'no-store' });
  }
  return json(res, 404, { error: 'Not found' });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    if (url.pathname === '/admin') return send(res, 301, '', { Location: '/admin/' });
    const mm = url.pathname.match(/^\/media\/([\w.-]+\.(png|jpe?g|webp|gif))$/);
    if (mm) { const data = await fsp.readFile(path.join(MEDIA, mm[1])).catch(() => null); return data ? send(res, 200, data, { 'Content-Type': mm[2] === 'png' ? 'image/png' : mm[2] === 'webp' ? 'image/webp' : mm[2] === 'gif' ? 'image/gif' : 'image/jpeg', 'Cache-Control': 'public, max-age=604800' }) : send(res, 404, 'Not found'); }
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');
    await serveStatic(req, res, url.pathname);
  } catch (e) {
    if (!res.headersSent) json(res, e.status || 500, { error: e.status ? e.message : 'Server error' });
    if (!e.status) console.error(e);
  }
});
server.listen(PORT, () => console.log(`Firestone site running at http://localhost:${PORT}  (admin: http://localhost:${PORT}/admin/)`));

if (process.argv.includes('--watch')) {
  let t;
  for (const dir of ['build', 'content', 'public']) {
    fs.watch(path.join(ROOT, dir), { recursive: true }, () => { clearTimeout(t); t = setTimeout(() => { console.log('Change detected — rebuilding'); rebuild(); }, 150); });
  }
}
