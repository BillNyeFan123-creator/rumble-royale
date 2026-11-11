'use strict';
// ================= CPU BOTS =================
// Each game gets a small "brain": AI[name](g, p, B) -> {x, y, a}.  B is that bot's scratch memory for the current game.
let botLv = 1; const SKN = ['EASY', 'NORMAL', 'HARD'], SK = () => [.5, .75, 1][botLv];
const AI = {}, Z = () => ({ x: 0, y: 0, a: 0 }), DV = [[0, -1], [1, 0], [0, 1], [-1, 0]], vec = d => ({ x: DV[d][0], y: DV[d][1], a: 0 });
const to = (p, x, y, dz = 6) => { const dx = x - p.x, dy = y - p.y, d = Math.hypot(dx, dy); return d < dz ? Z() : { x: dx / d, y: dy / d, a: 0 }; };
const fleeC = (p, o) => { let x = p.x - o.x, y = p.y - o.y; const d = Math.hypot(x, y) || 1; x = x / d + (W / 2 - p.x) / W * 1.7; y = y / d + (H / 2 - p.y) / H * 1.7; const m = Math.hypot(x, y) || 1; return { x: x / m, y: y / m, a: 0 }; };
const foes = (g, p) => g.p.filter(o => o != p && o.alive);
const near = (p, arr) => { let b = null, bd = 1e9; for (const o of arr) { const d = Math.hypot(o.x - p.x, o.y - p.y); if (d < bd) { bd = d; b = o; } } return b ? { o: b, d: bd } : null; };
const tap = (B, n) => B.n % Math.max(2, Math.round(n)) == 0;
const cyc = (B, n, fn) => { n = Math.max(8, Math.round(n)); if (B.n % n == 0) B.pd = fn(); const d = B.pd; return B.n % n < 4 && d != null && d >= 0 ? vec(d) : Z(); };
const adiff = (a, b) => { const d = a - b; return Math.atan2(Math.sin(d), Math.cos(d)); };
function wander(p, B) { if (B.wx === undefined || B.n % 120 == 0 || Math.hypot(B.wx - p.x, B.wy - p.y) < 30) { B.wx = rnd(150, W - 150); B.wy = rnd(120, H - 120); } return to(p, B.wx, B.wy); }
// pick the least dangerous of 8 directions / staying put / heading straight for the goal
function dodge(p, danger, gx, gy, look = 75) {
  let best = Z(), bs = 1e9; const gd = Math.hypot(gx - p.x, gy - p.y) || 1;
  for (let k = 0; k < 10; k++) {
    let x = 0, y = 0, st = look; if (k < 8) { x = Math.cos(k / 8 * TAU); y = Math.sin(k / 8 * TAU); } else if (k == 9) { x = (gx - p.x) / gd; y = (gy - p.y) / gd; st = Math.min(look, gd); }
    const nx = clamp(p.x + x * st, p.r, W - p.r), ny = clamp(p.y + y * st, p.r, H - p.r), s = Math.max(danger(nx, ny), danger((p.x + nx) / 2, (p.y + ny) / 2)) + Math.hypot(nx - gx, ny - gy) * .002 + R() * .04;
    if (s < bs) { bs = s; best = { x, y, a: 0 }; }
  }
  return best;
}
function botInput(i) {
  if (!G || !G.live) return Z(); const g = G, p = g.p[i]; if (!p || (!p.alive && g.def.elim)) return Z();
  g.bot = g.bot || []; const B = g.bot[i] || (g.bot[i] = { n: 0, fz: 0, last: Z() });
  if (B.fz > 0) { B.fz -= 1 / 60; return B.last; }                                   // "brain freeze": bots hesitate now and then so they are beatable
  if (R() < (1.1 - SK()) * .25 / 60) { B.fz = rnd(.15, .35); return B.last; }
  B.n++; let o; try { const f = AI[g.def.name]; o = f ? f(g, p, B) : wander(p, B); } catch (e) { o = Z(); }
  o = o || Z(); o.a = o.a ? 1 : 0; return B.last = o;
}

