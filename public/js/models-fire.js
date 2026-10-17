// Fire alarm, fire fighting, suppression and product models — one per page.
import { THREE, mat, canvasTex, COLORS } from './fs3d.js';
import { V, G, at, box, cyl, sph, torus, tube, add, rotX, rotY, rotZ, texMat, HAND, MONO, SANS, sprinklerHead, lpgBottle } from './models.js';

// ---------------------------------------------------------------- shared bits
export const floor = (w = 2.2, d = 1.6, m = 'mid', y = 0) => box(w, 0.04, d, m, 0, y + 0.02, 0);
export const wallP = (w = 2.1, h = 1.9, z = -0.42, x = 0) => box(w, h, 0.06, 'mid', x, h / 2, z);
export function pipe(a, b, r = 0.04, m = 'green', seg = 18) {
  const A = V(...a), B = V(...b);
  const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, A.distanceTo(B), seg), typeof m === 'string' ? mat(m) : m);
  o.position.copy(A).add(B).multiplyScalar(0.5);
  o.quaternion.setFromUnitVectors(V(0, 1, 0), B.clone().sub(A).normalize());
  return o;
}
export function plate(tex, w, h, x = 0, y = 0, z = 0) {
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
  p.position.set(x, y, z); p.userData.noInk = true; return p;
}
export function text(lines, { w = 512, h = 128, bg = COLORS.paper, fg = COLORS.ink, font = `600 44px ${MONO}`, align = 'center', pad = 0 } = {}) {
  return canvasTex(w, h, (c) => {
    if (bg) { c.fillStyle = bg; c.fillRect(0, 0, w, h); }
    c.fillStyle = fg; c.font = font; c.textAlign = align; c.textBaseline = 'middle';
    const L = [].concat(lines), lh = h / (L.length + 0.4);
    L.forEach((t, i) => c.fillText(t, align === 'center' ? w / 2 : pad, lh * (i + 0.7)));
  });
}
export function gauge(r = 0.07, x = 0, y = 0, z = 0) {
  const g = G();
  add(g, rotX(cyl(r, r, 0.03, 'paper', 32), Math.PI / 2), torus(r, r * 0.12, 'ink', 0, 0, 0.016, 8, 40));
  const n = box(r * 0.08, r * 0.8, 0.006, 'ink', 0, r * 0.35, 0.02); add(g, n);
  g.userData.needle = n; at(g, x, y, z); return g;
}
export function wheel(r = 0.09, m = 'ink') {
  const g = G(); add(g, torus(r, r * 0.13, m, 0, 0, 0, 8, 40));
  for (let i = 0; i < 3; i++) add(g, rotZ(box(r * 2, r * 0.12, r * 0.12, m), (i / 3) * Math.PI));
  add(g, rotX(cyl(r * 0.25, r * 0.25, r * 0.4, m, 16), Math.PI / 2)); return g;
}
const glow = (o = 1) => new THREE.MeshBasicMaterial({ color: COLORS.green, transparent: true, opacity: o, depthWrite: false });
export function pulses(n, r, x, y, z, { axis = 'y', speed = 0.45, grow = 1.8, lift = 0 } = {}) {
  const g = G();
  const rings = [...Array(n)].map(() => { const t = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.04, 6, 64), glow()); if (axis === 'y') t.rotation.x = Math.PI / 2; if (axis === 'x') t.rotation.y = Math.PI / 2; t.userData.noInk = true; g.add(t); return t; });
  at(g, x, y, z);
  g.userData.tick = (t) => rings.forEach((rg, i) => { const k = (t * speed + i / n) % 1; rg.scale.setScalar(0.6 + k * grow); rg.material.opacity = 1 - k; rg.position.y = lift * k; });
  return g;
}
export function puffs(n, { from = V(0, 0, 0), to = V(0, 1, 0), spread = 0.3, size = 0.06, speed = 0.25, m = 'mid' } = {}) {
  const g = G();
  const ps = [...Array(n)].map((_, i) => { const p = new THREE.Mesh(new THREE.IcosahedronGeometry(size * (0.7 + (i % 3) * 0.3), 1), mat(m)); p.userData.o = i / n; p.userData.a = i * 2.39; p.userData.noInk = true; g.add(p); return p; });
  g.userData.tick = (t) => ps.forEach((p) => { const k = (t * speed + p.userData.o) % 1; const a = p.userData.a; p.position.lerpVectors(from, to, k); p.position.x += Math.cos(a) * spread * k; p.position.z += Math.sin(a) * spread * k; p.scale.setScalar(Math.sin(k * Math.PI) * 1.2 + 0.01); p.rotation.set(t * 0.4, a, t * 0.2); });
  return g;
}
export function spray(n, origin, { radius = 0.6, fall = 1.0, size = 0.014, speed = 0.9 } = {}) {
  const drops = new THREE.InstancedMesh(new THREE.SphereGeometry(size, 6, 4), mat('glow'), n);
  drops.userData.noInk = true;
  const seeds = [...Array(n)].map(() => ({ a: Math.random() * Math.PI * 2, s: 0.4 + Math.random() * 0.8, o: Math.random() }));
  const m4 = new THREE.Matrix4();
  drops.userData.tick = (t) => {
    seeds.forEach((s, i) => { const k = (t * speed + s.o) % 1; const r = k * radius * s.s; m4.makeTranslation(origin.x + Math.cos(s.a) * r, origin.y - k * k * fall, origin.z + Math.sin(s.a) * r); drops.setMatrixAt(i, m4); });
    drops.instanceMatrix.needsUpdate = true;
  };
  return drops;
}
export function flow(points, { r = 0.03, speed = 0.4, n = 2 } = {}) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => V(...p)), false, 'catmullrom', 0);
  const g = G();
  const dots = [...Array(n)].map(() => { const d = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 10), glow(0.95)); d.userData.noInk = true; g.add(d); return d; });
  g.userData.tick = (t) => dots.forEach((d, i) => { const k = (t * speed + i / n) % 1; d.position.copy(curve.getPointAt(k)); d.scale.setScalar(Math.sin(k * Math.PI) + 0.05); });
  return g;
}
export function ticks(root) { const fns = []; root.traverse((o) => { if (o !== root && o.userData.tick) fns.push(o.userData.tick); }); return (t, dt) => fns.forEach((f) => f(t, dt)); }
const panelTex = (title, lines, { accent = COLORS.green } = {}) => canvasTex(512, 320, (c, w, h) => {
  c.fillStyle = '#121412'; c.fillRect(0, 0, w, h);
  c.fillStyle = accent; c.font = `600 34px ${MONO}`; c.fillText(title, 26, 52);
  c.fillStyle = '#cfd3cf'; c.font = `500 24px ${MONO}`; lines.forEach((l, i) => c.fillText(l, 26, 110 + i * 44));
});

