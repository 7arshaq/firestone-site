// Site runtime: smooth scroll, nav, reveals, quote wizard, forms, search,
// live settings (offices / socials edited in the admin), lazy 3D and maps.
import { esc, tel, wa, officeItem, footerOffice, socialLinks, ICON } from './shared.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
document.documentElement.classList.remove('no-js');

// ---------------------------------------------------------------- settings
let SETTINGS = {};
try { SETTINGS = JSON.parse($('#fs-settings')?.textContent || '{}'); } catch (e) { /* use defaults */ }
const settingsReady = (async () => {
  for (const url of ['/api/settings', '/data/settings.json']) {
    try {
      const r = await fetch(url, { cache: 'no-store' });
      if (r.ok) { SETTINGS = await r.json(); hydrate(); return SETTINGS; }
    } catch (e) { /* try next */ }
  }
  return SETTINGS;
})();

function hydrate() {
  const c = SETTINGS.company || {};
  $$('[data-offices="footer"]').forEach((el) => (el.innerHTML = (SETTINGS.offices || []).map(footerOffice).join('')));
  $$('[data-offices="list"]').forEach((el) => {
    const sel = el.querySelector('[aria-selected="true"]')?.dataset.office;
    el.innerHTML = (SETTINGS.offices || []).map((o, i) => officeItem(o, sel ? (o.id === sel ? 0 : 1) : i)).join('');
  });
  $$('[data-socials]').forEach((el) => (el.innerHTML = socialLinks(SETTINGS.social)));
  $$('[data-phone]').forEach((a) => { if (c.primaryPhone) { a.href = tel(c.primaryPhone); if (a.dataset.phone === 'text') a.textContent = c.primaryPhone; } });
  $$('[data-wa]').forEach((a) => { if (c.whatsapp) a.href = wa(c.whatsapp, a.dataset.wa || 'Hello Firestone,'); });
  $$('[data-email]').forEach((a) => { if (c.email) { a.href = 'mailto:' + c.email; if (a.dataset.email === 'text') a.textContent = c.email; } });
  document.dispatchEvent(new CustomEvent('fs:settings', { detail: SETTINGS }));
}

// ---------------------------------------------------------------- smooth scroll
let lenis = null;
if (!reduce && window.Lenis && !matchMedia('(pointer: coarse)').matches) {
  lenis = new window.Lenis({ lerp: 0.11, wheelMultiplier: 1, smoothWheel: true });
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  window.__lenis = lenis;
}
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || a.getAttribute('href').length < 2) return;
  const t = document.getElementById(a.getAttribute('href').slice(1));
  if (!t) return;
  e.preventDefault();
  if (lenis) lenis.scrollTo(t, { offset: -90 }); else t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
});

// ---------------------------------------------------------------- nav
const megaBtn = $('[data-mega-btn]');
const mega = $('#mega');
let megaTimer;
function setMega(open) {
  if (!mega) return;
  mega.classList.toggle('open', open);
  megaBtn?.setAttribute('aria-expanded', String(open));
}
if (megaBtn && mega) {
  megaBtn.addEventListener('click', () => setMega(!mega.classList.contains('open')));
  const enter = () => { clearTimeout(megaTimer); if (matchMedia('(hover: hover)').matches) setMega(true); };
  const leave = () => { megaTimer = setTimeout(() => setMega(false), 220); };
  [megaBtn, mega].forEach((el) => { el.addEventListener('mouseenter', enter); el.addEventListener('mouseleave', leave); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMega(false); });
  document.addEventListener('click', (e) => { if (!e.target.closest('#mega, [data-mega-btn]')) setMega(false); });
}
const sheet = $('#sheet');
$$('[data-sheet-open]').forEach((b) => b.addEventListener('click', () => {
  sheet.inert = false; sheet.classList.add('open'); document.documentElement.style.overflow = 'hidden'; lenis?.stop();
  setTimeout(() => $('[data-sheet-close]', sheet)?.focus({ preventScroll: true }), 50);
}));
$$('[data-sheet-close]').forEach((b) => b.addEventListener('click', closeSheet));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && sheet?.classList.contains('open')) closeSheet(); });
function closeSheet() { if (!sheet?.classList.contains('open')) return; sheet.classList.remove('open'); sheet.inert = true; document.documentElement.style.overflow = ''; lenis?.start(); }
$$('#sheet a[href]').forEach((a) => a.addEventListener('click', () => setTimeout(closeSheet, 60)));
$$('[data-sub-toggle]').forEach((b) => b.addEventListener('click', () => { const s = b.nextElementSibling; const o = s.classList.toggle('open'); b.setAttribute('aria-expanded', String(o)); }));

