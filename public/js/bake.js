// Merge every static mesh (and its ink lines / outlines) under a group into a
// few large meshes — one per material — so a busy scene costs a handful of
// draw calls instead of hundreds. Subtrees flagged userData.keep stay live.
import { THREE } from './fs3d.js';
import { mergeGeometries } from '/vendor/BufferGeometryUtils.js';

export function bake(root) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const buckets = new Map();
  const victims = [];
  const m4 = new THREE.Matrix4();
  (function walk(o) {
    if (o !== root && o.userData.keep) return;
    const mat = o.material;
    const mergeable = (o.isMesh || o.isLineSegments) && !o.isInstancedMesh && mat && !Array.isArray(mat) && !mat.map && !(mat.transparent && !o.isLineSegments);
    if (mergeable) {
      const key = mat.uuid + (o.isLineSegments ? 'L' : 'M') + (o.castShadow ? 'c' : '') + (o.receiveShadow ? 'r' : '');
      if (!buckets.has(key)) buckets.set(key, { mat, line: !!o.isLineSegments, cast: o.castShadow, recv: o.receiveShadow, geos: [], hull: !!o.userData.isHull });
      m4.multiplyMatrices(inv, o.matrixWorld);
      let g = o.geometry.clone();
      for (const name of Object.keys(g.attributes)) if (name !== 'position' && name !== 'normal') g.deleteAttribute(name);
      if (g.index) g = g.toNonIndexed();
      if (!o.isLineSegments && !g.attributes.normal) g.computeVertexNormals();
      g.applyMatrix4(m4);
      buckets.get(key).geos.push(g);
      victims.push(o);
    }
    o.children.slice().forEach(walk);
  })(root);
  // detach merged originals (their children were merged too, unless kept)
  for (const o of victims) {
    const keepKids = o.children.filter((c) => c.userData.keep || !victims.includes(c));
    if (o.parent) { keepKids.forEach((c) => { c.applyMatrix4(o.matrixWorld); c.applyMatrix4(inv); root.add(c); }); o.parent.remove(o); }
  }
  for (const b of buckets.values()) {
    const geo = b.geos.length === 1 ? b.geos[0] : mergeGeometries(b.geos, false);
    if (!geo) continue;
    const obj = b.line ? new THREE.LineSegments(geo, b.mat) : new THREE.Mesh(geo, b.mat);
    obj.castShadow = b.cast; obj.receiveShadow = b.recv;
    obj.userData.baked = true; obj.userData.isHull = b.hull;
    obj.matrixAutoUpdate = false;
    root.add(obj);
    b.geos.forEach((g) => g !== geo && g.dispose());
  }
  return root;
}
