// Gas, sealant, smoke, security/ELV, IT, company and project-building models.
import { THREE, mat, canvasTex, COLORS } from './fs3d.js';
import { V, G, at, box, cyl, sph, torus, tube, add, rotX, rotY, rotZ, MONO, SANS, lpgBottle, tree } from './models.js';
import { floor, wallP, pipe, plate, text, gauge, wheel, pulses, puffs, spray, flow, ticks } from './models-fire.js';

const glow = (o = 1) => new THREE.MeshBasicMaterial({ color: COLORS.green, transparent: true, opacity: o, depthWrite: false });
const led = (x, y, z, r = 0.02) => { const l = sph(r, 'glow', x, y, z); l.userData.noInk = true; return l; };

// ---------------------------------------------------------------- bulk LPG tank
export function bulkTank() {
  const g = G();
  add(g, floor(2.8, 1.8));
  const t = G(); add(t, rotZ(cyl(0.38, 0.38, 1.4, 'paper', 48), Math.PI / 2)); [-0.7, 0.7].forEach((x) => { const e = sph(0.38, 'paper', x, 0, 0); e.scale.x = 0.5; add(t, e); });
  add(t, rotZ(cyl(0.385, 0.385, 0.05, 'green', 48, -0.3, 0, 0), Math.PI / 2), rotZ(cyl(0.385, 0.385, 0.05, 'green', 48, 0.3, 0, 0), Math.PI / 2));
  add(t, cyl(0.12, 0.12, 0.06, 'ink', 24, 0, 0.4, 0), cyl(0.03, 0.03, 0.18, 'mid', 12, -0.1, 0.5, 0), cyl(0.03, 0.03, 0.14, 'mid', 12, 0.1, 0.48, 0));
  at(t, -0.15, 0.62, 0); add(g, t, box(0.18, 0.28, 0.6, 'ink', -0.65, 0.18, 0), box(0.18, 0.28, 0.6, 'ink', 0.35, 0.18, 0));
  add(g, gauge(0.08, 0.38, 1.12, 0.05), pipe([-0.15, 1.1, 0], [-0.15, 1.35, 0], 0.025), pipe([-0.15, 1.35, 0], [1.1, 1.35, 0], 0.025), pipe([1.1, 1.35, 0], [1.1, 0.05, 0], 0.025));
  for (let i = 0; i < 9; i++) add(g, cyl(0.015, 0.015, 0.7, 'ink', 6, -1.25 + i * 0.3, 0.35, 0.75));
  add(g, box(2.45, 0.02, 0.02, 'ink', -0.05, 0.68, 0.75), box(2.45, 0.02, 0.02, 'ink', -0.05, 0.35, 0.75));
  add(g, flow([[-0.15, 1.1, 0], [-0.15, 1.35, 0], [1.1, 1.35, 0], [1.1, 0.1, 0]], { r: 0.035, speed: 0.3, n: 2 }));
  g.userData.tick = ticks(g);
  return g;
}

// ---------------------------------------------------------------- central gas: manifold feeding meters
export function gasMeters() {
  const g = G();
  add(g, floor(2.4, 1.4), wallP(2.4, 2.1));
  add(g, pipe([-1.1, 0.5, -0.32], [1.1, 0.5, -0.32], 0.045));
  [-0.75, -0.25, 0.25, 0.75].forEach((x, i) => {
    add(g, pipe([x, 0.5, -0.32], [x, 0.85, -0.32], 0.025), box(0.3, 0.32, 0.16, 'paper', x, 1.02, -0.3));
    const dial = text([`0${3 + i}${7 - i}4.${i}`], { w: 256, h: 96, bg: '#121412', fg: COLORS.green, font: `600 40px ${MONO}` }); add(g, plate(dial, 0.2, 0.075, x, 1.06, -0.218));
    add(g, pipe([x, 1.18, -0.32], [x, 1.95, -0.32], 0.02, 'mid'), cyl(0.04, 0.04, 0.05, 'ink', 6, x, 0.68, -0.28));
  });
  add(g, box(0.2, 0.2, 0.15, 'ink', -1.0, 0.5, -0.3), gauge(0.07, -1.0, 0.72, -0.22));
  add(g, flow([[-1.1, 0.5, -0.32], [1.1, 0.5, -0.32]], { r: 0.04, speed: 0.35, n: 3 }));
  g.userData.tick = ticks(g);
  return g;
}

// ---------------------------------------------------------------- gas leak detection + auto shut-off
export function gasDetector() {
  const g = G();
  add(g, floor(2.2, 1.4), wallP(2.2, 2.0));
  add(g, box(0.3, 0.42, 0.12, 'paper', -0.5, 1.4, -0.33));
  const scr = text(['LEL 0%'], { w: 256, h: 96, bg: '#121412', fg: COLORS.green, font: `600 46px ${MONO}` }), alarm = text(['LEL 22%'], { w: 256, h: 96, bg: COLORS.green, fg: '#ffffff', font: `700 46px ${MONO}` });
  const p = plate(scr, 0.22, 0.08, -0.5, 1.48, -0.268); add(g, p);
  const l = led(-0.5, 1.3, -0.265, 0.025); add(g, l);
  add(g, pipe([-1.1, 0.4, -0.3], [1.1, 0.4, -0.3], 0.04));
  const valve = G(); add(valve, sph(0.1, 'green'), box(0.12, 0.16, 0.12, 'ink', 0, 0.16, 0)); const lever = box(0.26, 0.03, 0.04, 'paper', 0.12, 0.26, 0); add(valve, lever); at(valve, 0.4, 0.4, -0.3); add(g, valve);
  add(g, tube([[-0.5, 1.18, -0.33], [-0.2, 0.9, -0.33], [0.4, 0.66, -0.33]], 0.01, 'ink'));
  const cloud = puffs(10, { from: V(0.6, 0.45, -0.1), to: V(-0.4, 1.4, -0.1), spread: 0.25, size: 0.09, speed: 0.15, m: 'glass' }); add(g, cloud);
  const ring = pulses(2, 0.18, -0.5, 1.4, -0.26, { axis: 'z', speed: 0.8 }); ring.children.forEach((r) => (r.rotation.x = 0)); add(g, ring);
  const tk = ticks(g);
  g.userData.tick = (t, dt) => { tk(t, dt); const a = (t * 0.2) % 1 > 0.55; p.material.map = a ? alarm : scr; ring.visible = a; l.visible = a ? Math.sin(t * 10) > 0 : true; lever.rotation.y = a ? -1.4 : 0; };
  return g;
}

