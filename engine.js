'use strict';
// ---------- canvas ----------
const W = 1280, H = 720;
const cv = document.getElementById('c'), c = cv.getContext('2d');
function fit() { const s = Math.min(innerWidth / W, innerHeight / H); cv.style.width = W * s + 'px'; cv.style.height = H * s + 'px'; }
addEventListener('resize', fit); fit();

// ---------- util ----------
const COLS = ['#ff4d6d', '#4dabf7', '#ffd43b', '#69db7c'], NAMES = ['RED', 'BLUE', 'GOLD', 'MINT'];
const ACOL = ['#ff6b6b', '#4dabf7', '#69db7c', '#ffd43b']; // up, right, down, left
const TAU = Math.PI * 2, R = Math.random;
const rnd = (a, b) => a + R() * (b - a), ri = (a, b) => Math.floor(rnd(a, b + 1)), pick = a => a[Math.floor(R() * a.length)];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v, dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ---------- audio ----------
let AC = null, AOUT = null, ADEST = null;
function audioOut() {   // everything plays through one node so online play can stream the sound too
  if (!AOUT) { AOUT = AC.createGain(); AOUT.connect(AC.destination); try { ADEST = AC.createMediaStreamDestination(); AOUT.connect(ADEST); } catch (e) { } }
  return AOUT;
}
function sfx(f = 440, d = .08, type = 'square', v = .05) {
  if (!AC) return;
  try {
    const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.value = f; g.gain.value = v;
    g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime + d); o.connect(g).connect(audioOut()); o.start(); o.stop(AC.currentTime + d);
  } catch (e) { }
}

// ---------- input ----------
const keys = {}, pressed = {}, typed = [];
addEventListener('keydown', e => {
  if (e.key && e.key.length == 1) typed.push(e.key);
  if (!AC) try { AC = new AudioContext(); } catch (er) { }
  if (!keys[e.code]) pressed[e.code] = 1; keys[e.code] = 1;
  if (/Arrow|Slash|Space|Numpad|Semicolon|Quote|Backspace|Tab/.test(e.code)) e.preventDefault();
});
addEventListener('keyup', e => { keys[e.code] = 0; });
const KB = [
  { n: 'W A S D  +  F', u: 'KeyW', d: 'KeyS', l: 'KeyA', r: 'KeyD', a: ['KeyF', 'Space'] },
  { n: 'ARROWS  +  /', u: 'ArrowUp', d: 'ArrowDown', l: 'ArrowLeft', r: 'ArrowRight', a: ['Slash', 'ShiftRight'] },
  { n: 'I J K L  +  ;', u: 'KeyI', d: 'KeyK', l: 'KeyJ', r: 'KeyL', a: ['Semicolon', 'KeyH'] },
  { n: 'NUMPAD 8456  +  0', u: 'Numpad8', d: 'Numpad5', l: 'Numpad4', r: 'Numpad6', a: ['Numpad0', 'NumpadEnter'] }];
