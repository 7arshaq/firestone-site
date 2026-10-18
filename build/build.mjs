// Static build: renders every route into dist/ with the original URLs,
// copies assets and vendor libraries, and writes sitemap + search index.
//   node build/build.mjs
//   node build/build.mjs --base=/firestone-site   -> dist-pages/, a static demo served under a sub-path
//                                                  (GitHub Pages): no admin, forms fall back to WhatsApp
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { page as shell, SITE_URL } from './layout.mjs';
import * as P from './pages.mjs';
import { LABEL, MENU, blogModel, BLOG_MODELS } from './catalog.mjs';
import { mdToBlocks, readMinutes } from '../public/js/md.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// "firestone-site" or "/firestone-site" -> "/firestone-site" (no slash needed, which keeps Git Bash from rewriting it as a path)
const BASE_RAW = (process.env.BASE_PATH || (process.argv.find((a) => a.startsWith('--base=')) || '').slice(7)).replace(/^\/+|\/+$/g, '');
const BASE = BASE_RAW ? '/' + BASE_RAW : '';
const DIST = path.join(ROOT, BASE ? 'dist-pages' : 'dist');
const rel = (...p) => path.join(ROOT, ...p);
const plain = (s = '') => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
function swapInto(OUT) {
  const old = path.join(ROOT, `dist-old-${process.pid}-${Date.now()}`);
  let moved = !fs.existsSync(DIST);
  for (let i = 0; i < 10; i++) {
    try {
      if (!moved) { fs.renameSync(DIST, old); moved = true; }
      fs.renameSync(OUT, DIST);
      try { fs.rmSync(old, { recursive: true, force: true, maxRetries: 4, retryDelay: 80 }); } catch (e) { /* removed on the next build */ }
      return;
    } catch (e) { sleep(150); }
  }
  // last resort (folder locked): copy the new build over the old one
  fs.cpSync(OUT, DIST, { recursive: true, force: true });
  try { fs.rmSync(OUT, { recursive: true, force: true }); } catch (e) { /* ignore */ }
}

