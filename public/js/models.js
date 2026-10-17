// Procedural models for every service family, built from primitives so they
// share the duotone look. Each returns a Group with its base on y = 0.
// Optional userData.tick(t, dt) animates it.
import { THREE, mat, canvasTex, COLORS } from './fs3d.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const G = () => new THREE.Group();
function at(o, x = 0, y = 0, z = 0) { o.position.set(x, y, z); return o; }
function box(w, h, d, m = 'paper', x = 0, y = 0, z = 0) { return at(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof m === 'string' ? mat(m) : m), x, y, z); }
function cyl(rt, rb, h, m = 'paper', seg = 32, x = 0, y = 0, z = 0, open = false) {
  return at(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg, 1, open), typeof m === 'string' ? mat(m) : m), x, y, z);
}
function sph(r, m = 'paper', x = 0, y = 0, z = 0, hemi = false, ws = 32, hs = 16) {
  return at(new THREE.Mesh(new THREE.SphereGeometry(r, ws, hs, 0, Math.PI * 2, 0, hemi ? Math.PI / 2 : Math.PI), typeof m === 'string' ? mat(m) : m), x, y, z);
}
function torus(r, t, m = 'ink', x = 0, y = 0, z = 0, rs = 10, ts = 48, arc = Math.PI * 2) {
  return at(new THREE.Mesh(new THREE.TorusGeometry(r, t, rs, ts, arc), typeof m === 'string' ? mat(m) : m), x, y, z);
}
function tube(pts, r, m = 'ink', seg = 48) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => V(...p)));
  return new THREE.Mesh(new THREE.TubeGeometry(curve, seg, r, 10, false), typeof m === 'string' ? mat(m) : m);
}
function lathe(profile, m = 'paper', seg = 40) {
  return new THREE.Mesh(new THREE.LatheGeometry(profile.map(([x, y]) => new THREE.Vector2(x, y)), seg), typeof m === 'string' ? mat(m) : m);
}
function add(p, ...c) { c.forEach((o) => p.add(o)); return p; }
function rotX(o, a) { o.rotation.x = a; return o; }
function rotZ(o, a) { o.rotation.z = a; return o; }
function rotY(o, a) { o.rotation.y = a; return o; }
function texMat(tex, basic = false) {
  return basic ? new THREE.MeshBasicMaterial({ map: tex }) : new THREE.MeshToonMaterial({ map: tex, gradientMap: mat('paper').gradientMap });
}
function tree(s = 1, x = 0, z = 0) {
  const g = G();
  add(g, cyl(0.02 * s, 0.03 * s, 0.22 * s, 'ink', 6, 0, 0.11 * s, 0));
  const c = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16 * s, 0), mat('mid', { flatShading: true }));
  at(c, 0, 0.32 * s, 0); c.scale.set(1, 1.1, 1);
  const c2 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.11 * s, 0), mat('mid', { flatShading: true }));
  at(c2, 0.07 * s, 0.44 * s, 0.02 * s);
  add(g, c, c2);
  return at(g, x, 0, z);
}
const HAND = '"Patrick Hand", cursive';
const MONO = '"Geist Mono", monospace';
const SANS = '"Geist", sans-serif';

// ---------------------------------------------------------------- tower
export function tower() {
  const g = G();
  add(g, box(1.9, 0.05, 1.5, 'mid', 0, 0.025, 0));
  const blocks = [
    { w: 1.0, d: 0.78, n: 4, x: 0, z: 0 },
    { w: 0.86, d: 0.7, n: 4, x: -0.05, z: 0.02 },
    { w: 0.66, d: 0.58, n: 3, x: -0.1, z: 0.04 },
  ];
  let y = 0.05; const sh = 0.19;
  for (const b of blocks) {
    for (let i = 0; i < b.n; i++) {
      add(g, box(b.w, sh - 0.025, b.d, 'paper', b.x, y + (sh - 0.025) / 2, b.z));
      add(g, box(b.w * 0.94, 0.07, 0.01, 'ink', b.x, y + 0.085, b.z + b.d / 2 + 0.002));
      const side = box(0.01, 0.07, b.d * 0.9, 'ink', b.x + b.w / 2 + 0.002, y + 0.085, b.z); add(g, side);
      add(g, box(b.w + 0.05, 0.025, b.d + 0.05, 'mid', b.x, y + sh - 0.0125, b.z));
      y += sh;
    }
  }
  // roof plant + beacon
  add(g, cyl(0.09, 0.09, 0.16, 'paper', 24, 0.05, y + 0.08, -0.08));
  add(g, box(0.18, 0.1, 0.14, 'mid', -0.22, y + 0.05, 0.05));
  const beacon = sph(0.045, 'glow', -0.3, y + 0.16, 0.18); add(g, cyl(0.008, 0.008, 0.12, 'ink', 6, -0.3, y + 0.06, 0.18), beacon);
  // external fire riser in brand green, with landing valves
  const rx = 0.52, rz = 0.3;
  add(g, cyl(0.022, 0.022, y - 0.05, 'green', 12, rx, 0.05 + (y - 0.05) / 2, rz));
  for (let k = 0.2; k < y - 0.1; k += sh * 2) add(g, rotZ(cyl(0.016, 0.016, 0.08, 'green', 10, rx - 0.04, k, rz), Math.PI / 2), cyl(0.03, 0.03, 0.02, 'ink', 10, rx, k, rz));
  add(g, tree(1, 0.75, 0.55), tree(0.8, -0.72, 0.6), tree(1.1, 0.7, -0.5));
  // inspection scan plane
  const scan = box(1.2, 0.012, 0.98, 'ghost', 0, 0.1, 0); scan.material = mat('ghost', { opacity: 0.35 }); scan.userData.noInk = true;
  add(g, scan);
  const top = y;
  g.userData.tick = (t) => {
    const k = (t * 0.22) % 1;
    scan.position.y = 0.06 + k * (top - 0.06);
    scan.scale.setScalar(1 - k * 0.25);
    beacon.scale.setScalar(1 + Math.max(0, Math.sin(t * 5)) * 0.6);
  };
  return g;
}

