// Hero vignettes (one live canvas per page) and card thumbnails (rendered
// once from a shared offscreen renderer). Every vignette responds the same
// way: the camera eases toward the pointer, idles with a gentle sway, and eases
// with scroll. No dragging — it simply follows the mouse.
import { THREE, renderer, rig, ink, shadows, shadowGround, frame, fontsReady, snapshot } from './fs3d.js';
import { resolve } from './registry.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const lerp = (a, b, k) => a + (b - a) * k;

export async function mountVignette(el) {
  const build = resolve(el.dataset.vignette);
  await fontsReady;
  const canvas = document.createElement('canvas');
  canvas.style.opacity = 0; canvas.style.transition = 'opacity 1s cubic-bezier(.22,.8,.2,1)';
  el.prepend(canvas);
  const r = renderer(canvas);
  // light rendering: modest resolution, a small pixel budget, and shadows refreshed only every few frames
  r.shadowMap.type = THREE.PCFShadowMap;
  r.shadowMap.autoUpdate = false;
  const MAXPX = 0.85e6;
  const setRatio = (w, h) => r.setPixelRatio(Math.max(0.6, Math.min(window.devicePixelRatio || 1, 1.25, Math.sqrt(MAXPX / Math.max(1, w * h)))));
  const scene = new THREE.Scene();
  const model = build();
  ink(model); shadows(model);
  const box = new THREE.Box3().setFromObject(model, true);
  const c = box.getCenter(new THREE.Vector3());
  model.position.x -= c.x; model.position.z -= c.z;
  const pivot = new THREE.Group(); pivot.add(model); scene.add(pivot);
  const size = box.getSize(new THREE.Vector3());
  const ext = Math.max(size.x, size.y, size.z) * 1.2;
  rig(scene, { extent: ext, size: 1024, target: new THREE.Vector3(0, size.y / 2, 0), dir: [-3.2 * ext / 2.4, 6 * ext / 2.4, 4.2 * ext / 2.4] });
  scene.add(shadowGround(ext * 10, box.min.y));
  const cam = new THREE.PerspectiveCamera(30, 1, 0.01, 100);
  const BASE = new THREE.Vector3(1, 0.58, 1.2).normalize();
  let fr, az0 = Math.atan2(BASE.x, BASE.z), el0 = Math.asin(BASE.y);
  let drawReady = false;
  function resize() {
    const w = el.clientWidth, h = el.clientHeight || w;
    setRatio(w, h); r.setSize(w, h, false); cam.aspect = w / h;
    r.shadowMap.needsUpdate = true;
    const rot = pivot.rotation.y; pivot.rotation.y = 0;
    fr = frame(cam, pivot, { dir: BASE.clone(), pad: 1.02 });
    pivot.rotation.y = rot;
    // setSize clears the canvas: redraw straight away so a resize never flashes an empty frame
    if (drawReady) draw((performance.now() - t0) / 1000, 0);
  }
  resize();
  new ResizeObserver(resize).observe(el);

  // interaction state
  let az = az0, elv = el0, tAz = az0, tEl = el0, hover = 0, tHover = 0;
  let gx = 0, gy = 0;
  addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') { gx = e.clientX / innerWidth - 0.5; gy = e.clientY / innerHeight - 0.5; } }, { passive: true });
  el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') tHover = 1; });
  el.addEventListener('pointerleave', () => { tHover = 0; });
  el.addEventListener('pointermove', (e) => {
    const rect = el.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5, ny = (e.clientY - rect.top) / rect.height - 0.5;
    if (e.pointerType === 'mouse') { tAz = az0 + nx * 0.9; tEl = el0 - ny * 0.35; }
  });

  let visible = true, t0 = performance.now(), last = t0, raf = 0, frameN = 0, top = el.getBoundingClientRect().top;
  const measure = () => { top = el.getBoundingClientRect().top; };
  addEventListener('scroll', measure, { passive: true }); addEventListener('resize', measure);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !reduce) loop(); }, { rootMargin: '100px' }).observe(el);

  const tmp = new THREE.Vector3();
  function draw(t, dt) {
    const scroll = Math.max(-1, Math.min(1, top / innerHeight));
    // idle sway keeps every drawing alive; touch screens get a little more of it
    const sway = fine ? 0.07 : 0.22;
    if (!tHover) { tAz = az0 + gx * 0.35 - scroll * (fine ? 0.5 : 0.7) + Math.sin(t * 0.42) * sway; tEl = el0 - gy * 0.12 + Math.sin(t * 0.31) * sway * 0.25; }
    const k = 1 - Math.exp(-dt * 6);
    az = lerp(az, tAz, k); elv = lerp(elv, Math.max(0.08, Math.min(1.2, tEl)), k);
    hover = lerp(hover, tHover, 1 - Math.exp(-dt * 8));
    pivot.rotation.y = Math.sin(t * 0.25) * 0.06;
    pivot.scale.setScalar(1 + hover * 0.035);
    const d = fr.dist * (1 - hover * 0.04);
    tmp.set(Math.sin(az) * Math.cos(elv), Math.sin(elv), Math.cos(az) * Math.cos(elv)).multiplyScalar(d).add(fr.center);
    cam.position.copy(tmp); cam.lookAt(fr.center);
    if (model.userData.tick) model.userData.tick(t, dt);
    if (frameN % 3 === 0) r.shadowMap.needsUpdate = true;
    r.render(scene, cam);
  }
  function loop() {
    cancelAnimationFrame(raf);
    const step = () => {
      if (!visible) return;
      frameN++;
      if (tHover || hover > 0.02 || frameN % 2 === 0) {
        const now = performance.now(), dt = Math.min(0.08, (now - last) / 1000); last = now;
        draw((now - t0) / 1000, dt);
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }
  r.shadowMap.needsUpdate = true;
  if (reduce) { if (model.userData.pose) model.userData.pose(1); draw(2, 0.016); } else { draw(0, 0.016); loop(); }
  drawReady = true;
  requestAnimationFrame(() => (canvas.style.opacity = 1));
  el.classList.add('is-live');
}

export function mountThumbs(root = document) {
  const imgs = [...root.querySelectorAll('img[data-model]:not([data-done])')];
  if (!imgs.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(async (e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      const img = e.target, key = img.dataset.model;
      img.dataset.done = '1';
      try {
        img.src = await snapshot(key, resolve(key));
        img.decode?.().catch(() => {}).finally(() => img.classList.add('rendered'));
      } catch (err) { img.classList.add('rendered'); }
    });
  }, { rootMargin: '400px' });
  imgs.forEach((i) => io.observe(i));
}