let players = [];           // active players this game: {dev,col,name,score,perks,hearts}
const IN = [], lagQ = [];
function pads() { try { return navigator.getGamepads ? navigator.getGamepads() : []; } catch (e) { return []; } }
function readDev(d) {
  let x = 0, y = 0, a = 0;
  if (d.t == 'n') return Object.assign({ x: 0, y: 0, a: 0 }, NET.inp[d.id]);
  if (d.t == 'k') { const k = KB[d.i]; x = (keys[k.r] ? 1 : 0) - (keys[k.l] ? 1 : 0); y = (keys[k.d] ? 1 : 0) - (keys[k.u] ? 1 : 0); a = k.a.some(q => keys[q]) ? 1 : 0; }
  else {
    const g = pads()[d.i];
    if (g) {
      x = Math.abs(g.axes[0]) > .3 ? g.axes[0] : 0; y = Math.abs(g.axes[1]) > .3 ? g.axes[1] : 0;
      const b = i => g.buttons[i] && g.buttons[i].pressed;
      if (b(14)) x = -1; if (b(15)) x = 1; if (b(12)) y = -1; if (b(13)) y = 1; a = (b(0) || b(2)) ? 1 : 0;
    }
  }
  return { x, y, a };
}
function pollInput() {
  const isBot = i => players[i].dev.t == 'b';
  let raw = players.map((p, i) => isBot(i) ? botInput(i) : readDev(p.dev));
  if (G && G.live) {
    const hs = raw.map((_, i) => i).filter(i => !isBot(i));   // control-scrambling mutators only affect humans
    if (mutOn('swap') && hs.length > 1) { const k = Math.floor(G.t / 6) % hs.length, old = raw.slice(); hs.forEach((i, j) => raw[i] = old[hs[(j + k) % hs.length]]); }
    raw.forEach((r, i) => {
      if (isBot(i)) return;
      let fl = mutOn('mirror'), j = 0;
      players.forEach((q, k) => { if (k != i) j += q.perks.jinx || 0; });
      if (G.t < 3 * Math.min(j, 3)) fl = !fl;
      if (fl) { r.x = -r.x; r.y = -r.y; }
    });
    if (mutOn('lag')) { lagQ.push(raw); raw = lagQ.length > 18 ? lagQ.shift() : raw.map(() => ({ x: 0, y: 0, a: 0 })); }
  }
  IN.length = players.length;
  raw.forEach((r, i) => {
    const o = IN[i] || { dx: 0, dy: 0, a: 0 };
    const dx = r.x > .5 ? 1 : r.x < -.5 ? -1 : 0, dy = r.y > .5 ? 1 : r.y < -.5 ? -1 : 0; let dir = -1;
    if (dy && dy != o.dy) dir = dy < 0 ? 0 : 2; else if (dx && dx != o.dx) dir = dx > 0 ? 1 : 3;
    IN[i] = { x: r.x, y: r.y, a: r.a, ap: !!(r.a && !o.a), dx, dy, dir };
  });
}
const anyA = () => IN.some(I => I.ap) || !!pressed.Enter;
const anyDir = () => { for (const I of IN) if (I.dir >= 0) return I.dir; return pressed.ArrowUp ? 0 : pressed.ArrowRight ? 1 : pressed.ArrowDown ? 2 : pressed.ArrowLeft ? 3 : -1; };

// ---------- drawing ----------
function txt(s, x, y, size = 24, col = '#fff', al = 'center') { c.font = `bold ${size}px system-ui,Segoe UI,sans-serif`; c.textAlign = al; c.textBaseline = 'middle'; c.fillStyle = col; c.fillText(s, x, y); }
function wrapTxt(s, x, y, size, col, maxW) {
  c.font = `bold ${size}px system-ui,Segoe UI,sans-serif`; let line = '', yy = y;
  for (const w of s.split(' ')) { if (c.measureText(line + w).width > maxW && line) { txt(line.trim(), x, yy, size, col); line = ''; yy += size * 1.3; } line += w + ' '; }
  txt(line.trim(), x, yy, size, col); return yy;
}
function circ(x, y, r, col) { c.fillStyle = col; c.beginPath(); c.arc(x, y, Math.max(0, r), 0, TAU); c.fill(); }
function ringS(x, y, r, col, lw = 3) { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.arc(x, y, Math.max(0, r), 0, TAU); c.stroke(); }
function rect(x, y, w, h, col) { c.fillStyle = col; c.fillRect(x, y, w, h); }
function arrow(x, y, s, d, col) {
  c.save(); c.translate(x, y); c.rotate(d * Math.PI / 2); c.fillStyle = col; c.beginPath();
  c.moveTo(0, -s); c.lineTo(s * .85, 0); c.lineTo(s * .32, 0); c.lineTo(s * .32, s); c.lineTo(-s * .32, s); c.lineTo(-s * .32, 0); c.lineTo(-s * .85, 0); c.closePath(); c.fill(); c.restore();
}
function crown(x, y, s = 16) { c.fillStyle = '#ffd43b'; c.beginPath(); c.moveTo(x - s, y + s * .6); c.lineTo(x - s, y - s * .5); c.lineTo(x - s * .45, y); c.lineTo(x, y - s * .8); c.lineTo(x + s * .45, y); c.lineTo(x + s, y - s * .5); c.lineTo(x + s, y + s * .6); c.closePath(); c.fill(); }
function drawP(p) {
  if (!p.alive) return; if (p.inv > 0 && Math.floor(p.inv * 12) % 2) return;
  circ(p.x, p.y, p.r, p.col); const ex = p.fx * p.r * .3, ey = (p.fy || 0) * p.r * .3;
  for (const s of [-1, 1]) { circ(p.x + ex + s * p.r * .33, p.y + ey - p.r * .15, p.r * .24, '#fff'); circ(p.x + ex * 1.5 + s * p.r * .33, p.y + ey * 1.5 - p.r * .15, p.r * .11, '#111'); }
  if (p.shield > 0) ringS(p.x, p.y, p.r + 5, '#fff', 3);
}
const parts = [];
function burst(x, y, col, n = 12) { for (let i = 0; i < n; i++) { const a = rnd(0, TAU), s = rnd(60, 360); parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: rnd(.3, .8), col }); } }
function updParts(dt) { for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.t -= dt; if (p.t <= 0) parts.splice(i, 1); } }
function drawParts() { for (const p of parts) { c.globalAlpha = Math.min(1, p.t * 2); rect(p.x - 3, p.y - 3, 6, 6, p.col); } c.globalAlpha = 1; }

