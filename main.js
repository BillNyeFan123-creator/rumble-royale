'use strict';
// ================= MENUS, MODES, MATCH FLOW =================
let roster = [], scene = null, M = null;
const setScene = s => { scene = s; if (s.enter) s.enter(); };
const VARIANTS = () => GAMES.reduce((a, d) => a + 1 + MUTS.filter(m => !m.mv || d.mv).length, 0);

const CARDS = [
  { id: 'swift', n: 'SWIFT', d: '+12% movement speed' },
  { id: 'guard', n: 'GUARD', d: 'Survive one knockout every game' },
  { id: 'small', n: 'COMPACT', d: 'Your body is 15% smaller' },
  { id: 'rapid', n: 'RAPID', d: 'Dashes, shots and boosts recharge 25% faster' },
  { id: 'jinx', n: 'JINX', d: 'Rivals start every game with 3s of reversed controls' },
  { id: 'bounty', n: 'BOUNTY', d: '+1 bonus point whenever you win a game' }];
const MODES = [
  { n: 'QUICK PARTY', d: 'Random games with random mutators. First to the target score wins.' },
  { n: 'THE GAUNTLET', d: 'Every single game, back to back, in a random order. Highest total wins.' },
  { n: 'CARD CLASH', d: 'Lose a game, draft a power card that sticks with you. Comebacks guaranteed.' },
  { n: 'LAST HEART', d: 'Roguelike run: 3 hearts each, mutators pile up every stage, winners take relics. Last one alive wins.' },
  { n: 'FREE PLAY', d: 'Pick any game and any mutator.' }];

function title(s, sub) { txt(s, W / 2, 64, 50); if (sub) txt(sub, W / 2, 108, 20, '#9aa5c4'); }
function perkStr(p) { return CARDS.filter(k => p.perks[k.id]).map(k => k.n + (p.perks[k.id] > 1 ? ' x' + p.perks[k.id] : '')).join('  ·  '); }

// ---------- lobby ----------
function relabel() { roster.forEach((p, i) => { p.col = COLS[i]; p.name = NAMES[i]; }); players = roster.slice(); }
function joinPlayer(dev) { if (roster.length >= 4) return; roster.push({ dev, score: 0, perks: {}, hearts: 3 }); relabel(); sfx(400 + roster.length * 150, .15, 'sine'); }
const devName = d => d.t == 'k' ? KB[d.i].n : d.t == 'p' ? 'GAMEPAD' : d.t == 'b' ? 'CPU  (' + SKN[botLv] + ')' : 'ONLINE FRIEND';
const Lobby = {
  t: 0,
  update(dt) {
    this.t += dt;
    KB.forEach((k, i) => { if (k.a.some(q => pressed[q]) && !roster.some(p => p.dev.t == 'k' && p.dev.i == i)) joinPlayer({ t: 'k', i }); });
    const gp = pads(); let start = false;
    for (let i = 0; i < gp.length; i++) { const g = gp[i]; if (!g) continue; if (g.buttons[0] && g.buttons[0].pressed && !roster.some(p => p.dev.t == 'p' && p.dev.i == i)) joinPlayer({ t: 'p', i }); if (g.buttons[9] && g.buttons[9].pressed) start = true; }
    if (pressed.Digit1) joinPlayer({ t: 'b' });
    if (pressed.Digit2) { const i = roster.map(p => p.dev.t).lastIndexOf('b'); if (i >= 0) { roster.splice(i, 1); relabel(); } }
    if (pressed.Digit3) botLv = (botLv + 1) % 3;
    if (pressed.Digit4) hostOnline();
    if (pressed.Digit5 && !NET.mode) { setScene(JoinCode); return; }
    if (pressed.Backspace) { roster = roster.filter(p => p.dev.t == 'n'); relabel(); }
    if ((pressed.Enter || start) && roster.length) setScene(Menu);
  },
  draw() {
    rect(0, 0, W, H, '#141824');
    for (let i = 0; i < 4; i++) circ(W / 2 + (i - 1.5) * 90, 50 + Math.sin(this.t * 3 + i) * 6, 20, COLS[i]);
    txt('RUMBLE ROYALE', W / 2, 128, 80); txt(GAMES.length + ' games  ×  ' + MUTS.length + ' mutators  =  ' + VARIANTS() + ' ways to play', W / 2, 188, 22, '#ffd43b');
    for (let i = 0; i < 4; i++) {
      const x = 170 + i * 313, p = roster[i]; rect(x - 140, 226, 280, 110, p ? p.col : '#1f2740');
      txt(p ? p.name : 'open slot', x, 262, p ? 30 : 22, p ? '#111' : '#6b7591'); if (p) txt(devName(p.dev), x, 304, 18, '#111');
    }
    txt('JOIN ON THIS KEYBOARD — press your action key:', W / 2, 372, 20, '#cfd6ea');
    txt('F  (moves with WASD)   ·   /  (Arrows)   ·   ;  (IJKL)   ·   Numpad 0  (Numpad 8456)   ·   A on a gamepad', W / 2, 402, 18, '#9aa5c4');
    txt('1 = add a CPU player      2 = remove a CPU      3 = CPU skill: ' + SKN[botLv], W / 2, 448, 22, '#74c0fc');
    if (NET.mode == 'host' && NET.code) {
      const web = /^https?:/.test(location.protocol) && !/^(localhost|127\.|\[::1\])/.test(location.hostname);
      rect(W / 2 - 430, 482, 860, 96, '#1f2740'); txt('ONLINE ROOM CODE:  ' + NET.code, W / 2, 512, 38, '#ffd43b');
      txt(web ? 'Send friends this link:  ' + location.href.split('#')[0] + '#' + NET.code : 'Friends open the game, press 5 and type this code', W / 2, 552, 16, '#cfd6ea');
    } else txt(NET.status || '4 = HOST an online game      5 = JOIN a friend\'s online game', W / 2, 520, 22, NET.status ? '#ffd43b' : '#b197fc');
    txt(roster.length ? 'ENTER = start with ' + roster.length + ' player' + (roster.length > 1 ? 's' : '') + (roster.length == 1 ? '  (press 1 to add a CPU rival)' : '') : 'waiting for players…', W / 2, 630, 28, roster.length ? '#69db7c' : '#6b7591');
    txt('BACKSPACE = clear players', W / 2, 678, 15, '#6b7591');
  }
};

