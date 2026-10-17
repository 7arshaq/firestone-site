// Page shell: head, corner meta, pill nav + mega menu, mobile sheet,
// quote wizard, search palette, cursor, floating actions and footer.
import { esc, tel, wa, ICON, MARK, wordmark, footerOffice, socialLinks } from '../public/js/shared.js';
import { MENU } from './catalog.mjs';
import { QUOTE_SERVICES } from '../content/site.mjs';

export const SITE_URL = 'https://www.firestonefs.com';
const NAV = [
  { href: '/about-us', label: 'About' },
  { mega: true, label: 'Services' },
  { href: '/blog', label: 'Blog' },
  { href: '/services/clients-and-projects', label: 'Projects' },
  { href: '/services/fire-safety-emergency-support', label: 'Emergency support' },
  { href: '/career', label: 'Career' },
];

const sq = '<span class="sq" aria-hidden="true"></span>';
// Label that rolls to a duplicate on hover
const roll = (label) => `<span class="btn__label">${label}</span>`;
export const btn = (label, { href, quote, cls = '', attrs = '' } = {}) =>
  quote !== undefined
    ? `<button type="button" class="btn btn--fx ${cls}" data-quote="${esc(quote)}" ${attrs}>${sq}${roll(label)}</button>`
    : `<a class="btn btn--fx ${cls}" href="${href}" ${attrs}>${sq}${roll(label)}</a>`;
export const waBtn = (label = 'WhatsApp us', { cls = '', text = 'Hello Firestone,' } = {}) =>
  `<a class="btn btn--wa ${cls}" href="${wa('971506761638', text)}" data-wa="${esc(text)}" target="_blank" rel="noopener">${ICON.wa}<span>${label}</span></a>`;
export const arrowLink = (label, href, attrs = '') => `<a class="link-arrow" href="${href}" ${attrs}>${label} ${ICON.arrow}</a>`;