// ---------- mutators ----------
const MUTS = [
  { id: 'turbo', n: 'TURBO', d: 'Everything runs 40% faster', g: 1 },
  { id: 'slow', n: 'SLOW-MO', d: 'Everything is in slow motion', g: 1 },
  { id: 'pulse', n: 'PULSE', d: 'Time speeds up and slows down', g: 1 },
  { id: 'mirror', n: 'MIRROR', d: 'All controls are reversed', g: 2 },
  { id: 'swap', n: 'BODY SWAP', d: 'Controls rotate between players every 6 seconds', g: 2 },
  { id: 'lag', n: 'LAG', d: 'Your inputs arrive 0.3s late', g: 2 },
  { id: 'flip', n: 'UPSIDE DOWN', d: 'The screen is flipped', g: 3 },
  { id: 'tilt', n: 'SEASICK', d: 'The screen sways back and forth', g: 3 },
  { id: 'zoom', n: 'BREATHE', d: 'The camera zooms in and out', g: 3 },
  { id: 'ice', n: 'ICE RINK', d: 'The floor is slippery', g: 4, mv: 1 },
  { id: 'wind', n: 'WINDY', d: 'A shifting wind pushes everyone', g: 5, mv: 1 },
  { id: 'quake', n: 'QUAKE', d: 'Tremors knock you around', g: 5, mv: 1 },
  { id: 'tiny', n: 'TINY', d: 'Everyone is tiny', g: 6, mv: 1 },
  { id: 'giant', n: 'GIANT', d: 'Everyone is huge', g: 6, mv: 1 },
  { id: 'dark', n: 'BLACKOUT', d: 'You can only see near players', g: 7, mv: 1 }];
const mutOn = id => !!G && G.muts.includes(id);
const mutsFor = def => MUTS.filter(m => (!m.mv || def.mv) && !(m.id == 'swap' && players.length < 2));