// ---------------------------------------------------------------- fire alarm control panel
export function alarmPanel() {
  const g = G();
  add(g, floor(), wallP());
  const body = box(0.95, 1.15, 0.2, 'paper', 0, 1.05, -0.28); add(g, body);
  add(g, box(0.85, 1.05, 0.02, 'mid', 0, 1.05, -0.17));
  const normal = panelTex('SYSTEM NORMAL', ['ZONES 01-16  OK', 'LOOP 1  64 DEV', 'BATTERY  27.4V']);
  const fire = panelTex('FIRE ZONE 03', ['FLOOR 2 · CORRIDOR', 'DETECTOR 2.017', 'EVACUATE'], { accent: '#ffffff' });
  const scr = plate(normal, 0.6, 0.375, 0, 1.3, -0.155); add(g, scr);
  const leds = [];
  for (let i = 0; i < 8; i++) { const l = sph(0.016, 'glow', -0.3 + i * 0.085, 1.02, -0.155); l.userData.noInk = true; add(g, l); leds.push(l); }
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) add(g, box(0.09, 0.06, 0.02, r === 0 && c === 0 ? 'green' : 'ink', -0.2 + c * 0.13, 0.86 - r * 0.09, -0.155));
  add(g, rotX(cyl(0.03, 0.03, 0.03, 'ink', 20, 0.36, 0.86, -0.15), Math.PI / 2));
  // call point + sounder beside it
  add(g, box(0.22, 0.24, 0.07, 'green', 0.75, 1.2, -0.36), box(0.15, 0.15, 0.01, 'flat', 0.75, 1.2, -0.32));
  const snd = rotX(cyl(0.12, 0.1, 0.12, 'paper', 32, -0.75, 1.45, -0.33), Math.PI / 2); add(g, snd);
  const beacon = sph(0.05, 'glow', -0.75, 1.45, -0.26); beacon.userData.noInk = true; add(g, beacon);
  g.userData.tick = (t) => {
    const alarm = (t * 0.18) % 1 > 0.6;
    scr.material.map = alarm ? fire : normal;
    leds.forEach((l, i) => (l.visible = alarm ? Math.sin(t * 10 + i) > 0 : i < 6));
    beacon.scale.setScalar(alarm ? 1 + Math.abs(Math.sin(t * 8)) * 0.8 : 0.6);
  };
  return g;
}

// ---------------------------------------------------------------- VESDA aspirating detection
export function vesda() {
  const g = G();
  add(g, floor(), wallP(2.2, 2.1));
  add(g, box(0.5, 0.55, 0.2, 'paper', -0.6, 0.85, -0.29), box(0.42, 0.08, 0.02, 'ink', -0.6, 1.0, -0.18));
  const bars = [];
  for (let i = 0; i < 10; i++) { const b = box(0.025, 0.04, 0.01, 'glow', -0.78 + i * 0.04, 0.9, -0.18); b.userData.noInk = true; add(g, b); bars.push(b); }
  add(g, pipe([-0.6, 1.12, -0.29], [-0.6, 1.85, -0.29], 0.025), pipe([-0.6, 1.85, -0.29], [0.95, 1.85, -0.29], 0.025));
  add(g, torus(0.03, 0.008, 'ink', -0.6, 1.85, -0.29, 6, 20));
  const holes = [-0.25, 0.15, 0.55, 0.9];
  holes.forEach((x) => add(g, rotX(torus(0.028, 0.006, 'ink', x, 1.82, -0.29, 6, 20), Math.PI / 2)));
  const smoke = G(); holes.forEach((x, i) => add(smoke, puffs(4, { from: V(x, 0.7, 0.2), to: V(x, 1.78, -0.29), spread: 0.08, size: 0.04, speed: 0.22 + i * 0.03 })));
  add(g, smoke, flow([[0.9, 1.85, -0.29], [-0.6, 1.85, -0.29], [-0.6, 1.12, -0.29]], { r: 0.02, speed: 0.35, n: 3 }));
  const tk = ticks(g);
  g.userData.tick = (t, dt) => { tk(t, dt); const lv = 3 + Math.round((Math.sin(t * 0.8) * 0.5 + 0.5) * 6); bars.forEach((b, i) => (b.visible = i < lv)); };
  return g;
}

// ---------------------------------------------------------------- optical beam detector
export function beam() {
  const g = G();
  add(g, floor(2.6, 1.4), box(0.12, 1.9, 0.6, 'mid', -1.25, 0.95, 0), box(0.12, 1.9, 0.6, 'mid', 1.25, 0.95, 0));
  add(g, box(0.18, 0.22, 0.16, 'paper', -1.1, 1.55, 0), rotZ(cyl(0.05, 0.05, 0.04, 'ink', 20, -1.0, 1.55, 0), Math.PI / 2));
  const refl = text([''], { w: 128, h: 128, bg: COLORS.paper }); const rt = canvasTex(128, 128, (c) => { c.fillStyle = '#fff'; c.fillRect(0, 0, 128, 128); c.strokeStyle = COLORS.ink; c.lineWidth = 3; for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) { c.beginPath(); c.moveTo(10 + i * 20, 10 + j * 20); c.lineTo(20 + i * 20, 20 + j * 20); c.lineTo(10 + i * 20, 30 + j * 20); c.stroke(); } });
  const rp = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.26, 0.26), [new THREE.MeshBasicMaterial({ map: rt }), mat('paper'), mat('paper'), mat('paper'), mat('paper'), mat('paper')]); at(rp, 1.17, 1.55, 0); rp.rotation.y = Math.PI; add(g, rp);
  void refl;
  const bm = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 2.1, 12), glow(0.85)); bm.rotation.z = Math.PI / 2; at(bm, 0.07, 1.55, 0); bm.userData.noInk = true; add(g, bm);
  const p = sph(0.03, glow(1), 0, 1.55, 0); p.userData.noInk = true; add(g, p);
  const sm = puffs(8, { from: V(0.2, 0.2, 0.3), to: V(0.1, 1.8, -0.1), spread: 0.25, size: 0.07, speed: 0.12 }); add(g, sm);
  const tk = ticks(g);
  g.userData.tick = (t, dt) => { tk(t, dt); const k = (t * 0.6) % 1; p.position.x = -1.0 + k * 2.15; bm.material.opacity = 0.5 + Math.abs(Math.sin(t * 2)) * 0.45; };
  return g;
}

// ---------------------------------------------------------------- flame detector
export function flameDetector() {
  const g = G();
  add(g, floor(2, 1.6), cyl(0.04, 0.05, 1.6, 'ink', 12, -0.55, 0.8, -0.3));
  const head = G(); at(head, -0.55, 1.62, -0.3);
  add(head, box(0.2, 0.06, 0.2, 'ink', 0, 0.06, 0), rotX(cyl(0.11, 0.13, 0.3, 'paper', 6, 0, -0.1, 0.12), 1.0));
  const lens = sph(0.06, 'glow', 0, -0.2, 0.26); lens.userData.noInk = true; add(head, lens, rotX(cyl(0.14, 0.14, 0.04, 'ink', 6, 0, -0.18, 0.24), 1.0));
  head.rotation.y = 0.5; add(g, head);
  add(g, box(0.6, 0.08, 0.5, 'ink', 0.45, 0.06, 0.3));
  const flames = [0.28, 0.2, 0.14].map((r, i) => { const f = new THREE.Mesh(new THREE.ConeGeometry(r, 0.55 - i * 0.12, 7, 1), mat(i === 1 ? 'paper' : 'green', { flatShading: true })); at(f, 0.45 + (i - 1) * 0.08, 0.38 - i * 0.04, 0.3 + (i % 2) * 0.05); add(g, f); return f; });
  const waves = G();
  for (let i = 0; i < 3; i++) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.008, 6, 40, Math.PI * 0.6), glow()); w.userData.noInk = true; waves.add(w); }
  at(waves, 0.1, 0.95, 0.05); waves.rotation.set(0, -0.6, 0.9); add(g, waves);
  g.userData.tick = (t) => {
    flames.forEach((f, i) => { f.scale.set(1 + Math.sin(t * 9 + i) * 0.08, 1 + Math.sin(t * 7 + i * 2) * 0.18, 1); f.rotation.y = t * (1 + i); });
    waves.children.forEach((w, i) => { const k = (t * 0.6 + i / 3) % 1; w.scale.setScalar(0.5 + k * 1.5); w.material.opacity = 1 - k; });
    lens.scale.setScalar(1 + Math.abs(Math.sin(t * 3)) * 0.2);
  };
  return g;
}

