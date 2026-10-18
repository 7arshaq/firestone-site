// Home page scroll journey: a drafting desk by the window -> the shop drawing
// -> the drawing rises into a building -> floors explode to show fire systems
// -> quarterly maintenance visits orbit the finished building.
// Everything that appears fades and eases in; nothing pops.
import { THREE, mat, ink, shadows, rig, renderer, canvasTex, fontsReady, COLORS, outline, fadable } from './fs3d.js';
import { bake } from './bake.js';
import { mergeGeometries } from '/vendor/BufferGeometryUtils.js';
import { extinguisher } from './models.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const range = (p, a, b) => clamp((p - a) / (b - a));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const smooth = (t) => t * t * (3 - 2 * t);
const HAND = '"Patrick Hand", cursive';
const MONO = '"Geist Mono", monospace';
const SANS = '"Geist", sans-serif';

function box(w, h, d, m, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof m === 'string' ? mat(m) : m); o.position.set(x, y, z); return o; }
function cyl(rt, rb, h, m, seg = 24, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), typeof m === 'string' ? mat(m) : m); o.position.set(x, y, z); return o; }
function limb(a, b, r, m) {
  const A = V(...a), B = V(...b);
  const o = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.88, r, A.distanceTo(B), 16), mat(m));
  o.position.copy(A).add(B).multiplyScalar(0.5);
  o.quaternion.setFromUnitVectors(V(0, 1, 0), B.clone().sub(A).normalize());
  return o;
}
// smooth, outlined (cel-shaded) pieces for organic shapes
const S = (m, th = 0.005) => { m.userData.outline = th; m.userData.noInk = true; return m; };
function blob(r, m, [x, y, z] = [0, 0, 0], [sx, sy, sz] = [1, 1, 1], th) { const o = new THREE.Mesh(new THREE.SphereGeometry(r, 40, 28), mat(m)); o.position.set(x, y, z); o.scale.set(sx, sy, sz); return S(o, th); }
function tube(pts, r, m, th) { const c = new THREE.CatmullRomCurve3(pts.map((p) => V(...p)), false, 'centripetal'); return S(new THREE.Mesh(new THREE.TubeGeometry(c, 48, r, 20, false), mat(m)), th); }

// ---------------------------------------------------------------- the Firestone engineer (original cartoon character)
function engineer() {
  const f = new THREE.Group();
  // office chair
  const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.24, 0.07, 40), mat('ink')); seat.position.set(0, 0.45, 0.02); f.add(S(seat));
  const back = blob(0.25, 'ink', [0, 0.88, 0.28], [0.92, 1.12, 0.2]); back.rotation.x = 0.14; f.add(back);
  f.add(tube([[0, 0.46, 0.16], [0, 0.56, 0.27], [0, 0.72, 0.29]], 0.02, 'ink'));
  f.add(S(cyl(0.028, 0.028, 0.36, 'ink', 20, 0, 0.26, 0.02)));
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.3, x = Math.cos(a), z = Math.sin(a);
    f.add(tube([[0, 0.09, 0.02], [x * 0.16, 0.08, 0.02 + z * 0.16], [x * 0.28, 0.06, 0.02 + z * 0.28]], 0.018, 'ink'));
    f.add(blob(0.032, 'ink', [x * 0.28, 0.032, 0.02 + z * 0.28]));
  }
  // legs (trousers) with a knee bend, rounded shoes
  for (const sx of [-1, 1]) {
    f.add(tube([[sx * 0.1, 0.55, 0.0], [sx * 0.115, 0.55, -0.22], [sx * 0.13, 0.52, -0.42], [sx * 0.135, 0.3, -0.465], [sx * 0.135, 0.11, -0.47]], 0.072, 'mid', 0.006));
    f.add(blob(0.072, 'mid', [sx * 0.13, 0.52, -0.42]));
    const shoe = blob(0.07, 'ink', [sx * 0.135, 0.05, -0.53], [0.8, 0.55, 1.45]); f.add(shoe);
  }
  f.add(blob(0.2, 'mid', [0, 0.57, -0.02], [1, 0.62, 0.86]));
  // torso: a Firestone-green safety vest over a white shirt, leaning to the desk
  const torso = new THREE.Group(); torso.position.set(0, 0.56, 0); torso.rotation.x = -0.32;
  const prof = [[0.0, 0.0], [0.17, 0.0], [0.19, 0.07], [0.205, 0.2], [0.21, 0.32], [0.195, 0.42], [0.14, 0.5], [0.07, 0.535], [0, 0.54]];
  const body = new THREE.Mesh(new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 48), mat('green'));
  body.scale.z = 0.74; torso.add(S(body, 0.006));
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.212, 0.212, 0.035, 48, 1, true), mat('paper', { side: THREE.DoubleSide })); band.position.y = 0.2; band.scale.z = 0.75; band.userData.noInk = true; torso.add(band);
  const band2 = band.clone(); band2.position.y = 0.3; torso.add(band2);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.022, 16, 40), mat('paper')); collar.rotation.x = Math.PI / 2; collar.position.y = 0.515; collar.scale.y = 0.8; torso.add(S(collar));
  f.add(torso);
  // shoulders + arms (pivot at the shoulder so the drawing hand can move)
  const shoulder = (sx) => V(sx * 0.2, 0.955, -0.13);
  const arm = (sx, pts) => {
    const g = new THREE.Group(); g.position.copy(shoulder(sx));
    g.add(blob(0.07, 'green', [0, 0, 0]));
    g.add(tube(pts, 0.048, 'paper', 0.005));
    const el = pts[2]; g.add(S(new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.016, 12, 28), mat('paper'))));
    g.children[2].position.set(...el); g.children[2].rotation.set(0.8, 0.2 * sx, 0);
    const wr = pts[pts.length - 1];
    g.add(blob(0.044, 'paper', wr, [1, 0.75, 1.25]));
    g.add(blob(0.017, 'paper', [wr[0] + sx * -0.03, wr[1] + 0.01, wr[2] + 0.01]));
    f.add(g); return g;
  };
  const armR = arm(1, [[0, 0, 0], [0.06, -0.08, -0.12], [0.09, -0.15, -0.24], [0.04, -0.16, -0.37], [-0.05, -0.145, -0.5]]);
  armR.add(limb([-0.05, -0.125, -0.52], [-0.085, -0.19, -0.56], 0.007, 'ink'));
  const armL = arm(-1, [[0, 0, 0], [-0.07, -0.08, -0.1], [-0.11, -0.12, -0.2], [-0.06, -0.15, -0.33], [0.0, -0.155, -0.45]]);
  // neck + head
  f.add(S(cyl(0.045, 0.05, 0.12, 'paper', 24, 0, 1.1, -0.18)));
  const head = new THREE.Group(); head.position.set(0, 1.235, -0.225); head.rotation.x = 0.32;
  head.add(blob(0.118, 'paper', [0, 0, 0], [0.94, 1.04, 1.0], 0.0055));
  head.add(blob(0.075, 'paper', [0, -0.065, -0.035], [0.95, 0.75, 0.9], 0.004));
  head.add(blob(0.019, 'paper', [0, -0.012, -0.118], [0.75, 1, 1.25], 0.003));
  head.add(blob(0.028, 'paper', [0.112, -0.005, 0.005], [0.45, 1, 0.8], 0.003), blob(0.028, 'paper', [-0.112, -0.005, 0.005], [0.45, 1, 0.8], 0.003));
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.126, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.56), mat('ink')); hair.rotation.x = 0.55; hair.position.set(0, 0.012, 0.012); head.add(S(hair, 0.004));
  const fringe = blob(0.06, 'ink', [0.025, 0.085, -0.07], [1.55, 0.55, 0.95], 0.003); fringe.rotation.z = -0.25; head.add(fringe);
  for (const sx of [-1, 1]) {
    const lens = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.0045, 10, 32), mat('ink')); lens.position.set(sx * 0.045, 0.008, -0.113); lens.userData.noInk = true; head.add(lens);
    head.add(Object.assign(limb([sx * 0.07, 0.01, -0.105], [sx * 0.112, 0.01, -0.01], 0.0035, 'ink'), { userData: { noInk: true } }));
  }
  head.add(Object.assign(limb([-0.02, 0.01, -0.118], [0.02, 0.01, -0.118], 0.004, 'ink'), { userData: { noInk: true } }));
  f.add(head);
  head.userData.keep = armR.userData.keep = armL.userData.keep = true; // animated parts stay live
  f.traverse((o) => { if (o.isMesh) o.userData.noInk = true; });
  f.userData.tick = (t) => {
    armR.rotation.y = Math.sin(t * 2.3) * 0.045; armR.rotation.x = Math.sin(t * 3.7) * 0.025;
    head.rotation.y = Math.sin(t * 0.55) * 0.07; head.rotation.x = 0.32 + Math.sin(t * 0.8) * 0.02;
  };
  return f;
}

