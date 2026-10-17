// Renders imported content blocks into the new design.
import { esc, ICON } from '../public/js/shared.js';
import { MODEL, LABEL, FAMILIES } from './catalog.mjs';

export const PIXEL = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
const plain = (s = '') => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();
export const slugify = (s) => plain(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

const KEYMODEL = [
  [/panel|call point|sounder|flasher|vesda|beam|flame|heat|detector|smoke detect|addressable|conventional/i, 'detector'],
  [/public address|voice|speaker/i, 'exitsign'],
  [/sprinkler|wet pipe|dry pipe|pre-action|deluge|head|riser|foam|piping|hdpe/i, 'sprinkler'],
  [/hydrant|hose|pump/i, 'hydrant'],
  [/fm ?200|novec|clean agent|co2|cylinder|suppression|kitchen hood/i, 'cylinders'],
  [/extinguisher|blanket/i, 'extinguisher'],
  [/door|damper/i, 'door'],
  [/exit|emergency light|battery/i, 'exitsign'],
  [/lpg|gas|regulator|manifold/i, 'lpg'],
  [/seal|stop|penetration|collar|intumescent/i, 'sealant'],
  [/fan|ventilat|pressuri|exhaust|duct/i, 'fan'],
  [/cctv|camera|anpr|intercom|burglar/i, 'cctv'],
  [/barrier|access|attendance|turnstile|biometric|card/i, 'barrier'],
  [/cabling|network|it |server|rack|fibre/i, 'rack'],
  [/certificate|istifa|compliance|audit|inspection|assessment|approval|drawing|document/i, 'clipboard'],
  [/plan|evacuat|assembly/i, 'plan'],
];
export function modelFor(text, fallback = 'tower') {
  for (const [re, m] of KEYMODEL) if (re.test(text)) return m;
  return fallback;
}
const FAM_OF = { detector: 'alarm', exitsign: 'exit', sprinkler: 'sprinkler', hydrant: 'hydrant', cylinders: 'suppression', extinguisher: 'extinguisher', door: 'door', lpg: 'gas', sealant: 'seal', fan: 'fan', cctv: 'cctv', barrier: 'access', rack: 'network', clipboard: 'compliance', plan: 'compliance' };
const ALL = Object.values(FAMILIES).flat();
// A drawing that fits the text and hasn't been used yet in this grid/page
export function pickModel(text, used) {
  const fam = FAMILIES[FAM_OF[modelFor(text, '')]] || [];
  const k = fam.find((x) => !used.has(x)) || ALL.find((x) => !used.has(x)) || 'tower';
  used.add(k);
  return k;
}
const thumb = (model, alt = '') => `<img src="${PIXEL}" data-model="${model}" alt="${esc(alt)}" loading="lazy" width="640" height="480">`;

function linkBtn(l) {
  const t = plain(l.text);
  if (l.href.startsWith('tel:')) return `<a class="btn btn--ghost" href="${l.href}">${ICON.phone} ${esc(t)}</a>`;
  if (/whatsapp|wa\.me/i.test(l.href)) return `<a class="btn btn--green" href="${l.href}" target="_blank" rel="noopener">${ICON.wa} ${esc(t)}</a>`;
  if (/quote|assessment|contact/i.test(t) || l.href === '#' || l.href === '/contact') return `<button type="button" class="btn" data-quote=""><span class="sq"></span>${esc(t.replace(/\s*→$/, ''))}</button>`;
  if (l.href === '#' || /^#/.test(l.href)) return '';
  return `<a class="link-arrow" href="${l.href}">${esc(t)} ${ICON.arrow}</a>`;
}

export function card({ href, title, text = '', model, label = '' }) {
  return `<a class="card" href="${href}" data-reveal>
  <div class="card__art">${label ? `<span class="hand">${esc(label)}</span>` : ''}${thumb(model)}</div>
  <div class="card__body"><span class="h3">${esc(title)}</span>${text ? `<p>${text}</p>` : ''}<span class="card__go">Explore ${ICON.arrow}</span></div>
</a>`;
}

export function faqList(items) {
  return `<div class="faq">${items.map(({ q, a }) => `<details><summary>${esc(q)}<span class="pm" aria-hidden="true"></span></summary><div class="ans"><p>${a}</p></div></details>`).join('')}</div>`;
}

export function renderBlocks(blocks, { model = 'tower' } = {}) {
  const out = [], toc = [], faqs = [];
  const usedModels = new Set([model]);
  const used = new Set();
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    switch (b.t) {
      case 'h': {
        let id = slugify(b.text) || 'section-' + i;
        while (used.has(id)) id += '-x';
        used.add(id);
        const next = blocks[i + 1];
        const minor = next && next.t === 'h';
        if (!minor) toc.push({ id, text: plain(b.text) });
        out.push(`<h2 class="blk-h${minor ? ' blk-h--group' : ''}" id="${id}" data-reveal>${b.text}</h2>`);
        break;
      }
      case 'p': {
        const t = plain(b.text);
        if (/^(frequently asked questions|.*faqs?)$/i.test(t) && t.length < 60) {
          const id = 'faq';
          if (!used.has(id)) { used.add(id); toc.push({ id, text: 'FAQ' }); }
          out.push(`<h2 class="blk-h" id="${id}" data-reveal>${esc(t)}</h2>`);
          break;
        }
        if (/^last updated/i.test(t)) { out.push(`<p class="blk mono muted">${esc(t)}</p>`); break; }
        out.push(`<p class="blk" data-reveal>${b.text}</p>`);
        break;
      }
      case 'ul':
        out.push(`<ul class="checks" data-reveal>${b.items.map((x) => `<li>${x}</li>`).join('')}</ul>`);
        break;
      case 'features':
        out.push(`<div class="features blk" data-reveal>${b.items.map((f) => `<div class="feature"><span class="k" aria-hidden="true">◆</span><h3>${f.title}</h3><p>${f.text}</p></div>`).join('')}</div>`);
        break;
      case 'tiles':
        out.push(`<div class="tiles" data-reveal>${b.items.map((x) => `<div class="tile">${thumb(pickModel(x.title + ' ' + (x.alt || ''), usedModels), '')}<b>${esc(plain(x.title))}</b></div>`).join('')}</div>`);
        break;
      case 'pairs':
        out.push(`<dl class="pairs" data-reveal>${b.items.map((x) => `<div class="pair"><dt>${esc(x.k)}</dt><dd>${x.v}</dd></div>`).join('')}</dl>`);
        break;
      case 'ticker':
        if (b.items.length < 2) break;
        out.push(`<div class="ticker" aria-label="${esc(b.items.join(', '))}"><div class="ticker__track" aria-hidden="true">${[...b.items, ...b.items].map((x) => `<span>${esc(x)}</span>`).join('')}</div></div>`);
        break;
      case 'faq': {
        faqs.push(...b.items);
        const prev = blocks[i - 1];
        if (!(prev && (prev.t === 'h' || (prev.t === 'p' && /faq|questions/i.test(plain(prev.text)))))) {
          if (!used.has('faq')) { used.add('faq'); toc.push({ id: 'faq', text: 'FAQ' }); out.push('<h2 class="blk-h" id="faq" data-reveal>Questions, answered</h2>'); }
        }
        out.push(`<div class="faq-blk" data-reveal>${faqList(b.items)}</div>`);
        break;
      }
      case 'card': {
        const cards = [];
        while (blocks[i] && blocks[i].t === 'card') { cards.push(blocks[i]); i++; }
        i--;
        out.push(`<div class="cards cards--2 blk">${cards.map((c) => {
          const slug = c.href.replace('/services/', '');
          const isService = c.href.startsWith('/services/');
          const m = isService ? slug : pickModel(plain(c.title) + ' ' + plain(c.text || ''), usedModels);
          if (isService) usedModels.add(slug);
          return card({ href: c.href, title: (isService && LABEL[slug]) || plain(c.title), text: c.text || '', model: m });
        }).join('')}</div>`);
        break;
      }
      case 'link':
      case 'links': {
        const group = [];
        while (blocks[i] && (blocks[i].t === 'link' || blocks[i].t === 'links')) { group.push(...(blocks[i].items || [blocks[i]])); i++; }
        i--;
        const html = group.map(linkBtn).filter(Boolean).join('');
        if (html) out.push(`<div class="inline-cta">${html}</div>`);
        break;
      }
      case 'image': // only from admin-written articles; the old site's photos are replaced by 3D art
        out.push(`<figure class="blk-fig" data-reveal><img src="${esc(b.src)}" alt="${esc(b.alt || '')}" loading="lazy">${b.alt ? `<figcaption>${esc(b.alt)}</figcaption>` : ''}</figure>`);
        break;
      case 'quote':
        out.push(`<blockquote class="blk-quote" data-reveal><p>${b.text}</p></blockquote>`);
        break;
      default: break;
    }
  }
  return { html: out.join('\n'), toc: toc.slice(0, 16), faqs };
}

// Pull a hero (eyebrow, title, subtitle, lead) off the front of a page's blocks
export function splitHero(blocks, fallbackTitle) {
  const b = [...blocks];
  let eyebrow = '', title = '', sub = '', lead = [];
  while (b[0] && (b[0].t === 'img' || b[0].t === 'link' || b[0].t === 'links')) b.shift();
  if (b[0]?.t === 'p' && plain(b[0].text).length < 70 && b[1]?.t === 'h') eyebrow = plain(b.shift().text);
  if (b[0]?.t === 'h') title = plain(b.shift().text);
  if (b[0]?.t === 'h' && plain(b[0].text).length < 70 && b[1] && b[1].t !== 'p') sub = plain(b.shift().text);
  else if (b[0]?.t === 'h' && plain(b[0].text).length < 70 && b[1]?.t === 'p' && plain(b[1].text).length < 140) sub = plain(b.shift().text);
  while (b[0] && b[0].t === 'p' && lead.length < 2) lead.push(b.shift().text);
  while (b[0] && (b[0].t === 'link' || b[0].t === 'links' || b[0].t === 'img')) b.shift();
  return { eyebrow, title: title || fallbackTitle, sub, lead, rest: b };
}