// dark sections hide the corner meta
const darkIO = new IntersectionObserver((es) => {
  const any = $$('.section--ink, .footer, .journey').some((el) => { const r = el.getBoundingClientRect(); return r.top < 60 && r.bottom > 60; });
  document.body.classList.toggle('on-dark', any);
}, { threshold: [0, 0.01, 0.99, 1] });
$$('.section--ink, .footer, .journey').forEach((el) => darkIO.observe(el));
addEventListener('scroll', () => {
  const any = $$('.section--ink, .footer, .journey').some((el) => { const r = el.getBoundingClientRect(); return r.top < 60 && r.bottom > 60; });
  document.body.classList.toggle('on-dark', any);
}, { passive: true });

// ---------------------------------------------------------------- reveals, split headings, redline drawing, counters
function splitLines(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words.map((w) => `<span class="split-word" style="display:inline-block">${esc(w)}</span>`).join(' ');
  const spans = $$('.split-word', el);
  const lines = [];
  let top = null;
  spans.forEach((s) => { const t = s.offsetTop; if (top === null || Math.abs(t - top) > 4) { lines.push([]); top = t; } lines[lines.length - 1].push(s.textContent); });
  el.innerHTML = lines.map((l, i) => `<span class="split-line"><span style="--d:${(i * 0.08).toFixed(2)}s">${esc(l.join(' '))}</span></span>`).join('');
}
if (!reduce) {
  document.fonts.ready.then(() => {
    $$('[data-split]').forEach((el) => { splitLines(el); });
    const io2 = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('split-in'); io2.unobserve(e.target); } }), { threshold: 0.2 });
    $$('[data-split]').forEach((el) => io2.observe(el));
  });
}
const io = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return;
  const el = e.target;
  if (el.hasAttribute('data-reveal')) el.classList.add('in');
  if (el.hasAttribute('data-draw')) el.classList.add('drawn');
  if (el.hasAttribute('data-count')) count(el);
  io.unobserve(el);
}), { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });
$$('[data-reveal], [data-draw], [data-count]').forEach((el) => {
  if (el.hasAttribute('data-draw')) $$('path', el).forEach((p) => { try { p.style.setProperty('--len', Math.ceil(p.getTotalLength()) + 1); } catch (e) { /* ignore */ } });
  io.observe(el);
});
function count(el) {
  const end = parseFloat(el.dataset.count), dur = reduce ? 0 : 1600, t0 = performance.now();
  const fmt = (v) => (el.dataset.raw ? String(Math.round(v)) : Math.round(v).toLocaleString('en-US'));
  const step = (t) => { const k = dur ? Math.min(1, (t - t0) / dur) : 1; el.firstChild.nodeValue = fmt(end * (1 - Math.pow(1 - k, 4))); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

// ---------------------------------------------------------------- toast
const toastEl = $('#toast');
function toast(msg) { if (!toastEl) return; toastEl.textContent = msg; toastEl.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => toastEl.classList.remove('on'), 2600); }

// ---------------------------------------------------------------- quote wizard
const qd = $('#quote');
if (qd) {
  const steps = $$('.qstep', qd), bars = $$('.stepper i', qd);
  const back = $('[data-q-back]', qd), next = $('[data-q-next]', qd), form = $('form', qd);
  let i = 0;
  const show = (n) => {
    i = n;
    steps.forEach((s, k) => s.classList.toggle('on', k === n));
    bars.forEach((b, k) => b.classList.toggle('on', k <= n));
    back.hidden = n === 0 || n === steps.length - 1;
    next.hidden = n === steps.length - 1;
    const lbl = n === steps.length - 2 ? 'Send request' : 'Continue';
    next.innerHTML = `<span class="sq"></span><span class="btn__label">${lbl}</span>`;
    $('.modal__foot', qd).hidden = n === steps.length - 1;
  };
  $$('[data-quote]').forEach((b) => b.addEventListener('click', (e) => {
    e.preventDefault();
    const svc = b.dataset.quote;
    if (svc) $$('input[name="services"]', qd).forEach((c) => (c.checked = c.value === svc || c.checked));
    show(0); qd.showModal(); lenis?.stop(); closeSheet();
  }));
  qd.addEventListener('close', () => lenis?.start());
  $$('[data-q-close]', qd).forEach((b) => b.addEventListener('click', () => qd.close()));
  qd.addEventListener('click', (e) => { if (e.target === qd) qd.close(); });
  back.addEventListener('click', () => show(Math.max(0, i - 1)));
  next.addEventListener('click', async () => {
    const cur = steps[i];
    const fields = $$('input, select, textarea', cur);
    if (i === 0 && !$$('input[name="services"]:checked', qd).length) { toast('Pick at least one service'); return; }
    for (const f of fields) if (!f.checkValidity()) { f.reportValidity(); return; }
    if (i < steps.length - 2) { show(i + 1); return; }
    next.disabled = true;
    const ok = await submitForm(form, 'quote');
    next.disabled = false;
    if (ok) { $('[data-q-ref]', qd).textContent = ok.ref || ''; show(steps.length - 1); form.reset(); }
  });
}

// ---------------------------------------------------------------- forms
async function fileToData(file) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
}
async function submitForm(form, type) {
  const status = $('.form__status', form) || $('.form__status', form.closest('dialog') || document);
  const data = {};
  for (const [k, v] of new FormData(form).entries()) {
    if (v instanceof File) continue;
    if (data[k]) data[k] = [].concat(data[k], v); else data[k] = v;
  }
  if (data.company_website) return false; // honeypot
  const file = $('input[type="file"]', form)?.files?.[0];
  if (file) {
    if (file.size > 5 * 1024 * 1024) { status && (status.className = 'form__status err', status.textContent = 'Attach a file under 5 MB.'); return false; }
    data.attachment = { name: file.name, type: file.type, data: await fileToData(file) };
  }
  data.page = location.pathname;
  if (status) { status.className = 'form__status'; status.textContent = 'Sending…'; }
  try {
    const r = await fetch('/api/forms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, data }) });
    if (!r.ok) throw new Error(String(r.status));
    const j = await r.json();
    if (status) { status.className = 'form__status ok'; status.textContent = `Received — reference ${j.ref}. We'll be in touch shortly.`; }
    return j;
  } catch (err) {
    const lines = Object.entries(data).filter(([k]) => !['attachment', 'page'].includes(k)).map(([k, v]) => `${k}: ${[].concat(v).join(', ')}`).join('\n');
    const num = (SETTINGS.company || {}).whatsapp || '971506761638';
    if (status) { status.className = 'form__status err'; status.innerHTML = `The form server isn't reachable. <a href="${wa(num, `New ${type} request\n${lines}`)}" target="_blank" rel="noopener">Send it on WhatsApp instead →</a>`; }
    return false;
  }
}
$$('form[data-form]').forEach((f) => f.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = $('button[type="submit"]', f); if (btn) btn.disabled = true;
  const ok = await submitForm(f, f.dataset.form);
  if (btn) btn.disabled = false;
  if (ok) { f.reset(); toast('Sent — thank you'); }
}));
$$('.file input').forEach((inp) => inp.addEventListener('change', () => { const l = inp.closest('.file').querySelector('[data-file-label]'); if (l) l.textContent = inp.files[0] ? inp.files[0].name : 'Attach CV (PDF or Word, max 5 MB)'; }));

