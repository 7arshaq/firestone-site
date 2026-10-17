# Firestone — website redesign

A full redesign of [firestonefs.com](https://www.firestonefs.com/), the site of Firestone Fire & Security
Systems, a Civil Defence Grade A fire and safety company in the UAE.

The home page tells the company's story as one continuous 3D scroll: an engineer at a drafting desk,
a shop drawing that redlines itself, the drawing rising into a building floor by floor, the floors
separating to show the fire systems inside, and maintenance visits orbiting the finished tower. Every
page of the old site was carried over at the **same URL**, each with its own hand-built 3D illustration.

Palette: green `#2B9D47`, ink `#080808`, paper `#F6F6F6`, rendered as a two-tone, cel-shaded,
ink-outlined drawing style.

## Highlights

- **Scroll journey** in Three.js. Geometry is merged per material, shaders and GPU state are warmed
  up before the scene shows, and the shop drawing is "baked": it's painted once, and a small shader
  reveals each mark as you scroll, so nothing is redrawn or re-uploaded mid-scroll. It holds 120 fps
  on a 120 Hz display.
- **About 60 procedural 3D models**, one per service, project and article, all built in code. They
  follow the mouse on desktop and sway gently on touch screens.
- **Custom office map** using MapLibre GL with a duotone style over OpenFreeMap tiles (no API key).
  Pins are editable from the admin.
- **Quote wizard**, contact and career forms (with CV upload), with a WhatsApp fallback when the
  server isn't available.
- **Admin panel**: offices and map pins, contact and social links, an article editor with live
  preview and auto-generated covers, an About-page photo collage (in-browser resize plus duotone),
  and an inbox with CSV export. Saving rebuilds the site.
- **Details**: a custom cursor, a site search (Ctrl K), a mobile action dock, an interactive footer
  wordmark and reduced-motion support.
- **SEO kept intact**: original URLs, `sitemap.xml`, `robots.txt`, canonical tags and structured data
  (Organization, LocalBusiness per office, Service, FAQ, BlogPosting, JobPosting).

## Built with

| Layer | What |
| --- | --- |
| Pages | A small custom static site generator in Node.js (ES modules, no framework). Templates in `build/`, content as JSON in `content/`. It renders 87 pages into `dist/`. |
| Server | A zero-dependency Node `http` server (`server.mjs`): clean URLs, gzip, ETag caching, forms API (honeypot plus rate limiting), and an admin API (scrypt-hashed password, session cookie). |
| Front end | Vanilla JavaScript modules and hand-written CSS. No UI framework or CSS framework. |
| 3D | [Three.js](https://threejs.org/) r169: toon materials with a 2-step gradient, inverted-hull outlines, edge lines, PCF shadows. |
| Scrolling | [Lenis](https://github.com/darkroomengineering/lenis) smooth scroll. |
| Maps | [MapLibre GL JS](https://maplibre.org/) with [OpenFreeMap](https://openfreemap.org/) tiles and a custom style. |
| Type | Geist, Geist Mono, Patrick Hand and Montserrat (Google Fonts). |

The only npm dependencies are `three`, `lenis` and `maplibre-gl`. The build copies them into `dist/vendor/`.

## Run it

Requires Node 18+.

```bash
npm install
npm start
```

Open http://localhost:3000. The admin panel is at http://localhost:3000/admin/.

`npm run dev` does the same, and also rebuilds automatically when you edit files in
`content/`, `public/` or `build/`.

### Admin login

On its first start, the server creates `data/admin.json` and prints a **one-time password** in the
terminal. Sign in with it, then set your own under **Settings → Change password**. On a server, set the
`ADMIN_PASSWORD` environment variable before the first start instead.

**Save & publish** in the admin writes `data/settings.json` and rebuilds every page, so changes go live
immediately (footer, contact page, maps and structured data).

## Project structure

| Path | What |
| --- | --- |
| `content/pages/*.json` | Every service, blog post and job page, imported from the old site. |
| `content/site.mjs` | Copy for the home, about, projects, emergency and other custom pages. |
| `build/` | Page templates, the content-block renderer, the service catalogue and the static build. |
| `public/js/journey.js` | The home page scroll journey. |
| `public/js/models*.js`, `registry.js` | The procedural 3D models and which page each one illustrates. |
| `public/js/fs3d.js`, `bake.js` | The duotone renderer helpers and geometry merging. |
| `public/js/map.js` | The custom office map. |
| `public/css/site.css` | The design system. |
| `public/admin/` | The admin panel. |
| `server.mjs` | The server: pages, forms API, admin API. |
| `tools/import-crawl.mjs` | One-time importer that turned the crawled old site into `content/pages/*.json`. |
| `data/` | `settings.json` (offices, contacts) and `posts.json` (admin articles). Runtime files (form submissions, CV uploads, media and the admin login) stay local and are git-ignored. |

## Deploying

Any host that runs Node 18+ works (a VPS, Render, Railway, Fly.io and so on):
1. Run `npm install` and then `npm start`.
2. Set `PORT` if your host needs it, and set `ADMIN_PASSWORD`.
3. Keep the `data/` folder on persistent storage.

The `dist/` folder also works on plain static hosting, but forms then fall back to WhatsApp and the
admin panel is unavailable.

> The office map pins were placed from street addresses and are approximate. To set one exactly, paste
> that office's Google Maps link into the admin.

## Credits

Design and development of the redesign by Arshaq. The company name, logo, photos and copy belong to
Firestone Fire & Security Systems LLC, and client logos belong to their respective owners. They're
shown here as a portfolio piece. All rights reserved.