// ---------------------------------------------------------------- linear heat detection cable
export function lhd() {
  const g = G();
  add(g, floor(2.4, 1.4));
  add(g, box(2.1, 0.03, 0.34, 'paper', 0, 1.25, 0), box(2.1, 0.09, 0.02, 'paper', 0, 1.29, 0.17), box(2.1, 0.09, 0.02, 'paper', 0, 1.29, -0.17));
  [-0.9, 0, 0.9].forEach((x) => add(g, pipe([x, 1.27, 0], [x, 2.1, 0], 0.012, 'ink')));
  const pts = []; for (let i = 0; i <= 40; i++) { const x = -1.0 + i * 0.05; pts.push([x, 1.29, Math.sin(i * 0.6) * 0.1]); }
  add(g, tube(pts, 0.014, 'green', 120));
  add(g, box(0.28, 0.34, 0.12, 'paper', 1.2, 1.0, 0), box(0.18, 0.06, 0.01, 'ink', 1.2, 1.08, 0.06), pipe([1.05, 1.29, 0], [1.2, 1.17, 0], 0.012, 'green'));
  const led = sph(0.02, 'glow', 1.2, 0.92, 0.065); add(g, led);
  add(g, flow(pts, { r: 0.035, speed: 0.25, n: 1 }));
  const hot = pulses(2, 0.08, 0.2, 1.3, Math.sin(24 * 0.6) * 0.1, { speed: 0.7 }); add(g, hot);
  const tk = ticks(g);
  g.userData.tick = (t, dt) => { tk(t, dt); led.visible = Math.sin(t * 6) > 0; };
  return g;
}

// ---------------------------------------------------------------- PA / voice evacuation
export function paSystem() {
  const g = G();
  add(g, floor(2.2, 1.6), box(2.2, 0.05, 1.2, 'mid', 0, 2.15, -0.1));
  const desk = G(); add(desk, box(0.8, 0.12, 0.45, 'paper', 0, 0.06, 0), rotX(box(0.8, 0.04, 0.42, 'ink', 0, 0.16, -0.03), -0.25));
  for (let i = 0; i < 6; i++) add(desk, box(0.08, 0.02, 0.06, i === 0 ? 'green' : 'paper', -0.28 + i * 0.11, 0.2, 0.05));
  add(desk, tube([[0.28, 0.16, -0.12], [0.3, 0.38, -0.08], [0.18, 0.55, 0.02]], 0.012, 'ink'), sph(0.045, 'ink', 0.17, 0.57, 0.04));
  at(desk, -0.45, 0.6, 0.25); add(g, desk, box(0.7, 0.6, 0.4, 'mid', -0.45, 0.3, 0.25));
  const spk = G(); add(spk, cyl(0.24, 0.24, 0.05, 'paper', 40, 0, 0, 0)); for (let i = 1; i <= 3; i++) add(spk, torus(0.06 * i, 0.006, 'ink', 0, -0.03, 0, 6, 40)); spk.children.slice(1).forEach((r) => (r.rotation.x = Math.PI / 2));
  at(spk, 0.55, 2.1, 0); add(g, spk);
  add(g, pulses(3, 0.22, 0.55, 1.9, 0, { speed: 0.4, grow: 2.2, lift: -0.6 }));
  const horn = G(); add(horn, rotZ(new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.3, 32, 1, true), mat('paper', { side: THREE.DoubleSide })), -Math.PI / 2), box(0.08, 0.14, 0.14, 'ink', -0.17, 0, 0));
  at(horn, 0.95, 1.4, -0.35); horn.rotation.y = -0.6; add(g, horn);
  g.userData.tick = ticks(g);
  return g;
}

// ---------------------------------------------------------------- fire fighting pipe network
export function pipeNetwork() {
  const g = G();
  add(g, floor(2.4, 1.6));
  add(g, pipe([-1.1, 1.7, 0], [1.1, 1.7, 0], 0.07), pipe([-1.1, 0.12, -0.3], [-1.1, 1.7, -0.3], 0.07), pipe([-1.1, 1.7, -0.3], [-1.1, 1.7, 0], 0.07));
  [-0.5, 0.2, 0.85].forEach((x) => { add(g, pipe([x, 1.7, 0], [x, 1.7, 0.55], 0.035), pipe([x, 1.7, 0.55], [x, 1.45, 0.55], 0.025)); const h = sprinklerHead(); h.scale.setScalar(0.6); at(h, x, 1.43, 0.55); add(g, h); add(g, cyl(0.06, 0.06, 0.07, 'mid', 20, x, 1.7, 0)); });
  const valve = G(); add(valve, cyl(0.12, 0.12, 0.2, 'paper', 24, 0, 0, 0)); const wh = wheel(0.12); at(wh, 0, 0, 0.2); add(valve, wh, rotX(cyl(0.02, 0.02, 0.2, 'ink', 8, 0, 0, 0.1), Math.PI / 2));
  at(valve, -1.1, 0.8, -0.3); add(g, valve);
  const gg = gauge(0.07, -0.95, 1.2, -0.25); add(g, gg, pipe([-1.1, 1.2, -0.3], [-0.95, 1.2, -0.3], 0.015, 'ink'));
  add(g, flow([[-1.1, 0.12, -0.3], [-1.1, 1.7, -0.3], [-1.1, 1.7, 0], [1.1, 1.7, 0]], { r: 0.05, speed: 0.3, n: 3 }));
  const tk = ticks(g);
  g.userData.tick = (t, dt) => { tk(t, dt); wh.rotation.z = Math.sin(t * 0.6) * 1.2; gg.userData.needle.parent.rotation.z = Math.sin(t) * 0.1; };
  return g;
}

// ---------------------------------------------------------------- wet riser through floors
export function wetRiser() {
  const g = G();
  [0, 0.85, 1.7].forEach((y) => add(g, box(1.8, 0.07, 1.2, y ? 'paper' : 'mid', 0, y + 0.035, 0)));
  add(g, pipe([-0.4, 0, -0.35], [-0.4, 2.35, -0.35], 0.06));
  [0.35, 1.2, 2.05].forEach((y) => {
    add(g, pipe([-0.4, y, -0.35], [-0.2, y, -0.35], 0.04), cyl(0.06, 0.06, 0.1, 'paper', 20, -0.15, y, -0.35));
    const w = wheel(0.07); at(w, -0.15, y + 0.1, -0.35); w.rotation.x = Math.PI / 2; add(g, w);
    add(g, box(0.4, 0.5, 0.05, 'mid', -0.2, y + 0.1, -0.58));
  });
  const inlet = G(); add(inlet, box(0.4, 0.3, 0.12, 'green', 0, 0, 0), rotX(cyl(0.06, 0.06, 0.08, 'paper', 6, -0.1, 0, 0.09), Math.PI / 2), rotX(cyl(0.06, 0.06, 0.08, 'paper', 6, 0.1, 0, 0.09), Math.PI / 2));
  at(inlet, 0.55, 0.3, 0.55); add(g, inlet, pipe([0.55, 0.3, 0.45], [0.55, 0.3, -0.35], 0.04), pipe([0.55, 0.3, -0.35], [-0.4, 0.3, -0.35], 0.04));
  add(g, flow([[0.55, 0.3, 0.45], [0.55, 0.3, -0.35], [-0.4, 0.3, -0.35], [-0.4, 2.3, -0.35]], { r: 0.045, speed: 0.28, n: 3 }));
  g.userData.tick = ticks(g);
  return g;
}