// ---------------------------------------------------------------- gas maintenance: leak test bubbles
export function gasService() {
  const g = G();
  add(g, floor(2.2, 1.6));
  const b = lpgBottle(); at(b, -0.35, 0, 0); add(g, b);
  add(g, box(0.12, 0.08, 0.1, 'ink', -0.35, 1.12, 0), tube([[-0.29, 1.12, 0], [0.0, 1.2, 0.1], [0.35, 0.6, 0.2], [0.55, 0.08, 0.25]], 0.018, 'ink'));
  const spannerG = G(); add(spannerG, box(0.5, 0.04, 0.07, 'paper', 0, 0, 0), torus(0.06, 0.02, 'paper', 0.27, 0, 0, 8, 24, Math.PI * 1.5)); spannerG.children[1].rotation.x = Math.PI / 2; at(spannerG, 0.55, 0.06, -0.35); spannerG.rotation.y = 0.7; add(g, spannerG);
  const bottle = G(); add(bottle, cyl(0.07, 0.08, 0.3, 'green', 24, 0, 0.15, 0), box(0.06, 0.08, 0.1, 'ink', 0, 0.34, 0.03)); at(bottle, 0.6, 0.04, 0.35); add(g, bottle);
  const bub = G(); const bs = [...Array(10)].map((_, i) => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.018 + (i % 3) * 0.008, 12, 8), mat('glass', { opacity: 0.6 })); s.userData.o = i / 10; s.userData.noInk = true; bub.add(s); return s; }); add(g, bub);
  add(g, gauge(0.06, -0.2, 1.12, 0.06));
  g.userData.tick = (t) => bs.forEach((s, i) => { const k = (t * 0.4 + s.userData.o) % 1; s.position.set(-0.35 + Math.sin(i * 3) * 0.05, 1.12 + k * 0.4, 0.06 + Math.cos(i * 3) * 0.04); s.scale.setScalar(0.5 + k); });
  return g;
}

// ---------------------------------------------------------------- caulking gun laying a fire-rated bead
export function caulkGun() {
  const g = G();
  add(g, box(1.0, 0.5, 1.4, 'mid', -0.53, 0.25, 0), box(1.0, 0.5, 1.4, 'mid', 0.53, 0.25, 0));
  const bead = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1, 16), mat('green')); bead.rotation.x = Math.PI / 2; add(g, bead);
  const gun = G();
  add(gun, rotX(cyl(0.07, 0.07, 0.55, 'paper', 24), Math.PI / 2), rotX(new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.22, 16), mat('ink')), Math.PI / 2 + Math.PI));
  gun.children[1].position.z = -0.38;
  add(gun, box(0.04, 0.2, 0.06, 'ink', 0, -0.13, 0.22), box(0.04, 0.16, 0.04, 'ink', 0, -0.12, 0.12), rotX(cyl(0.012, 0.012, 0.35, 'mid', 8, 0, 0, 0.45), Math.PI / 2), box(0.06, 0.06, 0.02, 'ink', 0, 0, 0.62));
  gun.rotation.x = 0.7; add(g, gun);
  g.userData.tick = (t) => {
    const k = (t * 0.18) % 1;
    const z = 0.65 - k * 1.3;
    gun.position.set(0, 0.62, z - 0.25);
    bead.scale.y = Math.max(0.001, k * 1.3); bead.position.set(0, 0.5, 0.65 - (k * 1.3) / 2);
  };
  return g;
}

// ---------------------------------------------------------------- staircase pressurisation
export function stairPressure() {
  const g = G();
  add(g, floor(2.2, 1.6));
  for (let i = 0; i < 7; i++) add(g, box(0.7, 0.14, 0.24, 'paper', -0.3, 0.07 + i * 0.14, 0.5 - i * 0.2));
  add(g, box(0.75, 0.06, 0.5, 'mid', -0.3, 1.0, -0.95 + 0.4));
  for (let i = 0; i < 6; i++) add(g, box(0.7, 0.14, 0.24, 'paper', 0.42, 1.07 + i * 0.14, -0.55 + i * 0.2));
  const shaft = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.6, 2.3, 1.7)), new THREE.LineDashedMaterial({ color: COLORS.ink, dashSize: 0.06, gapSize: 0.05 })); shaft.computeLineDistances(); at(shaft, 0.05, 1.15, 0); add(g, shaft);
  const fan = G(); add(fan, box(0.6, 0.35, 0.6, 'green', 0, 0, 0)); const rot = G(); for (let i = 0; i < 5; i++) { const b = box(0.24, 0.02, 0.08, 'paper', 0.12, 0, 0); const p = G(); p.add(b); p.rotation.y = (i / 5) * Math.PI * 2; rot.add(p); } at(rot, 0, 0.19, 0); add(fan, rot);
  at(fan, 0.05, 2.45, 0); add(g, fan);
  const arrows = G(); for (let i = 0; i < 6; i++) { const a = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 12), glow()); a.rotation.x = Math.PI; a.userData.o = i / 6; a.userData.noInk = true; arrows.add(a); } add(g, arrows);
  g.userData.tick = (t, dt) => { rot.rotation.y += dt * 6; arrows.children.forEach((a, i) => { const k = (t * 0.35 + a.userData.o) % 1; a.position.set(-0.55 + (i % 3) * 0.55, 2.2 - k * 2.0, -0.4 + (i % 2) * 0.7); a.material.opacity = Math.sin(k * Math.PI); }); };
  return g;
}

// ---------------------------------------------------------------- kitchen ventilation
export function kitchenVent() {
  const g = G();
  add(g, floor(2.2, 1.6), wallP(2.2, 2.3), box(1.6, 0.85, 0.65, 'paper', -0.1, 0.42, -0.05), box(1.6, 0.04, 0.66, 'ink', -0.1, 0.86, -0.05));
  const hood = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 1.0, 0.45, 4, 1, true), mat('paper', { side: THREE.DoubleSide })); hood.rotation.y = Math.PI / 4; hood.scale.z = 0.55; at(hood, -0.1, 1.75, -0.1); add(g, hood);
  add(g, box(0.4, 0.6, 0.35, 'mid', -0.1, 2.25, -0.2), box(0.8, 0.35, 0.35, 'mid', 0.4, 2.45, -0.2));
  const inl = G(); add(inl, rotZ(cyl(0.22, 0.22, 0.3, 'green', 32), Math.PI / 2)); const blades = G(); for (let i = 0; i < 5; i++) { const b = box(0.02, 0.16, 0.06, 'paper', 0, 0.08, 0); const p = G(); p.add(b); p.rotation.x = (i / 5) * Math.PI * 2; blades.add(p); } add(inl, blades); at(inl, 0.95, 2.45, -0.2); add(g, inl);
  [-0.55, -0.1, 0.35].forEach((x, i) => add(g, cyl(0.15, 0.13, 0.16, i % 2 ? 'ink' : 'paper', 32, x, 0.96, -0.05)));
  add(g, puffs(10, { from: V(-0.1, 1.0, -0.05), to: V(-0.1, 2.0, -0.15), spread: 0.35, size: 0.08, speed: 0.25, m: 'paper' }));
  const tk = ticks(g);
  g.userData.tick = (t, dt) => { tk(t, dt); blades.rotation.x += dt * 9; };
  return g;
}

