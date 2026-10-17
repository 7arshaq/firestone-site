// Firestone admin: offices + map pins, contact/social details, form inbox.
import { mapStyle, pinEl } from '/js/map.js';
import { esc } from '/js/shared.js';
import { mdToBlocks, readMinutes, slugify } from '/js/md.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
let S = null;          // working copy of settings
let saved = '';        // JSON of last saved settings
let sel = 0;           // selected office index
let map, markers = [];
let inbox = [], filter = 'all';

const toastEl = $('#toast');
function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => toastEl.classList.remove('on'), 2800); }

async function api(path, opts = {}) {
  const r = await fetch(path, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, ...opts, body: opts.body ? JSON.stringify(opts.body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && !path.endsWith('/login')) { showLogin(); throw new Error('Sign in required'); }
  if (!r.ok) throw new Error(j.error || 'Request failed (' + r.status + ')');
  return j;
}

// ---------------------------------------------------------------- auth
function showLogin() { $('#app').hidden = true; $('#login').hidden = false; $('#pw').focus(); }
$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const st = $('#login-status');
  st.className = 'form__status'; st.textContent = 'Signing in…';
  try {
    const r = await api('/api/admin/login', { method: 'POST', body: { password: $('#pw').value } });
    $('#pw').value = ''; st.textContent = '';
    await start(r.mustChange);
  } catch (err) { st.className = 'form__status err'; st.textContent = err.message; }
});
$('#logout').addEventListener('click', async () => { await api('/api/admin/logout', { method: 'POST' }).catch(() => {}); location.reload(); });

async function start(mustChange) {
  S = await api('/api/admin/settings');
  saved = JSON.stringify(S);
  $('#login').hidden = true; $('#app').hidden = false;
  $('#must-change').hidden = !mustChange;
  fillForms(); renderList(); selectOffice(0); initMap(); loadInbox();
}
(async () => {
  try { const me = await api('/api/admin/me'); await start(me.mustChange); } catch (e) { showLogin(); }
})();

// ---------------------------------------------------------------- tabs + dirty state
$$('.tabs [data-tab]').forEach((b) => b.addEventListener('click', () => go(b.dataset.tab)));
$$('[data-goto]').forEach((b) => b.addEventListener('click', () => go(b.dataset.goto)));
function go(tab) {
  $$('.tabs [data-tab]').forEach((x) => x.setAttribute('aria-selected', String(x.dataset.tab === tab)));
  $$('.panel').forEach((p) => p.classList.toggle('on', p.dataset.panel === tab));
  if (tab === 'offices') setTimeout(() => map?.resize(), 30);
  if (tab === 'inbox') loadInbox();
  if (tab === 'articles' && !postsLoaded) loadPosts();
  if (tab === 'photos') renderPhotos();
}
function markDirty() { $('#dirty').hidden = JSON.stringify(S) === saved; }
addEventListener('beforeunload', (e) => { if (S && JSON.stringify(S) !== saved) { e.preventDefault(); e.returnValue = ''; } });

$('#save').addEventListener('click', async () => {
  try {
    const r = await api('/api/admin/settings', { method: 'PUT', body: S });
    S = r.settings; saved = JSON.stringify(S); markDirty();
    renderList(); selectOffice(Math.min(sel, S.offices.length - 1)); placeMarkers(); renderPhotos();
    toast('Saved — the live site is updated');
  } catch (err) { toast(err.message); }
});

// ---------------------------------------------------------------- dotted-path forms (contact, settings)
const getPath = (o, p) => p.split('.').reduce((a, k) => a?.[k], o);
const setPath = (o, p, v) => { const ks = p.split('.'); let a = o; ks.slice(0, -1).forEach((k) => (a = a[k] ??= {})); a[ks.at(-1)] = v; };
function fillForms() {
  $$('#contact-form [name], #settings-form [name]').forEach((inp) => { inp.value = getPath(S, inp.name) ?? ''; });
  updateTests();
}
$$('#contact-form, #settings-form').forEach((f) => f.addEventListener('input', (e) => {
  const inp = e.target; if (!inp.name) return;
  setPath(S, inp.name, inp.name === 'company.rating' ? inp.value : inp.value);
  updateTests(); markDirty();
}));
function updateTests() { $$('[data-test]').forEach((a) => { const v = getPath(S, a.dataset.test); a.href = v || '#'; a.toggleAttribute('aria-disabled', !v); }); }

