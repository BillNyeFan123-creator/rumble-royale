'use strict';
// ================= ARENA / ACTION GAMES =================

game({
  name: 'Sumo Smash', genre: 'Arena brawler', desc: 'Shove everyone out of the shrinking ring.', ctrl: 'Move  ·  ACTION = dash', elim: 1, mv: 1, T: 60,
  init(g) { ring(g, 170); g.R = 310; },
  update(g, dt) {
    g.R = Math.max(90, 310 - g.t * 5);
    for (const p of g.p) { if (!p.alive) continue; mv(g, p, dt, 250, 5); dash(p, 650); if (Math.hypot(p.x - W / 2, p.y - H / 2) > g.R) out(g, p, W / 2, H / 2); }
    bump(g, 1);
  },
  draw(g) { circ(W / 2, H / 2, g.R + 10, '#e9c46a'); circ(W / 2, H / 2, g.R, '#f4e3b2'); ringS(W / 2, H / 2, g.R * .5, '#e0cf9d', 4); g.p.forEach(drawP); }
});

game({
  name: 'Blaster Duel', genre: 'Platform shooter', desc: 'Three hits and you are out. Shots knock you back. The arena wraps around.', ctrl: 'LEFT/RIGHT  ·  UP = jump  ·  ACTION = shoot', elim: 1, mv: 1, T: 75,
  init(g) {
    g.b = []; g.plats = [{ x: -60, y: H - 50, w: W + 120 }];
    for (let i = 0; i < 6; i++) g.plats.push({ x: rnd(40, W - 320), y: 170 + i * 76, w: rnd(180, 300) });
    g.p.forEach((p, i) => { p.x = W * (i + 1) / (g.n + 1); p.y = H - 90; p.hp = 3; p.fx = p.x < W / 2 ? 1 : -1; });
  },
  update(g, dt) {
    for (const p of g.p) { if (!p.alive) continue; plat(g, p, dt); p.x = (p.x + W) % W; if (IN[p.i].ap && p.cd <= 0) { fire(g, p, p.fx * 760, 0, { life: 1.1 }); p.cd = .4 * p.cdm; } }
    bullets(g, dt, (p, b) => {
      if (p.inv > 0) return; p.kx += Math.sign(b.vx) * 380; p.vy -= 160; burst(b.x, b.y, p.col, 8);
      if (--p.hp <= 0) { if (!out(g, p)) p.hp = 1; } else sfx(200, .1);
    }, 1);
  },
  draw(g) {
    for (const b of g.plats) rect(b.x, b.y, b.w, 14, '#7c8db5'); drawB(g);
    for (const p of g.p) { drawP(p); if (p.alive) for (let k = 0; k < p.hp; k++) rect(p.x - 19 + k * 13, p.y - p.r - 14, 10, 6, p.col); }
  }
});

game({
  name: 'Ricochet Tanks', genre: 'Top-down shooter', desc: 'One hit knocks you out. Shots bounce off the walls — even back into you.', ctrl: 'Move / aim  ·  ACTION = fire', elim: 1, mv: 1, T: 60,
  init(g) { g.b = []; corners(g, 130); },
  update(g, dt) {
    for (const p of g.p) { if (!p.alive) continue; mv(g, p, dt, 210); bound(p); if (IN[p.i].ap && p.cd <= 0) { fire(g, p, p.fx * 520, p.fy * 520, { bn: 3, life: 5 }); p.cd = .7 * p.cdm; } }
    bullets(g, dt, p => out(g, p));
  },
  draw(g) {
    c.strokeStyle = '#2a3350'; c.lineWidth = 2; for (let x = 80; x < W; x += 80) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); } for (let y = 80; y < H; y += 80) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    drawB(g);
    for (const p of g.p) { if (!p.alive) continue; c.strokeStyle = '#dfe6f5'; c.lineWidth = 8; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x + p.fx * (p.r + 14), p.y + p.fy * (p.r + 14)); c.stroke(); drawP(p); }
  }
});

