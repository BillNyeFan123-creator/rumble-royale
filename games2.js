'use strict';
// ================= STEALTH / SKILL / BRAIN / RACING GAMES =================

// --- hidden-in-the-crowd games: everyone looks identical ---
function guest(x, y, r, body = '#adb5bd', hat = '#343a40') { circ(x, y, r, body); rect(x - r * .9, y - r * .75, r * 1.8, r * .3, hat); rect(x - r * .55, y - r * 1.4, r * 1.1, r * .7, hat); circ(x - r * .3, y, r * .13, '#111'); circ(x + r * .3, y, r * .13, '#111'); }
function crowd(heist) {
  return {
    name: heist ? 'Heist Party' : 'Blend In', genre: 'Stealth / social deduction', elim: 1, T: heist ? 90 : 75, bg: '#231a2e',
    desc: heist ? 'Everyone looks the same. Stand still on 3 different glowing pads to win — but act like a guest, or a rival will strike you down.' : 'Everyone looks the same. Work out which guest is you, then find and strike the other humans.',
    ctrl: 'Move  ·  ACTION = strike  (hit a guest or miss, and you are exposed + stunned)',
    init(g) {
      g.q = []; g.pads = heist ? [[200, 170], [1080, 170], [200, 560], [1080, 560], [640, 365]].map(([x, y]) => ({ x, y })) : [];
      for (let i = 0; i < 26; i++) { const q = { x: rnd(60, W - 60), y: rnd(90, H - 90), r: 17, dead: 0 }; this.aim(g, q); g.q.push(q); }
      g.p.forEach(p => { p.x = rnd(60, W - 60); p.y = rnd(90, H - 90); p.r = 17; p.rev = 0; p.pads = []; p.hold = 0; p.shield = 0; }); g.sl = null;
    },
    aim(g, q) { if (g.pads.length && R() < .45) { const d = pick(g.pads); q.tx = d.x + rnd(-18, 18); q.ty = d.y + rnd(-18, 18); q.w = rnd(1, 2.6); } else { q.tx = rnd(60, W - 60); q.ty = rnd(90, H - 90); q.w = rnd(.2, 2.5); } },
    update(g, dt) {
      for (const q of g.q) { if (q.dead) continue; const dx = q.tx - q.x, dy = q.ty - q.y, d = Math.hypot(dx, dy); if (d < 4) { q.w -= dt; if (q.w <= 0) this.aim(g, q); } else { q.x += dx / d * 115 * dt; q.y += dy / d * 115 * dt; } }
      if (g.sl) { g.sl.t -= dt; if (g.sl.t <= 0) g.sl = null; }
      for (const p of g.p) {
        if (!p.alive) continue; p.rev -= dt; const I = IN[p.i]; let x = I.x, y = I.y; const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; }
        if (p.stun <= 0) { p.x += x * 115 * dt; p.y += y * 115 * dt; } bound(p, 0, 50, W, H - 40);
        if (I.ap && p.cd <= 0 && p.stun <= 0) {
          p.cd = 1.5; let best = null, bd = 62;
          for (const o of g.p) if (o != p && o.alive && dist(o, p) < bd) { bd = dist(o, p); best = o; }
          for (const q of g.q) if (!q.dead && dist(q, p) < bd) { bd = dist(q, p); best = q; }
          g.sl = { x: p.x, y: p.y, t: .25 };
          if (best && best.col) { out(g, best); p.rev = 1; } else { if (best) best.dead = 1; p.rev = 3.5; p.stun = 1.3; sfx(200, .2); }
        }
        if (heist) {
          const d = g.pads.findIndex(d => dist(d, p) < 34), still = Math.abs(I.x) + Math.abs(I.y) < .1;
          if (d >= 0 && still && !p.pads.includes(d)) { p.hold += dt; if (p.hold > 1.3) { p.pads.push(d); p.hold = 0; g.pts[p.i]++; sfx(1000, .12, 'sine'); if (g.pts[p.i] >= 3) g.done = true; } } else p.hold = 0;
        }
      }
    },
    draw(g) {
      for (const d of g.pads) { c.globalAlpha = .25 + .1 * Math.sin(g.t * 3); circ(d.x, d.y, 40, '#66d9e8'); c.globalAlpha = 1; ringS(d.x, d.y, 40, '#66d9e8', 2); }
      const all = [...g.q, ...g.p.filter(p => p.alive)].sort((a, b) => a.y - b.y);
      for (const o of all) {
        if (o.dead) { c.globalAlpha = .5; rect(o.x - 18, o.y + 6, 36, 8, '#868e96'); c.globalAlpha = 1; continue; }
        if (o.col && o.rev > 0) { guest(o.x, o.y, o.r, o.col, '#111'); txt(players[o.i].name, o.x, o.y - 38, 16, o.col); } else guest(o.x, o.y, o.r);
      }
      if (g.sl) ringS(g.sl.x, g.sl.y, 62 * (1 - g.sl.t * 2), '#fff', 4);
    }
  };
}
game(crowd(false)); game(crowd(true));

