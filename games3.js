'use strict';
// ================= EXPANSION PACK =================

game({
  name: 'Dodgeball', genre: 'Arena sports', desc: 'Grab a ball and throw it. One hit and you are out. Throws bounce once — watch the rebound.', ctrl: 'Move / aim  ·  ACTION = throw', elim: 1, mv: 1, T: 75,
  init(g) { corners(g, 140); g.b = []; g.balls = []; g.sp = 0; g.p.forEach(p => p.has = 0); },
  update(g, dt) {
    g.sp -= dt; if (g.sp <= 0 && g.balls.length < 3) { g.sp = 1.4; g.balls.push({ x: rnd(220, W - 220), y: rnd(160, H - 160) }); }
    for (const p of g.p) {
      if (!p.alive) continue; mv(g, p, dt, 270); bound(p);
      if (!p.has) { for (let i = g.balls.length - 1; i >= 0; i--) if (dist(p, g.balls[i]) < p.r + 14) { p.has = 1; p.cd = .6; g.balls.splice(i, 1); sfx(700, .05, 'sine'); break; } }
      else if (IN[p.i].ap && p.cd <= 0) { fire(g, p, p.fx * 640, p.fy * 640, { life: 2.2, bn: 1 }); p.has = 0; }
    }
    bullets(g, dt, p => out(g, p));
  },
  draw(g) { rect(W / 2 - 2, 0, 4, H, '#2a3350'); for (const b of g.balls) { circ(b.x, b.y, 12, '#fff'); circ(b.x, b.y, 8, '#ff8787'); } for (const b of g.b) { circ(b.x, b.y, 11, '#fff'); circ(b.x, b.y, 7, b.col); } for (const p of g.p) { drawP(p); if (p.alive && p.has) circ(p.x + p.fx * (p.r + 8), p.y + p.fy * (p.r + 8), 10, '#fff'); } }
});

game({
  name: 'Cooties', genre: 'Tag', desc: 'Someone is IT. You score every second you are NOT it. Tag anyone to pass it on.', ctrl: 'Move  ·  ACTION = dash', mv: 1, T: 40,
  init(g) { ring(g, 250); g.it = pick(g.p); g.pc = 1.5; },
  update(g, dt) {
    g.pc -= dt; for (const p of g.p) { mv(g, p, dt, p == g.it ? 300 : 268); dash(p); bound(p); if (p != g.it) g.pts[p.i] += dt; }
    if (g.pc <= 0) for (const p of g.p) if (p != g.it && dist(p, g.it) < p.r + g.it.r) { g.it = p; g.pc = 1; p.stun = .5; sfx(300, .15); burst(p.x, p.y, '#8ce99a', 14); break; }
  },
  draw(g) { g.p.forEach(drawP); const p = g.it; ringS(p.x, p.y, p.r + 7 + Math.sin(g.t * 8) * 2, '#8ce99a', 5); txt('IT', p.x, p.y - p.r - 20, 20, '#8ce99a'); }
});