// ---------- arena / action ----------
AI['Sumo Smash'] = (g, p) => { if (Math.hypot(p.x - W / 2, p.y - H / 2) > g.R * .62) return to(p, W / 2, H / 2); const f = near(p, foes(g, p)); if (!f) return Z(); const o = to(p, f.o.x, f.o.y, 0); o.a = f.d < 140 && R() < .08 * SK(); return o; };
AI['Blaster Duel'] = (g, p, B) => {
  const f = near(p, foes(g, p)); if (!f) return Z(); const dy = f.o.y - p.y, dx = f.o.x - p.x, al = Math.abs(dy) < 44;
  const inc = g.b.some(b => b.own != p.i && Math.abs(b.y - p.y) < 30 && Math.abs(b.x - p.x) < 200 && Math.sign(b.vx) == Math.sign(p.x - b.x));   // bullet heading my way
  if (!al && dy > 40 && B.n % 240 == 0) B.dir = pick([-1, 1]);                                                                                  // rival is below: walk off an edge
  return { x: al ? (Math.abs(dx) < 380 ? Math.sign(dx) * .6 : Math.sign(dx)) : dy > 40 ? (B.dir || 1) : Math.sign(dx || 1), y: inc || (dy < -40 && R() < .15) ? -1 : 0, a: al && Math.sign(dx) == p.fx && tap(B, 22 / SK()) };
};
AI['Ricochet Tanks'] = (g, p, B) => { const f = near(p, foes(g, p)); if (!f) return Z(); const o = to(p, f.o.x, f.o.y, 0), ph = B.n % 100; if (ph > 32) { const s = B.n % 200 < 100 ? 1 : -1; return { x: -o.y * s, y: o.x * s, a: 0 }; } o.a = ph == 26; return o; };
AI['Hot Potato'] = (g, p) => { if (g.h == p) { const f = near(p, foes(g, p)); return f ? to(p, f.o.x, f.o.y, 0) : Z(); } return g.h && g.h.alive ? fleeC(p, g.h) : Z(); };
AI['Crown Keeper'] = (g, p, B) => { if (!g.h) return to(p, W / 2, H / 2, 0); if (g.h == p) { const f = near(p, foes(g, p)); return f ? fleeC(p, f.o) : Z(); } const o = to(p, g.h.x, g.h.y, 0); o.a = dist(p, g.h) < 160 && tap(B, 30); return o; };
AI['Laser Grid'] = (g, p) => dodge(p, (x, y) => { let s = 0; for (const l of g.L) { const hw = l.w / 2 + p.r + 8, dd = Math.abs((l.hz ? y : x) - l.pos); if (dd < hw) s += (l.t > .4 ? 10 : 2) * (1.3 - dd / hw * .3); } return s; }, W / 2, H / 2);
AI['Crumble Floor'] = (g, p, B) => {      // hop from tile centre to tile centre, preferring tiles with the most solid neighbours
  const cx = Math.min(15, p.x / 80 | 0), cy = Math.min(8, p.y / 80 | 0), me = cy * 16 + cx, ok = (x, y) => x >= 0 && y >= 0 && x < 16 && y < 9 && g.tl[y * 16 + x] == -1;
  if (B.tk === undefined || B.tk == me || g.tl[B.tk] != -1) {
    let best = null, bs = -1; for (const [dx, dy] of DV) { const x = cx + dx, y = cy + dy; if (!ok(x, y)) continue; let s = R(); for (const [ex, ey] of DV) if (ok(x + ex, y + ey)) s += 1; if (dx == B.dx && dy == B.dy) s += .5; if (s > bs) { bs = s; best = [x, y, dx, dy]; } }
    if (best) { B.tk = best[1] * 16 + best[0]; B.tx = best[0] * 80 + 40; B.ty = best[1] * 80 + 40; B.dx = best[2]; B.dy = best[3]; }
  }
  return B.tx === undefined ? Z() : to(p, B.tx, B.ty, 3);
};
AI['Meteor Shower'] = (g, p) => dodge(p, (x, y) => { let s = 0; for (const m of g.m) { const d = Math.hypot(m.x + m.vx * .3 - x, m.y + m.vy * .3 - y) - m.r - p.r; if (d < 60) s += d < 10 ? 10 : (60 - d) / 20; } return s; }, W / 2, H / 2);
AI['Light Trails'] = (g, p) => {
  const run = (dx, dy) => { let n = 0, x = p.gx, y = p.gy; while (n < 14) { x += dx; y += dy; if (x < 0 || y < 0 || x >= 128 || y >= 72 || g.grid[y * 128 + x] != -1) break; n++; } return n; };
  let b = null, bs = -1; for (const o of [[p.ddx, p.ddy, .6], [p.ddy, p.ddx, 0], [-p.ddy, -p.ddx, 0]]) { const s = run(o[0], o[1]) + o[2] + R() * .4; if (s > bs) { bs = s; b = o; } } return { x: b[0], y: b[1], a: 0 };
};
AI['Paint War'] = (g, p, B) => { if (B.tx === undefined || B.n % 40 == 0 || g.grid[B.tk] == p.i) { let bd = 1e9; for (let k = 0; k < 25; k++) { const q = ri(0, 575); if (g.grid[q] == p.i) continue; const x = q % 32 * 40 + 20, y = (q >> 5) * 40 + 20, d = Math.hypot(x - p.x, y - p.y); if (d < bd) { bd = d; B.tx = x; B.ty = y; B.tk = q; } } } return B.tx === undefined ? Z() : to(p, B.tx, B.ty); };
AI['Coin Rush'] = (g, p) => { const cn = near(p, g.cn); return dodge(p, (x, y) => { let s = 0; for (const q of g.s) if (Math.hypot(q.x + q.vx * .25 - x, q.y + q.vy * .25 - y) < p.r + q.r + 25) s += 10; return s; }, cn ? cn.o.x : W / 2, cn ? cn.o.y : H / 2); };
AI['Hill King'] = (g, p, B) => { const f = near(p, foes(g, p).filter(o => dist(o, g.z) < g.z.r)); if (f && dist(p, g.z) < g.z.r) { const o = to(p, f.o.x, f.o.y, 0); o.a = f.d < 120 && tap(B, 20); return o; } return to(p, g.z.x, g.z.y, 20); };
AI['Scramble Ball'] = (g, p, B) => { const b = g.ball, gx = g.n == 2 ? (p.i == 0 ? W : 0) : (b.x > W / 2 ? W : 0), gy = H / 2, dx = b.x - gx, dy = b.y - gy, d = Math.hypot(dx, dy) || 1, tx = b.x + dx / d * 48, ty = b.y + dy / d * 48; if (Math.hypot(tx - p.x, ty - p.y) > 36) return to(p, tx, ty, 0); const o = to(p, gx, gy, 0); o.a = tap(B, 40); return o; };
AI['Horde Night'] = (g, p) => { const gm = near(p, g.gm); return dodge(p, (x, y) => { let s = 0; for (const e of g.e) { const d = Math.hypot(e.x - x, e.y - y); if (d < 110) s += (110 - d) / 15; } return s; }, gm ? gm.o.x : W / 2, gm ? gm.o.y : H / 2); };
AI['Space Brawl'] = (g, p, B) => { const f = near(p, foes(g, p)); if (!f) return Z(); const d = adiff(Math.atan2(f.o.y - p.y, f.o.x - p.x), p.a); return { x: Math.abs(d) < .08 ? 0 : Math.sign(d), y: f.d > 260 && Math.abs(d) < .6 ? -1 : 0, a: Math.abs(d) < .25 && tap(B, 20 / SK()) }; };
AI['Gem Heist'] = (g, p) => { if (p.car) return to(p, g.base[p.i].x, g.base[p.i].y, 0); const gm = near(p, g.gm); if (gm) return to(p, gm.o.x, gm.o.y, 0); let b = -1; g.pts.forEach((v, j) => { if (j != p.i && v > 0 && (b < 0 || v > g.pts[b])) b = j; }); return b >= 0 ? to(p, g.base[b].x, g.base[b].y, 0) : to(p, W / 2, H / 2, 40); };
AI['Summit Sprint'] = (g, p) => {
  const feet = p.y + p.r; let t = null; for (const b of g.plats) if (b.y < feet - 20 && b.y > feet - 130) { const cx = clamp(p.x, b.x + 20, b.x + b.w - 20); if (t === null || Math.abs(cx - p.x) < Math.abs(t - p.x)) t = cx; }
  if (t === null) return { x: Math.sign(g.flag.x - p.x), y: -1, a: 0 }; const dx = t - p.x; return { x: Math.abs(dx) < 8 ? 0 : Math.sign(dx), y: Math.abs(dx) < 90 ? -1 : 0, a: 0 };
};
AI['Target Range'] = (g, p, B) => { const t = near(p, g.tg.filter(t => t.k != 2 && t.t > .3)); if (!t) return to(p, W / 2, H / 2, 60); const o = to(p, t.o.x, t.o.y, 4); o.x *= SK(); o.y *= SK(); o.a = t.d < t.o.r && tap(B, 6); return o; };
AI['Dodgeball'] = (g, p, B) => {
  const inc = g.b.find(b => b.o != p.i && dist(b, p) < 260 && ((p.x - b.x) * b.vx + (p.y - b.y) * b.vy) / (dist(b, p) * 640 || 1) > .8); if (inc && SK() > R() * .9) { const s = B.n % 120 < 60 ? 1 : -1; return { x: -inc.vy / 640 * s, y: inc.vx / 640 * s, a: 0 }; }   // sidestep a throw
  const f = near(p, foes(g, p)); if (!p.has) { if (f && f.o.has && f.d < 330) return fleeC(p, f.o); const b = near(p, g.balls); if (b) return to(p, b.o.x, b.o.y, 0); const th = near(p, foes(g, p).filter(o => o.has)); return th ? fleeC(p, th.o) : wander(p, B); }
  if (!f) return Z(); const o = to(p, f.o.x, f.o.y, 0); o.a = f.d < 300 && tap(B, 20 / SK()); return o;
};
AI['Cooties'] = (g, p) => { if (g.it == p) { const f = near(p, foes(g, p)); return f ? to(p, f.o.x, f.o.y, 0) : Z(); } return fleeC(p, g.it); };
AI['Musical Spots'] = (g, p, B) => { if (p.sp) return Z(); if (g.ph == 1) { const s = near(p, g.sp.filter(s => !s.o)); if (s) return to(p, s.o.x, s.o.y, 0); } return wander(p, B); };
AI['Colour Panic'] = (g, p) => { let bx = p.x, by = p.y, bd = 1e9; g.tiles.forEach((t, k) => { if (t != g.tc) return; const x = k % 8 * 160 + 80, y = (k >> 3) * 144 + 72, d = Math.hypot(x - p.x, y - p.y); if (d < bd) { bd = d; bx = x; by = y; } }); return to(p, bx, by, 25); };
AI['Sheep Rustlers'] = (g, p) => { const b = g.base[p.i]; let s = null, bd = 1e9; for (const q of g.sh) { const d = dist(p, q) + dist(q, b) * .6; if (d < bd) { bd = d; s = q; } } if (!s) return Z(); const dx = s.x - b.x, dy = s.y - b.y, d = Math.hypot(dx, dy) || 1; return to(p, s.x + dx / d * 55, s.y + dy / d * 55, 8); };
AI['Sky Joust'] = (g, p, B) => { const f = near(p, foes(g, p).filter(o => o.inv <= 0)); if (!f) return { x: 0, y: 0, a: p.y > 300 && tap(B, 8) }; let dx = f.o.x - p.x; if (dx > W / 2) dx -= W; if (dx < -W / 2) dx += W; const above = p.y < f.o.y - 25; return { x: above || Math.abs(dx) > 150 ? Math.sign(dx) : -Math.sign(dx) * .6, y: 0, a: (p.y > f.o.y - 45 || p.y > H - 140) && p.vy > -150 && tap(B, 3) }; };

