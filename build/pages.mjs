// Page templates.
import { esc, tel, wa, ICON, officeItem, gmaps } from '../public/js/shared.js';
import { btn, waBtn, arrowLink, SITE_URL } from './layout.mjs';
import { renderBlocks, splitHero, card, faqList, PIXEL, slugify, modelFor } from './blocks.mjs';
import { MENU, HUBS, PARENT, LABEL, MODEL, NOTES, FAMILY } from './catalog.mjs';
import * as S from '../content/site.mjs';

const plain = (s = '') => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();
const thumb = (model, alt = '') => `<img src="${PIXEL}" data-model="${model}" alt="${esc(alt)}" loading="lazy" width="640" height="480">`;
const postArt = (p) => (p.cover ? `<img class="cover-img" src="${esc(p.cover)}" alt="" loading="lazy">` : p.model ? thumb(p.model) : `<div class="cover-type" aria-hidden="true"><b>${esc((p.catLabel || 'Fire safety').split(' ')[0])}</b><span>${esc(p.read || 'Firestone journal')}</span></div>`);

// hand-drawn redline svgs
const underline = (w = 150) => `<svg width="${w}" height="12" viewBox="0 0 ${w} 12" style="left:0;top:100%" aria-hidden="true"><path class="g" d="M2 8 C ${w * 0.3} 2, ${w * 0.6} 11, ${w - 2} 4"/></svg>`;
const arrowR = `<svg width="46" height="22" viewBox="0 0 46 22" style="left:-52px;top:-2px" aria-hidden="true"><path d="M2 14 C 14 4, 28 4, 42 11 M34 4 L43 11 L33 16"/></svg>`;
const circle = (w, h) => `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="left:-10px;top:-8px" aria-hidden="true"><path class="g" d="M${w * 0.55} 3 C ${w * 0.95} 2, ${w - 2} ${h * 0.4}, ${w * 0.9} ${h * 0.8} C ${w * 0.7} ${h - 1}, ${w * 0.2} ${h - 2}, 4 ${h * 0.6} C 1 ${h * 0.3}, ${w * 0.25} 4, ${w * 0.62} 6"/></svg>`;

const crumbs = (items) => `<ol class="crumbs">${items.map(([h, l], i) => (i < items.length - 1 ? `<li><a href="${h}">${esc(l)}</a></li>` : `<li aria-current="page">${esc(l)}</li>`)).join('')}</ol>`;
const crumbLD = (items) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([h, l], i) => ({ '@type': 'ListItem', position: i + 1, name: l, item: SITE_URL + h })) });
const faqLD = (faqs) => (faqs.length ? [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: plain(a) } })) }] : []);
export function orgLD(settings) {
  const c = settings.company;
  return [{
    '@context': 'https://schema.org', '@type': 'Organization', name: c.name, url: SITE_URL, logo: SITE_URL + '/img/brand/logo-full.png', foundingDate: String(c.since),
    sameAs: Object.values(settings.social || {}), aggregateRating: { '@type': 'AggregateRating', ratingValue: c.rating, reviewCount: parseInt(c.reviewCount, 10) || 51 },
  }, ...settings.offices.map((o) => ({
    '@context': 'https://schema.org', '@type': 'LocalBusiness', name: `Firestone Fire & Security Systems — ${o.city}`, image: SITE_URL + '/img/brand/logo-full.png',
    address: { '@type': 'PostalAddress', streetAddress: o.address, addressLocality: o.city, addressCountry: 'AE' }, geo: { '@type': 'GeoCoordinates', latitude: o.lat, longitude: o.lng },
    telephone: o.phones?.[0], email: o.email, url: SITE_URL + '/contact', openingHours: 'Mo-Su 00:00-23:59',
  }))];
}

const heroActions = (quote = '') => `<div class="phero__acts" data-reveal style="--d:.15s">${btn('Get a quote', { quote, cls: 'btn--lg' })}${waBtn('WhatsApp', { cls: 'btn--lg' })}<a class="btn btn--ghost btn--lg" href="tel:+971506761638" data-phone>${ICON.phone}<span>Call now</span></a></div>`;

function vignette(model, { notes = NOTES[model] || NOTES[FAMILY[model]] || [] } = {}) {
  return `<div class="vignette" data-vignette="${model}" aria-hidden="true">
  <span class="vignette__frame"></span>
  ${notes[0] ? `<span class="note" style="left:2%;top:10%" data-draw>${esc(notes[0])}${underline(120)}</span>` : ''}
  ${notes[1] ? `<span class="note" style="right:4%;bottom:14%" data-draw><span style="position:relative">${arrowR}</span>${esc(notes[1])}</span>` : ''}
  <span class="vignette__scale">SCALE 1:20</span>
</div>`;
}

export function ctaBand(title = 'Looking for a reliable fire & safety company?', text = 'We deliver certified fire and security systems tailored to your facility’s needs — with one team from drawings to certification.') {
  return `<section class="section section--tight"><div class="wrap"><div class="cta" data-reveal>
  <img class="cta__art" src="/img/brand/logo-mark-light.png" alt="" aria-hidden="true">
  <div><span class="hand">Free site assessment</span><h2 class="h2" style="margin-top:10px">${title}</h2><p>${text}</p></div>
  <div class="cta__actions">${btn('Get a quote', { quote: '', cls: 'btn--green btn--lg' })}${waBtn('WhatsApp us', { cls: 'btn--lg' })}<a class="btn btn--paper btn--lg" href="tel:+971506761638" data-phone>${ICON.phone}<span>+971 50 676 1638</span></a></div>
</div></div></section>`;
}

function mapSection(settings, { title = 'Four offices. One team.', intro = 'Head office in Musaffah, Abu Dhabi, with branches in Dubai, Sharjah and Al Ain — so a technician is never far from your building.' } = {}) {
  return `<section class="section section--paper2" id="offices"><div class="wrap">
  <div class="sec-head"><div><span class="eyebrow" data-reveal><span class="u">Find us</span></span><h2 class="h2" data-split>${title}</h2></div><p class="lead" data-reveal>${intro}</p></div>
  <div class="mapwrap" data-map data-reveal>
    <div class="mapwrap__list" role="tablist" aria-label="Offices" data-offices="list">${settings.offices.map(officeItem).join('')}</div>
    <div class="mapwrap__map"><div class="map" aria-label="Map of Firestone offices"></div>
      <div class="map-ui"><button type="button" data-map-all>All offices</button></div>
      <div class="map-fallback" hidden><p class="muted">The map couldn’t load. Use the Directions buttons to open each office in Google Maps.</p></div>
    </div>
  </div>
</div></section>`;
}