game({
  name: 'Paddle Panic', genre: 'Paddle sports', desc: 'Guard your wall with your paddle. Let the ball past and you lose a life. Three lives each. The ball keeps speeding up.', ctrl: 'Slide along your wall (UP/DOWN on side walls, LEFT/RIGHT on top/bottom)', elim: 1, T: 100,
  init(g) { g.A = { x: 320, y: 40, s: 640 }; g.p.forEach(p => { p.pos = .5; p.hp = 3; p.r = 14; }); this.place(g); this.serve(g); },
  place(g) { const A = g.A; for (const p of g.p) { const q = A.s * p.pos; if (p.i < 2) { p.x = A.x + (p.i ? A.s : 0); p.y = A.y + q; } else { p.y = A.y + (p.i == 3 ? A.s : 0); p.x = A.x + q; } } },
  serve(g) { const a = rnd(0, TAU); g.ball = { x: 640, y: 360, vx: Math.cos(a) * 320, vy: Math.sin(a) * 320, r: 12 }; g.wait = .9; },
  update(g, dt) {
    for (const p of g.p) { if (!p.alive) continue; const I = IN[p.i]; p.pos = clamp(p.pos + (p.i < 2 ? I.y : I.x) * 1.25 * p.spd * dt, .1, .9); } this.place(g);
    if (g.wait > 0) { g.wait -= dt; return; } const b = g.ball, A = g.A; b.x += b.vx * dt; b.y += b.vy * dt;
    for (let s = 0; s < 4; s++) {
      const pen = s == 0 ? A.x + b.r - b.x : s == 1 ? b.x + b.r - A.x - A.s : s == 2 ? A.y + b.r - b.y : b.y + b.r - A.y - A.s; if (pen <= 0) continue;
      const o = g.p[s], on = o && o.alive, al = (s < 2 ? b.y - A.y : b.x - A.x) / A.s, v0 = Math.hypot(b.vx, b.vy) || 1, n = s % 2 ? -1 : 1;
      if (on && Math.abs(al - o.pos) > .118) { if (--o.hp <= 0) { if (!out(g, o)) o.hp = 1; } else { sfx(150, .2, 'sawtooth'); burst(b.x, b.y, o.col, 15); g.shake = .15; } this.serve(g); return; }
      const sp = on ? Math.min(900, v0 * 1.05) : v0, t = clamp(on ? (al - o.pos) / .118 * .75 : (s < 2 ? b.vy : b.vx) / v0, -.9, .9), nn = Math.sqrt(1 - t * t);
      if (s < 2) { b.vx = n * sp * nn; b.vy = sp * t; b.x += n * pen; } else { b.vy = n * sp * nn; b.vx = sp * t; b.y += n * pen; } sfx(500, .03);
    }
  },
  draw(g) {
    const A = g.A; rect(A.x, A.y, A.s, A.s, '#1b2033'); c.strokeStyle = '#3b4a6b'; c.lineWidth = 4; c.strokeRect(A.x, A.y, A.s, A.s);
    for (const p of g.p) { if (!p.alive) continue; const L = A.s * .2; if (p.i < 2) rect(p.x - 8, p.y - L / 2, 16, L, p.col); else rect(p.x - L / 2, p.y - 8, L, 16, p.col); const tx = p.i == 0 ? A.x - 70 : p.i == 1 ? A.x + A.s + 70 : W / 2 + 420, ty = p.i < 2 ? H / 2 : (p.i == 2 ? 120 : 600); txt(players[p.i].name, tx, ty - 20, 18, p.col); txt('♥'.repeat(p.hp), tx, ty + 10, 24, p.col); }
    circ(g.ball.x, g.ball.y, g.ball.r, '#fff');
  }
});