// ---------- stealth ----------
function crowdAI(g, p, B) {
  if (B.tx === undefined || (Math.hypot(B.tx - p.x, B.ty - p.y) < 6 && (B.w -= 1 / 60) <= 0)) {
    const un = g.pads.map((d, i) => i).filter(i => !p.pads.includes(i));
    if (un.length && R() < .7) { const d = g.pads[pick(un)]; B.tx = d.x + rnd(-10, 10); B.ty = d.y + rnd(-10, 10); B.w = rnd(1.6, 2.4); } else { B.tx = rnd(60, W - 60); B.ty = rnd(90, H - 90); B.w = rnd(.3, 2); }
  }
  const ex = near(p, foes(g, p).filter(o => o.rev > 0)); if (ex && ex.d < 260 && p.cd <= 0) { const o = to(p, ex.o.x, ex.o.y, 0); o.a = ex.d < 50 && tap(B, 4); return o; }   // someone just exposed themselves: pounce
  const o = to(p, B.tx, B.ty, 5), f = near(p, foes(g, p)); o.a = !!f && f.d < 52 && R() < .01 * SK(); return o;
}
AI['Blend In'] = AI['Heist Party'] = crowdAI;

// ---------- reaction / timing / brain ----------
AI['Red Light, Green Light'] = (g, p, B) => { if (g.st == 0) { if (!B.set) { B.set = 1; B.d = R() < (1 - SK()) * .35 ? 9 : rnd(0, .2); } return { x: g.el > .2 ? 1 : 0, y: 0, a: 0 }; } if (g.st == 1) return { x: g.el < B.d ? 1 : 0, y: 0, a: 0 }; B.set = 0; return { x: B.d > 1 && g.el < .25 ? 1 : 0, y: 0, a: 0 }; };
AI['Quick Draw'] = (g, p, B) => { if (g.rest > 0 || p.foul) { B.e = 0; B.rt = 0; return Z(); } if (!g.go) { B.e = 0; B.rt = 0; const nw = B.w !== g.word; B.w = g.word; return { x: 0, y: 0, a: nw && g.word != '. . .' && R() < (1 - SK()) * .12 }; } B.rt = B.rt || rnd(.22, .42) / SK(); B.e += 1 / 60; return { x: 0, y: 0, a: B.e >= B.rt }; };
AI['Mash Dash'] = (g, p, B) => ({ x: 0, y: 0, a: tap(B, 6 / SK() + (B.j || (B.j = rnd(0, 2)))) });
AI['Bullseye Stop'] = (g, p) => ({ x: 0, y: 0, a: p.lock < 0 && g.rest <= 0 && Math.abs((g.v || 0) - g.tg) < (.02 + g.sp * .012) / SK() && R() < .6 });
AI['Echo Arrows'] = (g, p, B) => { if (g.ph != 1 || p.k >= g.seq.length) { B.pd = null; return Z(); } return cyc(B, 22 / SK(), () => R() < (1 - SK()) * .1 + .015 ? ri(0, 3) : g.seq[p.k]); };
const quizAI = (g, p, B) => { if (B.q !== g.Q) { B.q = g.Q; B.at = rnd(.9, 2) / SK(); B.ans = R() < .55 + .4 * SK() ? g.Q.a : ri(0, 3); } if (g.rest > 0 || p.lock || g.qt < B.at || g.qt > B.at + .07) return Z(); return vec(B.ans); };
AI['Colour Clash'] = AI['Count Clash'] = AI['Math Flash'] = quizAI;
AI['Beat Lanes'] = (g, p, B) => { const n = g.notes.find(n => !n.h[p.i] && n.t - g.t < .05 && n.t - g.t > -.03); if (!n) return Z(); if (B.cur !== n) { B.cur = n; B.hit = R() < .5 + .45 * SK(); } return B.hit ? vec(n.d) : Z(); };
AI['Flap Pack'] = (g, p, B) => { const q = g.pipes.find(q => q.x > p.x - 50), ty = q ? q.gy + q.gap * .68 : 340; return { x: 0, y: 0, a: p.y > ty && p.vy > -80 && tap(B, 2) }; };
AI['Ring Racers'] = (g, p, B) => { const th = Math.atan2(p.y - g.cy, p.x - g.cx), rr = Math.hypot(p.x - g.cx, p.y - g.cy), d = adiff(th + Math.PI / 2 + clamp((rr - (232 + p.i * 14)) / 110, -.8, .8), p.a); return { x: clamp(d * 3, -1, 1), y: 0, a: p.cd <= 0 && tap(B, 30) }; };
AI['Hurdle Hustle'] = (g, p) => { const sp = 380 + g.t * 9, o = g.ob.find(o => o.x > p.x - 20), cn = !!o && o.x - p.x < 50 + sp * .13; return { x: 0, y: 0, a: cn && !(p.h <= 0 && p.jl) }; };
AI['Maze Race'] = (g, p, B) => {
  if (!g.bfs) { const d = g.bfs = new Int16Array(231).fill(-1), q = [115]; d[115] = 0; while (q.length) { const k = q.shift(), m = g.m[k]; for (const [b, o] of [[1, -21], [2, 1], [4, 21], [8, -1]]) if (m & b && d[k + o] < 0) { d[k + o] = d[k] + 1; q.push(k + o); } } }
  if (B.n % Math.round(16 / SK()) > 2) return Z(); const k = p.gy * 21 + p.gx, m = g.m[k], d = g.bfs;
  if (m & 1 && d[k - 21] < d[k]) return vec(0); if (m & 4 && d[k + 21] < d[k]) return vec(2); if (m & 2 && d[k + 1] < d[k]) return vec(1); if (m & 8 && d[k - 1] < d[k]) return vec(3); return Z();
};
function lightsSolve(b) {
  const M = [], want = b.reduce((a, v, k) => a | (v << k), 0); for (let k = 0; k < 16; k++) { const t = new Array(16).fill(0), x = k % 4, y = k >> 2; for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < 4 && ny < 4) t[ny * 4 + nx] = 1; } M.push(t.reduce((a, v, q) => a | (v << q), 0)); }
  let best = null, bc = 99; for (let s = 0; s < 65536; s++) { let x = 0, cnt = 0; for (let k = 0; k < 16; k++) if (s >> k & 1) { x ^= M[k]; cnt++; } if (x == want && cnt < bc) { bc = cnt; best = s; } }
  const out = []; if (best !== null) for (let k = 0; k < 16; k++) if (best >> k & 1) out.push(k); return out;
}
AI['Lights Out'] = (g, p, B) => {
  const n = Math.round(70 / SK()), ph = B.n % n;
  if (ph == 0) { const sig = p.b.join(''); if (B.sig != sig) { B.sig = sig; B.todo = lightsSolve(p.b); } const t = B.todo[0]; B.act = t === undefined ? null : p.cu == t ? 'a' : (t >> 2) < (p.cu >> 2) ? 0 : (t >> 2) > (p.cu >> 2) ? 2 : (t % 4) > (p.cu % 4) ? 1 : 3; }
  if (ph < 3 && B.act != null) return B.act == 'a' ? { x: 0, y: 0, a: 1 } : vec(B.act); return Z();
};
AI['Bomb Grid'] = (g, p, B) => {
  const cw = 15, ch = 9, K = (x, y) => y * cw + x, me = K(p.gx, p.gy), inb = (x, y) => x >= 0 && y >= 0 && x < cw && y < ch;
  const blast = (bx, by, arr) => { arr[K(bx, by)] = 1; for (const [dx, dy] of DV) for (let k = 1; k <= 2; k++) { const x = bx + dx * k, y = by + dy * k; if (!inb(x, y) || g.m[K(x, y)] == 1) break; arr[K(x, y)] = 1; if (g.m[K(x, y)] == 2) break; } };
  const dang = new Uint8Array(135), fire = new Uint8Array(135); for (const f of g.fl) dang[K(f.x, f.y)] = fire[K(f.x, f.y)] = 1; for (const b of g.bm) blast(b.x, b.y, dang);
  const free = (x, y) => inb(x, y) && !g.m[K(x, y)] && !fire[K(x, y)] && !g.bm.some(b => b.x == x && b.y == y);
  const bfs = ok => {      // first step (0-3) toward the nearest cell passing ok(); 4 = already there; -1 = none
    const prev = new Int16Array(135).fill(-2), q = [me]; prev[me] = -1;
    while (q.length) { const k = q.shift(), x = k % cw, y = k / cw | 0; if (ok(x, y, k)) { if (k == me) return 4; let s = k; while (prev[s] != me) s = prev[s]; return DV.findIndex(([dx, dy]) => p.gx + dx == s % cw && p.gy + dy == (s / cw | 0)); } for (const [dx, dy] of DV) { const nx = x + dx, ny = y + dy; if (free(nx, ny) && prev[K(nx, ny)] == -2) { prev[K(nx, ny)] = k; q.push(K(nx, ny)); } } }
    return -1;
  };
  if (dang[me]) { const d = bfs((x, y, k) => !dang[k]); return d >= 0 && d < 4 ? vec(d) : Z(); }
  const fs = foes(g, p), crateBy = (x, y) => DV.some(([dx, dy]) => inb(x + dx, y + dy) && g.m[K(x + dx, y + dy)] == 2);
  if (!g.bm.some(b => b.o == p.i)) { const t = new Uint8Array(135); blast(p.gx, p.gy, t); if ((crateBy(p.gx, p.gy) || fs.some(o => t[K(o.gx, o.gy)])) && tap(B, 6)) { const e = bfs((x, y, k) => !t[k] && !dang[k]); if (e >= 0 && e < 4) return { x: 0, y: 0, a: 1 }; } }
  if (B.n % Math.round(8 / SK()) > 3) return Z();
  const d = bfs((x, y, k) => k != me && !dang[k] && (crateBy(x, y) || fs.some(o => Math.abs(o.gx - x) + Math.abs(o.gy - y) <= 1)));
  if (d >= 0 && d < 4 && !dang[K(p.gx + DV[d][0], p.gy + DV[d][1])]) return vec(d); return Z();
};
AI['Stack Attack'] = (g, p, B) => { const a = p.st <= 0 && B.n - (B.ld || 0) > (1.25 - SK()) * 50 && Math.abs(p.off - p.cc) < 9 + p.h * .4 && tap(B, 2); if (a) B.ld = B.n; return { x: 0, y: 0, a }; };
AI['Jump Rope'] = (g, p, B) => { const tt = (((Math.PI / 2 - g.a) % TAU) + TAU) % TAU / (2.6 + g.t * .09); return { x: 0, y: 0, a: p.h <= 0 && tt < .3 && tt > .05 && tap(B, 2) }; };
AI['Paddle Panic'] = (g, p, B) => {
  const b = g.ball, com = p.i == 0 ? b.vx < 0 : p.i == 1 ? b.vx > 0 : p.i == 2 ? b.vy < 0 : b.vy > 0; if (!com) { B.er = null; return Z(); }
  if (B.er == null) B.er = rnd(-1, 1) * (1.25 - SK()) * .3;                                       // each approach the bot misjudges the ball a little
  const al = (p.i < 2 ? b.y - g.A.y : b.x - g.A.x) / g.A.s + B.er, v = clamp((al - p.pos) * 14, -1, 1) * (.45 + .5 * SK()); return p.i < 2 ? { x: 0, y: v, a: 0 } : { x: v, y: 0, a: 0 };
};
AI['Pump It'] = (g, p, B) => { if (B.rd !== g.rd) { B.rd = g.rd; B.goal = ri(5, 11); } if (p.st || g.rest > 0) return Z(); if (p.pot >= B.goal) return { x: 0, y: 1, a: 0 }; return { x: 0, y: 0, a: tap(B, 12) }; };
AI['Putt Party'] = (g, p, B) => {
  if (Math.hypot(p.vx, p.vy) > 12) { B.need = 0; B.wt = 0; return Z(); } const d = adiff(Math.atan2(g.h.y - p.y, g.h.x - p.x), p.a);
  if (Math.abs(d) > .02 && !p.ch) return { x: clamp(d * 10, -1, 1), y: 0, a: 0 };
  if ((B.wt = (B.wt || 0) + 1) < 40 / SK()) return Z(); if (!B.need) { const e = (1 - SK()) * .25 + .04; B.need = clamp((dist(p, g.h) * 1.4 * rnd(1 - e, 1 + e) - 190) / 900, .03, 1); } return { x: 0, y: 0, a: p.ch < B.need };
};
AI['RPS Showdown'] = (g, p, B) => { if (g.ph != 0 || p.ch >= 0) return Z(); if (B.rd !== g.rd) { B.rd = g.rd; B.at = rnd(.4, 2); B.c = pick([3, 0, 1]); } return 3 - g.pt > B.at ? vec(B.c) : Z(); };
AI['Snake Feast'] = (g, p) => {
  const h = p.body[0]; if (!h) return Z(); let ap = null, ad = 1e9; for (const a of g.ap) { const d = Math.abs(a[0] - h[0]) + Math.abs(a[1] - h[1]); if (d < ad) { ad = d; ap = a; } }
  const run = (dx, dy) => { let n = 0, x = h[0], y = h[1]; while (n < 8) { x += dx; y += dy; if (snakeHit(g, x, y)) break; n++; } return n; };
  let b = null, bs = -1e9; for (const o of [[p.ddx, p.ddy], [p.ddy, p.ddx], [-p.ddy, -p.ddx]]) { const s = Math.min(run(o[0], o[1]), 4) * 20 - (ap ? Math.abs(ap[0] - h[0] - o[0]) + Math.abs(ap[1] - h[1] - o[1]) : 0) + R(); if (s > bs) { bs = s; b = o; } } return { x: b[0], y: b[1], a: 0 };
};
AI['Cannon Lob'] = (g, p, B) => {
  if (p.shell) { B.need = 0; return Z(); } const f = near(p, foes(g, p)); if (!f) return Z(); const dx = f.o.x - p.x, want = dx > 0 ? Math.PI / 3 : Math.PI * 2 / 3, d = want - p.a;
  if (Math.abs(d) > .03 && !p.ch) return { x: -Math.sign(d), y: 0, a: 0 };
  if (!B.need) { const e = (1 - SK()) * .12 + .02; B.need = clamp((Math.sqrt(Math.abs(dx) * 600 / .866) * rnd(1 - e, 1 + e) - 300) / 700, .03, 1); } return { x: 0, y: 0, a: p.ch < B.need };
};
AI['Timber Rush'] = (g, p, B) => { if (p.stun > 0) { B.pd = null; return Z(); } return cyc(B, 9 / SK() + 2, () => { const br = g.seq[p.k + 1]; let s = br ? -br : (p.side || 1); if (R() < (1 - SK()) * .08) s = -s; return s > 0 ? 1 : 3; }); };