// ---------------------------------------------------------------- offices list + form
function renderList() {
  $('#office-list').innerHTML = S.offices.map((o, i) => `<li><button type="button" data-i="${i}" ${i === sel ? 'aria-current="true"' : ''}><b>${esc(o.city || 'Untitled')}</b><span>${esc(o.label || '')}${o.label ? ' · ' : ''}${Number(o.lat).toFixed(4)}, ${Number(o.lng).toFixed(4)}</span></button></li>`).join('');
}
$('#office-list').addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (b) { selectOffice(+b.dataset.i); flyTo(sel); } });
const F = $('#office-form');
function selectOffice(i) {
  sel = Math.max(0, i);
  const o = S.offices[sel];
  if (!o) { F.hidden = true; return; }
  F.hidden = false;
  F.city.value = o.city || ''; F.label.value = o.label || ''; F.address.value = o.address || '';
  F.phones.value = (o.phones || []).join('\n'); F.email.value = o.email || ''; F.lat.value = o.lat; F.lng.value = o.lng;
  $('#results').innerHTML = '';
  renderList(); highlight();
}
F.addEventListener('input', (e) => {
  const o = S.offices[sel]; if (!o) return;
  const n = e.target.name;
  if (n === 'phones') o.phones = F.phones.value.split('\n').map((x) => x.trim()).filter(Boolean);
  else if (n === 'lat' || n === 'lng') { const v = parseFloat(F[n].value); if (isFinite(v)) { o[n] = v; moveMarker(sel); } }
  else if (n) o[n] = F[n].value;
  if (n === 'city' && !o.id) o.id = o.city.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  renderList(); markDirty();
  if (n === 'city') { const el = markers[sel]?.getElement().querySelector('.pin__label'); if (el) el.textContent = o.city; }
});
function setLatLng(lat, lng, fly = true) {
  const o = S.offices[sel]; if (!o) return;
  o.lat = Math.round(lat * 1e6) / 1e6; o.lng = Math.round(lng * 1e6) / 1e6;
  F.lat.value = o.lat; F.lng.value = o.lng;
  moveMarker(sel); renderList(); markDirty();
  if (fly) flyTo(sel);
}
$('#add-office').addEventListener('click', () => {
  const c = map ? map.getCenter() : { lat: 24.45, lng: 54.38 };
  S.offices.push({ id: 'office-' + (S.offices.length + 1), city: 'New office', label: 'Branch', address: '', phones: [], email: S.company.email, lat: +c.lat.toFixed(6), lng: +c.lng.toFixed(6) });
  placeMarkers(); selectOffice(S.offices.length - 1); markDirty(); F.city.select();
});
$('#remove').addEventListener('click', () => {
  const o = S.offices[sel]; if (!o) return;
  if (S.offices.length <= 1) { toast('Keep at least one office'); return; }
  if (!confirm(`Remove the ${o.city} office from the website? (Takes effect when you Save & publish.)`)) return;
  S.offices.splice(sel, 1); placeMarkers(); selectOffice(Math.max(0, sel - 1)); markDirty();
});
$('#up').addEventListener('click', () => move(-1));
$('#down').addEventListener('click', () => move(1));
function move(d) {
  const j = sel + d; if (j < 0 || j >= S.offices.length) return;
  [S.offices[sel], S.offices[j]] = [S.offices[j], S.offices[sel]];
  placeMarkers(); selectOffice(j); markDirty();
}

// ---------------------------------------------------------------- Google Maps link / coordinates
export function parseCoords(text) {
  const t = decodeURIComponent(String(text || '')).trim();
  const pats = [/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/, /@(-?\d+\.\d+),(-?\d+\.\d+)/, /[?&](?:q|query|ll|destination|center)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/, /^\s*(-?\d{1,2}\.\d+)\s*[, ]\s*(-?\d{1,3}\.\d+)\s*$/];
  for (const re of pats) { const m = t.match(re); if (m) { const lat = +m[1], lng = +m[2]; if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng }; } }
  return null;
}
$('#apply-gmaps').addEventListener('click', async () => {
  const v = $('#o-gmaps').value.trim(); if (!v) return;
  let c = parseCoords(v);
  if (!c && /^https?:\/\/(maps\.app\.goo\.gl|goo\.gl|g\.co|maps\.google\.|www\.google\.)/i.test(v)) {
    try { const r = await api('/api/admin/resolve-map', { method: 'POST', body: { url: v } }); c = parseCoords(r.url); } catch (e) { /* fall through */ }
  }
  if (!c) { toast('No coordinates found in that link — open the place in Google Maps and copy the link from the address bar.'); return; }
  setLatLng(c.lat, c.lng); $('#o-gmaps').value = ''; toast('Pin moved — remember to Save & publish');
});
$('#o-gmaps').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); $('#apply-gmaps').click(); } });