game({
  name: 'Pump It', genre: 'Push your luck', desc: 'Every pump adds a point to your balloon — and makes it likelier to pop. Bank before it bursts! Three rounds.', ctrl: 'ACTION = pump  ·  DOWN = bank your points', T: 120,
  init(g) { g.rd = 0; g.p.forEach((p, i) => { p.x = W * (i + 1) / (g.n + 1); p.y = 420; }); this.round(g); },
  round(g) { g.rd++; g.rt = 12; g.rest = 0; g.p.forEach(p => { p.pot = 0; p.st = 0; }); },
  update(g, dt) {
    if (g.rest > 0) { g.rest -= dt; if (g.rest <= 0) { if (g.rd >= 3) g.done = true; else this.round(g); } return; } g.rt -= dt;
    for (const p of g.p) {
      if (p.st) continue; const I = IN[p.i];
      if (I.ap) { p.pot++; sfx(300 + p.pot * 40, .05, 'sine'); if (R() < p.pot * .012) { p.st = 2; p.pot = 0; burst(p.x, p.y - 80, p.col, 40); sfx(100, .3, 'sawtooth'); } }
      else if (I.dy > 0 || g.rt <= 0) { p.st = 1; g.pts[p.i] += p.pot; sfx(1000, .1, 'sine'); }
    }
    if (g.p.every(p => p.st)) g.rest = 1.6;
  },
  draw(g) {
    txt('ROUND ' + g.rd + ' / 3', W / 2, 70, 26, '#9aa5c4'); txt(Math.max(0, Math.ceil(g.rt)), W / 2, 110, 30, '#ffd43b');
    for (const p of g.p) { if (p.st != 2) { const r = 26 + p.pot * 6; rect(p.x - 1, p.y - 60, 2, 60, '#868e96'); circ(p.x, p.y - 60 - r, r, p.col); txt(p.pot, p.x, p.y - 60 - r, 26, '#111'); } drawP(p); txt(p.st == 1 ? 'BANKED' : p.st == 2 ? 'POP!' : (p.pot * 1.2).toFixed(0) + '% risk', p.x, p.y + 50, 20, p.st == 2 ? '#ff6b6b' : p.st ? '#69db7c' : '#9aa5c4'); }
  }
});

game({
  name: 'Putt Party', genre: 'Mini golf', desc: 'Aim, hold to charge, release to putt. Sink the ball to score — then the hole moves. First to 3.', ctrl: 'LEFT/RIGHT = aim  ·  hold + release ACTION = putt', T: 90, bg: '#1d4a2a',
  init(g) { ring(g, 220); g.p.forEach(p => { p.r = 12; p.a = Math.atan2(H / 2 - p.y, W / 2 - p.x); p.ch = 0; }); this.hole(g); },
  hole(g) { g.h = { x: rnd(140, W - 140), y: rnd(120, H - 140) }; },
  update(g, dt) {
    for (const p of g.p) {
      const I = IN[p.i], sp = Math.hypot(p.vx, p.vy);
      if (sp <= 12) {
        p.vx = p.vy = 0; p.a += I.x * 2.4 * dt; p.fx = Math.cos(p.a); p.fy = Math.sin(p.a);
        if (I.a) p.ch = Math.min(1, p.ch + dt * .9); else if (p.ch > 0) { const s = 200 + p.ch * 900; p.vx = p.fx * s; p.vy = p.fy * s; p.ch = 0; sfx(400, .06); }
      } else {
        p.x += p.vx * dt; p.y += p.vy * dt; const f = Math.max(0, 1 - 1.4 * dt); p.vx *= f; p.vy *= f;
        if (p.x < p.r || p.x > W - p.r) { p.vx *= -1; p.x = clamp(p.x, p.r, W - p.r); } if (p.y < p.r || p.y > H - 50) { p.vy *= -1; p.y = clamp(p.y, p.r, H - 50); }
      }
      if (dist(p, g.h) < 20 && sp < 420) { g.pts[p.i]++; burst(g.h.x, g.h.y, p.col, 30); sfx(1100, .2, 'sine'); p.vx = p.vy = 0; this.hole(g); if (g.pts[p.i] >= 3) g.done = true; }
    }
  },
  draw(g) {
    circ(g.h.x, g.h.y, 22, '#0b1f12'); rect(g.h.x - 1, g.h.y - 50, 3, 50, '#fff'); c.fillStyle = '#ff6b6b'; c.beginPath(); c.moveTo(g.h.x + 2, g.h.y - 50); c.lineTo(g.h.x + 28, g.h.y - 40); c.lineTo(g.h.x + 2, g.h.y - 30); c.fill();
    for (const p of g.p) { if (Math.hypot(p.vx, p.vy) <= 12) { c.strokeStyle = p.col; c.lineWidth = 3; c.setLineDash([6, 6]); c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x + p.fx * (50 + p.ch * 160), p.y + p.fy * (50 + p.ch * 160)); c.stroke(); c.setLineDash([]); } circ(p.x, p.y, p.r, '#fff'); circ(p.x, p.y, p.r - 4, p.col); }
  }
});

