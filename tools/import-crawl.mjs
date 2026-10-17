// One-time importer: turns the crawled firestonefs.com HTML into structured
// content JSON (content/pages/*.json). Usage:
//   node tools/import-crawl.mjs <crawl-html-dir>
import fs from 'node:fs';
import path from 'node:path';

const SRC = process.argv[2];
const OUT = path.resolve('content/pages');
fs.mkdirSync(OUT, { recursive: true });

const decode = (s) => s
  .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#x27;|&#39;/g, "'")
  .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/\u200d/g, '').replace(/&#x2F;/g, '/');

function toLines(html) {
  let h = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '');
  h = h.replace(/<img[^>]*?alt="([^"]*)"[^>]*>/gi, ' ⟦img:$1⟧ ');
  h = h.replace(/<a[^>]*?href="([^"]*)"[^>]*>/gi, '⟦a:$1⟧');
  h = h.replace(/<\/a>/gi, '⟦/a⟧');
  h = h.replace(/<(h[1-6])[^>]*>/gi, '\n## ');
  h = h.replace(/<\/(p|div|li|h[1-6]|section|tr|blockquote|figure)>/gi, '\n');
  h = h.replace(/<br\s*\/?>/gi, '\n');
  h = h.replace(/<li[^>]*>/gi, '\n- ');
  h = h.replace(/<(strong|b)>/gi, '⟦b⟧').replace(/<\/(strong|b)>/gi, '⟦/b⟧');
  h = h.replace(/<[^>]+>/g, ' ');
  h = decode(h);
  return h.split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter((l) => l && l !== '‍');
}

const meta = (html, re) => { const m = html.match(re); return m ? decode(m[1]).trim() : ''; };
const strip = (s) => s.replace(/⟦[^⟧]*⟧/g, '').replace(/\s+/g, ' ').trim();
const SITE = /^https?:\/\/(www\.)?firestonefs\.com/;
const fixHref = (u) => {
  u = u.replace(SITE, '') || '/';
  if (u.startsWith('tel:') || u.startsWith('mailto:') || u.startsWith('http') || u.startsWith('#')) return u;
  return u.replace(/\/$/, '') || '/';
};
// Inline markup -> safe HTML
function inline(s) {
  let out = s.replace(/[<>]/g, (c) => (c === '<' ? '&lt;' : '&gt;'));
  out = out.replace(/⟦img:[^⟧]*⟧/g, '');
  out = out.replace(/⟦b⟧/g, '<strong>').replace(/⟦\/b⟧/g, '</strong>');
  out = out.replace(/⟦a:([^⟧]*)⟧\s*([\s\S]*?)\s*⟦\/a⟧/g, (_, href, txt) => {
    const t = txt.trim();
    if (!t) return '';
    return `<a href="${fixHref(href)}">${t}</a>`;
  });
  out = out.replace(/⟦[^⟧]*⟧/g, '');
  // balance stray strong tags
  const opens = (out.match(/<strong>/g) || []).length, closes = (out.match(/<\/strong>/g) || []).length;
  if (opens > closes) out += '</strong>'.repeat(opens - closes);
  if (closes > opens) out = out.replace(/<\/strong>/g, '');
  return out.replace(/\s+([,.;:])/g, '$1').replace(/\s+/g, ' ').trim();
}

const TOGGLE = /^[+\-−×x]$/;
const MORE = /^(see more|learn more|know more|read more|explore|view more)\b/i;
const QWORD = /^(what|how|is|do|does|can|which|why|where|are|should|when|who|will|i |my )/i;