// ---------- mode menu ----------
const Menu = {
  sel: 0,
  enter() { players = roster.slice(); M = null; },
  update() {
    const d = anyDir(); if (d == 0) this.sel = (this.sel + MODES.length - 1) % MODES.length; if (d == 2) this.sel = (this.sel + 1) % MODES.length; if (d == 0 || d == 2) sfx(400, .03);
    if (pressed.Escape) { setScene(Lobby); return; }
    if (anyA()) { sfx(800, .1); startMatch(this.sel); }
  },
  draw() {
    rect(0, 0, W, H, '#141824'); title('CHOOSE A MODE', 'UP / DOWN + ACTION  ·  ESC = back to lobby');
    MODES.forEach((m, i) => { const y = 190 + i * 92, s = i == this.sel; rect(240, y - 36, 800, 76, s ? '#ffd43b' : '#1f2740'); txt(m.n, W / 2, y - 10, 30, s ? '#111' : '#fff'); txt(m.d, W / 2, y + 20, 16, s ? '#333' : '#6b7591'); });
  }
};

// ---------- match flow ----------
function startMatch(mode) {
  roster.forEach(p => { p.score = 0; p.perks = {}; p.hearts = 3; p.gain = 0; }); players = roster.slice();
  M = { mode, round: 0, recent: [], queue: mode == 1 ? shuffle(GAMES.slice()) : null, target: 5 * Math.max(1, roster.length - 1) };
  if (mode == 4) setScene(Free); else nextGame();
}
function pickGame() { let d; do d = pick(GAMES); while (M.recent.includes(d)); M.recent.push(d); if (M.recent.length > 14) M.recent.shift(); return d; }
function pickMuts(def, k) { const o = [], used = {}; for (const m of shuffle(mutsFor(def))) { if (o.length >= k) break; if (used[m.g]) continue; used[m.g] = 1; o.push(m.id); } return o; }
function nextGame() {
  M.round++; let def, muts = [];
  if (M.mode == 1) def = M.queue[M.round - 1];
  else { def = pickGame(); muts = pickMuts(def, M.mode == 3 ? Math.min(3, Math.floor((M.round - 1) / 2)) : (R() < .5 ? (R() < .2 ? 2 : 1) : 0)); }
  play(def, muts);
}
function play(def, muts) {
  M.def = def;
  startGame(def, muts, aw => {
    if (!aw) { players = roster.slice(); setScene(M.mode == 4 ? Free : Menu); return; }
    const mx = Math.max(...aw), mn = Math.min(...aw); M.last = aw; M.pl = players.slice();
    players.forEach((p, i) => { let a = aw[i]; if (a == mx && mx > mn && p.perks.bounty) a += p.perks.bounty; p.gain = a; p.score += a; p.lost = 0; });
    if (M.mode == 3 && mx > mn) players.forEach((p, i) => { if (aw[i] == mn) { p.hearts--; p.lost = 1; } });
    M.draft = M.mode == 2 ? players.filter((p, i) => aw[i] < mx) : M.mode == 3 && mx > mn ? players.filter((p, i) => aw[i] == mx) : [];
    setScene(Results);
  });
  setScene(GameScene);
}
function advance() {
  const top = Math.max(...roster.map(p => p.score)), lead = roster.filter(p => p.score == top);
  if ((M.mode == 0 || M.mode == 2) && top >= M.target && lead.length == 1) return setScene(Final);
  if (M.mode == 1 && M.round >= GAMES.length) return setScene(Final);
  if (M.mode == 3) { players = roster.filter(p => p.hearts > 0); if (players.length <= 1 || players.every(p => p.dev.t == 'b')) return setScene(Final); }   // also ends once only CPUs are left
  if (M.mode == 4) return setScene(Free);
  M.draft = M.draft.filter(p => players.includes(p));
  if (M.draft.length) setScene(Draft); else nextGame();
}