function statsRow(dark = false) {
  return `<div class="stats">${S.STATS.map((s, i) => `<div class="stat" data-reveal style="--d:${i * 0.08}s"><b><span data-count="${s.n}"${s.raw ? ' data-raw="1"' : ''}>${s.raw ? s.n : s.n.toLocaleString('en-US')}</span>${s.suffix ? `<sup>${s.suffix}</sup>` : ''}</b><span class="mono ${dark ? '' : 'muted'}">${s.label}</span></div>`).join('')}</div>`;
}
// logo strip: two identical halves built into the page, so the loop is seamless from the first frame;
// every logo has its size reserved, so the strip never changes width while it moves
function marquee() {
  const set = (copy) => `<div class="marquee__set"${copy ? ' aria-hidden="true"' : ''}>${S.CLIENTS.map((c) => `<img src="/img/clients/${c.file}" width="${c.w}" height="${c.h}" alt="${copy ? '' : `${esc(c.name)} logo`}" decoding="async">`).join('')}</div>`;
  return `<div class="marquee" role="group" aria-label="Trusted by leading organizations"><div class="marquee__track">${set(false)}${set(true)}</div></div>`;
}
const approvals = () => `<div class="approvals" data-reveal>${S.APPROVALS.map((a, i) => `<span class="approval" style="--rot:${[-2, 1.5, -1, 2, -1.5, 1, -2][i]}deg">${a}</span>`).join('')}</div>`;

function testimonials(settings) {
  const c = settings.company;
  return `<section class="section"><div class="wrap">
  <div class="sec-head"><div><span class="eyebrow" data-reveal><span class="u">Testimonials</span></span><h2 class="h2" data-split>Feedback that fuels us.</h2></div><p class="lead" data-reveal>Every review reflects the work. We’re driven by our clients’ trust — and proud to share their words.</p></div>
  <div class="quotes">
    <a class="rating" href="${esc(c.googleReviewUrl)}" target="_blank" rel="noopener" data-reveal><span class="mono">Google reviews</span><b>${c.rating}</b><span class="stars" aria-label="${c.rating} out of 5 stars">★★★★★</span><span class="mono">${esc(c.reviewCount)} reviews · Abu Dhabi · Dubai · Sharjah · Al Ain</span><span class="link-arrow">Leave a review ${ICON.arrow}</span></a>
    ${S.TESTIMONIALS.map((t, i) => `<figure class="quote" data-reveal style="--d:${0.1 + i * 0.1}s"><blockquote>${esc(t.quote)}</blockquote><figcaption><span class="avatar">${t.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}</span><span><b>${esc(t.name)}</b><span>${esc(t.place)}</span></span></figcaption></figure>`).join('')}
  </div>
</div></section>`;
}

// ================================================================= HOME
export function home({ settings }) {
  const body = `
<section class="hero wrap">
  <h1 class="display">
    <span class="note" style="left:-2%;top:-30px" data-draw>Civil Defence approved${underline(170)}</span>
    Protecting lives,<br>securing spaces.
    <span class="note" style="left:calc(100% + 64px);bottom:18px;text-align:left" data-draw><span style="position:relative">${arrowR}</span>since 2007<br><span class="muted">abu dhabi · dubai<br>sharjah · al ain</span></span>
  </h1>
  <p class="lead" style="margin:26px auto 0;text-align:center;font-size:17px" data-reveal>Grade A Civil Defence approved fire &amp; safety company in the UAE — fire fighting, fire alarm, gas and security systems, designed, installed, tested and maintained by one team.</p>
  <div class="phero__acts" style="justify-content:center;margin-top:22px" data-reveal>${btn('Get a quote', { quote: '' })}<a class="btn btn--ghost" href="/services">Explore services</a></div>
</section>

<section class="journey" data-journey aria-label="How a Firestone project comes together">
  <div class="journey__sticky">
    <div class="journey__frame"><canvas aria-hidden="true"></canvas>
    ${S.JOURNEY.map((j, i) => `<article class="jpanel${i % 2 ? ' jpanel--r' : ''}">
      <span class="eyebrow"><span class="num">${i + 1}</span><span class="u">${esc(j.label)}</span></span>
      <h2 class="h2">${esc(j.title)}</h2>
      <p>${esc(j.text)}</p>
      <div class="meta">${j.chips.map((c) => `<span class="chip"><i></i>${esc(c)}</span>`).join('')}</div>
      <div>${arrowLink(esc(j.cta), j.href)}</div>
    </article>`).join('')}
    <span class="journey__tag" data-tag="grid">Sprinkler grid · NFPA 13</span>
    <span class="journey__tag" data-tag="riser">Wet riser · floor by floor</span>
    <span class="journey__tag journey__tag--red" data-tag="wire">Fire alarm loop</span>
    <span class="journey__tag" data-tag="detect">Addressable detection</span>
    <span class="journey__tag" data-tag="spray">Heads activate one by one</span>
    <span class="journey__tag" data-tag="q">Quarterly PPM visit</span>
    <span class="journey__tag" data-tag="beacon">24/7 response</span>
    <span class="journey__tag journey__tag--green" data-tag="cert">Civil Defence approved · handed over</span>
    <div class="journey__progress" aria-hidden="true">${S.JOURNEY.map((j) => `<b><i></i></b>`).join('')}<span style="margin-left:4px">Drawing → Handover</span></div>
    <p class="journey__hint" aria-hidden="true">Scroll — one project, from shop drawing to handover.</p>
    </div>
  </div>
</section>

<section class="section section--tight"><div class="wrap">
  ${statsRow()}
  <div style="margin-top:72px"><p class="mono muted" style="text-align:center;margin-bottom:22px">Trusted by leading organizations</p>${marquee()}</div>
</div></section>

<section class="section" id="about"><div class="wrap split">
  <div>
    <span class="eyebrow" data-reveal><span class="u">Who we are</span></span>
    <h2 class="h2" style="margin:18px 0 28px" data-split>One company from drawing to certificate.</h2>
    ${approvals()}
    <p class="mono muted" style="margin-top:14px" data-reveal>Approvals held · Grade A</p>
  </div>
  <div class="prose" data-reveal>
    <p><strong>Firestone Fire &amp; Security Systems LLC</strong> has been a trusted fire and safety company in the UAE since 2007. As a fire fighting company, we design, install, test and maintain sprinkler systems, fire hydrants, hose reels, <a href="/services/fire-alarm">fire alarm systems</a> and security systems for commercial, industrial, residential, hospitality and healthcare buildings in Abu Dhabi, Al Ain, Dubai and Sharjah.</p>
    <p>As a Grade A Civil Defence approved company we hold approvals from ADCD, DCD, DOE, ADMCC, AACD, SCD and SIRA. Our in-house team prepares AutoCAD shop drawings and handles Civil Defence approvals, so one company manages your project from design through testing, commissioning and certification — and every installation is tested and commissioned before handover.</p>
    <p>We also provide Civil Defence approved Annual Maintenance Contracts for fire alarm, fire fighting, gas and security systems, with 24/7 emergency support, in <a href="/services/annual-maintenance-contract-abu-dhabi">Abu Dhabi</a>, <a href="/services/fire-amc-dubai">Dubai</a> and <a href="/services/fire-amc-sharjah">Sharjah</a>.</p>
    <div class="mv"><div><span class="mono muted">Our mission</span><p class="h3">Protecting lives, securing spaces.</p></div><div><span class="mono muted">Our vision</span><p class="h3">To lead with innovation in fire &amp; safety solutions.</p></div></div>
    <div style="margin-top:28px">${arrowLink('Know more about us', '/about-us')}</div>
  </div>
</div></section>

<section class="section section--ink" id="services"><div class="wrap">
  <div class="sec-head"><div><span class="eyebrow" data-reveal><span class="u">Explore our specialised services</span></span><h2 class="h2" data-split>Every system a building needs to pass inspection — and to work on the day it matters.</h2></div>
  <div><p class="lead" data-reveal>From AutoCAD shop drawing to testing, commissioning and Annual Maintenance Contract, across fire, gas, smoke and security.</p><div style="margin-top:22px" data-reveal><a class="link-arrow" style="color:var(--paper);border-color:rgba(246,246,246,.3)" href="/services">View all services ${ICON.arrow}</a></div></div></div>
  <div class="cards">${S.HOME_SERVICES.map((s) => card({ href: '/services/' + s.slug, title: s.title, text: s.text, model: s.slug })).join('')}</div>
</div></section>

<section class="section"><div class="wrap split split--even" style="align-items:center">
  <div>${vignette('fire-security', { notes: ['one set of drawings', 'one point of contact'] })}</div>
  <div>
    <span class="eyebrow" data-reveal><span class="u">Fire + security</span></span>
    <h2 class="h2" style="margin:18px 0 24px" data-split>Complete fire and security systems, one team.</h2>
    <div class="prose" data-reveal>
      <p>Fire safety and security work usually involves the same buildings, the same consultants and the same approval process — so we give building owners and facility managers one team for both. One set of Civil Defence drawings, one installation schedule and one point of contact, from design to certification.</p>
      <p>Holding ADCD, DCD, SCD, SIRA and ADMCC approvals means one contractor can cover sites across emirates, and for multi-site clients a single company holding the drawings, approvals and certificates makes renewals and inspections simpler.</p>
    </div>
    <div class="phero__acts" data-reveal>${btn('Get a quote', { quote: 'security-and-elv-systems' })}${arrowLink('Security & ELV systems', '/services/security-and-elv-systems')}</div>
  </div>
</div></section>

${mapSection(settings)}

<section class="section"><div class="wrap split">
  <div class="split__aside"><span class="eyebrow" data-reveal><span class="u">Everything you need to know</span></span><h2 class="h2" style="margin-top:18px" data-split>Questions, answered.</h2><p class="lead" style="margin-top:20px" data-reveal>Can’t find what you’re looking for? Call <a href="tel:+971506761638" data-phone="text">+971 50 676 1638</a> or ask on WhatsApp.</p></div>
  <div data-reveal>${faqList(S.HOME_FAQ.map(([q, a]) => ({ q, a })))}</div>
</div></section>

${testimonials(settings)}
${ctaBand()}`;
  return {
    title: 'Fire & Safety Company UAE | Civil Defence Approved | Firestone',
    description: 'Grade A Civil Defence approved fire and safety company in the UAE since 2007. Fire fighting, fire alarm, gas and security systems — design, installation, testing and AMC in Abu Dhabi, Dubai, Sharjah and Al Ain.',
    body,
    jsonld: [...orgLD(settings), ...faqLD(S.HOME_FAQ.map(([q, a]) => ({ q, a })))],
  };
}