// ---------- game framework ----------
const GAMES = [], game = d => { GAMES.push(d); return d; };
let G = null;
function mkP(i) {
  const pl = players[i], pk = pl.perks;
  return {
    i, col: pl.col, x: W / 2, y: H / 2, vx: 0, vy: 0, kx: 0, ky: 0, fx: 1, fy: 0, alive: true, cd: 0, inv: 0, stun: 0,
    r: 22 * Math.pow(.85, pk.small || 0) * (mutOn('tiny') ? .6 : mutOn('giant') ? 1.5 : 1),
    spd: 1 + .12 * (pk.swift || 0), cdm: Math.pow(.75, pk.rapid || 0), shield: pk.guard || 0
  };
}
function startGame(def, muts, onEnd) {
  const n = players.length;
  G = { def, muts, onEnd, t: 0, T: def.T || 0, n, live: false, intro: 4, over: 0, done: false, score: new Array(n).fill(0), pts: new Array(n).fill(0), p: [], shake: 0, msg: '' };
  for (let i = 0; i < n; i++) G.p.push(mkP(i));
  lagQ.length = 0; parts.length = 0; def.init(G);
}
function closeGame(g) {
  g.live = false; g.over = 2.4;
  for (const p of g.p) g.score[p.i] = g.def.elim ? (p.alive ? 1e9 + g.pts[p.i] : g.score[p.i]) : g.pts[p.i];
  g.award = g.score.map(s => g.score.filter(o => o < s).length);
  const mx = Math.max(...g.score); g.win = g.p.filter(p => g.score[p.i] == mx);
  g.msg = g.win.length == g.n && g.n > 1 ? 'DRAW!' : g.win.map(p => players[p.i].name).join(' & ') + ' WINS!';
  sfx(660, .15, 'sine'); setTimeout(() => sfx(880, .25, 'sine'), 140);
}
const dk = document.createElement('canvas'); dk.width = W; dk.height = H; const dc = dk.getContext('2d');
function darkness(g) {
  dc.globalCompositeOperation = 'source-over'; dc.clearRect(0, 0, W, H); dc.fillStyle = 'rgba(0,0,0,.97)'; dc.fillRect(0, 0, W, H);
  dc.globalCompositeOperation = 'destination-out';
  for (const p of g.p) if (p.alive) { const gr = dc.createRadialGradient(p.x, p.y, 20, p.x, p.y, 170); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); dc.fillStyle = gr; dc.beginPath(); dc.arc(p.x, p.y, 170, 0, TAU); dc.fill(); }
  c.drawImage(dk, 0, 0);
}
const GameScene = {
  update(dt) {
    const g = G;
    if (pressed.Escape) { g.live = false; g.onEnd(null); return; }
    if (g.intro > 0) { g.intro -= dt; if (g.intro < 3.3 && anyA()) g.intro = 0; if (g.intro <= 0) { g.live = true; sfx(880, .2); } return; }
    if (g.over > 0) { g.over -= dt; updParts(dt); if (g.over <= 0 || (g.over < 1.6 && anyA())) g.onEnd(g.award); return; }
    let ts = 1; if (mutOn('turbo')) ts = 1.4; if (mutOn('slow')) ts = .62; if (mutOn('pulse')) ts = 1 + .6 * Math.sin(g.t * 1.3);
    const d = dt * ts; g.t += d; g.shake -= dt;
    for (const p of g.p) { p.cd -= d; p.inv -= d; p.stun -= d; }
    g.def.update(g, d); updParts(d);
    const al = g.p.filter(p => p.alive).length;
    if (g.done || (g.def.elim && al <= (g.n > 1 ? 1 : 0)) || (g.T && g.t >= g.T)) closeGame(g);
  },
  draw() {
    const g = G; rect(0, 0, W, H, '#07080d'); c.save();
    let sx = 0, sy = 0; if (g.shake > 0) { sx = rnd(-9, 9); sy = rnd(-9, 9); } else if (mutOn('quake') && g.live) { sx = rnd(-3, 3); sy = rnd(-3, 3); }
    c.translate(W / 2 + sx, H / 2 + sy);
    if (g.intro <= 0) {
      if (mutOn('flip')) c.rotate(Math.PI);
      if (mutOn('tilt')) { c.rotate(Math.sin(g.t * .7) * .22); c.scale(.82, .82); }
      if (mutOn('zoom')) { const z = .7 + .3 * Math.abs(Math.cos(g.t * .9)); c.scale(z, z); }
    }
    c.translate(-W / 2, -H / 2);
    rect(0, 0, W, H, g.def.bg || '#141824'); g.def.draw(g); drawParts();
    if (mutOn('dark') && g.intro <= 0) darkness(g);
    c.restore();
    // HUD
    txt(g.def.name, 16, 22, 18, '#9aa5c4', 'left');
    if (g.T) txt(Math.max(0, Math.ceil(g.T - g.t)), W / 2, 26, 30, g.T - g.t < 5 ? '#ff6b6b' : '#fff');
    g.muts.forEach((id, i) => txt(MUTS.find(m => m.id == id).n, W - 16, 22 + i * 22, 16, '#ff8787', 'right'));
    g.p.forEach((p, i) => {
      const x = W / 2 + (i - (g.n - 1) / 2) * 170; c.globalAlpha = p.alive ? .88 : .3; rect(x - 75, H - 38, 150, 30, p.col); c.globalAlpha = 1;
      txt(players[i].name + '   ' + Math.floor(g.pts[i]), x, H - 22, 18, '#111');
    });
    if (g.intro > 0) {
      rect(0, 0, W, H, 'rgba(8,10,18,.88)');
      txt(g.def.genre.toUpperCase(), W / 2, 150, 22, '#ffd43b'); txt(g.def.name, W / 2, 225, 84);
      const y = wrapTxt(g.def.desc, W / 2, 320, 26, '#cfd6ea', 900); txt(g.def.ctrl, W / 2, y + 60, 24, '#69db7c');
      g.muts.forEach((id, i) => { const m = MUTS.find(q => q.id == id); txt('MUTATOR: ' + m.n + ' — ' + m.d, W / 2, y + 115 + i * 32, 22, '#ff8787'); });
      txt(Math.ceil(g.intro), W / 2, 630, 64); txt('press ACTION to start now  ·  ESC to quit', W / 2, 690, 16, '#6b7591');
    }
    if (g.over > 0) { rect(0, H / 2 - 70, W, 140, 'rgba(8,10,18,.85)'); txt(g.msg, W / 2, H / 2, 72, g.win.length == 1 ? g.win[0].col : '#fff'); }
  }
};