function head({ title, description, route, settings, image, jsonld = [], noindex }) {
  const url = SITE_URL + (route === '/' ? '' : route);
  const gtm = settings.analytics?.gtm;
  const ld = jsonld.map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`).join('\n');
  return `<!doctype html>
<html lang="en" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
${noindex ? '<meta name="robots" content="noindex">' : ''}
<meta name="theme-color" content="#F6F6F6">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Firestone Fire & Security Systems">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE_URL}${image || '/img/brand/og.png'}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/img/brand/mark.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="apple-touch-icon" href="/img/brand/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600&family=Geist:wght@300..700&family=Patrick+Hand&display=swap">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@900&text=FIRESTONE&display=swap">
<link rel="stylesheet" href="/css/site.css">
<script type="importmap">{"imports":{"three":"/vendor/three.module.min.js"}}</script>
<script src="/vendor/lenis.min.js" defer></script>
<script type="module" src="/js/main.js"></script>
${gtm ? `<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${esc(gtm)}');</script>` : ''}
${ld}
</head>`;
}

function megaMenu() {
  const items = MENU.map((m) => `<a class="mega__item" href="/services/${m.slug}"><img alt="" data-model="${m.slug}" width="44" height="44" src="data:image/gif;base64,R0lGODlhAQABAAAAACw="><span><b>${esc(m.label)}</b><span>${esc(m.blurb)}</span></span></a>`).join('');
  return `<div class="mega" id="mega" role="region" aria-label="Services" data-lenis-prevent>
  <div class="mega__grid">${items}</div>
  <aside class="mega__side">
    <span class="hand">24 / 7 emergency line</span>
    <a class="callbig callbig--sm" href="tel:+971506761638" data-phone="text">+971 50 676 1638</a>
    <p>Fire alarm won’t stop, a pump has failed or a sprinkler is leaking? Call or WhatsApp — a technician is dispatched.</p>
    ${waBtn('WhatsApp the team', { cls: 'btn--sm' })}
    <a class="link-arrow all" href="/services">All services ${ICON.arrow}</a>
  </aside>
</div>`;
}

function sheetMenu() {
  const row = (href, label) => `<li><a href="${href}"><span>${label}</span>${ICON.arrow}</a></li>`;
  return `<div class="sheet" id="sheet" role="dialog" aria-modal="true" aria-label="Menu" inert data-lenis-prevent>
  <div class="sheet__top"><a class="nav__brand" href="/">${MARK}${wordmark()}</a><button class="x" data-sheet-close aria-label="Close menu">${ICON.close}</button></div>
  <ul class="sheet__main">
    ${row('/', 'Home')}${row('/about-us', 'About')}
    <li><button type="button" data-sub-toggle aria-expanded="false"><span>Services</span>${ICON.chev}</button>
      <ul class="sheet__sub">${MENU.map((m) => `<li><a href="/services/${m.slug}">${esc(m.label)}</a></li>`).join('')}<li><a href="/services"><b>All services →</b></a></li></ul></li>
    ${row('/blog', 'Blog')}${row('/services/clients-and-projects', 'Projects')}${row('/services/fire-safety-emergency-support', 'Emergency support')}${row('/career', 'Career')}${row('/contact', 'Contact')}
  </ul>
  <div class="sheet__foot">
    ${btn('Get a quote', { quote: '', cls: 'btn--lg btn--block' })}
    <div class="sheet__pair">${waBtn('WhatsApp', { cls: 'btn--lg' })}<a class="btn btn--call btn--lg" href="tel:+971506761638" data-phone>${ICON.phone}<span>Call</span></a></div>
    <button type="button" class="btn btn--ghost btn--lg btn--block" data-search>${ICON.search}<span>Search the site</span></button>
  </div>
</div>`;
}

function header(route, settings) {
  const c = settings.company;
  const cur = (href) => (route === href || (href !== '/' && route.startsWith(href + '/') && href !== '/services')) ? ' aria-current="page"' : '';
  const svcActive = route.startsWith('/services') && !['/services/clients-and-projects', '/services/fire-safety-emergency-support'].includes(route);
  return `<a class="skip" href="#main">Skip to content</a>
<div class="bgfx" aria-hidden="true"><div class="bgfx__major"></div><div class="bgfx__grid"></div></div>
<div class="cursor" aria-hidden="true"><div class="cursor__ring"><span class="cursor__label"></span></div><div class="cursor__dot"></div><svg class="cursor__pencil" viewBox="0 0 24 24"><path d="M3 21l1.5-5.5L16 4l4 4L8.5 19.5 3 21Z"/><path d="M14 6l4 4"/></svg></div>
<div class="corner corner--l" aria-hidden="true"><span class="dot"></span>Civil Defence Grade A<br>Est. 2007 · UAE-wide</div>
<div class="corner corner--r"><a class="hand" href="mailto:${esc(c.email)}" data-email="text">${esc(c.email)}</a><a href="${tel(c.primaryPhone)}" data-phone="text">${esc(c.primaryPhone)}</a> · <a href="/contact">Contact</a></div>
<div class="topfade" aria-hidden="true"></div>
<header class="nav" role="navigation" aria-label="Main">
  <a class="nav__brand" href="/" aria-label="Firestone home">${MARK}${wordmark()}</a>
  <ul class="nav__links">
    ${NAV.map((n) => n.mega
      ? `<li><button type="button" class="nav__link" data-mega-btn aria-expanded="false" aria-controls="mega"${svcActive ? ' aria-current="page"' : ''}>Services ${ICON.chev}</button></li>`
      : `<li><a class="nav__link" href="${n.href}"${cur(n.href)}>${n.label}</a></li>`).join('')}
  </ul>
  <button type="button" class="nav__icon nav__search" data-search aria-label="Search (Ctrl K)">${ICON.search}</button>
  <a class="nav__icon nav__wa" href="${wa(c.whatsapp)}" data-wa target="_blank" rel="noopener" aria-label="Chat on WhatsApp">${ICON.wa}</a>
  ${btn('Get a quote', { quote: '', cls: 'nav__quote', })}
  <button type="button" class="nav__icon nav__burger" data-sheet-open aria-label="Open menu" aria-controls="sheet">${ICON.menu}</button>
</header>
${megaMenu()}
${sheetMenu()}`;
}

export function quoteModal() {
  return `<dialog id="quote" aria-labelledby="quote-title">
<div class="modal" data-lenis-prevent>
  <form novalidate>
  <div class="modal__head"><div><span class="mono muted">Free site assessment</span><h2 id="quote-title" class="h3" style="margin-top:4px">Get a quote</h2></div><div class="modal__tools"><div class="stepper" aria-hidden="true"><i class="on"></i><i></i><i></i></div><button type="button" class="x" data-q-close aria-label="Close">${ICON.close}</button></div></div>
  <div class="modal__body">
    <div class="qstep on">
      <h3>What do you need?</h3>
      <div class="choices">${QUOTE_SERVICES.map(([v, l]) => `<label class="choice"><input type="checkbox" name="services" value="${v}"><span>${esc(l)}</span></label>`).join('')}</div>
      <div class="field"><label for="q-scope">Anything specific? <span class="muted">(optional)</span></label><textarea id="q-scope" name="details" placeholder="e.g. Istifa renewal for a 6-storey residential building, existing addressable fire alarm"></textarea></div>
      <p class="modal__alt">Prefer chatting? ${waBtn('Ask on WhatsApp instead', { cls: 'btn--sm', text: 'Hello Firestone, I would like a quote for ' })}</p>
    </div>
    <div class="qstep">
      <h3>About the property</h3>
      <div class="field"><label>Property type</label><div class="choices">${['Commercial', 'Industrial / warehouse', 'Residential', 'Hospitality', 'Healthcare', 'Education', 'Government', 'Other'].map((v, i) => `<label class="choice"><input type="radio" name="property" value="${v}" ${i === 0 ? 'checked' : ''}><span>${v}</span></label>`).join('')}</div></div>
      <div class="form">
        <div class="field"><label for="q-em">Emirate</label><select id="q-em" name="emirate"><option>Abu Dhabi</option><option>Dubai</option><option>Sharjah</option><option>Al Ain</option><option>Ajman</option><option>Ras Al Khaimah</option><option>Umm Al Quwain</option><option>Fujairah</option></select></div>
        <div class="field"><label for="q-when">Timeline</label><select id="q-when" name="timeline"><option>As soon as possible</option><option>Within a month</option><option>1–3 months</option><option>Just planning</option></select></div>
        <div class="field full"><label for="q-size">Approx. size <span class="muted">(optional)</span></label><input class="input" id="q-size" name="size" placeholder="e.g. 4 floors, 2,500 m²"></div>
      </div>
    </div>
    <div class="qstep">
      <h3>Where should we send it?</h3>
      <div class="form">
        <div class="field"><label for="q-name">Full name <em>*</em></label><input class="input" id="q-name" name="name" required autocomplete="name"></div>
        <div class="field"><label for="q-phone">Phone <em>*</em></label><input class="input" id="q-phone" name="phone" type="tel" required autocomplete="tel" placeholder="+971"></div>
        <div class="field"><label for="q-email">Email <em>*</em></label><input class="input" id="q-email" name="email" type="email" required autocomplete="email"></div>
        <div class="field"><label for="q-co">Company <span class="muted">(optional)</span></label><input class="input" id="q-co" name="company" autocomplete="organization"></div>
        <input class="hp" name="company_website" tabindex="-1" autocomplete="off" aria-hidden="true">
      </div>
      <p class="form__status" role="status"></p>
    </div>
    <div class="qstep">
      <div class="done-card"><span class="tick">${ICON.check}</span><h3>Request received</h3><p class="muted" style="margin:0;max-width:44ch">Reference <b data-q-ref></b>. Our team will call you within one business day to arrange a site assessment.</p>
      <div class="done-card__acts">${waBtn('Follow up on WhatsApp', { text: 'Hello Firestone, I just sent a quote request.' })}<button type="button" class="btn btn--ghost" data-q-close>Close</button></div></div>
    </div>
  </div>
  <div class="modal__foot"><button type="button" class="btn btn--ghost" data-q-back hidden>Back</button><span></span><button type="button" class="btn btn--fx" data-q-next><span class="sq"></span><span class="btn__label">Continue</span></button></div>
  </form>
</div>
</dialog>`;
}

function palette() {
  return `<dialog id="palette" aria-label="Search">
<div class="palette">
  <div class="palette__in">${ICON.search}<input type="search" placeholder="Search services, articles, roles…" aria-label="Search the site" autocomplete="off"><kbd>Esc</kbd></div>
  <ul class="palette__list" role="listbox" data-lenis-prevent></ul>
</div>
</dialog>`;
}

function footer(settings) {
  const c = settings.company;
  const col = (title, links) => `<div><h4>${title}</h4><ul>${links.map(([h, l]) => `<li><a href="${h}">${l}</a></li>`).join('')}</ul></div>`;
  return `<footer class="footer">
  <div class="wrap">
    <div class="footer__top">
      <div class="footer__brand">
        <a class="footer__logo" href="/" aria-label="Firestone home">${MARK}${wordmark('wm--light')}</a>
        <p>${esc(c.name)} — Civil Defence approved fire &amp; safety since ${c.since}. Design, installation, testing and maintenance across the UAE.</p>
        <div class="footer__acts">${waBtn('WhatsApp')}<a class="btn btn--call" href="tel:+971506761638" data-phone>${ICON.phone}<span>Call 24/7</span></a></div>
        <div class="socials" data-socials>${socialLinks(settings.social)}</div>
      </div>
      ${col('Company', [['/about-us', 'About us'], ['/services/clients-and-projects', 'Projects'], ['/blog', 'Blog'], ['/career', 'Career'], ['/contact', 'Contact']])}
      ${col('Services', [['/services/fire-and-safety', 'Fire protection services'], ['/services/fire-alarm', 'Fire alarm'], ['/services/gas-system', 'Gas systems'], ['/services/fire-sealant-and-fire-stopping', 'Fire sealant & stopping'], ['/services/security-and-elv-systems', 'Security & ELV'], ['/services/smoke-management-systems', 'Smoke management'], ['/services/emergency-evacuation-plan', 'Evacuation plan']])}
      ${col('Compliance & AMC', [['/services/civil-defense-compliance', 'Civil Defence compliance'], ['/services/istifa-certificate-uae', 'Istifa certificate'], ['/services/annual-maintenance-contract-abu-dhabi', 'AMC Abu Dhabi'], ['/services/fire-amc-dubai', 'AMC Dubai'], ['/services/fire-amc-sharjah', 'AMC Sharjah'], ['/services/fire-safety-emergency-support', '24/7 emergency support']])}
    </div>
    <div class="footer__offices" data-offices="footer">${settings.offices.map(footerOffice).join('')}</div>
  </div>
  <div class="wrap ftr-mark" aria-hidden="true"><svg viewBox="0 0 1000 128" preserveAspectRatio="xMidYMid meet"><defs><radialGradient id="ftrGlow" gradientUnits="userSpaceOnUse" cx="500" cy="64" r="230"><stop offset="0" stop-color="#2B9D47"/><stop offset=".38" stop-color="#2B9D47"/><stop offset="1" stop-color="#2B9D47" stop-opacity="0"/></radialGradient></defs><text class="base" x="500" y="120" text-anchor="middle" textLength="996" lengthAdjust="spacingAndGlyphs">FIRESTONE</text><text class="glow" x="500" y="120" text-anchor="middle" textLength="996" lengthAdjust="spacingAndGlyphs">FIRESTONE</text></svg></div>
  <div class="wrap footer__legal"><span>© <span data-year>2026</span> ${esc(c.name)}. All rights reserved.</span><span><a href="/sitemap.xml">Sitemap</a> · <a href="${esc(c.googleReviewUrl)}" target="_blank" rel="noopener">Review us on Google</a></span></div>
</footer>
<div class="fab" aria-label="Quick contact">
  <a class="fab__btn fab__btn--wa" href="${wa(c.whatsapp)}" data-wa target="_blank" rel="noopener" aria-label="Chat on WhatsApp">${ICON.wa}<i class="live" aria-hidden="true"></i><span class="fab__label">WhatsApp · replies fast</span></a>
  <a class="fab__btn fab__btn--call" href="tel:+971506761638" data-phone aria-label="Call Firestone 24/7">${ICON.phone}<span class="fab__label">Call 24/7</span></a>
</div>
<div class="dock" aria-label="Quick actions">
  <button type="button" class="dock__quote" data-quote=""><span class="sq" aria-hidden="true"></span>Get a quote</button>
  <a class="dock__ic dock__ic--wa" href="${wa(c.whatsapp)}" data-wa target="_blank" rel="noopener" aria-label="WhatsApp">${ICON.wa}</a>
  <a class="dock__ic dock__ic--call" href="tel:+971506761638" data-phone aria-label="Call">${ICON.phone}</a>
</div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>`;
}

export function page({ route, title, description, body, settings, jsonld, noindex, image }) {
  const publicSettings = { company: settings.company, social: settings.social, offices: settings.offices };
  return `${head({ title, description, route, settings, jsonld, noindex, image })}
<body>
${settings.analytics?.gtm ? `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${esc(settings.analytics.gtm)}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>` : ''}
${header(route, settings)}
<main id="main">
${body}
</main>
${footer(settings)}
${quoteModal()}
${palette()}
<script type="application/json" id="fs-settings">${JSON.stringify(publicSettings).replace(/</g, '\\u003c')}</script>
</body>
</html>`;
}
