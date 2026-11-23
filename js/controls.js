// Controles em primeira pessoa: teclado + mouse (pointer lock) e toque (joystick + arrastar).
export class Controls {
  constructor(canvas, camera, { onTap, cross, joy, knob }) {
    this.canvas = canvas; this.camera = camera; this.onTap = onTap;
    this.cross = cross; this.joy = joy; this.knob = knob;
    this.yaw = 0; this.pitch = 0; this.locked = false; this.enabled = true;
    this.keys = {}; this.move = { x: 0, y: 0 };
    this.joyId = null; this.joyO = null; this.looks = new Map();
    camera.rotation.order = 'YXZ';

    addEventListener('keydown', e => { this.keys[e.code] = true; });
    addEventListener('keyup', e => { this.keys[e.code] = false; });
    addEventListener('blur', () => { this.keys = {}; });
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === canvas;
      cross.style.display = this.locked ? 'block' : 'none';
    });
    canvas.addEventListener('pointerdown', e => this.down(e));
    canvas.addEventListener('pointermove', e => this.moveP(e));
    canvas.addEventListener('pointerup', e => this.up(e));
    canvas.addEventListener('pointercancel', e => this.up(e));
  }

  down(e) {
    this.canvas.focus();
    const p = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now(), type: e.pointerType };
    if (e.pointerType === 'touch' && this.joyId === null && e.clientX < innerWidth * 0.42 && e.clientY > innerHeight * 0.35) {
      this.joyId = e.pointerId; this.joyO = p;
      Object.assign(this.joy.style, { left: p.x + 'px', top: p.y + 'px', display: 'block' });
    } else this.looks.set(e.pointerId, p);
    try { this.canvas.setPointerCapture(e.pointerId); } catch (_) {}
  }

  moveP(e) {
    if (this.locked && e.pointerType === 'mouse') { this.turn(e.movementX, e.movementY, 0.0022); return; }
    if (e.pointerId === this.joyId) {
      const R = 50; let dx = e.clientX - this.joyO.x, dy = e.clientY - this.joyO.y;
      const m = Math.hypot(dx, dy); if (m > R) { dx *= R / m; dy *= R / m; }
      this.knob.style.transform = `translate(${dx}px,${dy}px)`;
      this.move.x = dx / R; this.move.y = dy / R; return;
    }
    const p = this.looks.get(e.pointerId); if (!p) return;
    this.turn(e.clientX - p.x, e.clientY - p.y, p.type === 'touch' ? 0.005 : 0.004);
    p.x = e.clientX; p.y = e.clientY;
  }

  up(e) {
    if (e.pointerId === this.joyId) {
      this.joyId = null; this.move.x = this.move.y = 0;
      this.joy.style.display = 'none'; this.knob.style.transform = ''; return;
    }
    const p = this.looks.get(e.pointerId); this.looks.delete(e.pointerId);
    if (e.type !== 'pointerup') return;
    if (this.locked && e.pointerType === 'mouse') { this.onTap(innerWidth / 2, innerHeight / 2, { fromLock: true }); return; }
    if (p && Math.hypot(e.clientX - p.sx, e.clientY - p.sy) < 8 && performance.now() - p.t < 450)
      this.onTap(e.clientX, e.clientY, { fromLock: false, type: p.type });
  }

  turn(dx, dy, k) { this.yaw -= dx * k; this.pitch = Math.max(-1.2, Math.min(1.25, this.pitch - dy * k)); }

  lock() {
    if (!this.canvas.requestPointerLock) return;
    try { const r = this.canvas.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (_) {}
  }
  unlock() { if (document.pointerLockElement) document.exitPointerLock(); }

  setView(pos, yaw, pitch = 0) {
    this.camera.position.copy(pos); this.yaw = yaw; this.pitch = pitch;
    this.camera.rotation.set(pitch, yaw, 0);
  }

  // Move a câmera; env.constrain(pos, prev) corrige colisões. Retorna true se andou.
  update(dt, env) {
    const k = this.keys; let fx = 0, fz = 0;
    if (this.enabled) {
      if (k.KeyW || k.ArrowUp) fz -= 1;
      if (k.KeyS || k.ArrowDown) fz += 1;
      if (k.KeyA || k.ArrowLeft) fx -= 1;
      if (k.KeyD || k.ArrowRight) fx += 1;
      fx += this.move.x; fz += this.move.y;
    }
    const m = Math.hypot(fx, fz), pos = this.camera.position;
    let moved = false;
    if (m > 0.05) {
      const prev = pos.clone();
      const sp = (k.ShiftLeft || k.ShiftRight ? env.run : env.walk) * Math.min(1, m) / Math.max(1, m);
      const s = Math.sin(this.yaw), c = Math.cos(this.yaw);
      pos.x += (fx * c + fz * s) * sp * dt;
      pos.z += (-fx * s + fz * c) * sp * dt;
      env.constrain(pos, prev);
      moved = true;
    }
    this.camera.rotation.set(this.pitch, this.yaw, 0);
    return moved;
  }
}