// ---------- shared gameplay helpers ----------
function ring(g, rad = 200) { g.p.forEach((p, i) => { const a = i / g.n * TAU + Math.PI; p.x = W / 2 + Math.cos(a) * rad; p.y = H / 2 + Math.sin(a) * rad * .8; p.fx = -Math.cos(a); p.fy = 0; }); }
function corners(g, m = 90) { const P = [[m, m], [W - m, H - m], [W - m, m], [m, H - m]]; g.p.forEach((p, i) => { p.x = P[i][0]; p.y = P[i][1]; p.fx = p.x < W / 2 ? 1 : -1; }); }
// eliminate a player (respects shields + invulnerability). rx,ry = where to respawn if a shield saves them
function out(g, p, rx, ry) {
  if (!p.alive || p.inv > 0) return false;
  if (p.shield > 0) { p.shield--; p.inv = 1.5; sfx(700, .15, 'sine'); burst(p.x, p.y, '#fff', 10); if (rx !== undefined) { p.x = rx; p.y = ry; p.kx = p.ky = p.vx = p.vy = 0; } return false; }
  p.alive = false; g.score[p.i] = g.t; burst(p.x, p.y, p.col, 30); sfx(120, .3, 'sawtooth'); g.shake = .3; return true;
}
function env(g, p, dt) {
  if (mutOn('wind')) { p.x += Math.cos(g.t * .5) * 80 * dt; p.y += Math.sin(g.t * .8) * 80 * dt; }
  if (mutOn('quake') && R() < dt * 1.5) { p.kx += rnd(-450, 450); p.ky += rnd(-450, 450); }
  p.x += p.kx * dt; p.y += p.ky * dt; const f = Math.max(0, 1 - 5 * dt); p.kx *= f; p.ky *= f;
}
// top-down movement. acc>0 gives momentum
function mv(g, p, dt, speed = 260, acc = 0) {
  const I = IN[p.i]; let x = I.x, y = I.y; const m = Math.hypot(x, y);
  if (p.stun > 0) x = y = 0; else if (m > .1) { p.fx = I.x / m; p.fy = I.y / m; if (m > 1) { x /= m; y /= m; } }
  const s = speed * p.spd, k = mutOn('ice') ? 1.8 : acc;
  if (k) { const q = Math.min(1, k * dt); p.vx += (x * s - p.vx) * q; p.vy += (y * s - p.vy) * q; } else { p.vx = x * s; p.vy = y * s; }
  p.x += p.vx * dt; p.y += p.vy * dt; env(g, p, dt);
}
function bound(p, x0 = 0, y0 = 0, x1 = W, y1 = H) { p.x = clamp(p.x, x0 + p.r, x1 - p.r); p.y = clamp(p.y, y0 + p.r, y1 - p.r); }
function dash(p, f = 600) { if (IN[p.i].ap && p.cd <= 0 && p.stun <= 0) { p.kx += p.fx * f; p.ky += p.fy * f; p.cd = 1.2 * p.cdm; sfx(300, .06); } }
// side-view platformer movement against g.plats (one-way platforms)
function plat(g, p, dt) {
  const I = IN[p.i], s = 300 * p.spd, x = p.stun > 0 ? 0 : I.x;
  if (mutOn('ice')) p.vx += (x * s - p.vx) * Math.min(1, 2.5 * dt); else p.vx = x * s;
  if (I.dx) p.fx = I.dx; p.fy = 0;
  p.vy += 1500 * dt; if (p.ground && I.y < -.5) { p.vy = -640; sfx(500, .04); }
  if (mutOn('wind')) p.x += Math.cos(g.t * .5) * 80 * dt; if (mutOn('quake') && R() < dt * 1.5) p.kx += rnd(-450, 450);
  p.x += (p.vx + p.kx) * dt; p.kx *= Math.max(0, 1 - 5 * dt); const oy = p.y; p.y += p.vy * dt; p.ground = false;
  if (p.vy >= 0) for (const b of g.plats) if (p.x > b.x - p.r * .5 && p.x < b.x + b.w + p.r * .5 && oy + p.r <= b.y + 2 && p.y + p.r >= b.y) { p.y = b.y - p.r; p.vy = 0; p.ground = true; }
}
// player-vs-player collisions with knockback (f = knock strength, 0 = just separate)
function bump(g, f = 1) {
  for (let i = 0; i < g.n; i++) for (let j = i + 1; j < g.n; j++) {
    const a = g.p[i], b = g.p[j]; if (!a.alive || !b.alive) continue;
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, o = a.r + b.r - d; if (o <= 0) continue;
    const nx = dx / d, ny = dy / d; a.x -= nx * o / 2; a.y -= ny * o / 2; b.x += nx * o / 2; b.y += ny * o / 2;
    if (f) {
      const va = (a.vx + a.kx) * nx + (a.vy + a.ky) * ny, vb = -((b.vx + b.kx) * nx + (b.vy + b.ky) * ny);
      const kb = (80 + Math.max(0, va) * .9) * f, ka = (80 + Math.max(0, vb) * .9) * f;
      b.kx += nx * kb; b.ky += ny * kb; a.kx -= nx * ka; a.ky -= ny * ka; if (kb + ka > 500) sfx(180, .05);
    }
  }
}
function fire(g, p, vx, vy, o = {}) { g.b.push({ x: p.x + p.fx * p.r, y: p.y + p.fy * p.r, vx, vy, o: p.i, own: p.i, life: o.life || 2, bn: o.bn || 0, r: 6, col: p.col }); sfx(660, .05); }
function bullets(g, dt, hit, wrap) {
  for (let i = g.b.length - 1; i >= 0; i--) {
    const b = g.b[i]; b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; let dead = b.life <= 0;
    if (b.bn > 0) {
      if (b.x < b.r || b.x > W - b.r) { b.vx *= -1; b.bn--; b.o = -1; b.x = clamp(b.x, b.r, W - b.r); sfx(900, .02); }
      if (b.y < b.r || b.y > H - b.r) { b.vy *= -1; b.bn--; b.o = -1; b.y = clamp(b.y, b.r, H - b.r); sfx(900, .02); }
    } else if (wrap) { b.x = (b.x + W) % W; b.y = (b.y + H) % H; }
    else if (b.x < 0 || b.x > W || b.y < 0 || b.y > H) dead = true;
    if (!dead) for (const p of g.p) if (p.alive && p.i != b.o && Math.hypot(p.x - b.x, p.y - b.y) < p.r + b.r) { hit(p, b); dead = true; break; }
    if (dead) g.b.splice(i, 1);
  }
}
function drawB(g) { for (const b of g.b) { circ(b.x, b.y, b.r, '#fff'); circ(b.x, b.y, b.r - 2, b.col); } }
const laneY = (g, i) => 110 + (H - 200) * (i + .5) / g.n;