// ---------------------------------------------------------------- shop drawing (baked: redlines reveal with progress)
// The sheet is painted once as three textures: the bare drawing, the finished redlined drawing, and a small
// timing map (R = when a pixel appears, G = how long it takes). A tiny shader blends bare -> finished per pixel
// as progress passes each mark's time, so lines still draw themselves along their length and marks still fade
// in, but scrolling never repaints a canvas or re-uploads a texture.
// where the approval stamp lands on the sheet (drawing units, 1400 × 960), and the drawing progress at contact
const STAMP = { x: 1215, y: 470, rot: -0.18, scale: 0.9, k: 0.8 };
// a rubber stamp that lives on the desk beside the sheet (built upright, pad at y = 0)
function rubberStamp() {
  const g = new THREE.Group();
  const pad = box(0.21, 0.01, 0.085, 'green', 0, 0.005, 0);
  const base = box(0.225, 0.03, 0.1, 'paper', 0, 0.025, 0);
  const neck = S(cyl(0.017, 0.022, 0.07, 'ink', 24, 0, 0.075, 0));
  const knob = blob(0.042, 'green', [0, 0.128, 0], [1, 0.82, 1]);
  g.add(pad, base, neck, knob);
  return g;
}

function drawingTexture() {
  const small = matchMedia('(max-width: 960px)').matches;
  const W = small ? 1400 : 1800, H = small ? 960 : 1234, K = W / 1400;
  const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const ox = 260, oy = 170, pw = 760, ph = 560;
  function base(ctx) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
    ctx.setTransform(K, 0, 0, K, 0, 0);
    ctx.strokeStyle = 'rgba(8,8,8,.07)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < 1400; x += 28) { ctx.moveTo(x, 0); ctx.lineTo(x, 960); }
    for (let y = 0; y < 960; y += 28) { ctx.moveTo(0, y); ctx.lineTo(1400, y); }
    ctx.stroke();
    ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 3; ctx.strokeRect(30, 30, 1340, 900);
    ctx.lineWidth = 12; ctx.strokeRect(ox, oy, pw, ph);
    ctx.lineWidth = 6;
    [[ox + 300, oy, ox + 300, oy + 220], [ox, oy + 220, ox + 220, oy + 220], [ox + 300, oy + 220, ox + pw, oy + 220], [ox + 480, oy + 220, ox + 480, oy + ph], [ox, oy + 380, ox + 300, oy + 380], [ox + 300, oy + 380, ox + 300, oy + ph]].forEach(([a, b, x, y]) => { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(x, y); ctx.stroke(); });
    ctx.lineWidth = 2;
    [[ox + 220, oy + 220, 80, 0], [ox + 300, oy + 300, 80, Math.PI / 2], [ox + 480, oy + 300, 80, Math.PI]].forEach(([x, y, r, a]) => { ctx.beginPath(); ctx.arc(x, y, r, a, a + Math.PI / 2); ctx.stroke(); });
    ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(ox, oy - 50); ctx.lineTo(ox + pw, oy - 50); ctx.stroke();
    ctx.font = `500 22px ${MONO}`; ctx.fillStyle = COLORS.ink; ctx.textAlign = 'center'; ctx.fillText('24 600', ox + pw / 2, oy - 60);
    ctx.save(); ctx.translate(ox - 50, oy + ph / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('18 200', 0, -10); ctx.restore();
    ctx.beginPath(); ctx.moveTo(ox - 50, oy); ctx.lineTo(ox - 50, oy + ph); ctx.stroke();
    ctx.font = `500 20px ${MONO}`; ctx.fillStyle = '#5e615e';
    [['OFFICE 01', ox + 150, oy + 110], ['SERVER RM', ox + 530, oy + 110], ['CORRIDOR', ox + 400, oy + 300], ['PANTRY', ox + 150, oy + 300], ['STORE', ox + 150, oy + 470], ['OPEN PLAN', ox + 620, oy + 400]].forEach(([t, x, y]) => ctx.fillText(t, x, y));
    ctx.textAlign = 'left'; ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 3; ctx.strokeRect(1020, 760, 350, 170);
    ctx.beginPath(); ctx.moveTo(1020, 820); ctx.lineTo(1370, 820); ctx.moveTo(1020, 870); ctx.lineTo(1370, 870); ctx.stroke();
    ctx.font = `900 30px "Montserrat", ${SANS}`; const fw = ctx.measureText('FIRE').width;
    ctx.fillStyle = COLORS.green; ctx.fillText('FIRE', 1038, 802); ctx.fillStyle = COLORS.ink; ctx.fillText('STONE', 1038 + fw, 802);
    ctx.font = `500 18px ${MONO}`; ctx.fillText('FF / FA SHOP DRAWING', 1038, 852); ctx.fillText('DWG FS-02   REV C', 1038, 902);
  }
  // every redline mark. In 'time' mode the same shapes are drawn a little thicker in a colour that encodes
  // when they appear (R) and how long their fade lasts (G); growing strokes get a start time that runs along the path.
  function marks(ctx, time) {
    const tc = (a, len) => `rgb(${Math.round(clamp(a) * 255)},${Math.round(clamp(len) * 255)},0)`;
    const PAD = 6;
    const style = (color, lw, a, len) => { ctx.strokeStyle = ctx.fillStyle = time ? tc(a, len) : color; ctx.lineWidth = lw + (time ? PAD : 0); };
    // a stroke that draws itself from its first point to its last as progress runs from a to b
    const grow = (pts, color, lw, a, b, dash) => {
      if (!time) {
        style(color, lw); if (dash) ctx.setLineDash(dash);
        ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
        ctx.setLineDash([]); return;
      }
      const segs = []; let total = 0;
      for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segs.push([pts[i - 1], pts[i], total, l]); total += l; }
      const STEP = 5;
      segs.forEach(([p0, p1, s0, l]) => {
        const n = Math.max(1, Math.ceil(l / STEP));
        for (let j = 0; j < n; j++) {
          const u0 = j / n, u1 = Math.min(1, (j + 1.6) / n);
          style(color, lw, a + (b - a) * ((s0 + l * u0) / total), 0.03);
          ctx.beginPath(); ctx.moveTo(p0[0] + (p1[0] - p0[0]) * u0, p0[1] + (p1[1] - p0[1]) * u0); ctx.lineTo(p0[0] + (p1[0] - p0[0]) * u1, p0[1] + (p1[1] - p0[1]) * u1); ctx.stroke();
        }
      });
    };
    const text = (str, x, y, a, len) => { if (time) { ctx.lineWidth = PAD + 2; ctx.strokeText(str, x, y); } ctx.fillText(str, x, y); };
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // sprinkler heads: circle + cross
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
      const n = i * 3 + j, x = ox + 90 + i * 190, y = oy + 75 + j * 205, a = n * 0.035;
      style(COLORS.green, 4, a, 0.12);
      ctx.beginPath(); ctx.arc(x, y, 13, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 9, y - 9); ctx.lineTo(x + 9, y + 9); ctx.moveTo(x + 9, y - 9); ctx.lineTo(x - 9, y + 9); ctx.stroke();
    }
    // branch lines and the main
    for (let j = 0; j < 3; j++) grow([[ox + 40, oy + 75 + j * 205], [ox + pw - 40, oy + 75 + j * 205]], COLORS.green, 5, 0.15, 0.5);
    grow([[ox + 40, oy + 40], [ox + 40, oy + ph - 40]], COLORS.green, 5, 0.15, 0.5);
    // smoke detectors
    ctx.font = `600 20px ${MONO}`; ctx.textAlign = 'center';
    [[ox + 180, oy + 160], [ox + 560, oy + 160], [ox + 400, oy + 250], [ox + 120, oy + 330], [ox + 620, oy + 470], [ox + 160, oy + 500]].forEach(([x, y], i) => {
      const a = 0.3 + i * 0.04;
      style(COLORS.ink, 3, a, 0.12);
      ctx.strokeRect(x - 15, y - 15, 30, 30);
      if (time) ctx.fillRect(x - 15, y - 15, 30, 30); else ctx.fillText('S', x, y + 7);
    });
    // escape route
    const L2 = ph + 70 - 300;
    grow([[ox + 150, oy + 300], [ox + 400, oy + 300], [ox + 400, oy + 300 + L2]], COLORS.green, 7, 0.5, 0.8, [18, 12]);
    style(COLORS.green, 0, 0.78, 0.06);
    ctx.beginPath(); ctx.moveTo(ox + 400, oy + ph + 96); ctx.lineTo(ox + 380, oy + ph + 62); ctx.lineTo(ox + 420, oy + ph + 62); ctx.closePath(); ctx.fill(); if (time) { ctx.lineWidth = PAD; ctx.stroke(); }
    // handwritten notes + the cloud around the server room
    style(COLORS.green, 4, 0.62, 0.18); ctx.textAlign = 'left';
    ctx.font = `400 40px ${HAND}`; text('Add VESDA to server room', ox + pw - 120, oy + 30, 0.62, 0.18);
    ctx.font = `400 36px ${HAND}`; style(COLORS.green, 4, 0.62, 0.18); text('2 ways out ✓', ox + 425, oy + ph + 112, 0.62, 0.18);
    const cloud = []; for (let a = 0; a <= Math.PI * 2 + 0.01; a += Math.PI / 24) { const r = 110 + Math.sin(a * 9) * 9; cloud.push([ox + 560 + Math.cos(a) * r * 1.5, oy + 115 + Math.sin(a) * r * 0.7]); }
    grow(cloud, COLORS.green, 4, 0.62, 0.8);
    // approval stamp: in the free strip right of the plan, printed the instant the rubber stamp touches the sheet
    ctx.save(); ctx.translate(STAMP.x, STAMP.y); ctx.rotate(STAMP.rot); ctx.scale(STAMP.scale, STAMP.scale);
    if (time) { style(COLORS.green, 0, STAMP.k, 0.012); ctx.fillRect(-160, -70, 320, 140); }
    else {
      ctx.strokeStyle = COLORS.green; ctx.fillStyle = COLORS.green; ctx.lineWidth = 7; ctx.strokeRect(-150, -60, 300, 120); ctx.lineWidth = 3; ctx.strokeRect(-138, -48, 276, 96);
      ctx.font = `700 40px ${SANS}`; ctx.textAlign = 'center'; ctx.fillText('APPROVED', 0, 8); ctx.font = `500 18px ${MONO}`; ctx.fillText('CIVIL DEFENCE · 2026', 0, 36);
    }
    ctx.restore();
    ctx.restore();
  }
  const bare = canvas(W, H), done = canvas(W, H), timing = canvas(Math.round(W / 2), Math.round(H / 2));
  base(bare.getContext('2d'));
  const dc = done.getContext('2d'); base(dc); dc.setTransform(K, 0, 0, K, 0, 0); marks(dc, false);
  const tcx = timing.getContext('2d'); tcx.fillStyle = 'rgb(255,0,0)'; tcx.fillRect(0, 0, timing.width, timing.height);
  tcx.setTransform(K / 2, 0, 0, K / 2, 0, 0); marks(tcx, true);
  const texOf = (c, srgb) => { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  const tex = texOf(bare, true), doneTex = texOf(done, true), timeTex = texOf(timing, false);
  const uK = { value: 0 };
  return {
    tex,
    // teach a material (the sheet's) to blend bare -> finished by the timing map
    patch(m) {
      m.onBeforeCompile = (sh) => {
        sh.uniforms.uDone = { value: doneTex }; sh.uniforms.uTiming = { value: timeTex }; sh.uniforms.uK = uK;
        sh.fragmentShader = 'uniform sampler2D uDone;\nuniform sampler2D uTiming;\nuniform float uK;\n' + sh.fragmentShader.replace('#include <map_fragment>', `
#ifdef USE_MAP
  vec4 sampledDiffuseColor = texture2D( map, vMapUv );
  vec2 tm = texture2D( uTiming, vMapUv ).rg;
  float shown = smoothstep( tm.r, tm.r + max( tm.g, 0.012 ), uK );
  sampledDiffuseColor = mix( sampledDiffuseColor, texture2D( uDone, vMapUv ), shown );
  diffuseColor *= sampledDiffuseColor;
#endif`);
      };
      m.customProgramCacheKey = () => 'fs-baked-drawing';
      return m;
    },
    update(k) { uK.value = k; },
  };
}