// ---------------------------------------------------------------- pillar hydrant with a test jet
export function hydrantPillar() {
  const g = G();
  add(g, floor(2.2, 1.8), cyl(0.5, 0.55, 0.06, 'paper', 40, 0, 0.07, 0));
  add(g, cyl(0.36, 0.38, 0.07, 'mid', 32, 0, 0.13, 0), cyl(0.25, 0.27, 0.86, 'green', 32, 0, 0.6, 0), cyl(0.3, 0.3, 0.07, 'paper', 32, 0, 1.05, 0));
  const dome = sph(0.26, 'green', 0, 1.08, 0, true, 32, 10); dome.scale.y = 0.8; add(g, dome, cyl(0.06, 0.07, 0.09, 'ink', 5, 0, 1.32, 0));
  [-1, 1].forEach((sx) => add(g, rotZ(cyl(0.085, 0.085, 0.22, 'green', 20, sx * 0.3, 0.76, 0), Math.PI / 2), rotZ(cyl(0.1, 0.1, 0.05, 'paper', 6, sx * 0.42, 0.76, 0), Math.PI / 2)));
  add(g, rotX(cyl(0.12, 0.12, 0.2, 'green', 24, 0, 0.6, 0.3), Math.PI / 2));
  for (let i = 0; i < 6; i++) add(g, torus(0.025, 0.006, 'ink', -0.42 + i * 0.012, 0.66 - i * 0.04, 0.05, 6, 12));
  const N = 70, drops = new THREE.InstancedMesh(new THREE.SphereGeometry(0.022, 6, 4), mat('glow'), N); drops.userData.noInk = true; add(g, drops);
  const seeds = [...Array(N)].map(() => ({ o: Math.random(), j: Math.random() - 0.5 })), m4 = new THREE.Matrix4();
  g.userData.tick = (t) => { seeds.forEach((s, i) => { const k = (t * 0.7 + s.o) % 1; m4.makeTranslation(0.4 + k * 1.1, 0.6 + k * 0.6 - k * k * 1.15, 0.3 + s.j * 0.12 * k); drops.setMatrixAt(i, m4); }); drops.instanceMatrix.needsUpdate = true; };
  return g;
}

// ---------------------------------------------------------------- hose reel cabinet
export function hoseReel() {
  const g = G();
  add(g, floor(2, 1.4), box(1.0, 1.3, 0.3, 'paper', 0, 0.85, -0.25), box(0.9, 1.2, 0.02, 'mid', 0, 0.85, -0.09));
  const door = G(); at(door, -0.5, 0.85, -0.08); add(door, box(1.0, 1.3, 0.03, 'glass', 0.5, 0, 0), box(1.0, 0.03, 0.04, 'ink', 0.5, 0.63, 0), box(1.0, 0.03, 0.04, 'ink', 0.5, -0.63, 0), box(0.03, 1.3, 0.04, 'ink', 0.99, 0, 0)); door.rotation.y = -1.2; add(g, door);
  const reel = G(); for (let i = 0; i < 4; i++) add(reel, torus(0.34 - i * 0.055, 0.03, 'green', 0, 0, 0.0 + (i % 2) * 0.01, 8, 48)); add(reel, torus(0.4, 0.014, 'ink', 0, 0, 0, 6, 48), rotX(cyl(0.09, 0.09, 0.12, 'paper', 24), Math.PI / 2));
  at(reel, 0, 0.92, -0.2); add(g, reel);
  add(g, tube([[0.3, 0.75, -0.1], [0.45, 0.5, 0.15], [0.3, 0.1, 0.45], [-0.2, 0.08, 0.6], [-0.55, 0.08, 0.35]], 0.03, 'green', 80));
  add(g, at(rotZ(new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.18, 16), mat('ink')), Math.PI / 2), -0.65, 0.08, 0.3));
  g.userData.tick = (t) => { reel.rotation.z = Math.sin(t * 0.8) * 0.6; };
  return g;
}

// ---------------------------------------------------------------- fire pump set
export function pumpSet() {
  const g = G();
  add(g, floor(2.6, 1.6), box(2.0, 0.12, 0.7, 'ink', 0, 0.1, 0));
  const motor = G(); add(motor, rotZ(cyl(0.26, 0.26, 0.7, 'paper', 32), Math.PI / 2)); for (let i = 0; i < 7; i++) add(motor, rotY(torus(0.27, 0.012, 'ink', -0.3 + i * 0.1, 0, 0, 6, 40), Math.PI / 2));
  add(motor, box(0.24, 0.18, 0.2, 'mid', 0, 0.3, 0)); at(motor, -0.5, 0.45, 0); add(g, motor);
  const shaft = rotZ(cyl(0.04, 0.04, 0.3, 'mid', 16, 0.0, 0.45, 0), Math.PI / 2); add(g, shaft);
  const coup = rotZ(cyl(0.09, 0.09, 0.08, 'green', 6, 0.02, 0.45, 0), Math.PI / 2); add(g, coup);
  const pump = G(); add(pump, rotX(cyl(0.3, 0.3, 0.26, 'green', 40), Math.PI / 2), rotX(torus(0.3, 0.02, 'ink', 0, 0, 0.13, 6, 40), 0), cyl(0.12, 0.12, 0.2, 'green', 24, 0, 0.36, 0));
  at(pump, 0.45, 0.45, 0); add(g, pump);
  add(g, pipe([0.45, 0.82, 0], [0.45, 1.5, 0], 0.1), pipe([0.45, 1.5, 0], [1.1, 1.5, 0], 0.1), pipe([0.75, 0.45, 0], [1.2, 0.45, 0], 0.11));
  const gg = gauge(0.08, 0.45, 1.2, 0.12); add(g, gg);
  const jock = G(); add(jock, rotZ(cyl(0.1, 0.1, 0.28, 'paper', 24), Math.PI / 2), rotX(cyl(0.11, 0.11, 0.1, 'green', 24, 0.22, 0, 0), Math.PI / 2)); at(jock, -0.3, 0.3, 0.6); add(g, jock, box(0.5, 0.06, 0.3, 'ink', -0.25, 0.13, 0.6));
  add(g, box(0.4, 0.6, 0.2, 'paper', -1.1, 0.9, -0.4), box(0.3, 0.12, 0.01, 'ink', -1.1, 1.05, -0.29));
  const led = sph(0.02, 'glow', -1.18, 0.85, -0.29); add(g, led);
  add(g, flow([[0.75, 0.45, 0], [0.45, 0.45, 0], [0.45, 1.5, 0], [1.1, 1.5, 0]], { r: 0.06, speed: 0.4, n: 3 }));
  const tk = ticks(g);
  g.userData.tick = (t, dt) => { tk(t, dt); coup.rotation.x += dt * 14; gg.rotation.z = Math.sin(t * 2) * 0.06; led.visible = Math.sin(t * 5) > -0.2; };
  return g;
}

// ---------------------------------------------------------------- deluge valve + open nozzles
export function deluge() {
  const g = G();
  add(g, floor(2.4, 1.6), pipe([-0.9, 0.05, -0.2], [-0.9, 1.85, -0.2], 0.07), pipe([-0.9, 1.85, -0.2], [1.0, 1.85, -0.2], 0.06));
  const valve = G(); add(valve, sph(0.17, 'green', 0, 0, 0), cyl(0.13, 0.13, 0.04, 'ink', 24, 0, 0.17, 0), cyl(0.13, 0.13, 0.04, 'ink', 24, 0, -0.17, 0), rotZ(cyl(0.05, 0.05, 0.2, 'paper', 16, 0.18, 0, 0), Math.PI / 2), box(0.14, 0.12, 0.1, 'ink', 0.3, 0, 0));
  at(valve, -0.9, 0.75, -0.2); add(g, valve, gauge(0.06, -0.72, 1.05, -0.12));
  [-0.4, 0.1, 0.6].forEach((x) => { add(g, pipe([x, 1.85, -0.2], [x, 1.68, -0.2], 0.025), rotX(new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.08, 16, 1, true), mat('paper', { side: THREE.DoubleSide })), 0)); g.children.at(-1).position.set(x, 1.63, -0.2); add(g, spray(50, V(x, 1.58, -0.2), { radius: 0.5, fall: 1.5, speed: 1.1 })); });
  g.userData.tick = ticks(g);
  return g;
}

