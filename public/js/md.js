// Markdown <-> content blocks, for articles written in the admin panel.
// Supported: ## / ### headings, paragraphs, - lists, > quotes, ![alt](url)
// images, **bold**, *italic*, [links](url), and "Q:" / "A:" FAQ pairs.

const escHtml = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const safeUrl = (u = '') => (/^(https?:\/\/|\/|mailto:|tel:|#)/i.test(u.trim()) ? u.trim() : '#');

export function inlineMd(s = '') {
  let out = escHtml(s);
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => `<a href="${escHtml(safeUrl(u.replace(/&amp;/g, '&')))}">${t}</a>`);
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  return out;
}

export function mdToBlocks(md = '') {
  const lines = String(md).replace(/\r/g, '').split('\n');
  const blocks = [];
  let para = [];
  const flush = () => { if (para.length) { blocks.push({ t: 'p', text: inlineMd(para.join(' ')) }); para = []; } };
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l) { flush(); continue; }
    let m;
    if ((m = l.match(/^#{2,4}\s+(.*)/))) { flush(); blocks.push({ t: 'h', text: escHtml(m[1]) }); continue; }
    if ((m = l.match(/^#\s+(.*)/))) { flush(); blocks.push({ t: 'h', text: escHtml(m[1]) }); continue; }
    if ((m = l.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/))) { flush(); blocks.push({ t: 'image', alt: m[1], src: safeUrl(m[2]) }); continue; }
    if ((m = l.match(/^([-*]|\d+\.)\s+(.*)/))) {
      flush();
      const last = blocks[blocks.length - 1];
      const item = inlineMd(m[2]);
      if (last?.t === 'ul') last.items.push(item); else blocks.push({ t: 'ul', items: [item] });
      continue;
    }
    if ((m = l.match(/^>\s?(.*)/))) { flush(); blocks.push({ t: 'quote', text: inlineMd(m[1]) }); continue; }
    if ((m = l.match(/^Q:\s*(.*)/i))) {
      flush();
      const ans = [];
      while (i + 1 < lines.length && !/^Q:/i.test(lines[i + 1].trim()) && (lines[i + 1].trim() || ans.length === 0)) {
        const nl = lines[++i].trim(); if (!nl) break; ans.push(nl.replace(/^A:\s*/i, ''));
      }
      const last = blocks[blocks.length - 1];
      const item = { q: escHtml(m[1]), a: inlineMd(ans.join(' ')) };
      if (last?.t === 'faq') last.items.push(item); else blocks.push({ t: 'faq', items: [item] });
      continue;
    }
    para.push(l);
  }
  flush();
  return blocks;
}

// HTML inline (from imported pages) -> markdown inline
function htmlToMd(h = '') {
  return String(h)
    .replace(/<a href="([^"]*)">([\s\S]*?)<\/a>/g, (_, u, t) => `[${t.replace(/<[^>]+>/g, '')}](${u})`)
    .replace(/<strong>([\s\S]*?)<\/strong>/g, '**$1**')
    .replace(/<em>([\s\S]*?)<\/em>/g, '*$1*')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

export function blocksToMd(blocks = []) {
  const out = [];
  for (const b of blocks) {
    switch (b.t) {
      case 'h': out.push('## ' + htmlToMd(b.text)); break;
      case 'p': out.push(htmlToMd(b.text)); break;
      case 'quote': out.push('> ' + htmlToMd(b.text)); break;
      case 'image': out.push(`![${b.alt || ''}](${b.src})`); break;
      case 'ul': out.push(b.items.map((x) => '- ' + htmlToMd(x)).join('\n')); break;
      case 'faq': out.push(b.items.map((x) => `Q: ${htmlToMd(x.q)}\nA: ${htmlToMd(x.a)}`).join('\n\n')); break;
      case 'features': out.push(b.items.map((x) => `### ${htmlToMd(x.title)}\n${htmlToMd(x.text)}`).join('\n\n')); break;
      case 'pairs': out.push(b.items.map((x) => `- **${htmlToMd(x.k)}** — ${htmlToMd(x.v)}`).join('\n')); break;
      case 'tiles': out.push(b.items.map((x) => '- ' + htmlToMd(x.title)).join('\n')); break;
      case 'card': out.push(`- [${htmlToMd(b.title)}](${b.href})`); break;
      case 'link': out.push(`[${htmlToMd(b.text)}](${b.href})`); break;
      case 'links': out.push(b.items.map((x) => `[${htmlToMd(x.text)}](${x.href})`).join(' · ')); break;
      default: break;
    }
  }
  return out.join('\n\n');
}

export const readMinutes = (md = '') => Math.max(1, Math.round(String(md).split(/\s+/).filter(Boolean).length / 220));
export const slugify = (s = '') => String(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