// ---------------------------------------------------------------- search palette
const pal = $('#palette');
let index = null, sel = 0, results = [];
async function openPalette() {
  if (!pal) return;
  pal.showModal(); lenis?.stop();
  const inp = $('input', pal); inp.value = ''; inp.focus();
  if (!index) { try { index = await (await fetch('/search-index.json')).json(); } catch (e) { index = []; } }
  render('');
}
function score(item, q) {
  const t = item.t.toLowerCase(), s = (item.s || '').toLowerCase(), k = (item.k || '').toLowerCase();
  let sc = 0;
  for (const w of q.split(/\s+/).filter(Boolean)) {
    if (t.startsWith(w)) sc += 6; else if (t.includes(w)) sc += 4; else if (k.includes(w)) sc += 2; else if (s.includes(w)) sc += 1; else return 0;
  }
  return sc;
}
function render(q) {
  const list = $('.palette__list', pal);
  q = q.trim().toLowerCase();
  results = q ? index.map((it) => [score(it, q), it]).filter(([s]) => s > 0).sort((a, b) => b[0] - a[0]).slice(0, 12).map(([, it]) => it) : index.filter((it) => it.f).slice(0, 10);
  sel = 0;
  list.innerHTML = results.length ? results.map((it, i) => `<li><a href="${it.u}" class="${i === 0 ? 'sel' : ''}"><b>${esc(it.t)}</b><span>${esc(it.s || '')}</span><em>${esc(it.c)}</em></a></li>`).join('') : `<li class="palette__empty">No pages match “${esc(q)}”. Try “sprinkler”, “AMC” or “CCTV”.</li>`;
}
if (pal) {
  const inp = $('input', pal);
  inp.addEventListener('input', () => render(inp.value));
  inp.addEventListener('keydown', (e) => {
    const links = $$('.palette__list a', pal);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
      links.forEach((l, i) => l.classList.toggle('sel', i === sel)); links[sel]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' && links[sel]) { location.href = links[sel].href; }
  });
  pal.addEventListener('click', (e) => { if (e.target === pal) pal.close(); });
  pal.addEventListener('close', () => lenis?.start());
}
$$('[data-search]').forEach((b) => b.addEventListener('click', () => { closeSheet(); openPalette(); }));
document.addEventListener('keydown', (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); } else if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); openPalette(); } });