// ---------------------------------------------------------------- ELV hub: one panel, many systems
export function elvHub() {
  const g = G();
  add(g, floor(2.4, 1.4), wallP(2.4, 2.1));
  add(g, box(0.5, 0.7, 0.14, 'ink', 0, 1.05, -0.33));
  for (let i = 0; i < 6; i++) add(g, led(-0.18 + i * 0.07, 1.3, -0.255, 0.015));
  const ends = [[-0.95, 1.75], [-0.95, 0.5], [0.95, 1.75], [0.95, 0.55], [0, 1.9], [-0.55, 1.95]];
  const icons = ['cam', 'spk', 'rdr', 'wifi', 'cam', 'det'];
  ends.forEach(([x, y], i) => {
    const pts = [[0, 1.05, -0.32], [x * 0.5, (1.05 + y) / 2 + 0.1, -0.33], [x, y, -0.33]];
    add(g, tube(pts, 0.012, i % 2 ? 'green' : 'ink', 40), flow(pts, { r: 0.022, speed: 0.4 + i * 0.05, n: 1 }));
    const d = G(); at(d, x, y, -0.3);
    if (icons[i] === 'cam') add(d, box(0.14, 0.1, 0.22, 'paper', 0, 0, 0.08), led(0, 0, 0.2, 0.025));
    else if (icons[i] === 'spk') add(d, rotX(cyl(0.1, 0.1, 0.04, 'paper', 24), Math.PI / 2), rotX(torus(0.05, 0.008, 'ink', 0, 0, 0.025, 6, 24), 0));
    else if (icons[i] === 'rdr') add(d, box(0.1, 0.16, 0.04, 'paper', 0, 0, 0.02), led(0, 0.05, 0.045, 0.012));
    else if (icons[i] === 'wifi') { for (let k = 1; k <= 3; k++) { const a = new THREE.Mesh(new THREE.TorusGeometry(0.04 * k, 0.008, 6, 24, Math.PI / 2), mat('green')); a.rotation.z = Math.PI / 4; a.position.z = 0.02; add(d, a); } }
    else add(d, rotX(cyl(0.08, 0.08, 0.04, 'paper', 24), Math.PI / 2));
    add(g, d);
  });
  g.userData.tick = ticks(g);
  return g;
}

// ---------------------------------------------------------------- multi-camera CCTV with a monitor wall
export function cctvMulti() {
  const g = G();
  add(g, floor(2.4, 1.6), wallP(2.4, 2.2), box(2.4, 0.05, 1.4, 'mid', 0, 2.2, 0.25));
  const domes = [[-0.7, 0.4], [0.7, 0.55]].map(([x, z]) => { const d = G(); add(d, cyl(0.15, 0.15, 0.05, 'paper', 32, 0, 0, 0)); const s = sph(0.12, 'inkflat', 0, -0.02, 0, true); s.rotation.x = Math.PI; add(d, s); at(d, x, 2.15, z); add(g, d); return d; });
  const feed = canvasTex(512, 320, (c, w, h) => { c.fillStyle = '#0e100e'; c.fillRect(0, 0, w, h); c.strokeStyle = '#2b2f2b'; c.lineWidth = 4; c.strokeRect(2, 2, w - 4, h - 4); c.beginPath(); c.moveTo(w / 2, 0); c.lineTo(w / 2, h); c.moveTo(0, h / 2); c.lineTo(w, h / 2); c.stroke(); c.fillStyle = COLORS.green; c.font = `600 18px ${MONO}`; ['CAM 01', 'CAM 02', 'CAM 03', 'CAM 04'].forEach((t, i) => c.fillText(t, 14 + (i % 2) * w / 2, 26 + Math.floor(i / 2) * h / 2)); c.fillStyle = '#3a3f3a'; [[60, 90, 80, 50], [330, 70, 60, 80], [90, 230, 120, 40], [310, 220, 90, 60]].forEach(([x, y, ww, hh]) => c.fillRect(x, y, ww, hh)); c.fillStyle = COLORS.green; c.beginPath(); c.arc(w - 30, 26, 7, 0, 7); c.fill(); });
  add(g, box(1.1, 0.7, 0.05, 'ink', 0, 1.25, -0.36), plate(feed, 1.0, 0.62, 0, 1.25, -0.33), box(0.12, 0.3, 0.06, 'ink', 0, 0.75, -0.37));
  const nvr = G(); add(nvr, box(0.6, 0.1, 0.4, 'paper', 0, 0.05, 0)); for (let i = 0; i < 4; i++) add(nvr, led(-0.2 + i * 0.06, 0.06, 0.205, 0.012)); at(nvr, 0, 0.62, -0.18); add(g, nvr, box(0.9, 0.6, 0.5, 'mid', 0, 0.3, -0.18));
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.9, 32, 1, true), mat('ghost', { opacity: 0.1 })); cone.userData.noInk = true; at(cone, -0.7, 1.15, 0.4); add(g, cone);
  g.userData.tick = (t) => { domes.forEach((d, i) => (d.rotation.y = Math.sin(t * 0.6 + i) * 0.6)); cone.rotation.z = Math.sin(t * 0.6) * 0.25; };
  return g;
}

