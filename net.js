'use strict';
// ================= ONLINE PLAY =================
// The host runs the whole game and streams the canvas (video + sound) to friends over WebRTC.
// Friends only send their button presses back. PeerJS's free public broker is used just to introduce the browsers to each other.
const NET = { peer: null, mode: '', code: '', status: '', conns: {}, inp: {}, stream: null, conn: null, vid: null, you: -1 };
const ROOM = 'chaos-carnival-';
function loadPeer(cb) {
  if (window.Peer) return cb();
  const s = document.createElement('script'); s.src = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js'; s.onload = cb;
  s.onerror = () => { NET.status = 'Could not load the online library — check your internet connection'; NET.mode = ''; }; document.head.appendChild(s);
}
function netStream() {
  if (NET.stream) return NET.stream; const tracks = cv.captureStream(30).getVideoTracks();
  try { audioOut(); if (ADEST) tracks.push(...ADEST.stream.getAudioTracks()); } catch (e) { }
  return NET.stream = new MediaStream(tracks);
}
function hostOnline() {
  if (NET.mode) return; NET.mode = 'host'; NET.status = 'Opening an online room…';
  loadPeer(() => {
    const code = Array.from({ length: 5 }, () => pick('ABCDEFGHJKMNPQRSTUVWXYZ23456789')).join(''), peer = NET.peer = new Peer(ROOM + code);
    peer.on('open', () => { NET.code = code; NET.status = ''; });
    peer.on('error', e => { if (!NET.code) { NET.status = 'Could not open a room (' + e.type + ') — press 4 to retry'; NET.mode = ''; NET.peer = null; } });
    peer.on('disconnected', () => { try { peer.reconnect(); } catch (e) { } });
    peer.on('connection', conn => {
      conn.on('open', () => {
        if (scene !== Lobby || roster.length >= 4) { conn.send({ msg: roster.length >= 4 ? 'That room is full (4 players max)' : 'A game is in progress — wait until they are back in the lobby, then rejoin' }); setTimeout(() => conn.close(), 600); return; }
        NET.conns[conn.peer] = conn; NET.inp[conn.peer] = { x: 0, y: 0, a: 0 }; joinPlayer({ t: 'n', id: conn.peer }); conn.send({ you: roster.length - 1 });
        peer.call(conn.peer, netStream());
      });
      conn.on('data', d => { if (d && typeof d.x == 'number' && NET.inp[conn.peer]) NET.inp[conn.peer] = { x: clamp(+d.x || 0, -1, 1), y: clamp(+d.y || 0, -1, 1), a: d.a ? 1 : 0 }; });
      const gone = () => {
        if (!NET.conns[conn.peer]) return; delete NET.conns[conn.peer]; delete NET.inp[conn.peer];
        const p = roster.find(p => p.dev.t == 'n' && p.dev.id == conn.peer); if (!p) return;
        if (scene === Lobby) { roster.splice(roster.indexOf(p), 1); relabel(); } else p.dev = { t: 'b' };      // mid-match: a CPU takes over their seat
      };
      conn.on('close', gone); conn.on('error', gone);
    });
  });
}
function joinOnline(code) {
  NET.mode = 'client'; NET.code = code; NET.status = 'Looking for room ' + code + '…'; NET.vid = null; NET.you = -1;
  loadPeer(() => {
    const peer = NET.peer = new Peer();
    peer.on('open', () => {
      const conn = NET.conn = peer.connect(ROOM + code);
      conn.on('open', () => { NET.status = 'Connected — waiting for the picture…'; });
      conn.on('data', d => { if (d && d.msg) NET.status = d.msg; if (d && d.you !== undefined) NET.you = d.you; });
      conn.on('close', () => { NET.vid = null; if (!/full|progress/.test(NET.status)) NET.status = 'Disconnected from the host'; });
    });
    peer.on('call', call => { call.answer(); call.on('stream', s => { const v = document.createElement('video'); v.srcObject = s; v.playsInline = true; v.play().catch(() => { v.muted = true; v.play().catch(() => { }); }); NET.vid = v; NET.status = ''; }); });
    peer.on('error', e => { NET.status = e.type == 'peer-unavailable' ? 'No room found with code ' + code : 'Online error: ' + e.type; });
  });
}
function leaveOnline() { try { if (NET.peer) NET.peer.destroy(); } catch (e) { } Object.assign(NET, { peer: null, mode: '', code: '', status: '', conns: {}, inp: {}, conn: null, vid: null, you: -1, stream: null }); }

// typing in a room code
const JoinCode = {
  code: '', enter() { this.code = ''; },
  update() {
    for (const k of typed) if (/^[a-z0-9]$/i.test(k) && this.code.length < 5) this.code += k.toUpperCase();
    if (pressed.Backspace) this.code = this.code.slice(0, -1);
    if (pressed.Escape) { setScene(Lobby); return; }
    if (this.code.length == 5 && pressed.Enter) { joinOnline(this.code); setScene(Remote); }
  },
  draw() {
    rect(0, 0, W, H, '#141824'); txt('JOIN AN ONLINE GAME', W / 2, 150, 56); txt('Type the 5-character room code your host can see in their lobby', W / 2, 220, 22, '#9aa5c4');
    for (let i = 0; i < 5; i++) { rect(W / 2 - 250 + i * 104, 300, 84, 110, '#1f2740'); txt(this.code[i] || '', W / 2 - 208 + i * 104, 356, 70, '#ffd43b'); }
    txt(this.code.length == 5 ? 'ENTER = join' : ' ', W / 2, 480, 30, '#69db7c'); txt('ESC = back', W / 2, 660, 18, '#6b7591');
  }
};
// the friend's view: just the host's picture, plus sending our controls
const Remote = {
  n: 0, last: '',
  update() {
    if (pressed.Escape) { leaveOnline(); setScene(Lobby); return; }
    const a = readDev({ t: 'k', i: 0 }), b = readDev({ t: 'k', i: 1 }), p = readDev({ t: 'p', i: 0 });
    const m = { x: clamp(a.x + b.x + p.x, -1, 1), y: clamp(a.y + b.y + p.y, -1, 1), a: (a.a || b.a || p.a || keys.Enter) ? 1 : 0 }, s = m.x.toFixed(2) + m.y.toFixed(2) + m.a;
    if (NET.conn && NET.conn.open && (s != this.last || this.n++ % 20 == 0)) { this.last = s; try { NET.conn.send(m); } catch (e) { } }
  },
  draw() {
    rect(0, 0, W, H, '#07080d');
    if (NET.vid && NET.vid.readyState >= 2) { c.drawImage(NET.vid, 0, 0, W, H); if (NET.you >= 0) { rect(W - 190, H - 38, 180, 30, 'rgba(0,0,0,.6)'); txt('you are ' + NAMES[NET.you], W - 100, H - 22, 16, COLS[NET.you]); } }
    else { txt('ONLINE — ROOM ' + NET.code, W / 2, 260, 50); txt(NET.status || 'Connecting…', W / 2, 350, 26, '#ffd43b'); txt('Controls: WASD or ARROWS to move  ·  F, SPACE, / or ENTER = action  ·  gamepad works too', W / 2, 450, 20, '#9aa5c4'); txt('ESC = leave', W / 2, 660, 18, '#6b7591'); }
  }
};