game({
  name: 'Red Light, Green Light', genre: 'Nerve', desc: 'Run on green. FREEZE on red or you go back to the start. You skid when you stop!', ctrl: 'Hold RIGHT to run', T: 60,
  init(g) { g.st = 0; g.lt = rnd(2, 4); g.el = 0; g.p.forEach((p, i) => { p.x = 80; p.y = laneY(g, i); p.vx = 0; }); },
  update(g, dt) {
    g.lt -= dt; g.el += dt;
    if (g.lt <= 0) { g.st = (g.st + 1) % 3; g.el = 0; g.lt = g.st == 0 ? rnd(1.2, 3.5) : g.st == 1 ? .5 : rnd(1.5, 3); sfx([700, 500, 250][g.st], .15, 'sine'); }
    for (const p of g.p) {
      const tg = Math.max(0, IN[p.i].x) * 330 * p.spd; p.vx += (tg - p.vx) * Math.min(1, (tg > p.vx ? 3 : 7) * dt); p.x += p.vx * dt;
      if (g.st == 2 && g.el > .3 && p.vx > 28) { burst(p.x, p.y, p.col, 20); p.x = 80; p.vx = 0; sfx(150, .25, 'sawtooth'); }
      g.pts[p.i] = Math.round(p.x / 10); if (p.x >= W - 90) { g.pts[p.i] = 999; g.done = true; }
    }
  },
  draw(g) {
    rect(W - 90, 80, 10, H - 160, '#fff'); g.p.forEach((p, i) => { rect(0, laneY(g, i) + 30, W, 2, '#2a3350'); drawP(p); });
    rect(W / 2 - 40, 44, 80, 40, '#111'); circ(W / 2, 64, 15, ['#51cf66', '#ffd43b', '#ff6b6b'][g.st]); txt(['GO!', 'CAREFUL...', 'FREEZE!'][g.st], W / 2, 108, 26, ['#51cf66', '#ffd43b', '#ff6b6b'][g.st]);
  }
});

game({
  name: 'Quick Draw', genre: 'Reaction', desc: 'Hit ACTION the instant it says DRAW! Jump early on a fake word and you sit the round out. First to 3.', ctrl: 'ACTION', T: 120,
  init(g) { g.p.forEach((p, i) => { p.x = W * (i + 1) / (g.n + 1); p.y = 520; p.r = 40; }); this.round(g); },
  round(g) { g.w = rnd(1.8, 5); g.word = '. . .'; g.go = 0; g.fk = rnd(.7, 1.4); g.rest = 0; g.p.forEach(p => p.foul = 0); },
  update(g, dt) {
    if (g.rest > 0) { g.rest -= dt; if (g.rest <= 0) this.round(g); return; }
    g.w -= dt;
    if (!g.go) { g.fk -= dt; if (g.fk <= 0) { g.fk = rnd(.5, 1.3); g.word = pick(['DRAT!', 'DRAWER', 'DRAGON!', 'WAIT', 'DRAWL', 'DROP!', '. . .', 'STEADY', 'DRAB', 'DRAIN!']); } if (g.w <= 0) { g.go = 1; g.word = 'DRAW!'; sfx(1000, .15); } }
    for (const p of shuffle([...g.p])) if (IN[p.i].ap && !p.foul) {
      if (g.go) { g.pts[p.i]++; g.word = players[p.i].name + '!'; g.rest = 1.4; burst(p.x, p.y, p.col, 30); sfx(1300, .15, 'sine'); if (g.pts[p.i] >= 3) g.done = true; break; }
      else { p.foul = 1; sfx(120, .2, 'sawtooth'); }
    }
    if (!g.rest && ((g.go && g.w < -3) || (!g.go && g.p.every(p => p.foul)))) this.round(g);
  },
  draw(g) { txt(g.word, W / 2, 260, 120, g.go ? '#ffd43b' : '#cfd6ea'); for (const p of g.p) { c.globalAlpha = p.foul ? .3 : 1; drawP(p); c.globalAlpha = 1; if (p.foul) txt('TOO EARLY', p.x, p.y + 62, 18, '#ff6b6b'); } }
});

game({
  name: 'Mash Dash', genre: 'Button masher', desc: 'Mash ACTION as fast as you can to sprint to the finish.', ctrl: 'Mash ACTION', T: 25,
  init(g) { g.p.forEach((p, i) => { p.x = 80; p.y = laneY(g, i); p.vx = 0; }); },
  update(g, dt) { for (const p of g.p) { if (IN[p.i].ap) p.vx += 42; p.vx *= Math.max(0, 1 - 2.2 * dt); p.x += p.vx * dt * p.spd; g.pts[p.i] = Math.round(p.x / 10); if (p.x >= W - 90) { g.pts[p.i] = 999; g.done = true; } } },
  draw(g) { rect(W - 90, 80, 10, H - 160, '#fff'); g.p.forEach((p, i) => { rect(0, laneY(g, i) + 30, W, 2, '#2a3350'); for (let k = 1; k < 4; k++) circ(p.x - k * p.vx * .05, p.y, p.r * (1 - k * .2), p.col + '44'); drawP(p); }); }
});