// ---------------------------------------------------------------- foam system
export function foam() {
  const g = G();
  add(g, floor(2.6, 1.6));
  const tank = G(); add(tank, rotZ(cyl(0.35, 0.35, 1.1, 'paper', 40), Math.PI / 2)); [-0.55, 0.55].forEach((x) => { const e = sph(0.35, 'paper', x, 0, 0); e.scale.x = 0.4; add(tank, e); });
  add(tank, rotZ(cyl(0.36, 0.36, 0.06, 'green', 40, -0.2, 0, 0), Math.PI / 2), rotZ(cyl(0.36, 0.36, 0.06, 'green', 40, 0.2, 0, 0), Math.PI / 2));
  at(tank, -0.4, 0.55, -0.1); add(g, tank, box(0.2, 0.2, 0.7, 'ink', -0.8, 0.12, -0.1), box(0.2, 0.2, 0.7, 'ink', 0.0, 0.12, -0.1));
  add(g, pipe([-0.4, 0.9, -0.1], [-0.4, 1.3, -0.1], 0.04), pipe([-0.4, 1.3, -0.1], [0.75, 1.3, -0.1], 0.04), pipe([0.75, 1.3, -0.1], [0.75, 1.0, -0.1], 0.04));
  add(g, at(rotZ(new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.18, 20, 1, true), mat('green', { side: THREE.DoubleSide })), Math.PI), 0.75, 0.92, -0.1));
  const blobs = G(); const bl = [...Array(16)].map((_, i) => { const b = new THREE.Mesh(new THREE.SphereGeometry(0.07 + (i % 4) * 0.02, 16, 12), mat('paper')); b.userData.o = i / 16; b.userData.noInk = true; blobs.add(b); return b; });
  add(g, blobs);
  for (let i = 0; i < 9; i++) { const b = sph(0.09 + (i % 3) * 0.03, 'paper', 0.6 + Math.cos(i * 2.1) * 0.3, 0.08, 0.2 + Math.sin(i * 2.1) * 0.25); b.scale.y = 0.6; add(g, b); }
  g.userData.tick = (t) => bl.forEach((b, i) => { const k = (t * 0.35 + b.userData.o) % 1; b.position.set(0.75 + Math.cos(i * 1.7) * 0.18 * k, 0.86 - k * 0.78, -0.1 + Math.sin(i * 1.7) * 0.25 * k); b.scale.setScalar(0.5 + k * 0.6); });
  return g;
}

// ---------------------------------------------------------------- HDPE pipes + electrofusion
export function hdpe() {
  const g = G();
  add(g, floor(2.6, 1.6));
  add(g, rotZ(cyl(0.16, 0.16, 1.0, 'ink', 32, -0.62, 0.35, 0), Math.PI / 2), rotZ(cyl(0.16, 0.16, 1.0, 'ink', 32, 0.62, 0.35, 0), Math.PI / 2));
  const cpl = rotZ(cyl(0.2, 0.2, 0.32, 'green', 32, 0, 0.35, 0), Math.PI / 2); add(g, cpl);
  [-0.09, 0.09].forEach((x) => add(g, cyl(0.025, 0.025, 0.08, 'paper', 12, x, 0.58, 0)));
  add(g, box(0.4, 0.3, 0.3, 'paper', 0.3, 0.17, 0.6), box(0.25, 0.08, 0.01, 'ink', 0.3, 0.24, 0.755));
  add(g, tube([[0.25, 0.3, 0.5], [0.1, 0.65, 0.3], [-0.06, 0.62, 0.05]], 0.012, 'ink'), tube([[0.35, 0.3, 0.5], [0.2, 0.7, 0.25], [0.09, 0.62, 0.05]], 0.012, 'ink'));
  for (let i = 0; i < 5; i++) add(g, rotX(torus(0.4 - i * 0.012, 0.06, 'ink', -0.55, 0.07 + i * 0.12, -0.45, 10, 48), Math.PI / 2));
  const heat = pulses(3, 0.22, 0, 0.35, 0, { axis: 'x', speed: 0.6, grow: 0.6 }); add(g, heat);
  g.userData.tick = ticks(g);
  return g;
}

// ---------------------------------------------------------------- FM200: cylinder + ceiling nozzle discharge
export function fm200() {
  const g = G();
  add(g, floor(2.2, 1.6), wallP(2.2, 2.1), box(2.2, 0.05, 1.3, 'mid', 0, 2.1, 0.2));
  const c = G(); add(c, cyl(0.28, 0.28, 1.25, 'green', 48, 0, 0.66, 0)); const top = sph(0.28, 'green', 0, 1.28, 0, true, 48, 12); top.scale.y = 0.7; add(c, top, cyl(0.282, 0.282, 0.32, 'paper', 48, 0, 0.75, 0), cyl(0.07, 0.07, 0.12, 'mid', 20, 0, 1.5, 0), box(0.16, 0.1, 0.14, 'ink', 0, 1.6, 0));
  const lbl = text(['FM-200', 'HFC-227ea'], { w: 512, h: 256, font: `700 64px ${SANS}` }); const band = new THREE.Mesh(new THREE.CylinderGeometry(0.286, 0.286, 0.3, 48, 1, true, -0.6, 1.2), new THREE.MeshBasicMaterial({ map: lbl })); band.position.y = 0.75; band.userData.noInk = true; add(c, band);
  add(c, rotX(torus(0.29, 0.014, 'ink', 0, 1.0, 0, 6, 48), Math.PI / 2)); at(c, -0.5, 0, -0.1); add(g, c);
  add(g, pipe([-0.5, 1.66, -0.1], [-0.5, 2.0, -0.1], 0.03, 'mid'), pipe([-0.5, 2.0, -0.1], [0.55, 2.0, 0.3], 0.03, 'mid'), pipe([0.55, 2.0, 0.3], [0.55, 1.88, 0.3], 0.03, 'mid'), cyl(0.06, 0.04, 0.06, 'ink', 16, 0.55, 1.85, 0.3));
  add(g, puffs(12, { from: V(0.55, 1.8, 0.3), to: V(0.55, 0.6, 0.3), spread: 0.8, size: 0.09, speed: 0.22, m: 'paper' }));
  g.userData.tick = ticks(g);
  return g;
}

// ---------------------------------------------------------------- Novec 1230 protecting a server rack
export function novec() {
  const g = G();
  add(g, floor(2.4, 1.6), box(2.4, 0.05, 1.4, 'mid', 0, 2.15, 0));
  const c = G(); add(c, cyl(0.22, 0.22, 1.1, 'paper', 48, 0, 0.58, 0)); const top = sph(0.22, 'paper', 0, 1.13, 0, true, 48, 12); top.scale.y = 0.7; add(c, top, cyl(0.222, 0.222, 0.16, 'green', 48, 0, 0.7, 0), box(0.14, 0.1, 0.12, 'ink', 0, 1.33, 0));
  at(c, -0.85, 0, -0.2); add(g, c);
  const rk = G(); add(rk, box(0.62, 1.7, 0.7, 'ink', 0, 0.85, 0)); for (let i = 0; i < 8; i++) { add(rk, box(0.56, 0.14, 0.02, i % 2 ? 'paper' : 'mid', 0, 0.2 + i * 0.19, 0.36)); const l = box(0.03, 0.02, 0.01, 'glow', -0.22, 0.24 + i * 0.19, 0.372); l.userData.noInk = true; add(rk, l); }
  at(rk, 0.35, 0, -0.1); add(g, rk);
  add(g, pipe([-0.85, 1.38, -0.2], [-0.85, 2.05, -0.2], 0.025, 'mid'), pipe([-0.85, 2.05, -0.2], [0.35, 2.05, 0.4], 0.025, 'mid'), cyl(0.05, 0.035, 0.06, 'ink', 16, 0.35, 2.0, 0.4));
  const sparkle = G(); for (let i = 0; i < 14; i++) { const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.025), glow(1)); s.userData.o = i / 14; s.userData.noInk = true; sparkle.add(s); } add(g, sparkle);
  g.userData.tick = (t) => sparkle.children.forEach((s, i) => { const k = (t * 0.3 + s.userData.o) % 1; s.position.set(0.35 + Math.cos(i * 2.4) * 0.55 * k, 1.95 - k * 1.6, 0.4 + Math.sin(i * 2.4) * 0.4 * k); s.material.opacity = 1 - k; s.rotation.y = t * 2; });
  return g;
}