// address search (OpenStreetMap Nominatim)
async function search() {
  const q = $('#o-search').value.trim(); if (!q) return;
  const ul = $('#results'); ul.innerHTML = '<li class="muted">Searching…</li>';
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=6&countrycodes=ae&q=${encodeURIComponent(q)}`, { headers: { Accept: 'application/json' } });
    const list = await r.json();
    ul.innerHTML = list.length ? list.map((x) => `<li><button type="button" data-lat="${x.lat}" data-lng="${x.lon}">${esc(x.display_name)}</button></li>`).join('') : '<li class="muted">No results — try a landmark or area name, or paste a Google Maps link.</li>';
  } catch (e) { ul.innerHTML = '<li class="muted">Search is unavailable right now — paste a Google Maps link instead.</li>'; }
}
$('#do-search').addEventListener('click', search);
$('#o-search').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); search(); } });
$('#results').addEventListener('click', (e) => { const b = e.target.closest('[data-lat]'); if (b) { setLatLng(+b.dataset.lat, +b.dataset.lng); $('#results').innerHTML = ''; } });

// ---------------------------------------------------------------- map
function initMap() {
  if (map || !window.maplibregl) { if (!window.maplibregl) setTimeout(initMap, 200); return; }
  const gl = window.maplibregl;
  map = new gl.Map({ container: 'map', style: mapStyle, center: [S.offices[0]?.lng || 54.4, S.offices[0]?.lat || 24.4], zoom: 8, pitch: 30 });
  map.addControl(new gl.NavigationControl({ visualizePitch: true }), 'bottom-right');
  map.on('load', () => { placeMarkers(); fit(); });
  map.on('click', (e) => { if (S.offices[sel]) setLatLng(e.lngLat.lat, e.lngLat.lng, false); });
  $('#fit').addEventListener('click', fit);
}
function placeMarkers() {
  if (!map) return;
  markers.forEach((m) => m.remove());
  markers = S.offices.map((o, i) => {
    const el = pinEl(o); el.classList.add('pin--edit');
    el.addEventListener('click', (ev) => { ev.stopPropagation(); selectOffice(i); });
    const m = new window.maplibregl.Marker({ element: el, draggable: true, anchor: 'center' }).setLngLat([o.lng, o.lat]).addTo(map);
    m.on('dragstart', () => selectOffice(i));
    m.on('dragend', () => { const ll = m.getLngLat(); sel = i; setLatLng(ll.lat, ll.lng, false); });
    return m;
  });
  highlight();
}
function moveMarker(i) { const o = S.offices[i]; if (markers[i] && isFinite(o.lat) && isFinite(o.lng)) markers[i].setLngLat([o.lng, o.lat]); }
function highlight() { markers.forEach((m, i) => m.getElement().classList.toggle('is-active', i === sel)); }
function flyTo(i) { const o = S.offices[i]; if (map && o) map.flyTo({ center: [o.lng, o.lat], zoom: 15.5, pitch: 50, speed: 1.2 }); }
function fit() {
  if (!map || !S.offices.length) return;
  const b = new window.maplibregl.LngLatBounds(); S.offices.forEach((o) => b.extend([o.lng, o.lat]));
  map.fitBounds(b, { padding: 80, pitch: 30, duration: 900, maxZoom: 13 });
}

// ---------------------------------------------------------------- inbox
async function loadInbox() {
  try { inbox = await api('/api/admin/submissions'); } catch (e) { return; }
  const n = inbox.filter((x) => x.status === 'new').length;
  $('#inbox-count').textContent = n || '';
  renderInbox();
}
$('#refresh').addEventListener('click', loadInbox);
$$('#inbox-filters .filter').forEach((b) => b.addEventListener('click', () => { filter = b.dataset.f; $$('#inbox-filters .filter').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); renderInbox(); }));
const label = { quote: 'Quote', contact: 'Message', career: 'Application' };
const fmt = (iso) => new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
function renderInbox() {
  const list = inbox.filter((x) => filter === 'all' || x.type === filter || (filter === 'new' && x.status === 'new'));
  $('#inbox').innerHTML = list.length ? list.map((x) => `<details class="msg ${x.status === 'new' ? 'is-new' : ''}" data-id="${x.id}">
    <summary><span class="type ${x.type}">${label[x.type] || x.type}</span><b>${esc(x.name)}</b><a href="tel:${esc(x.phone)}" class="hide-sm">${esc(x.phone)}</a><a href="mailto:${esc(x.email)}" class="hide-sm">${esc(x.email)}</a><span class="when">${fmt(x.createdAt)}</span><span class="mono muted">${esc(x.ref)}</span></summary>
    <div class="msg__body">
      <dl>${Object.entries(x.fields || {}).filter(([, v]) => v).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}${x.attachment ? `<dt>CV</dt><dd><a href="/api/admin/uploads/${esc(x.attachment.file)}">${esc(x.attachment.name)}</a> (${Math.round(x.attachment.size / 1024)} KB)</dd>` : ''}</dl>
      <div class="msg__acts">
        <a class="btn btn--ghost btn--icon" href="tel:${esc(x.phone)}">Call</a>
        <a class="btn btn--ghost btn--icon" href="https://wa.me/${esc((x.phone || '').replace(/\D/g, '').replace(/^0/, '971'))}" target="_blank" rel="noopener">WhatsApp</a>
        <a class="btn btn--ghost btn--icon" href="mailto:${esc(x.email)}?subject=${encodeURIComponent('Re: your Firestone ' + (label[x.type] || '').toLowerCase() + ' ' + x.ref)}">Email</a>
        <select data-status aria-label="Status">${['new', 'read', 'done'].map((s) => `<option value="${s}" ${x.status === s ? 'selected' : ''}>${s === 'new' ? 'New' : s === 'read' ? 'In progress' : 'Done'}</option>`).join('')}</select>
        <button class="btn btn--ghost btn--icon danger" type="button" data-del>Delete</button>
      </div>
    </div>
  </details>`).join('') : `<div class="empty">${inbox.length ? 'Nothing in this view.' : 'No submissions yet. Quote requests, messages and job applications from the website will appear here.'}</div>`;
}
$('#inbox').addEventListener('toggle', async (e) => {
  const d = e.target; if (!d.open) return;
  const x = inbox.find((i) => i.id === d.dataset.id);
  if (x && x.status === 'new') { await api('/api/admin/submissions/' + x.id, { method: 'PATCH', body: { status: 'read' } }).catch(() => {}); x.status = 'read'; d.classList.remove('is-new'); d.querySelector('[data-status]').value = 'read'; $('#inbox-count').textContent = inbox.filter((i) => i.status === 'new').length || ''; }
}, true);
$('#inbox').addEventListener('change', async (e) => {
  if (!e.target.matches('[data-status]')) return;
  const id = e.target.closest('.msg').dataset.id;
  await api('/api/admin/submissions/' + id, { method: 'PATCH', body: { status: e.target.value } });
  inbox.find((i) => i.id === id).status = e.target.value; toast('Status updated');
});
$('#inbox').addEventListener('click', async (e) => {
  if (!e.target.matches('[data-del]')) return;
  const d = e.target.closest('.msg'); const x = inbox.find((i) => i.id === d.dataset.id);
  if (!confirm(`Delete ${label[x.type].toLowerCase()} ${x.ref} from ${x.name}? This can’t be undone.`)) return;
  await api('/api/admin/submissions/' + x.id, { method: 'DELETE' });
  inbox = inbox.filter((i) => i.id !== x.id); renderInbox(); toast('Deleted');
});
$('#csv').addEventListener('click', () => {
  const keys = [...new Set(inbox.flatMap((x) => Object.keys(x.fields || {})))];
  const head = ['ref', 'type', 'status', 'createdAt', 'name', 'phone', 'email', ...keys];
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = inbox.map((x) => [x.ref, x.type, x.status, x.createdAt, x.name, x.phone, x.email, ...keys.map((k) => x.fields?.[k])].map(q).join(','));
  const blob = new Blob([[head.join(','), ...rows].join('\n')], { type: 'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `firestone-submissions-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
});