game({
  name: 'Bullseye Stop', genre: 'Timing', desc: 'Stop your needle as close to the target as you can. Four rounds, it gets faster.', ctrl: 'ACTION = stop', T: 120,
  init(g) { g.rd = 0; this.round(g); },
  round(g) { g.rd++; g.tg = rnd(.15, .85); g.ph = rnd(0, 10); g.sp = .9 + g.rd * .5; g.rest = 0; g.rt = 0; g.p.forEach(p => { p.lock = -1; p.got = 0; }); },
  update(g, dt) {
    if (g.rest > 0) { g.rest -= dt; if (g.rest <= 0) { if (g.rd >= 4) g.done = true; else this.round(g); } return; }
    g.rt += dt; g.ph += dt * g.sp; g.v = Math.abs((g.ph % 2) - 1);
    for (const p of g.p) if (p.lock < 0 && (IN[p.i].ap || g.rt > 8)) { p.lock = g.v; p.got = Math.max(0, Math.round(100 - Math.abs(g.v - g.tg) * 300)); g.pts[p.i] += p.got; sfx(400 + p.got * 6, .1, 'sine'); }
    if (g.p.every(p => p.lock >= 0)) g.rest = 1.8;
  },
  draw(g) {
    txt('ROUND ' + g.rd + ' / 4', W / 2, 70, 26, '#9aa5c4');
    g.p.forEach((p, i) => {
      const y = laneY(g, i), x0 = 190, w = 900; rect(x0, y - 14, w, 28, '#2a3350'); rect(x0 + g.tg * w - 30, y - 14, 60, 28, '#2f9e44'); rect(x0 + g.tg * w - 4, y - 20, 8, 40, '#b2f2bb');
      const v = p.lock >= 0 ? p.lock : (g.v || 0); rect(x0 + v * w - 4, y - 30, 8, 60, p.col); txt(players[i].name, 100, y, 22, p.col); if (p.lock >= 0) txt('+' + p.got, 1160, y, 26, '#fff');
    });
  }
});

game({
  name: 'Echo Arrows', genre: 'Memory', desc: 'Watch the arrows, then repeat them. One mistake and you are out. The sequence grows.', ctrl: 'Directions', elim: 1, T: 150,
  init(g) { g.seq = [ri(0, 3), ri(0, 3)]; g.p.forEach((p, i) => { p.x = W * (i + 1) / (g.n + 1); p.y = 540; p.r = 34; }); this.show(g); },
  show(g) { g.seq.push(ri(0, 3)); g.ph = 0; g.st = 0; g.lk = -1; g.p.forEach(p => p.k = 0); },
  update(g, dt) {
    g.st += dt; const L = g.seq.length;
    if (g.ph == 0) { const k = Math.floor(g.st / .55); if (k >= L) { if (g.st > L * .55 + .4) { g.ph = 1; g.st = 0; sfx(800, .1); } } else if (k != g.lk) { g.lk = k; sfx(300 + g.seq[k] * 120, .12, 'sine'); } return; }
    if (g.ph == 2) { if (g.st > .8) this.show(g); return; }
    const lim = L * 1.1 + 2;
    for (const p of g.p) {
      if (!p.alive) continue; const d = IN[p.i].dir;
      if (d >= 0 && p.k < L) { if (d == g.seq[p.k]) { p.k++; sfx(300 + d * 120, .08, 'sine'); } else out(g, p); }
      if (g.st > lim && p.k < L) out(g, p);
    }
    const al = g.p.filter(p => p.alive); if (al.length && al.every(p => p.k >= L)) { g.ph = 2; g.st = 0; }
  },
  draw(g) {
    const L = g.seq.length;
    if (g.ph == 0) { txt('WATCH', W / 2, 90, 30, '#9aa5c4'); const k = Math.floor(g.st / .55); if (k < L && g.st % .55 < .42) arrow(W / 2, 290, 90, g.seq[k], ACOL[g.seq[k]]); txt((Math.min(k, L - 1) + 1) + ' / ' + L, W / 2, 430, 22, '#6b7591'); }
    else if (g.ph == 1) { txt('YOUR TURN!', W / 2, 200, 70, '#ffd43b'); const lim = L * 1.1 + 2; rect(W / 2 - 300, 280, 600 * Math.max(0, 1 - g.st / lim), 14, '#ffd43b'); }
    else txt('NICE!', W / 2, 220, 70, '#69db7c');
    for (const p of g.p) { drawP(p); if (!p.alive) continue; for (let k = 0; k < L; k++) circ(p.x - (L - 1) * 9 + k * 18, p.y + 60, 6, k < p.k ? p.col : '#2a3350'); }
  }
});