function toBlocks(lines) {
  const blocks = [];
  for (const raw of lines) {
    let l = raw;
    if (TOGGLE.test(l)) { blocks.push({ t: 'toggle' }); continue; }
    if (l.startsWith('## ')) {
      const text = inline(l.slice(3));
      if (strip(text)) blocks.push({ t: 'h', text: strip(text) });
      continue;
    }
    if (l.startsWith('- ')) {
      const text = inline(l.slice(2));
      if (strip(text)) blocks.push({ t: 'li', text });
      else blocks.push({ t: 'toggle' });
      continue;
    }
    // image + link + title on one line => child card
    const card = l.match(/^⟦img:([^⟧]*)⟧\s*⟦a:([^⟧]*)⟧\s*([^⟦]*)⟦\/a⟧\s*$/);
    if (card) { blocks.push({ t: 'card', href: fixHref(card[2]), title: card[3].trim(), alt: card[1] }); continue; }
    const imgs = [...l.matchAll(/⟦img:([^⟧]*)⟧/g)].map((m) => m[1].trim());
    const rest = l.replace(/⟦img:[^⟧]*⟧/g, '').trim();
    for (const alt of imgs) blocks.push({ t: 'img', alt });
    if (!rest) continue;
    const onlyLink = rest.match(/^⟦a:([^⟧]*)⟧\s*([^⟦]*?)\s*⟦\/a⟧$/);
    if (onlyLink) {
      if (onlyLink[2]) blocks.push({ t: 'link', href: fixHref(onlyLink[1]), text: onlyLink[2] });
      continue;
    }
    const html = inline(rest);
    if (strip(html)) blocks.push({ t: 'p', text: html });
  }
  return blocks;
}