game({
  name: 'Sky Joust', genre: 'Flap fighter', desc: 'Flap around and land on your rivals from above. Whoever is higher in a clash scores. The sides wrap around.', ctrl: 'LEFT/RIGHT  ·  ACTION = flap', T: 45, bg: '#16243a',
  init(g) { g.p.forEach((p, i) => { p.x = W * (i + 1) / (g.n + 1); p.y = 300; p.r = 18; }); },
  update(g, dt) {
    for (const p of g.p) {
      const I = IN[p.i]; p.vx += (I.x * 300 * p.spd - p.vx) * Math.min(1, 3 * dt); p.vy += 900 * dt; if (I.ap) { p.vy = -360; sfx(600, .03); } if (I.dx) p.fx = I.dx;
      p.x = (p.x + p.vx * dt + W) % W; p.y += p.vy * dt; if (p.y > H - 60 - p.r) { p.y = H - 60 - p.r; p.vy = 0; } if (p.y < p.r) { p.y = p.r; p.vy = Math.abs(p.vy) * .5; }
    }
    for (let i = 0; i < g.n; i++) for (let j = i + 1; j < g.n; j++) {
      const a = g.p[i], b = g.p[j]; if (a.inv > 0 || b.inv > 0 || dist(a, b) > a.r + b.r) continue; const dy = a.y - b.y;
      if (Math.abs(dy) > 8) { const w = dy < 0 ? a : b, l = dy < 0 ? b : a; g.pts[w.i]++; burst(l.x, l.y, l.col, 25); sfx(150, .2, 'sawtooth'); l.x = rnd(100, W - 100); l.y = 110; l.vx = l.vy = 0; l.inv = 1.5; w.vy = -260; }
      else { const t = a.vx; a.vx = b.vx; b.vx = t; const s = Math.sign(a.x - b.x) || 1; a.x += s * 6; b.x -= s * 6; a.vx += s * 120; b.vx -= s * 120; }
    }
  },
  draw(g) { rect(0, H - 60, W, 60, '#3b4a6b'); for (const p of g.p) { if (!(p.inv > 0 && Math.floor(p.inv * 12) % 2)) { const up = p.vy < 0 ? -10 : 6; c.fillStyle = '#fff'; c.beginPath(); c.moveTo(p.x - p.r, p.y); c.lineTo(p.x - p.r - 16, p.y + up); c.lineTo(p.x - p.r, p.y + 8); c.fill(); c.beginPath(); c.moveTo(p.x + p.r, p.y); c.lineTo(p.x + p.r + 16, p.y + up); c.lineTo(p.x + p.r, p.y + 8); c.fill(); } drawP(p); } }
});

game({
  name: 'Musical Spots', genre: 'Scramble', desc: 'When the spots appear there is one fewer than there are players. Grab one or you are out.', ctrl: 'Move', elim: 1, mv: 1, T: 150,
  init(g) { ring(g, 200); this.roam(g); },
  roam(g) { g.ph = 0; g.pt = rnd(2.5, 5); g.sp = []; g.p.forEach(p => p.sp = null); },
  update(g, dt) {
    g.pt -= dt; const al = g.p.filter(p => p.alive); for (const p of al) if (!p.sp) { mv(g, p, dt, 280); bound(p, 0, 50, W, H - 40); } bump(g, .6);
    if (g.ph == 0 && g.pt <= 0) { g.ph = 1; g.pt = 5; sfx(900, .2, 'sine'); for (let k = 0; k < Math.max(1, al.length - 1); k++) { let s, tr = 0; do s = { x: rnd(90, W - 90), y: rnd(110, H - 110), o: null }; while (tr++ < 40 && (g.sp.some(q => dist(q, s) < 130) || al.some(p => dist(p, s) < 170))); g.sp.push(s); } }
    else if (g.ph == 1) {
      for (const s of g.sp) if (!s.o) for (const p of al) if (!p.sp && dist(p, s) < 30) { s.o = p; p.sp = s; p.x = s.x; p.y = s.y; sfx(1100, .08, 'sine'); break; }
      if (g.pt <= 0 || g.sp.every(s => s.o)) { for (const p of al) if (!p.sp && (g.n > 1 || g.pt <= 0)) out(g, p); this.roam(g); }
    }
  },
  draw(g) { if (g.ph == 0) txt('♪  keep moving  ♪', W / 2, 90, 30, '#9aa5c4'); else txt('GRAB A SPOT!', W / 2, 90, 44, '#ffd43b'); for (const s of g.sp) { circ(s.x, s.y, 36, s.o ? s.o.col + '66' : '#2f9e44'); ringS(s.x, s.y, 36, '#fff', 3); } g.p.forEach(drawP); }
});