// --- quiz engine: answer with a direction ---
const DP = [[640, 175], [1010, 370], [640, 565], [270, 370]];
function quiz(name, desc, gen, drawQ) {
  return {
    name, genre: 'Brain / reaction', desc: desc + ' Wrong answer: lose a point and sit out. First to 5.', ctrl: 'UP / RIGHT / DOWN / LEFT = answer', T: 75,
    init(g) { this.q(g); },
    q(g) { g.Q = gen(); g.qt = 0; g.rest = 0; g.who = null; g.p.forEach(p => p.lock = 0); },
    update(g, dt) {
      if (g.rest > 0) { g.rest -= dt; if (g.rest <= 0) this.q(g); return; } g.qt += dt;
      for (const p of shuffle([...g.p])) {
        const d = IN[p.i].dir; if (d < 0 || p.lock) continue;
        if (d == g.Q.a) { g.pts[p.i]++; g.rest = 1; g.who = p; sfx(1000, .1, 'sine'); if (g.pts[p.i] >= 5) g.done = true; break; }
        else { p.lock = 1; g.pts[p.i] = Math.max(0, g.pts[p.i] - 1); sfx(150, .15, 'sawtooth'); }
      }
      if (g.rest <= 0 && (g.qt > 7 || g.p.every(p => p.lock))) g.rest = .8;
    },
    draw(g) {
      drawQ(g, g.Q); DP.forEach((d, i) => arrow(d[0] + [0, 150, 0, -150][i], d[1] + [-105, 0, 105, 0][i], 16, i, '#6b7591'));
      if (g.rest > 0) { c.strokeStyle = '#fff'; c.lineWidth = 6; c.strokeRect(DP[g.Q.a][0] - 125, DP[g.Q.a][1] - 85, 250, 170); if (g.who) txt(players[g.who.i].name + ' +1', W / 2, 370, 40, g.who.col); }
      g.p.forEach((p, i) => { if (p.lock) txt('✖', W / 2 + (i - (g.n - 1) / 2) * 170, H - 58, 22, '#ff6b6b'); });
    }
  };
}
const CN = ['RED', 'BLUE', 'GREEN', 'YELLOW'];
game(quiz('Colour Clash', 'Press the direction whose swatch matches the INK colour of the word — not what the word says.',
  () => { const a = ri(0, 3); let w = ri(0, 3); if (w == a) w = (w + ri(1, 3)) % 4; return { a, w }; },
  (g, Q) => { DP.forEach((d, i) => { rect(d[0] - 60, d[1] - 40, 120, 80, ACOL[i]); }); if (g.rest <= 0 || !g.who) txt(CN[Q.w], W / 2, 370, 100, ACOL[Q.a]); }));
game(quiz('Count Clash', 'Press the direction of the box with the MOST dots.',
  () => { const ns = shuffle([5, 6, 7, 8, 9, 10, 11, 12, 13]).slice(0, 4); return { a: ns.indexOf(Math.max(...ns)), dots: ns.map(n => Array.from({ length: n }, () => [rnd(-100, 100), rnd(-62, 62)])) }; },
  (g, Q) => { DP.forEach((d, i) => { rect(d[0] - 120, d[1] - 80, 240, 160, '#1f2740'); for (const [x, y] of Q.dots[i]) circ(d[0] + x, d[1] + y, 9, '#ffd43b'); }); }));
game(quiz('Math Flash', 'Press the direction of the correct answer.',
  () => { const op = pick(['+', '-', '×']), x = op == '×' ? ri(2, 9) : ri(4, 40), y = op == '×' ? ri(2, 9) : ri(3, 30), v = op == '+' ? x + y : op == '-' ? x - y : x * y; const s = new Set([v]); while (s.size < 4) s.add(v + pick([-10, -3, -2, -1, 1, 2, 3, 10])); const opts = shuffle([...s]); return { a: opts.indexOf(v), opts, text: x + ' ' + op + ' ' + y }; },
  (g, Q) => { DP.forEach((d, i) => { rect(d[0] - 120, d[1] - 80, 240, 160, '#1f2740'); txt(Q.opts[i], d[0], d[1], 60); }); if (g.rest <= 0 || !g.who) txt(Q.text, W / 2, 370, 64, '#ffd43b'); }));

game({
  name: 'Beat Lanes', genre: 'Rhythm', desc: 'Press the matching direction as each arrow crosses the line. Perfect timing scores double. Stray presses cost a point.', ctrl: 'Directions', T: 32,
  init(g) { g.notes = []; let t = 2; while (t < 30.5) { g.notes.push({ t, d: ri(0, 3), h: [] }); t += pick([.3, .45, .45, .6, .9]); } g.p.forEach(p => { p.fb = ''; p.ft = 0; }); },
  update(g, dt) {
    for (const p of g.p) {
      p.ft -= dt; const d = IN[p.i].dir; if (d < 0) continue;
      const nt = g.notes.find(n => !n.h[p.i] && Math.abs(n.t - g.t) < .16 && n.d == d);
      if (nt) { nt.h[p.i] = 1; const pf = Math.abs(nt.t - g.t) < .07; g.pts[p.i] += pf ? 2 : 1; p.fb = pf ? 'PERFECT' : 'GOOD'; p.ft = .4; sfx(500 + d * 100, .05, 'sine'); }
      else { g.pts[p.i] = Math.max(0, g.pts[p.i] - 1); p.fb = 'MISS'; p.ft = .4; }
    }
  },
  draw(g) {
    const lw = Math.min(280, W / g.n - 20), CI = [2, 3, 1, 0];
    g.p.forEach((p, i) => {
      const x0 = W * (i + .5) / g.n - lw / 2; rect(x0, 50, lw, H - 100, '#1b2033'); rect(x0, 558, lw, 4, p.col);
      for (let d = 0; d < 4; d++) { c.globalAlpha = .25; arrow(x0 + lw * (CI[d] + .5) / 4, 560, 22, d, '#fff'); c.globalAlpha = 1; }
      for (const n of g.notes) { if (n.h[i]) continue; const y = 560 - (n.t - g.t) * 320; if (y < 60 || y > H - 70) continue; arrow(x0 + lw * (CI[n.d] + .5) / 4, y, 22, n.d, ACOL[n.d]); }
      if (p.ft > 0) txt(p.fb, x0 + lw / 2, 620, 24, p.fb == 'MISS' ? '#ff6b6b' : '#ffd43b');
    });
  }
});