// ---------------------------------------------------------------- access control door
export function accessDoor() {
  const g = G();
  add(g, floor(2.4, 1.6), box(0.6, 2.2, 0.2, 'paper', -0.85, 1.1, 0), box(0.6, 2.2, 0.2, 'paper', 0.85, 1.1, 0), box(2.3, 0.2, 0.2, 'paper', 0, 2.1, 0));
  const pivot = G(); at(pivot, -0.53, 0.05, 0.02); add(pivot, box(1.04, 1.95, 0.04, 'glass', 0.52, 0.98, 0), box(1.04, 0.05, 0.05, 'ink', 0.52, 1.96, 0), box(1.04, 0.05, 0.05, 'ink', 0.52, 0.02, 0), box(0.05, 1.95, 0.05, 'ink', 0.02, 0.98, 0), box(0.05, 1.95, 0.05, 'ink', 1.02, 0.98, 0), box(0.04, 0.4, 0.04, 'paper', 0.9, 1.0, 0.04));
  add(g, pivot, box(0.5, 0.08, 0.1, 'ink', 0.25, 1.95, 0.1));
  add(g, box(0.12, 0.18, 0.04, 'ink', 0.75, 1.15, 0.12));
  const ledR = led(0.75, 1.21, 0.145, 0.016); add(g, ledR);
  const card = G(); add(card, box(0.14, 0.09, 0.01, 'green', 0, 0, 0), box(0.06, 0.02, 0.012, 'paper', -0.02, 0.02, 0)); add(g, card);
  const scan = pulses(2, 0.09, 0.75, 1.13, 0.15, { axis: 'z', speed: 1 }); scan.children.forEach((r) => (r.rotation.x = 0)); add(g, scan);
  const tk = ticks(g);
  g.userData.tick = (t, dt) => {
    tk(t, dt);
    const k = (t * 0.25) % 1;
    card.position.set(0.75 + Math.max(0, 0.4 - k) * 1.0, 1.13, 0.2 + Math.max(0, 0.4 - k) * 0.6);
    const ok = k > 0.4 && k < 0.85; scan.visible = k > 0.35 && k < 0.5;
    ledR.material = ok ? mat('glow') : mat('inkflat');
    pivot.rotation.y = ok ? -Math.sin(((k - 0.4) / 0.45) * Math.PI) * 0.9 : 0;
  };
  return g;
}

// ---------------------------------------------------------------- biometric time attendance
export function biometric() {
  const g = G();
  add(g, floor(2, 1.4), cyl(0.05, 0.07, 1.1, 'ink', 16, 0, 0.55, 0), cyl(0.2, 0.24, 0.05, 'ink', 32, 0, 0.03, 0));
  const term = G(); add(term, box(0.42, 0.6, 0.1, 'paper', 0, 0, 0));
  const clock = text(['08:59', 'CHECK-IN'], { w: 256, h: 192, bg: '#121412', fg: COLORS.green, font: `600 46px ${MONO}` }); add(term, plate(clock, 0.32, 0.24, 0, 0.12, 0.052));
  const pad = rotX(cyl(0.07, 0.07, 0.02, 'ink', 32, 0, -0.17, 0.05), Math.PI / 2); add(term, pad);
  const fp = canvasTex(128, 128, (c) => { c.clearRect(0, 0, 128, 128); c.strokeStyle = COLORS.green; c.lineWidth = 4; for (let r = 10; r < 56; r += 9) { c.beginPath(); c.ellipse(64, 70, r * 0.8, r, 0, Math.PI * 1.05, Math.PI * 2.0); c.stroke(); } });
  const fpp = plate(fp, 0.11, 0.11, 0, -0.17, 0.062); add(term, fpp);
  const scanline = box(0.13, 0.006, 0.006, 'glow', 0, -0.17, 0.066); scanline.userData.noInk = true; add(term, scanline);
  at(term, 0, 1.38, 0); term.rotation.x = -0.1; add(g, term);
  g.userData.tick = (t) => { scanline.position.y = -0.17 + Math.sin(t * 3) * 0.05; fpp.material.opacity = 0.4 + Math.abs(Math.sin(t * 1.5)) * 0.6; };
  return g;
}

// ---------------------------------------------------------------- burglar alarm
export function burglar() {
  const g = G();
  add(g, floor(2.2, 1.6), wallP(2.2, 2.2), box(0.06, 2.2, 1.6, 'mid', -1.07, 1.1, 0.35));
  const kp = G(); add(kp, box(0.3, 0.4, 0.06, 'paper', 0, 0, 0)); for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) add(kp, box(0.06, 0.045, 0.02, 'ink', -0.08 + c * 0.08, -0.06 - r * 0.055 + 0.08, 0.035));
  add(kp, plate(text(['ARMED'], { w: 256, h: 64, bg: '#121412', fg: COLORS.green, font: `600 34px ${MONO}` }), 0.2, 0.05, 0, 0.14, 0.032)); at(kp, 0.2, 1.25, -0.36); add(g, kp);
  const pir = G(); add(pir, box(0.14, 0.18, 0.1, 'paper', 0, 0, 0), sph(0.05, 'mid', 0, -0.02, 0.05)); at(pir, -0.95, 2.0, -0.32); pir.rotation.y = 0.7; add(g, pir);
  const fan = G(); for (let i = 0; i < 5; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.6, 4, 1, true), mat('ghost', { opacity: 0.08 })); c.userData.noInk = true; c.rotation.x = -Math.PI / 2 - 0.5; c.position.z = 0.8; const p = G(); p.add(c); p.rotation.y = -0.6 + i * 0.3; fan.add(p); } at(fan, -0.95, 1.95, -0.3); fan.rotation.y = 0.7; add(g, fan);
  const siren = G(); add(siren, box(0.4, 0.5, 0.12, 'green', 0, 0, 0)); const strobe = sph(0.07, 'glow', 0, 0.12, 0.08); strobe.userData.noInk = true; add(siren, strobe); at(siren, 0.75, 1.75, -0.35); add(g, siren);
  g.userData.tick = (t) => { strobe.scale.setScalar(Math.sin(t * 7) > 0.3 ? 1.5 : 0.7); fan.children.forEach((p, i) => p.children[0].material.opacity = 0.05 + Math.max(0, Math.sin(t * 2 - i)) * 0.12); };
  return g;
}

// ---------------------------------------------------------------- video intercom
export function intercom() {
  const g = G();
  add(g, floor(2.4, 1.6), box(0.3, 1.6, 0.3, 'paper', -0.7, 0.8, 0.1));
  const out = G(); add(out, box(0.22, 0.4, 0.05, 'ink', 0, 0, 0), rotX(cyl(0.035, 0.035, 0.02, 'mid', 20, 0, 0.12, 0.03), Math.PI / 2), led(0, 0.12, 0.045, 0.015), rotX(cyl(0.04, 0.04, 0.02, 'green', 20, 0, -0.1, 0.03), Math.PI / 2));
  for (let i = 0; i < 4; i++) add(out, box(0.1, 0.008, 0.01, 'mid', 0, 0.03 - i * 0.02, 0.03));
  at(out, -0.7, 1.25, 0.27); add(g, out);
  add(g, wallP(1.2, 2.0, -0.4, 0.55));
  const face = canvasTex(320, 240, (c, w, h) => { c.fillStyle = '#121412'; c.fillRect(0, 0, w, h); c.fillStyle = '#3a3f3a'; c.beginPath(); c.arc(w / 2, 100, 46, 0, 7); c.fill(); c.beginPath(); c.ellipse(w / 2, 230, 95, 70, 0, Math.PI, 0); c.fill(); c.fillStyle = COLORS.green; c.font = `600 18px ${MONO}`; c.fillText('FRONT GATE', 14, 26); });
  add(g, box(0.5, 0.4, 0.05, 'paper', 0.55, 1.3, -0.35), plate(face, 0.4, 0.3, 0.55, 1.32, -0.322));
  for (let i = 0; i < 3; i++) add(g, box(0.06, 0.03, 0.01, i === 0 ? 'green' : 'ink', 0.43 + i * 0.12, 1.14, -0.322));
  add(g, pulses(2, 0.1, -0.7, 1.15, 0.31, { axis: 'z', speed: 0.6 }));
  g.children.at(-1).children.forEach((r) => (r.rotation.x = 0));
  g.userData.tick = ticks(g);
  return g;
}