// ================================================================= ABOUT
function collage(settings) {
  const items = settings.about?.collage || [];
  if (!items.length) return '';
  // a repeating mosaic of tile sizes, so any number of photos lays out well
  const SPANS = [[6, 4], [3, 2], [3, 3], [3, 2], [3, 3], [4, 2], [5, 2]];
  return `<section class="section" style="padding-top:0"><div class="wrap">
  <div class="sec-head"><div><span class="eyebrow" data-reveal><span class="u">The people behind it</span></span><h2 class="h2" data-split>Engineers, technicians and planners — one team.</h2></div><p class="lead" data-reveal>The same people who draw your shop drawings install, test and maintain the systems.</p></div>
  <div class="collage" data-reveal>${items.map((p, i) => { const [c, r] = SPANS[i % SPANS.length]; return `<figure tabindex="0" style="--c:${c};--r:${r}"><img class="duo" src="${esc(p.duo || p.full)}" alt="" loading="lazy"><img class="full" src="${esc(p.full)}" alt="${esc(p.caption || 'Firestone team photo')}" loading="lazy">${p.caption ? `<figcaption>${esc(p.caption)}</figcaption>` : ''}</figure>`; }).join('')}</div>
</div></section>`;
}
export function about({ settings, page }) {
  const body = `
<section class="phero"><div class="wrap phero__grid">
  <div>
    ${crumbs([['/', 'Home'], ['/about-us', 'About']])}
    <span class="eyebrow phero__tag" data-reveal><span class="u">About Firestone</span></span>
    <h1 class="h1" data-split>Leading the way in safety &amp; technology.</h1>
    <p class="lead" data-reveal>We deliver integrated safety solutions — from fire and gas systems to advanced IT and security services. With a focus on reliability, innovation and compliance, we protect people, property and infrastructure with systems designed around each project.</p>
    ${heroActions()}
  </div>
  ${vignette('hq', { notes: ['head office · musaffah', 'since 2007'] })}
</div></section>

<section class="section section--tight"><div class="wrap">${statsRow()}</div></section>
${collage(settings)}

<section class="section"><div class="wrap split">
  <div><span class="eyebrow" data-reveal><span class="u">Since 2007</span></span><h2 class="h2" style="margin-top:18px" data-split>Global client service with a strong Middle East presence.</h2></div>
  <div class="prose" data-reveal>
    <p>Since 2007, Firestone Fire and Security Systems LLC has been a trusted provider of fire protection and security solutions across the UAE. With operational bases in Dubai, Abu Dhabi, Al Ain, Sharjah and Ras Al Khaimah, we are dedicated to safeguarding lives and properties throughout all Emirates.</p>
    <p>Our expertise covers fire and safety systems, fire alarms, fire sealants, gas safety systems, IT security solutions and ventilation systems. We deliver end-to-end services — system design, installation and maintenance — to the highest industry standards.</p>
    <p>As a Civil Defence approved company, Firestone is committed to reliable, high-quality systems that ensure safety, compliance and peace of mind for commercial, industrial and residential clients.</p>
  </div>
</div></section>

<section class="section section--ink"><div class="wrap">
  <div class="split split--even">
    <div data-reveal><span class="mono" style="color:var(--green)">Our mission</span><p class="display" style="font-size:clamp(40px,5.5vw,84px);margin-top:16px">Protecting lives, securing spaces.</p></div>
    <div data-reveal style="--d:.1s"><span class="mono" style="color:var(--green)">Our vision</span><p class="display" style="font-size:clamp(40px,5.5vw,84px);margin-top:16px;color:#bfc2bf">To lead with innovation in fire &amp; safety.</p></div>
  </div>
</div></section>

<section class="section"><div class="wrap split">
  <div><span class="eyebrow" data-reveal><span class="u">Your trusted fire fighting company</span></span><h2 class="h2" style="margin-top:18px" data-split>Complete fire protection from design to certification.</h2></div>
  <div class="prose" data-reveal>
    <p>In the UAE, fire safety is more than a regulatory requirement — it’s a critical necessity. Firestone is a leading provider of complete fire protection, with expertise as a top-tier fire fighting and fire alarm company across all emirates.</p>
    <p>We provide end-to-end fire safety services for commercial, residential and industrial clients: from initial system design to installation, maintenance and Civil Defence certification, every project meets the highest safety standards.</p>
    <p>Approved by Dubai and Abu Dhabi Civil Defence, we make securing a Civil Defence certificate a seamless process by guiding you through every step.</p>
    ${approvals()}
  </div>
</div></section>

<section class="section section--paper2"><div class="wrap">
  <div class="sec-head"><div><span class="eyebrow" data-reveal><span class="u">Our core services</span></span><h2 class="h2" data-split>What we install, test and maintain.</h2></div><div data-reveal>${arrowLink('All services', '/services')}</div></div>
  <div class="features">${S.ABOUT.core.map(([t, d]) => `<div class="feature" data-reveal><span class="k">◆</span><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join('')}</div>