game({
  name: 'Flap Pack', genre: 'One-button flyer', desc: 'Flap through the gaps. Touch anything and you are out.', ctrl: 'ACTION = flap', elim: 1, T: 90, bg: '#16324a',
  init(g) { g.pipes = []; g.next = 1.2; g.p.forEach((p, i) => { p.x = 220 + i * 46; p.y = 300; p.vy = 0; p.r = 15; }); },
  update(g, dt) {
    const sp = 230 + g.t * 4; g.next -= dt;
    if (g.next <= 0) { g.next = Math.max(1, 1.7 - g.t * .01); const gap = Math.max(140, 215 - g.t * 1.5); g.pipes.push({ x: W + 40, gy: rnd(90, H - 90 - gap), gap }); }
    for (const q of g.pipes) q.x -= sp * dt; if (g.pipes[0] && g.pipes[0].x < -80) g.pipes.shift();
    for (const p of g.p) {
      if (!p.alive) continue; p.vy += 1400 * dt; if (IN[p.i].ap) { p.vy = -430; sfx(600, .03); } p.y += p.vy * dt;
      let hit = p.y < p.r || p.y > H - p.r; for (const q of g.pipes) if (Math.abs(q.x - p.x) < 35 + p.r * .7 && (p.y - p.r < q.gy || p.y + p.r > q.gy + q.gap)) hit = true;
      if (hit && !out(g, p)) { p.y = clamp(p.y, 60, H - 60); if (p.y >= H - 60) p.vy = -430; }
    }
  },
  draw(g) { for (const q of g.pipes) { rect(q.x - 35, 0, 70, q.gy, '#2f9e44'); rect(q.x - 35, q.gy + q.gap, 70, H, '#2f9e44'); rect(q.x - 41, q.gy - 20, 82, 20, '#51cf66'); rect(q.x - 41, q.gy + q.gap, 82, 20, '#51cf66'); } g.p.forEach(drawP); }
});

game({
  name: 'Ring Racers', genre: 'Racing', desc: 'Three laps, clockwise. Leave the tarmac and you crawl. Boost recharges every 3 seconds.', ctrl: 'LEFT/RIGHT = steer  ·  ACTION = boost', T: 80, bg: '#1d3b24',
  init(g) { g.cx = W / 2; g.cy = 370; g.p.forEach((p, i) => { p.x = g.cx; p.y = g.cy - 190 - i * 34; p.a = 0; p.sp = 0; p.prog = 0; p.bt = 0; p.r = 13; p.la = Math.atan2(p.y - g.cy, p.x - g.cx); }); },
  update(g, dt) {
    for (const p of g.p) {
      const I = IN[p.i]; p.a += I.x * 3.2 * dt; p.fx = Math.cos(p.a); p.fy = Math.sin(p.a); p.bt -= dt;
      if (I.ap && p.cd <= 0) { p.bt = .8; p.cd = 3 * p.cdm; sfx(300, .2, 'sawtooth'); }
      const rr = Math.hypot(p.x - g.cx, p.y - g.cy), on = rr > 170 && rr < 320, mx = (on ? 340 : 120) * p.spd * (p.bt > 0 ? 1.5 : 1);
      p.sp += (mx - p.sp) * Math.min(1, 2.5 * dt); p.x += p.fx * p.sp * dt; p.y += p.fy * p.sp * dt; bound(p);
      const na = Math.atan2(p.y - g.cy, p.x - g.cx); let d = na - p.la; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; p.prog += d; p.la = na;
      g.pts[p.i] = Math.max(0, Math.floor(p.prog / TAU * 10) / 10); if (p.prog >= 3 * TAU) { g.pts[p.i] = 99; g.done = true; }
    }
    bump(g, 0);
  },
  draw(g) {
    circ(g.cx, g.cy, 320, '#495057'); ringS(g.cx, g.cy, 245, '#868e96', 2); circ(g.cx, g.cy, 170, '#1d3b24'); rect(g.cx - 3, g.cy - 320, 6, 150, '#fff'); txt('LAPS shown below  ·  first to 3', g.cx, g.cy, 18, '#8ce99a');
    for (const p of g.p) { c.save(); c.translate(p.x, p.y); c.rotate(p.a); if (p.bt > 0) rect(-30, -5, 14, 10, '#ffa94d'); rect(-17, -10, 34, 20, p.col); rect(5, -8, 7, 16, '#111'); c.restore(); if (p.cd <= 0) circ(p.x, p.y - 20, 4, '#ffd43b'); }
  }
});

