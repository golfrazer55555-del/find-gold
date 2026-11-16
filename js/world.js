'use strict';
// ===== 월드 생성 / 충돌 / 그리기 =====
(function () {
const T = G.TILE;
const WALK = new Set([T.SAND, T.BRUSH, T.GRASS, T.ROAD, T.BRIDGE, T.TOWN, T.FORD, T.BONES]);
G.walkable = t => WALK.has(t);

// 마을 구조 (타일 좌표)
const TOWN = { x0: 5, y0: 37, x1: 39, y1: 52 };
const BUILDINGS = [
  { id: 'saloon', name: '살롱', x: 7, y: 38, w: 6, h: 4 },
  { id: 'store', name: '잡화점', x: 14, y: 38, w: 5, h: 4 },
  { id: 'assay', name: '시금소', x: 20, y: 38, w: 4, h: 4 },
  { id: 'bank', name: '은행', x: 25, y: 38, w: 5, h: 4 },
  { id: 'hotel', name: '호텔', x: 31, y: 38, w: 5, h: 4 },
  { id: 'doctor', name: '병원', x: 7, y: 45, w: 4, h: 4 },
  { id: 'news', name: '신문사', x: 12, y: 45, w: 4, h: 4 },
  { id: 'sheriff', name: '보안관 사무소', x: 17, y: 45, w: 5, h: 4 },
  { id: 'stable', name: '마굿간', x: 23, y: 45, w: 6, h: 4 },
  { id: 'well', name: '우물', x: 32, y: 46, w: 1, h: 1 }
];
G.TOWN = TOWN;

G.genWorld = function (seed) {
  const W = 128, H = 96;
  const r = G.rng(seed), n1 = G.makeNoise(seed ^ 0x51ed), n2 = G.makeNoise(seed ^ 0x9e37), n3 = G.makeNoise(seed ^ 0x1234);
  const tiles = new Uint8Array(W * H);
  const I = (x, y) => y * W + x;
  const sm = (a, b, v) => { const t = G.clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const e = G.fbm(n1, x / 15, y / 15, 4);
    const h = e + sm(0.45, 0.92, x / W) * 0.34;
    let t = T.SAND;
    if (x < 2 || y < 2 || x > W - 3 || y > H - 3) t = T.MTN;
    else if (h > 0.76) t = T.MTN;
    else if (h > 0.68 && r() < 0.35) t = T.ROCK;
    else {
      const m = G.fbm(n2, x / 8, y / 8, 3);
      if (x < W * 0.5 && m > 0.75) t = T.MTN;
      else if (x < W * 0.5 && m > 0.71 && r() < 0.3) t = T.ROCK;
      else {
        const v = r(), veg = G.fbm(n3, x / 6, y / 6, 2);
        if (v < 0.018 + veg * 0.03) t = T.CACTUS;
        else if (v < 0.09 + veg * 0.08) t = T.BRUSH;
        else if (v < 0.094) t = T.BONES;
        else if (v < 0.099) t = T.TREE;
      }
    }
    tiles[I(x, y)] = t;
  }
  // 강 (북→남)
  const riverX = [], riverW = [];
  let rx = 45 + r() * 3;
  for (let y = 0; y < H; y++) {
    rx += (r() - 0.5) * 1.5 + (47 - rx) * 0.06; rx = G.clamp(rx, 43, 53);
    const wd = 2 + (n2(3.3, y / 7) > 0.55 ? 1 : 0);
    const x0 = Math.round(rx); riverX[y] = x0; riverW[y] = wd;
    for (let dx = -2; dx < wd + 2; dx++) {
      const x = x0 + dx; if (x < 1 || x >= W - 1) continue;
      if (dx >= 0 && dx < wd) tiles[I(x, y)] = T.WATER;
      else if (tiles[I(x, y)] !== T.WATER) tiles[I(x, y)] = (dx === -2 || dx === wd + 1) && r() < 0.4 ? T.BRUSH : T.GRASS;
    }
  }
  // 사금이 많은 구간 3곳
  const goldSegs = [];
  for (let k = 0; k < 3; k++) {
    const y0 = G.ri(r, 4, H - 10); goldSegs.push(y0);
    for (let y = y0; y < y0 + 5; y++) for (let dx = 0; dx < riverW[y]; dx++) tiles[I(riverX[y] + dx, y)] = T.GOLDW;
  }
  // 여울
  for (let y = 5; y < H - 3; y += 11 + G.ri(r, 0, 7)) for (let dx = 0; dx < riverW[y]; dx++) tiles[I(riverX[y] + dx, y)] = T.FORD;
  // 마을 정리
  for (let y = TOWN.y0 - 2; y <= TOWN.y1 + 2; y++) for (let x = TOWN.x0 - 2; x <= TOWN.x1 + 2; x++) {
    if (x < 2 || y < 2) continue;
    tiles[I(x, y)] = (x >= TOWN.x0 && x <= TOWN.x1 && y >= TOWN.y0 && y <= TOWN.y1) ? T.TOWN : T.SAND;
  }
  // 거리
  for (let x = TOWN.x0; x <= TOWN.x1; x++) { for (const y of [42, 43, 49, 50]) tiles[I(x, y)] = T.ROAD; }
  for (let y = 42; y <= 50; y++) { tiles[I(5, y)] = T.ROAD; tiles[I(6, y)] = T.ROAD; tiles[I(37, y)] = T.ROAD; tiles[I(38, y)] = T.ROAD; }
  // 동쪽 길 + 다리
  const roadEnd = 74;
  for (let x = TOWN.x1 + 1; x <= roadEnd; x++) for (const y of [42, 43]) {
    const t = tiles[I(x, y)];
    tiles[I(x, y)] = (t === T.WATER || t === T.GOLDW || t === T.FORD) ? T.BRIDGE : T.ROAD;
  }
  // 서쪽/남쪽 오솔길
  for (let y = TOWN.y1 + 1; y < TOWN.y1 + 14; y++) tiles[I(22, y)] = tiles[I(22, y)] === T.MTN ? T.ROAD : T.ROAD;

  // 건물
  const bmap = new Int8Array(W * H).fill(-1);
  const buildings = BUILDINGS.map((b, i) => {
    const o = Object.assign({}, b);
    o.door = { x: b.x + Math.floor(b.w / 2), y: b.y + b.h - 1 };
    for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) bmap[I(x, y)] = i;
    o.art = b.id === 'well' ? G.ART.well : G.ART.building(b.id, b.w, b.h);
    return o;
  });

  // 도달 가능 영역 (마을에서 출발)
  const spawn = { tx: 22, ty: 43 };
  const reach = new Uint8Array(W * H);
  const q = [I(spawn.tx, spawn.ty)]; reach[q[0]] = 1;
  while (q.length) {
    const c = q.pop(), x = c % W, y = (c / W) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const ni = I(nx, ny); if (reach[ni] || bmap[ni] >= 0 || !WALK.has(tiles[ni])) continue;
      reach[ni] = 1; q.push(ni);
    }
  }
  const tc = { x: 22, y: 45 };
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  // 산 입구 후보: 산 타일이고 바로 아래가 도달 가능한 땅
  const cands = [];
  for (let y = 3; y < H - 3; y++) for (let x = 3; x < W - 3; x++) {
    if (tiles[I(x, y)] !== T.MTN || tiles[I(x, y - 1)] !== T.MTN) continue;
    if (!reach[I(x, y + 1)]) continue;
    if (tiles[I(x - 1, y)] !== T.MTN || tiles[I(x + 1, y)] !== T.MTN) continue;
    cands.push({ x, y, d: dist({ x, y }, tc) });
  }
  G.shuffle(r, cands);
  const pickSpread = (list, n, sep, taken) => {
    const out = [];
    for (const c of list) { if (out.length >= n) break; if (out.concat(taken).every(o => dist(o, c) >= sep)) out.push(c); }
    return out;
  };
  // 전설의 광산 후보 8곳 (멀고 동쪽 산맥)
  let lc = cands.filter(c => c.d > 58 && c.x > W * 0.58);
  if (lc.length < 8) lc = cands.filter(c => c.d > 45);
  const legendCands = pickSpread(lc, 8, 9, []);
  const legend = legendCands[0] || cands[0];
  tiles[I(legend.x, legend.y)] = T.HIDDEN;
  // 버려진 광산 6곳
  const near = cands.filter(c => c.d > 16 && c.d < 34);
  const mid = cands.filter(c => c.d >= 22 && c.d < 85);
  let mines = pickSpread(near, 1, 12, [legend]);
  mines = mines.concat(pickSpread(mid, 6 - mines.length, 13, mines.concat([legend])));
  if (mines.length < 6) mines = mines.concat(pickSpread(cands, 6 - mines.length, 6, mines.concat([legend])));
  const pieceMines = G.shuffle(r, mines.map((m, i) => i)).slice(0, 2);
  mines = mines.map((m, i) => { tiles[I(m.x, m.y)] = T.MINE; return { x: m.x, y: m.y, rich: 1.0 + r() * 1.8, piece: pieceMines.includes(i) }; });

  // 늙은 탐광자 야영지
  let camp = null;
  const campC = [];
  for (let y = 4; y < H - 4; y++) for (let x = 4; x < W - 4; x++) {
    if (!reach[I(x, y)] || !reach[I(x, y + 1)] || tiles[I(x, y)] !== T.SAND) continue;
    if (x < (riverX[y] || 50) + 6) continue;
    const d = dist({ x, y }, tc); if (d < 32 || d > 62) continue;
    let m = 0; for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) if (tiles[I(x + i, y + j)] === T.MTN) m++;
    if (m >= 5) campC.push({ x, y });
  }
  camp = campC.length ? G.pick(r, campC) : { x: 70, y: 46 };
  tiles[I(camp.x, camp.y)] = T.CAMP;
  if (!WALK.has(tiles[I(camp.x, camp.y + 1)])) tiles[I(camp.x, camp.y + 1)] = T.SAND;

  return {
    w: W, h: H, seed, tiles, bmap, buildings, mines, legend: { x: legend.x, y: legend.y }, legendCands,
    camp, riverX, riverW, goldSegs,
    spawn: { x: spawn.tx * 16 + 8, y: spawn.ty * 16 + 12 }
  };
};

