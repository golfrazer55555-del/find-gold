'use strict';
// ===== 사막의 황금 — 코어 (팔레트, 난수, 스프라이트, 글꼴, 소리) =====
const G = window.G = {};
G.W = 384; G.H = 216; G.T = 16;

G.PAL = {
  k: '#140c10', K: '#2a1e1e', w: '#f6f0dc', W: '#c8c0a8', h: '#8a847a', H: '#55504c',
  y: '#f0d090', s: '#dcae68', S: '#b98445', o: '#e0782e', O: '#a8501e', r: '#c03828',
  R: '#7a2018', b: '#8a5a32', B: '#55341c', n: '#3a2414', g: '#6ca040', G: '#3a6a2c',
  l: '#a8d060', u: '#4a8ad0', U: '#2a5a9a', v: '#90c8f0', c: '#eab088', C: '#c07850',
  d: '#9a6040', Y: '#f8d838', Z: '#b89010', p: '#8a5aa8', P: '#4a3060', m: '#e8d8b0',
  e: '#d86a4a', E: '#8a3a2a', t: '#c8a060', q: '#6a4a8a'
};
const P = G.PAL;

// ---- 난수 / 노이즈 ----
G.rng = function (seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
G.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
G.ri = (r, a, b) => a + Math.floor(r() * (b - a + 1));
G.rnd = (a, b) => a + Math.random() * (b - a);
G.rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
G.pick = (r, arr) => arr[Math.floor(r() * arr.length)];
G.shuffle = (r, arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
G.hash2 = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return (h ^ (h >>> 16)) >>> 0; };

G.makeNoise = function (seed) {
  const r = G.rng(seed);
  const p = []; for (let i = 0; i < 256; i++) p.push(i);
  G.shuffle(r, p);
  const PP = new Uint8Array(512); for (let i = 0; i < 512; i++) PP[i] = p[i & 255];
  const V = new Float32Array(256); for (let i = 0; i < 256; i++) V[i] = r();
  const hs = (x, y) => V[PP[(PP[x & 255] + y) & 255]];
  const sm = t => t * t * (3 - 2 * t);
  return function (x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const a = hs(xi, yi), b = hs(xi + 1, yi), c = hs(xi, yi + 1), d = hs(xi + 1, yi + 1);
    const u = sm(xf), v = sm(yf);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
};
G.fbm = (n, x, y, o = 4) => { let s = 0, a = 1, f = 1, t = 0; for (let i = 0; i < o; i++) { s += n(x * f, y * f) * a; t += a; a *= 0.5; f *= 2; } return s / t; };

// ---- 캔버스 / 스프라이트 ----
G.canvas = function (w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  c.x = c.getContext('2d'); c.x.imageSmoothingEnabled = false; return c;
};
G.spr = function (rows, pal) {
  pal = pal || {};
  const h = rows.length; let w = 0; for (const r of rows) w = Math.max(w, r.length);
  const c = G.canvas(w, h), x = c.x;
  for (let j = 0; j < h; j++) for (let i = 0; i < rows[j].length; i++) {
    const ch = rows[j][i]; if (ch === '.' || ch === ' ') continue;
    const col = pal[ch] !== undefined ? pal[ch] : P[ch]; if (!col) continue;
    x.fillStyle = col; x.fillRect(i, j, 1, 1);
  }
  return c;
};
G.flip = function (src) { const c = G.canvas(src.width, src.height); c.x.translate(src.width, 0); c.x.scale(-1, 1); c.x.drawImage(src, 0, 0); return c; };
G.mir = half => half.map(r => r + r.split('').reverse().join(''));
G.recolor = (rows, map) => rows.map(r => r.split('').map(ch => (map[ch] !== undefined ? map[ch] : ch)).join(''));
G.scaleUp = function (src, s) { const c = G.canvas(src.width * s, src.height * s); c.x.drawImage(src, 0, 0, src.width * s, src.height * s); return c; };
G.rect = (ctx, x, y, w, h, col) => { ctx.fillStyle = P[col] || col; ctx.fillRect(x, y, w, h); };
G.box = function (ctx, x, y, w, h, fill = 'n', border = 'S', inner = 'B') {
  G.rect(ctx, x, y, w, h, 'k');
  G.rect(ctx, x + 1, y + 1, w - 2, h - 2, border);
  G.rect(ctx, x + 2, y + 2, w - 4, h - 4, inner);
  G.rect(ctx, x + 3, y + 3, w - 6, h - 6, fill);
};

// ---- 3x5 도트 글꼴 (간판, 카드, 숫자) ----
const F3 = {
  '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111', '4': '101101111001001',
  '5': '111100111001111', '6': '111100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001111',
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
  F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010',
  K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010',
  P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
  U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010',
  Z: '111001010100111', '$': '011110010011110', ':': '000010000010000', '.': '000000000000010', '-': '000000111000000',
  '/': '001001010100100', '+': '000010111010000', '!': '010010010000010', '?': '110001010000010', "'": '010010000000000',
  ',': '000000000010100', '°': '010101010000000', ' ': '000000000000000', '%': '101001010100101', '&': '010101010101011',
  '#': '101111101111101', '*': '000101010101000', '=': '000111000111000', '(': '010100100100010', ')': '010001001001010'
};
G.px = function (ctx, str, x, y, col, s = 1) {
  str = String(str).toUpperCase(); ctx.fillStyle = P[col] || col;
  for (let i = 0; i < str.length; i++) {
    const g = F3[str[i]] || F3['?'];
    for (let j = 0; j < 15; j++) if (g[j] === '1') ctx.fillRect(x + (i * 4 + (j % 3)) * s, y + Math.floor(j / 3) * s, s, s);
  }
};
G.pxW = (str, s = 1) => (String(str).length * 4 - 1) * s;

// ---- 한글 글꼴 (Galmuri) : 픽셀 선명하게 임계값 처리 ----
G.FONTS = { m: { css: '12px Galmuri11', h: 12, lh: 13 }, s: { css: '10px Galmuri9', h: 10, lh: 11 } };
const tcache = new Map();
const mc = G.canvas(8, 8).x;
function hexRGB(col) { col = P[col] || col; const n = parseInt(col.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
G.tw = function (str, f = 'm') { mc.font = G.FONTS[f].css; return Math.ceil(mc.measureText(String(str)).width); };
G.tbmp = function (str, f, col) {
  const key = f + '|' + col + '|' + str;
  let b = tcache.get(key); if (b) return b;
  if (tcache.size > 900) tcache.clear();
  const F = G.FONTS[f];
  const w = Math.max(1, G.tw(str, f) + 2), h = F.h + 4;
  const c = G.canvas(w, h), x = c.x;
  x.font = F.css; x.textBaseline = 'top'; x.fillStyle = '#fff'; x.fillText(str, 0, 1);
  const img = x.getImageData(0, 0, w, h), d = img.data; const [R, Gc, B] = hexRGB(col);
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] > 100) { d[i] = R; d[i + 1] = Gc; d[i + 2] = B; d[i + 3] = 255; } else d[i + 3] = 0;
  }
  x.putImageData(img, 0, 0); tcache.set(key, c); return c;
};
G.text = function (ctx, str, x, y, col = 'w', f = 'm', align = 'left', shadow = null) {
  str = String(str); if (!str) return 0;
  const b = G.tbmp(str, f, col);
  let dx = x; if (align === 'center') dx = x - Math.floor(b.width / 2); else if (align === 'right') dx = x - b.width;
  if (shadow) ctx.drawImage(G.tbmp(str, f, shadow), dx + 1, y + 1);
  ctx.drawImage(b, dx, y - 1);
  return b.width - 2;
};
G.wrap = function (str, maxW, f = 'm') {
  const out = [];
  for (const para of String(str).split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      const t = line ? line + ' ' + word : word;
      if (G.tw(t, f) <= maxW) { line = t; continue; }
      if (line) out.push(line);
      if (G.tw(word, f) > maxW) {
        let part = '';
        for (const ch of word) { if (G.tw(part + ch, f) > maxW) { out.push(part); part = ch; } else part += ch; }
        line = part;
      } else line = word;
    }
    out.push(line);
  }
  return out;
};
G.loadFonts = async function () {
  try {
    const f1 = new FontFace('Galmuri11', 'url(fonts/Galmuri11.woff2)');
    const f2 = new FontFace('Galmuri9', 'url(fonts/Galmuri9.woff2)');
    await Promise.all([f1.load(), f2.load()]);
    document.fonts.add(f1); document.fonts.add(f2);
  } catch (e) {
    console.warn('글꼴을 불러오지 못했습니다:', e);
    G.FONTS.m.css = '12px sans-serif'; G.FONTS.s.css = '10px sans-serif';
  }
  tcache.clear();
};