// ---------------------------------------------------------------- ANPR camera reading a plate
export function anpr() {
  const g = G();
  add(g, box(2.8, 0.04, 1.8, 'mid', 0, 0.02, 0));
  for (let i = 0; i < 5; i++) add(g, box(0.3, 0.005, 0.06, 'paper', -1.2 + i * 0.6, 0.045, 0));
  add(g, cyl(0.04, 0.05, 1.8, 'ink', 12, 1.15, 0.9, -0.7), pipe([1.15, 1.75, -0.7], [0.85, 1.75, -0.7], 0.025, 'ink'));
  const cam = G(); add(cam, box(0.18, 0.16, 0.42, 'paper', 0, 0, 0), box(0.22, 0.03, 0.48, 'mid', 0, 0.1, 0), led(0, 0, 0.22, 0.04)); at(cam, 0.85, 1.65, -0.6); cam.rotation.set(0.35, -0.9, 0); add(g, cam);
  const car = G();
  const body = box(0.9, 0.28, 0.48, 'paper', 0, 0.26, 0); add(car, body, box(0.5, 0.22, 0.44, 'green', -0.05, 0.5, 0));
  [[-0.3, 0.24], [0.3, 0.24], [-0.3, -0.24], [0.3, -0.24]].forEach(([x, z]) => add(car, rotX(cyl(0.1, 0.1, 0.06, 'ink', 24, x, 0.11, z), Math.PI / 2)));
  const pl = text(['AD 12 345'], { w: 512, h: 128, bg: '#ffffff', fg: COLORS.ink, font: `700 72px ${MONO}` }); const plt = plate(pl, 0.26, 0.065, 0.455, 0.24, 0); plt.rotation.y = Math.PI / 2; add(car, plt);
  add(g, car);
  const beamC = new THREE.Mesh(new THREE.ConeGeometry(0.25, 1.6, 4, 1, true), mat('ghost', { opacity: 0.14 })); beamC.userData.noInk = true; add(g, beamC);
  const tag = plate(text(['✓ AD 12345'], { w: 512, h: 112, bg: COLORS.green, fg: '#ffffff', font: `700 56px ${MONO}` }), 0.5, 0.11, 0.6, 2.05, -0.6); add(g, tag);
  g.userData.tick = (t) => {
    const k = (t * 0.15) % 1; car.position.set(-1.6 + k * 2.6, 0, 0.15);
    const read = car.position.x > -0.2 && car.position.x < 0.6;
    const tgt = car.position.clone().add(V(0.45, 0.24, 0)), src = V(0.85, 1.6, -0.55);
    beamC.position.copy(src).lerp(tgt, 0.5); beamC.lookAt(tgt); beamC.rotateX(Math.PI / 2); beamC.scale.set(1, src.distanceTo(tgt) / 1.6, 1);
    beamC.material.opacity = read ? 0.22 : 0.06; tag.material.opacity = read ? 1 : 0;
  };
  return g;
}

// ---------------------------------------------------------------- structured cabling patch panel
export function patchPanel() {
  const g = G();
  add(g, floor(2.4, 1.4), box(1.6, 1.4, 0.08, 'ink', 0, 1.05, -0.35));
  for (let r = 0; r < 3; r++) { add(g, box(1.4, 0.16, 0.04, 'paper', 0, 1.45 - r * 0.38, -0.29)); for (let c = 0; c < 16; c++) add(g, box(0.05, 0.05, 0.01, 'ink', -0.6 + c * 0.08, 1.45 - r * 0.38, -0.265)); }
  const cols = ['green', 'paper', 'ink', 'green', 'mid', 'green', 'paper', 'ink'];
  for (let i = 0; i < 16; i++) {
    const x = -0.6 + i * 0.08, r = i % 3, y = 1.45 - r * 0.38;
    add(g, tube([[x, y, -0.26], [x, y - 0.04, -0.05], [x * 0.6 + (i % 2 ? 0.1 : -0.1), y - 0.25, 0.05], [x * 0.3, 0.6 - (i % 4) * 0.08, 0.0], [x * 0.2, 0.05, -0.1]], 0.012, cols[i % cols.length], 40));
  }
  for (let c = 0; c < 4; c++) add(g, box(0.06, 0.03, 0.03, 'green', -0.3 + c * 0.2, 0.2, 0.0));
  g.userData.tick = () => {};
  return g;
}

// ---------------------------------------------------------------- IT desk: laptop, server, Wi-Fi
export function itDesk() {
  const g = G();
  add(g, floor(2.4, 1.6), box(1.6, 0.05, 0.8, 'paper', 0, 0.75, 0), box(0.05, 0.73, 0.05, 'ink', -0.75, 0.37, 0.35), box(0.05, 0.73, 0.05, 'ink', 0.75, 0.37, 0.35), box(0.05, 0.73, 0.05, 'ink', -0.75, 0.37, -0.35), box(0.05, 0.73, 0.05, 'ink', 0.75, 0.37, -0.35));
  const dash = canvasTex(512, 320, (c, w, h) => { c.fillStyle = '#121412'; c.fillRect(0, 0, w, h); c.fillStyle = COLORS.green; c.font = `600 22px ${MONO}`; c.fillText('NETWORK · OK', 20, 34); for (let i = 0; i < 12; i++) c.fillRect(30 + i * 38, h - 40 - (20 + ((i * 37) % 150)), 24, 20 + ((i * 37) % 150)); });
  const lap = G(); add(lap, box(0.6, 0.025, 0.4, 'ink', 0, 0, 0)); const scr = G(); add(scr, box(0.6, 0.38, 0.02, 'ink', 0, 0.19, 0), plate(dash, 0.55, 0.34, 0, 0.19, 0.012)); scr.position.z = -0.2; scr.rotation.x = -0.25; add(lap, scr); at(lap, -0.25, 0.79, 0.05); add(g, lap);
  const srv = G(); add(srv, box(0.28, 0.6, 0.5, 'paper', 0, 0.3, 0)); for (let i = 0; i < 5; i++) add(srv, box(0.22, 0.02, 0.01, 'ink', 0, 0.45 - i * 0.07, 0.255)); add(srv, led(0.08, 0.53, 0.26, 0.015)); at(srv, 0.55, 0.78, -0.05); add(g, srv);
  const rt = G(); add(rt, box(0.3, 0.06, 0.2, 'ink', 0, 0, 0)); [-0.1, 0.1].forEach((x) => add(rt, rotZ(cyl(0.01, 0.01, 0.28, 'ink', 8, x, 0.14, -0.08), x * 1.5))); at(rt, 0.15, 0.81, 0.3); add(g, rt);
  const wifi = G(); for (let i = 0; i < 3; i++) { const a = new THREE.Mesh(new THREE.TorusGeometry(0.15 + i * 0.12, 0.012, 6, 32, Math.PI / 2), glow()); a.rotation.z = Math.PI / 4; a.userData.noInk = true; wifi.add(a); } at(wifi, 0.15, 1.05, 0.3); add(g, wifi);
  g.userData.tick = (t) => wifi.children.forEach((a, i) => (a.material.opacity = Math.max(0.1, Math.sin(t * 3 - i * 0.8))));
  return g;
}