game({
  name: 'Hot Potato', genre: 'Tag', desc: 'Touch someone to pass the bomb before it blows. The holder is a bit faster.', ctrl: 'Move', elim: 1, mv: 1,
  init(g) { ring(g, 230); this.next(g); },
  next(g) { const a = g.p.filter(p => p.alive); if (a.length) g.h = pick(a); g.fuse = rnd(7, 13); g.pc = 1; },
  update(g, dt) {
    for (const p of g.p) { if (!p.alive) continue; mv(g, p, dt, p == g.h ? 305 : 265); bound(p); }
    g.pc -= dt; g.fuse -= dt; const h = g.h;
    if (g.pc <= 0) for (const p of g.p) if (p.alive && p != h && dist(p, h) < p.r + h.r) { g.h = p; g.pc = .7; sfx(500, .06); break; }
    if (g.fuse <= 0) { burst(g.h.x, g.h.y, '#ffa94d', 50); out(g, g.h); if (g.p.filter(p => p.alive).length > 1) this.next(g); else g.fuse = 99; }
  },
  draw(g) {
    g.p.forEach(drawP); const h = g.h; if (!h || !h.alive) return;
    const fl = Math.sin(g.t * (g.fuse < 3 ? 30 : 10)) > 0; circ(h.x, h.y - h.r - 18, 15, fl ? '#ff6b6b' : '#222'); ringS(h.x, h.y - h.r - 18, 15, '#fff', 2); rect(h.x - 2, h.y - h.r - 40, 4, 9, '#ffa94d');
  }
});

game({
  name: 'Crown Keeper', genre: 'Keep-away', desc: 'Hold the crown to score. Run into the holder to steal it.', ctrl: 'Move  ·  ACTION = dash', mv: 1, T: 40,
  init(g) { ring(g, 270); g.h = null; g.pc = 0; },
  update(g, dt) {
    g.pc -= dt; for (const p of g.p) { mv(g, p, dt, p == g.h ? 235 : 275); dash(p); bound(p); }
    if (!g.h) { for (const p of g.p) if (Math.hypot(p.x - W / 2, p.y - H / 2) < p.r + 18) { g.h = p; g.pc = .8; sfx(900, .1, 'sine'); break; } }
    else { g.pts[g.h.i] += dt; if (g.pc <= 0) for (const p of g.p) if (p != g.h && dist(p, g.h) < p.r + g.h.r) { g.h = p; g.pc = .8; sfx(900, .1, 'sine'); burst(p.x, p.y, '#ffd43b', 10); break; } }
  },
  draw(g) { g.p.forEach(drawP); if (g.h) crown(g.h.x, g.h.y - g.h.r - 14, 18); else crown(W / 2, H / 2 + Math.sin(g.t * 4) * 5, 20); }
});

game({
  name: 'Laser Grid', genre: 'Survival', desc: 'Beams flash a warning, then fire. Do not be standing in them.', ctrl: 'Move', elim: 1, mv: 1, T: 70,
  init(g) { ring(g, 150); g.L = []; g.sp = 1; },
  update(g, dt) {
    for (const p of g.p) if (p.alive) { mv(g, p, dt, 280); bound(p); }
    g.sp -= dt; if (g.sp <= 0) { g.sp = Math.max(.22, 1.1 - g.t * .02); const hz = R() < .5; g.L.push({ hz, pos: hz ? rnd(40, H - 40) : rnd(40, W - 40), w: rnd(40, 90) + g.t, t: 0 }); }
    for (let i = g.L.length - 1; i >= 0; i--) {
      const l = g.L[i], was = l.t < 1; l.t += dt; if (was && l.t >= 1) sfx(1200, .12, 'sawtooth', .03);
      if (l.t >= 1 && l.t < 1.35) for (const p of g.p) if (p.alive && Math.abs((l.hz ? p.y : p.x) - l.pos) < l.w / 2 + p.r * .6) out(g, p);
      if (l.t > 1.35) g.L.splice(i, 1);
    }
  },
  draw(g) {
    for (const l of g.L) { c.fillStyle = l.t >= 1 ? '#ff6b6b' : `rgba(255,107,107,${.1 + .2 * Math.sin(l.t * 20) ** 2})`; if (l.hz) c.fillRect(0, l.pos - l.w / 2, W, l.w); else c.fillRect(l.pos - l.w / 2, 0, l.w, H); }
    g.p.forEach(drawP);
  }
});