// ---------------------------------------------------------------- kitchen hood suppression
export function kitchenHood() {
  const g = G();
  add(g, floor(2.4, 1.6), wallP(2.4, 2.2));
  add(g, box(1.8, 0.85, 0.7, 'paper', 0, 0.42, -0.05), box(1.8, 0.05, 0.72, 'ink', 0, 0.87, -0.05));
  [-0.5, 0.1, 0.6].forEach((x, i) => { add(g, cyl(0.18, 0.16, 0.18 + i * 0.05, i === 1 ? 'ink' : 'paper', 32, x, 0.98 + i * 0.025, -0.05)); });
  const hood = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 1.25, 0.5, 4, 1, true), mat('mid', { side: THREE.DoubleSide })); hood.rotation.y = Math.PI / 4; hood.scale.z = 0.55; at(hood, 0, 1.9, -0.1); add(g, hood);
  add(g, box(0.5, 0.4, 0.4, 'mid', 0, 2.3, -0.2));
  add(g, pipe([-0.6, 1.66, 0.05], [0.7, 1.66, 0.05], 0.018, 'green'));
  const noz = [-0.5, 0.1, 0.6].map((x) => { const n = cyl(0.025, 0.035, 0.06, 'ink', 12, x, 1.62, 0.05); add(g, n); return x; });
  add(g, cyl(0.12, 0.12, 0.5, 'green', 32, 1.0, 1.2, -0.3), box(0.16, 0.2, 0.06, 'paper', -1.0, 1.25, -0.37));
  const fl = [0.12, 0.08].map((r, i) => { const f = new THREE.Mesh(new THREE.ConeGeometry(r, 0.3 - i * 0.08, 7), mat(i ? 'paper' : 'green', { flatShading: true })); at(f, 0.1, 1.25, -0.05); add(g, f); return f; });
  const mist = G(); noz.forEach((x) => add(mist, spray(30, V(x, 1.57, 0.05), { radius: 0.25, fall: 0.5, speed: 0.9, size: 0.012 }))); add(g, mist);
  const tk = ticks(g);
  g.userData.tick = (t, dt) => { tk(t, dt); const on = (t * 0.25) % 1 > 0.45; mist.visible = on; fl.forEach((f, i) => { const s = on ? Math.max(0.05, 1 - ((t * 0.25) % 1 - 0.45) * 4) : 1; f.scale.set(s, s * (1 + Math.sin(t * 9 + i) * 0.15), s); }); };
  return g;
}

// ---------------------------------------------------------------- clean agent: protected room
export function cleanAgent() {
  const g = G();
  add(g, floor(2.6, 1.8));
  const room = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.5, 1.6, 1.2)), new THREE.LineDashedMaterial({ color: COLORS.green, dashSize: 0.06, gapSize: 0.04 })); room.computeLineDistances(); at(room, 0.35, 0.82, 0); add(g, room);
  [-0.85, -0.45].forEach((x) => { add(g, cyl(0.17, 0.17, 1.05, 'green', 40, x, 0.55, -0.35)); const t = sph(0.17, 'green', x, 1.07, -0.35, true, 32, 10); t.scale.y = 0.7; add(g, t, cyl(0.172, 0.172, 0.2, 'paper', 40, x, 0.62, -0.35), box(0.12, 0.08, 0.1, 'ink', x, 1.24, -0.35)); });
  add(g, pipe([-0.85, 1.32, -0.35], [-0.45, 1.32, -0.35], 0.03, 'mid'), pipe([-0.65, 1.32, -0.35], [-0.65, 1.75, -0.35], 0.03, 'mid'), pipe([-0.65, 1.75, -0.35], [0.35, 1.55, 0], 0.03, 'mid'));
  add(g, box(0.4, 0.5, 0.12, 'paper', 1.25, 1.0, -0.4), box(0.3, 0.14, 0.01, 'ink', 1.25, 1.12, -0.335));
  const led = sph(0.02, 'glow', 1.15, 0.9, -0.33); add(g, led);
  add(g, puffs(10, { from: V(0.35, 1.5, 0), to: V(0.35, 0.3, 0), spread: 0.55, size: 0.07, speed: 0.2, m: 'paper' }));
  const tk = ticks(g);
  g.userData.tick = (t, dt) => { tk(t, dt); led.visible = Math.sin(t * 4) > 0; };
  return g;
}

// ---------------------------------------------------------------- fire damper in a duct
export function damper() {
  const g = G();
  add(g, floor(2.6, 1.4), box(0.2, 2.0, 1.4, 'mid', 0, 1.0, 0));
  const duct = (x) => { const d = G(); add(d, box(0.9, 0.05, 0.7, 'paper', 0, 0.35, 0), box(0.9, 0.05, 0.7, 'paper', 0, -0.35, 0), box(0.9, 0.7, 0.05, 'paper', 0, 0, 0.35), box(0.9, 0.7, 0.05, 'paper', 0, 0, -0.35)); at(d, x, 1.2, 0); return d; };
  add(g, duct(-0.55), duct(0.55), box(0.12, 0.85, 0.85, 'ink', 0, 1.2, 0));
  const blades = [...Array(4)].map((_, i) => { const b = box(0.02, 0.17, 0.64, 'green', 0, 0.94 + i * 0.17, 0); add(g, b); return b; });
  add(g, box(0.03, 0.04, 0.12, 'glow', 0.07, 1.55, 0.25));
  const arrows = G(); for (let i = 0; i < 4; i++) { const a = rotZ(new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 12), glow()), -Math.PI / 2); a.userData.o = i / 4; a.userData.noInk = true; arrows.add(a); } add(g, arrows);
  g.userData.tick = (t) => {
    const k = (t * 0.2) % 1; const shut = k > 0.5 ? Math.min(1, (k - 0.5) * 6) : Math.max(0, 1 - k * 6);
    blades.forEach((b) => (b.rotation.z = (1 - shut) * 1.3));
    arrows.children.forEach((a, i) => { const q = (t * 0.6 + a.userData.o) % 1; a.position.set(-0.95 + q * 1.9 * (shut > 0.5 ? 0.45 : 1), 1.05 + (i % 2) * 0.3, -0.15 + (i % 3) * 0.15); a.material.opacity = shut > 0.5 && a.position.x > -0.15 ? 0 : 1 - q * 0.6; });
  };
  return g;
}