// ---------------------------------------------------------------- services that draw themselves in
// Pipe and cable runs are merged into one mesh per floor and material. Every vertex carries the moment
// (0..1) the run reaches it, and the shader hides whatever hasn't been reached yet — so a floor's services
// grow along their length from a single uniform, with nothing rebuilt, re-uploaded or made see-through.
// fire-fighting pipes are red like real sprinkler pipework (a deeper red, and thicker than the alarm cables);
// the water is blue: the flow running through the pipes during testing, and the spray from the heads
const FIRE_RED = '#E0453A', PIPE_RED = '#B8261E', WATER_BLUE = '#5AAAF5';
// During testing a soft band (uPulse, along the same timeline) travels through the run in uPulseColor:
// water flowing through the pipes, a signal running along the alarm loop. The band fades out smoothly on both
// sides (a little longer behind it, like a trail), and it is mixed in before the output colour conversion so
// its colour matches exactly what it is (the water is the spray's own blue).
function growing(m, pulseColor = '#ffffff') {
  const u = { uGrow: { value: 0 }, uPulse: { value: 0 }, uPulseAmt: { value: 0 }, uPulseColor: { value: new THREE.Color(pulseColor) } };
  m.userData.grow = u;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = 'attribute float aT;\nvarying float vT;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vT = aT;');
    sh.fragmentShader = 'uniform float uGrow, uPulse, uPulseAmt;\nuniform vec3 uPulseColor;\nvarying float vT;\n' + sh.fragmentShader
      // nothing shows before the run starts (pieces placed at time 0, like the control panel, included)
      .replace('void main() {', 'void main() {\n  if (uGrow <= 0.0 || vT > uGrow) discard;')
      .replace('#include <colorspace_fragment>', 'float s = fract(vT - uPulse + 0.5) - 0.5;\n  float sig = s > 0.0 ? 0.034 : 0.06;\n  float band = uPulseAmt * exp(-(s * s) / (sig * sig));\n  gl_FragColor.rgb = mix(gl_FragColor.rgb, uPulseColor, band);\n#include <colorspace_fragment>');
  };
  m.customProgramCacheKey = () => 'grow-' + m.type;
  return m;
}
const _up = new THREE.Vector3(0, 1, 0), _q = new THREE.Quaternion(), _m = new THREE.Matrix4(), _s = new THREE.Vector3(1, 1, 1);
// a straight run from a to b: the arrival time goes from ta at a to tb at b
function runPiece(a, b, r, ta, tb, radial = 8) {
  const A = V(...a), B = V(...b), len = A.distanceTo(B);
  const g = new THREE.CylinderGeometry(r, r, len, radial, 1, true);
  const pos = g.attributes.position, t = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) t[i] = ta + (tb - ta) * (pos.getY(i) / len + 0.5);
  g.setAttribute('aT', new THREE.BufferAttribute(t, 1));
  _q.setFromUnitVectors(_up, B.clone().sub(A).normalize());
  g.applyMatrix4(_m.compose(A.clone().add(B).multiplyScalar(0.5), _q, _s));
  return g;
}
// anything that simply appears when the run reaches it (fittings, heads, detectors, panels)
function atPiece(g, [x, y, z], t, rot) {
  g.setAttribute('aT', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count).fill(t), 1));
  if (rot) g.rotateX(rot);
  g.translate(x, y, z);
  return g;
}
// a polyline run: points with times are spread by length, joints get a fitting
function run(pts, r, t0, t1, out, fit = 0) {
  pts = pts.filter((p, i) => i === 0 || V(...p).distanceTo(V(...pts[i - 1])) > 1e-6);
  const lens = pts.slice(1).map((p, i) => V(...p).distanceTo(V(...pts[i])));
  const total = lens.reduce((a, b) => a + b, 0);
  let acc = 0;
  const times = [t0];
  lens.forEach((l, i) => {
    const ta = t0 + (t1 - t0) * (acc / total);
    acc += l;
    const tb = t0 + (t1 - t0) * (acc / total);
    times.push(tb);
    out.push(runPiece(pts[i], pts[i + 1], r, ta, tb));
    if (fit && i < lens.length - 1) out.push(atPiece(new THREE.SphereGeometry(fit, 10, 8), pts[i + 1], tb));
  });
  return times;
}
function grownMesh(parts, material, pulseColor) {
  const g = mergeGeometries(parts, false);
  parts.forEach((p) => p.dispose());
  const m = new THREE.Mesh(g, growing(material, pulseColor));
  m.userData.noInk = true; m.userData.keep = true; m.frustumCulled = false;
  return m;
}

