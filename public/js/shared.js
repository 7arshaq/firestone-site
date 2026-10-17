// Markup shared by the static build (Node) and live hydration (browser), so
// office details edited in the admin render identically everywhere.

// Vector mark traced from the brand logo; the black half follows currentColor
export const MARK = '<svg class="mark" viewBox="0 0 700 574" aria-hidden="true" focusable="false"><path fill="#2B9D47" d="M349 0 439 147 406 200 349 106 177 391H289L258 444H143L64 574H0Z"/><path fill="currentColor" d="M461 184 567 356H502L461 291 400 391H589L699 574H115L147 520H602L556 444H302Z"/></svg>';
export const wordmark = (cls = '') => `<span class="wm ${cls}" aria-label="Firestone"><span class="wm__fire">FIRE</span>STONE</span>`;

export const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function tel(phone = '') {
  const d = String(phone).replace(/[^\d+]/g, '');
  if (d.startsWith('+')) return 'tel:' + d;
  if (d.startsWith('00')) return 'tel:+' + d.slice(2);
  if (d.startsWith('0')) return 'tel:+971' + d.slice(1);
  return 'tel:' + d;
}
export const wa = (num, text = 'Hello Firestone,') => `https://wa.me/${String(num).replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
export const gmaps = (o) => `https://www.google.com/maps/search/?api=1&query=${o.lat},${o.lng}`;
export const directions = (o) => `https://www.google.com/maps/dir/?api=1&destination=${o.lat},${o.lng}`;

export const ICON = {
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  route: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h7a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h7"/></svg>',
  wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-7.5H16l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4a21 21 0 0 0-2.3-.1c-2.3 0-3.9 1.4-3.9 4v2.2H8v3h2.5V21z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.9 8.8H3.7V20h3.2zM5.3 3.5a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8zM20.3 13.4c0-3-1.6-4.8-4.2-4.8a3.7 3.7 0 0 0-3.3 1.8V8.8H9.6V20h3.2v-5.6c0-1.5.3-2.9 2.1-2.9s1.9 1.7 1.9 3V20h3.3z"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.8 3h3.1l-6.8 7.8L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8zm-1.1 16.2h1.7L7.4 4.7H5.6z"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 8h16M4 16h16"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>',
};

// Office card in the map list (contact + home)
export function officeItem(o, i = 0) {
  return `<button class="office" role="tab" aria-selected="${i === 0}" data-office="${esc(o.id)}">
  <span class="h3">${esc(o.city)} <small>${esc(o.label || '')}</small></span>
  <p>${esc(o.address)}</p>
  <span class="lines">${(o.phones || []).map((p) => `<a href="${tel(p)}">${esc(p)}</a>`).join('')}<a href="mailto:${esc(o.email)}">${esc(o.email)}</a></span>
  <span class="acts"><a href="${directions(o)}" target="_blank" rel="noopener">${ICON.route} Directions</a><a href="${gmaps(o)}" target="_blank" rel="noopener">${ICON.pin} Google Maps</a></span>
</button>`;
}

export function footerOffice(o) {
  return `<div class="footer__office"><b>${esc(o.city)}</b><p>${esc(o.address)}</p><div class="lines">${(o.phones || []).map((p) => `<a href="${tel(p)}">${esc(p)}</a>`).join('')}<a href="mailto:${esc(o.email)}">${esc(o.email)}</a><a href="${directions(o)}" target="_blank" rel="noopener" class="green">Get directions →</a></div></div>`;
}

export function socialLinks(social = {}) {
  return ['facebook', 'instagram', 'linkedin'].filter((k) => social[k]).map((k) => `<a href="${esc(social[k])}" target="_blank" rel="noopener" aria-label="Firestone on ${k[0].toUpperCase() + k.slice(1)}" data-social="${k}">${ICON[k]}</a>`).join('');
}