game({
  name: 'Colour Panic', genre: 'Survival', desc: 'A colour is called. Get onto a tile of that colour before every other tile drops away. It gets faster.', ctrl: 'Move', elim: 1, mv: 1, T: 120, bg: '#05060a',
  init(g) { ring(g, 180); g.rd = 0; this.gen(g); },
  gen(g) { g.tiles = Array.from({ length: 40 }, () => ri(0, 3)); g.tc = ri(0, 3); if (!g.tiles.includes(g.tc)) g.tiles[ri(0, 39)] = g.tc; g.ph = 0; g.pt = Math.max(1.1, 3.4 - g.rd * .25); g.rd++; },
  update(g, dt) {
    g.pt -= dt; for (const p of g.p) if (p.alive) { mv(g, p, dt, 270); bound(p); }
    if (g.ph == 0 && g.pt <= 0) { g.ph = 1; g.pt = 1.3; sfx(200, .2, 'sawtooth'); }
    else if (g.ph == 1) {
      for (const p of g.p) { if (!p.alive) continue; const k = Math.min(4, p.y / 144 | 0) * 8 + Math.min(7, p.x / 160 | 0); if (g.tiles[k] != g.tc) { const s = g.tiles.indexOf(g.tc); out(g, p, s % 8 * 160 + 80, (s >> 3) * 144 + 72); } }
      if (g.pt <= 0) this.gen(g);
    }
  },
  draw(g) {
    const CC = ['#e03131', '#1c7ed6', '#2f9e44', '#f08c00'], NN = ['RED', 'BLUE', 'GREEN', 'ORANGE'];
    g.tiles.forEach((t, k) => { if (g.ph == 1 && t != g.tc) return; rect(k % 8 * 160 + 3, (k >> 3) * 144 + 3, 154, 138, CC[t]); });
    g.p.forEach(p => { ringS(p.x, p.y, p.r + 2, '#111', 4); drawP(p); }); rect(W / 2 - 170, 50, 340, 60, '#111'); txt(NN[g.tc] + '!', W / 2, 80, 40, CC[g.tc]); if (g.ph == 0) rect(W / 2 - 170, 110, 340 * Math.max(0, g.pt / 3.4), 8, '#fff');
  }
});