const Results = {
  t: 0, enter() { this.t = 0; },
  update(dt) { this.t += dt; if (this.t > .7 && anyA()) advance(); if (pressed.Escape) setScene(Menu); },
  draw() {
    rect(0, 0, W, H, '#141824');
    const sub = M.mode == 1 ? 'Gauntlet — game ' + M.round + ' of ' + GAMES.length : M.mode == 3 ? 'Last Heart — stage ' + M.round : M.mode == 4 ? 'Free Play' : MODES[M.mode].n + ' — first to ' + M.target;
    title(M.def.name + ' — RESULTS', sub);
    const list = roster.slice().sort((a, b) => M.mode == 3 ? (b.hearts - a.hearts) || (b.score - a.score) : b.score - a.score);
    list.forEach((p, i) => {
      const y = 200 + i * 104, played = M.pl.includes(p); rect(200, y - 40, 880, 84, '#1f2740'); rect(200, y - 40, 14, 84, p.col);
      txt(p.name, 240, y - 8, 34, p.col, 'left'); txt(perkStr(p) || ' ', 240, y + 24, 14, '#9aa5c4', 'left');
      if (M.mode == 3) txt(p.hearts > 0 ? '♥'.repeat(p.hearts) : 'OUT', 640, y, 34, p.lost ? '#ff6b6b' : '#ff8787');
      if (played) txt('+' + p.gain, 860, y, 34, p.gain ? '#69db7c' : '#6b7591'); txt(p.score, 1010, y, 48);
    });
    if (this.t > .7) txt('press ACTION to continue', W / 2, 670, 22, '#69db7c');
  }
};

const Draft = {
  enter() { this.p = M.draft.shift(); this.opts = shuffle(CARDS.slice()).slice(0, 3); this.sel = 1; this.t = 0; },
  update(dt) {
    this.t += dt; const I = IN[players.indexOf(this.p)]; if (!I) { advance(); return; }
    if (I.dir == 3) this.sel = (this.sel + 2) % 3; if (I.dir == 1) this.sel = (this.sel + 1) % 3;
    const bot = this.p.dev.t == 'b'; if (bot && this.t > 1.3) this.sel = ri(0, 2);
    if ((bot && this.t > 1.3) || (!bot && this.t > .5 && I.ap)) { const k = this.opts[this.sel].id; this.p.perks[k] = (this.p.perks[k] || 0) + 1; sfx(900, .15, 'sine'); if (M.draft.length) setScene(Draft); else nextGame(); }
  },
  draw() {
    rect(0, 0, W, H, '#141824'); txt(this.p.name + ': PICK A ' + (M.mode == 3 ? 'RELIC' : 'CARD'), W / 2, 90, 52, this.p.col); txt('LEFT / RIGHT + ACTION  (only ' + this.p.name + ' can choose)', W / 2, 140, 20, '#9aa5c4');
    this.opts.forEach((k, i) => {
      const x = W / 2 + (i - 1) * 340, s = i == this.sel; rect(x - 150, s ? 210 : 230, 300, 330, s ? this.p.col : '#1f2740');
      txt(k.n, x, s ? 290 : 310, 40, s ? '#111' : '#fff'); wrapTxt(k.d, x, s ? 380 : 400, 22, s ? '#111' : '#9aa5c4', 250);
      if (this.p.perks[k.id]) txt('owned x' + this.p.perks[k.id], x, s ? 510 : 530, 16, s ? '#111' : '#6b7591');
    });
  }
};