export function build() {
  const t0 = Date.now();
  const settings = JSON.parse(fs.readFileSync(rel('data/settings.json'), 'utf8'));
  const pages = {};
  for (const f of fs.readdirSync(rel('content/pages'))) {
    if (!f.endsWith('.json') || f.startsWith('_')) continue;
    pages[f.replace(/\.json$/, '').replace(/__/g, '/')] = JSON.parse(fs.readFileSync(rel('content/pages', f), 'utf8'));
  }

  // build into a fresh folder, then swap it in — overlapping builds can never leave a half-written site
  for (const f of fs.readdirSync(ROOT)) {
    if (!/^dist-(next|old)-/.test(f)) continue;
    const p = path.join(ROOT, f);
    try { if (Date.now() - fs.statSync(p).mtimeMs > 120_000) fs.rmSync(p, { recursive: true, force: true }); } catch (e) { /* in use; next time */ }
  }
  const OUT = path.join(ROOT, `dist-next-${process.pid}-${Date.now()}`);
  fs.mkdirSync(OUT, { recursive: true });
  const routes = [], search = [];
  const write = (route, out, meta = {}) => {
    const file = route === '/404' ? path.join(OUT, '404.html') : path.join(OUT, route, 'index.html');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, shell({ route, settings, ...out }));
    if (route !== '/404') routes.push({ route, priority: meta.priority ?? 0.6 });
    if (meta.search) search.push({ u: route, ...meta.search, k: [meta.search.k, ...(out.search?.toc || []).map((t) => t.text)].filter(Boolean).join(' · ').slice(0, 400) });
  };

  // ---- jobs + posts metadata
  const jobs = Object.entries(pages).filter(([k]) => k.startsWith('career/')).map(([k, pg]) => {
    const firstP = pg.blocks.find((b) => b.t === 'p' && plain(b.text).length > 60);
    return { route: '/' + k, title: pg.title, summary: plain(firstP?.text || '').replace(/^(we are|we're)\s/i, (m) => m).slice(0, 230) };
  });
  const jobOrder = ['hvac-technician', 'supervisor', 'project-engineer', 'maintenance-engineer', 'fire-alarm-technician', 'fire-fighting-technician', 'fire-sealant-applicator-lile6', 'painter'];
  jobs.sort((a, b) => jobOrder.indexOf(a.route.split('/').pop()) - jobOrder.indexOf(b.route.split('/').pop()));

  const postOrder = ['fire-safety-maintenance-why-regular-inspection-and-testing-matter', 'how-integrated-gas-security-and-safety-systems-are-changing-modern-buildings', 'the-non-negotiables-what-to-demand-from-a-fire-safety-contractor-in-the-uae', 'why-routine-fire-safety-maintenance-prevents-failures', 'warehouse-fire-risk-assessment-a-strategic-approach-to-fire-safety-and-business-continuity', 'fire-protection-is-a-business-continuity-strategy-protecting-operations-beyond-compliance', 'summer-fire-risk-uae-commercial-properties', 'fire-safety-compliance-uae-portfolios', 'elv-systems-building-smarter-safer-and-more-connected-environments', 'smoke-management-ventilation-systems-creating-safer-smarter-buildings-in-the-uae', 'the-most-common-causes-of-fire', 'the-vital-security-measure-is-fire-safety', 'why-is-the-fire-alarm-system-important', 'fire-safety-solutions', 'the-importance-of-fire-extinguisher-maintenance'];
  const bucket = (c, t) => {
    const s = c + ' ' + t;
    if (/compliance|contractor/i.test(s)) return 'Compliance';
    if (/maintenance|inspection/i.test(s)) return 'Maintenance';
    if (/security|elv/i.test(s)) return 'Security systems';
    if (/ventilation|smoke/i.test(s)) return 'Smoke & ventilation';
    if (/continuity|warehouse/i.test(s)) return 'Business continuity';
    return 'Fire safety';
  };
  // articles written or edited in the admin live in data/posts.json
  let adminPosts = [];
  try { adminPosts = JSON.parse(fs.readFileSync(rel('data/posts.json'), 'utf8')); } catch (e) { /* none yet */ }
  const override = new Map(adminPosts.map((a) => [a.slug, a]));
  const usedArt = new Set(Object.values(BLOG_MODELS));
  const catSlug = (l) => l.toLowerCase().replace(/[^a-z]+/g, '-');
  const fmtDate = (iso) => { const d = new Date(iso); return isNaN(d) ? (iso || '') : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); };
  const fromAdmin = (a) => {
    const k = 'blog/' + a.slug;
    const blocks = mdToBlocks(a.body || '');
    pages[k] = { route: '/' + k, kind: 'post', title: a.title, category: a.category, metaTitle: `${a.title} | Firestone Blog`, metaDescription: a.excerpt || '', blocks };
    const catLabel = bucket(a.category || '', a.title);
    let model = '';
    if (!a.cover) { model = blogModel(a.slug, `${a.category} ${a.title} ${a.excerpt || ''}`, usedArt); if (model && !BLOG_MODELS[a.slug]) usedArt.add(model); }
    const firstP = blocks.find((b) => b.t === 'p');
    return {
      route: '/' + k, slug: a.slug, title: a.title, category: a.category || 'Fire safety', catLabel, cat: catSlug(catLabel),
      author: a.author || '', date: fmtDate(a.date), read: a.read || `${readMinutes(a.body)} min read`, model, cover: a.cover || '',
      excerpt: (a.excerpt || plain(firstP?.text || '')).slice(0, 220), sortDate: a.date || '',
    };
  };
  const imported = Object.entries(pages).filter(([k]) => k.startsWith('blog/')).map(([k, pg]) => {
    const slug = k.split('/')[1];
    const o = override.get(slug);
    if (o?.hidden) return null;
    if (o) return fromAdmin(o);
    const by = (pg.byline || []).filter((x) => x && x !== '•');
    const read = by.find((x) => /min/i.test(x)) || '';
    const date = by.find((x) => /\d/.test(x) && !/min/i.test(x)) || '';
    const author = by.find((x) => x !== read && x !== date && !/\d/.test(x)) || '';
    const firstP = pg.blocks.find((b) => b.t === 'p' && plain(b.text).length > 60);
    const catLabel = bucket(pg.category || '', pg.title);
    return {
      route: '/' + k, slug, title: pg.title, category: pg.category || 'Fire safety', catLabel, cat: catSlug(catLabel),
      author: author.replace(/^Firetone/, 'Firestone'), date, read, model: blogModel(slug, `${pg.category} ${pg.title}`, usedArt),
      excerpt: (pg.metaDescription || plain(firstP?.text || '')).slice(0, 220),
    };
  }).filter(Boolean);
  imported.sort((a, b) => postOrder.indexOf(a.slug) - postOrder.indexOf(b.slug));
  const fresh = adminPosts.filter((a) => !a.hidden && !imported.some((p) => p.slug === a.slug) && a.published !== false)
    .sort((a, b) => String(b.date).localeCompare(String(a.date))).map(fromAdmin);
  const posts = [...fresh, ...imported];

  // ---- routes
  const h = P.home({ settings });
  write('/', h, { priority: 1, search: { t: 'Home', s: 'Civil Defence approved fire & safety company in the UAE', c: 'Page', f: 1 } });
  write('/about-us', P.about({ settings, page: pages['about-us'] }), { priority: 0.8, search: { t: 'About Firestone', s: 'Since 2007 — mission, vision, approvals and why choose us', c: 'Page', f: 1 } });
  write('/services', P.servicesIndex({ page: pages.services, pages }), { priority: 0.9, search: { t: 'All services', s: 'Every fire, gas, smoke and security service', c: 'Page', f: 1 } });
  write('/contact', P.contact({ page: pages.contact, settings }), { priority: 0.8, search: { t: 'Contact', s: 'Offices in Abu Dhabi, Dubai, Sharjah and Al Ain', c: 'Page', f: 1, k: 'phone email address map whatsapp location directions' } });
  write('/career', P.careers({ page: pages.career, jobs }), { priority: 0.6, search: { t: 'Careers', s: `${jobs.length} open roles in the UAE`, c: 'Page', k: 'jobs hiring vacancies apply' } });
  for (const j of jobs) write(j.route, P.job({ page: pages[j.route.slice(1)], jobs, j }), { priority: 0.5, search: { t: j.title, s: j.summary, c: 'Role', k: 'job career vacancy' } });
  write('/blog', P.blogIndex({ page: pages.blog, posts }), { priority: 0.7, search: { t: 'Blog', s: 'Insights on fire safety in the UAE', c: 'Page' } });
  for (const p of posts) write(p.route, P.post({ page: pages[p.route.slice(1)], p, posts }), { priority: 0.6, search: { t: p.title, s: p.excerpt, c: 'Article', k: p.category } });
  const featured = new Set(MENU.map((m) => m.slug).concat(['fire-safety-emergency-support', 'sprinkler-system', 'cctv-camera-installation', 'istifa-certificate-uae']));
  for (const [k, pg] of Object.entries(pages)) {
    if (!k.startsWith('services/')) continue;
    const slug = k.split('/')[1];
    let out;
    if (slug === 'clients-and-projects') out = P.projects({ page: pg, settings });
    else if (slug === 'fire-safety-emergency-support') out = P.emergency({ page: pg, settings });
    else out = P.service({ page: pg, slug });
    write('/' + k, out, { priority: featured.has(slug) ? 0.9 : 0.7, search: { t: LABEL[slug] || pg.title, s: plain(pg.metaDescription || '').slice(0, 140), c: slug === 'clients-and-projects' ? 'Page' : 'Service', f: ['fire-safety-emergency-support', 'fire-and-safety', 'fire-alarm', 'annual-maintenance-contract-abu-dhabi', 'civil-defense-compliance'].includes(slug) ? 1 : 0, k: pg.title } });
  }
  write('/404', P.notFound());

  // ---- assets
  fs.cpSync(rel('public'), OUT, { recursive: true });
  const vendor = path.join(OUT, 'vendor');
  fs.mkdirSync(vendor, { recursive: true });
  [
    ['node_modules/three/build/three.module.min.js', 'three.module.min.js'],
    ['node_modules/lenis/dist/lenis.min.js', 'lenis.min.js'],
    ['node_modules/three/examples/jsm/utils/BufferGeometryUtils.js', 'BufferGeometryUtils.js'],
    ['node_modules/maplibre-gl/dist/maplibre-gl.js', 'maplibre-gl.js'],
    ['node_modules/maplibre-gl/dist/maplibre-gl.css', 'maplibre-gl.css'],
  ].forEach(([from, to]) => fs.copyFileSync(rel(from), path.join(vendor, to)));
  fs.mkdirSync(path.join(OUT, 'data'), { recursive: true });
  fs.writeFileSync(path.join(OUT, 'data/settings.json'), JSON.stringify({ company: settings.company, social: settings.social, offices: settings.offices }, null, 1));

  fs.writeFileSync(path.join(OUT, 'search-index.json'), JSON.stringify(search));
  const today = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map((r) => `  <url><loc>${SITE_URL}${r.route === '/' ? '' : r.route}</loc><lastmod>${today}</lastmod><priority>${r.priority}</priority></url>`).join('\n')}\n</urlset>\n`);
  fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
  fs.writeFileSync(path.join(OUT, 'site.webmanifest'), JSON.stringify({ name: 'Firestone Fire & Security Systems', short_name: 'Firestone', start_url: '/', display: 'standalone', background_color: '#F6F6F6', theme_color: '#2B9D47', icons: [{ src: '/img/brand/icon-512.png', sizes: '512x512', type: 'image/png' }, { src: '/img/brand/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }] }, null, 1));
  if (BASE) rebase(OUT, BASE);
  swapInto(OUT);
  console.log(`Built ${routes.length} pages into ${path.basename(DIST)}/${BASE ? ` (under ${BASE}/)` : ''} in ${Date.now() - t0} ms`);
  return routes.length;
}

// ---- static demo under a sub-path: prefix every root-relative URL, drop the server-only admin
function rebase(OUT, base) {
  const files = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(path.join(d, e.name)) : [path.join(d, e.name)]));
  fs.rmSync(path.join(OUT, 'admin'), { recursive: true, force: true });
  const ownJs = path.join(OUT, 'js') + path.sep;
  // a page URL: the base plus a path with no file extension and no trailing slash, then an optional ?query/#hash
  const pageLink = new RegExp(`((?:href="|"u":")${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/[^"#?.]*[^"#?./])([#?][^"]*)?(?=")`, 'g');
  for (const f of files(OUT)) {
    const name = path.relative(OUT, f).split(path.sep).join('/');
    let s;
    if (f.endsWith('.html')) {
      s = fs.readFileSync(f, 'utf8')
        // attributes: href="/x", src="/x"… (not protocol-relative "//")
        .replace(/((?:href|src|action|poster|srcset|content|data-[\w-]+)=")\/(?!\/)/g, `$1${base}/`)
        // JSON inside the page (import map, embedded settings)
        .replace(/"\/(vendor|img|media)\//g, `"${base}/$1/`)
        // static hosts serve pages as folders: link to "page/" directly instead of bouncing off a redirect
        .replace(pageLink, '$1/$2');
    } else if (f.startsWith(ownJs) && f.endsWith('.js')) {
      s = fs.readFileSync(f, 'utf8')
        // no server here: read the settings file straight away instead of trying /api/settings first
        .replace(`['/api/settings', '/data/settings.json']`, `['/data/settings.json']`)
        .replace(/(['"`])\/(api\/|data\/|vendor\/|search-index\.json)/g, `$1${base}/$2`);
    } else if (name === 'search-index.json') {
      s = fs.readFileSync(f, 'utf8').replace(/"u":"\//g, `"u":"${base}/`).replace(pageLink, '$1/$2');
    } else if (name === 'data/settings.json') {
      s = fs.readFileSync(f, 'utf8').replace(/"\/(img|media)\//g, `"${base}/$1/`);
    } else if (name === 'site.webmanifest') {
      s = fs.readFileSync(f, 'utf8').replace(/"(start_url|src)": "\//g, `"$1": "${base}/`);
    } else continue;
    fs.writeFileSync(f, s);
  }
  // static hosts cache CSS and JS for a while (GitHub Pages: 10 minutes) while new pages go live at once, so
  // right after an update a visitor could get the new page with the old stylesheet. Every CSS/JS/data URL gets a
  // version taken from the assets' content: any change means fresh URLs, and an unchanged build keeps them.
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const assets = ['css', 'js', 'vendor', 'data'].flatMap((d) => (fs.existsSync(path.join(OUT, d)) ? files(path.join(OUT, d)) : [])).sort();
  const hash = crypto.createHash('sha1');
  assets.forEach((f) => hash.update(path.relative(OUT, f)).update(fs.readFileSync(f)));
  hash.update(fs.readFileSync(path.join(OUT, 'search-index.json')));
  const v = hash.digest('hex').slice(0, 8);
  const B = esc(base);
  const inPage = new RegExp(`((?:href|src)=")(${B}/(?:css|js|vendor)/[^"?#]+\\.(?:css|js))"`, 'g');
  const inJson = new RegExp(`"(${B}/vendor/[^"?#]+\\.js)"`, 'g');
  const relImport = /(from\s*|import\(\s*)(['"])(\.\/[\w.-]+\.js)\2/g;
  const absRef = new RegExp(`(['"])(${B}/(?:vendor|data)/[^'"?#]+|${B}/search-index\\.json)\\1`, 'g');
  for (const f of files(OUT)) {
    if (f.endsWith('.html')) {
      const s = fs.readFileSync(f, 'utf8');
      fs.writeFileSync(f, s.replace(inPage, `$1$2?v=${v}"`).replace(inJson, `"$1?v=${v}"`));
    } else if (f.startsWith(ownJs) && f.endsWith('.js')) {
      const s = fs.readFileSync(f, 'utf8');
      fs.writeFileSync(f, s.replace(relImport, `$1$2$3?v=${v}$2`).replace(absRef, `$1$2?v=${v}$1`));
    }
  }
  fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) build();