game({
  name: 'Crumble Floor', genre: 'Survival', desc: 'Tiles fall away after you step on them. Last one standing wins.', ctrl: 'Move', elim: 1, mv: 1, T: 70, bg: '#05060a',
  init(g) { ring(g, 200); g.tl = new Float32Array(144).fill(-1); g.rt = 3; },   // -1 solid, >0 crumbling, -2 gone
  update(g, dt) {
    for (const p of g.p) {
      if (!p.alive) continue; mv(g, p, dt, 250); bound(p); const k = Math.min(8, p.y / 80 | 0) * 16 + Math.min(15, p.x / 80 | 0);
      if (g.tl[k] == -1) g.tl[k] = .7;
      else if (g.tl[k] == -2 && g.t > 1) { const s = []; for (let q = 0; q < 144; q++) if (g.tl[q] == -1) s.push(q); const q = s.length ? pick(s) : k; out(g, p, q % 16 * 80 + 40, (q >> 4) * 80 + 40); }
    }
    for (let k = 0; k < 144; k++) if (g.tl[k] > 0) { g.tl[k] -= dt; if (g.tl[k] <= 0) g.tl[k] = -2; }
    g.rt -= dt; if (g.rt <= 0) { g.rt = .4; const k = ri(0, 143); if (g.tl[k] == -1) g.tl[k] = 1.2; }
  },
  draw(g) {
    for (let k = 0; k < 144; k++) { const v = g.tl[k]; if (v == -2) continue; rect(k % 16 * 80 + 2, (k >> 4) * 80 + 2, 76, 76, v == -1 ? '#3b4a6b' : (Math.sin(g.t * 30) > 0 ? '#ffa94d' : '#7a5a3a')); }
    g.p.forEach(drawP);
  }
});

game({
  name: 'Meteor Shower', genre: 'Bullet hell', desc: 'Dodge everything. It only gets worse.', ctrl: 'Move', elim: 1, mv: 1, T: 70, bg: '#0b0d1a',
  init(g) { ring(g, 150); g.m = []; g.sp = .5; },
  update(g, dt) {
    for (const p of g.p) if (p.alive) { mv(g, p, dt, 290); bound(p); }
    g.sp -= dt; if (g.sp <= 0) {
      g.sp = Math.max(.07, .5 - g.t * .008); const a = rnd(0, TAU), x = W / 2 + Math.cos(a) * 800, y = H / 2 + Math.sin(a) * 800, t = rnd(0, TAU), tx = W / 2 + Math.cos(t) * 300, ty = H / 2 + Math.sin(t) * 220, d = Math.hypot(tx - x, ty - y), s = rnd(180, 300) + g.t * 3;
      g.m.push({ x, y, vx: (tx - x) / d * s, vy: (ty - y) / d * s, r: rnd(10, 26), life: 9 });
    }
    for (let i = g.m.length - 1; i >= 0; i--) {
      const m = g.m[i]; m.x += m.vx * dt; m.y += m.vy * dt; m.life -= dt; if (m.life <= 0) { g.m.splice(i, 1); continue; }
      for (const p of g.p) if (p.alive && dist(p, m) < p.r * .8 + m.r) out(g, p);
    }
  },
  draw(g) { for (const m of g.m) { circ(m.x - m.vx * .04, m.y - m.vy * .04, m.r * .8, '#7a3b1d'); circ(m.x, m.y, m.r, '#ff922b'); circ(m.x, m.y, m.r * .55, '#ffe066'); } g.p.forEach(drawP); }
});

game({
  name: 'Light Trails', genre: 'Arcade', desc: 'Your trail is a wall. Crash into anything and you are out.', ctrl: 'Steer with directions', elim: 1, T: 90, bg: '#0a0c14',
  init(g) {
    g.grid = new Int8Array(128 * 72).fill(-1); g.acc = 0; const S = [[20, 18, 1, 0], [107, 53, -1, 0], [107, 18, 0, 1], [20, 53, 0, -1]];
    g.p.forEach((p, i) => { [p.gx, p.gy, p.ddx, p.ddy] = S[i]; p.r = 7; p.w = null; p.x = p.gx * 10 + 5; p.y = p.gy * 10 + 5; });
  },
  update(g, dt) {
    for (const p of g.p) { const I = IN[p.i]; if (I.dx && !p.ddx) p.w = [I.dx, 0]; else if (I.dy && !p.ddy) p.w = [0, I.dy]; }
    g.acc += dt * 34;
    while (g.acc >= 1) {
      g.acc--;
      for (const p of g.p) {
        if (!p.alive) continue; if (p.w) { [p.ddx, p.ddy] = p.w; p.w = null; }
        g.grid[p.gy * 128 + p.gx] = p.i; const nx = p.gx + p.ddx, ny = p.gy + p.ddy;
        if (nx < 0 || ny < 0 || nx >= 128 || ny >= 72) { if (!out(g, p)) { p.ddx = -p.ddx; p.ddy = -p.ddy; } continue; }
        if (g.grid[ny * 128 + nx] != -1 && out(g, p)) continue;
        p.gx = nx; p.gy = ny; p.x = nx * 10 + 5; p.y = ny * 10 + 5;
      }
    }
  },
  draw(g) {
    for (let k = 0; k < g.grid.length; k++) { const v = g.grid[k]; if (v >= 0) rect(k % 128 * 10, (k / 128 | 0) * 10, 10, 10, g.p[v].col); }
    for (const p of g.p) if (p.alive) { circ(p.x, p.y, 9, '#fff'); circ(p.x, p.y, 6, p.col); }
  }
});

