// Duotone office map: paper land, green water, inked roads, extruded
// buildings. Vector tiles from OpenFreeMap (no API key). Office pins and
// details come from the live settings, so admin edits show up immediately.
import { esc, directions } from './shared.js';

const P = { paper: '#F6F6F6', paper2: '#EDEDEB', ink: '#080808', green: '#2B9D47', mute: '#8b8f8b' };

export const mapStyle = {
  version: 8,
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  sources: { omt: { type: 'vector', url: 'https://tiles.openfreemap.org/planet' } },
  light: { anchor: 'viewport', color: '#ffffff', intensity: 0.42, position: [1.4, 200, 40] },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': P.paper2 } },
    { id: 'landuse', type: 'fill', source: 'omt', 'source-layer': 'landuse', paint: { 'fill-color': '#E4E5E1', 'fill-opacity': 0.8 } },
    { id: 'park', type: 'fill', source: 'omt', 'source-layer': 'park', paint: { 'fill-color': '#D5E6D9' } },
    { id: 'landcover', type: 'fill', source: 'omt', 'source-layer': 'landcover', filter: ['in', ['get', 'class'], ['literal', ['grass', 'wood', 'farmland']]], paint: { 'fill-color': '#DCE8DE', 'fill-opacity': 0.6 } },
    { id: 'sand', type: 'fill', source: 'omt', 'source-layer': 'landcover', filter: ['==', ['get', 'class'], 'sand'], paint: { 'fill-color': '#F1F1EE' } },
    { id: 'water', type: 'fill', source: 'omt', 'source-layer': 'water', paint: { 'fill-color': P.green } },
    { id: 'water-edge', type: 'line', source: 'omt', 'source-layer': 'water', paint: { 'line-color': P.ink, 'line-width': 0.8, 'line-opacity': 0.5 } },
    { id: 'waterway', type: 'line', source: 'omt', 'source-layer': 'waterway', paint: { 'line-color': P.green, 'line-width': 1.2 } },
    { id: 'aeroway', type: 'fill', source: 'omt', 'source-layer': 'aeroway', filter: ['==', ['geometry-type'], 'Polygon'], paint: { 'fill-color': '#E0E1DD' } },
    { id: 'runway', type: 'line', source: 'omt', 'source-layer': 'aeroway', filter: ['in', ['get', 'class'], ['literal', ['runway', 'taxiway']]], paint: { 'line-color': P.paper, 'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1, 15, 14] } },
    { id: 'road-minor', type: 'line', source: 'omt', 'source-layer': 'transportation', filter: ['in', ['get', 'class'], ['literal', ['minor', 'service', 'track']]], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#ffffff', 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 0.4, 16, 7] } },
    { id: 'road-path', type: 'line', source: 'omt', 'source-layer': 'transportation', filter: ['==', ['get', 'class'], 'path'], paint: { 'line-color': P.mute, 'line-width': 0.8, 'line-dasharray': [2, 2] } },
    { id: 'road-major-case', type: 'line', source: 'omt', 'source-layer': 'transportation', filter: ['in', ['get', 'class'], ['literal', ['primary', 'secondary', 'tertiary', 'trunk']]], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': P.ink, 'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.6, 12, 2.5, 16, 14] } },
    { id: 'road-major', type: 'line', source: 'omt', 'source-layer': 'transportation', filter: ['in', ['get', 'class'], ['literal', ['primary', 'secondary', 'tertiary', 'trunk']]], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#ffffff', 'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.2, 12, 1.4, 16, 11] } },
    { id: 'motorway-case', type: 'line', source: 'omt', 'source-layer': 'transportation', filter: ['==', ['get', 'class'], 'motorway'], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': P.ink, 'line-width': ['interpolate', ['linear'], ['zoom'], 6, 0.8, 12, 4, 16, 18] } },
    { id: 'motorway', type: 'line', source: 'omt', 'source-layer': 'transportation', filter: ['==', ['get', 'class'], 'motorway'], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': P.paper, 'line-width': ['interpolate', ['linear'], ['zoom'], 6, 0.4, 12, 2.4, 16, 14] } },
    { id: 'motorway-centre', type: 'line', source: 'omt', 'source-layer': 'transportation', filter: ['==', ['get', 'class'], 'motorway'], minzoom: 11, paint: { 'line-color': P.green, 'line-width': 1, 'line-dasharray': [4, 3] } },
    { id: 'rail', type: 'line', source: 'omt', 'source-layer': 'transportation', filter: ['in', ['get', 'class'], ['literal', ['rail', 'transit']]], paint: { 'line-color': P.ink, 'line-width': 1, 'line-dasharray': [3, 2] } },
    { id: 'boundary', type: 'line', source: 'omt', 'source-layer': 'boundary', filter: ['<=', ['get', 'admin_level'], 4], paint: { 'line-color': P.ink, 'line-width': 1, 'line-dasharray': [4, 3], 'line-opacity': 0.45 } },
    { id: 'building', type: 'fill-extrusion', source: 'omt', 'source-layer': 'building', minzoom: 13, paint: { 'fill-extrusion-color': ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 6], 0, '#FBFBFA', 60, '#F2F3F0', 200, '#E8EAE6'], 'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 6], 'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0], 'fill-extrusion-opacity': 0.96 } },
    { id: 'road-label', type: 'symbol', source: 'omt', 'source-layer': 'transportation_name', minzoom: 13, layout: { 'symbol-placement': 'line', 'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name_en'], ['get', 'name']], 'text-font': ['Noto Sans Regular'], 'text-size': 11, 'text-letter-spacing': 0.05 }, paint: { 'text-color': '#3a3d3a', 'text-halo-color': '#ffffff', 'text-halo-width': 1.6 } },
    { id: 'place-small', type: 'symbol', source: 'omt', 'source-layer': 'place', filter: ['in', ['get', 'class'], ['literal', ['suburb', 'neighbourhood', 'quarter', 'village']]], minzoom: 11, layout: { 'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name_en'], ['get', 'name']], 'text-font': ['Noto Sans Regular'], 'text-size': 11, 'text-transform': 'uppercase', 'text-letter-spacing': 0.12 }, paint: { 'text-color': '#5e615e', 'text-halo-color': P.paper2, 'text-halo-width': 1.6 } },
    { id: 'place-city', type: 'symbol', source: 'omt', 'source-layer': 'place', filter: ['in', ['get', 'class'], ['literal', ['city', 'town']]], layout: { 'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name_en'], ['get', 'name']], 'text-font': ['Noto Sans Bold'], 'text-size': ['interpolate', ['linear'], ['zoom'], 6, 11, 12, 16], 'text-transform': 'uppercase', 'text-letter-spacing': 0.18 }, paint: { 'text-color': P.ink, 'text-halo-color': P.paper2, 'text-halo-width': 2 } },
  ],
};

