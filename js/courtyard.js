import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { rnd, radialDraw } from './textures.js';

// Cour Napoléon simplificada. Origem no centro da pirâmide.
// +x = leste (ala Sully), -z = norte (ala Richelieu), +z = sul (ala Denon).
// Pirâmide: base ~35 m, altura ~21,6 m. O resto do pátio é aproximado.
export const PYR = { base: 35.4, h: 21.6, x: 0, z: 0 };
const N_IN = -62, S_IN = 62, E_IN = 52, WEST_END = -120;

export function createCourtyard({ renderer, canvasTex, pmrem }) {
  const scene = new THREE.Scene();
  const FOG = 0xcdd8e2;
  scene.fog = new THREE.Fog(FOG, 160, 720);

  // ---------- céu e sol ----------
  const sunDir = new THREE.Vector3(-0.55, 0.62, 0.56).normalize();
  const sky = new Sky(); sky.scale.setScalar(5000);
  const u = sky.material.uniforms;
  u.turbidity.value = 5; u.rayleigh.value = 1.4; u.mieCoefficient.value = .005; u.mieDirectionalG.value = .8;
  u.sunPosition.value.copy(sunDir);
  scene.add(sky);
  const envScene = new THREE.Scene(); const sky2 = new Sky(); sky2.scale.setScalar(5000);
  sky2.material.uniforms.sunPosition.value.copy(sunDir);
  for (const k of ['turbidity', 'rayleigh', 'mieCoefficient', 'mieDirectionalG']) sky2.material.uniforms[k].value = u[k].value;
  envScene.add(sky2);
  scene.environment = pmrem.fromScene(envScene).texture;
  scene.environmentIntensity = 0.22;

  scene.add(new THREE.HemisphereLight(0xdfeaff, 0x8a7b66, 0.9));
  const sun = new THREE.DirectionalLight(0xfff0d8, 3.2);
  sun.position.copy(sunDir).multiplyScalar(220);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -170, right: 170, top: 170, bottom: -170, near: 10, far: 520 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.6;
  scene.add(sun, sun.target);

  // ---------- texturas ----------
  const paving = canvasTex(512, 512, (g, w, h) => {
    const n = 8, c = w / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      g.fillStyle = `hsl(${rnd(36, 42)} ${rnd(12, 20)}% ${rnd(70, 78)}%)`;
      g.fillRect(i * c, j * c, c, c);
      g.strokeStyle = 'rgba(80,70,55,.35)'; g.lineWidth = 2; g.strokeRect(i * c, j * c, c, c);
    }
    for (let i = 0; i < 3000; i++) { g.fillStyle = 'rgba(90,80,60,.05)'; g.fillRect(rnd(0, w), rnd(0, h), 2, 2); }
  }, [900 / 8, 900 / 8]);

  // Fachada: 1 tile = um vão de 6 m de largura por 20 m de altura.
  const PX = 64;
  const facadeDraw = (g, w, h) => {
    const m = v => v * PX, Y = v => h - m(v);   // v em metros a partir do chão
    g.fillStyle = '#d9ccb2'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(${Math.random() < .5 ? '255,250,240' : '110,90,60'},.05)`; g.fillRect(rnd(0, w), rnd(0, h), rnd(2, 6), rnd(2, 6)); }
    // térreo com rusticação
    g.strokeStyle = 'rgba(110,95,70,.45)'; g.lineWidth = 2;
    for (let y = 0.5; y < 6; y += 0.55) { g.beginPath(); g.moveTo(0, Y(y)); g.lineTo(w, Y(y)); g.stroke(); }
    // pilastras nas bordas do vão
    g.fillStyle = '#e6dbc4'; g.fillRect(0, Y(18), m(.55), m(12)); g.fillRect(w - m(.55), Y(18), m(.55), m(12));
    g.fillStyle = 'rgba(100,85,60,.25)'; g.fillRect(m(.55), Y(18), 3, m(12)); g.fillRect(w - m(.55) - 3, Y(18), 3, m(12));
    const glass = '#3b4754', frame = '#efe6d3';
    // janela em arco no térreo
    const arch = (cx, y0, ww, hh) => {
      const r = ww / 2;
      g.fillStyle = frame; g.beginPath();
      g.moveTo(cx - r - 8, Y(y0)); g.lineTo(cx - r - 8, Y(y0) - hh + r); g.arc(cx, Y(y0) - hh + r, r + 8, Math.PI, 0); g.lineTo(cx + r + 8, Y(y0)); g.fill();
      g.fillStyle = glass; g.beginPath();
      g.moveTo(cx - r, Y(y0)); g.lineTo(cx - r, Y(y0) - hh + r); g.arc(cx, Y(y0) - hh + r, r, Math.PI, 0); g.lineTo(cx + r, Y(y0)); g.fill();
      g.strokeStyle = 'rgba(230,220,200,.6)'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, Y(y0)); g.lineTo(cx, Y(y0) - hh + r); g.stroke();
    };
    arch(w / 2, 0.6, m(2.6), m(4.4));
    // cordão
    g.fillStyle = '#ebe1cc'; g.fillRect(0, Y(6.3), w, m(.35)); g.fillStyle = 'rgba(90,75,55,.35)'; g.fillRect(0, Y(5.95), w, 4);
    // andar nobre com frontão
    const rect = (cx, y0, ww, hh) => {
      g.fillStyle = frame; g.fillRect(cx - ww / 2 - 8, Y(y0) - hh - 8, ww + 16, hh + 16);
      g.fillStyle = glass; g.fillRect(cx - ww / 2, Y(y0) - hh, ww, hh);
      g.strokeStyle = 'rgba(230,220,200,.6)'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(cx, Y(y0)); g.lineTo(cx, Y(y0) - hh); g.moveTo(cx - ww / 2, Y(y0) - hh * .62); g.lineTo(cx + ww / 2, Y(y0) - hh * .62); g.stroke();
    };
    rect(w / 2, 7.4, m(2.2), m(4.3));
    g.fillStyle = '#efe6d3'; g.beginPath();
    g.moveTo(w / 2 - m(1.6), Y(12.1)); g.lineTo(w / 2, Y(13.1)); g.lineTo(w / 2 + m(1.6), Y(12.1)); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(100,85,60,.4)'; g.lineWidth = 2; g.stroke();
    // segundo andar
    g.fillStyle = '#ebe1cc'; g.fillRect(0, Y(13.7), w, m(.3));
    rect(w / 2, 14.3, m(1.9), m(2.9));
    // entablamento e cornija
    g.fillStyle = '#e8ddc7'; g.fillRect(0, Y(20), w, m(1.9));
    g.fillStyle = 'rgba(90,75,55,.4)'; g.fillRect(0, Y(18.1), w, 4); g.fillRect(0, Y(19.3), w, 3);
    g.fillStyle = 'rgba(80,65,45,.5)'; g.fillRect(0, Y(20) , w, 5);
  };
  const facadeTex = (len, hgt = 20) => {
    const t = canvasTex(384, 1280, facadeDraw);
    t.repeat.set(len / 6, hgt / 20 > 1.05 ? 1 : 1);
    return t;
  };
  const shadowBlob = canvasTex(256, 256, radialDraw('20,25,30', .45));

  // ---------- materiais ----------
  const M = {
    ground: new THREE.MeshStandardMaterial({ map: paving, roughness: .85 }),
    stone: new THREE.MeshStandardMaterial({ color: 0xd9ccb2, roughness: .8 }),
    roof: new THREE.MeshStandardMaterial({ color: 0x55606b, roughness: .55, metalness: .35 }),
    rim: new THREE.MeshStandardMaterial({ color: 0x9a948a, roughness: .5 }),
    water: new THREE.MeshStandardMaterial({ color: 0x1e3340, roughness: .04, metalness: .7 }),
    glass: new THREE.MeshStandardMaterial({ color: 0xa9bcc8, roughness: .04, metalness: .95, transparent: true, opacity: .32, side: THREE.DoubleSide, depthWrite: false }),
    steel: new THREE.MeshStandardMaterial({ color: 0x3a3f44, roughness: .4, metalness: .8 }),
    lattice: new THREE.LineBasicMaterial({ color: 0x3c4449, transparent: true, opacity: .7 })
  };
  const add = (o, cast = true, recv = true) => { o.castShadow = cast; o.receiveShadow = recv; scene.add(o); return o; };
  const box = (x0, x1, y0, y1, z0, z1, m = M.stone) => {
    const o = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), m);
    o.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); return add(o);
  };
  // fachada texturizada: plano levemente à frente da face do bloco
  function facade(len, hgt, x, z, rotY) {
    const mat = new THREE.MeshStandardMaterial({ map: facadeTex(len), roughness: .85 });
    const o = new THREE.Mesh(new THREE.PlaneGeometry(len, hgt), mat);
    o.position.set(x, hgt / 2, z); o.rotation.y = rotY; return add(o, false, true);
  }
  // telhado mansarda ao longo de um eixo
  function mansard(len, depth, y, cx, cz, alongX, rise = 9, inset = 4.5) {
    const sh = new THREE.Shape();
    sh.moveTo(-depth / 2, 0); sh.lineTo(depth / 2, 0); sh.lineTo(depth / 2 - inset, rise); sh.lineTo(-depth / 2 + inset, rise); sh.closePath();
    const geo = new THREE.ExtrudeGeometry(sh, { depth: len, bevelEnabled: false });
    geo.translate(0, 0, -len / 2);
    if (alongX) geo.rotateY(Math.PI / 2);
    const o = new THREE.Mesh(geo, M.roof); o.position.set(cx, y, cz); return add(o);
  }
  // telhado de pavilhão: tronco de pirâmide quadrada
  function pavRoof(halfX, halfZ, y, cx, cz, h, topScale = .3) {
    const geo = new THREE.CylinderGeometry(Math.SQRT2 * topScale, Math.SQRT2, h, 4, 1);
    geo.rotateY(Math.PI / 4); geo.scale(halfX, 1, halfZ); geo.translate(0, h / 2, 0);
    const o = new THREE.Mesh(geo, M.roof); o.position.set(cx, y, cz); return add(o);
  }
  function cornice(x0, x1, z0, z1, y) { box(x0 - .6, x1 + .6, y, y + .7, z0 - .6, z1 + .6, M.stone); }

  // ---------- chão ----------
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), M.ground);
  ground.rotation.x = -Math.PI / 2; ground.position.x = -150; add(ground, false, true);

  // ---------- alas ----------
  const WING = 25, H = 20;
  // Norte (Richelieu) e Sul (Denon)
  for (const s of [-1, 1]) {
    const zin = s < 0 ? N_IN : S_IN, zout = zin + s * WING;
    const z0 = Math.min(zin, zout), z1 = Math.max(zin, zout), zc = (z0 + z1) / 2;
    box(WEST_END, E_IN + WING, 0, H, z0, z1);
    cornice(WEST_END, E_IN + WING, z0, z1, H);
    mansard(E_IN + WING - WEST_END, WING, H + .7, (WEST_END + E_IN + WING) / 2, zc, true);
    facade(E_IN - WEST_END, H, (WEST_END + E_IN) / 2, zin - s * .12, s < 0 ? 0 : Math.PI);
    facade(WING, H, WEST_END - .12, zc, -Math.PI / 2);
    // pavilhão central de cada ala, avançando sobre o pátio
    const pzIn = s < 0 ? zin + 4 : zin - 4;
    const pzMin = Math.min(pzIn, zout), pzMax = Math.max(pzIn, zout);
    box(-46, -14, 0, 24, pzMin, pzMax);
    cornice(-46, -14, pzMin, pzMax, 24);
    pavRoof(16, (pzMax - pzMin) / 2, 24.7, -30, (pzMin + pzMax) / 2, 13, .35);
    facade(32, 24, -30, pzIn - s * .12, s < 0 ? 0 : Math.PI);
  }
  // Leste (Sully)
  box(E_IN, E_IN + WING, 0, H, N_IN, S_IN);
  cornice(E_IN, E_IN + WING, N_IN, S_IN, H);
  mansard(S_IN - N_IN, WING, H + .7, E_IN + WING / 2, 0, false);
  facade(S_IN - N_IN, H, E_IN - .12, 0, -Math.PI / 2);
  // pavilhões de canto (mais altos, sem avançar sobre o pátio)
  for (const s of [-1, 1]) {
    const z0 = s < 0 ? N_IN - WING - 3 : S_IN - 2, z1 = s < 0 ? N_IN + 2 : S_IN + WING + 3;
    box(E_IN + .5, E_IN + WING + 3, 0, 23, z0, z1);
    pavRoof((WING + 2.5) / 2, (z1 - z0) / 2, 23, E_IN + .5 + (WING + 2.5) / 2, (z0 + z1) / 2, 12, .4);
  }
  // Pavillon de l'Horloge, no centro da ala Sully
  box(E_IN - 7, E_IN + WING + 2, 0, 27, -15, 15);
  cornice(E_IN - 7, E_IN + WING + 2, -15, 15, 27);
  facade(30, 27, E_IN - 7 - .12, 0, -Math.PI / 2);
  pavRoof(17, 15.5, 27.7, E_IN + WING / 2 - 2.5, 0, 17, .22);
  box(E_IN + 6, E_IN + 13, 44.7, 49, -3.5, 3.5, M.roof);
  const spire = new THREE.Mesh(new THREE.ConeGeometry(2.4, 6, 4), M.roof);
  spire.rotation.y = Math.PI / 4; spire.position.set(E_IN + 9.5, 52, 0); add(spire);
  // relógio (disco)
  const clock = new THREE.Mesh(new THREE.CircleGeometry(2.2, 40), new THREE.MeshStandardMaterial({ color: 0x2c3a46, metalness: .5, roughness: .4 }));
  clock.position.set(E_IN - 7.2, 23.5, 0); clock.rotation.y = -Math.PI / 2; add(clock, false, false);
  const ring = new THREE.Mesh(new THREE.RingGeometry(2.2, 2.6, 40), new THREE.MeshStandardMaterial({ color: 0xc9a54e, metalness: .9, roughness: .3 }));
  ring.position.copy(clock.position).x -= .01; ring.rotation.y = -Math.PI / 2; add(ring, false, false);

  // águas-furtadas nos telhados voltados para o pátio
  const dormerGeo = new THREE.BoxGeometry(1.8, 2.6, 1.8);
  const dormerPos = [];
  for (let x = WEST_END + 4; x < E_IN - 2; x += 6) {
    if (x > -48 && x < -12) continue;
    dormerPos.push([x, N_IN - 1.6, 0], [x, S_IN + 1.6, Math.PI]);
  }
  for (let z = N_IN + 10; z < S_IN - 8; z += 6) { if (Math.abs(z) < 17) continue; dormerPos.push([E_IN + 1.6, z, -Math.PI / 2]); }
  const dormers = new THREE.InstancedMesh(dormerGeo, M.stone, dormerPos.length);
  const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1);
  dormerPos.forEach(([x, z, r], i) => {
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), r);
    mtx.compose(new THREE.Vector3(x, H + 2.4, z), q, one); dormers.setMatrixAt(i, mtx);
  });
  add(dormers);

  // ---------- pirâmide ----------
  function pyramid(cx, cz, base, h, withLattice) {
    const a = base / 2, P = new THREE.Vector3(cx, h, cz);
    const C = [[-a, -a], [a, -a], [a, a], [-a, a]].map(([x, z]) => new THREE.Vector3(cx + x, 0.02, cz + z));
    const pos = [];
    for (let i = 0; i < 4; i++) { const A = C[i], B = C[(i + 1) % 4]; pos.push(A.x, A.y, A.z, B.x, B.y, B.z, P.x, P.y, P.z); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.computeVertexNormals();
    const glass = new THREE.Mesh(geo, M.glass); glass.renderOrder = 2; add(glass, false, false);
    const r = base > 20 ? .16 : .08;
    for (let i = 0; i < 4; i++) { beam(C[i], P, r); beam(C[i], C[(i + 1) % 4], r); }
    if (withLattice) {
      const N = 18, seg = [];
      const push = (u, v) => seg.push(u.x, u.y, u.z, v.x, v.y, v.z);
      for (let i = 0; i < 4; i++) {
        const A = C[i], B = C[(i + 1) % 4];
        for (let k = 1; k < N; k++) {
          const s = k / N;
          const a0 = A.clone().lerp(B, s); push(a0, a0.clone().add(P.clone().sub(A).multiplyScalar(1 - s)));
          const b0 = B.clone().lerp(A, s); push(b0, b0.clone().add(P.clone().sub(B).multiplyScalar(1 - s)));
        }
      }
      const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(seg, 3));
      const lines = new THREE.LineSegments(lg, M.lattice); lines.renderOrder = 3; scene.add(lines);
    }
    const blob = new THREE.Mesh(new THREE.PlaneGeometry(base * 1.5, base * 1.5), new THREE.MeshBasicMaterial({ map: shadowBlob, transparent: true, depthWrite: false }));
    blob.rotation.x = -Math.PI / 2; blob.position.set(cx, .03, cz); scene.add(blob);
  }
  function beam(a, b, r) {
    const len = a.distanceTo(b);
    const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 6), M.steel);
    o.position.copy(a).add(b).multiplyScalar(.5);
    o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    add(o, true, false);
  }
  pyramid(PYR.x, PYR.z, PYR.base, PYR.h, true);

  // pirâmides menores e espelhos d'água (layout aproximado)
  const smalls = [], pools = [];
  const sides = [ // [ux, uz, wx, wz]: eixo ao longo do lado e eixo para fora
    [1, 0, 0, -1], [1, 0, 0, 1], [0, 1, 1, 0]
  ];
  const toW = ([ux, uz, wx, wz], u, w) => [PYR.x + ux * u + wx * w, PYR.z + uz * u + wz * w];
  for (const sd of sides) {
    const [sx, sz] = toW(sd, 0, 31); smalls.push([sx, sz]); pyramid(sx, sz, 7.6, 4.8, false);
    for (const m of [-1, 1]) pools.push([toW(sd, 8 * m, 23), toW(sd, 31 * m, 23), toW(sd, 8 * m, 41)]);
  }
  pools.push([toW([0, 1, -1, 0], -14, 26), toW([0, 1, -1, 0], -30, 26), toW([0, 1, -1, 0], -14, 40)]);
  pools.push([toW([0, 1, -1, 0], 14, 26), toW([0, 1, -1, 0], 30, 26), toW([0, 1, -1, 0], 14, 40)]);
  for (const tri of pools) {
    const sh = new THREE.Shape(tri.map(([x, z]) => new THREE.Vector2(x, -z)));
    const c = tri.reduce((acc, [x, z]) => [acc[0] + x / 3, acc[1] + z / 3], [0, 0]);
    const inner = tri.map(([x, z]) => new THREE.Vector2(c[0] + (x - c[0]) * .9, -(c[1] + (z - c[1]) * .9)));
    const rimShape = new THREE.Shape(sh.getPoints()); rimShape.holes.push(new THREE.Path(inner));
    const rim = new THREE.Mesh(new THREE.ExtrudeGeometry(rimShape, { depth: .5, bevelEnabled: false }), M.rim);
    rim.rotation.x = -Math.PI / 2; add(rim, false, true);
    const water = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(inner)), M.water);
    water.rotation.x = -Math.PI / 2; water.position.y = .32; add(water, false, true);
  }

  // ---------- colisão ----------
  const inTri = (px, pz, [[ax, az], [bx, bz], [cx, cz]]) => {
    const d1 = (px - bx) * (az - bz) - (ax - bx) * (pz - bz);
    const d2 = (px - cx) * (bz - cz) - (bx - cx) * (pz - cz);
    const d3 = (px - ax) * (cz - az) - (cx - ax) * (pz - az);
    return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
  };
  const blocked = (x, z) => {
    const m = PYR.base / 2 + .8;
    if (Math.abs(x - PYR.x) < m && Math.abs(z - PYR.z) < m) return true;
    for (const [sx, sz] of smalls) if (Math.abs(x - sx) < 4.6 && Math.abs(z - sz) < 4.6) return true;
    for (const t of pools) if (inTri(x, z, t)) return true;
    // pavilhões que avançam sobre o pátio
    if (x > -47 && x < -13 && (z < N_IN + 5 || z > S_IN - 5)) return true;
    if (x > E_IN - 8 && Math.abs(z) < 16) return true;
    return false;
  };

  return {
    id: 'courtyard', name: 'Cour Napoléon', scene,
    near: 0.3, far: 12000, exposure: 0.75, walk: 4.5, run: 14,
    picks: () => [],
    constrain(p, prev) {
      p.x = Math.max(-320, Math.min(E_IN - 1.2, p.x));
      p.z = Math.max(N_IN + 1.2, Math.min(S_IN - 1.2, p.z));
      if (blocked(p.x, p.z)) {
        if (!blocked(prev.x, p.z)) p.x = prev.x;
        else if (!blocked(p.x, prev.z)) p.z = prev.z;
        else { p.x = prev.x; p.z = prev.z; }
      }
    },
    hotspot(p) {
      const d = Math.hypot(p.x - PYR.x, p.z - PYR.z);
      if (d < 28) return { label: 'Entrar pela pirâmide', go: 'gallery-start' };
      return null;
    },
    status() { return { text: 'Cour Napoléon, pátio da pirâmide', progress: null }; }
  };
}