game({
  name: 'RPS Showdown', genre: 'Mind game', desc: 'Lock in rock, paper or scissors. Score a point for every rival you beat. No pick loses to everyone. First to 5.', ctrl: 'LEFT = rock  ·  UP = paper  ·  RIGHT = scissors', T: 120,
  init(g) { g.rd = 0; g.p.forEach((p, i) => { p.x = W * (i + 1) / (g.n + 1); p.y = 430; p.r = 40; }); this.round(g); },
  round(g) { g.rd++; g.ph = 0; g.pt = 3; g.p.forEach(p => { p.ch = -1; p.got = 0; }); },
  update(g, dt) {
    g.pt -= dt;
    if (g.ph == 0) {
      for (const p of g.p) { const d = IN[p.i].dir; if (p.ch < 0 && (d == 3 || d == 0 || d == 1)) { p.ch = [1, 2, -1, 0][d]; sfx(500, .05); } }
      if (g.pt <= 0 || g.p.every(p => p.ch >= 0)) { g.ph = 1; g.pt = 2.2; for (const a of g.p) for (const b of g.p) if (a != b && a.ch >= 0 && (b.ch < 0 || (a.ch - b.ch + 3) % 3 == 1)) { a.got++; g.pts[a.i]++; } sfx(800, .15, 'sine'); }
    } else if (g.pt <= 0) { if (g.p.some(p => g.pts[p.i] >= 5)) g.done = true; else this.round(g); }
  },
  draw(g) {
    const NM = ['ROCK', 'PAPER', 'SCISSORS'], IC = ['●', '▮', '✂'];
    if (g.ph == 0) { txt('CHOOSE!', W / 2, 150, 70, '#ffd43b'); txt(Math.max(1, Math.ceil(g.pt)), W / 2, 240, 60); } else txt('SHOW!', W / 2, 150, 70, '#69db7c');
    for (const p of g.p) { drawP(p); if (g.ph == 0) txt(p.ch >= 0 ? 'LOCKED' : '. . .', p.x, p.y - 80, 24, p.ch >= 0 ? '#69db7c' : '#6b7591'); else { txt(p.ch < 0 ? '—' : IC[p.ch], p.x, p.y - 120, 60, '#fff'); txt(p.ch < 0 ? 'NO PICK' : NM[p.ch], p.x, p.y - 70, 22, p.col); if (p.got) txt('+' + p.got, p.x, p.y + 70, 34, '#69db7c'); } }
  }
});

game({
  name: 'Sheep Rustlers', genre: 'Herding', desc: 'Sheep run away from anyone nearby. Scare them into your own corner pen to score.', ctrl: 'Move  ·  ACTION = dash', mv: 1, T: 45, bg: '#1d3b24',
  init(g) { corners(g, 110); g.base = g.p.map(p => ({ x: p.x, y: p.y, r: 112 })); g.sh = []; for (let i = 0; i < 9; i++) g.sh.push(this.mk()); },
  mk() { return { x: W / 2 + rnd(-190, 190), y: H / 2 + rnd(-130, 130), vx: 0, vy: 0, a: rnd(0, TAU) }; },
  update(g, dt) {
    for (const p of g.p) { mv(g, p, dt, 270); dash(p); bound(p); } bump(g, .6);
    for (const s of g.sh) {
      let fx = 0, fy = 0; for (const p of g.p) { const d = dist(p, s) || 1; if (d < 140) { fx += (s.x - p.x) / d * (140 - d); fy += (s.y - p.y) / d * (140 - d); } }
      const m = Math.hypot(fx, fy); let tx, ty, k; if (m > 0) { tx = fx / m * 195; ty = fy / m * 195; k = 6; } else { s.a += rnd(-2, 2) * dt; tx = Math.cos(s.a) * 30; ty = Math.sin(s.a) * 30; k = 2; }
      s.vx += (tx - s.vx) * Math.min(1, k * dt); s.vy += (ty - s.vy) * Math.min(1, k * dt); s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.x < 16 || s.x > W - 16) { s.vx *= -1; s.x = clamp(s.x, 16, W - 16); } if (s.y < 16 || s.y > H - 16) { s.vy *= -1; s.y = clamp(s.y, 16, H - 16); }
      g.base.forEach((b, i) => { if (dist(s, b) < b.r - 12) { g.pts[i]++; burst(s.x, s.y, g.p[i].col, 16); sfx(900, .08, 'sine'); Object.assign(s, this.mk()); } });
    }
  },
  draw(g) {
    g.base.forEach((b, i) => { c.globalAlpha = .3; circ(b.x, b.y, b.r, g.p[i].col); c.globalAlpha = 1; ringS(b.x, b.y, b.r, g.p[i].col, 4); });
    for (const s of g.sh) { for (const [dx, dy] of [[-7, -4], [7, -4], [0, 6], [0, -8]]) circ(s.x + dx, s.y + dy, 10, '#f1f3f5'); const a = Math.atan2(s.vy, s.vx); circ(s.x + Math.cos(a) * 13, s.y + Math.sin(a) * 13, 6, '#343a40'); }
    g.p.forEach(drawP);
  }
});