// ---------------------------------------------------------------- detector
export function detector() {
  const g = G();
  const d = G();
  add(d,
    cyl(0.5, 0.5, 0.06, 'paper', 48, 0, 0.03, 0),
    cyl(0.46, 0.48, 0.16, 'paper', 48, 0, 0.14, 0),
    torus(0.43, 0.012, 'ink', 0, 0.2, 0, 8, 64),
    torus(0.43, 0.012, 'ink', 0, 0.16, 0, 8, 64),
    torus(0.43, 0.012, 'ink', 0, 0.12, 0, 8, 64),
  );
  d.children.slice(2).forEach((r) => (r.rotation.x = Math.PI / 2));
  const dome = sph(0.38, 'paper', 0, 0.22, 0, true, 48, 12); dome.scale.y = 0.42; add(d, dome);
  const led = sph(0.035, 'glow', 0.3, 0.2, 0.18); add(d, led);
  at(d, -0.25, 0, 0.2);
  // manual call point
  const cp = G();
  add(cp, box(0.56, 0.62, 0.18, 'green', 0, 0.31, 0));
  add(cp, box(0.4, 0.4, 0.02, 'flat', 0, 0.33, 0.1));
  add(cp, box(0.18, 0.18, 0.025, 'ink', 0, 0.33, 0.11));
  const label = canvasTex(256, 64, (c, w, h) => { c.fillStyle = COLORS.paper; c.fillRect(0, 0, w, h); c.fillStyle = COLORS.ink; c.font = `600 34px ${MONO}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('PUSH HERE', w / 2, h / 2 + 2); });
  const lbl = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.1), new THREE.MeshBasicMaterial({ map: label })); at(lbl, 0, 0.08, 0.091); lbl.userData.noInk = true;
  add(cp, lbl);
  at(cp, 0.62, 0, -0.35); cp.rotation.y = -0.35;
  // sounder
  const s = G();
  add(s, cyl(0.17, 0.17, 0.1, 'ink', 32, 0, 0.05, 0), cyl(0.15, 0.12, 0.22, 'paper', 32, 0, 0.21, 0), torus(0.1, 0.01, 'ink', 0, 0.32, 0));
  s.children[2].rotation.x = Math.PI / 2;
  at(s, 0.65, 0, 0.45);
  add(g, d, cp, s);
  // detection pulses
  const rings = [0, 1, 2].map(() => { const r = torus(0.5, 0.008, mat('glow', { transparent: true, opacity: 1 }), -0.25, 0.25, 0.2, 6, 64); r.rotation.x = Math.PI / 2; r.material = r.material.clone(); r.userData.noInk = true; add(g, r); return r; });
  const smoke = [...Array(7)].map((_, i) => { const p = new THREE.Mesh(new THREE.IcosahedronGeometry(0.05 + (i % 3) * 0.02, 0), mat('mid', { flatShading: true })); add(g, p); p.userData.o = Math.random(); return p; });
  g.userData.tick = (t) => {
    rings.forEach((r, i) => { const k = (t * 0.45 + i / 3) % 1; r.scale.setScalar(0.8 + k * 1.6); r.material.opacity = 1 - k; r.position.y = 0.25 + k * 0.12; });
    led.visible = Math.sin(t * 6) > -0.2;
    smoke.forEach((p, i) => { const k = (t * 0.18 + p.userData.o) % 1; const a = i * 2.1 + t * 0.3; at(p, -0.25 + Math.cos(a) * (0.9 - k * 0.6), 0.9 - k * 0.55 + 0.25, 0.2 + Math.sin(a) * (0.9 - k * 0.6)); p.scale.setScalar(Math.sin(k * Math.PI) * 1.1 + 0.01); p.rotation.set(t, t * 0.7, 0); });
  };
  return g;
}

// ---------------------------------------------------------------- sprinkler
function sprinklerHead() {
  const h = G();
  add(h,
    cyl(0.085, 0.085, 0.07, 'paper', 6, 0, 0.0, 0),
    cyl(0.045, 0.05, 0.08, 'mid', 24, 0, -0.07, 0),
  );
  const armL = box(0.024, 0.26, 0.05, 'paper', -0.065, -0.22, 0); armL.rotation.z = -0.22;
  const armR = box(0.024, 0.26, 0.05, 'paper', 0.065, -0.22, 0); armR.rotation.z = 0.22;
  add(h, armL, armR, cyl(0.03, 0.03, 0.04, 'paper', 16, 0, -0.355, 0));
  const bulb = new THREE.Mesh(new THREE.CapsuleGeometry(0.02, 0.11, 6, 12), mat('glow')); at(bulb, 0, -0.22, 0); bulb.userData.noInk = true;
  add(h, bulb, cyl(0.15, 0.15, 0.012, 'paper', 18, 0, -0.38, 0));
  return h;
}
export function sprinkler() {
  const g = G();
  const py = 1.7;
  add(g, rotZ(cyl(0.09, 0.09, 2.4, 'green', 32, 0, py, 0), Math.PI / 2));
  [-1.2, 1.2].forEach((x) => add(g, rotZ(cyl(0.12, 0.12, 0.06, 'ink', 32, x, py, 0), Math.PI / 2)));
  const heads = [];
  [-0.55, 0.55].forEach((x, i) => {
    add(g, cyl(0.115, 0.115, 0.22, 'mid', 24, x, py, 0));
    add(g, cyl(0.05, 0.05, 0.45, 'green', 16, x, py - 0.3, 0));
    add(g, cyl(0.07, 0.06, 0.07, 'mid', 24, x, py - 0.54, 0));
    const hd = sprinklerHead(); at(hd, x, py - 0.6, 0); add(g, hd); heads.push(hd);
  });
  // hangers
  [-0.95, 0.95].forEach((x) => add(g, cyl(0.012, 0.012, 0.5, 'ink', 6, x, py + 0.3, 0), torus(0.1, 0.012, 'ink', x, py, 0, 6, 24)));
  // spray from the active head (right)
  const N = 90, drops = new THREE.InstancedMesh(new THREE.SphereGeometry(0.016, 6, 4), mat('glow'), N);
  drops.userData.noInk = true;
  const seeds = [...Array(N)].map(() => ({ a: Math.random() * Math.PI * 2, s: 0.5 + Math.random() * 0.8, o: Math.random() }));
  add(g, drops);
  const splash = torus(0.4, 0.01, mat('glow', { transparent: true, opacity: 1 }), 0.55, 0.01, 0, 6, 48); splash.rotation.x = Math.PI / 2; splash.material = splash.material.clone(); splash.userData.noInk = true; add(g, splash);
  const m4 = new THREE.Matrix4(); const origin = V(0.55, py - 0.98, 0);
  g.userData.tick = (t) => {
    seeds.forEach((s, i) => {
      const k = (t * 0.9 + s.o) % 1; const r = k * 0.75 * s.s;
      m4.makeTranslation(origin.x + Math.cos(s.a) * r, origin.y - k * k * (origin.y - 0.02) - k * 0.05, origin.z + Math.sin(s.a) * r);
      drops.setMatrixAt(i, m4);
    });
    drops.instanceMatrix.needsUpdate = true;
    const k = (t * 0.9) % 1; splash.scale.setScalar(0.4 + k * 1.2); splash.material.opacity = 1 - k;
  };
  return g;
}

// ---------------------------------------------------------------- hydrant + hose reel
export function hydrant() {
  const g = G();
  const h = G();
  add(h,
    cyl(0.36, 0.38, 0.07, 'mid', 32, 0, 0.035, 0),
    cyl(0.25, 0.27, 0.86, 'green', 32, 0, 0.5, 0),
    cyl(0.3, 0.3, 0.07, 'paper', 32, 0, 0.95, 0),
  );
  const dome = sph(0.26, 'green', 0, 0.98, 0, true, 32, 10); dome.scale.y = 0.8; add(h, dome);
  add(h, cyl(0.06, 0.07, 0.09, 'ink', 5, 0, 1.22, 0));
  [-1, 1].forEach((sx) => {
    add(h, rotZ(cyl(0.085, 0.085, 0.22, 'green', 20, sx * 0.3, 0.66, 0), Math.PI / 2));
    add(h, rotZ(cyl(0.1, 0.1, 0.05, 'paper', 6, sx * 0.42, 0.66, 0), Math.PI / 2));
  });
  add(h, rotX(cyl(0.12, 0.12, 0.2, 'green', 24, 0, 0.5, 0.3), Math.PI / 2), rotX(cyl(0.14, 0.14, 0.05, 'paper', 6, 0, 0.5, 0.42), Math.PI / 2));
  at(h, -0.45, 0, 0.25);
  // hose reel cabinet
  const r = G();
  add(r, box(1.0, 1.2, 0.08, 'mid', 0, 0.75, -0.04));
  add(r, box(1.06, 0.05, 0.3, 'paper', 0, 0.15, 0.1), box(1.06, 0.05, 0.3, 'paper', 0, 1.35, 0.1));
  const reel = G();
  for (let i = 0; i < 4; i++) add(reel, torus(0.36 - i * 0.055, 0.03, 'green', 0, 0, 0.02 + (i % 2) * 0.01, 8, 48));
  add(reel, torus(0.41, 0.015, 'ink', 0, 0, 0.0, 6, 48), rotX(cyl(0.1, 0.1, 0.1, 'paper', 24, 0, 0, 0), Math.PI / 2));
  at(reel, 0, 0.78, 0.12); add(r, reel);
  add(r, tube([[0.33, 0.62, 0.15], [0.42, 0.4, 0.2], [0.36, 0.22, 0.28]], 0.025, 'green'), at(rotX(new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.16, 16), mat('ink')), Math.PI), 0.36, 0.14, 0.28));
  at(r, 0.45, 0, -0.35); r.rotation.y = -0.3;
  add(g, r, h);
  g.userData.tick = (t) => { reel.rotation.z = Math.sin(t * 0.6) * 0.5; };
  return g;
}

// ---------------------------------------------------------------- gas suppression cylinders
export function cylinders() {
  const g = G();
  add(g, box(2.0, 1.9, 0.06, 'mid', 0, 0.95, -0.34));
  const needles = []; const leds = [];
  [-0.55, 0, 0.55].forEach((x) => {
    const c = G();
    add(c, cyl(0.21, 0.21, 1.05, 'green', 40, 0, 0.55, 0));
    const top = sph(0.21, 'green', 0, 1.075, 0, true, 40, 10); top.scale.y = 0.7; add(c, top);
    add(c, cyl(0.212, 0.212, 0.3, 'paper', 40, 0, 0.62, 0));
    add(c, cyl(0.06, 0.06, 0.1, 'mid', 16, 0, 1.27, 0), box(0.13, 0.09, 0.12, 'ink', 0, 1.36, 0));
    const gauge = rotX(cyl(0.055, 0.055, 0.025, 'paper', 24, 0.08, 1.3, 0.07), Math.PI / 2); add(c, gauge);
    const nd = box(0.006, 0.04, 0.004, 'ink', 0.08, 1.3, 0.087); add(c, nd); needles.push(nd);
    const led = sph(0.015, 'glow', -0.045, 1.37, 0.065); add(c, led); leds.push(led);
    add(c, tube([[0, 1.4, 0], [0, 1.55, 0], [0, 1.62, 0]], 0.022, 'mid', 8));
    add(c, torus(0.215, 0.014, 'ink', 0, 0.95, 0, 6, 48)); c.children[c.children.length - 1].rotation.x = Math.PI / 2;
    at(c, x, 0, 0); add(g, c);
  });
  add(g, rotZ(cyl(0.05, 0.05, 1.5, 'mid', 20, 0, 1.64, 0), Math.PI / 2));
  add(g, cyl(0.05, 0.05, 0.5, 'mid', 20, 0.75, 1.88, 0));
  // discharge pulse
  const pulse = sph(0.06, mat('glow', { transparent: true, opacity: 0.9 }), 0, 1.64, 0); pulse.userData.noInk = true; add(g, pulse);
  g.userData.tick = (t) => {
    needles.forEach((n, i) => (n.rotation.z = 0.5 + Math.sin(t * 1.3 + i) * 0.08));
    leds.forEach((l, i) => (l.visible = ((t * 1.5 + i * 0.33) % 1) < 0.5));
    const k = (t * 0.5) % 1; pulse.position.x = -0.75 + k * 1.5; pulse.scale.setScalar(Math.sin(k * Math.PI) + 0.01);
  };
  return g;
}

// ---------------------------------------------------------------- extinguisher
export function extinguisher() {
  const g = G();
  const prof = [[0, 0], [0.2, 0], [0.26, 0.04], [0.27, 0.12], [0.27, 1.02], [0.24, 1.14], [0.15, 1.22], [0.08, 1.25], [0, 1.25]];
  const body = lathe(prof, 'green', 48); add(g, body);
  const lblTex = canvasTex(512, 256, (c, w, h) => {
    c.fillStyle = COLORS.paper; c.fillRect(0, 0, w, h);
    c.fillStyle = COLORS.ink; c.font = `600 44px ${SANS}`; c.textAlign = 'center'; c.fillText('FIRE', w * 0.25, 92); c.fillText('EXTINGUISHER', w * 0.25, 142);
    c.font = `500 26px ${MONO}`; c.fillText('ABC · 6 KG', w * 0.25, 196);
    c.fillStyle = COLORS.green; c.fillRect(w * 0.06, 210, w * 0.38, 8);
    c.fillStyle = COLORS.ink; c.font = `500 22px ${MONO}`; c.fillText('SERVICED 10 / 2026', w * 0.75, 120); c.fillText('NEXT DUE 10 / 2027', w * 0.75, 156);
  });
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.274, 0.274, 0.42, 48, 1, true), texMat(lblTex)); at(band, 0, 0.6, 0); band.rotation.y = -Math.PI / 2; band.userData.noInk = true; add(g, band);
  add(g, cyl(0.07, 0.08, 0.1, 'ink', 24, 0, 1.29, 0));
  add(g, box(0.26, 0.12, 0.13, 'ink', 0.03, 1.39, 0));
  const lever = box(0.34, 0.035, 0.07, 'mid', 0.12, 1.48, 0); lever.rotation.z = 0.18; add(g, lever);
  const handle = box(0.32, 0.03, 0.07, 'mid', 0.1, 1.42, 0); handle.rotation.z = -0.1; add(g, handle);
  add(g, rotX(cyl(0.05, 0.05, 0.03, 'paper', 24, -0.04, 1.39, 0.08), Math.PI / 2), box(0.004, 0.035, 0.004, 'ink', -0.04, 1.4, 0.097));
  add(g, torus(0.035, 0.007, 'mid', -0.1, 1.42, 0.07, 6, 16));
  add(g, tube([[0.16, 1.36, 0], [0.32, 1.25, 0.04], [0.33, 0.9, 0.12], [0.3, 0.35, 0.2], [0.26, 0.22, 0.24]], 0.028, 'ink', 64));
  add(g, at(rotX(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.06, 0.16, 16), mat('ink')), 0.25), 0.26, 0.14, 0.25));
  // sign plate behind
  const sign = canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = COLORS.green; c.fillRect(0, 0, w, h); c.strokeStyle = COLORS.paper; c.lineWidth = 10; c.strokeRect(14, 14, w - 28, h - 28);
    c.fillStyle = COLORS.paper; c.beginPath(); c.moveTo(96, 70); c.lineTo(160, 70); c.lineTo(160, 200); c.lineTo(96, 200); c.closePath(); c.fill();
    c.fillRect(110, 48, 36, 26); c.fillStyle = COLORS.green; c.font = `600 22px ${MONO}`; c.textAlign = 'center'; c.fillText('FE', 128, 145);
  });
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.02), [mat('paper'), mat('paper'), mat('paper'), mat('paper'), new THREE.MeshBasicMaterial({ map: sign }), mat('paper')]);
  at(plate, -0.62, 1.15, -0.25); plate.rotation.y = 0.35; add(g, plate);
  add(g, cyl(0.28, 0.3, 0.04, 'mid', 40, 0, 0.02, 0));
  return g;
}

// ---------------------------------------------------------------- fire door
export function door() {
  const g = G();
  add(g, box(2.2, 0.04, 1.4, 'mid', 0, 0.02, 0.2));
  add(g, box(0.55, 2.3, 0.2, 'paper', -0.78, 1.17, 0), box(0.55, 2.3, 0.2, 'paper', 0.78, 1.17, 0), box(2.11, 0.22, 0.2, 'paper', 0, 2.21, 0));
  add(g, box(0.05, 2.06, 0.22, 'ink', -0.5, 1.07, 0), box(0.05, 2.06, 0.22, 'ink', 0.5, 1.07, 0), box(1.05, 0.05, 0.22, 'ink', 0, 2.1, 0));
  const pivot = G(); at(pivot, -0.47, 0.06, 0.08);
  const leaf = box(0.92, 1.98, 0.06, 'paper', 0.46, 1.0, 0); pivot.add(leaf);
  pivot.add(box(0.12, 0.5, 0.065, 'glass', 0.66, 1.45, 0));
  pivot.add(rotZ(cyl(0.02, 0.02, 0.62, 'ink', 12, 0.5, 1.0, 0.07), Math.PI / 2));
  const sTex = canvasTex(256, 128, (c, w, h) => { c.fillStyle = COLORS.green; c.fillRect(0, 0, w, h); c.fillStyle = COLORS.paper; c.font = `600 30px ${SANS}`; c.textAlign = 'center'; c.fillText('FIRE DOOR', w / 2, 56); c.font = `500 22px ${MONO}`; c.fillText('KEEP SHUT', w / 2, 96); });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.17), new THREE.MeshBasicMaterial({ map: sTex })); at(sign, 0.46, 1.55, 0.032); sign.userData.noInk = true; pivot.add(sign);
  pivot.add(box(0.36, 0.05, 0.05, 'ink', 0.25, 1.92, 0.07));
  add(g, pivot);
  g.userData.tick = (t) => { const k = (t * 0.25) % 1; const open = k < 0.25 ? k / 0.25 : k < 0.45 ? 1 : Math.max(0, 1 - (k - 0.45) / 0.45); pivot.rotation.y = -1.15 * (1 - Math.pow(1 - open, 2)); };
  g.userData.pose = () => { pivot.rotation.y = -0.6; };
  return g;
}

// ---------------------------------------------------------------- exit sign + emergency light
export function exitsign() {
  const g = G();
  add(g, box(2.0, 0.05, 1.0, 'mid', 0, 2.0, 0));
  add(g, cyl(0.01, 0.01, 0.35, 'ink', 6, -0.4, 1.8, 0), cyl(0.01, 0.01, 0.35, 'ink', 6, 0.4, 1.8, 0));
  const face = canvasTex(512, 192, (c, w, h) => {
    c.fillStyle = COLORS.green; c.fillRect(0, 0, w, h);
    c.fillStyle = COLORS.paper;
    // running figure (original pictogram)
    c.save(); c.translate(130, 96); c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = COLORS.paper; c.lineWidth = 16;
    c.beginPath(); c.arc(8, -54, 13, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(-2, -32); c.lineTo(-14, 10); c.lineTo(-44, 44); c.moveTo(-14, 10); c.lineTo(18, 30); c.lineTo(14, 62); c.moveTo(-2, -32); c.lineTo(30, -12); c.moveTo(-2, -32); c.lineTo(-34, -18); c.stroke(); c.restore();
    c.beginPath(); c.moveTo(270, 96); c.lineTo(330, 46); c.lineTo(330, 76); c.lineTo(410, 76); c.lineTo(410, 116); c.lineTo(330, 116); c.lineTo(330, 146); c.closePath(); c.fill();
    c.font = `700 40px ${SANS}`; c.fillText('EXIT', 420, 110);
  });
  const sign = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.42, 0.08), [mat('paper'), mat('paper'), mat('paper'), mat('paper'), new THREE.MeshBasicMaterial({ map: face }), mat('paper')]);
  at(sign, 0, 1.42, 0); add(g, sign);
  // twin spot
  const ts = G();
  add(ts, box(0.5, 0.22, 0.14, 'paper', 0, 0, 0));
  const lamps = [-0.16, 0.16].map((x) => { const l = G(); add(l, rotX(cyl(0.07, 0.09, 0.16, 'ink', 24, 0, 0, 0.08), Math.PI / 2 + 0.6), at(sph(0.06, 'glow'), 0, -0.06, 0.15)); at(l, x, -0.05, 0.05); l.rotation.y = x > 0 ? -0.4 : 0.4; ts.add(l); return l; });
  const cones = lamps.map((l, i) => { const c = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.2, 32, 1, true), mat('ghost', { opacity: 0.14 })); c.userData.noInk = true; at(c, (i ? 0.16 : -0.16) + (i ? 0.2 : -0.2), -0.6, 0.45); c.rotation.x = -0.35; c.rotation.z = i ? -0.3 : 0.3; ts.add(c); return c; });
  at(ts, 0.0, 0.75, -0.3); add(g, ts);
  add(g, box(0.8, 0.5, 0.06, 'mid', 0, 0.75, -0.4));
  g.userData.tick = (t) => { cones.forEach((c) => (c.material.opacity = 0.1 + Math.abs(Math.sin(t * 1.2)) * 0.12)); };
  return g;
}

// ---------------------------------------------------------------- evacuation plan board
export function plan() {
  const g = G();
  const tex = canvasTex(1024, 768, (c, w, h) => {
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
    c.fillStyle = COLORS.green; c.fillRect(0, 0, w, 86);
    c.fillStyle = COLORS.paper; c.font = `600 44px ${SANS}`; c.fillText('EVACUATION PLAN', 36, 60);
    c.font = `500 24px ${MONO}`; c.textAlign = 'right'; c.fillText('LEVEL 02', w - 36, 56); c.textAlign = 'left';
    c.strokeStyle = COLORS.ink; c.lineWidth = 7;
    const ox = 60, oy = 130, W = 700, H = 560; c.strokeRect(ox, oy, W, H);
    c.lineWidth = 4;
    [[ox, oy + 220, ox + 260, oy + 220], [ox + 260, oy, ox + 260, oy + 220], [ox + 440, oy, ox + 440, oy + 260], [ox + 440, oy + 260, ox + W, oy + 260], [ox, oy + 360, ox + 300, oy + 360], [ox + 300, oy + 360, ox + 300, oy + H], [ox + 480, oy + 380, ox + 480, oy + H]].forEach(([a, b, x, y]) => { c.beginPath(); c.moveTo(a, b); c.lineTo(x, y); c.stroke(); });
    c.lineWidth = 2; c.strokeStyle = '#9aa09a';
    for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(ox + 330 + i * 18, oy + 300, 2, 0, 7); c.stroke(); }
    // route
    c.strokeStyle = COLORS.green; c.lineWidth = 10; c.setLineDash([22, 14]); c.lineCap = 'round';
    c.beginPath(); c.moveTo(ox + 150, oy + 120); c.lineTo(ox + 360, oy + 120); c.lineTo(ox + 360, oy + 310); c.lineTo(ox + W - 30, oy + 310); c.stroke();
    c.beginPath(); c.moveTo(ox + 150, oy + 460); c.lineTo(ox + 390, oy + 460); c.lineTo(ox + 390, oy + H - 20); c.stroke(); c.setLineDash([]);
    c.fillStyle = COLORS.green; c.beginPath(); c.moveTo(ox + W + 4, oy + 310); c.lineTo(ox + W - 36, oy + 284); c.lineTo(ox + W - 36, oy + 336); c.fill();
    c.beginPath(); c.moveTo(ox + 390, oy + H + 4); c.lineTo(ox + 364, oy + H - 36); c.lineTo(ox + 416, oy + H - 36); c.fill();
    c.fillStyle = COLORS.ink; c.beginPath(); c.arc(ox + 150, oy + 120, 18, 0, 7); c.fill();
    c.font = `400 28px ${HAND}`; c.fillText('YOU ARE HERE', ox + 60, oy + 80);
    // legend
    c.font = `500 22px ${MONO}`; const lx = 800;
    [['FIRE EXIT', COLORS.green], ['ASSEMBLY', COLORS.ink], ['EXTINGUISHER', COLORS.green], ['CALL POINT', COLORS.ink]].forEach(([t, col], i) => { c.fillStyle = col; c.fillRect(lx, 180 + i * 60, 26, 26); c.fillStyle = COLORS.ink; c.fillText(t, lx + 40, 202 + i * 60); });
    c.font = `400 30px ${HAND}`; c.fillStyle = COLORS.green; c.fillText('2 WAYS OUT', lx, 520);
  });
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 0.05), [mat('ink'), mat('ink'), mat('ink'), mat('ink'), texMat(tex, true), mat('ink')]);
  at(board, 0, 1.15, 0); board.rotation.x = -0.08; add(g, board);
  add(g, box(1.7, 0.05, 0.4, 'mid', 0, 0.025, 0.1), cyl(0.03, 0.03, 0.6, 'ink', 8, -0.6, 0.3, -0.05), cyl(0.03, 0.03, 0.6, 'ink', 8, 0.6, 0.3, -0.05));
  const ring = torus(0.06, 0.01, mat('glow', { transparent: true, opacity: 1 }), -0.47, 1.43, 0.06, 6, 32); ring.material = ring.material.clone(); ring.userData.noInk = true; add(g, ring);
  g.userData.tick = (t) => { const k = (t * 0.8) % 1; ring.scale.setScalar(1 + k * 2.5); ring.material.opacity = 1 - k; };
  return g;
}

// ---------------------------------------------------------------- LPG / gas
function lpgBottle() {
  const b = G();
  const prof = [[0, 0.06], [0.22, 0.06], [0.26, 0.12], [0.27, 0.2], [0.27, 0.78], [0.25, 0.88], [0.18, 0.95], [0.06, 0.98], [0, 0.98]];
  add(b, lathe(prof, 'paper', 40));
  add(b, cyl(0.21, 0.22, 0.08, 'ink', 32, 0, 0.04, 0));
  add(b, cyl(0.272, 0.272, 0.05, 'green', 40, 0, 0.5, 0));
  add(b, cyl(0.15, 0.15, 0.12, 'ink', 24, 0, 1.03, 0, true));
  add(b, cyl(0.035, 0.04, 0.09, 'mid', 12, 0, 1.02, 0));
  return b;
}
export function lpg() {
  const g = G();
  add(g, box(2.1, 1.9, 0.06, 'mid', 0, 0.95, -0.42));
  const b1 = lpgBottle(); at(b1, -0.62, 0, 0); const b2 = lpgBottle(); at(b2, 0.0, 0, 0.05);
  add(g, b1, b2);
  add(g, rotZ(cyl(0.04, 0.04, 1.4, 'green', 16, 0.1, 1.45, -0.32), Math.PI / 2));
  add(g, tube([[-0.62, 1.08, 0], [-0.62, 1.3, -0.15], [-0.5, 1.45, -0.32]], 0.02, 'ink'), tube([[0, 1.08, 0.05], [0, 1.3, -0.15], [0.05, 1.45, -0.32]], 0.02, 'ink'));
  // regulator + gauge
  add(g, box(0.16, 0.16, 0.12, 'paper', 0.55, 1.45, -0.3), cyl(0.06, 0.06, 0.08, 'mid', 16, 0.55, 1.56, -0.3));
  add(g, rotX(cyl(0.11, 0.11, 0.04, 'paper', 32, 0.75, 1.45, -0.28), Math.PI / 2), torus(0.11, 0.012, 'ink', 0.75, 1.45, -0.26, 6, 32));
  const needle = box(0.008, 0.09, 0.005, 'ink', 0.75, 1.47, -0.255); add(g, needle);
  add(g, cyl(0.04, 0.04, 1.4, 'green', 16, 0.8, 0.72, -0.32));
  // gas detector
  add(g, box(0.22, 0.3, 0.08, 'paper', 0.6, 0.45, -0.36));
  const led = sph(0.022, 'glow', 0.6, 0.53, -0.31); add(g, led);
  add(g, box(0.12, 0.06, 0.01, 'ink', 0.6, 0.4, -0.315));
  g.userData.tick = (t) => { needle.rotation.z = -0.7 + Math.sin(t * 0.9) * 0.12; led.visible = Math.sin(t * 4) > 0; };
  return g;
}

// ---------------------------------------------------------------- fire stopping (wall penetrations)
export function sealant() {
  const g = G();
  const wall = box(1.9, 1.5, 0.3, 'mid', 0, 0.75, 0); add(g, wall);
  add(g, box(2.2, 0.05, 1.2, 'paper', 0, 0.025, 0.25));
  [[-0.45, 1.05, 0.12], [0.15, 1.05, 0.08], [-0.45, 0.48, 0.07]].forEach(([x, y, r]) => {
    add(g, rotX(cyl(r, r, 1.4, 'paper', 24, x, y, 0.1), Math.PI / 2));
    add(g, rotX(cyl(r + 0.06, r + 0.06, 0.09, 'green', 24, x, y, 0.19), Math.PI / 2));
    add(g, rotX(cyl(r + 0.075, r + 0.075, 0.02, 'ink', 24, x, y, 0.235), Math.PI / 2));
  });
  // cable transit filled with batt
  add(g, box(0.62, 0.42, 0.06, 'green', 0.45, 0.5, 0.17));
  for (let i = 0; i < 5; i++) add(g, rotX(cyl(0.03, 0.03, 1.2, 'ink', 10, 0.25 + i * 0.1, 0.5 + (i % 2) * 0.06, 0.2), Math.PI / 2));
  add(g, box(0.9, 0.04, 0.5, 'mid', 0.45, 0.32, 0.45));
  // sealant bead at the floor joint
  add(g, rotZ(cyl(0.03, 0.03, 1.9, 'green', 12, 0, 0.06, 0.16), Math.PI / 2));
  return g;
}

// ---------------------------------------------------------------- smoke fan
export function fan() {
  const g = G();
  const f = G();
  const casing = cyl(0.56, 0.56, 0.7, mat('paper', { side: THREE.DoubleSide }), 48, 0, 0, 0, true); casing.rotation.x = Math.PI / 2; add(f, casing);
  [-0.35, 0.35].forEach((z) => { const fl = torus(0.6, 0.04, 'mid', 0, 0, z, 8, 64); add(f, fl); });
  add(f, rotX(cyl(0.17, 0.17, 0.44, 'ink', 32, 0, 0, -0.05), Math.PI / 2));
  const rotor = G();
  for (let i = 0; i < 7; i++) { const bl = box(0.36, 0.02, 0.15, 'green', 0.26, 0, 0.18); const p = G(); bl.rotation.x = 0.5; p.add(bl); p.rotation.z = (i / 7) * Math.PI * 2; rotor.add(p); }
  add(rotor, rotX(sph(0.12, 'paper', 0, 0, 0.2, true), Math.PI / 2)); at(rotor, 0, 0, 0); add(f, rotor);
  [0, 1, 2].forEach((i) => { const s = box(1.1, 0.03, 0.03, 'ink', 0, 0, 0.3); s.rotation.z = (i / 3) * Math.PI; add(f, s); });
  at(f, 0, 0.78, 0.15); add(g, f);
  add(g, box(0.9, 0.18, 0.12, 'mid', 0, 0.15, 0.0), box(0.9, 0.18, 0.12, 'mid', 0, 0.15, 0.3), box(0.1, 0.5, 0.1, 'ink', -0.4, 0.38, 0.15), box(0.1, 0.5, 0.1, 'ink', 0.4, 0.38, 0.15));
  add(g, box(1.2, 1.2, 0.6, 'paper', 0, 0.78, -0.55), box(1.3, 1.3, 0.04, 'mid', 0, 0.78, -0.24));
  const puffs = [...Array(10)].map((_, i) => { const p = new THREE.Mesh(new THREE.IcosahedronGeometry(0.08 + (i % 3) * 0.03, 0), mat('mid', { flatShading: true })); p.userData.o = i / 10; add(g, p); return p; });
  g.userData.tick = (t, dt) => {
    rotor.rotation.z -= dt * 7;
    puffs.forEach((p, i) => { const k = (t * 0.35 + p.userData.o) % 1; const a = i * 2.4; at(p, Math.cos(a) * 0.3 * (1 + k), 0.78 + Math.sin(a) * 0.3 * (1 + k), 0.5 + k * 1.4); p.scale.setScalar(Math.sin(k * Math.PI) * 1.4 + 0.01); p.rotation.set(t, i, t * 0.5); });
  };
  return g;
}

// ---------------------------------------------------------------- CCTV
export function cctv() {
  const g = G();
  add(g, box(0.5, 0.7, 0.06, 'mid', -0.75, 1.3, -0.3));
  add(g, rotZ(cyl(0.04, 0.04, 0.4, 'ink', 12, -0.55, 1.3, -0.3), Math.PI / 2));
  const pan = G(); at(pan, -0.35, 1.3, -0.3);
  const cam = G();
  add(cam, box(0.24, 0.22, 0.66, 'paper', 0, 0, 0.28), box(0.3, 0.03, 0.76, 'mid', 0, 0.13, 0.32));
  add(cam, rotX(cyl(0.085, 0.085, 0.05, 'ink', 24, 0, -0.01, 0.62), Math.PI / 2), at(sph(0.06, 'glow'), 0, -0.01, 0.64));
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; add(cam, at(sph(0.012, 'ink'), Math.cos(a) * 0.075, -0.01 + Math.sin(a) * 0.075, 0.645)); }
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.4, 32, 1, true), mat('ghost', { opacity: 0.12 })); cone.userData.noInk = true;
  cone.rotation.x = -Math.PI / 2; at(cone, 0, -0.01, 1.85); add(cam, cone);
  cam.rotation.x = 0.3; cam.rotation.y = 0.5;
  pan.add(cam); add(g, pan);
  add(g, cyl(0.025, 0.025, 0.3, 'ink', 8, -0.35, 1.45, -0.3));
  // dome camera on a post
  const d = G();
  add(d, cyl(0.04, 0.05, 1.0, 'ink', 12, 0, 0.5, 0), cyl(0.2, 0.2, 0.06, 'paper', 32, 0, 1.03, 0));
  const dome = sph(0.16, 'inkflat', 0, 1.0, 0, true); dome.rotation.x = Math.PI; add(d, dome);
  at(d, 0.75, 0, 0.3); add(g, d);
  add(g, box(2.2, 0.04, 1.6, 'mid', 0, 0.02, 0.3));
  g.userData.tick = (t) => { pan.rotation.y = Math.sin(t * 0.5) * 0.45; };
  return g;
}

// ---------------------------------------------------------------- gate barrier + reader
export function barrier() {
  const g = G();
  add(g, box(2.6, 0.04, 1.4, 'mid', 0.4, 0.02, 0));
  for (let i = 0; i < 4; i++) add(g, box(0.28, 0.005, 0.06, 'paper', -0.4 + i * 0.5, 0.045, 0.45));
  add(g, box(0.36, 0.95, 0.36, 'paper', -0.75, 0.5, -0.25), box(0.4, 0.05, 0.4, 'mid', -0.75, 1.0, -0.25));
  const arm = G(); at(arm, -0.6, 0.85, -0.05);
  add(arm, rotX(cyl(0.07, 0.07, 0.12, 'ink', 20, 0, 0, 0), Math.PI / 2));
  for (let i = 0; i < 7; i++) add(arm, box(0.3, 0.06, 0.05, i % 2 ? 'green' : 'paper', 0.15 + i * 0.3, 0, 0));
  add(arm, at(sph(0.03, 'ink'), 2.25, 0, 0));
  add(g, arm);
  // reader pedestal
  add(g, box(0.12, 1.0, 0.12, 'ink', -0.15, 0.5, 0.45), box(0.18, 0.24, 0.05, 'paper', -0.15, 0.95, 0.5));
  const led = sph(0.022, 'glow', -0.15, 1.04, 0.53); add(g, led);
  add(g, box(0.1, 0.06, 0.01, 'ink', -0.15, 0.92, 0.526));
  g.userData.tick = (t) => {
    const k = (t * 0.22) % 1; const up = k < 0.15 ? k / 0.15 : k < 0.55 ? 1 : k < 0.7 ? 1 - (k - 0.55) / 0.15 : 0;
    arm.rotation.z = (1 - Math.pow(1 - up, 3)) * 1.3; led.visible = up > 0.02 || Math.sin(t * 8) > 0;
  };
  g.userData.pose = () => { arm.rotation.z = 0.5; };
  return g;
}

// ---------------------------------------------------------------- server rack + cabling
export function rack() {
  const g = G();
  [[-0.35, -0.35], [0.35, -0.35], [-0.35, 0.35], [0.35, 0.35]].forEach(([x, z]) => add(g, box(0.05, 1.8, 0.05, 'ink', x, 0.9, z)));
  add(g, box(0.78, 0.06, 0.78, 'ink', 0, 1.8, 0), box(0.78, 0.06, 0.78, 'ink', 0, 0.03, 0));
  const leds = [];
  for (let i = 0; i < 9; i++) {
    const y = 0.22 + i * 0.165;
    add(g, box(0.64, 0.13, 0.66, i % 3 === 1 ? 'mid' : 'paper', 0, y, 0));
    for (let j = 0; j < 5; j++) { const l = box(0.025, 0.02, 0.01, 'glow', -0.25 + j * 0.05, y + 0.02, 0.335); l.userData.noInk = true; add(g, l); leds.push(l); }
    if (i % 3 === 2) for (let j = 0; j < 8; j++) add(g, box(0.03, 0.03, 0.012, 'ink', 0.02 + j * 0.035, y - 0.02, 0.336));
  }
  // cable tray + cables
  add(g, box(1.8, 0.05, 0.35, 'mid', 0.5, 2.25, 0), box(1.8, 0.12, 0.02, 'mid', 0.5, 2.3, 0.17), box(1.8, 0.12, 0.02, 'mid', 0.5, 2.3, -0.17));
  const colors = ['green', 'ink', 'green', 'paper', 'ink'];
  colors.forEach((c, i) => add(g, tube([[0.1 + i * 0.05, 1.85, 0.2], [0.1 + i * 0.05, 2.1, 0.12], [0.3 + i * 0.05, 2.29, -0.1 + i * 0.04], [1.35, 2.29, -0.1 + i * 0.04]], 0.018, c, 40)));
  add(g, box(1.0, 0.04, 1.0, 'mid', 0, 0.0, 0.1));
  g.userData.tick = (t) => { leds.forEach((l, i) => (l.visible = Math.sin(t * (3 + (i % 7)) + i * 1.7) > -0.3)); };
  return g;
}

// ---------------------------------------------------------------- compliance clipboard + stamp
export function clipboard() {
  const g = G();
  add(g, box(2.2, 0.05, 1.6, 'mid', 0, 0.025, 0));
  const board = G();
  add(board, box(1.05, 0.04, 1.4, 'dim', 0, 0, 0));
  const tex = canvasTex(768, 1024, (c, w, h) => {
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
    c.fillStyle = COLORS.ink; c.font = `600 44px ${SANS}`; c.fillText('Fire Safety', 60, 140); c.fillText('Inspection Report', 60, 196);
    c.font = `500 22px ${MONO}`; c.fillStyle = '#6b6f6b'; c.fillText('CIVIL DEFENCE · ISTIFA RENEWAL', 60, 240);
    c.strokeStyle = '#d4d6d3'; c.lineWidth = 2;
    const items = ['Fire alarm panel', 'Detectors & call points', 'Sprinkler valves', 'Extinguishers tagged', 'Emergency lighting', 'Exit routes clear', 'Fire doors self-close'];
    items.forEach((t, i) => {
      const y = 320 + i * 82;
      c.beginPath(); c.moveTo(60, y + 30); c.lineTo(w - 60, y + 30); c.stroke();
      c.strokeStyle = COLORS.ink; c.lineWidth = 3; c.strokeRect(60, y - 18, 34, 34); c.strokeStyle = '#d4d6d3'; c.lineWidth = 2;
      c.strokeStyle = COLORS.green; c.lineWidth = 7; c.beginPath(); c.moveTo(66, y); c.lineTo(78, y + 12); c.lineTo(102, y - 22); c.stroke(); c.strokeStyle = '#d4d6d3'; c.lineWidth = 2;
      c.fillStyle = COLORS.ink; c.font = `400 30px ${SANS}`; c.fillText(t, 120, y + 10);
      c.font = `400 28px ${HAND}`; c.fillStyle = COLORS.green; c.fillText('OK', w - 130, y + 10);
    });
    c.font = `400 40px ${HAND}`; c.fillStyle = COLORS.ink; c.fillText('Signed —', 60, 960);
  });
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 1.22), texMat(tex)); sheet.rotation.x = -Math.PI / 2; at(sheet, 0, 0.022, 0.04); sheet.userData.noInk = true; board.add(sheet);
  add(board, box(0.4, 0.05, 0.1, 'ink', 0, 0.04, -0.63), rotZ(cyl(0.03, 0.03, 0.42, 'mid', 12, 0, 0.07, -0.66), Math.PI / 2));
  board.rotation.y = 0.18; at(board, -0.15, 0.06, 0.05); add(g, board);
  // approval mark that appears after stamping
  const markTex = canvasTex(256, 256, (c, w, h) => {
    c.clearRect(0, 0, w, h); c.strokeStyle = COLORS.green; c.fillStyle = COLORS.green; c.lineWidth = 10;
    c.beginPath(); c.arc(w / 2, h / 2, 110, 0, 7); c.stroke(); c.lineWidth = 4; c.beginPath(); c.arc(w / 2, h / 2, 92, 0, 7); c.stroke();
    c.font = `700 40px ${SANS}`; c.textAlign = 'center'; c.fillText('APPROVED', w / 2, h / 2 + 14);
    c.font = `500 18px ${MONO}`; c.fillText('CIVIL DEFENCE', w / 2, h / 2 - 34); c.fillText('2026', w / 2, h / 2 + 52);
  });
  const mark = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshBasicMaterial({ map: markTex, transparent: true, opacity: 0, depthWrite: false }));
  mark.rotation.x = -Math.PI / 2; mark.rotation.z = 0.2; at(mark, 0.12, 0.09, 0.38); mark.userData.noInk = true; add(g, mark);
  const stamp = G();
  add(stamp, cyl(0.17, 0.17, 0.06, 'green', 32, 0, 0.03, 0), cyl(0.13, 0.15, 0.12, 'ink', 32, 0, 0.12, 0), cyl(0.04, 0.05, 0.28, 'paper', 16, 0, 0.32, 0), at(sph(0.09, 'paper'), 0, 0.5, 0));
  at(stamp, 0.12, 0.09, 0.38); add(g, stamp);
  // pen
  const pen = G(); add(pen, rotZ(cyl(0.025, 0.025, 0.6, 'ink', 12, 0, 0, 0), Math.PI / 2), at(rotZ(new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.08, 12), mat('mid')), -Math.PI / 2), 0.34, 0, 0));
  at(pen, 0.72, 0.05, -0.2); pen.rotation.y = 0.6; add(g, pen);
  g.userData.tick = (t) => {
    const k = (t * 0.3) % 1;
    const lift = k < 0.35 ? 0.55 : k < 0.45 ? 0.55 * (1 - (k - 0.35) / 0.1) : k < 0.55 ? 0 : k < 0.75 ? ((k - 0.55) / 0.2) * 0.55 : 0.55;
    stamp.position.y = 0.09 + lift;
    mark.material.opacity = k >= 0.45 ? Math.min(1, (k - 0.45) * 8) * (k > 0.92 ? (1 - k) / 0.08 : 1) : 0;
  };
  g.userData.pose = () => { stamp.position.y = 0.5; mark.material.opacity = 1; };
  return g;
}

// ---------------------------------------------------------------- emergency beacon
export function beacon() {
  const g = G();
  add(g, cyl(0.42, 0.46, 0.12, 'mid', 48, 0, 0.06, 0), cyl(0.34, 0.36, 0.3, 'ink', 48, 0, 0.27, 0), cyl(0.37, 0.37, 0.04, 'paper', 48, 0, 0.44, 0));
  const dome = sph(0.32, mat('glow', { transparent: true, opacity: 0.35, depthWrite: false }), 0, 0.46, 0, true, 48, 16); dome.scale.y = 1.25; dome.userData.noInk = true; add(g, dome);
  const spin = G(); at(spin, 0, 0.62, 0);
  add(spin, box(0.06, 0.26, 0.24, 'paper', 0, 0, 0), at(sph(0.07, 'glow'), 0.08, 0, 0));
  [0, Math.PI].forEach((a) => { const c = new THREE.Mesh(new THREE.ConeGeometry(0.55, 2.6, 32, 1, true), mat('ghost', { opacity: 0.18 })); c.userData.noInk = true; c.rotation.z = Math.PI / 2; at(c, 1.35, 0, 0); const p = G(); p.add(c); p.rotation.y = a; spin.add(p); });
  add(g, spin);
  add(g, at(sph(0.04, 'paper'), 0, 0.98, 0));
  g.userData.tick = (t, dt) => { spin.rotation.y += dt * 3.2; };
  return g;
}

export const MODELS = { tower, detector, sprinkler, hydrant, cylinders, extinguisher, door, exitsign, plan, lpg, sealant, fan, cctv, barrier, rack, clipboard, beacon };

export { V, G, at, box, cyl, sph, torus, tube, lathe, add, rotX, rotY, rotZ, texMat, tree, HAND, MONO, SANS, sprinklerHead, lpgBottle };