// ---------------------------------------------------------------- password
$('#pw-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const st = $('#pw-status');
  try {
    await api('/api/admin/password', { method: 'POST', body: { current: $('#pw-cur').value, next: $('#pw-new').value } });
    st.className = 'form__status ok'; st.textContent = 'Password updated.'; e.target.reset(); $('#must-change').hidden = true;
  } catch (err) { st.className = 'form__status err'; st.textContent = err.message; }
});

// ---------------------------------------------------------------- articles
let postsLoaded = false, allPosts = [], cur = null, coverUrl = '';
const PF = $('#post-form');
async function loadPosts(selectSlug) {
  const r = await api('/api/admin/posts');
  postsLoaded = true;
  const own = new Map(r.posts.map((p) => [p.slug, p]));
  const list = [];
  r.posts.filter((p) => !p.hidden).forEach((p) => list.push({ ...p, source: r.imported.some((i) => i.slug === p.slug) ? 'edited' : 'new' }));
  r.imported.filter((i) => !own.has(i.slug)).forEach((i) => list.push({ ...i, source: 'imported' }));
  allPosts = list;
  $('#cats').innerHTML = [...new Set(list.map((p) => p.category).filter(Boolean))].map((c) => `<option value="${esc(c)}">`).join('');
  const pick = list.find((p) => p.slug === selectSlug) || list[0];
  if (pick) openPost(pick); else newPost();
}
function renderPostList() {
  const q = $('#post-search').value.trim().toLowerCase();
  const tag = (p) => (p.source === 'new' ? 'New' : p.source === 'edited' ? 'Edited' : 'From old site') + (p.published === false ? ' · draft' : '');
  $('#post-list').innerHTML = allPosts.filter((p) => !q || p.title.toLowerCase().includes(q)).map((p) => `<li><button type="button" data-slug="${esc(p.slug)}" ${cur && cur.slug === p.slug ? 'aria-current="true"' : ''}><b>${esc(p.title)}</b><span class="${p.source === 'new' ? 'tag-new' : ''}">${tag(p)}</span></button></li>`).join('') || '<li class="muted" style="padding:12px">No articles match.</li>';
}
$('#post-search').addEventListener('input', renderPostList);
$('#post-list').addEventListener('click', (e) => { const b = e.target.closest('[data-slug]'); if (b) openPost(allPosts.find((p) => p.slug === b.dataset.slug)); });
function openPost(p) {
  cur = p; coverUrl = p.cover || '';
  PF.title.value = p.title || ''; PF.slug.value = p.slug || ''; PF.category.value = p.category || ''; PF.author.value = p.author || '';
  PF.date.value = /^\d{4}-\d{2}-\d{2}/.test(p.date || '') ? p.date.slice(0, 10) : ''; PF.read.value = p.read || ''; PF.excerpt.value = p.excerpt || ''; PF.body.value = p.body || '';
  $('#p-pub').checked = p.published !== false;
  $('#p-view').href = '/blog/' + p.slug; $('#p-view').hidden = false; $('#p-del').hidden = false;
  $('#p-status').textContent = '';
  showCover(); renderPostList(); preview();
}
function newPost() {
  cur = { slug: '', source: 'draft' }; coverUrl = '';
  PF.reset(); PF.date.value = new Date().toISOString().slice(0, 10); $('#p-pub').checked = true;
  $('#p-view').hidden = true; $('#p-del').hidden = true; $('#p-status').textContent = '';
  showCover(); renderPostList(); preview(); PF.title.focus();
}
$('#new-post').addEventListener('click', newPost);
PF.title.addEventListener('input', () => { if (!cur.slug || cur.source === 'draft') PF.slug.value = slugify(PF.title.value); });
PF.addEventListener('input', preview);
function showCover() { $('#cover-prev').innerHTML = coverUrl ? `<img src="${esc(coverUrl)}" alt="">` : '<span class="muted">No cover — a matching drawing will be used</span>'; }
async function upload(file) {
  if (file.size > 6 * 1024 * 1024) throw new Error('Use an image under 6 MB.');
  const data = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
  return (await api('/api/admin/media', { method: 'POST', body: { data } })).url;
}
$('#cover-file').addEventListener('change', async (e) => { const f = e.target.files[0]; if (!f) return; try { coverUrl = await upload(f); showCover(); toast('Cover uploaded'); } catch (err) { toast(err.message); } e.target.value = ''; });
$('#cover-clear').addEventListener('click', () => { coverUrl = ''; showCover(); });
function wrapSel(before, after = '', placeholder = '') {
  const ta = PF.body, a = ta.selectionStart, b = ta.selectionEnd, sel = ta.value.slice(a, b) || placeholder;
  ta.setRangeText(before + sel + after, a, b, 'end'); ta.focus(); preview();
}
$$('[data-md]').forEach((btn) => btn.addEventListener('click', () => {
  const k = btn.dataset.md;
  if (k === 'h') wrapSel('\n## ', '\n', 'Section heading');
  if (k === 'b') wrapSel('**', '**', 'bold text');
  if (k === 'i') wrapSel('*', '*', 'italic text');
  if (k === 'link') { const u = prompt('Link address (https://… or /services/…)'); if (u) wrapSel('[', `](${u})`, 'link text'); }
  if (k === 'ul') wrapSel('\n- ', '\n- ', 'First point');
  if (k === 'quote') wrapSel('\n> ', '\n', 'A line worth highlighting');
  if (k === 'faq') wrapSel('\nQ: ', '\nA: Answer goes here.\n', 'Question?');
}));
$('#body-img').addEventListener('change', async (e) => { const f = e.target.files[0]; if (!f) return; try { const url = await upload(f); wrapSel(`\n![${f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')}](${url})\n`); } catch (err) { toast(err.message); } e.target.value = ''; });
function preview() {
  $('#pv-title').textContent = PF.title.value || 'Untitled article';
  const html = mdToBlocks(PF.body.value).map((b) => {
    if (b.t === 'h') return `<h2 class="blk-h">${b.text}</h2>`;
    if (b.t === 'p') return `<p class="blk">${b.text}</p>`;
    if (b.t === 'ul') return `<ul class="checks">${b.items.map((x) => `<li>${x}</li>`).join('')}</ul>`;
    if (b.t === 'quote') return `<blockquote class="blk-quote"><p>${b.text}</p></blockquote>`;
    if (b.t === 'image') return `<figure class="blk-fig"><img src="${esc(b.src)}" alt=""><figcaption>${esc(b.alt)}</figcaption></figure>`;
    if (b.t === 'faq') return `<div class="faq">${b.items.map((x) => `<details open><summary>${x.q}</summary><div class="ans"><p>${x.a}</p></div></details>`).join('')}</div>`;
    return '';
  }).join('');
  $('#post-preview').innerHTML = html || '<p class="muted">The article preview appears here as you type.</p>';
  if (!PF.read.value) PF.read.placeholder = `auto · ${readMinutes(PF.body.value)} min read`;
}
PF.addEventListener('submit', async (e) => {
  e.preventDefault();
  const st = $('#p-status');
  const body = { title: PF.title.value, slug: PF.slug.value || slugify(PF.title.value), category: PF.category.value, author: PF.author.value, date: PF.date.value, read: PF.read.value, excerpt: PF.excerpt.value, cover: coverUrl, body: PF.body.value, published: $('#p-pub').checked };
  st.className = 'form__status full'; st.textContent = 'Publishing…';
  try {
    const r = await api('/api/admin/posts/' + encodeURIComponent(cur.slug || body.slug), { method: 'PUT', body });
    st.className = 'form__status full ok'; st.textContent = 'Published — the article is live.';
    toast('Article published'); await loadPosts(r.post.slug);
  } catch (err) { st.className = 'form__status full err'; st.textContent = err.message; }
});
$('#p-del').addEventListener('click', async () => {
  if (!cur?.slug || !confirm(`Remove “${PF.title.value}” from the website?`)) return;
  try { await api('/api/admin/posts/' + encodeURIComponent(cur.slug), { method: 'DELETE' }); toast('Article removed'); await loadPosts(); } catch (err) { toast(err.message); }
});