function refine(blocks) {
  // 1. FAQs
  const out = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    const plain = b.t === 'p' ? strip(b.text) : '';
    const next = blocks[i + 1];
    const isQ = b.t === 'p' && plain.endsWith('?') && plain.length < 220 &&
      (next?.t === 'toggle' || (QWORD.test(plain) && next?.t === 'p' && !strip(next.text).endsWith('?')));
    if (isQ) {
      let j = i + 1;
      while (blocks[j]?.t === 'toggle') j++;
      const ans = [];
      while (blocks[j] && blocks[j].t === 'p') {
        const pt = strip(blocks[j].text);
        const nx = blocks[j + 1];
        if (pt.endsWith('?') && pt.length < 220 && (nx?.t === 'toggle' || QWORD.test(pt))) break;
        ans.push(blocks[j].text); j++;
      }
      while (blocks[j]?.t === 'toggle') j++;
      if (ans.length) {
        const last = out[out.length - 1];
        const item = { q: plain, a: ans.join(' ') };
        if (last?.t === 'faq') last.items.push(item); else out.push({ t: 'faq', items: [item] });
        i = j - 1;
        continue;
      }
    }
    if (b.t === 'toggle') continue;
    out.push(b);
  }
  // 2. "see more" cards: [img] (h|p title) p* link(MORE)
  const res = [];
  for (let i = 0; i < out.length; i++) {
    const b = out[i];
    if (b.t === 'link' && MORE.test(b.text) && !b.href.startsWith('tel:')) {
      // walk back
      let k = res.length - 1; const body = [];
      while (k >= 0 && (res[k].t === 'p') && body.length < 4) { body.unshift(res[k]); k--; }
      let title = '';
      if (k >= 0 && res[k].t === 'h') { title = res[k].text; k--; }
      else if (body.length >= 2) { title = strip(body.shift().text); }
      let alt = '';
      if (k >= 0 && res[k].t === 'img') { alt = res[k].alt; k--; }
      if (title) {
        res.length = k + 1;
        res.push({ t: 'card', href: b.href, title, text: body.map((x) => x.text).join(' '), alt });
        continue;
      }
    }
    res.push(b);
  }
  // 3. drop duplicate "Learn More >" text crumbs, group lists, ticker detection
  const final = [];
  for (let i = 0; i < res.length; i++) {
    const b = res[i];
    if (b.t === 'p' && /^learn more\s*&gt;$/i.test(strip(b.text))) continue;
    if (b.t === 'li') {
      const last = final[final.length - 1];
      if (last?.t === 'ul') last.items.push(b.text); else final.push({ t: 'ul', items: [b.text] });
      continue;
    }
    if (b.t === 'p') {
      const s = strip(b.text);
      if (s.length < 60 && s === s.toUpperCase() && /[A-Z]{3}/.test(s)) {
        const last = final[final.length - 1];
        if (last?.t === 'ticker') { if (!last.items.includes(s)) last.items.push(s); continue; }
        const n = res[i + 1];
        if (n?.t === 'p' && strip(n.text) === strip(n.text).toUpperCase() && strip(n.text).length < 60) {
          final.push({ t: 'ticker', items: [s] }); continue;
        }
      }
    }
    // collapse consecutive identical cards (logo marquee dupes etc.)
    if (b.t === 'card' && final.some((x) => x.t === 'card' && x.href === b.href && x.title === b.title)) continue;
    final.push(b);
  }
  // strip client-logo image noise, empty strongs, stray "##"
  let clean = final.filter((b) => !(b.t === 'img' && ((/logo/i.test(b.alt) && !/fire/i.test(b.alt)) || !b.alt.trim())));
  clean = clean.filter((b) => !(b.t === 'p' && !strip(b.text.replace(/<[^>]+>/g, ''))));
  clean = clean.filter((b) => !(b.t === 'p' && /^#+$/.test(strip(b.text))));
  for (const b of clean) if (b.text) b.text = b.text.replace(/<strong>\s*<\/strong>/g, '').trim();
  // drop repeated paragraphs (marquee duplicates)
  clean = clean.filter((b, i) => !(b.t === 'p' && clean.slice(Math.max(0, i - 8), i).some((x) => x.t === 'p' && x.text === b.text)));
  // paragraphs made only of links -> link group
  clean = clean.map((b) => {
    if (b.t !== 'p') return b;
    const links = [...b.text.matchAll(/<a href="([^"]*)">([\s\S]*?)<\/a>/g)];
    const leftover = b.text.replace(/<a href="[^"]*">[\s\S]*?<\/a>/g, '').replace(/<\/?strong>/g, '').trim();
    if (links.length && !leftover) {
      const items = links.map((m) => ({ href: m[1], text: strip(m[2].replace(/<[^>]+>/g, '')) })).filter((x) => x.text);
      return items.length === 1 ? { t: 'link', ...items[0] } : { t: 'links', items };
    }
    return b;
  });
  return groupPatterns(clean);
}

const plainLen = (b) => strip((b.text || '').replace(/<[^>]+>/g, '')).length;
function groupPatterns(bs) {
  const out = [];
  let i = 0;
  while (i < bs.length) {
    // (h, short p) x3+ => feature grid
    let j = i, items = [];
    while (bs[j]?.t === 'h' && bs[j + 1]?.t === 'p' && plainLen(bs[j + 1]) < 260 && bs[j + 2]?.t !== 'p') {
      items.push({ title: bs[j].text, text: bs[j + 1].text }); j += 2;
    }
    if (items.length >= 3) { out.push({ t: 'features', items }); i = j; continue; }
    // (img, h) x2+ => tiles
    j = i; items = [];
    while (bs[j]?.t === 'img' && bs[j + 1]?.t === 'h') { items.push({ title: bs[j + 1].text, alt: bs[j].alt }); j += 2; }
    if (items.length >= 2) { out.push({ t: 'tiles', items }); i = j; continue; }
    // (img, short p) x3+ => tiles
    j = i; items = [];
    while (bs[j]?.t === 'img' && bs[j + 1]?.t === 'p' && plainLen(bs[j + 1]) < 70) { items.push({ title: strip(bs[j + 1].text), alt: bs[j].alt }); j += 2; }
    if (items.length >= 3) { out.push({ t: 'tiles', items }); i = j; continue; }
    // p starting with <strong> x3+ => rich list
    j = i; items = [];
    while (bs[j]?.t === 'p' && /^<strong>/.test(bs[j].text)) { items.push(bs[j].text); j++; }
    if (items.length >= 3) { out.push({ t: 'ul', items, rich: true }); i = j; continue; }
    // (short label p, short value p) x3+ => pairs
    j = i; items = [];
    while (bs[j]?.t === 'p' && bs[j + 1]?.t === 'p' && plainLen(bs[j]) <= 48 && plainLen(bs[j + 1]) <= 120 &&
      !/[.?]$/.test(strip(bs[j].text)) && !/<a /.test(bs[j].text)) {
      items.push({ k: strip(bs[j].text), v: bs[j + 1].text }); j += 2;
    }
    if (items.length >= 3) { out.push({ t: 'pairs', items }); i = j; continue; }
    out.push(bs[i]); i++;
  }
  return out;
}

function slice(lines) {
  let start = lines.findIndex((l) => /Get a quote⟦\/a⟧$/i.test(l));
  start = start < 0 ? 0 : start + 1;
  let end = lines.findIndex((l, i) => i > start && (/^## Looking for Reliable fire/i.test(l) || /^⟦img:firestone logo⟧$/.test(l)));
  if (end < 0) end = lines.length;
  const body = lines.slice(start, end);
  // Some pages embed a second copy of the navigation mid-page: drop it.
  const out = [];
  for (let i = 0; i < body.length; i++) {
    if (/^⟦a:tel:\+971506761638⟧\s*\+971 50 676 1638⟦\/a⟧$/.test(body[i])) {
      const close = body.findIndex((l, k) => k > i && /Get a quote⟦\/a⟧$/i.test(l));
      if (close > 0 && close - i < 120) { i = close; continue; }
    }
    out.push(body[i]);
  }
  return out;
}

const files = fs.readdirSync(SRC).filter((f) => f.endsWith('.html'));
const index = [];
for (const f of files) {
  const html = fs.readFileSync(path.join(SRC, f), 'utf8');
  const name = f.replace(/\.html$/, '');
  const route = name === 'home' ? '/' : '/' + name.replace(/__/g, '/');
  const kind = route.startsWith('/blog/') ? 'post' : route.startsWith('/career/') ? 'job' : route.startsWith('/services/') ? 'service' : 'page';
  let lines = slice(toLines(html));
  const page = {
    route, kind,
    metaTitle: meta(html, /<title>([^<]*)<\/title>/i),
    metaDescription: meta(html, /<meta[^>]*name="description"[^>]*content="([^"]*)"/i) || meta(html, /<meta[^>]*content="([^"]*)"[^>]*name="description"/i),
  };
  if (kind === 'post') {
    // header: [a:#]Blog, category, ## title, [img], author, date, •, readtime, [img: cover]
    const hIdx = lines.findIndex((l) => l.startsWith('## '));
    page.category = strip(lines[hIdx - 1] || '');
    page.title = strip(lines[hIdx].slice(3));
    const rest = lines.slice(hIdx + 1);
    const dot = rest.indexOf('•');
    const headerEnd = dot >= 0 && dot < 8 ? dot + 2 : 0;
    const head = rest.slice(0, headerEnd).map(strip).filter((x) => x && x !== '•');
    page.byline = head;
    lines = rest.slice(headerEnd);
    const relIdx = lines.findIndex((l) => /^⟦a:\/blog\/[^⟧]+⟧/.test(l) || /^⟦a:\/blog⟧/.test(l) || /^## (related|recent|more) (posts|articles|blogs)/i.test(l));
    if (relIdx > 0) lines = lines.slice(0, relIdx);
  }
  if (kind === 'job') {
    const cut = lines.findIndex((l) => /^Start Your Career with Us/i.test(l));
    if (cut > 0) lines = lines.slice(0, cut);
  }
  page.blocks = refine(toBlocks(lines));
  if (!page.title) {
    const h = page.blocks.find((b) => b.t === 'h');
    page.title = h ? h.text : page.metaTitle;
  }
  const out = name === 'home' ? 'home' : name;
  fs.writeFileSync(path.join(OUT, out + '.json'), JSON.stringify(page, null, 1));
  index.push({ route, kind, title: page.title, blocks: page.blocks.length });
}
index.sort((a, b) => a.route.localeCompare(b.route));
fs.writeFileSync(path.join(OUT, '_index.json'), JSON.stringify(index, null, 1));
console.log(index.map((x) => `${x.kind.padEnd(8)} ${String(x.blocks).padStart(3)}  ${x.route}  — ${x.title}`).join('\n'));