game({
  name: 'Hurdle Hustle', genre: 'Auto-runner', desc: 'Jump the hurdles. Hold for a higher jump. It keeps getting faster.', ctrl: 'ACTION or UP = jump', elim: 1, T: 90,
  init(g) { g.ob = []; g.next = 1.5; g.lh = (H - 130) / g.n; g.p.forEach(p => { p.x = 200; p.h = 0; p.vy = 0; p.r = 16; p.jl = 0; }); },
  update(g, dt) {
    const sp = 380 + g.t * 9; g.next -= dt; if (g.next <= 0) { g.next = rnd(.7, 1.4) * Math.max(.6, 1 - g.t * .004); g.ob.push({ x: W + 30, w: rnd(18, 38), h: rnd(26, 54) }); }
    for (const o of g.ob) o.x -= sp * dt; if (g.ob[0] && g.ob[0].x < -60) g.ob.shift();
    g.p.forEach((p, i) => {
      if (!p.alive) return; const I = IN[i], j = I.a || I.y < -.5;
      if (p.h <= 0 && j && !p.jl) { p.vy = 560; p.jl = 1; sfx(500, .04); } if (!j) p.jl = 0;
      p.vy -= (j && p.vy > 0 ? 1500 : 2600) * dt; p.h = Math.max(0, p.h + p.vy * dt); if (p.h == 0) p.vy = 0;
      p.y = 70 + g.lh * (i + 1) - p.r - p.h;
      for (const o of g.ob) if (Math.abs(o.x - p.x) < o.w / 2 + p.r * .7 && p.h < o.h) out(g, p);
    });
  },
  draw(g) { g.p.forEach((p, i) => { const by = 70 + g.lh * (i + 1); rect(0, by, W, 4, p.alive ? p.col : '#2a3350'); if (p.alive) for (const o of g.ob) rect(o.x - o.w / 2, by - o.h, o.w, o.h, '#e8590c'); drawP(p); }); }
});

game({
  name: 'Maze Race', genre: 'Puzzle', desc: 'First to reach the star in the middle of the maze wins.', ctrl: 'Directions', T: 75,
  init(g) {
    const cw = 21, ch = 11; g.ox = (W - cw * 56) / 2; g.oy = (H - ch * 56) / 2 + 8; g.m = new Uint8Array(cw * ch);   // open-passage bits: 1 up, 2 right, 4 down, 8 left
    const seen = new Uint8Array(cw * ch), st = [[10, 5]], D = [[0, -1, 1, 4], [1, 0, 2, 8], [0, 1, 4, 1], [-1, 0, 8, 2]]; seen[5 * cw + 10] = 1;
    while (st.length) {
      const [x, y] = st[st.length - 1], o = D.filter(([dx, dy]) => { const nx = x + dx, ny = y + dy; return nx >= 0 && ny >= 0 && nx < cw && ny < ch && !seen[ny * cw + nx]; });
      if (!o.length) { st.pop(); continue; } const [dx, dy, b, ob] = pick(o); g.m[y * cw + x] |= b; g.m[(y + dy) * cw + x + dx] |= ob; seen[(y + dy) * cw + x + dx] = 1; st.push([x + dx, y + dy]);
    }
    for (let k = 0; k < 34; k++) { const x = ri(0, cw - 2), y = ri(0, ch - 1); g.m[y * cw + x] |= 2; g.m[y * cw + x + 1] |= 8; }
    const S = [[0, 0], [cw - 1, ch - 1], [cw - 1, 0], [0, ch - 1]]; g.p.forEach((p, i) => { [p.gx, p.gy] = S[i]; p.mt = 0; p.r = 18; p.x = g.ox + p.gx * 56 + 28; p.y = g.oy + p.gy * 56 + 28; });
  },
  update(g, dt) {
    for (const p of g.p) {
      p.mt -= dt; const I = IN[p.i];
      if (p.mt <= 0) { const m = g.m[p.gy * 21 + p.gx]; let k = 1; if (I.dy < 0 && m & 1) p.gy--; else if (I.dy > 0 && m & 4) p.gy++; else if (I.dx > 0 && m & 2) p.gx++; else if (I.dx < 0 && m & 8) p.gx--; else k = 0; if (k) p.mt = .11 / p.spd; }
      const q = Math.min(1, 22 * dt); p.x += (g.ox + p.gx * 56 + 28 - p.x) * q; p.y += (g.oy + p.gy * 56 + 28 - p.y) * q;
      g.pts[p.i] = 15 - Math.abs(p.gx - 10) - Math.abs(p.gy - 5); if (p.gx == 10 && p.gy == 5) { g.pts[p.i] = 99; g.done = true; }
    }
  },
  draw(g) {
    c.strokeStyle = '#7c8db5'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath();
    for (let y = 0; y < 11; y++) for (let x = 0; x < 21; x++) { const m = g.m[y * 21 + x], px = g.ox + x * 56, py = g.oy + y * 56; if (!(m & 2)) { c.moveTo(px + 56, py); c.lineTo(px + 56, py + 56); } if (!(m & 4)) { c.moveTo(px, py + 56); c.lineTo(px + 56, py + 56); } }
    c.rect(g.ox, g.oy, 21 * 56, 11 * 56); c.stroke(); txt('★', g.ox + 10 * 56 + 28, g.oy + 5 * 56 + 30, 40, '#ffd43b'); g.p.forEach(drawP);
  }
});