function loadLib() {
  if (window.maplibregl) return Promise.resolve(window.maplibregl);
  return new Promise((res, rej) => {
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = '/vendor/maplibre-gl.css'; document.head.appendChild(css);
    const s = document.createElement('script'); s.src = '/vendor/maplibre-gl.js'; s.onload = () => res(window.maplibregl); s.onerror = rej; document.head.appendChild(s);
  });
}

export function pinEl(o) {
  const el = document.createElement('div');
  el.className = 'pin';
  el.innerHTML = `<span class="pin__ring"></span><span class="pin__dot"></span><span class="pin__label">${esc(o.city)}</span>`;
  return el;
}

export async function mountMap(root, getSettings) {
  const mapEl = root.querySelector('.map');
  const list = root.querySelector('[data-offices="list"]');
  let gl;
  try { gl = await loadLib(); } catch (e) { root.querySelector('.map-fallback')?.removeAttribute('hidden'); return; }
  const offices = () => (getSettings().offices || []).filter((o) => isFinite(o.lat) && isFinite(o.lng));
  const bounds = () => { const b = new gl.LngLatBounds(); offices().forEach((o) => b.extend([o.lng, o.lat])); return b; };
  const map = new gl.Map({
    container: mapEl, style: mapStyle, bounds: bounds(), fitBoundsOptions: { padding: 80 },
    pitch: 40, bearing: -12, attributionControl: { compact: true }, cooperativeGestures: true, maxPitch: 70,
  });
  map.addControl(new gl.NavigationControl({ visualizePitch: true }), 'bottom-right');
  let markers = [];
  function placePins() {
    markers.forEach((m) => m.remove());
    markers = offices().map((o) => {
      const el = pinEl(o);
      el.addEventListener('click', () => select(o.id));
      el.dataset.id = o.id;
      return new gl.Marker({ element: el, anchor: 'center' }).setLngLat([o.lng, o.lat]).addTo(map);
    });
  }
  function select(id, fly = true) {
    const o = offices().find((x) => x.id === id); if (!o) return;
    markers.forEach((m) => m.getElement().classList.toggle('is-active', m.getElement().dataset.id === id));
    list?.querySelectorAll('.office').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.office === id)));
    if (fly) map.flyTo({ center: [o.lng, o.lat], zoom: 15.6, pitch: 58, bearing: -20 + Math.random() * 40, speed: 0.9, curve: 1.5, essential: true });
  }
  map.on('load', placePins);
  map.on('error', (e) => { if (String(e?.error?.message || '').includes('Failed to fetch')) root.querySelector('.map-fallback')?.removeAttribute('hidden'); });
  list?.addEventListener('click', (e) => {
    if (e.target.closest('a')) return;
    const b = e.target.closest('.office'); if (b) select(b.dataset.office);
  });
  root.querySelector('[data-map-all]')?.addEventListener('click', () => { map.fitBounds(bounds(), { padding: 80, pitch: 40, bearing: -12, duration: 1600 }); markers.forEach((m) => m.getElement().classList.remove('is-active')); });
  document.addEventListener('fs:settings', () => { if (map.loaded()) placePins(); });
  root.__map = map;
  return map;
}

export { directions };