game({
  name: 'Paint War', genre: 'Territory', desc: 'Paint the most floor before time runs out. Paint over your rivals.', ctrl: 'Move  ·  ACTION = dash', mv: 1, T: 30,
  init(g) { corners(g); g.grid = new Int8Array(32 * 18).fill(-1); },
  update(g, dt) {
    for (const p of g.p) {
      mv(g, p, dt, 300); dash(p); bound(p); const cx = p.x / 40 | 0, cy = p.y / 40 | 0, k = Math.ceil(p.r / 40) + 1;
      for (let y = cy - k; y <= cy + k; y++) for (let x = cx - k; x <= cx + k; x++) if (x >= 0 && y >= 0 && x < 32 && y < 18 && Math.hypot(x * 40 + 20 - p.x, y * 40 + 20 - p.y) < p.r + 14) g.grid[y * 32 + x] = p.i;
    }
    bump(g, .6); g.pts.fill(0); for (const v of g.grid) if (v >= 0) g.pts[v]++;
  },
  draw(g) { c.globalAlpha = .6; for (let k = 0; k < 576; k++) { const v = g.grid[k]; if (v >= 0) rect(k % 32 * 40, (k >> 5) * 40, 40, 40, g.p[v].col); } c.globalAlpha = 1; g.p.forEach(p => { ringS(p.x, p.y, p.r + 2, '#111', 4); drawP(p); }); }
});

game({
  name: 'Coin Rush', genre: 'Collect-a-thon', desc: 'Grab coins. Big gold ones are worth 3. Spike balls make you drop coins.', ctrl: 'Move  ·  ACTION = dash', mv: 1, T: 35,
  init(g) { ring(g, 230); g.cn = []; g.s = []; for (let i = 0; i < 4; i++) g.s.push({ x: W / 2, y: H / 2, vx: rnd(-1, 1) * 200, vy: rnd(-1, 1) * 200, r: 20 }); g.sp = 0; },
  update(g, dt) {
    g.sp -= dt; if (g.sp <= 0 && g.cn.length < 14) { g.sp = .35; g.cn.push({ x: rnd(40, W - 40), y: rnd(70, H - 70), g: R() < .15 }); }
    for (const s of g.s) { s.x += s.vx * dt; s.y += s.vy * dt; if (s.x < s.r || s.x > W - s.r) { s.vx *= -1; s.x = clamp(s.x, s.r, W - s.r); } if (s.y < s.r || s.y > H - s.r) { s.vy *= -1; s.y = clamp(s.y, s.r, H - s.r); } }
    for (const p of g.p) {
      mv(g, p, dt, 290); dash(p); bound(p);
      for (let i = g.cn.length - 1; i >= 0; i--) { const q = g.cn[i]; if (Math.hypot(q.x - p.x, q.y - p.y) < p.r + 14) { g.pts[p.i] += q.g ? 3 : 1; sfx(q.g ? 1300 : 1000, .05, 'sine'); g.cn.splice(i, 1); } }
      if (p.inv <= 0 && g.t > 1.5) for (const s of g.s) if (dist(p, s) < p.r + s.r) { g.pts[p.i] -= Math.min(3, g.pts[p.i]); p.inv = 1.5; p.stun = .6; sfx(150, .2, 'sawtooth'); burst(p.x, p.y, '#ffd43b', 12); break; }
    }
  },
  draw(g) {
    for (const q of g.cn) { circ(q.x, q.y, q.g ? 15 : 10, q.g ? '#ffd43b' : '#f1c40f'); circ(q.x, q.y, q.g ? 9 : 5, '#fff3bf'); }
    for (const s of g.s) { for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + g.t * 3; circ(s.x + Math.cos(a) * s.r, s.y + Math.sin(a) * s.r, 6, '#adb5bd'); } circ(s.x, s.y, s.r - 2, '#495057'); }
    g.p.forEach(drawP);
  }
});

