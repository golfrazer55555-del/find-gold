'use strict';
// ===== 게임 상태: 시간, 생존, 소지품, 저장 =====
(function () {
const SAVE_KEY = 'desert-gold-save-v1';
const OPT_KEY = 'desert-gold-opts-v1';
G.GOAL = 10000;
G.PIECE_SRC = ['살롱 포커', '살롱 포커', '버려진 광산', '버려진 광산', '늙은 탐광자', '검은 모자 갱단'];

G.newGame = function (seed) {
  if (seed === undefined) seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
  const world = G.world = G.genWorld(seed);
  const r = G.rng(seed + 99);
  const ang = r() * Math.PI * 2;
  const S = G.S = {
    v: 1, seed, t: 8 * 60,
    cash: 120, bank: 0, health: 100, food: 12, water: 10, poisoned: false,
    inv: { pan: 0, pick: 0, canteen: 0, hook: 0, lantern: 0, revolver: 0, antivenom: 0, horse: 0 },
    bullets: 0, ore: 0, pieces: [0, 0, 0, 0, 0, 0],
    x: world.spawn.x, y: world.spawn.y, face: 'down',
    explored: new Uint8Array(world.w * world.h),
    mines: world.mines.map(m => ({ rich: m.rich, known: false, taken: false })),
    legend: { found: false, registered: false, rich: 14 },
    prosp: { met: false, done: false, known: false },
    gangDone: false, kills: 0, bountyPaid: 0, lastEnc: 8 * 60, encClock: 0,
    goldPrice: 20, high: 104, low: 58, nextHigh: 106, rumorSeed: Math.floor(r() * 1000),
    mapOff: { x: Math.cos(ang), y: Math.sin(ang) }, warned: {},
    stats: { oz: 0, earned: 0, hands: 0, won: 0 }, won: false
  };
  G.reveal(S.x, S.y, 4);
  for (let y = G.TOWN.y0 - 3; y <= G.TOWN.y1 + 3; y++) for (let x = G.TOWN.x0 - 3; x <= G.TOWN.x1 + 3; x++) S.explored[y * world.w + x] = 1;
  G.newDay(true);
  G.dead = false; G.pendingDeath = null;
  return S;
};

// ---- 시간 ----
G.day = () => Math.floor(G.S.t / 1440) + 1;
G.hour = () => (G.S.t % 1440) / 60;
G.clock = () => { const m = G.S.t % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
G.temp = () => {
  const S = G.S, h = G.hour();
  const f = (Math.cos((h - 15) / 24 * 2 * Math.PI) + 1) / 2;
  return Math.round(S.low + (S.high - S.low) * Math.pow(f, 1.4));
};
G.isNight = () => { const h = G.hour(); return h >= 20 || h < 5; };
G.newDay = function (first) {
  const S = G.S;
  if (!first) S.high = S.nextHigh;
  S.nextHigh = Math.round(94 + Math.random() * 22);
  S.low = Math.round(50 + Math.random() * 14);
  S.goldPrice = Math.round((16 + Math.random() * 8) * 2) / 2;
  S.rumorSeed = Math.floor(Math.random() * 1000);
};
G.waterCap = () => 10 + 30 * G.S.inv.canteen;
G.foodCap = () => (G.S.inv.horse ? 100 : 40);
G.oreCap = () => (G.S.inv.horse ? 150 : 30);

// 시간 경과 + 생존 계산. mode: {sleep, jail, town}
G.advance = function (min, mode = {}) {
  const S = G.S; if (!S || G.pendingDeath) return;
  let rem = min;
  while (rem > 0) {
    const step = Math.min(rem, 10); rem -= step;
    const before = Math.floor(S.t / 1440); S.t += step;
    if (Math.floor(S.t / 1440) !== before) G.newDay();
    const hrs = step / 60, temp = G.temp();
    let wRate = mode.sleep ? 0.45 : 1 + Math.max(0, temp - 72) / 11;
    if (S.inv.horse && !mode.town && !mode.sleep) wRate *= 1.35;
    let fRate = mode.sleep ? 0.35 : 0.6;
    if (mode.jail) { wRate = 0; fRate = 0; }
    S.water = Math.max(0, S.water - wRate * hrs);
    S.food = Math.max(0, S.food - fRate * hrs);
    let dh = 0, cause = null;
    if (S.water <= 0) { dh -= 9 + Math.max(0, temp - 88) / 2.5; cause = '갈증과 더위'; }
    if (S.food <= 0) { dh -= 3; cause = cause || '굶주림'; }
    if (S.poisoned) { dh -= 7; cause = '방울뱀의 독'; }
    if (dh === 0) dh = mode.sleep ? 3.5 : 1.0;
    S.health = G.clamp(S.health + dh * hrs, 0, 100);
    if (S.health <= 0) { G.die(cause || '탈진'); return; }
  }
  G.checkWarnings();
};
G.checkWarnings = function () {
  const S = G.S, w = S.warned;
  const warn = (key, cond, msg) => { if (cond && !w[key]) { w[key] = 1; G.toast(msg, 'r'); G.audio.sfx('no'); } else if (!cond) w[key] = 0; };
  warn('water', S.water < Math.min(6, G.waterCap() * 0.25) && S.water > 0, '물이 얼마 남지 않았다!');
  warn('water0', S.water <= 0, '물이 다 떨어졌다! 목이 타들어 간다…');
  warn('food0', S.food <= 0, '식량이 다 떨어졌다!');
  warn('hp', S.health < 30, '몸 상태가 위험하다!');
};
G.hurt = function (n, cause) {
  const S = G.S; S.health = G.clamp(S.health - n, 0, 100);
  if (S.health <= 0) G.die(cause);
};
G.die = function (cause) { if (!G.pendingDeath) G.pendingDeath = cause || '알 수 없는 이유'; };

G.reveal = function (px, py, rad) {
  const S = G.S, w = G.world; const cx = Math.floor(px / 16), cy = Math.floor(py / 16);
  for (let y = cy - rad; y <= cy + rad; y++) for (let x = cx - rad; x <= cx + rad; x++) {
    if (x < 0 || y < 0 || x >= w.w || y >= w.h) continue;
    if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= rad * rad + 1) S.explored[y * w.w + x] = 1;
  }
};
G.pieceCount = () => G.S.pieces.reduce((a, b) => a + b, 0);
G.givePiece = function (i) {
  const S = G.S; if (S.pieces[i]) return false;
  S.pieces[i] = 1; G.audio.sfx('piece');
  return true;
};
G.pieceText = () => `뼈 지도 조각을 얻었다! (${G.pieceCount()}/6)\n지도를 보면 광산의 위치가 더 좁혀진다.`;
G.wealthCheck = function () {
  const S = G.S;
  if (!S.won && S.legend.registered && S.bank >= G.GOAL) { S.won = true; G.ui.push(new G.VictoryScene()); return true; }
  return false;
};

// ---- 저장 / 불러오기 ----
function packBits(arr) { const out = new Uint8Array(Math.ceil(arr.length / 8)); for (let i = 0; i < arr.length; i++) if (arr[i]) out[i >> 3] |= 1 << (i & 7); let s = ''; for (const b of out) s += String.fromCharCode(b); return btoa(s); }
function unpackBits(str, n) { const s = atob(str); const a = new Uint8Array(n); for (let i = 0; i < n; i++) if (s.charCodeAt(i >> 3) & (1 << (i & 7))) a[i] = 1; return a; }
G.save = function () {
  try {
    const S = G.S; const o = Object.assign({}, S); o.explored = packBits(S.explored);
    localStorage.setItem(SAVE_KEY, JSON.stringify(o)); return true;
  } catch (e) { return false; }
};
G.hasSave = () => { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } };
G.load = function () {
  try {
    const o = JSON.parse(localStorage.getItem(SAVE_KEY)); if (!o) return false;
    G.world = G.genWorld(o.seed);
    o.explored = unpackBits(o.explored, G.world.w * G.world.h);
    G.S = o; G.dead = false; G.pendingDeath = null; return true;
  } catch (e) { console.warn(e); return false; }
};
G.deleteSave = () => { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} };
G.opts = { sound: true };
G.loadOpts = () => { try { Object.assign(G.opts, JSON.parse(localStorage.getItem(OPT_KEY)) || {}); } catch (e) {} G.audio.on = G.opts.sound; };
G.saveOpts = () => { try { localStorage.setItem(OPT_KEY, JSON.stringify(G.opts)); } catch (e) {} };
})();