G.money = n => Math.floor(n).toLocaleString('en-US');
G.dirName = function (dx, dy) {
  const a = Math.atan2(dy, dx) * 180 / Math.PI; // 0 = 동, 90 = 남
  const names = ['동', '남동', '남', '남서', '서', '북서', '북', '북동'];
  return names[(Math.round(a / 45) + 8) % 8];
};

// ---- 소리 (WebAudio 칩튠) ----
G.audio = {
  ctx: null, on: true, master: null, musicTimer: null,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain(); this.master.gain.value = 0.22; this.master.connect(this.ctx.destination);
    } catch (e) { this.ctx = null; }
  },
  tone(freq, dur, type = 'square', vol = 0.3, slide = 0, delay = 0) {
    if (!this.ctx || !this.on) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.05);
  },
  noise(dur, vol = 0.3, delay = 0, freq = 0) {
    if (!this.ctx || !this.on) return;
    const t = this.ctx.currentTime + delay;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const s = this.ctx.createBufferSource(); s.buffer = buf;
    const g = this.ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    if (freq) { const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq; s.connect(f); f.connect(g); } else s.connect(g);
    g.connect(this.master); s.start(t);
  },
  sfx(n) {
    if (!this.ctx || !this.on) return;
    const T = this.tone.bind(this), N = this.noise.bind(this);
    switch (n) {
      case 'sel': T(660, 0.04, 'square', 0.12); break;
      case 'ok': T(880, 0.05, 'square', 0.15); T(1320, 0.07, 'square', 0.12, 0, 0.05); break;
      case 'no': T(196, 0.14, 'square', 0.18, -60); break;
      case 'coin': T(988, 0.06, 'square', 0.15); T(1319, 0.16, 'square', 0.15, 0, 0.06); break;
      case 'shot': N(0.3, 0.55, 0, 2500); T(140, 0.18, 'sawtooth', 0.3, -90); break;
      case 'click': T(1800, 0.02, 'square', 0.1); break;
      case 'ric': T(2400, 0.25, 'sine', 0.1, -1500); break;
      case 'hurt': T(220, 0.25, 'sawtooth', 0.3, -160); N(0.12, 0.2); break;
      case 'hiss': N(0.45, 0.12, 0, 6000); break;
      case 'dig': N(0.08, 0.35, 0, 900); T(90, 0.1, 'triangle', 0.4); break;
      case 'splash': N(0.35, 0.18, 0, 1500); break;
      case 'card': N(0.04, 0.2, 0, 4000); break;
      case 'step': N(0.02, 0.05, 0, 700); break;
      case 'door': T(300, 0.08, 'square', 0.12); T(220, 0.1, 'square', 0.12, 0, 0.07); break;
      case 'win': [523, 659, 784, 1047].forEach((f, i) => T(f, 0.14, 'square', 0.15, 0, i * 0.09)); break;
      case 'lose': [392, 330, 262, 196].forEach((f, i) => T(f, 0.18, 'triangle', 0.25, 0, i * 0.14)); break;
      case 'piece': [784, 988, 1175, 1568, 1175, 1568].forEach((f, i) => T(f, 0.12, 'square', 0.14, 0, i * 0.08)); break;
      case 'rumble': N(1.2, 0.5, 0, 300); break;
    }
  },
  // 짧은 서부풍 루프 음악
  music(name) {
    this.stopMusic(); if (!this.ctx || !this.on) return;
    const A = 220, n = s => A * Math.pow(2, s / 12);
    const mel = name === 'title'
      ? [0, null, 7, 12, 10, null, 7, 5, 3, null, 5, 7, 0, null, null, null, 0, null, 7, 12, 15, null, 14, 12, 10, null, 12, 7, 12, null, null, null]
      : [12, 15, 17, 19, 22, null, 19, null, 24, null, 22, 19, 17, 19, 12, null];
    const bass = [-12, null, -5, null, -12, null, -5, null, -9, null, -2, null, -12, null, -5, null];
    let i = 0;
    const step = () => {
      if (!this.on) return;
      const m = mel[i % mel.length]; if (m !== null) this.tone(n(m), 0.2, 'square', 0.07);
      const b = bass[i % bass.length]; if (b !== null) this.tone(n(b), 0.25, 'triangle', 0.16);
      i++;
    };
    this.musicTimer = setInterval(step, 190);
  },
  stopMusic() { if (this.musicTimer) clearInterval(this.musicTimer); this.musicTimer = null; }
};