game({
  name: 'Hill King', genre: 'Zone control', desc: 'Stand in the zone ALONE to score. Shove rivals out. The zone moves.', ctrl: 'Move  ·  ACTION = dash', mv: 1, T: 40,
  init(g) { ring(g, 290); g.z = { x: W / 2, y: H / 2, r: 110 }; g.zt = 8; },
  update(g, dt) {
    g.zt -= dt; if (g.zt <= 0) { g.zt = 8; g.z.x = rnd(160, W - 160); g.z.y = rnd(160, H - 160); sfx(600, .2, 'sine'); }
    for (const p of g.p) { mv(g, p, dt, 260, 6); dash(p, 700); bound(p); } bump(g, 1);
    const ins = g.p.filter(p => dist(p, g.z) < g.z.r); g.own = ins.length == 1 ? ins[0] : null; if (g.own) g.pts[g.own.i] += dt;
  },
  draw(g) { c.globalAlpha = .35; circ(g.z.x, g.z.y, g.z.r, g.own ? g.own.col : '#868e96'); c.globalAlpha = 1; ringS(g.z.x, g.z.y, g.z.r, '#fff', 3); txt(Math.ceil(g.zt), g.z.x, g.z.y, 34, 'rgba(255,255,255,.5)'); g.p.forEach(drawP); }
});

game({
  name: 'Scramble Ball', genre: 'Sports', desc: '2 players: score in the far goal. 3+ players: last touch scores in either goal. First to 3.', ctrl: 'Move  ·  ACTION = dash', mv: 1, T: 70, bg: '#14301f',
  init(g) { g.last = null; this.reset(g); },
  reset(g) {
    g.ball = { x: W / 2, y: H / 2, vx: 0, vy: 0, r: 20 };
    g.p.forEach((p, i) => { const a = i / g.n * TAU + Math.PI; p.x = g.n == 2 ? (i ? W - 220 : 220) : W / 2 + Math.cos(a) * 300; p.y = g.n == 2 ? H / 2 : H / 2 + Math.sin(a) * 220; p.kx = p.ky = p.vx = p.vy = 0; });
  },
  goal(g, side) { const s = g.n == 2 ? g.p[side ? 0 : 1] : g.last; if (s) { g.pts[s.i]++; burst(g.ball.x, g.ball.y, s.col, 40); sfx(1000, .3, 'sine'); if (g.pts[s.i] >= 3) g.done = true; } this.reset(g); },
  update(g, dt) {
    const b = g.ball;
    for (const p of g.p) {
      mv(g, p, dt, 270, 8); dash(p, 620); bound(p); const dx = b.x - p.x, dy = b.y - p.y, d = Math.hypot(dx, dy) || 1;
      if (d < b.r + p.r) { const nx = dx / d, ny = dy / d, s = Math.max(260, Math.hypot(p.vx + p.kx, p.vy + p.ky) * 1.25); b.vx = nx * s; b.vy = ny * s; b.x = p.x + nx * (b.r + p.r + 1); b.y = p.y + ny * (b.r + p.r + 1); g.last = p; }
    }
    bump(g, .5); b.x += b.vx * dt; b.y += b.vy * dt; b.vx *= 1 - .6 * dt; b.vy *= 1 - .6 * dt;
    if (b.y < b.r) { b.y = b.r; b.vy = Math.abs(b.vy); } if (b.y > H - b.r) { b.y = H - b.r; b.vy = -Math.abs(b.vy); }
    const ing = b.y > H / 2 - 110 && b.y < H / 2 + 110;
    if (b.x < b.r) { if (ing) this.goal(g, 0); else { b.x = b.r; b.vx = Math.abs(b.vx); } }
    else if (b.x > W - b.r) { if (ing) this.goal(g, 1); else { b.x = W - b.r; b.vx = -Math.abs(b.vx); } }
  },
  draw(g) {
    ringS(W / 2, H / 2, 100, '#2f6b45', 4); rect(W / 2 - 2, 0, 4, H, '#2f6b45');
    rect(0, H / 2 - 110, 14, 220, g.n == 2 ? g.p[1].col : '#fff'); rect(W - 14, H / 2 - 110, 14, 220, g.n == 2 ? g.p[0].col : '#fff');
    g.p.forEach(drawP); circ(g.ball.x, g.ball.y, g.ball.r, '#fff'); ringS(g.ball.x, g.ball.y, g.ball.r, g.last ? g.last.col : '#222', 4);
  }
});