// ---------------------------------------------------------------- building that grows out of the drawing
function building() {
  const b = new THREE.Group();
  const W = 0.5, D = 0.34, SH = 0.105, N = 8;
  const storeys = [], fades = [], rings = [], wet = [], alarm = [], heads = [];
  // risers climb the front-right corner: the water riser on the right face, the alarm riser on the front face;
  // both step in where the top two floors set back
  const riserAt = (i) => (i > 5 ? { wx: 0.19, wz: 0.11, ax: 0.12, az: 0.165 } : { wx: 0.28, wz: 0.14, ax: 0.2, az: 0.19 });
  for (let i = 0; i < N; i++) {
    const s = new THREE.Group();
    const w = i > 5 ? W * 0.8 : W, d = i > 5 ? D * 0.85 : D, xo = i > 5 ? -0.04 : 0;
    s.add(box(w + 0.02, 0.012, d + 0.02, 'paper', xo, 0.006, 0));
    const fh = 0.068, fy = 0.012 + fh / 2;
    s.add(box(w, fh, 0.008, 'paper', xo, fy, d / 2), box(w, fh, 0.008, 'paper', xo, fy, -d / 2));
    s.add(box(0.008, fh, d, 'paper', xo + w / 2, fy, 0), box(0.008, fh, d, 'paper', xo - w / 2, fy, 0));
    s.add(box(0.006, 0.05, d * 0.6, 'mid', xo - w * 0.15, 0.037, -d * 0.2), box(w * 0.45, 0.05, 0.006, 'mid', xo + w * 0.2, 0.037, 0.02));
    s.add(box(0.06, 0.02, 0.04, 'mid', xo - w * 0.32, 0.022, 0.08), box(0.06, 0.02, 0.04, 'mid', xo + w * 0.3, 0.022, -0.09));

    const R = riserAt(i), below = i === 6 ? riserAt(5) : R;
    // ---- fire fighting (red pipes): riser → feed → main along the right side → three branch lines with heads
    const yC = 0.094, mainX = xo + w / 2 - 0.03, endX = xo - w / 2 + 0.035;
    const pipe = [];
    const riserPts = i === 6
      ? [[below.wx, 0.004, below.wz], [R.wx, 0.004, below.wz], [R.wx, 0.004, R.wz], [R.wx, SH, R.wz]]
      : [[R.wx, 0, R.wz], [R.wx, SH, R.wz]];
    run(riserPts, 0.0055, 0, 0.26, pipe, 0.0075);
    const tTee = 0.26 * (i === 6 ? 0.55 + 0.45 * (yC / SH) : yC / SH);
    pipe.push(atPiece(new THREE.SphereGeometry(0.0075, 10, 8), [R.wx, yC, R.wz], tTee));
    const zA = Math.min(R.wz, d / 2 - 0.03), zB = -d / 2 + 0.03;
    run([[R.wx, yC, R.wz], [mainX, yC, R.wz], [mainX, yC, zA]], 0.0045, tTee, tTee + 0.07, pipe, 0.0062);
    const tMain = tTee + 0.07;
    run([[mainX, yC, zA], [mainX, yC, zB]], 0.0045, tMain, tMain + 0.24, pipe);
    for (let k = 0; k < 3; k++) {
      const pz = -d / 2 + d * (k + 0.5) / 3;
      const tj = tMain + 0.24 * ((zA - pz) / (zA - zB));
      pipe.push(atPiece(new THREE.SphereGeometry(0.0062, 10, 8), [mainX, yC, pz], tj));
      run([[mainX, yC, pz], [endX, yC, pz]], 0.0034, tj, tj + 0.36, pipe);
      for (let m = 0; m < 4; m++) {
        const hx = xo - w * 0.38 + m * w * 0.25;
        const th = tj + 0.36 * ((mainX - hx) / (mainX - endX));
        pipe.push(atPiece(new THREE.CylinderGeometry(0.0016, 0.0016, 0.007, 6), [hx, yC - 0.005, pz], th));
        pipe.push(atPiece(new THREE.SphereGeometry(0.0052, 10, 8), [hx, yC - 0.0095, pz], th));
        if (i === 3 || i === 5) heads.push({ s: i, x: hx, y: yC - 0.012, z: pz });
      }
    }
    const pipes = grownMesh(pipe, new THREE.MeshBasicMaterial({ color: PIPE_RED }), WATER_BLUE);

    // ---- fire alarm (red cables): riser → loop along the ceiling to both detectors; call point on the facade
    const yA = 0.1013, cable = [], devices = [];
    const alarmPts = i === 6
      ? [[below.ax, 0.002, below.az], [R.ax, 0.002, below.az], [R.ax, 0.002, R.az], [R.ax, SH, R.az]]
      : [[R.ax, 0, R.az], [R.ax, SH, R.az]];
    run(alarmPts, 0.0021, 0, 0.24, cable);
    const det1 = [xo + w * 0.25, -d * 0.2], det2 = [xo - w * 0.3, d * 0.15];
    const loop = [[R.ax, yA, R.az], [R.ax, yA, det1[1]], [det1[0], yA, det1[1]], [det2[0], yA, det1[1]], [det2[0], yA, det2[1]]];
    const times = run(loop, 0.0019, 0.22, 0.9, cable);
    // call point + sounder on the facade beside the riser (the ground floor also gets the control panel)
    // (front wall's outer face is at d/2 + 0.004)
    cable.push(atPiece(new THREE.BoxGeometry(0.018, 0.018, 0.006), [R.ax - 0.03, 0.05, d / 2 + 0.007], 0.12));
    cable.push(atPiece(new THREE.CylinderGeometry(0.007, 0.007, 0.005, 16), [R.ax + 0.028, 0.062, d / 2 + 0.0065], 0.14, Math.PI / 2));
    if (i === 0) cable.push(atPiece(new THREE.BoxGeometry(0.05, 0.06, 0.012), [R.ax - 0.075, 0.046, d / 2 + 0.01], 0));
    const cables = grownMesh(cable, new THREE.MeshBasicMaterial({ color: FIRE_RED }), '#FFD3CC');
    [[det1, times[2]], [det2, times[4]]].forEach(([[x, z], t]) => {
      devices.push(atPiece(new THREE.CylinderGeometry(0.012, 0.012, 0.006, 20), [x, 0.097, z], t));
      devices.push(atPiece(new THREE.CylinderGeometry(0.0045, 0.0045, 0.002, 12), [x, 0.0935, z], t));
      const r = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.0025, 8, 40), new THREE.MeshBasicMaterial({ color: FIRE_RED, transparent: true, opacity: 0, depthWrite: false }));
      r.rotation.x = Math.PI / 2; r.position.set(x, 0.094, z); r.userData.noInk = true; s.add(r); rings.push(r);
    });
    const dets = grownMesh(devices, new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: mat('paper').gradientMap }));
    // the services sit outside the floor's own fade and never cast shadows (a shadow can't follow the growth)
    const svc = new THREE.Group(); svc.userData.ownFade = true; svc.userData.noCast = true; svc.userData.keep = true;
    svc.add(pipes, cables, dets); s.add(svc);
    wet.push(pipes.material.userData.grow);
    alarm.push(cables.material.userData.grow, dets.material.userData.grow);
    storeys.push(s); b.add(s);
  }
  const roof = new THREE.Group();
  roof.add(box(W * 0.8 + 0.02, 0.014, D * 0.85 + 0.02, 'mid', -0.04, 0.007, 0), box(0.1, 0.05, 0.08, 'paper', -0.12, 0.035, 0.03), cyl(0.03, 0.03, 0.06, 'paper', 20, 0.06, 0.04, -0.05));
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.016, 20, 12), mat('glow')); beacon.position.set(0.12, 0.05, 0.08); beacon.userData.noInk = true;
  roof.add(cyl(0.002, 0.002, 0.04, 'ink', 6, 0.12, 0.025, 0.08), beacon);
  b.add(roof);
  // test spray: blue water from the real heads on floors 3 and 5
  const ND = 220;
  const dropMat = new THREE.MeshBasicMaterial({ color: WATER_BLUE, transparent: true, opacity: 0, depthWrite: false });
  const drops = new THREE.InstancedMesh(new THREE.SphereGeometry(0.0042, 6, 4), dropMat, ND);
  drops.userData.noInk = true; drops.frustumCulled = false; b.add(drops);
  const sprayHeads = heads.filter((h) => h.x > -0.1 && h.x < 0.1 && h.z > -0.05);
  const seeds = [...Array(ND)].map(() => ({ a: Math.random() * Math.PI * 2, s: 0.4 + Math.random(), o: Math.random(), h: Math.floor(Math.random() * sprayHeads.length) }));
  const orbit = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.0035, 8, 160), mat('glow')); ring.rotation.x = Math.PI / 2; ring.userData.noInk = true; orbit.add(ring);
  const sats = [0, 1, 2, 3].map((i) => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.018, 20, 12), mat('glow')); s.userData.noInk = true; s.userData.a = (i / 4) * Math.PI * 2; orbit.add(s); return s; });
  b.add(orbit);
  return { group: b, storeys, fades, wet, alarm, rings, roof, beacon, drops, dropMat, seeds, sprayHeads, orbit, sats, SH, N, W, D, riserAt };
}

