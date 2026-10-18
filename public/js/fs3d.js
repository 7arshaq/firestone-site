// Duotone 3D engine: lit faces render paper-white, faces in shade or shadow
// render Firestone green, hard edges are inked like a shop drawing.
import * as THREE from 'three';

export { THREE };
export const COLORS = { paper: '#F6F6F6', ink: '#080808', green: '#2B9D47' };

let _grad;
function gradient() {
  if (_grad) return _grad;
  const n = 32, data = new Uint8Array(n * 4);
  for (let i = 0; i < n; i++) {
    const v = (i + 0.5) / n > 0.56 ? 255 : 0;
    data.set([v, v, v, 255], i * 4);
  }
  _grad = new THREE.DataTexture(data, n, 1, THREE.RGBAFormat);
  _grad.minFilter = _grad.magFilter = THREE.NearestFilter;
  _grad.needsUpdate = true;
  return _grad;
}

const cache = {};
// paper: white albedo; mid: light grey; ink: near black; green: brand green
export function mat(kind = 'paper', opts = {}) {
  // toon and basic materials have no flat-shading switch (three.js warns and ignores it), so drop it
  if ('flatShading' in opts) { const { flatShading, ...rest } = opts; opts = rest; }
  const key = kind + JSON.stringify(opts);
  if (cache[key]) return cache[key];
  let m;
  switch (kind) {
    case 'paper': m = new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: gradient(), ...opts }); break;
    case 'mid': m = new THREE.MeshToonMaterial({ color: '#d9dcd8', gradientMap: gradient(), ...opts }); break;
    case 'dim': m = new THREE.MeshToonMaterial({ color: '#b9bdb8', gradientMap: gradient(), ...opts }); break;
    case 'ink': m = new THREE.MeshToonMaterial({ color: '#1b1b1b', gradientMap: gradient(), ...opts }); break;
    case 'green': m = new THREE.MeshToonMaterial({ color: COLORS.green, gradientMap: gradient(), ...opts }); break;
    case 'glow': m = new THREE.MeshBasicMaterial({ color: COLORS.green, ...opts }); break;
    case 'flat': m = new THREE.MeshBasicMaterial({ color: COLORS.paper, ...opts }); break;
    case 'inkflat': m = new THREE.MeshBasicMaterial({ color: COLORS.ink, ...opts }); break;
    case 'glass': m = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.28, depthWrite: false, ...opts }); break;
    case 'ghost': m = new THREE.MeshBasicMaterial({ color: COLORS.green, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide, ...opts }); break;
    default: m = new THREE.MeshToonMaterial({ color: kind, gradientMap: gradient(), ...opts });
  }
  cache[key] = m;
  return m;
}

const lineMat = new THREE.LineBasicMaterial({ color: COLORS.ink, transparent: true, opacity: 0.9 });
// Ink the hard edges of every mesh under obj
export function ink(obj, angle = 32) {
  const meshes = [];
  obj.traverse((o) => { if (o.isMesh && !o.userData.noInk && !o.userData.inked) meshes.push(o); });
  for (const m of meshes) {
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, m.userData.inkAngle || angle), m.userData.lineMat || lineMat);
    e.raycast = () => {};
    e.userData.isInk = true;
    m.add(e);
    m.userData.inked = true;
  }
  return obj;
}

// Cartoon outline: an inflated back-face shell in ink around smooth meshes
const hullMats = {};
function hullMat(th) {
  const key = th.toFixed(4);
  if (hullMats[key]) return hullMats[key];
  const m = new THREE.MeshBasicMaterial({ color: COLORS.ink, side: THREE.BackSide });
  m.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', `vec3 transformed = vec3( position ) + normal * ${th.toFixed(5)};`); };
  m.customProgramCacheKey = () => 'hull' + key;
  return (hullMats[key] = m);
}
export function outline(obj, th = 0.006) {
  const list = [];
  obj.traverse((o) => { if (o.isMesh && o.userData.outline && !o.userData.hulled) list.push(o); });
  for (const m of list) {
    const t = typeof m.userData.outline === 'number' ? m.userData.outline : th;
    const h = new THREE.Mesh(m.geometry, hullMat(t));
    h.userData.noInk = true; h.userData.isHull = true; h.raycast = () => {};
    m.add(h); m.userData.hulled = true;
  }
  return obj;
}

// Give a group its own materials so it can fade in/out without popping
// (sub-groups flagged userData.ownFade keep their own materials and fade separately)
export function fadable(group) {
  const map = new Map(), casters = [];
  (function walk(o, root) {
    if (!root && o.userData.ownFade) return;
    if ((o.isMesh || o.isLine || o.isLineSegments) && o.material) {
      const src = o.material;
      if (!map.has(src)) { const c = src.clone(); c.userData.base = src.opacity ?? 1; map.set(src, c); }
      o.material = map.get(src);
      if (o.isMesh && !o.userData.isHull && !o.material.isMeshBasicMaterial && !o.material.isShadowMaterial) casters.push(o);
    }
    o.children.forEach((c) => walk(c, false));
  })(group, true);
  const mats = [...map.values()];
  let last = -1;
  const set = (k) => {
    k = Math.max(0, Math.min(1, k));
    if (Math.abs(k - last) < 0.002 && !(k === 0 || k === 1) ) return;
    if (k === last) return;
    last = k;
    group.visible = k > 0.003;
    for (const m of mats) {
      m.opacity = m.userData.base * k;
      const t = k < 0.995 || m.userData.base < 1;
      if (m.transparent !== t) { m.transparent = t; m.needsUpdate = true; }
    }
    for (const o of casters) o.castShadow = k > 0.6;
  };
  set(0);
  return set;
}