game({
  name: 'Horde Night', genre: 'Roguelike survivor', desc: 'You auto-fire at the horde. Grab gems to level up your fire rate. Three hits and you are done.', ctrl: 'Move', elim: 1, mv: 1, T: 60, bg: '#161320',
  init(g) { ring(g, 120); g.e = []; g.b = []; g.gm = []; g.sp = 1; g.p.forEach(p => { p.hp = 3; p.lv = 0; p.ft = 0; }); },
  update(g, dt) {
    g.sp -= dt; if (g.sp <= 0) { g.sp = Math.max(.1, .7 - g.t * .012); const a = rnd(0, TAU); g.e.push({ x: W / 2 + Math.cos(a) * 760, y: H / 2 + Math.sin(a) * 500, r: 14, hp: g.t > 25 ? 2 : 1 }); }
    const al = g.p.filter(p => p.alive);
    for (const e of g.e) {
      let t = null, bd = 1e9; for (const p of al) { const d = dist(p, e); if (d < bd) { bd = d; t = p; } } if (!t) continue;
      const s = 80 + g.t * 1.2, d = bd || 1; e.x += (t.x - e.x) / d * s * dt; e.y += (t.y - e.y) / d * s * dt;
      if (bd < t.r + e.r && t.inv <= 0) { e.hp = 0; if (--t.hp <= 0) { if (!out(g, t)) t.hp = 1; } else { t.inv = 1; sfx(200, .1); burst(t.x, t.y, t.col, 8); } }
    }
    for (const p of al) {
      mv(g, p, dt, 250); bound(p); p.ft -= dt;
      if (p.ft <= 0) { let t = null, bd = 420; for (const e of g.e) { const d = dist(p, e); if (d < bd) { bd = d; t = e; } } if (t) { p.ft = Math.max(.12, .5 - p.lv * .06) * p.cdm; const d = bd || 1; g.b.push({ x: p.x, y: p.y, vx: (t.x - p.x) / d * 600, vy: (t.y - p.y) / d * 600, life: .9, col: p.col }); } }
      for (let i = g.gm.length - 1; i >= 0; i--) if (dist(p, g.gm[i]) < p.r + 16) { g.pts[p.i]++; p.lv = Math.floor(g.pts[p.i] / 4); g.gm.splice(i, 1); sfx(1200, .03, 'sine'); }
    }
    for (let i = g.b.length - 1; i >= 0; i--) {
      const b = g.b[i]; b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; let dead = b.life <= 0;
      for (const e of g.e) if (e.hp > 0 && Math.hypot(e.x - b.x, e.y - b.y) < e.r + 6) { e.hp--; dead = true; break; } if (dead) g.b.splice(i, 1);
    }
    for (let i = g.e.length - 1; i >= 0; i--) if (g.e[i].hp <= 0) { const e = g.e[i]; g.gm.push({ x: e.x, y: e.y }); burst(e.x, e.y, '#8ce99a', 5); g.e.splice(i, 1); }
  },
  draw(g) {
    for (const q of g.gm) rect(q.x - 5, q.y - 5, 10, 10, '#66d9e8');
    for (const e of g.e) { circ(e.x, e.y, e.r, e.hp > 1 ? '#5c940d' : '#82c91e'); circ(e.x - 4, e.y - 3, 3, '#111'); circ(e.x + 4, e.y - 3, 3, '#111'); }
    for (const b of g.b) circ(b.x, b.y, 5, b.col);
    for (const p of g.p) { drawP(p); if (p.alive) { for (let k = 0; k < p.hp; k++) rect(p.x - 19 + k * 13, p.y - p.r - 14, 10, 6, p.col); txt('LV' + (p.lv + 1), p.x, p.y + p.r + 12, 13, '#fff'); } }
  }
});

