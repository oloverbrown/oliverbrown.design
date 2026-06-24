/* ============================================================
   oliverbrown.design — "kids" simulation
   Canvas-based crowd of child sprites that wander each pink
   region: 7 behind the classroom door, 50 in the lower sections.
   ============================================================ */

(() => {
  'use strict';

  // Resolved relative to the HTML page (index.html lives at the site root).
  const SPRITE_SRC = 'sprites/child.png';

  // Colours a kid is randomly assigned on spawn.
  const KID_COLORS = [
    '#FDB5CB', '#FFBEBE', '#FFC6B4', '#ECBBEA',
    '#E8C2EF', '#DCB8FB', '#C7E4F9'
  ];

  const TWO_PI = Math.PI * 2;
  const MOUSE_RADIUS = 280;   // px — attraction reach on mousemove
  const ATTRACT = 0.55;       // how strongly nearby kids turn toward the mouse
  const MOVE_BOOST = 4;       // speed nudge given to kids the mouse passes near
  const CLICK_STEER = 0.6;    // per-frame turn toward the click point (very strong)
  const CLICK_SPEED = 9;      // px/frame kids rush at after a click
  const CLICK_SEEK_TIME = 1.4; // seconds the strong click-pull stays active
  const IDLE_MIN = 0.5, IDLE_MAX = 3;   // seconds per idle state (halved)
  const MOVE_MIN = 1,  MOVE_MAX = 6;    // seconds per movement state
  const SPEED_MIN = 1, SPEED_MAX = 7;   // px per frame at the peak of a move

  const rand = (a, b) => a + Math.random() * (b - a);

  // Shortest signed angle from a to b.
  const angDiff = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));

  /* ---------- Sprite tinting ----------
     child.png is a white silhouette on transparency; we clip a
     solid fill to its shape once per colour and reuse the result. */
  function buildTints(img) {
    const w = img.naturalWidth || 75;
    const h = img.naturalHeight || 114;
    const map = {};
    KID_COLORS.forEach((color) => {
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const cx = c.getContext('2d');
      cx.drawImage(img, 0, 0, w, h);
      cx.globalCompositeOperation = 'source-in';
      cx.fillStyle = color;
      cx.fillRect(0, 0, w, h);
      map[color] = c;
    });
    return { map, ratio: h / w };
  }

  /* ---------- Kid ---------- */
  class Kid {
    constructor(region) {
      this.region = region;
      this.sprite = region.tints[KID_COLORS[(Math.random() * KID_COLORS.length) | 0]];
      this.dir = rand(0, TWO_PI);          // 1..360deg, random
      this.speed = 0;                      // starts at zero
      this.targetSpeed = 0;
      this.boost = 0;                      // mouse-driven speed, decays each frame
      this.r = region.spriteW / 2;         // boundary radius = ½ sprite width
      this.state = region.noIdle ? 'move' : 'idle';
      this.stateStart = performance.now() / 1000;
      this.stateDur = region.noIdle ? rand(MOVE_MIN, MOVE_MAX) : rand(IDLE_MIN, IDLE_MAX);
      if (region.noIdle) this.targetSpeed = rand(SPEED_MIN, SPEED_MAX);
      // Place inside the region, not overlapping existing kids.
      this.placeWithoutOverlap();
    }

    placeWithoutOverlap() {
      const { w, h, kids } = this.region;
      const r = this.r;
      for (let tries = 0; tries < 40; tries++) {
        this.x = rand(r, w - r);
        this.y = rand(r, h - r);
        let ok = true;
        for (const o of kids) {
          const dx = this.x - o.x, dy = this.y - o.y;
          if (dx * dx + dy * dy < (r + o.r) * (r + o.r)) { ok = false; break; }
        }
        if (ok) return;
      }
      // Give up gracefully — just clamp inside.
      this.x = Math.min(Math.max(this.x, r), w - r);
      this.y = Math.min(Math.max(this.y, r), h - r);
    }

    updateState(now) {
      if (now - this.stateStart >= this.stateDur) {
        const nextState = (this.region.noIdle || this.state === 'idle') ? 'move' : 'idle';
        this.state = nextState;
        this.stateStart = now;
        this.stateDur = this.state === 'idle' ? rand(IDLE_MIN, IDLE_MAX) : rand(MOVE_MIN, MOVE_MAX);
        if (this.state === 'move') this.targetSpeed = rand(SPEED_MIN, SPEED_MAX);
      }
      if (this.state === 'idle') {
        this.speed = 0;
      } else {
        // Triangular ramp: 0 -> targetSpeed -> 0 across the movement state.
        const p = (now - this.stateStart) / this.stateDur;
        this.speed = this.targetSpeed * (1 - Math.abs(2 * p - 1));
      }
    }

    step(dt) {
      const r = this.r;
      const { w, h, kids } = this.region;
      this.boost *= 0.92;                          // boost decays ~8% per frame
      const dist = Math.max(this.speed, this.boost) * dt * 60;
      if (dist <= 0) return;

      const nx = this.x + Math.cos(this.dir) * dist;
      const ny = this.y + Math.sin(this.dir) * dist;

      let blocked = nx < r || nx > w - r || ny < r || ny > h - r;
      if (!blocked) {
        for (const o of kids) {
          if (o === this) continue;
          const dx = nx - o.x, dy = ny - o.y;
          const min = r + o.r;
          if (dx * dx + dy * dy < min * min) { blocked = true; break; }
        }
      }

      if (blocked) {
        // Turn the opposite way, then a random ±90° adjustment.
        this.dir = this.dir + Math.PI + (Math.random() - 0.5) * Math.PI;
        if (this.dir < 0) this.dir += TWO_PI;
        if (this.dir >= TWO_PI) this.dir -= TWO_PI;
      } else {
        this.x = nx;
        this.y = ny;
      }
    }

    clampInside() {
      const r = this.r;
      this.x = Math.min(Math.max(this.x, r), this.region.w - r);
      this.y = Math.min(Math.max(this.y, r), this.region.h - r);
    }
  }

  /* ---------- Region ---------- */
  class Region {
    constructor({ canvas, tints, spriteW, ratio, measure, noIdle = false, clickable = true }) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.tints = tints;
      this.spriteW = spriteW;
      this.spriteH = spriteW * ratio;
      this.measure = measure;       // () => {left, top, width, height} in page px
      this.noIdle = noIdle;
      this.clickable = clickable;
      this.kids = [];
      this.seek = null;             // active click-seek target, if any
      this.w = 0; this.h = 0;
      this.resize();
    }

    resize() {
      const box = this.measure();
      if (!box || box.width < 2 || box.height < 2) return;
      // Position lower-region canvas in the page (door canvas is CSS-positioned).
      if (this.canvas.classList.contains('kids-canvas--lower')) {
        this.canvas.style.left = `${box.left}px`;
        this.canvas.style.top = `${box.top}px`;
        this.canvas.style.width = `${box.width}px`;
        this.canvas.style.height = `${box.height}px`;
      }
      const dpr = window.devicePixelRatio || 1;
      this.w = this.canvas.clientWidth;
      this.h = this.canvas.clientHeight;
      this.canvas.width = Math.round(this.w * dpr);
      this.canvas.height = Math.round(this.h * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.kids.forEach((k) => k.clampInside());
    }

    spawn(n) {
      for (let i = 0; i < n; i++) this.kids.push(new Kid(this));
    }

    // Convert a page (client) point into region-local coordinates.
    toLocal(clientX, clientY) {
      const r = this.canvas.getBoundingClientRect();
      return { x: clientX - r.left, y: clientY - r.top };
    }

    attract(clientX, clientY) {
      const { x, y } = this.toLocal(clientX, clientY);
      for (const k of this.kids) {
        const dx = x - k.x, dy = y - k.y;
        if (dx * dx + dy * dy < MOUSE_RADIUS * MOUSE_RADIUS) {
          k.dir += angDiff(k.dir, Math.atan2(dy, dx)) * ATTRACT;
          k.boost = Math.max(k.boost, MOVE_BOOST);  // speed nudge from nearby movement
        }
      }
    }

    turnToward(clientX, clientY) {
      const { x, y } = this.toLocal(clientX, clientY);
      // A click sets a strong seek target that all kids chase for a while.
      this.seek = { x, y, t: CLICK_SEEK_TIME };
      for (const k of this.kids) {
        k.dir = Math.atan2(y - k.y, x - k.x);
        k.boost = CLICK_SPEED;
      }
    }

    update(dt, now) {
      if (this.seek) {
        this.seek.t -= dt;
        if (this.seek.t <= 0) {
          // Scatter: flip each kid away from the target.
          for (const k of this.kids) {
            k.dir = Math.atan2(k.y - this.seek.y, k.x - this.seek.x);
            k.boost = Math.max(k.boost, SPEED_MAX);
          }
          this.seek = null;
        }
      }
      for (const k of this.kids) {
        k.updateState(now);
        if (this.seek) {
          // Keep steering hard toward the click point and hold max speed.
          const target = Math.atan2(this.seek.y - k.y, this.seek.x - k.x);
          k.dir += angDiff(k.dir, target) * CLICK_STEER;
          k.boost = CLICK_SPEED;
        }
        k.step(dt);
      }
    }

    draw() {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.w, this.h);
      // Draw order recomputed every frame from y (feet) position.
      const order = this.kids.slice().sort((a, b) => a.y - b.y);
      const sw = this.spriteW, sh = this.spriteH;
      for (const k of order) {
        ctx.drawImage(k.sprite, k.x - sw / 2, k.y - sh, sw, sh);
      }
    }
  }

  /* ---------- Bootstrap ---------- */
  function start(img) {
    const { map: tints, ratio } = buildTints(img);
    const regions = [];

    // Door region — 7 kids on the pink rectangle behind the door.
    const door = document.querySelector('.intro__door');
    if (door) {
      const canvas = document.createElement('canvas');
      canvas.className = 'kids-canvas kids-canvas--door';
      door.appendChild(canvas);
      const region = new Region({
        canvas, tints, ratio, spriteW: 69, noIdle: true, clickable: false,
        measure: () => ({ left: 0, top: 0, width: canvas.clientWidth, height: canvas.clientHeight })
      });
      region.spawn(25);
      regions.push(region);
    }

    // Lower region — 50 kids across the about→contact pink area.
    const about = document.getElementById('about');
    const contact = document.getElementById('contact');
    if (about && contact) {
      const canvas = document.createElement('canvas');
      canvas.className = 'kids-canvas kids-canvas--lower';
      document.body.appendChild(canvas);
      const region = new Region({
        canvas, tints, ratio, spriteW: 69,
        measure: () => {
          const a = about.getBoundingClientRect();
          const c = contact.getBoundingClientRect();
          const top = a.top + window.scrollY;
          const bottom = c.bottom + window.scrollY;
          return { left: 0, top, width: document.documentElement.clientWidth, height: bottom - top };
        }
      });
      region.resize();
      region.spawn(150);
      regions.push(region);
    }

    // Mouse interaction (read from the window so the no-pointer canvases
    // don't have to receive events themselves).
    window.addEventListener('mousemove', (e) => {
      regions.forEach((r) => r.attract(e.clientX, e.clientY));
    });
    window.addEventListener('click', (e) => {
      regions.forEach((r) => {
        if (!r.clickable) return;
        const rect = r.canvas.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right &&
            e.clientY >= rect.top  && e.clientY <= rect.bottom) {
          r.turnToward(e.clientX, e.clientY);
        }
      });
    });

    // Recompute geometry when layout can shift.
    const resizeAll = () => regions.forEach((r) => r.resize());
    window.addEventListener('resize', resizeAll);
    window.addEventListener('load', () => { resizeAll(); setTimeout(resizeAll, 400); });

    // Animation loop.
    let last = performance.now() / 1000;
    function frame() {
      const now = performance.now() / 1000;
      const dt = Math.min(now - last, 0.05);
      last = now;
      for (const r of regions) { r.update(dt, now); r.draw(); }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function init() {
    const img = new Image();
    img.onload = () => start(img);
    img.onerror = () => console.error('kids: could not load sprite', SPRITE_SRC);
    img.src = SPRITE_SRC;
  }

  // Wait until main.js has populated the DOM so regions measure correctly.
  document.addEventListener('ob:ready', init, { once: true });
})();