export function shadows(obj, cast = true, receive = true) {
  obj.traverse((o) => { if (o.isMesh && !o.userData.isHull && !o.material.transparent && !(o.material.isMeshBasicMaterial)) { o.castShadow = cast; o.receiveShadow = receive; } });
  return obj;
}

// Keep the shadow map tight around what the camera is looking at, snapped to
// texels so it stays crisp without shimmering
export function fitShadow(sun, center, extent) {
  const cam = sun.shadow.camera;
  const size = sun.shadow.mapSize.x;
  const e = Math.max(0.4, Math.round(extent * 20) / 20);
  const texel = (2 * e) / size;
  const dir = sun.userData.dir || (sun.userData.dir = sun.position.clone().sub(sun.target.position).normalize());
  const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
  const up = new THREE.Vector3().crossVectors(right, dir).normalize();
  const c = center.clone();
  const r = Math.round(c.dot(right) / texel) * texel, u = Math.round(c.dot(up) / texel) * texel, f = c.dot(dir);
  const snapped = right.multiplyScalar(r).add(up.multiplyScalar(u)).add(dir.clone().multiplyScalar(f));
  sun.target.position.copy(snapped);
  sun.position.copy(snapped).addScaledVector(dir, 20);
  if (cam.right !== e) { cam.left = -e; cam.right = e; cam.top = e; cam.bottom = -e; cam.near = 1; cam.far = 45; cam.updateProjectionMatrix(); }
  sun.target.updateMatrixWorld();
}

// Lighting rig that produces the two-tone look
export function rig(scene, { dir = [-3.2, 6, 4.2], size = 2048, extent = 3, target = new THREE.Vector3() } = {}) {
  const g = new THREE.Color(COLORS.green);
  const p = new THREE.Color(COLORS.paper);
  const amb = new THREE.AmbientLight(g, Math.PI);
  const sunColor = new THREE.Color(Math.max(p.r - g.r, 0), Math.max(p.g - g.g, 0), Math.max(p.b - g.b, 0));
  const sun = new THREE.DirectionalLight(sunColor, Math.PI);
  sun.position.set(...dir).add(target);
  sun.target.position.copy(target);
  sun.castShadow = true;
  sun.shadow.mapSize.set(size, size);
  const c = sun.shadow.camera;
  c.left = -extent; c.right = extent; c.top = extent; c.bottom = -extent; c.near = 0.1; c.far = 40;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.02;
  scene.add(amb, sun, sun.target);
  return { amb, sun };
}

export function renderer(canvas, { alpha = true, antialias = true } = {}) {
  const r = new THREE.WebGLRenderer({ canvas, alpha, antialias, powerPreference: 'high-performance', preserveDrawingBuffer: false });
  r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.NoToneMapping;
  r.shadowMap.enabled = true;
  r.shadowMap.type = THREE.PCFShadowMap;
  if (alpha) r.setClearColor(0x000000, 0);
  return r;
}

// Ground that only shows the (green) shadow, for transparent canvases
export function shadowGround(size = 12, y = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.ShadowMaterial({ color: COLORS.green, opacity: 1 }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = y;
  m.receiveShadow = true;
  m.userData.noInk = true;
  return m;
}

export function frame(camera, obj, { dir = new THREE.Vector3(1, 0.62, 1.15), pad = 1.12 } = {}) {
  const box = new THREE.Box3().setFromObject(obj, true);
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const fov = THREE.MathUtils.degToRad(camera.fov);
  const dist = (sphere.radius * pad) / Math.sin(fov / 2) / Math.min(1, camera.aspect);
  camera.position.copy(sphere.center).add(dir.clone().normalize().multiplyScalar(dist));
  camera.lookAt(sphere.center);
  camera.near = dist / 50; camera.far = dist * 6;
  camera.updateProjectionMatrix();
  return { center: sphere.center, radius: sphere.radius, dist };
}

// Canvas texture helper (fonts must be loaded first)
export function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export const fontsReady = (async () => {
  try {
    await Promise.all([
      document.fonts.load('400 32px "Architects Daughter"'),
      document.fonts.load('500 32px "Geist Mono"'),
      document.fonts.load('600 32px "Geist"'),
    ]);
  } catch (e) { /* fonts are a nicety */ }
})();

export function webglOK() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

// ---------- shared offscreen renderer for thumbnails ----------
let _thumbR, _thumbCanvas;
const _thumbCache = new Map();
export async function snapshot(key, build, { w = 640, h = 480, dir } = {}) {
  if (_thumbCache.has(key)) return _thumbCache.get(key);
  await fontsReady;
  if (!_thumbR) {
    _thumbCanvas = document.createElement('canvas');
    _thumbR = renderer(_thumbCanvas, { alpha: true });
    _thumbR.setPixelRatio(1);
  }
  _thumbR.setSize(w, h, false);
  const scene = new THREE.Scene();
  const model = build();
  ink(model); shadows(model);
  scene.add(model);
  const box = new THREE.Box3().setFromObject(model, true);
  const ext = box.getBoundingSphere(new THREE.Sphere()).radius * 1.6;
  rig(scene, { extent: ext, target: box.getCenter(new THREE.Vector3()), dir: [-3.2 * ext / 2, 6 * ext / 2, 4.2 * ext / 2] });
  scene.add(shadowGround(ext * 8, box.min.y));
  const cam = new THREE.PerspectiveCamera(28, w / h, 0.01, 100);
  frame(cam, model, { dir: dir || new THREE.Vector3(1, 0.62, 1.15), pad: 1.02 });
  if (model.userData.pose) model.userData.pose(0.8);
  _thumbR.render(scene, cam);
  const url = await new Promise((res) => _thumbCanvas.toBlob((b) => res(URL.createObjectURL(b)), 'image/png'));
  _thumbCache.set(key, url);
  scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
  return url;
}