game({
  name: 'Lights Out', genre: 'Puzzle', desc: 'Toggling a tile also flips its four neighbours. Everyone gets the same board — first to switch every light off wins.', ctrl: 'Directions = move cursor  ·  ACTION = toggle', T: 90,
  init(g) {
    g.tg = (b, k) => { const x = k % 4, y = k >> 2; for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < 4 && ny < 4) b[ny * 4 + nx] ^= 1; } };
    const b = new Array(16).fill(0); do shuffle([...Array(16).keys()]).slice(0, 5).forEach(k => g.tg(b, k)); while (!b.some(v => v));
    g.p.forEach(p => { p.b = [...b]; p.cu = 5; });
  },
  update(g) {
    for (const p of g.p) {
      const I = IN[p.i], d = I.dir; if (d == 0 && p.cu > 3) p.cu -= 4; if (d == 2 && p.cu < 12) p.cu += 4; if (d == 1 && p.cu % 4 < 3) p.cu++; if (d == 3 && p.cu % 4 > 0) p.cu--;
      if (I.ap) { g.tg(p.b, p.cu); sfx(500, .05); } const on = p.b.reduce((a, v) => a + v, 0); g.pts[p.i] = 16 - on; if (on == 0) { g.pts[p.i] = 99; g.done = true; }
    }
  },
  draw(g) {
    const S = Math.min(68, (W / g.n - 60) / 4);
    g.p.forEach((p, i) => {
      const x0 = W * (i + .5) / g.n - S * 2, y0 = 210; txt(players[i].name, x0 + S * 2, 170, 24, p.col);
      for (let k = 0; k < 16; k++) { const x = x0 + k % 4 * S, y = y0 + (k >> 2) * S; rect(x + 3, y + 3, S - 6, S - 6, p.b[k] ? '#ffd43b' : '#252d47'); if (k == p.cu) { c.strokeStyle = p.col; c.lineWidth = 5; c.strokeRect(x + 3, y + 3, S - 6, S - 6); } }
    });
  }
});

game({
  name: 'Bomb Grid', genre: 'Maze bomber', desc: 'Drop bombs to blast crates and trap your rivals. One bomb at a time. Random fire rains down after 50 seconds.', ctrl: 'Directions  ·  ACTION = bomb', elim: 1, T: 90,
  init(g) {
    const cw = 15, ch = 9; g.ox = (W - cw * 72) / 2; g.oy = 46; g.m = new Uint8Array(cw * ch); g.bm = []; g.fl = []; g.sd = 0;   // 0 empty, 1 pillar, 2 crate
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) g.m[y * cw + x] = (x % 2 && y % 2) ? 1 : (R() < .6 ? 2 : 0);
    const S = [[0, 0], [cw - 1, ch - 1], [cw - 1, 0], [0, ch - 1]];
    g.p.forEach((p, i) => { [p.gx, p.gy] = S[i]; p.mt = 0; p.r = 22; p.x = g.ox + p.gx * 72 + 36; p.y = g.oy + p.gy * 72 + 36; for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = p.gx + dx, y = p.gy + dy; if (x >= 0 && y >= 0 && x < cw && y < ch && g.m[y * cw + x] == 2) g.m[y * cw + x] = 0; } });
  },
  update(g, dt) {
    const cw = 15, ch = 9, free = (x, y) => x >= 0 && y >= 0 && x < cw && y < ch && !g.m[y * cw + x] && !g.bm.some(b => b.x == x && b.y == y);
    for (const p of g.p) {
      if (!p.alive) continue; p.mt -= dt; const I = IN[p.i];
      if (p.mt <= 0) { if (I.dy && free(p.gx, p.gy + I.dy)) { p.gy += I.dy; p.mt = .15 / p.spd; } else if (I.dx && free(p.gx + I.dx, p.gy)) { p.gx += I.dx; p.mt = .15 / p.spd; } }
      if (I.ap && !g.bm.some(b => b.o == p.i)) { g.bm.push({ x: p.gx, y: p.gy, t: 2, o: p.i }); sfx(250, .05); }
      const q = Math.min(1, 18 * dt); p.x += (g.ox + p.gx * 72 + 36 - p.x) * q; p.y += (g.oy + p.gy * 72 + 36 - p.y) * q;
      if (g.fl.some(f => f.x == p.gx && f.y == p.gy)) out(g, p);
    }
    for (const b of g.bm) b.t -= dt; let ex;
    while ((ex = g.bm.findIndex(b => b.t <= 0)) >= 0) {
      const b = g.bm.splice(ex, 1)[0]; sfx(90, .25, 'sawtooth'); g.shake = .15; g.fl.push({ x: b.x, y: b.y, t: .45 });
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (let k = 1; k <= 2; k++) {
        const x = b.x + dx * k, y = b.y + dy * k; if (x < 0 || y < 0 || x >= cw || y >= ch || g.m[y * cw + x] == 1) break; g.fl.push({ x, y, t: .45 });
        if (g.m[y * cw + x] == 2) { g.m[y * cw + x] = 0; break; } const o = g.bm.find(q => q.x == x && q.y == y); if (o) o.t = 0;
      }
    }
    for (let i = g.fl.length - 1; i >= 0; i--) if ((g.fl[i].t -= dt) <= 0) g.fl.splice(i, 1);
    if (g.t > 50) { g.sd -= dt; if (g.sd <= 0) { g.sd = Math.max(.08, .5 - (g.t - 50) * .012); const x = ri(0, cw - 1), y = ri(0, ch - 1); if (g.m[y * cw + x] != 1) { g.m[y * cw + x] = 0; g.fl.push({ x, y, t: .6 }); } } }
  },
  draw(g) {
    rect(g.ox, g.oy, 15 * 72, 9 * 72, '#1f2740');
    for (let k = 0; k < 135; k++) { const v = g.m[k], x = g.ox + k % 15 * 72, y = g.oy + (k / 15 | 0) * 72; if (v == 1) rect(x + 2, y + 2, 68, 68, '#5c677d'); else if (v == 2) { rect(x + 5, y + 5, 62, 62, '#a47148'); rect(x + 5, y + 32, 62, 6, '#7f5539'); } }
    for (const b of g.bm) { const x = g.ox + b.x * 72 + 36, y = g.oy + b.y * 72 + 36; circ(x, y, 20 + Math.sin(g.t * 14) * 3, '#111'); circ(x + 8, y - 16, 5, b.t < .6 ? '#ff6b6b' : '#ffa94d'); }
    for (const f of g.fl) { const x = g.ox + f.x * 72, y = g.oy + f.y * 72; rect(x + 4, y + 4, 64, 64, '#ff922b'); rect(x + 16, y + 16, 40, 40, '#ffe066'); }
    g.p.forEach(drawP);
  }
});