// ---------------------------------------------------------------- fire + security on one ceiling tile
export function fireSecurity() {
  const g = G();
  add(g, floor(2.2, 1.6), box(2.2, 0.06, 1.6, 'paper', 0, 2.1, 0));
  const det = G(); add(det, cyl(0.24, 0.24, 0.05, 'paper', 40, 0, 0, 0)); const dm = sph(0.18, 'paper', 0, -0.02, 0, true, 40, 12); dm.rotation.x = Math.PI; dm.scale.y = 0.45; add(det, dm, led(0.13, -0.05, 0.1)); at(det, -0.5, 2.05, 0); add(g, det);
  const cam = G(); add(cam, cyl(0.22, 0.22, 0.05, 'paper', 40, 0, 0, 0)); const cd = sph(0.17, 'inkflat', 0, -0.02, 0, true); cd.rotation.x = Math.PI; add(cam, cd); at(cam, 0.5, 2.05, 0.1); add(g, cam);
  add(g, pulses(3, 0.25, -0.5, 1.95, 0, { speed: 0.4, lift: -0.5 }));
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.9, 32, 1, true), mat('ghost', { opacity: 0.1 })); cone.userData.noInk = true; at(cone, 0.5, 1.05, 0.1); add(g, cone);
  add(g, box(0.9, 0.04, 0.6, 'mid', 0, 0.45, 0.2), box(0.06, 0.43, 0.06, 'ink', -0.4, 0.22, 0.45), box(0.06, 0.43, 0.06, 'ink', 0.4, 0.22, 0.45));
  const tk = ticks(g);
  g.userData.tick = (t, dt) => { tk(t, dt); cam.rotation.y = Math.sin(t * 0.5) * 0.8; };
  return g;
}

// ---------------------------------------------------------------- company HQ with a FIRESTONE sign
export function hq() {
  const g = G();
  add(g, box(2.4, 0.05, 1.8, 'mid', 0, 0.025, 0));
  let y = 0.05;
  for (let i = 0; i < 5; i++) { add(g, box(1.3, 0.2, 0.8, 'paper', 0, y + 0.1, -0.15), box(1.24, 0.07, 0.01, 'ink', 0, y + 0.1, 0.252), box(1.34, 0.02, 0.84, 'mid', 0, y + 0.21, -0.15)); y += 0.22; }
  const sign = canvasTex(1024, 220, (c, w, h) => { c.clearRect(0, 0, w, h); c.font = `900 150px "Montserrat", ${SANS}`; c.textBaseline = 'middle'; const f = c.measureText('FIRE').width, s = c.measureText('STONE').width; const x = (w - f - s) / 2; c.fillStyle = COLORS.green; c.fillText('FIRE', x, h / 2 + 6); c.fillStyle = COLORS.ink; c.fillText('STONE', x + f, h / 2 + 6); });
  add(g, plate(sign, 1.1, 0.24, 0, y + 0.16, 0.18), box(1.1, 0.02, 0.02, 'ink', 0, y + 0.03, 0.17));
  add(g, box(0.6, 0.03, 0.4, 'green', 0, 0.42, 0.42), cyl(0.015, 0.015, 0.38, 'ink', 8, -0.27, 0.23, 0.6), cyl(0.015, 0.015, 0.38, 'ink', 8, 0.27, 0.23, 0.6));
  add(g, cyl(0.012, 0.012, 1.6, 'ink', 8, 0.95, 0.8, 0.55));
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.24, 12, 4), mat('green', { side: THREE.DoubleSide })); flag.position.set(1.15, 1.48, 0.55); flag.userData.noInk = true; add(g, flag);
  add(g, tree(1, -0.95, 0.55), tree(0.8, -0.75, 0.75), tree(0.9, 0.85, -0.6));
  const pos = flag.geometry.attributes.position; const base = pos.array.slice();
  g.userData.tick = (t) => { for (let i = 0; i < pos.count; i++) { const x = base[i * 3]; pos.array[i * 3 + 2] = Math.sin(x * 12 + t * 4) * 0.03 * (x + 0.2); } pos.needsUpdate = true; };
  return g;
}

// ---------------------------------------------------------------- careers: hard hat, toolbox, gloves
export function hardhat() {
  const g = G();
  add(g, floor(2.2, 1.6));
  const hat = G(); const sh = sph(0.36, 'green', 0, 0, 0, true, 48, 16); sh.scale.y = 0.85; add(hat, sh, cyl(0.47, 0.47, 0.025, 'green', 48, 0, 0.01, 0.06), box(0.08, 0.06, 0.66, 'green', 0, 0.3, 0), cyl(0.37, 0.37, 0.05, 'paper', 48, 0, 0.06, 0));
  const logo = canvasTex(256, 128, (c) => { c.font = `900 70px "Montserrat", ${SANS}`; c.textBaseline = 'middle'; c.fillStyle = '#ffffff'; c.fillText('FS', 90, 66); });
  const lg = plate(logo, 0.22, 0.11, 0, 0.18, 0.31); lg.rotation.x = -0.5; add(hat, lg);
  at(hat, -0.3, 0.06, 0.05); hat.rotation.set(0, 0.5, 0); add(g, hat);
  const tb = G(); add(tb, box(0.7, 0.32, 0.32, 'ink', 0, 0.16, 0), box(0.72, 0.04, 0.34, 'green', 0, 0.34, 0), box(0.36, 0.04, 0.04, 'paper', 0, 0.46, 0), box(0.04, 0.1, 0.04, 'paper', -0.17, 0.4, 0), box(0.04, 0.1, 0.04, 'paper', 0.17, 0.4, 0)); at(tb, 0.55, 0.04, -0.3); tb.rotation.y = -0.4; add(g, tb);
  const glove = (x, z, r) => { const gl = G(); add(gl, sph(0.12, 'paper', 0, 0, 0)); gl.children[0].scale.set(1.2, 0.35, 0.9); for (let i = 0; i < 4; i++) { const f = cyl(0.025, 0.025, 0.14, 'paper', 12, -0.06 + i * 0.04, 0, -0.16); f.rotation.x = Math.PI / 2; add(gl, f); } at(gl, x, 0.08, z); gl.rotation.y = r; return gl; };
  add(g, glove(0.55, 0.45, 0.4), glove(0.75, 0.35, 0.9));
  const badge = G(); add(badge, box(0.18, 0.26, 0.01, 'paper', 0, 0, 0), box(0.18, 0.06, 0.012, 'green', 0, 0.1, 0)); badge.rotation.x = -Math.PI / 2 + 0.05; at(badge, -0.75, 0.05, 0.5); badge.rotation.z = 0.4; add(g, badge);
  g.userData.tick = (t) => { hat.rotation.y = 0.5 + Math.sin(t * 0.6) * 0.25; };
  return g;
}