// ---- 질의 ----
G.tileAt = (tx, ty) => { const w = G.world; if (tx < 0 || ty < 0 || tx >= w.w || ty >= w.h) return T.MTN; return w.tiles[ty * w.w + tx]; };
G.bAt = (tx, ty) => { const w = G.world; if (tx < 0 || ty < 0 || tx >= w.w || ty >= w.h) return -1; return w.bmap[ty * w.w + tx]; };
G.solidAt = (px, py) => { const tx = Math.floor(px / 16), ty = Math.floor(py / 16); return !WALK.has(G.tileAt(tx, ty)) || G.bAt(tx, ty) >= 0; };
// 발 위치 기준 충돌 박스 (가로 10, 세로 5)
G.blockedBox = (x, y) => G.solidAt(x - 5, y - 4) || G.solidAt(x + 4, y - 4) || G.solidAt(x - 5, y) || G.solidAt(x + 4, y);
G.inTown = (px, py) => { const tx = px / 16, ty = py / 16; return tx >= TOWN.x0 - 1 && tx <= TOWN.x1 + 2 && ty >= TOWN.y0 - 1 && ty <= TOWN.y1 + 2; };
G.nearTown = (px, py) => { const tx = px / 16, ty = py / 16; return tx >= TOWN.x0 - 8 && tx <= TOWN.x1 + 8 && ty >= TOWN.y0 - 8 && ty <= TOWN.y1 + 8; };

// ---- 그리기 ----
G.drawWorld = function (ctx, camX, camY, viewH, anim) {
  const w = G.world, S = G.S;
  const tx0 = Math.floor(camX / 16), ty0 = Math.floor(camY / 16);
  const tx1 = Math.ceil((camX + G.W) / 16), ty1 = Math.ceil((camY + viewH) / 16);
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
    if (tx < 0 || ty < 0 || tx >= w.w || ty >= w.h) continue;
    G.drawTile(ctx, w, tx, ty, tx * 16 - camX, ty * 16 - camY + 18, 0, anim, S.legend.found);
  }
  for (const b of w.buildings) {
    const sx = b.x * 16 - camX, sy = b.y * 16 - camY + 18;
    if (sx > G.W || sy > G.H || sx + b.w * 16 < 0 || sy + b.h * 16 < 0) continue;
    ctx.drawImage(b.art, sx, sy);
  }
};
})();
