'use strict';
// ===== 도트 그래픽: 캐릭터, 타일, 아이콘, 건물, 실내, 카드 =====
(function () {
const P = G.PAL;
const A = G.ART = {};

// ---------- 캐릭터 (16x16) ----------
const DOWN = G.mir([
  '........',
  '......kk',
  '.....kbb',
  '.....kBB',
  '..kkkbbb',
  '.kbbbbbb',
  '..kkkkkk',
  '....kckc',
  '....kccc',
  '.....kCc',
  '...kkrrr',
  '..krrBrr',
  '..kcrBrr',
  '...kBBBY',
  '....kuuu',
  '....kBBk'
]);
const UP = G.mir([
  '........',
  '......kk',
  '.....kbb',
  '.....kBB',
  '..kkkbbb',
  '.kbbbbbb',
  '..kkkkkk',
  '....kBBB',
  '....kBBB',
  '.....kCC',
  '...kkrrr',
  '..krrrrr',
  '..kcrrrr',
  '...kBBBB',
  '....kuuu',
  '....kBBk'
]);
const SIDE = [
  '................',
  '......kkkk......',
  '.....kbbbbk.....',
  '.....kBBBBk.....',
  '...kkbbbbbbkkk..',
  '..kbbbbbbbbbbbk.',
  '...kkkkkkkkkkk..',
  '.....kBcccck....',
  '.....kBcckcck...',
  '.....kBccccck...',
  '......kCccck....',
  '.....kkrrrrk....',
  '.....krrrcrk....',
  '.....kBBYBk.....',
  '.....kuuuuk.....',
  '.....kBBkBBk....'
];
const legsDown = [['....kuuuuuuk....', '....kBBkkBBk....'], ['....kuuk.kuuk...', '...kBBk...kBk...'], ['...kuuk.kuuk....', '...kBk...kBBk...']];
const legsSide = [['.....kuuuuk.....', '.....kBBkBBk....'], ['....kuuk.kuk....', '...kBBk..kBBk...'], ['.....kuukuk.....', '.....kBkBBk.....']];
function withLegs(rows, legs) { const r = rows.slice(); r[14] = legs[0]; r[15] = legs[1]; return r; }

function makeChar(map, faceRows) {
  const set = {};
  const dn = G.recolor(faceRows ? applyRows(DOWN, faceRows) : DOWN, map);
  const up = G.recolor(UP, map);
  const sd = G.recolor(SIDE, map);
  set.down = legsDown.map(l => G.spr(withLegs(dn, G.recolor(l, map))));
  set.up = legsDown.map(l => G.spr(withLegs(up, G.recolor(l, map))));
  set.right = legsSide.map(l => G.spr(withLegs(sd, G.recolor(l, map))));
  set.left = set.right.map(c => G.flip(c));
  return set;
}
function applyRows(rows, rep) { const r = rows.slice(); for (const k in rep) r[k] = rep[k]; return r; }
A.makeChar = makeChar;

A.player = makeChar({});
A.prospector = makeChar({ b: 'h', B: 'H', r: 'b', u: 'B' }, { 8: '....kWWWWWWk....', 9: '.....kWWWWk.....' });
A.bandit = makeChar({ b: 'K', B: 'k', r: 'H', u: 'K', Y: 'h' }, { 8: '....krrrrrrk....', 9: '.....krrrrk.....' });
A.chief = makeChar({ b: 'k', B: 'Y', r: 'R', u: 'K' }, { 8: '....krrrrrrk....', 9: '.....krrrrk.....' });
A.folk = [
  makeChar({ b: 'S', B: 'B', r: 'u', u: 'b' }),
  makeChar({ b: 'h', B: 'H', r: 'g', u: 'n' }),
  makeChar({ b: 'p', B: 'P', r: 'p', u: 'q' }),
  makeChar({ b: 'w', B: 'r', r: 'o', u: 'B' })
];
A.keeper = {
  store: makeChar({ b: 'H', B: 'K', r: 'w', u: 'B' }),
  saloon: makeChar({ b: 'n', B: 'k', r: 'w', u: 'k' }),
  assay: makeChar({ b: 'K', B: 'k', r: 'W', u: 'H' }),
  bank: makeChar({ b: 'k', B: 'K', r: 'G', u: 'k' }),
  doctor: makeChar({ b: 'K', B: 'k', r: 'W', u: 'K' }),
  hotel: makeChar({ b: 'R', B: 'k', r: 'R', u: 'k' }),
  stable: makeChar({ b: 'S', B: 'B', r: 'b', u: 'U' }),
  news: makeChar({ b: 'H', B: 'k', r: 'w', u: 'H' }),
  sheriff: makeChar({ b: 'B', B: 'n', r: 'b', u: 'U' }, { 12: '..kcrYrr' + 'rrBrck..' })
};
A.native = G.spr([
  '..........w.....',
  '.........wRk....',
  '......kkkwRk....',
  '.....kKKKKKKk...',
  '....kKKKKKKKKk..',
  '....krrrrrrrrk..',
  '....kKddddddKk..',
  '....kKdkddkdKk..',
  '....kKddddddKk..',
  '.....kKdEEdKk...',
  '...kkoooooookk..',
  '..kdoOoooOoodk..',
  '..kdoOoooOoodk..',
  '...kbbbYbbbbk...',
  '....kbbbbbbk....',
  '....kBBkkBBk....'
]);

// 말 (24x16), 오른쪽 향함
const HORSE_TOP = [
  '........................',
  '..................kk....',
  '.................kbbk...',
  '................kbbbbk..',
  '...............kBbkbbbk.',
  '..kk..........kBBbbbbbbk',
  '.kBBkkkkkkkkkkBBbbbkkkk.',
  '.kBkbbbbbbbbbbbbbbbk....',
  '..kbbbbbbbbbbbbbbbbk....',
  '...kbbbbbbbbbbbbbbbk....',
  '...kbbbbbbbbbbbbbbk.....'
];
const HORSE_LEGS = [
  ['....kbbk.....kbbk.......', '....kbk......kbk........', '....kbk......kbk........', '....kBk......kBk........', '....kkk......kkk........'],
  ['....kbbk.....kbbk.......', '...kbkkbk...kbkkbk......', '..kbk..kbk.kbk..kbk.....', '..kBk..kBk.kBk..kBk.....', '..kkk..kkk.kkk..kkk.....']
];
A.horse = { right: HORSE_LEGS.map(l => G.spr(HORSE_TOP.concat(l))) };
A.horse.left = A.horse.right.map(c => G.flip(c));

// 뱀 (16x10)
const SNAKE = [
  ['................', '...........kk...', '..........kggk..', '..........kgkgk.', '....kkk...kggkrr', '...kgGgk..kgk...', '..kgk.kgkkgGk...', '.kgk...kgGgk....', '.kGk....kkk.....', '..k.............'],
  ['................', '...........kk...', '..........kggk..', '..........kgkgk.', '...kkk....kggk.r', '..kgGgk...kgk...', '.kgk.kgk.kgGk...', '.kgk..kgkgGk....', '..kk...kkkk.....', '................']
];
A.snake = { right: SNAKE.map(r => G.spr(r)) }; A.snake.left = A.snake.right.map(c => G.flip(c));

// ---------- 아이콘 ----------
const ic = rows => G.spr(rows);
A.icon = {
  heart: ic(['.kk.kk..', 'krrkrrk.', 'krrrrrk.', '.krrrk..', '..krk...', '...k....']),
  drop: ic(['...k....', '..kvk...', '.kvuuk..', '.kuuuk..', '.kuUUk..', '..kkk...']),
  food: ic(['....kk..', '..kkrRk.', '.krrrRk.', 'krrrRk..', 'kwkkk...', 'kk......']),
  bullet: ic(['.k..', 'kYk.', 'kYk.', 'kZk.', 'kZk.', 'kkk.']),
  nugget: ic(['........', '..kkk...', '.kYYZk..', 'kYwYZZk.', 'kZYZZk..', '.kkkk...']),
  therm: ic(['.k.', 'kwk', 'kwk', 'krk', 'krk', 'krk', 'kkk']),
  sun: ic(['..Y..', '.YYY.', 'YYYYY', '.YYY.', '..Y..']),
  moon: ic(['.ww..', 'ww...', 'ww...', 'ww...', '.ww..']),
  skull: ic(['.kkkk.', 'kwwwwk', 'wkwwkw', 'kwwwwk', '.kwkw.', '..kk..']),
  bone: ic(['.k....k.', 'kwk..kwk', '.kwwwwk.', 'kwk..kwk', '.k....k.']),
  boneOff: ic(['.k....k.', 'kHk..kHk', '.kHHHHk.', 'kHk..kHk', '.k....k.']),
  cursor: ic(['k...', 'Yk..', 'YYk.', 'YYYk', 'YYk.', 'Yk..', 'k...'])
};
// 12x12 가방 아이콘
A.item = {
  pan: ic(['............', '...kkkkkk...', '..khhhhhhk..', '.khWYhYWhhk.', '.khhYhhhhhk.', '.kkhhhhhhkk.', '..kkkkkkkkbb', '..........bk', '............', '............', '............', '............']),
  pick: ic(['..kkkk......', '.khhhhk.....', 'kh.kbhhk....', 'k..kbk.hk...', '...kbk..k...', '....kbk.....', '.....kbk....', '......kbk...', '.......kbk..', '........kbk.', '.........kk.', '............']),
  canteen: ic(['....kk......', '....kHk.....', '..kkkkkk....', '.kWhhhhWk...', 'khWhhhhhWk..', 'khhhUUhhhk..', 'khhUuuUhhk..', 'khhhUUhhhk..', '.khhhhhhk...', '..kkkkkk....', '............', '............']),
  hook: ic(['......k.....', '.....khk....', '......k.....', '......h.....', '......h.....', '......h.....', '..h...h.....', '..hk..h.....', '...hhhk.....', '....kk......', '............', '............']),
  lantern: ic(['.....kk.....', '....k..k....', '...kkkkkk...', '...kHHHHk...', '..kYwYYwYk..', '..kYYoYYYk..', '..kYooooYk..', '..kYYYYYYk..', '...kHHHHk...', '...kkkkkk...', '............', '............']),
  revolver: ic(['............', '.kkkkkkkkkk.', 'khhhhhhhhhWk', '.kkkHhHhkkk.', '....kHHHk...', '...kbbkk....', '..kbBbk.....', '..kbbk......', '..kbk.......', '..kk........', '............', '............']),
  antivenom: ic(['....kk......', '....kWk.....', '...kkkkk....', '...kWWWk....', '..kvvvvvk...', '..kvrrrvk...', '..kvrwrvk...', '..kvrrrvk...', '..kvvvvvk...', '...kkkkk....', '............', '............']),
  horse: ic(['.........kk.', '........kbbk', '.......kbkbk', '..kkkkkbbbk.', '.kbbbbbbbk..', 'kBbbbbbbbk..', '.kbbbbbbk...', '.kbk..kbk...', '.kbk..kbk...', '.kkk..kkk...', '............', '............']),
  food: ic(['............', '....kkkk....', '..kkrrRRk...', '.krrrrrRk...', 'krrrrrRRk...', 'krrrrRRk....', '.kwkkkk.....', 'kwwk........', 'kkk.........', '............', '............', '............']),
  ore: ic(['............', '...kkkk.....', '..kYYYZk....', '.kYwYYZZk...', '.kYYYZZhk...', 'kHYZZZhhk...', 'khhZZhhhk...', '.kkhhhhk....', '...kkkk.....', '............', '............', '............']),
  bullet: ic(['............', '..k...k.....', '.kYk.kYk....', '.kYk.kYk....', '.kZk.kZk....', '.kZk.kZk....', '.kkk.kkk....', '............', '............', '............', '............', '............'])
};

// ---------- 타일 (16x16) ----------
const T = G.TILE = { SAND: 0, BRUSH: 1, CACTUS: 2, ROCK: 3, MTN: 4, WATER: 5, FORD: 6, GRASS: 7, ROAD: 8, BRIDGE: 9, TOWN: 10, MINE: 11, HIDDEN: 12, GOLDW: 13, CAMP: 14, BONES: 15, TREE: 16 };
const tr = G.rng(1234);
function speckle(base, dots, n, rr) {
  const c = G.canvas(16, 16), x = c.x; G.rect(x, 0, 0, 16, 16, base);
  for (const [col, cnt] of dots) for (let i = 0; i < cnt; i++) { x.fillStyle = P[col]; x.fillRect(Math.floor(rr() * 16), Math.floor(rr() * 16), 1, 1); }
  return c;
}
function over(base, rows, ox = 0, oy = 0) { const c = G.canvas(16, 16); c.x.drawImage(base, 0, 0); c.x.drawImage(G.spr(rows), ox, oy); return c; }
const sand = [0, 1, 2, 3].map(() => speckle('s', [['y', 9], ['S', 7], ['t', 5]], 0, tr));
const dirt = [0, 1, 2, 3].map(() => speckle('t', [['s', 10], ['S', 6], ['b', 2]], 0, tr));
const road = [0, 1, 2, 3].map(() => { const c = speckle('S', [['b', 8], ['s', 6], ['O', 3]], 0, tr); G.rect(c.x, 0, 4, 16, 1, 'b'); G.rect(c.x, 0, 11, 16, 1, 'b'); return c; });
const grass = [0, 1, 2, 3].map(() => { const c = speckle('g', [['l', 10], ['G', 10]], 0, tr); for (let i = 0; i < 3; i++) { const x = Math.floor(tr() * 13), y = Math.floor(tr() * 12) + 2; c.x.fillStyle = P.G; c.x.fillRect(x, y, 1, 2); c.x.fillRect(x + 2, y, 1, 2); c.x.fillStyle = P.l; c.x.fillRect(x + 1, y - 1, 1, 3); } return c; });
const mtn = [0, 1, 2, 3].map(() => { const c = speckle('O', [['e', 14], ['E', 14], ['o', 4]], 0, tr); for (let i = 0; i < 2; i++) { const x = Math.floor(tr() * 12), y = Math.floor(tr() * 12); G.rect(c.x, x, y, 4, 1, 'e'); G.rect(c.x, x, y + 1, 4, 1, 'E'); } return c; });
const cliff = (() => { const c = G.canvas(16, 9); G.rect(c.x, 0, 0, 16, 9, 'E'); G.rect(c.x, 0, 0, 16, 1, 'e'); for (let i = 0; i < 16; i += 3) G.rect(c.x, i, 1, 1, 7, 'R'); G.rect(c.x, 0, 8, 16, 1, 'k'); for (let i = 1; i < 16; i += 5) G.rect(c.x, i, 2, 1, 4, 'O'); return c; })();
const ridge = (() => { const c = G.canvas(16, 2); G.rect(c.x, 0, 0, 16, 1, 'o'); G.rect(c.x, 0, 1, 16, 1, 'e'); return c; })();
const water = [0, 1].map(f => { const c = G.canvas(16, 16), x = c.x; G.rect(x, 0, 0, 16, 16, 'u'); for (let j = 0; j < 4; j++) { const yy = j * 4 + 1 + (f ? 2 : 0); const xx = (j * 5 + f * 3) % 12; G.rect(x, xx, yy, 4, 1, 'v'); G.rect(x, (xx + 8) % 14, (yy + 2) % 16, 2, 1, 'U'); } return c; });
const ford = (() => { const c = G.canvas(16, 16), x = c.x; G.rect(x, 0, 0, 16, 16, 'v'); G.rect(x, 0, 0, 16, 16, 'u'); x.globalAlpha = 1; for (let i = 0; i < 7; i++) { const a = Math.floor(tr() * 13), b = Math.floor(tr() * 13); G.rect(x, a, b, 3, 2, 'h'); G.rect(x, a, b, 3, 1, 'W'); } for (let i = 0; i < 6; i++) G.rect(x, Math.floor(tr() * 14), Math.floor(tr() * 16), 2, 1, 'v'); return c; })();
const bridge = (() => { const c = G.canvas(16, 16), x = c.x; G.rect(x, 0, 0, 16, 16, 'b'); for (let i = 0; i < 16; i += 4) { G.rect(x, i, 0, 1, 16, 'B'); } G.rect(x, 0, 0, 16, 2, 'n'); G.rect(x, 0, 14, 16, 2, 'n'); G.rect(x, 0, 2, 16, 1, 'k'); G.rect(x, 3, 1, 1, 1, 'h'); G.rect(x, 11, 1, 1, 1, 'h'); return c; })();
const sparkle = [0, 1].map(f => { const c = G.canvas(16, 16); const pts = f ? [[3, 4], [11, 9], [6, 13]] : [[9, 3], [4, 10], [13, 13]]; for (const [a, b] of pts) { G.rect(c.x, a, b, 1, 1, 'Y'); G.rect(c.x, a - 1, b, 3, 1, 'Z'); G.rect(c.x, a, b - 1, 1, 3, 'Z'); G.rect(c.x, a, b, 1, 1, 'w'); } return c; });
const cactusRows = [[
  '.......kk.......', '......kgGk......', '......klGk......', '..kk..klGk.kk...', '.kgGk.klGk.klGk.', '.klGk.klGkkklGk.', '.klGkkklGGgglGk.', '.klGgggGlGGGGk..',
  '..kGGGGlGk......', '......klGk......', '......klGk......', '......klGk......', '......kgGk......', '.....SkkkkS.....', '................', '................'
], [
  '................', '................', '................', '.......kk.......', '......kgGk......', '..kk..klGk......', '.kgGk.klGk......', '.klGkkklGk..kk..',
  '.klGggglGk.kgGk.', '..kGGGGlGkkklGk.', '......klGgggGk..', '......klGGGGk...', '......kgGk......', '.....SkkkkS.....', '................', '................'
]];
const rockRows = [[
  '................', '................', '................', '.....kkkkk......', '...kkhWWhhkk....', '..khWWhhhhHHk...', '..khWhhhhhHHk...', '.khhhhhhhHHHHk..',
  '.khhhhhhHHHHHk..', '.kHhhhhHHHHHHk..', '..kHHHHHHHHkk...', '..SkkkkkkkkS....', '................', '................', '................', '................'
], [
  '................', '................', '................', '................', '................', '.........kkk....', '..kkkk..khWhk...', '.khWWhk.khhHk...',
  'khWhhhHkkhHHHk..', 'khhhhHHHkkHHk...', 'kHhhHHHHHk......', '.kkkkkkkkk......', '................', '................', '................', '................'
]];
const brushRows = [[
  '................', '................', '................', '................', '................', '................', '................', '...b..b...b.....',
  '....bb.Gb.b.....', '..G..bGbbG..b...', '...GbbGbbb.b....', '....BbbbbbbB....', '.....SSSSSS.....', '................', '................', '................'
], [
  '................', '................', '................', '................', '................', '................', '................', '................',
  '..........G.....', '.........GbG....', '.....b..GbbbG...', '......bbbbb.....', '.....SSSSSS.....', '................', '................', '................'
]];
const tentRows = [
  '................', '.......k........', '......kWk.......', '.....kWwWk......', '....kWwwWWk.....', '...kWwwwWWWk....', '..kWwwwkWWWWk...', '.kWwwwkkkWWWWk..',
  'kWwwwkkkkkWWWWk.', 'kkkkkkkkkkkkkkk.', '..b..........b..', '..b...kOk....b..', '.....kOOOk......', '.....kkkkk......', '................', '................'
];
const bonesRows = [
  '................', '................', '................', '................', '................', '................', '...kkkk.........', '..kwwwwk........',
  '..kwkwkwk.......', '..kwwwwk..k...k.', '...kwkwk.kwkkkwk', '....kkk...kwwwk.', '.........kwkkkwk', '..........k...k.', '................', '................'
];
const treeRows = [
  '................', '..k.......k.....', '..kBk....kBk..k.', '...kBk..kBk..kBk', '....kBkkBk..kBk.', '.....kBBBkkkBk..', '.k....kBBBBBk...', 'kBk...kBBBk.....',
  '.kBkkkBBBk......', '..kBBBBBk.......', '....kBBBk.......', '....kBBBk.......', '....kBBBk.......', '...SkBBBkS......', '...SSkkkSS......', '................'
];
const tiles = {
  sand, dirt, road, grass, mtn, cliff, ridge, water, ford, bridge, sparkle,
  cactus: cactusRows.map((r, i) => over(sand[i], r)),
  rock: rockRows.map((r, i) => over(sand[i + 1], r)),
  brush: brushRows.map((r, i) => over(sand[i + 2], r)),
  camp: over(sand[0], tentRows), bones: over(sand[3], bonesRows), tree: over(sand[1], treeRows)
};
A.tiles = tiles;
// 광산 입구
function mineOverlay(gold) {
  const c = G.canvas(16, 16), x = c.x;
  G.rect(x, 3, 4, 10, 12, 'b'); G.rect(x, 2, 3, 12, 2, gold ? 'Y' : 'b'); G.rect(x, 2, 3, 12, 1, gold ? 'w' : 'S');
  G.rect(x, 3, 5, 2, 11, gold ? 'Z' : 'B'); G.rect(x, 11, 5, 2, 11, gold ? 'Z' : 'B');
  G.rect(x, 5, 5, 6, 11, 'k'); G.rect(x, 6, 7, 4, 9, 'K');
  if (gold) { G.rect(x, 7, 9, 1, 1, 'Y'); G.rect(x, 9, 12, 1, 1, 'Y'); }
  return c;
}
A.mineOv = mineOverlay(false); A.legendOv = mineOverlay(true);

const isMtn = t => t === T.MTN || t === T.HIDDEN || t === T.MINE;
G.drawTile = function (ctx, world, tx, ty, sx, sy, t, anim, legendFound) {
  const tl = world.tiles, Wd = world.w;
  const v = G.hash2(tx, ty) & 3;
  const tile = tl[ty * Wd + tx];
  switch (tile) {
    case T.SAND: ctx.drawImage(sand[v], sx, sy); break;
    case T.BRUSH: ctx.drawImage(tiles.brush[v & 1], sx, sy); break;
    case T.CACTUS: ctx.drawImage(tiles.cactus[v & 1], sx, sy); break;
    case T.ROCK: ctx.drawImage(tiles.rock[v & 1], sx, sy); break;
    case T.GRASS: ctx.drawImage(grass[v], sx, sy); break;
    case T.ROAD: ctx.drawImage(road[v], sx, sy); break;
    case T.TOWN: ctx.drawImage(dirt[v], sx, sy); break;
    case T.BRIDGE: ctx.drawImage(bridge, sx, sy); break;
    case T.WATER: ctx.drawImage(water[(anim + (tx & 1)) & 1], sx, sy); break;
    case T.GOLDW: ctx.drawImage(water[(anim + (tx & 1)) & 1], sx, sy); ctx.drawImage(sparkle[(anim + ty) & 1], sx, sy); break;
    case T.FORD: ctx.drawImage(ford, sx, sy); break;
    case T.CAMP: ctx.drawImage(tiles.camp, sx, sy); break;
    case T.BONES: ctx.drawImage(tiles.bones, sx, sy); break;
    case T.TREE: ctx.drawImage(tiles.tree, sx, sy); break;
    case T.MTN: case T.HIDDEN: case T.MINE: {
      ctx.drawImage(mtn[v], sx, sy);
      const above = ty > 0 ? tl[(ty - 1) * Wd + tx] : T.MTN, below = ty < world.h - 1 ? tl[(ty + 1) * Wd + tx] : T.MTN;
      if (!isMtn(above)) ctx.drawImage(ridge, sx, sy);
      if (!isMtn(below)) ctx.drawImage(cliff, sx, sy + 7);
      if (tile === T.MINE) ctx.drawImage(A.mineOv, sx, sy);
      else if (tile === T.HIDDEN && legendFound) ctx.drawImage(A.legendOv, sx, sy);
      break;
    }
    default: ctx.drawImage(sand[0], sx, sy);
  }
};
A.miniColor = {
  [T.SAND]: '#d6a862', [T.BRUSH]: '#b8a050', [T.CACTUS]: '#5a8a3a', [T.ROCK]: '#8a847a', [T.MTN]: '#9a4a28', [T.WATER]: '#3a7ac0',
  [T.FORD]: '#7ab0e0', [T.GRASS]: '#5a9a3a', [T.ROAD]: '#7a5030', [T.BRIDGE]: '#5a3a1a', [T.TOWN]: '#c8a060', [T.MINE]: '#140c10',
  [T.HIDDEN]: '#9a4a28', [T.GOLDW]: '#3a7ac0', [T.CAMP]: '#f6f0dc', [T.BONES]: '#d6a862', [T.TREE]: '#d6a862'
};

// ---------- 건물 외관 ----------
const BSTYLE = {
  saloon: { wall: 'O', dark: 'R', trim: 'Y', sign: 'SALOON', roof: 'n' },
  store: { wall: 'b', dark: 'B', trim: 'w', sign: 'GENERAL STORE', roof: 'n' },
  assay: { wall: 'h', dark: 'H', trim: 'Y', sign: 'ASSAY', roof: 'K' },
  bank: { wall: 'W', dark: 'h', trim: 'G', sign: 'BANK', roof: 'H', stone: true },
  hotel: { wall: 'q', dark: 'P', trim: 'w', sign: 'HOTEL', roof: 'n' },
  doctor: { wall: 'w', dark: 'W', trim: 'r', sign: 'DOCTOR', roof: 'H' },
  news: { wall: 'S', dark: 'b', trim: 'k', sign: 'GAZETTE', roof: 'n' },
  sheriff: { wall: 'b', dark: 'n', trim: 'Y', sign: 'SHERIFF', roof: 'k' },
  stable: { wall: 'r', dark: 'R', trim: 'w', sign: 'STABLE', roof: 'n', barn: true }
};
A.building = function (type, wT, hT) {
  const st = BSTYLE[type]; const w = wT * 16, h = hT * 16;
  const c = G.canvas(w, h), x = c.x;
  const R = (a, b, cw, ch, col) => G.rect(x, a, b, cw, ch, col);
  const top = 2;
  // 몸체
  R(0, top + 10, w, h - top - 10, 'k');
  R(1, top + 11, w - 2, h - top - 12, st.wall);
  if (st.stone) { for (let yy = top + 13; yy < h - 4; yy += 5) { R(1, yy, w - 2, 1, st.dark); for (let xx = ((yy / 5) & 1) * 4 + 2; xx < w - 2; xx += 8) R(xx, yy - 4, 1, 4, st.dark); } }
  else for (let yy = top + 13; yy < h - 4; yy += 3) R(1, yy, w - 2, 1, st.dark);
  // 가짜 정면 (false front)
  if (st.barn) {
    for (let i = 0; i < 12; i++) R(w / 2 - 4 - i * 2, top + i, 8 + i * 4, 1, i === 0 ? 'k' : st.wall);
    R(0, top + 11, w, 1, 'k');
    R(w / 2 - 14, top + 3, 28, 7, 'm'); R(w / 2 - 14, top + 3, 28, 1, 'n');
    G.px(x, st.sign, Math.floor(w / 2 - G.pxW(st.sign) / 2), top + 4, 'n');
  } else {
    R(2, top, w - 4, 13, 'k'); R(3, top + 1, w - 6, 11, st.wall);
    R(3, top + 1, w - 6, 1, st.trim);
    const sw = Math.min(w - 10, G.pxW(st.sign) + 6);
    R(Math.floor(w / 2 - sw / 2), top + 3, sw, 8, 'k'); R(Math.floor(w / 2 - sw / 2) + 1, top + 4, sw - 2, 6, 'm');
    G.px(x, st.sign, Math.floor(w / 2 - G.pxW(st.sign) / 2), top + 4, 'n');
  }
  // 창문
  const winY = top + 17;
  const doorW = type === 'stable' ? 20 : 10, dx = Math.floor(w / 2 - doorW / 2);
  const wins = [];
  for (let xx = 6; xx + 10 < w - 4; xx += 16) if (xx + 10 < dx - 2 || xx > dx + doorW + 2) wins.push(xx);
  for (const xx of wins) {
    R(xx - 1, winY - 1, 12, 12, 'k'); R(xx, winY, 10, 10, 'U'); R(xx, winY, 10, 4, 'v'); R(xx + 4, winY, 2, 10, 'k'); R(xx, winY + 4, 10, 1, 'k');
    R(xx - 1, winY + 11, 12, 1, st.trim);
  }
  // 차양 + 기둥
  const awY = h - 26;
  R(0, awY, w, 4, 'k'); R(1, awY + 1, w - 2, 2, st.roof); for (let xx = 2; xx < w - 2; xx += 4) R(xx, awY + 1, 2, 1, st.trim === 'k' ? 'H' : st.trim);
  R(2, awY + 4, 2, 20, 'n'); R(w - 4, awY + 4, 2, 20, 'n');
  // 문
  const dY = h - 22;
  R(dx - 1, dY - 1, doorW + 2, 20, 'k');
  if (type === 'saloon') { R(dx, dY, doorW, 19, 'K'); R(dx, dY + 5, 4, 9, 'b'); R(dx + 6, dY + 5, 4, 9, 'b'); R(dx, dY + 5, 4, 1, 'Y'); R(dx + 6, dY + 5, 4, 1, 'Y'); }
  else if (type === 'stable') { R(dx, dY, doorW, 19, 'B'); R(dx + doorW / 2, dY, 1, 19, 'k'); for (let i = 0; i < 9; i++) { R(dx + i, dY + i * 2, 1, 2, 'w'); R(dx + doorW - 1 - i, dY + i * 2, 1, 2, 'w'); } }
  else { R(dx, dY, doorW, 19, 'B'); R(dx + 1, dY + 1, doorW - 2, 7, 'b'); R(dx + 1, dY + 10, doorW - 2, 7, 'b'); R(dx + doorW - 3, dY + 10, 1, 1, 'Y'); }
  if (type === 'sheriff') { R(dx - 12, dY + 4, 7, 7, 'Y'); R(dx - 10, dY + 2, 3, 11, 'Y'); R(dx - 14, dY + 6, 11, 3, 'Y'); R(dx - 10, dY + 6, 3, 3, 'Z'); }
  if (type === 'doctor') { R(dx - 12, dY + 3, 3, 9, 'r'); R(dx - 15, dY + 6, 9, 3, 'r'); }
  if (type === 'bank') { R(6, h - 24, 4, 20, 'w'); R(w - 10, h - 24, 4, 20, 'w'); }
  // 판자 보도
  R(0, h - 3, w, 3, 'k'); R(0, h - 3, w, 2, 'b'); for (let xx = 0; xx < w; xx += 5) R(xx, h - 3, 1, 2, 'B');
  return c;
};
A.well = (() => { return G.spr([
  '................', '..kkkkkkkkkkkk..', '.kbbbbbbbbbbbbk.', '..kkkkkkkkkkkk..', '...kn......nk...', '...kn..k...nk...', '...kn..h...nk...', '...kn..h...nk...',
  '..khhhhhhhhhhk..', '.khWWhWWhWWhhhk.', '.khuuuuuuuuuuhk.', '.kHhhHhhHhhHhHk.', '.kHHhHHhHHhHHHk.', '..kkkkkkkkkkkk..', '................', '................'
]); })();

// ---------- 실내 장면 (384x88) ----------
const IW = 384, IH = 88;
function wall(x, col, dark, rr) { G.rect(x, 0, 0, IW, IH, col); for (let yy = 4; yy < 60; yy += 6) G.rect(x, 0, yy, IW, 1, dark); for (let i = 0; i < 40; i++) G.rect(x, Math.floor(rr() * IW), Math.floor(rr() * 58), 1, 2, dark); }
function floor(x, col, dark) { G.rect(x, 0, 60, IW, 28, col); for (let xx = 0; xx < IW; xx += 12) G.rect(x, xx, 60, 1, 28, dark); G.rect(x, 0, 60, IW, 1, 'k'); }
function shelf(x, sx, sy, w, items, rr) { G.rect(x, sx, sy + 10, w, 2, 'n'); G.rect(x, sx, sy + 12, w, 1, 'k'); for (let i = 2; i < w - 4; i += 5) { const it = items[Math.floor(rr() * items.length)]; it(x, sx + i, sy + 10); } }
const bottle = (x, a, b) => { const col = G.pick(Math.random, ['G', 'O', 'U', 'R']); G.rect(x, a + 1, b - 8, 2, 2, 'k'); G.rect(x, a, b - 6, 4, 6, col); G.rect(x, a + 1, b - 5, 1, 3, 'w'); };
const can = (x, a, b) => { const col = G.pick(Math.random, ['r', 'u', 'g', 'Y']); G.rect(x, a, b - 5, 4, 5, col); G.rect(x, a, b - 5, 4, 1, 'W'); G.rect(x, a, b - 3, 4, 1, 'w'); };
const book = (x, a, b) => { const col = G.pick(Math.random, ['R', 'U', 'G', 'n']); G.rect(x, a, b - 7, 3, 7, col); G.rect(x, a, b - 6, 3, 1, 'Y'); };
function counter(x, y, col = 'b', dark = 'B') { G.rect(x, 0, y, IW, 4, 'k'); G.rect(x, 0, y + 1, IW, 2, 'S'); G.rect(x, 0, y + 4, IW, 88 - y - 4, col); for (let xx = 8; xx < IW; xx += 24) G.rect(x, xx, y + 7, 16, 14, dark); }
function windowAt(x, a, b, w = 28, h = 22) { G.rect(x, a - 2, b - 2, w + 4, h + 4, 'n'); G.rect(x, a, b, w, h, 'v'); G.rect(x, a, b + h - 8, w, 8, 's'); G.rect(x, a, b + h - 8, w, 1, 'S'); G.rect(x, a + Math.floor(w / 2) - 1, b, 2, h, 'n'); G.rect(x, a, b + Math.floor(h / 2) - 1, w, 2, 'n'); }

A.interior = function (type) {
  const c = G.canvas(IW, IH), x = c.x, rr = G.rng(type.length * 977 + 13);
  const keeper = A.keeper[type] ? G.scaleUp(A.keeper[type].down[0], 2) : null;
  switch (type) {
    case 'saloon': {
      wall(x, 'R', 'E', rr); floor(x, 'b', 'B');
      G.rect(x, 120, 6, 144, 28, 'n'); G.rect(x, 122, 8, 140, 24, 'Z'); G.rect(x, 124, 10, 136, 20, 'v'); G.rect(x, 124, 10, 136, 6, 'w');
      shelf(x, 20, 26, 90, [bottle], rr); shelf(x, 274, 26, 90, [bottle], rr);
      x.drawImage(keeper, 176, 28); counter(x, 58, 'B', 'n');
      for (let i = 0; i < 4; i++) G.rect(x, 40 + i * 90, 50, 12, 3, 'Y');
      // 피아노
      G.rect(x, 330, 34, 46, 26, 'k'); G.rect(x, 332, 36, 42, 22, 'n'); G.rect(x, 332, 44, 42, 4, 'w'); for (let i = 334; i < 374; i += 3) G.rect(x, i, 44, 1, 3, 'k');
      break;
    }
    case 'store': {
      wall(x, 'S', 'b', rr); floor(x, 'B', 'n');
      shelf(x, 10, 2, 140, [can, can, bottle], rr); shelf(x, 10, 22, 140, [can, book], rr);
      shelf(x, 234, 2, 140, [can, can], rr); shelf(x, 234, 22, 140, [can, bottle], rr);
      x.drawImage(keeper, 176, 28);
      x.drawImage(G.scaleUp(A.item.pick, 2), 196 - 60, 6); x.drawImage(G.scaleUp(A.item.pan, 2), 210, 6);
      counter(x, 58);
      for (let i = 0; i < 3; i++) { const bx = 20 + i * 26; G.rect(x, bx, 50, 20, 24, 'k'); G.rect(x, bx + 1, 51, 18, 22, 'b'); G.rect(x, bx + 1, 55, 18, 2, 'H'); G.rect(x, bx + 1, 66, 18, 2, 'H'); }
      break;
    }
    case 'assay': {
      wall(x, 'h', 'H', rr); floor(x, 'H', 'K');
      windowAt(x, 30, 10); windowAt(x, 320, 10);
      x.drawImage(keeper, 176, 28); counter(x, 58, 'H', 'K');
      // 저울
      G.rect(x, 250, 30, 2, 28, 'Z'); G.rect(x, 232, 30, 38, 2, 'Z'); G.rect(x, 230, 40, 10, 2, 'Y'); G.rect(x, 262, 38, 10, 2, 'Y'); G.rect(x, 233, 32, 1, 8, 'Z'); G.rect(x, 268, 32, 1, 6, 'Z');
      G.rect(x, 244, 56, 14, 2, 'Z'); x.drawImage(A.item.ore, 263, 26);
      // 용광로
      G.rect(x, 90, 20, 40, 40, 'k'); G.rect(x, 92, 22, 36, 36, 'H'); G.rect(x, 100, 38, 20, 14, 'o'); G.rect(x, 104, 42, 12, 8, 'Y');
      break;
    }
    case 'bank': {
      wall(x, 'W', 'h', rr); floor(x, 'G', 'k');
      x.drawImage(keeper, 176, 28);
      for (let xx = 140; xx < 250; xx += 6) G.rect(x, xx, 10, 1, 48, 'Z'); G.rect(x, 140, 10, 110, 2, 'Z');
      counter(x, 58, 'G', 'k');
      // 금고
      G.rect(x, 300, 14, 50, 46, 'k'); G.rect(x, 302, 16, 46, 42, 'H'); G.rect(x, 306, 20, 38, 34, 'h'); G.rect(x, 320, 30, 10, 10, 'Y'); G.rect(x, 324, 34, 2, 2, 'k');
      windowAt(x, 40, 10);
      break;
    }
    case 'doctor': {
      wall(x, 'w', 'W', rr); floor(x, 'h', 'H');
      x.drawImage(keeper, 176, 28);
      // 침대
      G.rect(x, 20, 46, 90, 4, 'k'); G.rect(x, 20, 40, 90, 8, 'w'); G.rect(x, 22, 38, 18, 6, 'W'); G.rect(x, 20, 50, 3, 14, 'k'); G.rect(x, 107, 50, 3, 14, 'k');
      // 약장
      G.rect(x, 260, 6, 70, 54, 'k'); G.rect(x, 262, 8, 66, 50, 'b'); shelf(x, 262, 8, 66, [bottle], rr); shelf(x, 262, 28, 66, [bottle], rr);
      G.rect(x, 200, 6, 3, 9, 'r'); G.rect(x, 197, 9, 9, 3, 'r');
      G.rect(x, 0, 66, IW, 22, 'h');
      break;
    }
    case 'hotel': {
      wall(x, 'q', 'P', rr); floor(x, 'R', 'E');
      x.drawImage(keeper, 176, 28); counter(x, 58, 'n', 'k');
      for (let i = 0; i < 8; i++) { G.rect(x, 230 + i * 10, 14, 6, 8, 'n'); G.rect(x, 232 + i * 10, 18, 2, 4, 'Y'); }
      // 계단
      for (let i = 0; i < 7; i++) G.rect(x, 20 + i * 12, 54 - i * 8, 40, 8, i % 2 ? 'b' : 'B');
      windowAt(x, 320, 10);
      break;
    }
    case 'stable': {
      wall(x, 'b', 'B', rr); floor(x, 'S', 'b');
      for (let i = 0; i < 3; i++) {
        const sx = 20 + i * 120; G.rect(x, sx, 24, 90, 4, 'n'); G.rect(x, sx, 24, 4, 40, 'n'); G.rect(x, sx + 86, 24, 4, 40, 'n');
        const hc = ['b', 'n', 'W'][i];
        const hs = G.scaleUp(G.spr(G.recolor(HORSE_TOP.concat(HORSE_LEGS[0]), { b: hc, B: hc === 'W' ? 'h' : 'k' })), 2);
        x.drawImage(hs, sx + 12, 22);
      }
      x.drawImage(keeper, 176, 28);
      for (let i = 0; i < 30; i++) G.rect(x, Math.floor(rr() * IW), 64 + Math.floor(rr() * 22), 4, 1, 'Y');
      break;
    }
    case 'news': {
      wall(x, 'S', 'b', rr); floor(x, 'B', 'n');
      x.drawImage(keeper, 176, 28); counter(x, 58, 'b', 'B');
      // 인쇄기
      G.rect(x, 40, 16, 70, 44, 'k'); G.rect(x, 42, 18, 66, 40, 'H'); G.rect(x, 52, 24, 46, 10, 'h'); G.rect(x, 70, 10, 6, 10, 'k'); G.rect(x, 50, 40, 50, 14, 'w');
      for (let i = 0; i < 4; i++) { G.rect(x, 260 + i * 26, 10, 20, 26, 'w'); for (let j = 0; j < 5; j++) G.rect(x, 262 + i * 26, 14 + j * 4, 16, 1, 'H'); G.rect(x, 262 + i * 26, 12, 16, 2, 'k'); }
      break;
    }
    case 'sheriff': {
      wall(x, 'b', 'B', rr); floor(x, 'B', 'n');
      // 감옥 창살
      G.rect(x, 270, 0, 114, 60, 'K'); for (let xx = 272; xx < IW; xx += 7) G.rect(x, xx, 0, 2, 60, 'h'); G.rect(x, 270, 20, 114, 2, 'h');
      // 수배 전단
      for (let i = 0; i < 3; i++) { G.rect(x, 20 + i * 30, 10, 24, 30, 'm'); G.px(x, 'WANTED', 21 + i * 30, 12, 'n'); x.drawImage(A.bandit.down[0], 24 + i * 30, 20); G.px(x, '$50', 26 + i * 30, 36, 'R'); }
      x.drawImage(keeper, 176, 28); counter(x, 58, 'b', 'n');
      break;
    }
    case 'mine': case 'legend': {
      G.rect(x, 0, 0, IW, IH, 'k');
      for (let i = 0; i < 4; i++) { const s = 1 - i * 0.2; const w = IW * s, hh = IH * s; G.rect(x, (IW - w) / 2, (IH - hh) / 2 + i * 3, w, hh, ['K', 'n', 'K', 'k'][i]); }
      for (let i = 0; i < 3; i++) { const s = 1 - i * 0.25; const w = 300 * s, hh = 90 * s, ox = (IW - w) / 2, oy = (IH - hh) / 2 + i * 4; G.rect(x, ox, oy, w, 5, 'b'); G.rect(x, ox, oy, 6, hh, 'b'); G.rect(x, ox + w - 6, oy, 6, hh, 'b'); G.rect(x, ox, oy + 5, w, 1, 'B'); }
      for (let i = 0; i < 60; i++) G.rect(x, Math.floor(rr() * IW), Math.floor(rr() * IH), 2, 1, 'H');
      const n = type === 'legend' ? 40 : 10;
      for (let i = 0; i < n; i++) { const a = Math.floor(rr() * IW), b = Math.floor(rr() * IH); G.rect(x, a, b, 2, 2, 'Y'); G.rect(x, a, b, 1, 1, 'w'); }
      G.rect(x, 150, 70, 84, 3, 'h'); G.rect(x, 160, 62, 64, 10, 'B'); G.rect(x, 162, 64, 60, 3, 'b');
      break;
    }
    case 'river': {
      G.rect(x, 0, 0, IW, 40, 'v'); G.rect(x, 0, 30, IW, 10, 'O');
      for (let i = 0; i < IW; i += 30) G.rect(x, i, 24 - (i % 60) / 6, 30, 8 + (i % 60) / 6, 'E');
      G.rect(x, 0, 40, IW, 12, 'g'); G.rect(x, 0, 52, IW, 36, 'u');
      for (let i = 0; i < 30; i++) G.rect(x, Math.floor(rr() * IW), 54 + Math.floor(rr() * 32), 6, 1, 'v');
      x.drawImage(G.scaleUp(A.player.up[0], 2), 176, 34);
      break;
    }
    case 'camp': {
      G.rect(x, 0, 0, IW, 50, 'o'); G.rect(x, 0, 0, IW, 20, 'Y'); G.rect(x, 0, 40, IW, 48, 's');
      for (let i = 0; i < IW; i += 50) G.rect(x, i, 30, 40, 12, 'E');
      x.drawImage(G.scaleUp(G.spr(tentRows), 3), 40, 20);
      x.drawImage(G.scaleUp(A.prospector.down[0], 2), 200, 40);
      G.rect(x, 260, 70, 20, 4, 'B'); G.rect(x, 264, 62, 12, 8, 'o'); G.rect(x, 267, 58, 6, 6, 'Y');
      break;
    }
    case 'jail': {
      G.rect(x, 0, 0, IW, IH, 'K'); for (let xx = 4; xx < IW; xx += 12) G.rect(x, xx, 0, 3, IH, 'h'); G.rect(x, 0, 30, IW, 3, 'h');
      x.drawImage(G.scaleUp(A.player.down[0], 2), 176, 40);
      break;
    }
    case 'bag': {
      G.rect(x, 0, 0, IW, IH, 'B'); for (let yy = 0; yy < IH; yy += 4) G.rect(x, 0, yy, IW, 1, 'n');
      break;
    }
    default: G.rect(x, 0, 0, IW, IH, 'n');
  }
  G.rect(x, 0, IH - 1, IW, 1, 'k');
  return c;
};
A.interiorCache = {};
A.getInterior = type => A.interiorCache[type] || (A.interiorCache[type] = A.interior(type));

// ---------- 카드 ----------
const SUITS = [
  ['..k.k..', '.kkkkk.', 'kkkkkkk', 'kkkkkkk', '.kkkkk.', '..kkk..', '...k...'], // 하트
  ['...k...', '..kkk..', '.kkkkk.', 'kkkkkkk', '.kkkkk.', '..kkk..', '...k...'], // 다이아
  ['...k...', '..kkk..', '.kkkkk.', 'kkkkkkk', 'kkkkkkk', '..kkk..', '.kkkkk.'], // 스페이드
  ['..kkk..', '..kkk..', 'kk.k.kk', 'kkkkkkk', 'kk.k.kk', '...k...', '..kkk..']  // 클로버
];
A.suit = SUITS.map((s, i) => G.spr(s, { k: i < 2 ? P.r : P.k }));
const RANKS = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
A.rankStr = r => RANKS[r] || String(r);
const cardCache = {};
A.card = function (r, s, small) {
  const key = r + '_' + s + (small ? 's' : '');
  if (cardCache[key]) return cardCache[key];
  const w = small ? 16 : 28, h = small ? 22 : 38;
  const c = G.canvas(w, h), x = c.x; const col = s < 2 ? 'r' : 'k';
  G.rect(x, 1, 0, w - 2, h, 'k'); G.rect(x, 0, 1, w, h - 2, 'k'); G.rect(x, 1, 1, w - 2, h - 2, 'w');
  const rs = A.rankStr(r);
  if (small) { G.px(x, rs, 2, 2, col); x.drawImage(A.suit[s], 5, 11); }
  else {
    G.px(x, rs, 3, 3, col); x.drawImage(A.suit[s], 3, 10);
    x.drawImage(G.scaleUp(A.suit[s], 2), 7, 16);
    G.px(x, rs, w - 3 - G.pxW(rs), h - 8, col);
  }
  return (cardCache[key] = c);
};
A.cardBack = function (small) {
  const key = small ? 'bs' : 'b'; if (cardCache[key]) return cardCache[key];
  const w = small ? 16 : 28, h = small ? 22 : 38; const c = G.canvas(w, h), x = c.x;
  G.rect(x, 1, 0, w - 2, h, 'k'); G.rect(x, 0, 1, w, h - 2, 'k'); G.rect(x, 1, 1, w - 2, h - 2, 'w'); G.rect(x, 2, 2, w - 4, h - 4, 'R');
  for (let yy = 3; yy < h - 3; yy += 2) for (let xx = 3 + (yy % 4 === 1 ? 1 : 0); xx < w - 3; xx += 2) G.rect(x, xx, yy, 1, 1, 'r');
  return (cardCache[key] = c);
};

// ---------- 결투 배경 ----------
A.duelBg = (() => {
  const c = G.canvas(G.W, G.H), x = c.x;
  const sky = ['v', 'v', 'y', 'Y', 'o'];
  for (let i = 0; i < 5; i++) G.rect(x, 0, i * 16, G.W, 16, sky[i]);
  for (let i = 0; i < 4; i++) for (let xx = (i % 2) * 2; xx < G.W; xx += 4) G.rect(x, xx, i * 16 + 15, 2, 1, sky[i + 1]);
  // 메사
  const mr = G.rng(77);
  for (let i = 0; i < 6; i++) { const mx = i * 70 + Math.floor(mr() * 30), mw = 40 + Math.floor(mr() * 40), mh = 16 + Math.floor(mr() * 20); G.rect(x, mx, 80 - mh, mw, mh, 'E'); G.rect(x, mx + 4, 80 - mh - 3, mw - 8, 3, 'E'); G.rect(x, mx, 80 - mh, mw, 2, 'e'); }
  G.rect(x, 0, 80, G.W, G.H - 80, 's');
  for (let i = 0; i < 300; i++) G.rect(x, Math.floor(mr() * G.W), 80 + Math.floor(mr() * 136), 2, 1, G.pick(mr, ['y', 'S', 't']));
  return c;
})();
A.covers = {
  rock: G.scaleUp(G.spr(rockRows[0].slice(3, 12)), 3),
  cactus: G.scaleUp(G.spr(cactusRows[0].slice(0, 14)), 3),
  barrel: G.scaleUp(G.spr(['.kkkkkkkk.', 'kbbbbbbbbk', 'kHHHHHHHHk', 'kbbBbbBbbk', 'kbbBbbBbbk', 'kHHHHHHHHk', 'kbbBbbBbbk', 'kbbBbbBbbk', 'kHHHHHHHHk', '.kkkkkkkk.']), 3),
  wagon: G.scaleUp(G.spr(['..kkkkkkkkkkkkk..', '.kwwwwwwwwwwwwwk.', 'kwwWwwwwWwwwwWwwk', 'kwwWwwwwWwwwwWwwk', 'kbbbbbbbbbbbbbbbk', 'kBBBBBBBBBBBBBBBk', '.kkk.kkk...kkk.k.', 'kHhHk.....kHhHk..', '.kHk.......kHk...']), 3)
};
A.crosshair = G.spr(['...k.k...', '...kwk...', '...k.k...', 'kkk...kkk', 'w.......w', 'kkk...kkk', '...k.k...', '...kwk...', '...k.k...']);

// ---------- 앱 아이콘용 ----------
A.logo = G.spr([
  '................', '.......kk.......', '......kgGk......', '..kk..klGk.kk...', '.kgGk.klGk.klGk.', '.klGkkklGkkklGk.', '..kGgglGGggGGk..', '...kkkklGkkkk...',
  '......klGk......', '...kkkklGkkk....', '..kYYYZkGkYZk...', '.kYwYYZZkYwZZk..', '.kYYYZZZZYYZk...', '..kkkkkkkkkkk...', '................', '................'
]);
})();