// ---------------------------------------------------------------- doc: toc scrollspy + reading progress + share
const tocLinks = $$('.toc a[href^="#"]');
if (tocLinks.length) {
  const heads = tocLinks.map((a) => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
  const spy = () => {
    let cur = heads[0];
    for (const h of heads) if (h.getBoundingClientRect().top < 160) cur = h;
    tocLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + cur?.id));
  };
  addEventListener('scroll', spy, { passive: true }); spy();
}
const bar = $('.progress-bar');
if (bar) {
  const art = $('.article') || document.body;
  const upd = () => { const r = art.getBoundingClientRect(); const k = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight))); bar.style.transform = `scaleX(${k})`; };
  addEventListener('scroll', upd, { passive: true }); upd();
}
$$('[data-copy]').forEach((b) => b.addEventListener('click', async () => { try { await navigator.clipboard.writeText(location.href); toast('Link copied'); } catch (e) { toast(location.href); } }));
$$('[data-native-share]').forEach((b) => { if (!navigator.share) { b.remove(); return; } b.addEventListener('click', () => navigator.share({ title: document.title, url: location.href }).catch(() => {})); });

// ---------------------------------------------------------------- filters (blog, projects, jobs)
$$('[data-filter-group]').forEach((grp) => {
  const target = $(grp.dataset.filterGroup);
  $$('.filter', grp).forEach((b) => b.addEventListener('click', () => {
    $$('.filter', grp).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    const v = b.dataset.value;
    $$('[data-tags]', target).forEach((it) => { it.hidden = v !== 'all' && !it.dataset.tags.split('|').includes(v); });
  }));
});

