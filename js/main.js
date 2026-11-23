import * as THREE from 'three';
import { textureFactory } from './textures.js';
import { Controls } from './controls.js';
import { createGallery, L } from './gallery.js';
import { createCourtyard } from './courtyard.js';

const $ = id => document.getElementById(id);
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.setSize(innerWidth, innerHeight, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const ctx = { renderer, canvasTex: textureFactory(renderer), pmrem: new THREE.PMREMGenerator(renderer) };
const worlds = { gallery: createGallery(ctx), courtyard: createCourtyard(ctx) };

const camera = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, 0.05, 260);
const EYE = 1.65, V = (x, z) => new THREE.Vector3(x, EYE, z);

// Destinos do mapa. yaw 0 = olhando para o norte do pátio / para o fundo da galeria.
const PLACES = {
  arrival:   { world: 'courtyard', label: 'Chegada à Cour Napoléon', pos: V(-100, 0), yaw: -Math.PI / 2, pitch: .08 },
  pyramid:   { world: 'courtyard', label: 'Ao pé da pirâmide', pos: V(-26.5, 6), yaw: -Math.PI / 2 + .12, pitch: .34 },
  horloge:   { world: 'courtyard', label: "Pavillon de l'Horloge", pos: V(18, 0), yaw: -Math.PI / 2, pitch: .3 },
  richelieu: { world: 'courtyard', label: 'Ala Richelieu', pos: V(-55, -25), yaw: 0, pitch: .2 },
  denon:     { world: 'courtyard', label: 'Ala Denon', pos: V(-55, 25), yaw: Math.PI, pitch: .2 },
  pools:     { world: 'courtyard', label: "Espelhos d'água", pos: V(-2, 52), yaw: 0, pitch: .12 },
  'gallery-start': { world: 'gallery', label: 'Início da Grande Galerie', pos: V(0, -6), yaw: 0, pitch: 0 },
  'gallery-mid':   { world: 'gallery', label: 'Meio da Grande Galerie', pos: V(0, -L / 2), yaw: 0, pitch: 0 },
  'gallery-end':   { world: 'gallery', label: 'Fim da Grande Galerie', pos: V(3, -L + 2), yaw: Math.PI, pitch: 0 }
};

let world = null, hot = null;
const controls = new Controls(canvas, camera, { onTap, cross: $('cross'), joy: $('joy'), knob: $('knob') });

function goTo(id) {
  const p = PLACES[id]; if (!p) return;
  world = worlds[p.world];
  camera.near = world.near; camera.far = world.far; camera.updateProjectionMatrix();
  renderer.toneMappingExposure = world.exposure;
  controls.setView(p.pos, p.yaw, p.pitch);
  document.body.dataset.world = world.id;
  $('title').textContent = world.name;
  lastStatus = '';
  for (const b of document.querySelectorAll('[data-place]')) b.classList.toggle('here', b.dataset.place === id);
}

// ---------- toque em quadros ----------
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
let target = null;
function onTap(x, y, { fromLock, type }) {
  const picks = world.picks();
  if (picks.length) {
    ndc.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera); ray.far = 14;
    const hit = ray.intersectObjects(picks, false)[0];
    if (hit) { target = hit.object.userData.slot; controls.unlock(); $('fileOne').value = ''; $('fileOne').click(); return; }
  }
  if (!fromLock && type === 'mouse') controls.lock();
}
$('fileOne').addEventListener('change', async e => {
  const f = e.target.files[0];
  if (f && target && await worlds.gallery.loadInto(target, f)) toast('Desenho colocado');
});
$('addBtn').addEventListener('click', () => { $('fileMany').value = ''; $('fileMany').click(); });
$('fileMany').addEventListener('change', async e => {
  const files = [...e.target.files]; if (!files.length) return;
  if (world.id !== 'gallery') goTo('gallery-start');
  const n = await worlds.gallery.loadMany(files, camera.position);
  toast(n === 1 ? '1 desenho pendurado perto de você' : `${n} desenhos pendurados perto de você`);
});

// ---------- planta da galeria ----------
const plan = $('plan');
plan.innerHTML = Array.from({ length: 9 }, (_, i) => `<i style="left:${(i + 1) * 10}%"></i>`).join('') + '<b id="dot"></b>';
plan.addEventListener('click', e => {
  if (world.id !== 'gallery') return;
  const r = plan.getBoundingClientRect();
  camera.position.set(0, EYE, world.jumpZ((e.clientX - r.left) / r.width));
});

// ---------- mapa ----------
function openMap() { controls.unlock(); controls.enabled = false; $('map').hidden = false; $('mapClose').focus(); }
function closeMap() { $('map').hidden = true; controls.enabled = true; canvas.focus(); }
$('mapBtn').addEventListener('click', openMap);
$('mapClose').addEventListener('click', closeMap);
$('map').addEventListener('click', e => { if (e.target.id === 'map') closeMap(); });
for (const el of document.querySelectorAll('[data-place]')) {
  el.addEventListener('click', () => { goTo(el.dataset.place); closeMap(); toast(PLACES[el.dataset.place].label); });
  el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); } });
}
addEventListener('keydown', e => {
  if (e.code === 'KeyM' && $('intro').style.display === 'none') { $('map').hidden ? openMap() : closeMap(); }
  if (e.code === 'Escape' && !$('map').hidden) closeMap();
  if (e.code === 'KeyE' && hot) $('hotBtn').click();
});

// ---------- hotspot (entrar/sair) ----------
$('hotBtn').addEventListener('click', () => { if (hot) { const go = hot.go; goTo(go); toast(PLACES[go].label); } });

// ---------- interface ----------
$('goBtn').addEventListener('click', () => { $('intro').style.display = 'none'; canvas.focus(); });
$('helpBtn').addEventListener('click', () => { $('intro').style.display = 'grid'; });
$('minBtn').addEventListener('click', () => $('card').classList.add('min'));
$('maxBtn').addEventListener('click', () => $('card').classList.remove('min'));
let toastT;
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2200); }
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight, false);
});

// ---------- loop ----------
const clock = new THREE.Clock(), dot = $('dot'), where = $('where'), hotBtn = $('hotBtn');
let lastStatus = '';
function frame() {
  const dt = Math.min(clock.getDelta(), .05);
  controls.update(dt, world);
  const st = world.status(camera.position);
  if (st.text !== lastStatus) { where.textContent = st.text; lastStatus = st.text; }
  if (st.progress !== null) dot.style.left = (st.progress * 100) + '%';
  const h = world.hotspot(camera.position);
  if ((h && h.label) !== (hot && hot.label)) {
    hot = h; hotBtn.hidden = !h; if (h) hotBtn.textContent = h.label;
  }
  renderer.render(world.scene, camera);
  requestAnimationFrame(frame);
}

goTo('arrival');
window.__ok = true;
$('load').remove();
frame();