function snakeHit(g, x, y) { if (x < 0 || y < 0 || x >= 64 || y >= 35) return true; for (const p of g.p) if (p.alive) for (const s of p.body) if (s[0] == x && s[1] == y) return true; return false; }
game({
  name: 'Snake Feast', genre: 'Arcade', desc: 'Eat apples to grow and score. Hit a wall or any snake and you are out. Survivors rank by apples.', ctrl: 'Steer with directions', elim: 1, T: 75, bg: '#0d1410',
  init(g) { g.acc = 0; g.ap = []; const S = [[10, 9, 1, 0], [53, 25, -1, 0], [53, 9, 0, 1], [10, 25, 0, -1]]; g.p.forEach((p, i) => { const s = S[i]; p.body = [[s[0], s[1]]]; p.ddx = s[2]; p.ddy = s[3]; p.grow = 4; p.w = null; p.r = 9; p.x = s[0] * 20 + 10; p.y = s[1] * 20 + 10; }); for (let k = 0; k < 6; k++) g.ap.push([ri(1, 62), ri(1, 33)]); },
  update(g, dt) {
    for (const p of g.p) { const I = IN[p.i]; if (I.dx && !p.ddx) p.w = [I.dx, 0]; else if (I.dy && !p.ddy) p.w = [0, I.dy]; }
    g.acc += dt * 10;
    while (g.acc >= 1) {
      g.acc--;
      for (const p of g.p) {
        if (!p.alive) continue; if (p.w) { [p.ddx, p.ddy] = p.w; p.w = null; } const x = p.body[0][0] + p.ddx, y = p.body[0][1] + p.ddy;
        if (snakeHit(g, x, y)) { if (out(g, p)) p.body = []; else if (x < 0 || y < 0 || x >= 64 || y >= 35) { p.ddx = -p.ddx; p.ddy = -p.ddy; } continue; }
        p.body.unshift([x, y]); if (p.grow > 0) p.grow--; else p.body.pop(); p.x = x * 20 + 10; p.y = y * 20 + 10;
        const a = g.ap.findIndex(q => q[0] == x && q[1] == y); if (a >= 0) { g.ap[a] = [ri(1, 62), ri(1, 33)]; p.grow += 3; g.pts[p.i]++; sfx(900, .05, 'sine'); }
      }
    }
  },
  draw(g) { rect(0, 700, W, 20, '#07080d'); for (const a of g.ap) circ(a[0] * 20 + 10, a[1] * 20 + 10, 8, '#ff6b6b'); for (const p of g.p) { if (!p.alive) continue; p.body.forEach((s, k) => rect(s[0] * 20 + 1, s[1] * 20 + 1, 18, 18, k ? p.col : '#fff')); } }
});