</div></section>

<section class="section section--ink"><div class="wrap">
  <div class="sec-head"><div><span class="eyebrow" data-reveal><span class="u">Why choose us</span></span><h2 class="h2" data-split>Consultation to commissioning, under one roof.</h2></div></div>
  <div class="features">${S.ABOUT.why.map(([t, d]) => `<div class="feature" data-reveal><span class="k">◆</span><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join('')}</div>
</div></section>

<section class="section section--tight"><div class="wrap"><p class="mono muted" style="text-align:center;margin-bottom:22px">Trusted by leading organizations</p>${marquee()}</div></section>
${mapSection(settings)}
${ctaBand()}`;
  return { title: page?.metaTitle || 'About Firestone | Fire & Safety Company UAE', description: page?.metaDescription || 'Firestone Fire & Security Systems — Civil Defence approved fire protection and security since 2007.', body, jsonld: [crumbLD([['/', 'Home'], ['/about-us', 'About']])] };
}

// ================================================================= SERVICES INDEX
export function servicesIndex({ page, pages }) {
  const desc = (slug) => {
    const m = MENU.find((x) => x.slug === slug);
    const p = pages['services/' + slug];
    return m?.blurb || (p?.metaDescription || '').split('. ')[0];
  };
  const groups = ['fire-and-safety', 'fire-alarm', 'fire-fighting-system', 'fire-suppression-system', 'fire-protection-products', 'fire-safety-services', 'gas-system', 'security-and-elv-systems', 'fire-sealant-and-fire-stopping', 'smoke-management-systems', 'emergency-evacuation-plan', 'civil-defense-compliance'];
  const amc = ['annual-maintenance-contract-abu-dhabi', 'fire-amc-dubai', 'fire-amc-sharjah'];
  const row = (slug) => `<div class="rowgroup" data-reveal>
    <a class="row" href="/services/${slug}">${thumb(slug)}<span class="h3">${esc(LABEL[slug])}</span><p>${esc(desc(slug))}</p>${ICON.arrow}</a>
    ${HUBS[slug] ? `<div class="row__kids">${HUBS[slug].map((k) => `<a href="/services/${k}">${esc(LABEL[k])}</a>`).join('')}</div>` : ''}
  </div>`;
  const intro = page.blocks.find((b) => b.t === 'p')?.text || '';
  const body = `
<section class="phero"><div class="wrap">
  ${crumbs([['/', 'Home'], ['/services', 'Services']])}
  <div class="sec-head" style="margin-bottom:0">
    <div><span class="eyebrow phero__tag" data-reveal><span class="u">${Object.keys(MODEL).length}+ services</span></span><h1 class="h1" data-split>Our services.</h1></div>
    <div><p class="lead" data-reveal>${intro}</p>${heroActions()}</div>
  </div>
</div></section>
<section class="section section--tight" style="padding-top:0"><div class="wrap">
  <div class="rows">${groups.map(row).join('')}</div>
  <h2 class="h3" style="margin:56px 0 18px" data-reveal>Annual Maintenance Contracts</h2>
  <div class="cards">${amc.map((s) => card({ href: '/services/' + s, title: LABEL[s], text: MENU.find((m) => m.slug === s)?.blurb, model: s, label: LABEL[s].replace('AMC ', '') })).join('')}</div>
  <div class="cards cards--2" style="margin-top:16px">${card({ href: '/services/fire-safety-emergency-support', title: '24/7 emergency support', text: 'Alarm faults, pump failures, gas alerts and leaks — call or WhatsApp any hour.', model: 'fire-safety-emergency-support' })}${card({ href: '/services/clients-and-projects', title: 'Clients & projects', text: 'Airports, hospitals, universities, hotels and government buildings across the UAE.', model: 'clients-and-projects' })}</div>
</div></section>
<section class="section section--ink"><div class="wrap">
  <div class="sec-head"><div><span class="eyebrow" data-reveal><span class="u">What sets Firestone apart</span></span><h2 class="h2" data-split>Built for the whole life of the building.</h2></div></div>
  <div class="features">${S.SERVICES_APART.map(([t, d]) => `<div class="feature" data-reveal><span class="k">◆</span><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join('')}</div>
</div></section>
<section class="section"><div class="wrap split">
  <div><span class="eyebrow" data-reveal><span class="u">Want to know more</span></span><h2 class="h2" style="margin-top:18px" data-split>Common questions.</h2></div>
  <div data-reveal>${faqList(S.SERVICES_FAQ.map(([q, a]) => ({ q, a })))}</div>
</div></section>
${ctaBand()}`;
  return { title: page.metaTitle || 'Fire Protection & Security Services UAE | Firestone', description: page.metaDescription, body, jsonld: [crumbLD([['/', 'Home'], ['/services', 'Services']]), ...faqLD(S.SERVICES_FAQ.map(([q, a]) => ({ q, a })))] };
}

// ================================================================= SERVICE DETAIL
export function service({ page, slug }) {
  const model = slug;
  const hero = splitHero(page.blocks, page.title);
  const { html, toc, faqs } = renderBlocks(hero.rest, { model });
  const trail = [['/', 'Home'], ['/services', 'Services']];
  let p = PARENT[slug]; const chain = [];
  while (p && chain.length < 3) { chain.unshift(p); p = PARENT[p]; }
  chain.forEach((c) => trail.push(['/services/' + c, LABEL[c]]));
  trail.push(['/services/' + slug, LABEL[slug] || hero.title]);
  const kids = HUBS[slug] || [];
  const sibs = (HUBS[PARENT[slug]] || []).filter((s) => s !== slug && !kids.includes(s)).slice(0, 3);
  const lead = hero.lead.map((t, i) => (i === 0 ? `<p class="lead" data-reveal>${t}</p>` : `<p class="muted" style="margin:14px 0 0;max-width:62ch;font-size:15.5px" data-reveal>${t}</p>`)).join('');
  const body = `
<section class="phero"><div class="wrap phero__grid">
  <div>
    ${crumbs(trail)}
    ${hero.eyebrow ? `<span class="chip phero__tag" data-reveal><i></i>${esc(hero.eyebrow)}</span>` : `<span class="chip phero__tag" data-reveal><i></i>Civil Defence approved</span>`}
    <h1 class="h1" data-split>${esc(hero.title)}</h1>
    ${hero.sub ? `<p class="hand" style="font-size:20px;margin:16px 0 0" data-reveal>${esc(hero.sub)}</p>` : ''}
    <div style="margin-top:22px">${lead}</div>
    ${heroActions(slug)}
  </div>
  ${vignette(model)}
</div></section>
${kids.length ? `<section class="section section--tight section--paper2"><div class="wrap">
  <div class="sec-head"><div><span class="eyebrow" data-reveal><span class="u">Inside ${esc(LABEL[slug] || hero.title)}</span></span><h2 class="h2" data-split>Choose a system.</h2></div><p class="lead" data-reveal>Each one is designed, installed, tested and maintained by our own Civil Defence approved team.</p></div>
  <div class="cards${kids.length > 4 ? '' : ' cards--' + Math.max(2, kids.length)}">${kids.map((k) => card({ href: '/services/' + k, title: LABEL[k], model: k })).join('')}</div>
</div></section>` : ''}
<section class="section" style="padding-top:clamp(56px,7vw,96px)"><div class="wrap doc">
  <nav class="toc" aria-label="On this page">
    <span class="mono">On this page</span>
    ${toc.map((t) => `<a href="#${t.id}">${esc(t.text)}</a>`).join('')}
    <div class="toc__cta"><p>Need a site assessment for ${esc((LABEL[slug] || hero.title).toLowerCase())}?</p>${btn('Get a quote', { quote: slug })}${waBtn('Ask on WhatsApp', { text: 'Hello Firestone, I have a question about ' + (LABEL[slug] || hero.title) })}</div>
  </nav>
  <div class="doc__body">${html}</div>
</div></section>
${sibs.length ? `<section class="section section--tight section--paper2"><div class="wrap">
  <div class="sec-head"><div><span class="eyebrow" data-reveal><span class="u">Related</span></span><h2 class="h2" data-split>More in ${esc(LABEL[PARENT[slug]])}.</h2></div><div data-reveal>${arrowLink('View ' + LABEL[PARENT[slug]], '/services/' + PARENT[slug])}</div></div>
  <div class="cards">${sibs.map((k) => card({ href: '/services/' + k, title: LABEL[k], model: k })).join('')}</div>
</div></section>` : ''}
${ctaBand()}`;
  return {
    title: page.metaTitle || hero.title + ' | Firestone',
    description: page.metaDescription || plain(hero.lead[0] || ''),
    body,
    jsonld: [crumbLD(trail), { '@context': 'https://schema.org', '@type': 'Service', name: hero.title, serviceType: LABEL[slug] || hero.title, areaServed: ['Abu Dhabi', 'Dubai', 'Sharjah', 'Al Ain'], provider: { '@type': 'Organization', name: 'Firestone Fire & Security Systems LLC', url: SITE_URL } }, ...faqLD(faqs)],
    search: { toc },
  };
}

// ================================================================= PROJECTS
export function projects({ page, settings }) {
  const statusTag = (s) => (/ongoing/i.test(s) ? 'ongoing' : 'completed');
  const body = `
<section class="phero"><div class="wrap phero__grid">
  <div>
    ${crumbs([['/', 'Home'], ['/services/clients-and-projects', 'Projects']])}
    <span class="eyebrow phero__tag" data-reveal><span class="u">Trusted across the UAE</span></span>
    <h1 class="h1" data-split>Our work.</h1>
    <p class="lead" style="margin-top:22px" data-reveal>A closer look at the organisations we work with and the projects we’ve delivered since 2007 — government authorities, healthcare, hospitality, education and industrial facilities, where fire safety, security and compliance genuinely matter.</p>
    <p class="muted" style="margin:14px 0 0;max-width:60ch" data-reveal>Every project reflects the same standard, regardless of size: Civil Defence approved design, certified installation, and documentation ready for handover.</p>
    ${heroActions()}
  </div>
  ${vignette('clients-and-projects', { notes: ['2,500+ projects', 'handover-ready'] })}
</div></section>
<section class="section section--tight"><div class="wrap">${statsRow()}</div></section>
<section class="section" style="padding-top:0"><div class="wrap">
  <div class="sec-head"><div><span class="eyebrow" data-reveal><span class="u">Selected projects</span></span><h2 class="h2" data-split>Delivered and in progress.</h2></div>
  <div class="filters" data-filter-group="#project-grid" data-reveal><button class="filter" data-value="all" aria-pressed="true">All</button><button class="filter" data-value="completed" aria-pressed="false">Completed</button><button class="filter" data-value="ongoing" aria-pressed="false">Ongoing</button><button class="filter" data-value="abu-dhabi" aria-pressed="false">Abu Dhabi</button></div></div>
  <div class="projects" id="project-grid">${S.PROJECTS.map((p) => `<article class="project" data-reveal data-tags="${statusTag(p.status)}|${/abu dhabi/i.test(p.place) ? 'abu-dhabi' : 'other'}">
    <div class="card__art"><span class="hand">${esc(p.place)}</span>${thumb(p.model)}</div>
    <div class="project__body"><span class="chip status ${statusTag(p.status) === 'completed' ? 'done' : ''}"><i></i>${esc(p.status)}</span><h3 class="h3">${esc(p.name)}</h3></div>
  </article>`).join('')}</div>
</div></section>
<section class="section section--paper2"><div class="wrap"><p class="mono muted" style="text-align:center;margin-bottom:22px">Clients include</p>${marquee()}</div></section>
${testimonials(settings)}
${ctaBand('Have a project like these?')}`;
  return { title: page.metaTitle || 'Clients & Projects | Firestone', description: page.metaDescription || 'Fire safety and security projects delivered by Firestone across the UAE.', body, jsonld: [crumbLD([['/', 'Home'], ['/services/clients-and-projects', 'Projects']])] };
}

// ================================================================= EMERGENCY
export function emergency({ page, settings }) {
  const faq = (page.blocks.find((b) => b.t === 'faq') || { items: [] }).items;
  const c = settings.company;
  const body = `
<section class="phero"><div class="wrap phero__grid">
  <div>
    ${crumbs([['/', 'Home'], ['/services', 'Services'], ['/services/fire-safety-emergency-support', 'Emergency support']])}
    <span class="chip phero__tag" data-reveal><i></i>Answering now · 24 / 7</span>
    <h1 class="h1" data-split>24/7 emergency fire &amp; safety support.</h1>
    <p class="lead" style="margin-top:22px" data-reveal>Fire and safety emergencies don’t wait for business hours — neither do we.</p>
    <a class="callbig" style="margin-top:28px" href="${tel(c.primaryPhone)}" data-phone="text" data-reveal>${esc(c.primaryPhone)}</a>
    <div class="phero__acts" data-reveal><a class="btn btn--lg" href="${tel(c.primaryPhone)}" data-phone><span class="sq"></span>Call now</a><a class="btn btn--green btn--lg" href="${wa(c.whatsapp, 'EMERGENCY — ')}" data-wa="EMERGENCY — " target="_blank" rel="noopener">${ICON.wa} WhatsApp us</a></div>
    <p class="muted" style="margin-top:18px;font-size:14px;max-width:56ch" data-reveal>If there is an active fire or a suspected gas leak: evacuate, avoid switches and open flames, and call Civil Defence on <a href="tel:997"><b>997</b></a> first.</p>
  </div>
  ${vignette('fire-safety-emergency-support', { notes: NOTES.beacon })}
</div></section>
<section class="section section--ink"><div class="wrap split">
  <div><span class="eyebrow" data-reveal><span class="u">When to call us</span></span><h2 class="h2" style="margin-top:18px" data-split>Faults that can’t wait until Monday.</h2></div>
  <ul class="checks" style="border-color:rgba(246,246,246,.18)" data-reveal>${S.EMERGENCY.when.map((w) => `<li style="color:var(--paper);border-color:rgba(246,246,246,.18)">${esc(w)}</li>`).join('')}</ul>
</div></section>
<section class="section"><div class="wrap">
  <div class="sec-head"><div><span class="eyebrow" data-reveal><span class="u">What happens next</span></span><h2 class="h2" data-split>From your call to a working system.</h2></div></div>
  <div class="steps">${S.EMERGENCY.steps.map((s, i) => `<div class="step" data-reveal style="--d:${i * 0.08}s"><span class="n">Step ${i + 1} of 4</span><b>${esc(s)}</b></div>`).join('')}</div>
</div></section>
<section class="section section--paper2"><div class="wrap split">
  <div><span class="eyebrow" data-reveal><span class="u">For AMC clients</span></span><h2 class="h2" style="margin-top:18px" data-split>Emergency support, without a new quote each time.</h2></div>
  <div class="prose" data-reveal>
    <p>For AMC clients, emergency support means that if a fire alarm, suppression system or gas detection unit fails, help is a phone call away — no separate service quote each time. Coverage typically includes priority scheduling and a guaranteed response window, so you’re not waiting behind non-contract customers.</p>
    <p>What varies is the depth of coverage: some AMC tiers bundle unlimited call-outs including labour and minor parts, while others cover a set number of visits per year or charge separately for parts and after-hours work. Confirm what “emergency support” includes in your AMC — response time, hours covered, call-out limits and whether parts are extra.</p>
    <div class="phero__acts">${btn('Ask about AMC cover', { quote: 'amc' })}${arrowLink('AMC Abu Dhabi', '/services/annual-maintenance-contract-abu-dhabi')}</div>
  </div>
</div></section>
<section class="section"><div class="wrap split">
  <div><span class="eyebrow" data-reveal><span class="u">Fire safety FAQ</span></span><h2 class="h2" style="margin-top:18px" data-split>Maintenance contracts &amp; emergency response.</h2></div>
  <div data-reveal>${faqList(faq)}</div>
</div></section>
${mapSection(settings, { title: 'Closest team, fastest response.' })}`;
  return { title: page.metaTitle || '24/7 Emergency Fire & Safety Support | Firestone', description: page.metaDescription || 'Round-the-clock emergency support for fire alarm, sprinkler, pump, gas and security faults across the UAE.', body, jsonld: [crumbLD([['/', 'Home'], ['/services', 'Services'], ['/services/fire-safety-emergency-support', 'Emergency support']]), ...faqLD(faq)] };
}

// ================================================================= CONTACT
export function contact({ page, settings }) {
  const c = settings.company;
  const body = `
<section class="phero" style="padding-bottom:40px"><div class="wrap">
  ${crumbs([['/', 'Home'], ['/contact', 'Contact']])}
  <div class="sec-head" style="margin-bottom:0;align-items:start">
    <div><span class="eyebrow phero__tag" data-reveal><span class="u">Contact us</span></span><h1 class="h1" data-split>Let’s connect — reach out anytime.</h1></div>
    <div><p class="lead" data-reveal>Our team would love to hear from you. Call, WhatsApp or send a message — or request a quote and we’ll arrange a free site assessment.</p>
      <div class="phero__acts" data-reveal><a class="btn btn--lg" href="${tel(c.primaryPhone)}" data-phone><span class="sq"></span>${esc(c.primaryPhone)}</a>${waBtn('WhatsApp', { cls: 'btn--lg' })}<a class="btn btn--ghost btn--lg" href="mailto:${esc(c.email)}" data-email>${ICON.mail} ${esc(c.email)}</a></div></div>
  </div>
</div></section>
${mapSection(settings, { title: 'Visit an office.', intro: 'Select an office to fly to it, then tap Directions to open the route in Google Maps.' })}
<section class="section" id="message"><div class="wrap split">
  <div>
    <span class="eyebrow" data-reveal><span class="u">Send a message</span></span>
    <h2 class="h2" style="margin:18px 0 22px" data-split>Contact us for more information.</h2>
    <p class="lead" data-reveal>We reply within one business day. For emergencies, call — the line is answered 24/7.</p>
    <div style="margin-top:28px" data-reveal>${btn('Request a quote instead', { quote: '', cls: 'btn--ghost' })}</div>
  </div>
  <form class="form" data-form="contact" novalidate data-reveal>
    <div class="field"><label for="c-name">Full name <em>*</em></label><input class="input" id="c-name" name="name" required autocomplete="name"></div>
    <div class="field"><label for="c-phone">Phone number <em>*</em></label><input class="input" id="c-phone" name="phone" type="tel" required autocomplete="tel" placeholder="+971"></div>
    <div class="field full"><label for="c-email">Email <em>*</em></label><input class="input" id="c-email" name="email" type="email" required autocomplete="email"></div>
    <div class="field full"><label for="c-office">Nearest office</label><select id="c-office" name="office">${settings.offices.map((o) => `<option>${esc(o.city)}</option>`).join('')}</select></div>
    <div class="field full"><label for="c-msg">Your message</label><textarea id="c-msg" name="message" maxlength="5000" placeholder="Tell us about your building and what you need"></textarea></div>
    <input class="hp" name="company_website" tabindex="-1" autocomplete="off" aria-hidden="true">
    <div class="full" style="display:flex;gap:16px;align-items:center;flex-wrap:wrap"><button type="submit" class="btn btn--lg"><span class="sq"></span>Send message</button><p class="form__status" role="status"></p></div>
  </form>
</div></section>`;
  return { title: page?.metaTitle || 'Contact Firestone | Fire & Safety Company UAE', description: page?.metaDescription || 'Contact Firestone Fire & Security Systems in Abu Dhabi, Dubai, Sharjah and Al Ain.', body, jsonld: [crumbLD([['/', 'Home'], ['/contact', 'Contact']]), ...orgLD(settings)] };
}

// ================================================================= CAREERS
const jobForm = (jobs, selected = '') => `<form class="form" data-form="career" novalidate>
  <div class="field full"><label for="j-role">Role <em>*</em></label><select id="j-role" name="role" required>${['', ...jobs.map((j) => j.title), 'Open application'].map((t) => `<option value="${esc(t)}" ${t === selected ? 'selected' : ''}>${t || 'Choose a role'}</option>`).join('')}</select></div>
  <div class="field"><label for="j-name">Full name <em>*</em></label><input class="input" id="j-name" name="name" required autocomplete="name"></div>
  <div class="field"><label for="j-phone">Phone number <em>*</em></label><input class="input" id="j-phone" name="phone" type="tel" required autocomplete="tel"></div>
  <div class="field"><label for="j-email">Email <em>*</em></label><input class="input" id="j-email" name="email" type="email" required autocomplete="email"></div>
  <div class="field"><label for="j-loc">Current location <em>*</em></label><input class="input" id="j-loc" name="location" required></div>
  <div class="field full"><label>CV / resume</label><label class="file"><input type="file" name="cv" accept=".pdf,.doc,.docx"><span data-file-label>Attach CV (PDF or Word, max 5 MB)</span></label></div>
  <div class="field full"><label for="j-url">Or a resume link</label><input class="input" id="j-url" name="resumeUrl" type="url" placeholder="https://"></div>
  <div class="field full"><label for="j-about">Tell us more about you</label><textarea id="j-about" name="about"></textarea></div>
  <input class="hp" name="company_website" tabindex="-1" autocomplete="off" aria-hidden="true">
  <div class="full" style="display:flex;gap:16px;align-items:center;flex-wrap:wrap"><button type="submit" class="btn btn--lg"><span class="sq"></span>Send application</button><p class="form__status" role="status"></p></div>
</form>`;

export function careers({ page, jobs }) {
  const body = `
<section class="phero"><div class="wrap phero__grid">
  <div>
    ${crumbs([['/', 'Home'], ['/career', 'Career']])}
    <span class="eyebrow phero__tag" data-reveal><span class="u">Now hiring</span></span>
    <h1 class="h1" data-split>We’re hiring — let’s work together.</h1>
    <p class="lead" style="margin-top:22px" data-reveal>We’re always looking for passionate, skilled and driven people to join our growing team. If you’re ready to make an impact and grow your career in a supportive, dynamic environment, we’d love to hear from you.</p>
    <div class="phero__acts" data-reveal><a class="btn btn--lg" href="#roles"><span class="sq"></span>See open roles</a><a class="btn btn--ghost btn--lg" href="#apply">Send an application</a></div>
  </div>
  ${vignette('hardhat', { notes: ['apply today', 'grow with us'] })}
</div></section>
<section class="section" id="roles" style="padding-top:clamp(40px,5vw,72px)"><div class="wrap">
  <div class="sec-head"><div><span class="eyebrow" data-reveal><span class="u">${jobs.length} open roles</span></span><h2 class="h2" data-split>Find the role that fits you.</h2></div><p class="lead" data-reveal>All roles are full-time and based in the UAE, working across our Abu Dhabi, Dubai, Sharjah and Al Ain teams.</p></div>
  <div class="jobs">${jobs.map((j) => `<a class="job" href="${j.route}" data-reveal><div><span class="h3">${esc(j.title)}</span><div class="tags"><span class="chip"><i></i>UAE</span><span class="chip">Full time</span></div></div><p>${esc(j.summary)}</p><span class="link-arrow">Apply ${ICON.arrow}</span></a>`).join('')}</div>
</div></section>
<section class="section section--paper2" id="apply"><div class="wrap split">
  <div><span class="eyebrow" data-reveal><span class="u">Start your career with us</span></span><h2 class="h2" style="margin:18px 0 20px" data-split>Apply in two minutes.</h2><p class="lead" data-reveal>Pick a role — or send an open application and we’ll keep you in mind for the next opening.</p></div>
  <div data-reveal>${jobForm(jobs)}</div>
</div></section>`;
  return { title: page?.metaTitle || 'Careers at Firestone | Fire & Safety Jobs UAE', description: page?.metaDescription || 'Join Firestone Fire & Security Systems — open roles for technicians, engineers and supervisors in the UAE.', body, jsonld: [crumbLD([['/', 'Home'], ['/career', 'Career']])] };
}

export function job({ page, jobs, j }) {
  const blocks = page.blocks.filter((b, i) => !(i < 3 && (b.t === 'link' || b.t === 'links' || (b.t === 'p' && /^(uae|full time)$/i.test(plain(b.text))))));
  const hero = splitHero(blocks, j.title);
  const { html, toc } = renderBlocks(hero.rest.map((b) => (b.t === 'h' ? { ...b, text: b.text.replace(/^[^\w]+/u, '').trim() } : b.t === 'p' && /preferred qualifications/i.test(plain(b.text)) ? { t: 'h', text: plain(b.text).replace(/^[^\w]+/u, '') } : b)), { model: 'clipboard' });
  const trail = [['/', 'Home'], ['/career', 'Career'], [j.route, j.title]];
  const body = `
<section class="phero" style="padding-bottom:40px"><div class="wrap">
  ${crumbs(trail)}
  <div class="sec-head" style="margin-bottom:0">
    <div><div style="display:flex;gap:6px;margin-bottom:18px" data-reveal><span class="chip"><i></i>UAE</span><span class="chip">Full time</span></div><h1 class="h1" data-split>${esc(j.title)}</h1></div>
    <div><p class="lead" data-reveal>${esc(j.summary)}</p><div class="phero__acts" data-reveal><a class="btn btn--lg" href="#apply"><span class="sq"></span>Apply now</a>${arrowLink('All roles', '/career#roles')}</div></div>
  </div>
</div></section>
<section class="section" style="padding-top:clamp(40px,5vw,72px)"><div class="wrap doc">
  <nav class="toc" aria-label="On this page"><span class="mono">On this page</span>${toc.map((t) => `<a href="#${t.id}">${esc(t.text)}</a>`).join('')}<a href="#apply">Apply</a></nav>
  <div class="doc__body">${html}</div>
</div></section>
<section class="section section--paper2" id="apply"><div class="wrap split">
  <div><span class="eyebrow" data-reveal><span class="u">Apply</span></span><h2 class="h2" style="margin:18px 0 20px" data-split>Apply for ${esc(j.title)}.</h2><p class="lead" data-reveal>Attach your CV or share a link. We review every application.</p></div>
  <div data-reveal>${jobForm(jobs, j.title)}</div>
</div></section>`;
  return {
    title: page.metaTitle || `${j.title} | Careers at Firestone`, description: page.metaDescription || j.summary, body,
    jsonld: [crumbLD(trail), { '@context': 'https://schema.org', '@type': 'JobPosting', title: j.title, description: html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 4000), employmentType: 'FULL_TIME', datePosted: '2026-01-01', hiringOrganization: { '@type': 'Organization', name: 'Firestone Fire & Security Systems LLC', sameAs: SITE_URL }, jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressCountry: 'AE', addressRegion: 'Abu Dhabi' } } }],
  };
}

// ================================================================= BLOG
export function blogIndex({ page, posts }) {
  const cats = [...new Set(posts.map((p) => p.cat))];
  const [first, ...rest] = posts;
  const meta = (p) => `<span class="post-meta"><span class="cat">${esc(p.category)}</span>${p.author ? `<span>${esc(p.author)}</span>` : ''}${p.date ? `<span>${esc(p.date)}</span>` : ''}${p.read ? `<span>${esc(p.read)}</span>` : ''}</span>`;
  const postCard = (p) => `<a class="card" href="${p.route}" data-reveal data-tags="${p.cat}"><div class="card__art"><span class="hand">${esc(p.category)}</span>${postArt(p)}</div><div class="card__body">${meta(p)}<span class="h3">${esc(p.title)}</span><p>${esc(p.excerpt)}</p><span class="card__go">Read article ${ICON.arrow}</span></div></a>`;
  const body = `
<section class="phero" style="padding-bottom:30px"><div class="wrap">
  ${crumbs([['/', 'Home'], ['/blog', 'Blog']])}
  <div class="sec-head" style="margin-bottom:0"><div><span class="eyebrow phero__tag" data-reveal><span class="u">Insights &amp; ideas</span></span><h1 class="h1" data-split>Field notes on fire safety in the UAE.</h1></div><p class="lead" data-reveal>Maintenance, compliance, Civil Defence approvals and building systems — written by the people who inspect, install and maintain them.</p></div>
</div></section>
<section class="section" style="padding-top:20px"><div class="wrap">
  <a class="featured" href="${first.route}" data-reveal><div class="card__art"><span class="hand">Latest</span>${postArt(first)}</div><div class="featured__body">${meta(first)}<h2 class="h2" style="font-size:clamp(30px,3.2vw,46px)">${esc(first.title)}</h2><p>${esc(first.excerpt)}</p><span class="link-arrow" style="align-self:flex-start">Read article ${ICON.arrow}</span></div></a>
  <div class="filters" data-filter-group="#post-grid" style="margin-top:44px"><button class="filter" data-value="all" aria-pressed="true">All</button>${cats.map((c) => `<button class="filter" data-value="${c}" aria-pressed="false">${esc(posts.find((p) => p.cat === c).catLabel)}</button>`).join('')}</div>
  <div class="cards" id="post-grid">${rest.map(postCard).join('')}</div>
</div></section>
${ctaBand()}`;
  return { title: page?.metaTitle || 'Fire Safety Blog | Firestone', description: page?.metaDescription || 'Insights on fire safety, maintenance and Civil Defence compliance in the UAE.', body, jsonld: [crumbLD([['/', 'Home'], ['/blog', 'Blog']])] };
}

export function post({ page, p, posts }) {
  const { html, toc } = renderBlocks(page.blocks, { model: p.model });
  const related = posts.filter((x) => x.route !== p.route).sort((a, b) => (b.cat === p.cat) - (a.cat === p.cat)).slice(0, 3);
  const url = SITE_URL + p.route;
  const trail = [['/', 'Home'], ['/blog', 'Blog'], [p.route, p.title]];
  const body = `
<div class="progress-bar" aria-hidden="true"></div>
<section class="phero" style="padding-bottom:20px"><div class="wrap wrap--narrow" style="max-width:1000px">
  ${crumbs(trail)}
  <span class="post-meta" data-reveal><span class="cat">${esc(p.category)}</span>${p.read ? `<span>${esc(p.read)}</span>` : ''}</span>
  <h1 class="h1" style="margin-top:18px;font-size:clamp(36px,5vw,72px)" data-split>${esc(p.title)}</h1>
  <div style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;margin-top:28px" data-reveal>
    <div class="byline"><span class="avatar">${esc((p.author || 'FS').split(' ').map((w) => w[0]).slice(0, 2).join(''))}</span><span><b style="display:block;font-weight:500">${esc(p.author || 'Firestone editorial team')}</b><span class="mono muted">${esc(p.date || '')}</span></span></div>
    <div class="share"><a href="https://wa.me/?text=${encodeURIComponent(p.title + ' ' + url)}" target="_blank" rel="noopener" aria-label="Share on WhatsApp">${ICON.wa}</a><a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}" target="_blank" rel="noopener" aria-label="Share on LinkedIn">${ICON.linkedin}</a><a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(p.title)}" target="_blank" rel="noopener" aria-label="Share on X">${ICON.x}</a><button type="button" data-copy aria-label="Copy link">${ICON.link}</button></div>
  </div>