const Final = {
  t: 0, enter() { this.t = 0; players = roster.slice(); const top = Math.max(...roster.map(p => p.score)); this.w = M.mode == 3 ? roster.filter(p => p.hearts > 0) : roster.filter(p => p.score == top); if (!this.w.length) this.w = roster.filter(p => p.score == top); sfx(660, .2, 'sine'); },
  update(dt) { this.t += dt; if (R() < .2) burst(rnd(0, W), rnd(0, H / 2), pick(COLS), 8); updParts(dt); if (this.t > 1.5 && (anyA() || pressed.Escape)) setScene(Menu); },
  draw() {
    rect(0, 0, W, H, '#141824'); drawParts(); crown(W / 2, 170 + Math.sin(this.t * 3) * 8, 60);
    txt(this.w.map(p => p.name).join(' & '), W / 2, 320, 110, this.w[0].col); txt(MODES[M.mode].n + ' CHAMPION' + (this.w.length > 1 ? 'S' : ''), W / 2, 420, 40);
    roster.slice().sort((a, b) => b.score - a.score).forEach((p, i) => txt(p.name + '   ' + p.score + ' pts', W / 2, 500 + i * 36, 24, p.col));
    if (this.t > 1.5) txt('press ACTION', W / 2, 680, 22, '#69db7c');
  }
};

// ---------- free play ----------
const Free = {
  sel: 0, mut: 0, step: 0,
  enter() { this.step = 0; players = roster.slice(); },
  opts() { return ['NONE', 'RANDOM', ...mutsFor(GAMES[this.sel]).map(m => m.id)]; },
  update() {
    const d = anyDir(), N = GAMES.length, ROWS = 17;
    if (pressed.Escape) { if (this.step) this.step = 0; else setScene(Menu); return; }
    if (this.step == 0) {
      if (d == 0) this.sel = (this.sel + N - 1) % N; if (d == 2) this.sel = (this.sel + 1) % N; if (d == 1) this.sel = Math.min(N - 1, this.sel + ROWS); if (d == 3) this.sel = Math.max(0, this.sel - ROWS);
      if (anyA()) { this.step = 1; this.mut = 0; sfx(800, .05); }
    } else {
      const o = this.opts(); if (d == 0) this.mut = (this.mut + o.length - 1) % o.length; if (d == 2) this.mut = (this.mut + 1) % o.length;
      if (anyA()) { const v = o[this.mut], def = GAMES[this.sel]; M.round++; play(def, v == 'NONE' ? [] : v == 'RANDOM' ? pickMuts(def, 1) : [v]); }
    }
  },
  draw() {
    rect(0, 0, W, H, '#141824'); const def = GAMES[this.sel];
    if (this.step == 0) {
      title('FREE PLAY', 'directions + ACTION  ·  ESC = back');
      GAMES.forEach((g, i) => { const x = 230 + Math.floor(i / 17) * 410, y = 142 + (i % 17) * 30, s = i == this.sel; rect(x - 190, y - 13, 380, 26, s ? '#ffd43b' : '#1f2740'); txt(g.name, x - 176, y, 17, s ? '#111' : '#fff', 'left'); txt(g.genre, x + 180, y, 13, s ? '#333' : '#6b7591', 'right'); });
      txt(def.desc, W / 2, 668, 18, '#cfd6ea');
    } else {
      title(def.name, 'choose a mutator  ·  ESC = back');
      this.opts().forEach((id, i) => { const m = MUTS.find(q => q.id == id), y = 150 + i * 32, s = i == this.mut; rect(340, y - 14, 600, 28, s ? '#ffd43b' : '#1f2740'); txt(m ? m.n : id, 360, y, 18, s ? '#111' : '#fff', 'left'); txt(m ? m.d : id == 'NONE' ? 'The pure game' : 'Surprise me', 920, y, 14, s ? '#333' : '#6b7591', 'right'); });
    }
  }
};

// ---------- main loop ----------
let last = 0, accu = 0;
function step() { pollInput(); scene.update(1 / 60); for (const k in pressed) delete pressed[k]; typed.length = 0; }
function frame(ts) {
  accu += Math.min(.1, (ts - last) / 1000); last = ts; let n = 0;
  while (accu >= 1 / 60 && n++ < 6) { accu -= 1 / 60; step(); }
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; scene.draw(); requestAnimationFrame(frame);
}
const hashCode = location.hash.slice(1).toUpperCase();
if (/^[A-Z0-9]{5}$/.test(hashCode)) { joinOnline(hashCode); setScene(Remote); } else setScene(Lobby);
requestAnimationFrame(frame);