// ---------------------------------------------------------------- client projects: a different building per project
export function projectBuilding(type = 'tower') {
  const g = G();
  add(g, box(2.4, 0.05, 1.8, 'mid', 0, 0.025, 0));
  const B = (w, h, d, x, z, m = 'paper', y = 0.05) => add(g, box(w, h, d, m, x, y + h / 2, z));
  const bands = (w, h, d, x, z, n, y = 0.05) => { for (let i = 1; i <= n; i++) add(g, box(w * 0.94, 0.03, 0.01, 'ink', x, y + (h / (n + 1)) * i, z + d / 2 + 0.002)); };
  switch (type) {
    case 'airport': {
      B(2.0, 0.3, 0.7, 0, 0); bands(2.0, 0.3, 0.7, 0, 0, 1);
      const roof = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 2.1, 48, 1, true, -0.5, 1.0), mat('green', { side: THREE.DoubleSide })); roof.rotation.z = Math.PI / 2; at(roof, 0, -0.75, 0); add(g, roof);
      add(g, cyl(0.07, 0.09, 1.1, 'paper', 20, 0.85, 0.6, -0.5), cyl(0.2, 0.12, 0.16, 'paper', 8, 0.85, 1.2, -0.5), cyl(0.21, 0.21, 0.08, 'ink', 8, 0.85, 1.32, -0.5));
      const plane = G(); add(plane, box(0.5, 0.06, 0.07, 'paper', 0, 0, 0), box(0.12, 0.02, 0.5, 'paper', 0.02, 0, 0), box(0.06, 0.12, 0.02, 'paper', -0.23, 0.06, 0)); at(plane, -0.6, 1.1, 0.4); plane.rotation.z = 0.15; add(g, plane);
      g.userData.tick = (t) => { plane.position.x = -1 + ((t * 0.12) % 1) * 2; plane.position.y = 0.9 + ((t * 0.12) % 1) * 0.5; };
      break;
    }
    case 'civic': {
      B(1.6, 0.12, 1.0, 0, -0.1, 'mid'); B(1.4, 0.55, 0.8, 0, -0.1, 'paper', 0.17);
      for (let i = 0; i < 8; i++) add(g, cyl(0.035, 0.035, 0.55, 'paper', 16, -0.6 + i * 0.172, 0.445, 0.34));
      B(1.5, 0.08, 0.9, 0, -0.1, 'ink', 0.72); add(g, box(1.1, 0.25, 0.5, 'paper', 0, 0.92, -0.15));
      break;
    }
    case 'factory': {
      B(1.4, 0.5, 0.9, -0.2, 0); for (let i = 0; i < 4; i++) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.0, 0.25, 0.25, 3, 1), mat('green', { flatShading: true })); st.rotation.set(Math.PI / 2, 0, Math.PI / 2); st.scale.set(1, 3.6, 1); at(st, -0.75 + i * 0.36, 0.62, 0); add(g, st); }
      [0.75, 1.0].forEach((x) => add(g, cyl(0.16, 0.16, 1.0, 'paper', 32, x, 0.55, -0.2), sph(0.16, 'paper', x, 1.05, -0.2, true)));
      add(g, cyl(0.05, 0.06, 1.3, 'ink', 12, -0.75, 0.7, -0.35), puffs(6, { from: V(-0.75, 1.4, -0.35), to: V(-0.4, 2.0, -0.35), spread: 0.2, size: 0.07, speed: 0.15, m: 'paper' }));
      g.userData.tick = ticks(g);
      break;
    }
    case 'warehouse': {
      B(1.9, 0.6, 1.1, 0, -0.1); add(g, box(2.0, 0.04, 1.2, 'green', 0, 0.67, -0.1));
      for (let i = 0; i < 4; i++) add(g, box(0.3, 0.38, 0.01, 'ink', -0.65 + i * 0.43, 0.24, 0.452));
      const truck = G(); add(truck, box(0.55, 0.3, 0.26, 'paper', 0, 0.2, 0), box(0.18, 0.22, 0.24, 'green', 0.36, 0.16, 0)); [[-0.15, 0.13], [0.2, 0.13], [-0.15, -0.13], [0.36, -0.13], [0.36, 0.13], [0.2, -0.13]].forEach(([x, z]) => add(truck, rotX(cyl(0.06, 0.06, 0.04, 'ink', 16, x, 0.06, z), Math.PI / 2))); at(truck, 0.3, 0, 0.75); add(g, truck);
      g.userData.tick = (t) => { truck.position.x = -0.3 + Math.sin(t * 0.4) * 0.5; };
      break;
    }
    case 'pavilion': {
      add(g, box(1.5, 0.04, 1.0, 'paper', 0, 0.07, 0)); B(1.1, 0.42, 0.7, 0, 0, 'glass', 0.09);
      for (let i = 0; i < 4; i++) add(g, cyl(0.025, 0.025, 0.5, 'ink', 12, -0.55 + i * 0.366, 0.34, 0.4));
      const roof = box(1.7, 0.05, 1.2, 'green', 0, 0.62, 0); roof.rotation.z = 0.06; add(g, roof);
      add(g, tree(1, -0.95, 0.5), tree(0.8, 0.95, 0.6), tree(0.9, 0.9, -0.6));
      break;
    }
    case 'sheds': {
      [-0.6, 0.15].forEach((x) => { B(0.6, 0.35, 0.9, x, 0); const r = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.92, 24, 1, true, 0, Math.PI), mat('green', { side: THREE.DoubleSide })); r.rotation.x = Math.PI / 2; r.rotation.z = Math.PI / 2; at(r, x, 0.4, 0); r.scale.set(1, 1, 0.5); add(g, r); });
      [0.8, 1.05].forEach((x) => add(g, cyl(0.12, 0.14, 0.9, 'paper', 24, x, 0.5, -0.3), new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.15, 24), mat('ink'))) && g.children.at(-1).position.set(x, 1.02, -0.3));
      break;
    }
    case 'hotel': {
      B(0.7, 1.5, 0.5, -0.2, -0.2); for (let i = 0; i < 9; i++) add(g, box(0.72, 0.02, 0.12, 'mid', -0.2, 0.2 + i * 0.16, 0.1));
      B(1.4, 0.25, 0.9, 0.2, 0, 'paper'); add(g, cyl(0.3, 0.3, 0.02, 'green', 40, 0.6, 0.32, 0.1));
      const pool = box(0.5, 0.01, 0.3, 'glow', 0.75, 0.31, 0.3); pool.userData.noInk = true; add(g, pool, tree(0.8, 1.0, 0.65), tree(0.7, -0.95, 0.6));
      break;
    }
    case 'ambulance': {
      B(1.7, 0.55, 1.0, -0.1, -0.2); for (let i = 0; i < 3; i++) add(g, box(0.4, 0.4, 0.01, 'ink', -0.6 + i * 0.5, 0.25, 0.302));
      const amb = G(); add(amb, box(0.6, 0.34, 0.3, 'paper', 0, 0.23, 0), box(0.2, 0.26, 0.28, 'paper', 0.38, 0.19, 0), box(0.1, 0.04, 0.12, 'glow', 0.1, 0.42, 0), box(0.22, 0.06, 0.302, 'green', 0, 0.25, 0)); [[-0.18, 0.15], [0.32, 0.15], [-0.18, -0.15], [0.32, -0.15]].forEach(([x, z]) => add(amb, rotX(cyl(0.06, 0.06, 0.04, 'ink', 16, x, 0.07, z), Math.PI / 2))); amb.children[2].userData.noInk = true; at(amb, 0.3, 0, 0.6); add(g, amb);
      g.userData.tick = (t) => { amb.children[2].visible = Math.sin(t * 8) > 0; };
      break;
    }
    case 'logistics': {
      B(2.0, 0.5, 0.8, 0, -0.3); add(g, box(2.05, 0.03, 0.85, 'ink', 0, 0.57, -0.3));
      const conv = flow([[-0.9, 0.15, 0.3], [0.9, 0.15, 0.3]], { r: 0.06, speed: 0.25, n: 4 }); add(g, box(1.9, 0.06, 0.2, 'ink', 0, 0.09, 0.3), conv);
      conv.children.forEach((d) => { d.geometry = new THREE.BoxGeometry(0.12, 0.1, 0.12); d.material = mat('green'); });
      g.userData.tick = ticks(g);
      break;
    }
    case 'campus': {
      [[-0.65, 0.5, 0.7], [0.0, 0.75, 0.6], [0.65, 0.45, 0.8]].forEach(([x, h, d]) => { B(0.55, h, d, x, -0.2); bands(0.55, h, d, x, -0.2, 3); });
      const dome = sph(0.25, 'green', 0, 0.8, -0.2, true, 40, 16); add(g, dome, box(1.8, 0.02, 0.4, 'paper', 0, 0.06, 0.55), tree(0.8, -0.6, 0.6), tree(0.8, 0.6, 0.65));
      break;
    }
    case 'court': {
      B(1.6, 0.36, 0.3, 0, -0.55); B(0.3, 0.36, 0.9, -0.65, -0.05); B(0.3, 0.36, 0.9, 0.65, -0.05);
      for (let i = 0; i < 6; i++) add(g, box(0.1, 0.16, 0.01, 'ink', -0.5 + i * 0.2, 0.25, -0.398));
      add(g, box(0.9, 0.01, 0.7, 'glow', 0, 0.06, -0.05)); g.children.at(-1).userData.noInk = true;
      const fount = cyl(0.12, 0.12, 0.08, 'paper', 32, 0, 0.1, -0.05); add(g, fount, tree(0.7, -0.3, 0.1), tree(0.7, 0.3, 0.1));
      break;
    }
    case 'arches': {
      B(1.6, 0.42, 0.7, 0, -0.1);
      for (let i = 0; i < 6; i++) { const a = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.012, 20, 1, false, 0, Math.PI), mat('ink')); a.rotation.set(Math.PI / 2, 0, Math.PI); at(a, -0.65 + i * 0.26, 0.3, 0.252); add(g, a, box(0.18, 0.18, 0.012, 'ink', -0.65 + i * 0.26, 0.2, 0.252)); }
      const d = sph(0.2, 'green', 0, 0.47, -0.1, true, 32, 12); add(g, d, cyl(0.03, 0.04, 0.3, 'paper', 12, 0.65, 0.62, -0.25), tree(0.8, -0.95, 0.55), tree(0.8, 0.95, 0.6));
      break;
    }
    default: {
      B(0.8, 1.2, 0.6, 0, -0.1); bands(0.8, 1.2, 0.6, 0, -0.1, 6);
    }
  }
  return g;
}