game({
  name: 'Space Brawl', genre: 'Space shooter', desc: 'Rotate, thrust, shoot. Most hits wins. Space wraps around.', ctrl: 'LEFT/RIGHT = rotate  ·  UP = thrust  ·  ACTION = shoot', T: 45, bg: '#06070f',
  init(g) { g.b = []; ring(g, 270); g.p.forEach(p => { p.a = Math.atan2(H / 2 - p.y, W / 2 - p.x); p.r = 16; p.inv = 1.5; }); },
  update(g, dt) {
    for (const p of g.p) {
      const I = IN[p.i]; p.a += I.x * 4 * dt; p.fx = Math.cos(p.a); p.fy = Math.sin(p.a); p.th = I.y < -.3;
      if (p.th) { p.vx += p.fx * 420 * dt * p.spd; p.vy += p.fy * 420 * dt * p.spd; } p.vx *= 1 - .5 * dt; p.vy *= 1 - .5 * dt;
      p.x = (p.x + p.vx * dt + W) % W; p.y = (p.y + p.vy * dt + H) % H;
      if (I.ap && p.cd <= 0) { fire(g, p, p.vx + p.fx * 560, p.vy + p.fy * 560, { life: 1.1 }); p.cd = .3 * p.cdm; }
    }
    bullets(g, dt, (p, b) => { if (p.inv > 0) return; g.pts[b.own]++; burst(p.x, p.y, p.col, 25); sfx(120, .2, 'sawtooth'); p.x = rnd(100, W - 100); p.y = rnd(100, H - 100); p.vx = p.vy = 0; p.inv = 2; }, 1);
  },
  draw(g) {
    for (let i = 0; i < 60; i++) rect((i * 197) % W, (i * 131) % H, 2, 2, '#39405c'); drawB(g);
    for (const p of g.p) {
      if (p.inv > 0 && Math.floor(p.inv * 12) % 2) continue; c.save(); c.translate(p.x, p.y); c.rotate(p.a);
      if (p.th) { c.fillStyle = '#ffa94d'; c.beginPath(); c.moveTo(-14, -6); c.lineTo(-28 - R() * 8, 0); c.lineTo(-14, 6); c.fill(); }
      c.fillStyle = p.col; c.beginPath(); c.moveTo(20, 0); c.lineTo(-14, -13); c.lineTo(-8, 0); c.lineTo(-14, 13); c.closePath(); c.fill(); c.restore();
    }
  }
});

game({
  name: 'Gem Heist', genre: 'Capture', desc: 'Carry gems to your base, one at a time. Raid rival bases. Dash into a carrier to make them drop it.', ctrl: 'Move  ·  ACTION = dash', mv: 1, T: 45,
  init(g) { corners(g, 100); g.base = g.p.map(p => ({ x: p.x, y: p.y, r: 62 })); g.gm = []; g.sp = 0; g.p.forEach(p => p.car = 0); },
  update(g, dt) {
    g.sp -= dt; if (g.sp <= 0 && g.gm.length < 8) { g.sp = .8; g.gm.push({ x: W / 2 + rnd(-220, 220), y: H / 2 + rnd(-160, 160) }); }
    for (const p of g.p) {
      mv(g, p, dt, p.car ? 235 : 285); dash(p); bound(p);
      if (!p.car && p.stun <= 0) {
        for (let i = g.gm.length - 1; i >= 0; i--) if (dist(p, g.gm[i]) < p.r + 12) { p.car = 1; g.gm.splice(i, 1); sfx(900, .05, 'sine'); break; }
        g.base.forEach((b, j) => { if (!p.car && j != p.i && g.pts[j] > 0 && dist(p, b) < b.r * .6) { g.pts[j]--; p.car = 1; sfx(300, .1); } });
      } else if (p.car && dist(p, g.base[p.i]) < g.base[p.i].r) { p.car = 0; g.pts[p.i]++; sfx(1200, .08, 'sine'); }
    }
    for (const a of g.p) for (const b of g.p) if (a != b && a.car && dist(a, b) < a.r + b.r && Math.hypot(b.kx, b.ky) > 150) { a.car = 0; a.stun = .7; g.gm.push({ x: a.x, y: a.y }); sfx(200, .1); }
    bump(g, .8);
  },
  draw(g) {
    g.base.forEach((b, i) => { c.globalAlpha = .3; circ(b.x, b.y, b.r, g.p[i].col); c.globalAlpha = 1; ringS(b.x, b.y, b.r, g.p[i].col, 3); for (let k = 0; k < g.pts[i]; k++) rect(b.x - 40 + (k % 6) * 14, b.y - 20 + Math.floor(k / 6) * 14, 10, 10, '#66d9e8'); });
    for (const q of g.gm) { c.save(); c.translate(q.x, q.y); c.rotate(Math.PI / 4); rect(-8, -8, 16, 16, '#66d9e8'); c.restore(); }
    for (const p of g.p) { drawP(p); if (p.car) { c.save(); c.translate(p.x, p.y - p.r - 12); c.rotate(Math.PI / 4); rect(-7, -7, 14, 14, '#66d9e8'); c.restore(); } }
  }
});