// ---------------------------------------------------------------- fire protection products on a shelf
export function productsTrio() {
  const g = G();
  add(g, floor(2.4, 1.4), box(2.0, 0.06, 0.6, 'paper', 0, 0.9, -0.2), box(0.06, 0.9, 0.6, 'ink', -0.95, 0.45, -0.2), box(0.06, 0.9, 0.6, 'ink', 0.95, 0.45, -0.2));
  const ex = G(); add(ex, cyl(0.12, 0.12, 0.5, 'green', 32, 0, 0.25, 0)); const d = sph(0.12, 'green', 0, 0.5, 0, true); d.scale.y = 0.6; add(ex, d, box(0.12, 0.06, 0.06, 'ink', 0, 0.6, 0), tube([[0.06, 0.6, 0], [0.16, 0.5, 0.03], [0.14, 0.2, 0.08]], 0.012, 'ink'));
  at(ex, -0.55, 0.93, -0.2); add(g, ex);
  const bl = text(['FIRE', 'BLANKET'], { w: 256, h: 256, bg: COLORS.green, fg: COLORS.paper, font: `700 52px ${SANS}` });
  const blanket = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.4, 0.08), [mat('green'), mat('green'), mat('green'), mat('green'), new THREE.MeshBasicMaterial({ map: bl }), mat('green')]); at(blanket, 0.05, 1.13, -0.15); add(g, blanket);
  add(g, box(0.06, 0.08, 0.02, 'ink', 0.0, 0.88, -0.1), box(0.06, 0.08, 0.02, 'ink', 0.1, 0.88, -0.1));
  const sg = canvasTex(256, 128, (c) => { c.fillStyle = COLORS.green; c.fillRect(0, 0, 256, 128); c.fillStyle = COLORS.paper; c.font = `700 42px ${SANS}`; c.textAlign = 'center'; c.fillText('EXIT →', 128, 80); });
  const sign = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.22, 0.06), [mat('paper'), mat('paper'), mat('paper'), mat('paper'), new THREE.MeshBasicMaterial({ map: sg }), mat('paper')]); at(sign, 0.6, 1.05, -0.2); add(g, sign);
  const bucket = G(); add(bucket, cyl(0.18, 0.13, 0.3, 'paper', 32, 0, 0.15, 0), torus(0.18, 0.012, 'ink', 0, 0.3, 0, 6, 32)); bucket.children[1].rotation.x = Math.PI / 2; at(bucket, 0.35, 0.04, 0.35); add(g, bucket);
  g.userData.tick = (t) => { sign.material[4].opacity = 1; ex.rotation.y = Math.sin(t * 0.7) * 0.3; };
  return g;
}

// ---------------------------------------------------------------- central battery cabinet
export function batteryCabinet() {
  const g = G();
  add(g, floor(2.2, 1.4), box(1.0, 1.7, 0.5, 'paper', 0, 0.87, -0.2), box(0.9, 1.6, 0.02, 'ink', 0, 0.87, 0.04));
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { add(g, box(0.24, 0.22, 0.3, 'green', -0.28 + c * 0.28, 0.25 + r * 0.33, -0.15)); add(g, cyl(0.02, 0.02, 0.04, 'ink', 8, -0.33 + c * 0.28, 0.38 + r * 0.33, -0.1), cyl(0.02, 0.02, 0.04, 'paper', 8, -0.23 + c * 0.28, 0.38 + r * 0.33, -0.1)); }
  const door = G(); at(door, 0.5, 0.87, 0.06); add(door, box(1.0, 1.7, 0.03, 'paper', -0.5, 0, 0));
  const scr = text(['CHARGING', '99%'], { w: 256, h: 128, bg: '#121412', fg: COLORS.green, font: `600 34px ${MONO}` }); add(door, plate(scr, 0.4, 0.2, -0.5, 0.45, 0.02));
  const led = sph(0.02, 'glow', -0.25, 0.25, 0.02); add(door, led); door.rotation.y = 1.1; add(g, door);
  add(g, pipe([0, 1.75, -0.2], [0, 2.1, -0.2], 0.04, 'ink'));
  g.userData.tick = (t) => { led.visible = Math.sin(t * 3) > 0; door.rotation.y = 1.0 + Math.sin(t * 0.5) * 0.15; };
  return g;
}

// ---------------------------------------------------------------- service kit
export function servicesKit() {
  const g = G();
  add(g, floor(2.4, 1.6));
  const tb = G(); add(tb, box(0.9, 0.4, 0.4, 'green', 0, 0.2, 0), box(0.92, 0.06, 0.42, 'ink', 0, 0.42, 0), box(0.5, 0.04, 0.04, 'ink', 0, 0.56, 0), box(0.04, 0.12, 0.04, 'ink', -0.24, 0.5, 0), box(0.04, 0.12, 0.04, 'ink', 0.24, 0.5, 0));
  at(tb, -0.4, 0.04, 0); add(g, tb);
  const wr = G(); add(wr, box(0.6, 0.05, 0.08, 'paper', 0, 0, 0), torus(0.07, 0.025, 'paper', 0.32, 0, 0, 8, 24, Math.PI * 1.6)); wr.children[1].rotation.x = Math.PI / 2; at(wr, 0.55, 0.07, 0.35); wr.rotation.y = 0.5; add(g, wr);
  const tab = text(['AMC VISIT · Q3', '✓ Alarm test', '✓ Pump run', '✓ Valves', '◻ Report'], { w: 384, h: 512, bg: '#ffffff', font: `500 34px ${MONO}`, align: 'left', pad: 28 });
  const tablet = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.03, 0.56), [mat('ink'), mat('ink'), new THREE.MeshBasicMaterial({ map: tab }), mat('ink'), mat('ink'), mat('ink')]); at(tablet, 0.55, 0.1, -0.25); tablet.rotation.set(0, -0.3, 0); add(g, tablet);
  add(g, gauge(0.12, -0.4, 0.75, 0.0));
  const hat = G(); const sh = sph(0.18, 'green', 0, 0, 0, true, 32, 12); sh.scale.y = 0.85; add(hat, sh, cyl(0.24, 0.24, 0.015, 'green', 40, 0, 0.005, 0.03)); at(hat, 0.95, 0.04, 0.4); add(g, hat);
  g.userData.tick = (t) => { g.children.forEach(() => {}); };
  return g;
}

// ---------------------------------------------------------------- risk assessment: magnifier over a plan
export function riskAssessment() {
  const g = G();
  add(g, floor(2.4, 1.8));
  const plan = canvasTex(768, 512, (c, w, h) => {
    c.fillStyle = '#fff'; c.fillRect(0, 0, w, h); c.strokeStyle = COLORS.ink; c.lineWidth = 8; c.strokeRect(40, 40, w - 80, h - 80);
    c.lineWidth = 4; [[300, 40, 300, 260], [40, 260, 500, 260], [500, 260, 500, h - 40]].forEach(([a, b, x, y]) => { c.beginPath(); c.moveTo(a, b); c.lineTo(x, y); c.stroke(); });
    c.font = `500 22px ${MONO}`; c.fillStyle = '#6b6f6b'; c.fillText('RACKING ZONE A', 80, 160); c.fillText('LOADING BAY', 560, 380); c.fillText('CHARGING', 120, 380);
    c.fillStyle = COLORS.green; [[180, 330], [600, 160], [400, 420]].forEach(([x, y]) => { c.beginPath(); c.moveTo(x, y - 26); c.lineTo(x + 26, y + 20); c.lineTo(x - 26, y + 20); c.closePath(); c.fill(); c.fillStyle = '#fff'; c.font = `700 28px ${SANS}`; c.fillText('!', x - 5, y + 14); c.fillStyle = COLORS.green; });
  });
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.03, 1.06), [mat('ink'), mat('ink'), new THREE.MeshBasicMaterial({ map: plan }), mat('ink'), mat('ink'), mat('ink')]); at(board, 0, 0.06, 0); add(g, board);
  const mag = G(); add(mag, torus(0.22, 0.03, 'ink', 0, 0, 0, 10, 48)); const lens = new THREE.Mesh(new THREE.CircleGeometry(0.21, 40), mat('glass')); lens.userData.noInk = true; add(mag, lens, box(0.06, 0.06, 0.45, 'ink', 0, 0, 0.42)); mag.rotation.x = -Math.PI / 2 + 0.3; add(g, mag);
  const cones = [[-0.44, 0.08], [0.44, -0.24], [0.04, 0.32]].map(([x, z]) => { const c = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 3), mat('green', { flatShading: true })); at(c, x, 0.16, z); add(g, c); return c; });
  g.userData.tick = (t) => { mag.position.set(Math.sin(t * 0.5) * 0.45, 0.32 + Math.sin(t * 1.3) * 0.03, Math.cos(t * 0.7) * 0.25); cones.forEach((c, i) => { c.position.y = 0.16 + Math.abs(Math.sin(t * 2 + i)) * 0.05; c.rotation.y = t + i; }); };
  return g;
}