// ---------------------------------------------------------------- FAQ: one open at a time per group
$$('.faq').forEach((g) => $$('details', g).forEach((d) => d.addEventListener('toggle', () => { if (d.open) $$('details', g).forEach((o) => o !== d && (o.open = false)); })));

// ---------------------------------------------------------------- marquee duplication
$$('[data-marquee]').forEach((t) => { t.innerHTML += t.innerHTML; $$('img', t).slice(t.children.length / 2).forEach((i) => i.setAttribute('aria-hidden', 'true')); });

// ---------------------------------------------------------------- footer year
$$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));

// ---------------------------------------------------------------- lazy 3D + map
const needs3D = $('[data-vignette], img[data-model], [data-journey]');
if (needs3D) {
  import('./fs3d.js').then(async ({ webglOK }) => {
    if (!webglOK()) { document.documentElement.classList.add('no-webgl'); return; }
    const v = await import('./vignette.js');
    $$('[data-vignette]').forEach((el) => v.mountVignette(el).catch(console.error));
    v.mountThumbs();
    const j = $('[data-journey]');
    if (j) {
      const { mountJourney } = await import('./journey.js');
      mountJourney(j).catch((e) => { console.error(e); j.classList.add('is-static'); });
    }
  }).catch(console.error);
}
const mapEl = $('[data-map]');
if (mapEl) {
  const io3 = new IntersectionObserver(async ([e]) => {
    if (!e.isIntersecting) return;
    io3.disconnect();
    await settingsReady;
    const { mountMap } = await import('./map.js');
    mountMap(mapEl, () => SETTINGS).catch(console.error);
  }, { rootMargin: '600px' });
  io3.observe(mapEl);
}

// ---------------------------------------------------------------- pointer effects (desktop)
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const lerp = (a, b, k) => a + (b - a) * k;
const root = document.documentElement;
let mouse = { x: innerWidth / 2, y: innerHeight / 2, seen: false };
let onMove = null;
const track = (x, y) => { mouse.x = x; mouse.y = y; mouse.seen = true; if (onMove) onMove(x, y); };
addEventListener('pointermove', (e) => { if (e.pointerType !== 'touch') track(e.clientX, e.clientY); }, { passive: true, capture: true });
addEventListener('mousemove', (e) => track(e.clientX, e.clientY), { passive: true, capture: true });
// a native drag (e.g. dragging selected text) stops pointer events — keep tracking via dragover
addEventListener('dragover', (e) => track(e.clientX, e.clientY), { capture: true });

