import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { rnd, radialDraw, linearDraw } from './textures.js';

// Grande Galerie simplificada. Medidas aproximadas, em metros.
export const BAYS = 10, BAY = 12, L = BAYS * BAY, W = 12, HW = W / 2, S = 8.2;

export function createGallery({ renderer, canvasTex, pmrem }) {
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const scene = new THREE.Scene();
  const FOG = 0xd8d0c2;
  scene.background = new THREE.Color(FOG);
  scene.fog = new THREE.Fog(FOG, 28, 115);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;

  scene.add(new THREE.HemisphereLight(0xfff6e8, 0x7a6450, 1.25));
  const sun = new THREE.DirectionalLight(0xfff1dc, 1.6);
  sun.position.set(3, 30, -40); sun.target.position.set(0, 0, -60);
  scene.add(sun, sun.target);

  // ---------- texturas ----------
  const floorTex = canvasTex(1024, 1024, (g, w, h) => {
    const cols = 8, cw = w / cols, ph = 32;
    for (let k = 0; k < cols; k++) {
      const s = k % 2 ? 1 : -1, x0 = k * cw;
      for (let y = -2 * cw; y < h + 2 * cw; y += ph) {
        g.fillStyle = `hsl(${rnd(24, 32)} ${rnd(26, 36)}% ${rnd(26, 36)}%)`;
        g.beginPath();
        g.moveTo(x0, y); g.lineTo(x0 + cw, y + cw * s * 0.5);
        g.lineTo(x0 + cw, y + cw * s * 0.5 + ph); g.lineTo(x0, y + ph); g.closePath();
        g.fill(); g.strokeStyle = 'rgba(30,18,10,.55)'; g.lineWidth = 1.5; g.stroke();
      }
    }
  }, [W / 2.4, L / 2.4]);

  const wallTex = canvasTex(512, 1024, (g, w, h) => {
    g.fillStyle = '#d9cfc0'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(${Math.random() < .5 ? '255,255,255' : '90,70,50'},.035)`; g.fillRect(rnd(0, w), rnd(0, h), rnd(2, 10), rnd(2, 10)); }
    const dado = h * (1.0 / S);
    g.fillStyle = '#8f8476'; g.fillRect(0, h - dado, w, dado);
    for (let i = 0; i < 40; i++) { g.strokeStyle = 'rgba(240,235,225,.12)'; g.lineWidth = rnd(1, 3); g.beginPath(); g.moveTo(rnd(0, w), h - dado); g.bezierCurveTo(rnd(0, w), h - dado * .6, rnd(0, w), h - dado * .3, rnd(0, w), h); g.stroke(); }
    g.fillStyle = '#5e554b'; g.fillRect(0, h - 14, w, 14);
    g.fillStyle = '#efe8dc'; g.fillRect(0, h - dado - 8, w, 8);
    // leve escurecimento perto do teto (oclusão falsa)
    const gr = g.createLinearGradient(0, 0, 0, h * .25);
    gr.addColorStop(0, 'rgba(70,55,40,.22)'); gr.addColorStop(1, 'rgba(70,55,40,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h * .25);
  }, [L / 4, 1]);

  function vaultDraw(emissive) {
    return (g, w, h) => {
      g.fillStyle = emissive ? '#000' : '#e8e1d4'; g.fillRect(0, 0, w, h);
      const sky0 = w * 0.36, sky1 = w * 0.64;
      if (!emissive) {
        const n = 6, rows = 4;
        for (const [a, b] of [[0, sky0 - 16], [sky1 + 16, w]]) {
          const cw = (b - a) / n, rh = h / rows;
          for (let i = 0; i < n; i++) for (let j = 0; j < rows; j++) {
            const x = a + i * cw + 8, y = j * rh + 10, ww = cw - 16, hh = rh - 20;
            g.fillStyle = '#d3c9b8'; g.fillRect(x, y, ww, hh);
            g.fillStyle = '#c2b6a2'; g.fillRect(x + 7, y + 7, ww - 14, hh - 14);
            g.fillStyle = '#ddd4c5'; g.beginPath(); g.arc(x + ww / 2, y + hh / 2, Math.min(ww, hh) * .16, 0, 7); g.fill();
          }
        }
        g.fillStyle = '#b9a98f'; g.fillRect(sky0 - 16, 0, 16, h); g.fillRect(sky1, 0, 16, h);
      }
      g.fillStyle = emissive ? '#fffaf0' : '#f4f2ec'; g.fillRect(sky0, 0, sky1 - sky0, h);
      g.strokeStyle = emissive ? '#3a3834' : '#8e8a82'; g.lineWidth = 5;
      for (let x = sky0; x <= sky1 + 1; x += (sky1 - sky0) / 4) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
      for (let y = 0; y <= h; y += h / 8) { g.beginPath(); g.moveTo(sky0, y); g.lineTo(sky1, y); g.stroke(); }
    };
  }
  const vaultMap = canvasTex(1024, 512, vaultDraw(false), [1, BAYS]);
  const vaultEm = canvasTex(1024, 512, vaultDraw(true), [1, BAYS]);

  const placeholderTex = canvasTex(512, 400, (g, w, h) => {
    g.fillStyle = '#ece6da'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1800; i++) { g.fillStyle = 'rgba(120,100,80,.05)'; g.fillRect(rnd(0, w), rnd(0, h), 1, rnd(2, 6)); }
    g.strokeStyle = 'rgba(110,95,80,.5)'; g.lineWidth = 3; g.setLineDash([12, 10]);
    g.strokeRect(24, 24, w - 48, h - 48);
    g.fillStyle = 'rgba(95,80,66,.75)'; g.font = '500 30px Inter, sans-serif'; g.textAlign = 'center';
    g.fillText('+ desenho', w / 2, h / 2 + 10);
  });

  const lightPool = canvasTex(256, 256, radialDraw('255,244,220', .2));
  const shadowBlob = canvasTex(256, 256, radialDraw('30,20,10', .5));
  const wallShadow = canvasTex(256, 8, linearDraw('30,20,10', .42));

  // ---------- materiais ----------
  const M = {
    floor: new THREE.MeshStandardMaterial({ map: floorTex, roughness: .42 }),
    wall: new THREE.MeshStandardMaterial({ map: wallTex, roughness: .9 }),
    vault: new THREE.MeshStandardMaterial({ map: vaultMap, emissiveMap: vaultEm, emissive: 0xffffff, emissiveIntensity: 1.6, roughness: .85, side: THREE.DoubleSide }),
    stone: new THREE.MeshStandardMaterial({ color: 0xe9e2d5, roughness: .55 }),
    marble: new THREE.MeshStandardMaterial({ color: 0xf1ece4, roughness: .28 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xb8913f, roughness: .32, metalness: .85 }),
    velvet: new THREE.MeshStandardMaterial({ color: 0x7d1424, roughness: .95 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x3a2618, roughness: .6 }),
    glow: new THREE.MeshBasicMaterial({ color: 0xfff3dc, fog: false })
  };
  const decal = (map, blending, fog = true) => new THREE.MeshBasicMaterial({
    map, transparent: true, depthWrite: false, blending, fog,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2
  });
  const D = {
    light: decal(lightPool, THREE.AdditiveBlending, false),
    blob: decal(shadowBlob, THREE.NormalBlending),
    wall: decal(wallShadow, THREE.NormalBlending)
  };
  const box = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); scene.add(o); return o; };
  const floorDecal = (mat, w, d, x, z, y = 0.01) => {
    const o = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    o.rotation.x = -Math.PI / 2; o.position.set(x, y, z); scene.add(o); return o;
  };

  // ---------- estrutura ----------
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, L), M.floor);
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, -L / 2); scene.add(floor);

  for (const s of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(L, S), M.wall);
    wall.rotation.y = s * -Math.PI / 2; wall.position.set(s * HW, S / 2, -L / 2); scene.add(wall);
    box(.36, .6, L, M.stone, s * (HW - .18), S - .3, -L / 2);
    box(.5, .16, L, M.stone, s * (HW - .25), S - .03, -L / 2);
    // sombra de contato ao longo da parede
    const ws = floorDecal(D.wall, 1.4, L, s * (HW - .7), -L / 2);
    ws.rotation.z = s > 0 ? Math.PI : 0;
  }

  const vaultGeo = new THREE.CylinderGeometry(HW, HW, L, 64, 1, true, Math.PI / 2, Math.PI);
  vaultGeo.rotateX(Math.PI / 2);
  const vault = new THREE.Mesh(vaultGeo, M.vault);
  vault.position.set(0, S, -L / 2); scene.add(vault);

  const archShape = new THREE.Shape();
  archShape.absarc(0, 0, HW - .02, 0, Math.PI, false);
  archShape.absarc(0, 0, HW - .62, Math.PI, 0, true);
  const archGeo = new THREE.ExtrudeGeometry(archShape, { depth: 2.2, bevelEnabled: false, curveSegments: 48 });
  archGeo.translate(0, 0, -1.1);

  const shaftGeo = new THREE.CylinderGeometry(.27, .31, 6.5, 24);
  const capGeo = new THREE.CylinderGeometry(.44, .3, .5, 24);
  for (let k = 1; k < BAYS; k++) {
    const z = -k * BAY;
    const arch = new THREE.Mesh(archGeo, M.stone); arch.position.set(0, S, z); scene.add(arch);
    for (const s of [-1, 1]) {
      box(.9, .62, 2.6, M.stone, s * (HW - .45), S - .31, z);
      floorDecal(D.blob, 2.4, 3.6, s * (HW - .5), z, 0.012);
      for (const dz of [-.72, .72]) {
        const x = s * (HW - .42), zz = z + dz;
        box(.8, .4, .8, M.marble, x, .2, zz);
        const sh = new THREE.Mesh(shaftGeo, M.marble); sh.position.set(x, 3.65, zz); scene.add(sh);
        const cp = new THREE.Mesh(capGeo, M.marble); cp.position.set(x, 7.15, zz); scene.add(cp);
        box(.86, .2, .86, M.marble, x, 7.5, zz);
      }
    }
  }

  // manchas de luz no piso sob cada claraboia
  for (let k = 0; k < BAYS; k++) floorDecal(D.light, 5.5, 9, -.6, -k * BAY - BAY / 2, 0.014);

  function endWall(z, facing) {
    const sh = new THREE.Shape();
    sh.moveTo(-HW, -.05); sh.lineTo(HW, -.05); sh.lineTo(HW, S);
    sh.absarc(0, S, HW, 0, Math.PI, false); sh.lineTo(-HW, -.05);
    const hole = new THREE.Path();
    hole.moveTo(-2, 0); hole.lineTo(2, 0); hole.lineTo(2, 5);
    hole.absarc(0, 5, 2, 0, Math.PI, false); hole.lineTo(-2, 0);
    sh.holes.push(hole);
    const mat = new THREE.MeshStandardMaterial({ color: 0xd6ccbc, roughness: .9 });
    const m = new THREE.Mesh(new THREE.ShapeGeometry(sh, 48), mat);
    m.position.z = z; m.rotation.y = facing > 0 ? 0 : Math.PI; scene.add(m);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(8, 9), M.glow);
    glow.position.set(0, 4, z - facing * 2.5); glow.rotation.y = m.rotation.y; scene.add(glow);
    for (const s of [-1, 1]) box(.5, 5, .7, M.stone, s * 2.25, 2.5, z + facing * .2);
    box(5, .4, .7, M.stone, 0, 7.3, z + facing * .2);
  }
  endWall(0, -1);
  endWall(-L, 1);

  const benchZ = [];
  for (let k = 1; k < BAYS; k += 2) {
    const z = -k * BAY - BAY / 2; benchZ.push(z);
    box(3, .1, .9, M.wood, 0, .08, z);
    box(2.8, .34, .8, M.velvet, 0, .3, z);
    floorDecal(D.blob, 4.2, 2, 0, z, 0.013);
  }

  // ---------- quadros ----------
  const slots = [];
  function buildFrame(slot, w, h) {
    slot.group.clear();
    const t = .13, d = .09;
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(w, h), slot.mat);
    pic.position.z = .03; pic.userData.slot = slot; slot.pic = pic; slot.group.add(pic);
    const bars = [[w + 2 * t, t, 0, h / 2 + t / 2], [w + 2 * t, t, 0, -h / 2 - t / 2], [t, h, w / 2 + t / 2, 0], [t, h, -w / 2 - t / 2, 0]];
    for (const [bw, bh, x, y] of bars) { const b = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, d), M.gold); b.position.set(x, y, d / 2); slot.group.add(b); }
  }
  for (let k = 0; k < BAYS; k++) for (const dz of [-2.3, 2.3]) for (const s of [-1, 1]) {
    const group = new THREE.Group();
    group.position.set(s * (HW - .02), 3.3, -k * BAY - BAY / 2 + dz);
    group.rotation.y = s * -Math.PI / 2;
    scene.add(group);
    const slot = { group, mat: new THREE.MeshStandardMaterial({ map: placeholderTex, roughness: .8 }), filled: false };
    buildFrame(slot, 2.2, 1.7); slots.push(slot);
  }

  function loadInto(slot, file) {
    return new Promise(res => {
      const img = new Image();
      img.onload = () => {
        const tex = new THREE.Texture(img); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = maxAniso; tex.needsUpdate = true;
        const a = img.width / img.height, mw = 2.6, mh = 2.0;
        let w = mw, h = mw / a; if (h > mh) { h = mh; w = mh * a; }
        slot.mat = new THREE.MeshStandardMaterial({ map: tex, roughness: .85 }); slot.filled = true;
        buildFrame(slot, w, h); res(true);
      };
      img.onerror = () => res(false);
      img.src = URL.createObjectURL(file);
    });
  }

  async function loadMany(files, camPos) {
    const free = slots.filter(s => !s.filled).sort((a, b) =>
      a.group.position.distanceToSquared(camPos) - b.group.position.distanceToSquared(camPos));
    const list = free.length ? free : slots.slice();
    let n = 0;
    for (let i = 0; i < files.length && i < list.length; i++) if (await loadInto(list[i], files[i])) n++;
    return n;
  }

  const clampZ = z => Math.max(-L + 1.2, Math.min(-1.2, z));

  return {
    id: 'gallery', name: 'Grande Galerie', scene,
    near: 0.05, far: 260, exposure: 1.05, walk: 3.2, run: 7,
    picks: () => slots.map(s => s.pic),
    loadInto, loadMany,
    constrain(p) {
      p.x = Math.max(-HW + .9, Math.min(HW - .9, p.x));
      p.z = clampZ(p.z);
      for (const bz of benchZ) {
        const dx = p.x, dz = p.z - bz;
        if (Math.abs(dx) < 1.9 && Math.abs(dz) < .9) {
          if (1.9 - Math.abs(dx) < .9 - Math.abs(dz)) p.x = Math.sign(dx || 1) * 1.9;
          else p.z = bz + Math.sign(dz || 1) * .9;
        }
      }
    },
    hotspot(p) {
      if (p.z > -4.5) return { label: 'Sair para a Cour Napoléon', go: 'pyramid' };
      return null;
    },
    status(p) {
      const f = -p.z / L, bay = Math.min(BAYS, Math.floor(f * BAYS) + 1);
      return { text: `Vão ${bay} de ${BAYS}, ${Math.round(-p.z)} m de ${L} m`, progress: f };
    },
    jumpZ: f => clampZ(-f * L)
  };
}