// ---------------------------------------------------------------- cluster skyline for the projects page
export function skyline() {
  const g = G();
  add(g, box(2.6, 0.05, 1.8, 'mid', 0, 0.025, 0));
  const spec = [[-0.9, -0.3, 0.32, 0.9], [-0.45, 0.2, 0.36, 0.6], [0, -0.35, 0.4, 1.45], [0.45, 0.15, 0.34, 1.0], [0.9, -0.25, 0.3, 0.7], [-0.15, 0.45, 0.3, 0.4], [0.7, 0.55, 0.26, 0.35]];
  spec.forEach(([x, z, w, h], i) => { add(g, box(w, h, w, i === 2 ? 'paper' : 'paper', x, 0.05 + h / 2, z)); for (let k = 1; k < h / 0.12; k++) add(g, box(w * 0.92, 0.03, 0.01, 'ink', x, 0.05 + k * 0.12, z + w / 2 + 0.002)); if (i === 2) add(g, cyl(0.008, 0.008, 0.3, 'ink', 6, x, 1.65, z), new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.11), mat('green', { side: THREE.DoubleSide }))); });
  g.children.at(-1).position.set(0.09, 1.72, -0.35); g.children.at(-1).userData.noInk = true;
  add(g, tree(0.8, -1.1, 0.7), tree(0.7, 1.1, 0.75), tree(0.6, 0.2, 0.8));
  const ring = pulses(2, 0.35, 0, 1.5, -0.35, { speed: 0.35 }); add(g, ring);
  g.userData.tick = ticks(g);
  return g;
}
