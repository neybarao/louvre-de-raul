import * as THREE from 'three';

export const rnd = (a, b) => a + Math.random() * (b - a);

// Cria texturas a partir de um canvas desenhado em código.
export function textureFactory(renderer) {
  const aniso = renderer.capabilities.getMaxAnisotropy();
  return function canvasTex(w, h, draw, repeat, srgb = true) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = aniso;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    if (repeat) t.repeat.set(repeat[0], repeat[1]);
    return t;
  };
}

// Mancha radial (luz ou sombra), usada como decalque no chão.
export function radialDraw(rgb, a0, a1 = 0) {
  return (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    gr.addColorStop(0, `rgba(${rgb},${a0})`);
    gr.addColorStop(1, `rgba(${rgb},${a1})`);
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  };
}

// Degradê linear de um lado ao outro (sombra de contato junto às paredes).
export function linearDraw(rgb, a0, a1 = 0) {
  return (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, 0);
    gr.addColorStop(0, `rgba(${rgb},${a0})`);
    gr.addColorStop(1, `rgba(${rgb},${a1})`);
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  };
}