game({
  name: 'Summit Sprint', genre: 'Platformer', desc: 'Climb to the flag before the lava catches you.', ctrl: 'LEFT/RIGHT  ·  UP = jump', elim: 1, mv: 1, T: 60,
  init(g) {
    g.plats = [{ x: 0, y: H - 30, w: W }];
    for (let r = 1; r <= 6; r++) { const n = ri(2, 3); for (let k = 0; k < n; k++) g.plats.push({ x: W * k / n + rnd(10, W / n - 240), y: H - 30 - r * 92, w: rnd(160, 230) }); }
    const top = g.plats[g.plats.length - 1]; g.flag = { x: top.x + top.w / 2, y: top.y - 30 }; g.lava = H + 140;
    g.p.forEach((p, i) => { p.x = W * (i + 1) / (g.n + 1); p.y = H - 60; });
  },
  update(g, dt) {
    g.lava -= (9 + g.t * .5) * dt;
    for (const p of g.p) {
      if (!p.alive) continue; plat(g, p, dt); p.x = clamp(p.x, p.r, W - p.r); g.pts[p.i] = Math.max(g.pts[p.i], Math.round((H - p.y) / 10));
      if (dist(p, g.flag) < p.r + 26) { g.pts[p.i] = 999; g.done = true; }
      if (p.y + p.r > g.lava) { if (!out(g, p)) p.vy = -900; }
    }
  },
  draw(g) {
    for (const b of g.plats) rect(b.x, b.y, b.w, 14, '#7c8db5'); rect(g.flag.x - 2, g.flag.y - 26, 4, 56, '#fff'); c.fillStyle = '#ffd43b'; c.beginPath(); c.moveTo(g.flag.x + 2, g.flag.y - 26); c.lineTo(g.flag.x + 36, g.flag.y - 14); c.lineTo(g.flag.x + 2, g.flag.y - 2); c.fill();
    g.p.forEach(drawP); rect(0, g.lava, W, H, '#f76707'); for (let x = 0; x < W; x += 40) circ(x + 20, g.lava + Math.sin(g.t * 4 + x) * 4, 22, '#ff922b');
  }
});

game({
  name: 'Target Range', genre: 'Shooting gallery', desc: 'Shoot the targets. Small gold ones are worth 3. Red ones cost you 2.', ctrl: 'Move crosshair  ·  ACTION = shoot', mv: 1, T: 30,
  init(g) { ring(g, 150); g.tg = []; g.sp = 0; },
  update(g, dt) {
    g.sp -= dt; if (g.sp <= 0) { g.sp = rnd(.2, .5); const k = R(); g.tg.push({ x: rnd(60, W - 60), y: rnd(80, H - 80), r: k < .15 ? 16 : 32, k: k < .15 ? 1 : k < .3 ? 2 : 0, t: rnd(1.4, 2.6) }); }
    for (let i = g.tg.length - 1; i >= 0; i--) if ((g.tg[i].t -= dt) <= 0) g.tg.splice(i, 1);
    for (const p of g.p) {
      mv(g, p, dt, 560); bound(p);
      if (IN[p.i].ap && p.cd <= 0) {
        p.cd = .22 * p.cdm; sfx(700, .04);
        for (let i = g.tg.length - 1; i >= 0; i--) { const t = g.tg[i]; if (Math.hypot(t.x - p.x, t.y - p.y) < t.r + 4) { g.pts[p.i] += [1, 3, -2][t.k]; burst(t.x, t.y, ['#fff', '#ffd43b', '#f03e3e'][t.k], 12); g.tg.splice(i, 1); break; } }
      }
    }
  },
  draw(g) {
    for (const t of g.tg) { const s = Math.min(1, t.t * 4); if (t.k == 2) { circ(t.x, t.y, t.r * s, '#f03e3e'); txt('X', t.x, t.y, 30, '#fff'); } else { circ(t.x, t.y, t.r * s, t.k ? '#ffd43b' : '#fff'); circ(t.x, t.y, t.r * s * .66, t.k ? '#f08c00' : '#e03131'); circ(t.x, t.y, t.r * s * .33, '#fff'); } }
    for (const p of g.p) { ringS(p.x, p.y, p.r, p.col, 4); rect(p.x - p.r - 8, p.y - 2, p.r * 2 + 16, 4, p.col); rect(p.x - 2, p.y - p.r - 8, 4, p.r * 2 + 16, p.col); }
  }
});