game({
  name: 'Cannon Lob', genre: 'Artillery', desc: 'Aim, hold to charge, release to lob a shell over the wall. Every hit on a rival scores.', ctrl: 'LEFT/RIGHT = aim  ·  hold + release ACTION = fire', T: 60, bg: '#16243a',
  init(g) { g.p.forEach((p, i) => { p.r = 20; p.x = W * (i + .5) / g.n; p.y = H - 110; p.a = p.x < W / 2 ? 1 : Math.PI - 1; p.ch = 0; p.shell = null; }); },
  update(g, dt) {
    for (const p of g.p) {
      const I = IN[p.i]; p.a = clamp(p.a - I.x * 1.4 * dt, .15, Math.PI - .15); p.fx = Math.cos(p.a);
      if (!p.shell) { if (I.a) p.ch = Math.min(1, p.ch + dt * .8); else if (p.ch > 0) { const v = 300 + p.ch * 700; p.shell = { x: p.x, y: p.y - 20, vx: Math.cos(p.a) * v, vy: -Math.sin(p.a) * v }; p.ch = 0; sfx(200, .15, 'sawtooth'); } continue; }
      const s = p.shell; s.vy += 600 * dt; s.x += s.vx * dt; s.y += s.vy * dt; let dead = s.y > H - 90 || s.x < -60 || s.x > W + 60 || (Math.abs(s.x - W / 2) < 15 && s.y > H - 200);
      for (const o of g.p) if (o != p && o.inv <= 0 && Math.hypot(o.x - s.x, o.y - s.y) < o.r + 14) { g.pts[p.i]++; o.inv = 1.2; burst(o.x, o.y, o.col, 25); sfx(120, .25, 'sawtooth'); g.shake = .2; dead = true; }
      if (dead) { burst(s.x, s.y, '#ffa94d', 8); p.shell = null; }
    }
  },
  draw(g) {
    rect(0, H - 90, W, 90, '#2b3a55'); rect(W / 2 - 15, H - 200, 30, 110, '#5c677d');
    for (const p of g.p) { c.strokeStyle = '#dfe6f5'; c.lineWidth = 9; c.beginPath(); c.moveTo(p.x, p.y - 10); c.lineTo(p.x + Math.cos(p.a) * 44, p.y - 10 - Math.sin(p.a) * 44); c.stroke(); drawP(p); rect(p.x - 30, p.y + 28, 60, 6, '#111'); rect(p.x - 30, p.y + 28, 60 * p.ch, 6, '#ffd43b'); if (p.shell) { circ(p.shell.x, p.shell.y, 8, '#fff'); circ(p.shell.x, p.shell.y, 5, p.col); } }
  }
});

game({
  name: 'Timber Rush', genre: 'Twitch', desc: 'Chop from the LEFT or RIGHT side. The tree drops one log per chop — do not be standing under a branch when it lands!', ctrl: 'LEFT / RIGHT = chop from that side', T: 25,
  init(g) { g.seq = [0, 0]; for (let i = 0; i < 600; i++) g.seq.push(R() < .55 ? pick([-1, 1]) : 0); g.p.forEach((p, i) => { p.k = 0; p.side = -1; p.r = 20; p.x = W * (i + .5) / g.n - 62; p.y = 560; }); },
  update(g) {
    g.p.forEach((p, i) => {
      const d = IN[i].dir, X = W * (i + .5) / g.n; if (p.stun <= 0 && (d == 1 || d == 3)) { p.side = d == 1 ? 1 : -1; p.k++; if (g.seq[p.k] == p.side) { p.stun = 1; sfx(150, .2, 'sawtooth'); burst(X + p.side * 62, 540, '#a47148', 14); } else { g.pts[i]++; sfx(300 + R() * 80, .04); } }
      p.x = X + p.side * 62; p.fx = -p.side;
    });
  },
  draw(g) {
    g.p.forEach((p, i) => {
      const X = W * (i + .5) / g.n; rect(X - 120, 592, 240, 6, '#2a3350');
      for (let k = 0; k < 8; k++) { const y = 532 - k * 60, b = g.seq[p.k + k]; rect(X - 28, y, 56, 58, k % 2 ? '#8a5a35' : '#a47148'); if (b) rect(b > 0 ? X + 28 : X - 108, y + 20, 80, 16, '#2f9e44'); }
      drawP(p); if (p.stun > 0) txt('BONK!', X, 120, 30, '#ff6b6b');
    });
  }
});