// ---------------------------------------------------------------- about-page photos
const photos = () => ((S.about ??= {}).collage ??= []);
function renderPhotos() {
  const list = photos();
  $('#photo-list').innerHTML = list.length ? list.map((p, i) => `<li class="photo" data-i="${i}">
    <div class="photo__img"><span class="photo__n">${i + 1}</span><img src="${esc(p.duo || p.full)}" alt=""><img class="full" src="${esc(p.full)}" alt=""></div>
    <div class="photo__body">
      <input class="input" data-cap value="${esc(p.caption || '')}" placeholder="Caption (optional)" maxlength="80" aria-label="Caption for photo ${i + 1}">
      <div class="photo__acts"><span style="display:flex;gap:4px"><button class="btn btn--ghost" type="button" data-mv="-1" aria-label="Move earlier" ${i === 0 ? 'disabled' : ''}>←</button><button class="btn btn--ghost" type="button" data-mv="1" aria-label="Move later" ${i === list.length - 1 ? 'disabled' : ''}>→</button></span><button class="btn btn--ghost danger" type="button" data-rm>Remove</button></div>
    </div></li>`).join('') : '<li class="empty" style="grid-column:1/-1">No photos yet — add some to show the collage on the About page.</li>';
}
$('#photo-list').addEventListener('input', (e) => { if (!e.target.matches('[data-cap]')) return; photos()[+e.target.closest('.photo').dataset.i].caption = e.target.value; markDirty(); });
$('#photo-list').addEventListener('click', (e) => {
  const li = e.target.closest('.photo'); if (!li) return;
  const i = +li.dataset.i, list = photos();
  if (e.target.closest('[data-rm]')) { if (!confirm('Remove this photo from the About page?')) return; list.splice(i, 1); }
  const mv = e.target.closest('[data-mv]');
  if (mv) { const j = i + +mv.dataset.mv; if (j < 0 || j >= list.length) return; [list[i], list[j]] = [list[j], list[i]]; }
  renderPhotos(); markDirty();
});
// resize and make the green duotone version in the browser, then upload both
function loadImg(file) { return new Promise((res, rej) => { const u = URL.createObjectURL(file); const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = u; }); }
const toBlobData = (cv, q = 0.82) => new Promise((res) => cv.toBlob((b) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(b); }, 'image/webp', q));
async function processPhoto(file) {
  const im = await loadImg(file);
  const k = Math.min(1, 1600 / Math.max(im.naturalWidth, im.naturalHeight));
  const w = Math.round(im.naturalWidth * k), h = Math.round(im.naturalHeight * k);
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const cx = cv.getContext('2d'); cx.drawImage(im, 0, 0, w, h);
  const full = await toBlobData(cv);
  const data = cx.getImageData(0, 0, w, h), px = data.data, hist = new Uint32Array(256);
  for (let i = 0; i < px.length; i += 4) { const l = (px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114) | 0; px[i + 3] = l; hist[l]++; }
  const total = w * h; let lo = 0, hi = 255, a = 0;
  for (; lo < 255; lo++) { a += hist[lo]; if (a > total * 0.02) break; }
  for (a = 0; hi > 0; hi--) { a += hist[hi]; if (a > total * 0.02) break; }
  const K = [8, 8, 8], G = [43, 157, 71], P = [246, 246, 246], mid = 110 / 255;
  for (let i = 0; i < px.length; i += 4) {
    const t = Math.min(1, Math.max(0, (px[i + 3] - lo) / Math.max(1, hi - lo)));
    const [A, B, u] = t < mid ? [K, G, t / mid] : [G, P, (t - mid) / (1 - mid)];
    px[i] = A[0] + (B[0] - A[0]) * u; px[i + 1] = A[1] + (B[1] - A[1]) * u; px[i + 2] = A[2] + (B[2] - A[2]) * u; px[i + 3] = 255;
  }
  cx.putImageData(data, 0, 0);
  const duo = await toBlobData(cv, 0.8);
  const up = async (d) => (await api('/api/admin/media', { method: 'POST', body: { data: d } })).url;
  return { full: await up(full), duo: await up(duo), caption: '' };
}
$('#photo-files').addEventListener('change', async (e) => {
  const files = [...e.target.files]; e.target.value = '';
  const st = $('#photo-status');
  for (let n = 0; n < files.length; n++) {
    st.className = 'form__status'; st.textContent = `Preparing photo ${n + 1} of ${files.length}…`;
    try { photos().push(await processPhoto(files[n])); renderPhotos(); markDirty(); }
    catch (err) { st.className = 'form__status err'; st.textContent = `${files[n].name}: ${err.message || 'could not read this image'}`; return; }
  }
  st.className = 'form__status ok'; st.textContent = `Added ${files.length} photo${files.length > 1 ? 's' : ''} — press Save & publish to put them live.`;
});