// custom cursor: trailing ring, precise dot, label/link/pencil states
const cur = $('.cursor');
if (cur && fine && !reduce) {
  root.classList.add('has-cursor');
  cur.classList.add('is-out');
  const ring = $('.cursor__ring', cur), dot = $('.cursor__dot', cur), pen = $('.cursor__pencil', cur), label = $('.cursor__label', cur);
  let rx = mouse.x, ry = mouse.y, first = true, lastT = performance.now();
  // positions use the `translate` property, so the press squeeze (`scale`) shrinks the ring around its own centre
  // instead of scaling its offset from the corner of the screen
  const placeRing = () => { ring.style.translate = `${rx.toFixed(1)}px ${ry.toFixed(1)}px`; };
  // the ring trails on a short leash: even if frames stall (heavy 3D, slow device) the dot never leaves the ring
  const LEASH = 9;
  const leash = (x, y) => {
    const dx = rx - x, dy = ry - y, d = Math.hypot(dx, dy);
    if (d > LEASH) { rx = x + dx / d * LEASH; ry = y + dy / d * LEASH; return true; }
    return false;
  };
  onMove = (x, y) => {
    dot.style.translate = pen.style.translate = `${x}px ${y}px`;
    if (first) { first = false; rx = x; ry = y; cur.classList.remove('is-out'); placeRing(); return; }
    if (leash(x, y)) placeRing();
  };
  const tick = (now) => {
    const dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
    if (!first && (rx !== mouse.x || ry !== mouse.y)) {
      // frame-rate independent easing toward the pointer
      const k = 1 - Math.exp(-dt * 22);
      rx += (mouse.x - rx) * k; ry += (mouse.y - ry) * k;
      if (Math.abs(mouse.x - rx) < 0.1) rx = mouse.x; if (Math.abs(mouse.y - ry) < 0.1) ry = mouse.y;
      leash(mouse.x, mouse.y);
      placeRing();
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  const LINKS = 'a, button, summary, label, select, [role="tab"], .office, .filter, .choice, [data-quote]';
  // controls with their own hover state: the ring tucks into the dot so it never sits on top of them
  const BTNS = '.btn, .nav__icon, .nav__link, .fab__btn, .dock a, .dock button, .x, .choice, .filter, .share a, .share button, .map-ui button, .socials a, .sheet__main a, .sheet__main button';
  const DARK = '.section--ink, .footer, .cta, .mega__side, .rating, .callbig';
  const setState = (t) => {
    if (!t || !t.closest) return;
    const tagged = t.closest('[data-cursor]');
    const field = t.closest('input:not([type="checkbox"]):not([type="radio"]):not([type="file"]), textarea');
    cur.classList.toggle('is-pencil', !!field);
    const control = !field && t.closest(BTNS);
    cur.classList.toggle('is-btn', !!control);
    if (tagged && tagged.dataset.cursor && !field && !control) { label.textContent = tagged.dataset.cursor; cur.classList.add('is-label'); cur.classList.remove('is-link'); }
    else { cur.classList.remove('is-label'); cur.classList.toggle('is-link', !field && !control && !!t.closest(LINKS)); }
    cur.classList.toggle('on-dark', !!t.closest(DARK) && !t.closest('.modal'));
  };
  document.addEventListener('pointerover', (e) => setState(e.target));
  // content moving under a still pointer (scroll, menus opening) should update the state too
  let pending = false;
  const refresh = () => { if (pending || !mouse.seen) return; pending = true; requestAnimationFrame(() => { pending = false; setState(document.elementFromPoint(mouse.x, mouse.y)); }); };
  addEventListener('scroll', refresh, { passive: true, capture: true });
  addEventListener('wheel', refresh, { passive: true });
  document.addEventListener('pointerdown', () => cur.classList.add('is-down'));
  addEventListener('pointerup', () => cur.classList.remove('is-down'));
  addEventListener('blur', () => cur.classList.remove('is-down'));
  // leaving / re-entering the window
  document.addEventListener('mouseout', (e) => { if (!e.relatedTarget) cur.classList.add('is-out'); });
  document.addEventListener('mouseover', () => cur.classList.remove('is-out'));
  // native drag-and-drop: show the system cursor until it ends
  addEventListener('dragstart', () => root.classList.add('native-cursor'));
  const endDrag = () => root.classList.remove('native-cursor');
  ['dragend', 'drop', 'mouseup', 'pointerdown'].forEach((t) => addEventListener(t, endDrag, true));
  // modal dialogs render in the top layer: carry the cursor into whichever is open
  $$('dialog').forEach((d) => new MutationObserver(() => {
    if (d.open) d.appendChild(cur);
    else if (cur.parentElement === d) document.body.appendChild(cur);
    refresh();
  }).observe(d, { attributes: true, attributeFilter: ['open'] }));
}

// footer wordmark: the green fill follows the pointer (drifts on its own on touch)
const ftrSvg = $('.ftr-mark svg'), ftrGrad = $('#ftrGlow');
if (ftrSvg && ftrGrad) {
  let fx = 500, ftx = 500, run = false;
  const step = () => { fx = lerp(fx, ftx, 0.08); ftrGrad.setAttribute('cx', fx.toFixed(1)); if (run) requestAnimationFrame(step); };
  new IntersectionObserver(([e]) => { const was = run; run = e.isIntersecting; if (run && !was) requestAnimationFrame(step); }).observe(ftrSvg);
  if (fine) ftrSvg.closest('.footer').addEventListener('pointermove', (e) => { const r = ftrSvg.getBoundingClientRect(); ftx = Math.min(1150, Math.max(-150, ((e.clientX - r.left) / r.width) * 1000)); });
  else if (!reduce) { const t0 = performance.now(); setInterval(() => { ftx = 500 + Math.sin((performance.now() - t0) / 1700) * 420; }, 60); }
}

// drafting grid sheet behind the page hero: pinned under the top bar, its lower edge follows the content after
// the hero (the journey frame on the home page, the end of the page header elsewhere)
const gridSheet = $('.bgfx');
if (gridSheet) {
  const navEl = $('.nav');
  const frameEl = $('[data-journey] .journey__frame');
  const heroEl = $('.hero, .phero');
  let topY = 74, lastH = -1, queued = 0;
  const measure = () => { topY = Math.round(navEl.getBoundingClientRect().bottom + 12); gridSheet.style.setProperty('--bgfx-top', topY + 'px'); };
  const update = () => {
    queued = 0;
    const end = frameEl ? frameEl.getBoundingClientRect().top - 16 : heroEl ? heroEl.getBoundingClientRect().bottom : topY;
    const h = Math.max(0, Math.round(end - topY));
    if (h === lastH) return;
    lastH = h;
    gridSheet.style.setProperty('--bgfx-h', h + 'px');
    gridSheet.style.visibility = h > 0 ? '' : 'hidden';
  };
  const queue = () => { if (!queued) queued = requestAnimationFrame(update); };
  measure(); update();
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', () => { measure(); queue(); });
}

// phones: a band under the top bar fades content out before it reaches the bar, tinted like the section beneath
const topFade = $('.topfade');
if (topFade) {
  const mq = matchMedia('(max-width: 960px)');
  const navEl = $('.nav'), journeyEl = $('[data-journey]');
  let queued = 0, lastTint = '';
  const size = () => {
    const b = Math.round(navEl.getBoundingClientRect().bottom);
    topFade.style.setProperty('--fade-solid', b + 'px'); topFade.style.setProperty('--fade-h', b + 30 + 'px');
  };
  // the colour of whatever sits at the very top of the screen (outside the bar itself)
  const tintAt = () => {
    for (const el of document.elementsFromPoint(3, 3)) {
      if (el.closest('.nav, .cursor, .dock, .sheet')) continue;
      const c = getComputedStyle(el).backgroundColor, a = c.match(/[\d.]+/g);
      if (a && (a.length < 4 || +a[3] > 0.5)) return c;
    }
    return getComputedStyle(document.body).backgroundColor;
  };
  const update = () => {
    queued = 0;
    if (!mq.matches) return;
    const c = tintAt();
    if (c !== lastTint) { lastTint = c; topFade.style.setProperty('--under', c); }
    // the journey stage is pinned in place, so nothing slides under the bar there: the band steps aside
    let pinned = false;
    if (journeyEl) { const r = journeyEl.getBoundingClientRect(); pinned = r.top <= 0 && r.bottom >= innerHeight; }
    if (topFade.classList.contains('is-off') !== pinned) topFade.classList.toggle('is-off', pinned);
  };
  const queue = () => { if (!queued) queued = requestAnimationFrame(update); };
  size(); update();
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', () => { size(); queue(); });
}

// mobile quick-action dock: appears once the hero's own buttons scroll away, hides over the journey and footer
const dock = $('.dock');
if (dock) {
  const journey = $('[data-journey]'), foot = $('.footer');
  const upd = () => {
    const y = scrollY;
    let show = y > innerHeight * 0.55;
    if (journey) { const r = journey.getBoundingClientRect(); if (r.top < innerHeight * 0.5 && r.bottom > innerHeight * 0.5) show = false; }
    if (foot && foot.getBoundingClientRect().top < innerHeight - 40) show = false;
    if (document.documentElement.style.overflow === 'hidden') show = false;
    dock.classList.toggle('on', show);
  };
  addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();
}

window.FS = { toast, openPalette, settings: () => SETTINGS };