game({
  name: 'Stack Attack', genre: 'Timing', desc: 'Drop each sliding block onto your tower. Any overhang gets sliced off. A total miss stuns you. Tallest tower wins.', ctrl: 'ACTION = drop', T: 30,
  init(g) { g.p.forEach(p => { p.w = 130; p.cc = 0; p.h = 0; p.ph = rnd(0, 6); p.st = 0; p.bl = [{ c: 0, w: 130 }]; p.off = 0; }); },
  update(g, dt) {
    for (const p of g.p) {
      p.st -= dt; if (p.st > 0) continue; p.ph += dt * (2 + p.h * .12); p.off = Math.sin(p.ph) * 110;
      if (IN[p.i].ap) {
        const l = Math.max(p.off - p.w / 2, p.cc - p.w / 2), r = Math.min(p.off + p.w / 2, p.cc + p.w / 2);
        if (r - l > 5) { p.w = r - l; p.cc = (l + r) / 2; p.h++; g.pts[p.i] = p.h; p.bl.push({ c: p.cc, w: p.w }); sfx(400 + p.h * 20, .05, 'sine'); }
        else { p.st = 1; p.w = Math.min(130, p.w + 40); sfx(150, .2, 'sawtooth'); }
      }
    }
  },
  draw(g) {
    g.p.forEach((p, i) => {
      const X = W * (i + .5) / g.n, base = 620, top = p.bl.slice(-12); rect(X - 150, base, 300, 6, '#2a3350');
      top.forEach((b, k) => rect(X + b.c - b.w / 2, base - (k + 1) * 36, b.w, 34, k == top.length - 1 ? p.col : p.col + 'aa'));
      if (p.st > 0) txt('MISS!', X, 120, 30, '#ff6b6b'); else rect(X + p.off - p.w / 2, base - (top.length + 1) * 36 - 12, p.w, 34, '#fff');
      txt('height ' + p.h, X, 660, 18, p.col);
    });
  }
});

game({
  name: 'Jump Rope', genre: 'Timing', desc: 'Jump as the rope sweeps under your feet. It keeps speeding up.', ctrl: 'ACTION = jump', elim: 1, T: 90,
  init(g) { g.a = -2.5; g.p.forEach((p, i) => { p.x = W / 2 + (i - (g.n - 1) / 2) * 120; p.h = 0; p.vy = 0; p.r = 22; p.y = 560 - p.r; }); },
  update(g, dt) {
    const pa = g.a; g.a += (2.6 + g.t * .09) * dt;
    for (const p of g.p) { if (!p.alive) continue; if (p.h <= 0 && IN[p.i].ap) { p.vy = 430; sfx(500, .04); } p.vy -= 1500 * dt; p.h = Math.max(0, p.h + p.vy * dt); if (p.h == 0) p.vy = 0; p.y = 560 - p.r - p.h; }
    if (Math.floor((g.a - Math.PI / 2) / TAU) != Math.floor((pa - Math.PI / 2) / TAU)) { sfx(200, .03); for (const p of g.p) if (p.alive && p.h < 14) out(g, p); }
  },
  draw(g) {
    rect(0, 560, W, 6, '#2a3350'); rect(236, 380, 8, 180, '#868e96'); rect(1036, 380, 8, 180, '#868e96'); const back = Math.cos(g.a) < 0;
    const rope = () => { c.strokeStyle = back ? '#6b5a2e' : '#ffd43b'; c.lineWidth = back ? 4 : 7; c.beginPath(); c.moveTo(240, 400); c.quadraticCurveTo(W / 2, 400 + 320 * Math.sin(g.a), 1040, 400); c.stroke(); };
    if (back) rope(); g.p.forEach(drawP); if (!back) rope();
  }
});