// ---------------------------------------------------------------- the finale: a Civil Defence approval seal
function approvalSeal() {
  const g = new THREE.Group(); g.userData.noCast = true;
  const R = 0.22;
  const face = canvasTex(512, 512, (c, w) => {
    const cx = w / 2, cy = w / 2;
    // scalloped rosette edge
    c.fillStyle = COLORS.green; c.beginPath();
    for (let a = 0; a <= Math.PI * 2 + 0.001; a += Math.PI / 180) { const rr = 246 - 9 * (0.5 + 0.5 * Math.cos(a * 28)); c.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
    c.fill();
    c.fillStyle = COLORS.paper; c.beginPath(); c.arc(cx, cy, 206, 0, Math.PI * 2); c.fill();
    c.strokeStyle = COLORS.green; c.lineWidth = 5; c.beginPath(); c.arc(cx, cy, 192, 0, Math.PI * 2); c.stroke();
    c.lineWidth = 2; c.beginPath(); c.arc(cx, cy, 140, 0, Math.PI * 2); c.stroke();
    // lettering around the ring
    const arc = (text, radius, mid, dir) => {
      c.save(); c.translate(cx, cy);
      const span = text.length * 0.115; let a = mid - (dir * span) / 2;
      for (const ch of text) { c.save(); c.rotate(a); c.translate(0, -dir * radius); c.fillText(ch, 0, 0); c.restore(); a += dir * 0.115; }
      c.restore();
    };
    c.fillStyle = COLORS.ink; c.font = `600 30px ${MONO}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    arc('CIVIL DEFENCE', 166, 0, 1);
    arc('APPROVED · 2026', 166, 0, -1);
    c.fillStyle = COLORS.green; c.beginPath(); c.arc(cx - 168, cy, 7, 0, Math.PI * 2); c.arc(cx + 168, cy, 7, 0, Math.PI * 2); c.fill();
    // the tick
    c.strokeStyle = COLORS.green; c.lineWidth = 34; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(cx - 62, cy + 4); c.lineTo(cx - 16, cy + 50); c.lineTo(cx + 70, cy - 52); c.stroke();
  });
  const front = new THREE.Mesh(new THREE.CircleGeometry(R, 72), new THREE.MeshBasicMaterial({ map: face, alphaTest: 0.5 }));
  front.position.z = 0.0075;
  const back = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.93, R * 0.93, 0.012, 72), new THREE.MeshBasicMaterial({ color: '#1E7A36' }));
  back.rotation.x = Math.PI / 2;
  const coin = new THREE.Group(); coin.add(back, front);
  // the stamp's burst: a ring and short rays that flash outwards as it lands
  const burstMat = new THREE.MeshBasicMaterial({ color: COLORS.green, transparent: true, opacity: 0, depthWrite: false });
  const rays = [];
  for (let i = 0; i < 14; i++) { const ray = new THREE.PlaneGeometry(0.008, 0.05); ray.translate(0, R + 0.06, 0); ray.rotateZ((i / 14) * Math.PI * 2); rays.push(ray); }
  const burst = new THREE.Group();
  const ringMesh = new THREE.Mesh(new THREE.RingGeometry(R + 0.012, R + 0.024, 72), burstMat);
  const rayMesh = new THREE.Mesh(mergeGeometries(rays), burstMat);
  burst.add(ringMesh, rayMesh); burst.position.z = -0.002;
  g.add(burst, coin);
  [front, back, ringMesh, rayMesh].forEach((m) => { m.userData.noInk = true; m.frustumCulled = false; });
  g.visible = false;
  return { group: g, coin, burst, burstMat, R };
}

// ---------------------------------------------------------------- room
function room(drawing) {
  const r = new THREE.Group();
  const X0 = -3.5, X1 = 4.2, Z0 = -2.5, Z1 = 5, H = 3.2;
  r.add(box(X1 - X0 + 40, 0.1, Z1 - Z0 + 40, 'mid', (X0 + X1) / 2 - 18, -0.05, (Z0 + Z1) / 2));
  r.add(box(X1 - X0, 3.3, 0.2, 'paper', (X0 + X1) / 2, 1.65, Z0 - 0.1));
  // slim ceiling beam carrying the sprinkler drops — its shadow is a single graphic stripe
  r.add(box(X1 - X0 + 0.2, 0.14, 0.22, 'paper', (X0 + X1) / 2, H + 0.07, -0.4));
  const wz0 = -2.3, wz1 = 1.6, wy0 = 0.45, wy1 = 2.9, wx = X0 - 0.1;
  r.add(box(0.2, wy0, Z1 - Z0, 'paper', wx, wy0 / 2, (Z0 + Z1) / 2));
  r.add(box(0.2, H - wy1 + 0.1, Z1 - Z0, 'paper', wx, (wy1 + H + 0.1) / 2, (Z0 + Z1) / 2));
  r.add(box(0.2, wy1 - wy0, wz0 - Z0, 'paper', wx, (wy0 + wy1) / 2, (Z0 + wz0) / 2));
  r.add(box(0.2, wy1 - wy0, Z1 - wz1, 'paper', wx, (wy0 + wy1) / 2, (wz1 + Z1) / 2));
  for (let z = wz0 + 0.78; z < wz1 - 0.1; z += 0.78) r.add(box(0.08, wy1 - wy0, 0.05, 'ink', X0 - 0.02, (wy0 + wy1) / 2, z));
  r.add(box(0.08, 0.05, wz1 - wz0, 'ink', X0 - 0.02, 2.25, (wz0 + wz1) / 2));
  r.add(box(0.3, 0.05, wz1 - wz0 + 0.1, 'mid', X0 + 0.08, wy0, (wz0 + wz1) / 2));
  const sky = new THREE.Group(); sky.userData.noCast = true;
  const rnd = (s) => { const x = Math.sin(s * 127.1) * 43758.5453; return x - Math.floor(x); };
  for (let i = 0; i < 46; i++) {
    const x = -7 - rnd(i) * 26, z = -16 + rnd(i + 9) * 30, w = 0.8 + rnd(i + 3) * 2.2, h = 2 + rnd(i + 5) * 11;
    sky.add(box(w, h, w * (0.7 + rnd(i + 7) * 0.6), i % 5 ? 'paper' : 'mid', x, h / 2, z));
  }
  const spire = new THREE.Group();
  [[1.6, 1.2, 9], [1.1, 0.8, 8], [0.7, 0.5, 7], [0.4, 0.25, 6], [0.15, 0.03, 6]].reduce((y, [rb, rt, h]) => { spire.add(cyl(rt, rb, h, 'paper', 6, 0, y + h / 2, 0)); return y + h; }, 0);
  spire.position.set(-24, 0, -6); sky.add(spire);
  r.add(sky);
  const dx = -1.0, dz = -1.75, top = 0.76;
  r.add(box(2.9, 0.05, 1.05, 'paper', dx, top - 0.025, dz));
  [[-1.38, -0.47], [1.38, -0.47], [-1.38, 0.47], [1.38, 0.47]].forEach(([x, z]) => r.add(box(0.05, top - 0.05, 0.05, 'ink', dx + x, (top - 0.05) / 2, dz + z)));
  r.add(box(2.5, 0.35, 0.03, 'mid', dx, 0.5, dz - 0.45));
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(1.12, 0.77), drawing.patch(new THREE.MeshToonMaterial({ map: drawing.tex, gradientMap: mat('paper').gradientMap })));
  sheet.rotation.x = -Math.PI / 2; sheet.rotation.z = 0.06; sheet.position.set(-0.72, top + 0.002, -1.8); sheet.receiveShadow = true; sheet.userData.noInk = true; r.add(sheet);
  r.add(box(0.5, 0.012, 0.36, 'paper', -2.0, top + 0.006, -1.5), box(0.46, 0.012, 0.34, 'mid', -2.02, top + 0.018, -1.52));
  // lamp, hat, mug, rolls and plant are drawn as smooth outlined shapes
  const lamp = new THREE.Group();
  lamp.add(S(cyl(0.1, 0.12, 0.03, 'ink', 40, 0, 0.015, 0)));
  lamp.add(tube([[0, 0.03, 0], [0.06, 0.28, 0.02], [0.12, 0.5, 0.05]], 0.012, 'ink'), tube([[0.12, 0.5, 0.05], [0.28, 0.58, 0.14], [0.42, 0.62, 0.22]], 0.012, 'ink'));
  lamp.add(blob(0.025, 'ink', [0.12, 0.5, 0.05]));
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.16, 40, 1, true), mat('paper', { side: THREE.DoubleSide })); shade.position.set(0.45, 0.56, 0.24); shade.rotation.z = 0.6; lamp.add(S(shade));
  lamp.position.set(-2.3, top, -2.05); r.add(lamp);
  const hat = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.13, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), mat('green')); shell.scale.y = 0.85; hat.add(S(shell));
  hat.add(S(cyl(0.17, 0.17, 0.012, 'green', 48, 0, 0.004, 0.02)), S(box(0.03, 0.02, 0.24, 'green', 0, 0.105, 0)));
  hat.position.set(0.18, top, -1.42); hat.rotation.y = 0.5; r.add(hat);
  const mug = new THREE.Group(); mug.add(S(cyl(0.045, 0.04, 0.11, 'paper', 32, 0, 0.055, 0))); const hdl = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.008, 12, 24, Math.PI), mat('paper')); hdl.position.set(0.045, 0.06, 0); hdl.rotation.z = -Math.PI / 2; mug.add(S(hdl)); mug.position.set(0.12, top, -2.12); r.add(mug);
  const bin = new THREE.Group(); bin.add(S(cyl(0.16, 0.14, 0.5, 'mid', 40, 0, 0.25, 0)));
  [[0.04, 0.02], [-0.05, 0.03], [0.02, -0.06], [-0.03, -0.03]].forEach(([x, z], i) => { const rl = S(cyl(0.035, 0.035, 0.95 + i * 0.05, 'paper', 24, x, 0.48, z)); rl.rotation.z = (i - 1.5) * 0.08; bin.add(rl); });
  bin.position.set(0.55, 0, -2.15); r.add(bin);
  r.add(box(2.0, 1.0, 0.03, 'mid', -1.0, 1.85, Z0 + 0.02));
  const sheetsTex = canvasTex(384, 495, (c, w, h) => {
    c.scale(1.5, 1.5); c.fillStyle = '#fff'; c.fillRect(0, 0, 256, 330); c.strokeStyle = COLORS.ink; c.lineWidth = 3;
    c.strokeRect(28, 40, 200, 150); c.beginPath(); c.moveTo(28, 110); c.lineTo(228, 110); c.moveTo(120, 40); c.lineTo(120, 190); c.stroke();
    c.lineWidth = 2; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(28, 220 + i * 18); c.lineTo(228 - (i % 2) * 60, 220 + i * 18); c.stroke(); }
    c.fillStyle = COLORS.green; c.beginPath(); c.arc(190, 150, 14, 0, 7); c.fill();
  });
  [[-1.7, 1.95, 0.05], [-1.2, 1.78, -0.04], [-0.65, 2.0, 0.03], [-0.25, 1.75, -0.06], [-1.45, 1.55, 0.02]].forEach(([x, y, rz], i) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.44), new THREE.MeshToonMaterial({ map: sheetsTex, gradientMap: mat('paper').gradientMap }));
    const zz = Z0 + 0.042 + i * 0.006;
    p.position.set(x, y, zz); p.rotation.z = rz; p.receiveShadow = true; p.userData.noInk = true; r.add(p);
    const pin = S(cyl(0.012, 0.012, 0.02, 'green', 12, x, y + 0.19, zz + 0.008), 0.003); pin.rotation.x = Math.PI / 2; r.add(pin);
  });
  r.add(box(1.6, 0.04, 0.32, 'paper', 1.8, 1.3, Z0 + 0.16));
  for (let i = 0; i < 9; i++) r.add(box(0.07, 0.32 - (i % 3) * 0.03, 0.26, i % 4 === 0 ? 'green' : i % 3 ? 'ink' : 'paper', 1.2 + i * 0.09, 1.48 - (i % 3) * 0.015, Z0 + 0.16));
  const ext = extinguisher(); ext.scale.setScalar(0.42); ext.position.set(1.35, 0.32, Z0 + 0.25); r.add(ext);
  r.add(box(0.3, 0.06, 0.12, 'ink', 1.35, 0.3, Z0 + 0.1));
  const cp = new THREE.Group(); cp.add(box(0.14, 0.15, 0.05, 'green', 0, 0, 0), box(0.09, 0.09, 0.01, 'paper', 0, 0, 0.03)); cp.position.set(2.15, 1.35, Z0 + 0.03); r.add(cp);
  for (let i = 0; i < 3; i++) { const sh = new THREE.Group(); sh.add(cyl(0.03, 0.03, 0.06, 'paper', 6, 0, H - 0.03, 0), cyl(0.06, 0.06, 0.01, 'paper', 16, 0, H - 0.1, 0)); sh.position.set(-2 + i * 1.6, 0, -0.4); r.add(sh); }
  const plant = new THREE.Group(); plant.add(S(cyl(0.22, 0.17, 0.42, 'ink', 40, 0, 0.21, 0)));
  [[0, 0.75, 0, 0.3], [0.12, 1.05, 0.05, 0.24], [-0.1, 1.25, -0.04, 0.2], [0.05, 1.45, 0.06, 0.16], [-0.14, 0.95, 0.08, 0.17]].forEach(([x, y, z, s]) => plant.add(blob(s, 'mid', [x, y, z], [1, 0.9, 1], 0.007)));
  plant.add(tube([[0, 0.42, 0], [0.03, 0.9, 0], [0.02, 1.4, 0]], 0.02, 'ink'));
  plant.position.set(3.4, 0, -1.9); r.add(plant);
  // the rubber stamp rides on the sheet's own frame (x across the drawing, y up the drawing, z off the paper)
  // so it lands exactly on the printed mark; it rests on the desk just right of the sheet
  const stampSlot = new THREE.Group(); stampSlot.userData.keep = true;
  const stampTool = rubberStamp(); stampTool.rotation.x = Math.PI / 2; stampSlot.add(stampTool);
  sheet.add(stampSlot);
  r.updateMatrixWorld(true);
  const stampRest = sheet.worldToLocal(V(-0.02, top, -1.93));
  const stampAt = V((STAMP.x / 1400 - 0.5) * 1.12, (0.5 - STAMP.y / 960) * 0.77, 0);
  return { group: r, desk: { x: -0.7, y: top, z: -1.84 }, stamp: { slot: stampSlot, tool: stampTool, rest: stampRest, at: stampAt, restYaw: 0.55, yaw: -STAMP.rot } };
}

// ---------------------------------------------------------------- camera path
const KEYS = [
  { t: 0.0, p: V(2.95, 1.6, 3.15), l: V(-1.25, 1.05, -1.45), f: 40 },
  { t: 0.16, p: V(-0.3, 2.25, -0.95), l: V(-0.72, 0.76, -1.82), f: 36 },
  { t: 0.27, p: V(-0.24, 2.15, -1.0), l: V(-0.72, 0.8, -1.84), f: 36 },
  { t: 0.42, p: V(0.62, 1.5, -0.5), l: V(-0.7, 1.08, -1.86), f: 34 },
  { t: 0.62, p: V(0.5, 2.42, -0.66), l: V(-0.72, 1.2, -1.86), f: 37 },
  { t: 0.82, p: V(1.7, 2.45, 0.55), l: V(-0.72, 1.05, -1.8), f: 38 },
  { t: 1.0, p: V(2.1, 2.55, 1.25), l: V(-0.8, 1.0, -1.7), f: 40 },
];
const curveP = new THREE.CatmullRomCurve3(KEYS.map((k) => k.p), false, 'centripetal');
const curveL = new THREE.CatmullRomCurve3(KEYS.map((k) => k.l), false, 'centripetal');
function camAt(p) {
  let i = 0; while (i < KEYS.length - 2 && p > KEYS[i + 1].t) i++;
  const a = KEYS[i], b = KEYS[i + 1];
  const lt = ease(clamp((p - a.t) / (b.t - a.t)));
  const u = (i + lt) / (KEYS.length - 1);
  return { pos: curveP.getPoint(u), look: curveL.getPoint(u), fov: a.f + (b.f - a.f) * lt };
}

// ---------------------------------------------------------------- mount
export async function mountJourney(section) {
  await fontsReady;
  const frameEl = section.querySelector('.journey__frame');
  const canvas = frameEl.querySelector('canvas');
  const panels = [...section.querySelectorAll('.jpanel')];
  const tags = Object.fromEntries([...section.querySelectorAll('[data-tag]')].map((el) => [el.dataset.tag, el]));
  const bars = [...section.querySelectorAll('.journey__progress b i')];
  const hint = section.querySelector('.journey__hint');
  const mobile = matchMedia('(max-width: 960px)').matches;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const r = renderer(canvas, { alpha: false });
  // soft, stable shadows: one fixed shadow frame over the room, redrawn only when something moves
  r.shadowMap.type = THREE.PCFShadowMap;
  r.shadowMap.autoUpdate = false;
  const dpr = window.devicePixelRatio || 1;
  const maxRatio = Math.min(dpr, mobile ? 1.25 : 1.5);
  let ratio = Math.min(dpr, mobile ? 1 : 1.25);
  const MAXPX = mobile ? 1.1e6 : 2.1e6; // total pixels rendered per frame, whatever the screen size
  const applyRatio = () => { const w = frameEl.clientWidth || 1, h = frameEl.clientHeight || 1; r.setPixelRatio(Math.max(0.5, Math.min(ratio, Math.sqrt(MAXPX / (w * h))))); };
  applyRatio();
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#edeeeb');
  const drawing = drawingTexture(); drawing.update(0);
  const rm = room(drawing);
  const eng = engineer(); eng.position.set(-1.28, 0, -0.98); eng.rotation.y = 0.12;
  const bld = building(); bld.group.position.set(rm.desk.x, rm.desk.y + 0.003, rm.desk.z - 0.02); bld.group.rotation.y = 0.06;
  const seal = approvalSeal();
  scene.add(rm.group, eng, bld.group, seal.group);
  ink(scene); outline(scene); shadows(scene);
  bld.group.traverse((o) => { if (o.isMesh && !o.userData.isHull) o.castShadow = true; });
  scene.traverse((o) => { if (o.userData.noCast) o.traverse((m) => { if (m.isMesh) m.castShadow = false; }); });
  // the room and the engineer's still parts become a handful of merged meshes
  bake(rm.group); bake(eng);
  // each floor becomes a few merged meshes too (its pipes and wiring are already merged, and stay separate)
  bld.storeys.forEach((s) => bake(s));
  bake(bld.roof);
  // fades are set up after inking so the outlines fade with their shapes
  bld.storeys.forEach((s) => bld.fades.push(fadable(s)));
  const roofFade = fadable(bld.roof), orbitFade = fadable(bld.orbit);
  const easeOutBack = (x) => 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2);
  const easeOut = (x) => 1 - Math.pow(1 - x, 3);
  const sealAt = new THREE.Vector3();
  const { sun } = rig(scene, { dir: [-4.6, 8, 3.9], extent: 5.2, size: 2048, target: V(-0.5, 0.9, -0.9) });
  sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.02; sun.shadow.radius = 2.5;
  const cam = new THREE.PerspectiveCamera(40, 1, 0.05, 120);

  let live = false;
  function resize() {
    const w = frameEl.clientWidth, h = frameEl.clientHeight;
    applyRatio(); r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
    // setSize clears the canvas: redraw at once so resizing never flashes an empty frame
    if (live) { apply(p, (performance.now() - t0) / 1000); r.shadowMap.needsUpdate = true; r.render(scene, cam); }
  }
  resize();
  new ResizeObserver(resize).observe(frameEl);

  let target = 0, p = 0, visible = true, t0 = performance.now(), last = t0;
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), camRight = new THREE.Vector3();
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), pos = new THREE.Vector3();
  const styleCache = new WeakMap();
  const setStyle = (el, prop, val) => { let c = styleCache.get(el); if (!c) styleCache.set(el, (c = {})); if (c[prop] !== val) { c[prop] = val; el.style[prop] = val; } };

  function setTag(name, world, on) {
    const el = tags[name]; if (!el) return;
    tmp.copy(world).project(cam);
    const showing = on && tmp.z < 1;
    if (el.classList.contains('on') !== showing) el.classList.toggle('on', showing);
    if (showing) {
      setStyle(el, 'left', ((tmp.x * 0.5 + 0.5) * frameEl.clientWidth).toFixed(0) + 'px');
      setStyle(el, 'top', ((-tmp.y * 0.5 + 0.5) * frameEl.clientHeight).toFixed(0) + 'px');
    }
  }

  function apply(p, t) {
    const c = camAt(p);
    cam.position.copy(c.pos); cam.fov = c.fov + (cam.aspect < 1 ? 14 : 0);
    if (cam.aspect < 1) {
      // portrait: the exploded tower is taller than the space above the panel, so aim higher and step back
      const exP = ease(range(p, 0.52, 0.6)) * (1 - ease(range(p, 0.72, 0.8)));
      c.look.y += 0.32 * exP;
      cam.position.lerp(c.look, -0.25 - 0.18 * exP);
    }
    cam.lookAt(c.look);
    // portrait screens show less of the sheet's width: glide sideways while the notes and the approval stamp
    // happen at its right-hand side, then glide back as the building rises
    if (cam.aspect < 1) {
      const k = smooth(range(p, 0.19, 0.23)) * (1 - smooth(range(p, 0.29, 0.33)));
      if (k > 0) cam.position.addScaledVector(camRight.set(1, 0, 0).applyQuaternion(cam.quaternion), 0.2 * k);
    }

    drawing.update(range(p, 0.08, 0.3));
    eng.userData.tick(t);

    // the rubber stamp: lifts off the desk, glides over, presses APPROVED onto the sheet (the mark prints at
    // contact, p = 0.256, which is drawing progress STAMP.k), then goes back to its spot
    {
      const sp = rm.stamp, HOVER = 0.1, mix = (a, b, k) => a + (b - a) * k;
      const lift = smooth(range(p, 0.222, 0.23)), go = ease(range(p, 0.23, 0.246)), down = range(p, 0.246, 0.256);
      const press = range(p, 0.256, 0.264), up = smooth(range(p, 0.264, 0.272)), home = ease(range(p, 0.272, 0.286)), land = smooth(range(p, 0.286, 0.294));
      const out = p < 0.264, over = out ? go : 1 - home;
      let z;
      if (p < 0.246) z = mix(sp.rest.z, HOVER, lift);
      else if (p < 0.256) z = HOVER * (1 - down * down);
      else if (p < 0.264) z = 0;
      else if (p < 0.286) z = HOVER * up;
      else z = mix(HOVER, sp.rest.z, land);
      sp.slot.position.set(mix(sp.rest.x, sp.at.x, over), mix(sp.rest.y, sp.at.y, over), z);
      sp.slot.rotation.set(0, (out ? -1 : 1) * 0.2 * Math.sin(Math.PI * (out ? go : home)), mix(sp.restYaw, sp.yaw, over));
      sp.tool.scale.set(1, 1 - 0.08 * Math.sin(Math.PI * press), 1);
    }

    // building rises storey by storey, each fading and settling into place
    const g = range(p, 0.27, 0.46);
    const ex = ease(range(p, 0.52, 0.6)) * (1 - ease(range(p, 0.72, 0.8)));
    const N = bld.N;
    bld.storeys.forEach((s, i) => {
      const k = smooth(clamp(g * (N + 1.5) - i));
      bld.fades[i](k);
      s.scale.set(1, 0.35 + 0.65 * k, 1);
      s.position.y = i * bld.SH + (1 - k) * 0.06 + ex * i * 0.085;
    });
    const topY = (N - 1) * bld.SH + ex * (N - 1) * 0.085 + bld.SH;
    const rk = smooth(range(g, 0.9, 1));
    roofFade(rk); bld.roof.position.y = topY + (1 - rk) * 0.05;

    // installation, floor by floor once each floor stands: the fire-fighting pipes grow up the riser and out
    // along the ceiling to the heads, then the red alarm loop runs out to the detectors
    // testing: detectors pulse, water runs through the pipes and the heads spray, signals run along the loop
    const test = smooth(range(p, 0.54, 0.58)) * (1 - smooth(range(p, 0.74, 0.78)));
    for (let i = 0; i < N; i++) {
      const w = bld.wet[i], c = bld.alarm[2 * i], d = bld.alarm[2 * i + 1];
      w.uGrow.value = range(p, 0.3 + i * 0.02, 0.37 + i * 0.02);
      c.uGrow.value = d.uGrow.value = range(p, 0.32 + i * 0.02, 0.39 + i * 0.02);
      w.uPulseAmt.value = c.uPulseAmt.value = test;
      w.uPulse.value = (t * 0.55 + i * 0.07) % 1;
      c.uPulse.value = (t * 0.8 + i * 0.11) % 1;
    }
    bld.rings.forEach((rgn, i) => { const k = (t * 0.9 + i * 0.13) % 1; rgn.scale.setScalar(1 + k * 2.4); rgn.material.opacity = (1 - k) * 0.9 * test; });
    bld.dropMat.opacity = test; bld.drops.visible = test > 0.01;
    if (test > 0.01) {
      bld.seeds.forEach((s, i) => {
        const h = bld.sprayHeads[s.h];
        const base = bld.storeys[h.s].position.y + h.y;
        const k = (t * 1.1 + s.o) % 1, rr = k * 0.05 * s.s;
        pos.set(h.x + Math.cos(s.a) * rr, base - k * 0.07, h.z + Math.sin(s.a) * rr);
        sc.setScalar(test * (1 - k * 0.4));
        m4.compose(pos, q, sc); bld.drops.setMatrixAt(i, m4);
      });
      bld.drops.instanceMatrix.needsUpdate = true;
    }

    // maintenance orbit
    const amc = smooth(range(p, 0.78, 0.88));
    orbitFade(amc);
    bld.orbit.position.y = 0.45 + Math.sin(t * 0.8) * 0.02;
    bld.orbit.scale.setScalar(0.7 + amc * 0.3);
    bld.sats.forEach((s) => { const a = s.userData.a + t * 0.35; s.position.set(Math.cos(a) * 0.46, 0, Math.sin(a) * 0.46); });
    bld.beacon.scale.setScalar(1 + amc * Math.max(0, Math.sin(t * 5)) * 0.9);

    // finale: the Civil Defence approval seal drops in above the building, spins to face the camera and
    // lands with a burst
    const st = range(p, 0.875, 0.945);
    seal.group.visible = st > 0;
    if (st > 0) {
      sealAt.set(0.03, topY + 0.42, 0.06); bld.group.localToWorld(sealAt);
      sealAt.y += (1 - easeOut(st)) * 0.45;
      seal.group.position.copy(sealAt);
      seal.group.quaternion.copy(cam.quaternion);
      seal.group.scale.setScalar(Math.max(0.001, easeOutBack(st)));
      seal.coin.rotation.y = (1 - easeOut(st)) * Math.PI * 3;
      const bt = range(p, 0.935, 0.99);
      seal.burst.scale.setScalar(1 + easeOut(bt) * 0.9);
      seal.burstMat.opacity = Math.sin(Math.PI * bt) * 0.85;
      seal.burst.visible = bt > 0 && bt < 1;
    }

    // DOM panels slide and fade in, contents stagger; the 3D view shifts away from them
    const wins = [[0.1, 0.3], [0.32, 0.52], [0.54, 0.74], [0.76, 0.97]];
    let sx = 0, sy = 0;
    panels.forEach((el, i) => {
      const [a, b] = wins[i];
      const k = ease(range(p, a, a + 0.06)) * (1 - ease(range(p, b - 0.04, b + 0.02)));
      const right = el.classList.contains('jpanel--r');
      setStyle(el, 'transform', mobile ? `translate3d(0, ${((1 - k) * 115).toFixed(1)}%, 0)` : `translate3d(${((right ? 1 : -1) * (1 - k) * 104).toFixed(1)}%, 0, 0)`);
      setStyle(el, 'opacity', (0.2 + 0.8 * k).toFixed(2));
      setStyle(el, 'visibility', k > 0.001 ? 'visible' : 'hidden');
      if (k > 0.001) [...el.children].forEach((ch, j) => { const kj = smooth(clamp(k * 1.5 - j * 0.1)); setStyle(ch, 'opacity', kj.toFixed(2)); setStyle(ch, 'transform', `translate3d(0, ${((1 - kj) * 18).toFixed(0)}px, 0)`); });
      if (mobile) sy += k * el.offsetHeight * 0.45;
      else sx += (right ? 1 : -1) * k * el.offsetWidth * 0.5;
    });
    const fw = frameEl.clientWidth, fh = frameEl.clientHeight;
    cam.setViewOffset(fw, fh, Math.round(sx), Math.round(sy), fw, fh);
    cam.updateProjectionMatrix();
    bars.forEach((b, i) => { const [a, e] = wins[i]; setStyle(b, 'transform', `scaleX(${range(p, a, e).toFixed(3)})`); });
    if (hint) setStyle(hint, 'opacity', (1 - smooth(range(p, 0.02, 0.08))).toFixed(2));

    const wp = (x, y, z) => bld.group.localToWorld(V(x, y, z));
    const R2 = bld.riserAt(2), R5 = bld.riserAt(5);
    setTag('riser', wp(R2.wx, bld.storeys[2].position.y + 0.06, R2.wz), p > 0.41 && p < 0.47 && !mobile);
    setTag('grid', wp(-0.065, bld.storeys[4].position.y + 0.094, 0.113), p > 0.44 && p < 0.5 && !mobile);
    setTag('wire', wp(R5.ax, bld.storeys[5].position.y + 0.06, R5.az), p > 0.47 && p < 0.53 && !mobile);
    setTag('detect', wp(0.06, bld.storeys[6].position.y + 0.1, -0.058), p > 0.58 && p < 0.72);
    setTag('spray', wp(0.06, bld.storeys[3].position.y + 0.06, 0.113), p > 0.6 && p < 0.72 && !mobile);
    const a0 = bld.sats[0].userData.a + t * 0.35;
    setTag('q', wp(Math.cos(a0) * 0.46, bld.orbit.position.y, Math.sin(a0) * 0.46), p > 0.82 && p < 0.9);
    setTag('beacon', wp(0.12, topY + 0.06, 0.08), p > 0.84 && p < 0.9 && !mobile);
    if (st > 0) { tmp2.copy(seal.group.position); tmp2.y += seal.R + 0.05; setTag('cert', tmp2, p > 0.945); } else setTag('cert', seal.group.position, false);
  }

  function readScroll() {
    const rect = section.getBoundingClientRect();
    target = clamp(-rect.top / (rect.height - innerHeight));
    const approach = clamp(1 - rect.top / innerHeight);
    if (!mobile) frameEl.style.setProperty('--fs', (0.93 + 0.07 * ease(approach)).toFixed(4));
  }
  readScroll();
  addEventListener('scroll', readScroll, { passive: true });
  addEventListener('resize', readScroll);

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) loop(); }, { rootMargin: '200px' }).observe(section);
  let raf = 0, frameN = 0, shadowP = -1, samples = 0, acc = 0, lastTune = 0;
  function loop() {
    cancelAnimationFrame(raf);
    last = performance.now();
    const step = () => {
      if (!visible) return;
      const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
      // critically-damped follow: smooth on wheels and trackpads alike
      p += (target - p) * (reduce ? 1 : 1 - Math.exp(-dt * 5.5));
      if (Math.abs(target - p) < 0.00005) p = target;
      const moving = Math.abs(target - p) > 0.0001;
      frameN++;
      // while nothing scrolls, the idle animation runs at half rate to save power
      if (moving || frameN % 2 === 0) {
        apply(p, (now - t0) / 1000);
        // shadows are redrawn when the scene changes, and a few times a second for idle motion
        const inBuild = (x) => x > 0.215 && x < 0.82; // the stamp's move, the building and its testing
        if (Math.abs(p - shadowP) > 0.0008 && (inBuild(p) || inBuild(shadowP))) { r.shadowMap.needsUpdate = true; shadowP = p; }
        r.render(scene, cam);
      }
      // adaptive resolution: keep every device smooth
      acc += dt; samples++;
      if (samples >= 45 && now - lastTune > 1500) {
        const avg = (acc / samples) * 1000; acc = 0; samples = 0; lastTune = now;
        if (avg > 20 && ratio > 0.6) { ratio = Math.max(0.6, ratio - 0.15); resize(); }
        else if (avg < 12 && ratio < maxRatio) { ratio = Math.min(maxRatio, ratio + 0.1); resize(); }
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }
  // warm-up: draw every object once in each fade state (faded + solid, plus its shadow) before the journey
  // shows. Compiling shaders alone is not enough — geometry uploads and the driver's per-draw pipeline
  // states are only created on a real draw, and objects outside the opening view were never drawn, so the
  // first scroll used to hitch on every new floor. Culling is off while warming, and the draws are split
  // into small batches with pauses between them so the page stays responsive.
  const allFades = (k) => {
    bld.fades.forEach((f) => f(k)); roofFade(k); orbitFade(k);
    [...bld.wet, ...bld.alarm].forEach((u) => { u.uGrow.value = k; u.uPulseAmt.value = k; });
    bld.drops.visible = k > 0; bld.dropMat.opacity = k;
    seal.group.visible = seal.burst.visible = k > 0; seal.burstMat.opacity = k; seal.group.position.copy(bld.group.position);
  };
  const pause = () => new Promise((res) => setTimeout(res, 0));
  const leaves = []; scene.traverse((o) => { if (o.isMesh || o.isLine || o.isLineSegments || o.isPoints) leaves.push(o); });
  const ownVis = leaves.map((o) => o.visible), ownCull = leaves.map((o) => o.frustumCulled);
  leaves.forEach((o) => { o.frustumCulled = false; });
  const BATCH = 16;
  for (const k of [0.5, 1]) {
    allFades(k);
    const shown = leaves.map((o) => o.visible);
    if (r.compileAsync) await r.compileAsync(scene, cam); else r.compile(scene, cam);
    for (let i = 0; i < leaves.length; i += BATCH) {
      leaves.forEach((o, j) => { o.visible = shown[j] && j >= i && j < i + BATCH; });
      r.shadowMap.needsUpdate = true; r.render(scene, cam);
      await pause();
    }
    leaves.forEach((o, j) => { o.visible = shown[j]; });
  }
  leaves.forEach((o, j) => { o.visible = ownVis[j]; o.frustumCulled = ownCull[j]; });
  allFades(0);
  // diagnostics: window.__fsJourney.bench(p) renders one frame synchronously and reports its cost
  if (/[?&]debug\b/.test(location.search)) window.__fsJourney = {
    ctx: { r, scene, cam, apply, bld, THREE },
    bench(pp = 0.5) {
      const t0 = performance.now(); drawing.update(range(pp, 0.08, 0.3));
      const t1 = performance.now(); apply(pp, 1);
      const gl = r.getContext(), t = performance.now(); r.render(scene, cam); gl.finish();
      const t2 = performance.now(); r.shadowMap.needsUpdate = true; r.render(scene, cam); gl.finish();
      const t3 = performance.now(); r.render(scene, cam); gl.finish();
      return { programs: r.info.programs.length, calls: r.info.render.calls, triangles: r.info.render.triangles, drawMs: +(t1 - t0).toFixed(1), applyMs: +(t - t1).toFixed(1), firstMs: +(t2 - t).toFixed(1), withShadowMs: +(t3 - t2).toFixed(1), frameMs: +(performance.now() - t3).toFixed(1), ratio };
    },
  };
  apply(0, 0); r.shadowMap.needsUpdate = true; r.render(scene, cam);
  section.classList.add('is-live');
  live = true;
  loop();
}