// ---------------------------------------------------------------- Istifa certificate with a seal
export function certificate() {
  const g = G();
  add(g, floor(2.2, 1.6));
  const cert = canvasTex(768, 1024, (c, w, h) => {
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h); c.strokeStyle = COLORS.green; c.lineWidth = 16; c.strokeRect(30, 30, w - 60, h - 60); c.lineWidth = 3; c.strokeRect(56, 56, w - 112, h - 112);
    c.fillStyle = COLORS.ink; c.textAlign = 'center'; c.font = `600 34px ${MONO}`; c.fillText('CIVIL DEFENCE', w / 2, 170);
    c.font = `700 70px ${SANS}`; c.fillText('Certificate', w / 2, 290); c.font = `400 42px ${SANS}`; c.fillText('of Compliance', w / 2, 350);
    c.font = `500 30px ${MONO}`; c.fillStyle = '#5e615e'; c.fillText('ISTIFA · FIRE & LIFE SAFETY', w / 2, 440);
    c.strokeStyle = '#d6d8d5'; c.lineWidth = 2; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(130, 520 + i * 50); c.lineTo(w - 130, 520 + i * 50); c.stroke(); }
    c.fillStyle = COLORS.ink; c.font = `400 50px "Patrick Hand", cursive`; c.fillText('Approved', w / 2 - 120, 900);
  });
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.25, 0.05), [mat('ink'), mat('ink'), mat('ink'), mat('ink'), new THREE.MeshBasicMaterial({ map: cert }), mat('ink')]);
  at(frame, 0, 1.0, 0); frame.rotation.x = -0.12; add(g, frame);
  add(g, pipe([-0.3, 0.05, -0.35], [-0.12, 0.85, -0.05], 0.025, 'ink'), pipe([0.3, 0.05, -0.35], [0.12, 0.85, -0.05], 0.025, 'ink'), pipe([0, 0.05, 0.4], [0, 0.6, 0.05], 0.025, 'ink'));
  const seal = G(); const disc = rotX(cyl(0.13, 0.13, 0.03, 'green', 24), Math.PI / 2); add(seal, disc);
  for (let i = 0; i < 24; i++) { const s = box(0.03, 0.03, 0.03, 'green', Math.cos((i / 24) * Math.PI * 2) * 0.14, Math.sin((i / 24) * Math.PI * 2) * 0.14, 0); s.rotation.z = (i / 24) * Math.PI * 2; add(seal, s); }
  add(seal, rotZ(box(0.06, 0.24, 0.01, 'green', -0.05, -0.2, -0.01), 0.3), rotZ(box(0.06, 0.24, 0.01, 'green', 0.05, -0.2, -0.01), -0.3));
  at(seal, 0.28, 0.62, 0.08); seal.rotation.x = -0.12; add(g, seal);
  g.userData.tick = (t) => { seal.rotation.z = Math.sin(t * 0.8) * 0.12; seal.scale.setScalar(1 + Math.sin(t * 1.6) * 0.03); };
  return g;
}

// ---------------------------------------------------------------- AMC building with a city sign board
export function cityTower(name = 'ABU DHABI', style = 'ad') {
  const g = G();
  add(g, box(2.2, 0.05, 1.7, 'mid', 0, 0.025, 0));
  let top = 0;
  if (style === 'dxb') {
    const tiers = [[0.62, 0.5, 0.5], [0.5, 0.42, 0.45], [0.38, 0.32, 0.42], [0.26, 0.22, 0.38], [0.15, 0.13, 0.3]];
    let y = 0.05; tiers.forEach(([w, d, h], i) => { for (let k = 0; k < 3; k++) { add(g, box(w, h / 3 - 0.012, d, 'paper', 0.1, y + h / 6, -0.05)); add(g, box(w + 0.02, 0.012, d + 0.02, 'mid', 0.1, y + h / 3 - 0.006, -0.05)); y += h / 3; } void i; });
    add(g, cyl(0.01, 0.04, 0.45, 'ink', 8, 0.1, y + 0.22, -0.05)); top = y + 0.45;
  } else if (style === 'shj') {
    let y = 0.05; for (let i = 0; i < 4; i++) { add(g, box(0.9, 0.19, 0.6, 'paper', 0.05, y + 0.095, -0.05)); for (let a = 0; a < 4; a++) { const arch = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.012, 20, 1, false, 0, Math.PI), mat('ink')); arch.rotation.x = Math.PI / 2; arch.rotation.z = Math.PI; at(arch, -0.27 + a * 0.21, y + 0.13, 0.252); add(g, arch, box(0.12, 0.07, 0.012, 'ink', -0.27 + a * 0.21, y + 0.09, 0.252)); } add(g, box(0.94, 0.02, 0.64, 'mid', 0.05, y + 0.2, -0.05)); y += 0.21; }
    const dome = sph(0.24, 'green', 0.05, y, -0.05, true, 40, 16); add(g, dome, cyl(0.25, 0.25, 0.05, 'paper', 40, 0.05, y + 0.01, -0.05));
    [-0.35, 0.45].forEach((x) => { const m = sph(0.09, 'green', x, y, 0.18, true, 24, 10); add(g, m, cyl(0.1, 0.1, 0.04, 'paper', 24, x, y, 0.18)); });
    top = y + 0.26;
  } else {
    let y = 0.05; [[0.8, 0.62, 4], [0.68, 0.54, 4], [0.52, 0.46, 3]].forEach(([w, d, n], b) => { for (let i = 0; i < n; i++) { add(g, box(w, 0.165, d, 'paper', -0.05 + b * 0.04, y + 0.0825, -0.05)); add(g, box(w * 0.94, 0.06, 0.01, 'ink', -0.05 + b * 0.04, y + 0.08, -0.05 + d / 2 + 0.002)); add(g, box(w + 0.04, 0.02, d + 0.04, 'mid', -0.05 + b * 0.04, y + 0.175, -0.05)); y += 0.185; } });
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.0, 0.3, 0.26, 4), mat('green')); crown.rotation.y = Math.PI / 4; at(crown, 0.03, y + 0.13, -0.05); add(g, crown); top = y + 0.26;
  }
  // sign board on two posts
  const sign = canvasTex(1024, 300, (c, w, h) => { c.fillStyle = COLORS.ink; c.fillRect(0, 0, w, h); c.fillStyle = COLORS.green; c.fillRect(0, h - 18, w, 18); c.fillStyle = COLORS.paper; c.font = `800 128px "Montserrat", ${SANS}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(name, w / 2, h / 2 - 4); c.font = `500 30px ${MONO}`; c.fillStyle = COLORS.green; c.fillText('ANNUAL MAINTENANCE CONTRACT', w / 2, h - 50); });
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.34, 0.05), [mat('ink'), mat('ink'), mat('ink'), mat('ink'), new THREE.MeshBasicMaterial({ map: sign }), mat('ink')]); at(board, -0.25, 0.55, 0.62); add(g, board, pipe([-0.75, 0.04, 0.6], [-0.75, 0.4, 0.6], 0.025, 'ink'), pipe([0.25, 0.04, 0.6], [0.25, 0.4, 0.6], 0.025, 'ink'));
  const orbit = G(); add(orbit, rotX(torus(0.62, 0.006, 'glow', 0, 0, 0, 6, 120), Math.PI / 2)); const dots = [0, 1, 2, 3].map((i) => { const d = sph(0.03, 'glow'); d.userData.a = (i / 4) * Math.PI * 2; d.userData.noInk = true; add(orbit, d); return d; });
  orbit.children[0].userData.noInk = true; at(orbit, 0.05, top * 0.55, -0.05); add(g, orbit);
  g.userData.tick = (t) => { dots.forEach((d) => { const a = d.userData.a + t * 0.4; d.position.set(Math.cos(a) * 0.62, 0, Math.sin(a) * 0.62); }); orbit.position.y = top * 0.55 + Math.sin(t * 0.8) * 0.04; };
  return g;
}