</div></section>
<section><div class="wrap">${p.cover ? `<div class="post-cover"><img src="${esc(p.cover)}" alt=""></div>` : p.model ? `<div class="vignette vignette--wide" data-vignette="${p.model}" aria-hidden="true"><span class="vignette__scale">FIG. 1</span></div>` : `<div class="post-cover post-cover--type">${postArt(p)}</div>`}</div></section>
<section class="section" style="padding-top:clamp(48px,6vw,88px)"><div class="wrap doc">
  <nav class="toc" aria-label="In this article"><span class="mono">In this article</span>${toc.map((t) => `<a href="#${t.id}">${esc(t.text)}</a>`).join('')}<div class="toc__cta"><p>Talk to an engineer about your building.</p>${btn('Get a quote', { quote: '' })}${waBtn('Ask on WhatsApp')}</div></nav>
  <article class="doc__body article">${html}</article>
</div></section>
<section class="section section--tight section--paper2"><div class="wrap">
  <div class="sec-head"><div><span class="eyebrow" data-reveal><span class="u">Keep reading</span></span><h2 class="h2" data-split>More from the blog.</h2></div><div data-reveal>${arrowLink('All articles', '/blog')}</div></div>
  <div class="cards">${related.map((r) => `<a class="card" href="${r.route}" data-reveal><div class="card__art"><span class="hand">${esc(r.category)}</span>${postArt(r)}</div><div class="card__body"><span class="h3">${esc(r.title)}</span><p>${esc(r.excerpt)}</p><span class="card__go">Read article ${ICON.arrow}</span></div></a>`).join('')}</div>
</div></section>
${ctaBand()}`;
  return {
    title: page.metaTitle || p.title + ' | Firestone Blog', description: page.metaDescription || p.excerpt, body,
    jsonld: [crumbLD(trail), { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, author: { '@type': p.author ? 'Person' : 'Organization', name: p.author || 'Firestone' }, publisher: { '@type': 'Organization', name: 'Firestone Fire & Security Systems LLC', logo: { '@type': 'ImageObject', url: SITE_URL + '/img/brand/logo-full.png' } }, mainEntityOfPage: url, description: p.excerpt }],
    search: { toc },
  };
}

// ================================================================= 404
export function notFound() {
  return {
    title: 'Page not found | Firestone', description: 'This page could not be found.', noindex: true,
    body: `<section class="nf"><div class="wrap" style="display:grid;justify-items:center;gap:20px">
  <span class="hand" style="font-size:22px">404 — no exit this way</span>
  <h1 class="h1">This page isn’t on the plan.</h1>
  <p class="lead">The page may have moved. Search the site or head back to safety.</p>
  <div class="phero__acts" style="justify-content:center"><button type="button" class="btn btn--lg" data-search><span class="sq"></span>Search the site</button><a class="btn btn--ghost btn--lg" href="/">Back to home</a></div>
</div></section>`,
  };
}
