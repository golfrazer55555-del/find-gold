'use strict';
// ===== 장면: 월드, 가방, 지도, 타이틀, 게임오버, 승리 + 각종 사건 =====
(function () {
const A = G.ART, I = G.input, T = G.TILE;
const portrait = s => s.down[0];

// =============== 월드 ===============
const FOLK_LINES = [
  '"한낮엔 사막에 나가지 마. 그늘도 없이 걷다간 물이 반나절도 못 가."',
  '"우물물은 공짜야. 나가기 전에 수통을 꽉 채우라고."',
  '"마을 건물들은 저녁 6시면 문을 닫아. 살롱만 새벽 2시까지 하지."',
  '"말이 있으면 사막이 훨씬 좁아지지. 비싸긴 해도."',
  '"하스켈 영감? 붉은 바위 산맥 어딘가에 금광이 있다고 떠들다 죽었지."',
  '"호텔에서 자면 몸도 회복되고 마음도 놓이지. (호텔에서 저장된다)"',
  '"강도를 만나면 차라리 돈을 주는 게 나을 때도 있어. 은행에 맡겨 둔 돈은 안전하고."'
];
class WorldScene {
  constructor() {
    this.opaque = true; this.anim = 0; this.animT = 0; this.walkT = 0; this.acc = 0; this.encAcc = 0;
    this.snakes = []; this.shots = []; this.snakeT = 0; this.biteCd = 0; this.lastH = 'right'; this.stepT = 0;
    this.folk = [];
    for (let i = 0; i < 4; i++) this.folk.push({ x: (8 + i * 8) * 16 + 8, y: (i % 2 ? 50 : 43) * 16 + 10, face: 'down', t: Math.random() * 2, dx: 0, dy: 0, spr: A.folk[i], line: FOLK_LINES[i] });
    this.lastTile = -1; this.prompt = null;
  }
  resume() { I.taps.length = 0; }
  update(dt) {
    const S = G.S;
    this.animT += dt; if (this.animT > 0.45) { this.animT = 0; this.anim ^= 1; }
    this.biteCd -= dt;
    if (I.hit('b')) { G.ui.push(new BagScene()); return; }
    if (I.hit('m')) { G.ui.push(new MapScene()); return; }
    // 이동
    const d = I.dir(); const moving = Math.hypot(d.x, d.y) > 0.15;
    const sp = (S.inv.horse ? 72 : 38) * (S.health < 25 ? 0.75 : 1);
    if (moving) {
      if (Math.abs(d.x) > Math.abs(d.y)) S.face = d.x > 0 ? 'right' : 'left'; else S.face = d.y > 0 ? 'down' : 'up';
      if (S.face === 'left' || S.face === 'right') this.lastH = S.face;
      const nx = S.x + d.x * sp * dt, ny = S.y + d.y * sp * dt;
      if (!G.blockedBox(nx, S.y)) S.x = nx; else this.bump();
      if (!G.blockedBox(S.x, ny)) S.y = ny; else this.bump();
      this.walkT += dt;
      this.stepT -= dt; if (this.stepT <= 0) { this.stepT = S.inv.horse ? 0.18 : 0.3; G.audio.sfx('step'); }
    } else this.walkT = 0;
    // 시간: 실제 1초 = 게임 3분
    this.acc += dt * 3;
    if (this.acc >= 1) {
      const m = Math.floor(this.acc); this.acc -= m;
      G.advance(m, { town: G.inTown(S.x, S.y) });
      this.encAcc += m;
      if (this.encAcc >= 15) { this.encAcc -= 15; if (this.rollEncounter()) return; }
    }
    // 시야
    const ti = Math.floor(S.y / 16) * G.world.w + Math.floor(S.x / 16);
    if (ti !== this.lastTile) { this.lastTile = ti; G.reveal(S.x, S.y, G.isNight() ? (S.inv.lantern ? 4 : 3) : 6); }
    this.updateFolk(dt); this.updateSnakes(dt); this.updateShots(dt);
    this.prompt = this.target();
    if (I.hit('a')) this.interact();
    if (I.hit('c')) this.shoot();
    let t; while ((t = I.tap())) { if (this.prompt && t.y > G.H - 30) this.interact(); }
  }
  bump() {
    const S = G.S; const f = this.front();
    if (G.tileAt(f.tx, f.ty) === T.HIDDEN && !S.legend.found) G.discoverLegend();
  }
  front() {
    const S = G.S; const o = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[S.face];
    const fx = S.x + o[0] * 10, fy = S.y - 3 + o[1] * 10;
    return { tx: Math.floor(fx / 16), ty: Math.floor(fy / 16), fx, fy };
  }
  target() {
    const S = G.S, w = G.world; const f = this.front();
    for (const p of this.folk) if (Math.hypot(p.x - f.fx, p.y - f.fy) < 14) return { k: 'folk', p, label: '말 걸기' };
    const bi = G.bAt(f.tx, f.ty);
    if (bi >= 0) {
      const b = w.buildings[bi];
      if (b.id === 'well') return { k: 'well', label: '우물물 마시기' };
      if (f.tx === b.door.x && f.ty === b.door.y && S.face === 'up') return { k: 'bld', b, label: `${b.name} 들어가기` + (G.isOpen(b.id) ? '' : ' (닫힘)') };
      return null;
    }
    const t = G.tileAt(f.tx, f.ty), here = G.tileAt(Math.floor(S.x / 16), Math.floor((S.y - 3) / 16));
    if (t === T.MINE) { const i = w.mines.findIndex(m => m.x === f.tx && m.y === f.ty); return { k: 'mine', i, label: '광산 들어가기' }; }
    if (t === T.HIDDEN) return S.legend.found ? { k: 'legend', label: '하스켈 광산 들어가기' } : { k: 'hidden', label: '바위틈 살펴보기' };
    const cp = w.camp;
    if (t === T.CAMP || Math.hypot(cp.x * 16 + 8 - f.fx, (cp.y + 1) * 16 + 8 - f.fy) < 14) return { k: 'camp', label: '탐광자와 이야기' };
    if (t === T.WATER || t === T.GOLDW || t === T.FORD || here === T.FORD) return { k: 'water', gold: t === T.GOLDW, label: t === T.GOLDW ? '반짝이는 강가' : '강가' };
    return null;
  }
  interact() {
    const p = this.prompt; if (!p) return;
    G.audio.sfx('sel');
    switch (p.k) {
      case 'folk': G.say(p.p.line, null, { portrait: portrait(p.p.spr) }); break;
      case 'well': G.useWater('well'); break;
      case 'bld': G.enterBuilding(p.b); break;
      case 'mine': G.openMine(p.i); break;
      case 'legend': G.openLegend(); break;
      case 'hidden': G.discoverLegend(); break;
      case 'camp': G.visitCamp(); break;
      case 'water': G.useWater(p.gold ? 'gold' : 'river'); break;
    }
  }
  shoot() {
    const S = G.S;
    if (!S.inv.revolver) { G.toast('총이 없다.', 'W'); return; }
    if (S.bullets <= 0) { G.audio.sfx('click'); G.toast('총알이 없다!', 'r'); return; }
    S.bullets--; G.audio.sfx('shot');
    const o = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[S.face];
    this.shots.push({ x: S.x + o[0] * 8, y: S.y - 8 + o[1] * 6, vx: o[0] * 280, vy: o[1] * 280, life: 0.45 });
    if (G.inTown(S.x, S.y)) G.arrest();
  }
  rollEncounter() {
    const S = G.S;
    if (G.nearTown(S.x, S.y) || S.t - S.lastEnc < 150) return false;
    const night = G.isNight();
    if (Math.random() < (night ? 0.06 : 0.03)) { S.lastEnc = S.t; G.encounterBandits(); return true; }
    if (!night && Math.random() < 0.015) { S.lastEnc = S.t; G.encounterNatives(); return true; }
    return false;
  }
  updateFolk(dt) {
    for (const p of this.folk) {
      p.t -= dt;
      if (p.t <= 0) {
        p.t = 1 + Math.random() * 2.5;
        const r = Math.random(); const dirs = [[1, 0], [-1, 0], [0, 0], [0, 0]];
        [p.dx, p.dy] = dirs[Math.floor(r * dirs.length)];
        if (p.dx) p.face = p.dx > 0 ? 'right' : 'left'; else p.face = 'down';
      }
      if (p.dx || p.dy) {
        const nx = p.x + p.dx * 18 * dt;
        if (!G.blockedBox(nx, p.y) && G.inTown(nx, p.y) && Math.hypot(nx - G.S.x, p.y - G.S.y) > 12) p.x = nx; else { p.dx = -p.dx; }
      }
    }
  }
  updateSnakes(dt) {
    const S = G.S, h = G.hour();
    this.snakeT -= dt;
    if (this.snakeT <= 0) {
      this.snakeT = 1;
      if (this.snakes.length < 5 && !G.nearTown(S.x, S.y) && h >= 6 && h < 21) {
        const a = Math.random() * Math.PI * 2, r = 110 + Math.random() * 70;
        const x = S.x + Math.cos(a) * r, y = S.y + Math.sin(a) * r;
        const tx = Math.floor(x / 16), ty = Math.floor(y / 16);
        let rocky = 0; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const t = G.tileAt(tx + i, ty + j); if (t === T.ROCK || t === T.MTN) rocky++; }
        const t = G.tileAt(tx, ty);
        if ((t === T.SAND || t === T.BRUSH) && Math.random() < (rocky ? 0.45 : 0.1)) this.snakes.push({ x, y, face: Math.random() < 0.5 ? 'left' : 'right', st: 'idle', t: Math.random() * 2, vx: 0, vy: 0, cd: 0 });
      }
    }
    for (const s of this.snakes) {
      const dx = S.x - s.x, dy = S.y - s.y, d = Math.hypot(dx, dy);
      s.t -= dt; s.cd -= dt;
      if (s.st === 'idle') {
        if (s.t <= 0) { s.t = 1 + Math.random() * 2; const a = Math.random() * 6.28; s.vx = Math.cos(a) * 8; s.vy = Math.sin(a) * 8; if (Math.random() < 0.4) s.vx = s.vy = 0; }
        if (d < 34 && s.cd <= 0) { s.st = 'strike'; s.t = 0.55; s.vx = dx / d * 75; s.vy = dy / d * 75; G.audio.sfx('hiss'); }
      } else if (s.st === 'strike') {
        if (d < 9 && this.biteCd <= 0) { this.bite(); s.st = 'rest'; s.t = 2; s.vx = s.vy = 0; }
        else if (s.t <= 0) { s.st = 'rest'; s.t = 1.6; s.vx = s.vy = 0; }
      } else if (s.st === 'rest' && s.t <= 0) { s.st = 'idle'; s.cd = 1; }
      const nx = s.x + s.vx * dt, ny = s.y + s.vy * dt;
      if (!G.solidAt(nx, ny) && !G.inTown(nx, ny)) { s.x = nx; s.y = ny; } else { s.vx = -s.vx; s.vy = -s.vy; }
      if (s.vx) s.face = s.vx > 0 ? 'right' : 'left';
    }
    this.snakes = this.snakes.filter(s => !s.dead && Math.hypot(S.x - s.x, S.y - s.y) < 300);
  }
  bite() {
    const S = G.S; this.biteCd = 3;
    if (S.inv.horse && Math.random() < 0.5) { G.toast('말이 놀라 뛰어올라 뱀을 피했다!', 'Y'); return; }
    S.poisoned = true; G.hurt(8, '방울뱀의 독'); G.audio.sfx('hurt');
    G.toast('방울뱀에게 물렸다! 독이 퍼진다…', 'r');
    G.toast(S.inv.antivenom ? '가방에서 해독제를 쓰자!' : '서둘러 마을 의사에게 가야 한다!', 'o');
  }
  updateShots(dt) {
    for (const b of this.shots) {
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      if (G.solidAt(b.x, b.y + 6)) b.life = 0;
      for (const s of this.snakes) if (!s.dead && Math.hypot(s.x - b.x, s.y - 4 - b.y) < 10) { s.dead = true; b.life = 0; G.toast('방울뱀을 쏘아 죽였다.', 'Y'); }
    }
    this.shots = this.shots.filter(b => b.life > 0);
  }
  cam() {
    const S = G.S, w = G.world;
    return { x: Math.round(G.clamp(S.x - G.W / 2, 0, w.w * 16 - G.W)), y: Math.round(G.clamp(S.y - 8 - 99, 0, w.h * 16 - 198)) };
  }
  draw(ctx) {
    const S = G.S, c = this.cam();
    G.drawWorld(ctx, c.x, c.y, 198, this.anim);
    const ents = [];
    const fr = this.walkT > 0 ? [1, 0, 2, 0][Math.floor(this.walkT * (S.inv.horse ? 10 : 7)) % 4] : 0;
    ents.push({ y: S.y, draw: () => this.drawPlayer(ctx, S.x - c.x, S.y - c.y + 18, fr) });
    for (const p of this.folk) ents.push({ y: p.y, draw: () => ctx.drawImage(p.spr[p.face][p.dx ? (Math.floor(Date.now() / 200) % 2 ? 1 : 0) : 0], Math.round(p.x - 8 - c.x), Math.round(p.y - 15 - c.y + 18)) });
    const cp = G.world.camp, px = cp.x * 16 + 8, py = (cp.y + 1) * 16 + 10;
    if (!G.S.prosp.gone) ents.push({ y: py, draw: () => ctx.drawImage(A.prospector.down[0], px - 8 - c.x, py - 15 - c.y + 18) });
    for (const s of this.snakes) ents.push({ y: s.y, draw: () => ctx.drawImage(A.snake[s.face][s.st === 'strike' ? 1 : this.anim], Math.round(s.x - 8 - c.x), Math.round(s.y - 9 - c.y + 18)) });
    ents.sort((a, b) => a.y - b.y).forEach(e => e.draw());
    for (const b of this.shots) G.rect(ctx, Math.round(b.x - c.x) - 1, Math.round(b.y - c.y + 18) - 1, 3, 3, 'Y');
    this.drawLight(ctx, S.x - c.x, S.y - c.y + 10);
    G.drawHUD(ctx);
    G.drawToasts(ctx, this.prompt ? G.H - 34 : G.H - 18);
    if (this.prompt) {
      const lab = (I.touchMode ? '[행동] ' : '[스페이스] ') + this.prompt.label; const w = G.tw(lab, 'm') + 14;
      G.box(ctx, 192 - w / 2, G.H - 20, w, 18); G.text(ctx, lab, 192, G.H - 16, 'Y', 'm', 'center');
    }
  }
  drawPlayer(ctx, x, y, fr) {
    const S = G.S; x = Math.round(x); y = Math.round(y);
    if (S.inv.horse) {
      const hf = this.lastH; const hs = A.horse[hf][fr ? 1 : 0];
      ctx.drawImage(hs, x - 12, y - 15);
      const ps = A.player[hf][0];
      ctx.drawImage(ps, 0, 0, 16, 13, x - 8 + (hf === 'right' ? -1 : 1), y - 25, 16, 13);
      ctx.drawImage(hs, 0, 7, 24, 3, x - 12, y - 8, 24, 3);
    } else ctx.drawImage(A.player[S.face][fr], x - 8, y - 15);
  }
  drawLight(ctx, px, py) {
    const h = G.hour(); let d = 0;
    if (h >= 20 || h < 5) d = 0.66; else if (h >= 18) d = (h - 18) / 2 * 0.66; else if (h < 7) d = (7 - h) / 2 * 0.66;
    if (h >= 16.5 && h < 19.5) { ctx.globalAlpha = 0.12 * Math.sin((h - 16.5) / 3 * Math.PI); G.rect(ctx, 0, 18, G.W, G.H, 'o'); ctx.globalAlpha = 1; }
    if (d <= 0.01) return;
    const L = G.lightC || (G.lightC = G.canvas(G.W, G.H)); const x = L.x;
    x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, G.W, G.H);
    x.fillStyle = `rgba(8,8,40,${d})`; x.fillRect(0, 0, G.W, G.H);
    x.globalCompositeOperation = 'destination-out';
    const R = G.S.inv.lantern ? 70 : 42;
    for (const [rr, a] of [[R, 0.35], [R * 0.75, 0.6], [R * 0.5, 1]]) { x.fillStyle = `rgba(0,0,0,${a})`; x.beginPath(); x.arc(Math.round(px), Math.round(py), rr, 0, 6.29); x.fill(); }
    ctx.drawImage(L, 0, 0);
  }
}
G.WorldScene = WorldScene;

// =============== 물 / 강 ===============
G.useWater = function (kind) {
  const S = G.S;
  if (kind === 'well') {
    G.advance(5, { town: true }); S.water = G.waterCap(); G.audio.sfx('splash');
    G.toast(`시원한 우물물로 목을 축이고 물을 채웠다. (${G.waterCap()})`, 'v'); return;
  }
  const gold = kind === 'gold';
  const menu = new G.Menu({
    title: gold ? '금빛이 반짝이는 강가' : '강가', art: A.getInterior('river'),
    text: () => (gold ? '강바닥 모래에 금빛 알갱이가 반짝인다! ' : '흙탕물이 천천히 흐른다. ') + `금 원석 ${S.ore.toFixed(1)}/${G.oreCap()}oz`,
    items: () => [
      { label: '물 마시고 수통 채우기 (10분)', right: `${Math.floor(S.water)}/${G.waterCap()}`, act: () => { G.advance(10); S.water = G.waterCap(); G.audio.sfx('splash'); menu.flash('물을 실컷 마시고 수통을 채웠다.', 'v'); } },
      { label: '사금 채취하기 (30분)', disabled: !S.inv.pan, why: '사금 채취 팬이 필요하다.', act: () => {
        if (S.ore >= G.oreCap()) return menu.flash('더 들 수 없다. 마을에서 팔자.', 'r');
        G.advance(30); if (G.pendingDeath) return; G.audio.sfx('splash');
        let oz = gold ? G.rnd(0.15, 0.75) : (Math.random() < 0.4 ? G.rnd(0.03, 0.2) : 0);
        oz = Math.min(Math.round(oz * 100) / 100, G.oreCap() - S.ore);
        if (oz > 0) { S.ore += oz; S.stats.oz += oz; G.audio.sfx('coin'); menu.flash(`사금 ${oz.toFixed(2)}oz를 건졌다!`); } else menu.flash('모래뿐이다…', 'W');
      } },
      { label: '낚시하기 (1시간)', disabled: !S.inv.hook, why: '낚싯바늘이 필요하다.', act: () => {
        G.advance(60); if (G.pendingDeath) return;
        if (Math.random() < 0.7) { const f = Math.min(G.rint(2, 5), G.foodCap() - S.food); S.food += Math.max(0, f); G.audio.sfx('ok'); menu.flash(`메기를 낚았다! 식량 +${Math.max(0, f)}`); } else menu.flash('입질이 없다…', 'W');
      } },
      { label: '떠나기', act: () => G.ui.pop() }
    ]
  });
  G.ui.push(menu);
};

// =============== 광산 ===============
const richWord = r => (r > 1.8 ? '풍부함' : r > 1.1 ? '괜찮음' : r > 0.6 ? '줄어듦' : '거의 바닥');
function dig(menu, ms, legend) {
  const S = G.S, cap = G.oreCap();
  if (S.ore >= cap) return menu.flash(`더 이상 들 수 없다 (${cap}oz). 마을에 가서 팔자.`, 'r');
  G.advance(60); if (G.pendingDeath) return;
  G.audio.sfx('dig');
  const caveP = legend ? 0.02 : (S.inv.lantern ? 0.035 : 0.07);
  if (Math.random() < caveP) {
    const dmg = G.rint(20, 45); G.audio.sfx('rumble'); G.hurt(dmg, '갱도 붕괴');
    menu.flash(`우르르! 천장이 무너졌다! 체력 -${dmg}`, 'r'); return;
  }
  let oz = ms.rich * G.rnd(0.3, 1.2); if (!S.inv.lantern) oz *= 0.6;
  ms.rich *= legend ? 0.99 : 0.92;
  oz = Math.min(Math.round(oz * 10) / 10, cap - S.ore);
  if (oz >= 0.1) { S.ore += oz; S.stats.oz += oz; G.audio.sfx('coin'); menu.flash(`금 원석 ${oz.toFixed(1)}oz를 캐냈다!`); }
  else menu.flash('돌덩이뿐이다…', 'W');
}
G.openMine = function (idx) {
  const S = G.S, m = G.world.mines[idx], ms = S.mines[idx]; ms.known = true;
  const menu = new G.Menu({
    title: `버려진 광산 #${idx + 1}`, art: A.getInterior('mine'),
    text: () => `썩은 버팀목이 삐걱거린다. 금맥: ${richWord(ms.rich)} · 원석 ${S.ore.toFixed(1)}/${G.oreCap()}oz${S.inv.lantern ? '' : ' · 랜턴이 없어 어둡다'}`,
    items: () => [
      { label: '곡괭이로 채굴하기 (1시간)', disabled: !S.inv.pick, why: '곡괭이가 필요하다.', act: () => dig(menu, ms, false) },
      { label: '갱도 깊이 탐색하기 (2시간)', disabled: !S.inv.lantern, why: '너무 어둡다. 랜턴이 필요하다.', act: () => explore(menu, idx) },
      { label: '나가기', act: () => G.ui.pop() }
    ]
  });
  G.ui.push(menu);
};
function explore(menu, idx) {
  const S = G.S, m = G.world.mines[idx], ms = S.mines[idx];
  G.advance(120); if (G.pendingDeath) return;
  ms.searched = (ms.searched || 0) + 1;
  if (m.piece && !ms.taken && Math.random() < 0.65) {
    ms.taken = true; G.givePiece(!S.pieces[2] ? 2 : 3);
    G.say(['갱도 맨 끝, 무너진 바위 틈에 해골 하나가 낡은 가죽 주머니를 움켜쥐고 있다…', '주머니 안에는 뼈다귀 모양의 가죽 조각이 들어 있었다!', G.pieceText()]);
    return;
  }
  const r = Math.random(), lucky = ms.searched <= 2;
  if (r < 0.12) { S.poisoned = true; G.hurt(8, '방울뱀의 독'); G.audio.sfx('hurt'); menu.flash('어둠 속에서 방울뱀이 물었다! 독에 걸렸다!', 'r'); }
  else if (r < 0.18) { const d = G.rint(15, 35); G.audio.sfx('rumble'); G.hurt(d, '갱도 붕괴'); menu.flash(`갱도 일부가 무너졌다! 체력 -${d}`, 'r'); }
  else if (r < 0.32 && lucky) { S.cash += G.rint(5, 40); G.audio.sfx('coin'); menu.flash('녹슨 깡통 안에 누군가 숨겨 둔 동전이 있었다!'); }
  else if (r < 0.42 && lucky && S.inv.revolver) { S.bullets += 6; G.audio.sfx('ok'); menu.flash('버려진 탄띠에서 총알 6발을 찾았다.'); }
  else if (r < 0.55) { const oz = Math.min(G.rnd(0.5, 2), G.oreCap() - S.ore); S.ore += oz; S.stats.oz += oz; G.audio.sfx('coin'); menu.flash(`깊은 곳에서 금 원석 ${oz.toFixed(1)}oz를 주웠다.`); }
  else menu.flash(m.piece && !ms.taken ? '막다른 길이다… 하지만 어딘가 더 깊은 곳이 있는 것 같다.' : '막다른 길이다. 아무것도 없다.', 'W');
}
G.discoverLegend = function () {
  const S = G.S; if (S.legend.found) return;
  S.legend.found = true; G.audio.sfx('piece');
  G.say(['바위틈 사이로 찬 바람이 새어 나온다…', '돌을 치우자 오래된 갱도 입구가 드러났다. 기둥에 칼로 새긴 글자: "J. HASKELL 1858"', '하스켈의 잃어버린 광산을 찾았다!!\n마을 시금소에서 소유권을 등록하자.'], () => G.openLegend());
};
G.openLegend = function () {
  const S = G.S;
  const menu = new G.Menu({
    title: '하스켈의 잃어버린 광산', art: A.getInterior('legend'),
    text: () => `벽을 따라 굵은 금맥이 번쩍인다! ${S.legend.registered ? '(소유권 등록됨)' : '(시금소에서 소유권 등록 필요)'} · 원석 ${S.ore.toFixed(1)}/${G.oreCap()}oz`,
    items: () => [
      { label: '곡괭이로 채굴하기 (1시간)', disabled: !S.inv.pick, why: '곡괭이가 필요하다.', act: () => dig(menu, S.legend, true) },
      { label: '나가기', act: () => G.ui.pop() }
    ]
  });
  G.ui.push(menu);
};

// =============== 늙은 탐광자 ===============
G.visitCamp = function () {
  const S = G.S, pr = S.prosp, face = portrait(A.prospector);
  const first = !pr.met; pr.met = true;
  if (pr.done) {
    G.say(G.pick(Math.random, [
      '"하스켈은 늘 해 뜨는 쪽 붉은 산을 바라보며 걸었지. 지도 조각을 다 모으면 거기가 보일 거야."',
      '"버려진 광산엔 랜턴을 들고 깊숙이 들어가 봐. 하스켈이 묵던 곳도 있거든."',
      '"광산을 찾으면 꼭 시금소에 등록부터 해. 안 그러면 다 소용없어."',
      '"살롱의 늙은 광부 에드 녀석, 그 뼈다귀 지도를 판돈으로 걸기도 하더군."'
    ]), null, { portrait: face, title: '먼지수염 오틀리' });
    return;
  }
  const can = S.food >= 10 && S.water >= 10;
  G.ask((first ? '천막 앞에 깡마른 노인이 앉아 있다.\n"나는 먼지수염 오틀리라네. 하스켈과 같이 금을 캤었지…" ' : '') +
    '"며칠째 굶었다네. 식량 10개와 물 10만 나눠 주면, 내가 가진 걸 주지."', [
    { label: `식량 10, 물 10을 나눠 준다${can ? '' : ' (부족함)'}`, disabled: !can, act: () => {
      S.food -= 10; S.water -= 10; pr.done = true; G.givePiece(4);
      G.say(['노인이 허겁지겁 먹고는 품속에서 무언가를 꺼낸다.\n"하스켈이 죽기 전에 나한테 맡긴 거야. 자네가 가지게."', G.pieceText(), '"그 광산은 붉은 바위 산맥 깊숙한 절벽 아래 있어. 겉보기엔 그냥 바위처럼 보이지."'], null, { portrait: face, title: '먼지수염 오틀리' });
    } },
    { label: '다음에 오겠다', act: () => {} }
  ], { portrait: face, title: '먼지수염 오틀리' });
};

// =============== 원주민 ===============
G.encounterNatives = function () {
  const S = G.S, L = G.world.legend;
  const hint = () => {
    const dx = L.x * 16 - S.x, dy = L.y * 16 - S.y, d = Math.hypot(dx, dy) / 16;
    const far = d < 15 ? '아주 가까운 곳' : d < 35 ? '반나절 거리' : '하루 거리';
    return `"당신들이 찾는 '노인의 동굴'은 여기서 ${G.dirName(dx, dy)}쪽, ${far}에 있다. 그곳의 바위는 신성하니 함부로 굴지 마라."`;
  };
  const gift = () => { S.water = G.waterCap(); G.audio.sfx('ok'); G.say(['그들은 선물을 받고 고개를 끄덕인다. 가죽 물주머니로 당신의 수통을 가득 채워 준다.', hint()], null, { portrait: A.native }); };
  G.ask('말을 탄 원주민 일행이 다가온다. 그들의 지도자가 손을 들어 인사한다.', [
    { label: '식량 5개를 나눈다', disabled: S.food < 5, act: () => { S.food -= 5; gift(); } },
    { label: '$20를 건넨다', disabled: S.cash < 20, act: () => { S.cash -= 20; gift(); } },
    { label: '인사만 하고 지나간다', act: () => G.toast('그들은 조용히 지나갔다.', 'W') }
  ], { portrait: A.native });
};

// =============== 강도 ===============
G.rob = function (pre) {
  const S = G.S; const lost = [];
  if (S.cash > 0) lost.push('$' + G.money(S.cash));
  if (S.ore > 0) lost.push(`금 ${S.ore.toFixed(1)}oz`);
  S.cash = 0; S.ore = 0;
  let horse = false;
  if (S.inv.horse && Math.random() < 0.25) { S.inv.horse = 0; horse = true; S.food = Math.min(S.food, G.foodCap()); }
  if (!lost.length) G.hurt(6, '강도의 구타');
  G.audio.sfx('lose');
  G.say(pre + '\n' + (lost.length ? '빼앗긴 것: ' + lost.join(', ') : '가진 게 없다고 실컷 두들겨 맞았다.') + (horse ? '\n말까지 끌고 가 버렸다!' : ''));
};
G.encounterBandits = function (forceGang) {
  const S = G.S;
  const gang = !S.gangDone && G.day() >= 3 && (forceGang || Math.random() < 0.4);
  const n = gang ? 5 : G.rint(2, 3);
  G.audio.sfx('no');
  const armed = S.inv.revolver && S.bullets > 0;
  G.ask(gang ? '검은 모자를 쓴 무리가 바위 뒤에서 나타났다! 검은 모자 갱단이다!\n"하스켈의 보물을 쫓는 놈이 너냐?"' : `노상강도 ${n}명이 길을 막았다!\n"가진 걸 전부 내놔!"`, [
    { label: armed ? '총을 뽑는다' : '총을 뽑는다 (리볼버와 총알 필요)', disabled: !armed, act: () => G.ui.push(new G.DuelScene(n, gang, (res, k) => G.duelResult(res, k, n, gang))) },
    { label: '도망친다', act: () => {
      if (Math.random() < (S.inv.horse ? 0.65 : 0.3)) { G.advance(15); G.toast('간신히 도망쳤다!', 'Y'); }
      else { const dmg = G.rint(8, 20); G.hurt(dmg, '강도의 총탄'); G.audio.sfx('hurt'); if (!G.pendingDeath) G.rob(`도망치다 등에 총을 맞았다! (체력 -${dmg})`); }
    } },
    { label: '순순히 내준다', act: () => G.rob('강도들이 주머니를 털어 갔다.') }
  ], { portrait: (gang ? A.chief : A.bandit).down[0] });
};
G.duelResult = function (res, k, n, gang) {
  const S = G.S; S.kills += k;
  if (G.pendingDeath) return;
  if (res === 'win') {
    let loot = 0; for (let i = 0; i < n; i++) loot += G.rint(10, 45);
    if (gang) loot += 150;
    S.cash += loot; G.audio.sfx('win');
    const pages = [`강도들을 모두 쓰러뜨렸다! 그들의 주머니에서 $${loot}를 찾았다.`, `보안관 사무소에 가면 현상금 $${k * 50}를 받을 수 있다.`];
    if (gang) { S.gangDone = true; if (G.givePiece(5)) pages.push('두목의 조끼 안주머니에서 뼈다귀 모양 가죽 조각이 나왔다!', G.pieceText()); }
    G.say(pages);
  } else if (res === 'fled') G.toast('간신히 도망쳤다!', 'Y');
  else if (res === 'nobullet') G.rob('총알이 떨어졌다! 강도들이 덮쳐 왔다.');
};

// =============== 가방 ===============
class BagScene extends G.Menu {
  constructor() {
    const S = G.S;
    super({
      title: '가방', art: (ctx, x, y) => this.drawInv(ctx, x, y),
      text: () => `체력 ${Math.floor(S.health)}${S.poisoned ? ' (중독!)' : ''} · 은행 $${G.money(S.bank)} · 금 원석 ${S.ore.toFixed(1)}/${G.oreCap()}oz · 처치한 강도 ${S.kills}명`,
      items: () => [
        { label: '지도 보기', right: 'M', act: () => G.ui.push(new MapScene()) },
        { label: `해독제 쓰기 (${S.inv.antivenom}개)`, disabled: !S.poisoned || !S.inv.antivenom, why: S.poisoned ? '해독제가 없다!' : '독에 걸리지 않았다.',
          act: () => { S.inv.antivenom--; S.poisoned = false; G.audio.sfx('ok'); this.flash('해독제를 마셨다. 독이 가라앉는다.'); } },
        { label: '야영하기 (8시간 잠)', disabled: G.inTown(S.x, S.y), why: '마을에서는 호텔을 이용하자.', act: () => this.camp() },
        { label: '조작법 · 도움말', act: () => G.showHelp() },
        { label: '메뉴 (저장 · 나가기 · 소리)', right: 'ESC', act: () => G.ui.push(new SystemMenu()) },
        { label: '닫기', act: () => G.ui.pop() }
      ]
    });
  }
  camp() {
    const S = G.S; const night = G.isNight();
    G.advance(480, { sleep: true }); if (G.pendingDeath) return;
    G.ui.pop();
    if (Math.random() < (night ? 0.2 : 0.08) && G.S.t - S.lastEnc > 60) { S.lastEnc = S.t; G.say('자다가 인기척에 눈을 떴다!', () => G.encounterBandits()); }
    else G.say(`모닥불 곁에서 잠을 잤다. 지금은 ${G.day()}일 ${G.clock()}.`);
  }
  drawInv(ctx, x0, y0) {
    const S = G.S, inv = S.inv;
    ctx.drawImage(A.getInterior('bag'), x0, y0);
    const list = [['pan', '팬', inv.pan], ['pick', '곡괭이', inv.pick], ['canteen', '수통', inv.canteen], ['hook', '낚싯바늘', inv.hook], ['lantern', '랜턴', inv.lantern],
      ['revolver', '리볼버', inv.revolver], ['bullet', '총알', inv.revolver ? S.bullets : 0], ['antivenom', '해독제', inv.antivenom], ['horse', '말', inv.horse]];
    list.forEach(([k, name, n], i) => {
      const x = x0 + 8 + i * 41, y = y0 + 4;
      G.rect(ctx, x, y, 36, 36, 'k'); G.rect(ctx, x + 1, y + 1, 34, 34, n ? 'S' : 'n'); G.rect(ctx, x + 2, y + 2, 32, 32, n ? 't' : 'K');
      ctx.globalAlpha = n ? 1 : 0.25; ctx.drawImage(A.item[k], x + 6, y + 5, 24, 24); ctx.globalAlpha = 1;
      if (n > 1 || k === 'bullet') G.text(ctx, String(n), x + 33, y + 24, 'w', 's', 'right', 'k');
      G.text(ctx, name, x + 18, y + 40, n ? 'w' : 'h', 's', 'center');
    });
    const by = y0 + 60;
    G.text(ctx, `뼈 지도 조각 ${G.pieceCount()}/6`, x0 + 10, by + 4, 'Y', 's');
    S.pieces.forEach((p, i) => ctx.drawImage(p ? A.icon.bone : A.icon.boneOff, x0 + 100 + i * 20, by + 5, 16, 10));
    G.text(ctx, `식량 ${Math.floor(S.food)}/${G.foodCap()}  물 ${Math.floor(S.water)}/${G.waterCap()}`, x0 + 376, by + 4, 'm', 's', 'right');
  }
}
G.BagScene = BagScene;

// =============== 메뉴 (저장 · 불러오기 · 소리 · 나가기) ===============
const volItems = () => [
  { label: '효과음 크기', get val() { return G.opts.sfxVol; }, set: v => { G.opts.sfxVol = v; G.saveOpts(); G.audio.sfx('coin'); } },
  { label: '음악 크기', get val() { return G.opts.musicVol; }, set: v => { G.opts.musicVol = v; G.saveOpts(); } }
];
G.loadAndPlay = function (slot) {
  if (slot === null || slot === undefined || !G.load(slot)) { G.audio.sfx('no'); return; }
  G.ui.reset(new WorldScene()); G.toast(`${G.slotName(slot)}: ${G.day()}일 ${G.clock()}부터 다시 시작`, 'Y');
};
G.slotMenu = function (mode, hud) {
  const saving = mode === 'save';
  const m = new G.Menu({
    title: saving ? '어느 슬롯에 저장할까?' : '불러올 저장 파일', hud,
    text: saving ? '이미 저장된 슬롯을 고르면 덮어쓴다.' : '「자동 저장」은 호텔에서 자거나 건물에 들어갈 때 저장된다.',
    items: () => (saving ? G.SLOTS : G.allSlots()).map(sl => {
      const d = G.slotDetail(sl);
      return {
        label: `${G.slotName(sl)}: ${d ? d.label : '비어 있음'}`, right: d ? d.when : '', disabled: !saving && !d, why: '비어 있는 슬롯이다.',
        act: () => {
          if (!saving) { const go = () => G.loadAndPlay(sl); if (G.S && G.ui.stack.some(x => x instanceof WorldScene)) G.ask(`${G.slotName(sl)}을(를) 불러올까? 저장하지 않은 진행은 사라진다.`, [{ label: '불러온다', act: go }, { label: '취소', act: () => {} }]); else go(); return; }
          const doSave = () => { if (G.save(sl)) { G.audio.sfx('ok'); m.flash(`${G.slotName(sl)}에 저장했다. (${G.day()}일 ${G.clock()})`); } else m.flash('저장에 실패했다. 브라우저 저장소를 확인하세요.', 'r'); };
          if (d) G.ask(`${G.slotName(sl)}의 저장(${d.label})을 덮어쓸까?`, [{ label: '덮어쓴다', act: doSave }, { label: '취소', act: () => {} }]); else doSave();
        }
      };
    }).concat([{ label: '돌아가기', act: () => G.ui.pop() }])
  });
  return m;
};
G.settingsMenu = withNewGame => new G.Menu({
  title: '설정', hud: false, text: '좌우 방향키(또는 ◀ ▶ 탭)로 소리 크기를 조절한다.',
  items: () => volItems()
    .concat(withNewGame && G.hasSave() ? [{ label: '새 게임 시작하기', rcol: 'r', right: '처음부터', act: () => G.ask(
      '정말 새 게임을 시작할까?\n저장 슬롯은 지워지지 않지만, 새 게임에서 호텔에 묵거나 건물에 들어가면 「자동 저장」은 새 게임으로 덮어써진다.',
      [{ label: '취소', act: () => {} }, { label: '새 게임 시작', act: () => G.startNew() }]) }] : [])
    .concat([{ label: '돌아가기', act: () => G.ui.pop() }])
});
class SystemMenu extends G.Menu {
  constructor() {
    const below = G.ui.top();
    const canSave = below instanceof WorldScene || (below instanceof G.Menu && !(below instanceof SystemMenu));
    super({
      title: '메뉴', hud: true,
      text: () => { const ls = G.latestSlot(); return `${G.day()}일 ${G.clock()} · 마지막 저장: ${ls === null ? '없음' : G.slotName(ls) + ' (' + G.saveInfo(ls) + ')'}`; },
      items: () => {
        const S = G.S, slot = S.slot || 1;
        return [
          { label: '게임으로 돌아가기', act: () => G.ui.pop() },
          { label: '저장하기', right: '슬롯 1~3', disabled: !canSave, why: '지금은 저장할 수 없다.', act: () => G.ui.push(G.slotMenu('save', true)) },
          { label: '불러오기', disabled: !G.hasSave(), why: '저장된 게임이 없다.', act: () => G.ui.push(G.slotMenu('load', true)) },
          { label: '저장하고 나가기', right: G.slotName(slot), disabled: !canSave, why: '지금은 저장할 수 없다.', act: () => {
            if (!G.save(slot)) { this.flash('저장에 실패했다. 브라우저 저장소를 확인하세요.', 'r'); return; }
            G.audio.sfx('ok'); G.ui.reset(new TitleScene()); G.titleMsg = `${G.slotName(slot)}에 저장했습니다. 「이어하기」로 계속할 수 있습니다.`;
          } },
          ...volItems(),
          { label: '조작법 · 도움말', act: () => G.showHelp() },
          { label: '저장하지 않고 나가기', act: () => G.ask('저장하지 않고 타이틀로 나갈까? 마지막 저장 이후의 진행은 사라진다.', [{ label: '나간다', act: () => G.ui.reset(new TitleScene()) }, { label: '취소', act: () => {} }]) }
        ];
      }
    });
  }
}
G.SystemMenu = SystemMenu;

// =============== 지도 ===============
class MapScene {
  constructor() {
    this.opaque = true; this.t = 0;
    const w = G.world, S = G.S; const c = G.canvas(w.w * 2, w.h * 2), x = c.x;
    for (let ty = 0; ty < w.h; ty++) for (let tx = 0; tx < w.w; tx++) {
      const i = ty * w.w + tx;
      if (S.explored[i]) { let t = w.tiles[i]; if (w.bmap[i] >= 0) x.fillStyle = '#5a3a1a'; else x.fillStyle = A.miniColor[t]; }
      else x.fillStyle = ((tx + ty) & 1) ? '#c8b088' : '#bea47c';
      x.fillRect(tx * 2, ty * 2, 2, 2);
    }
    this.mini = c;
  }
  update(dt) { this.t += dt; if (this.t > 0.2 && (I.hit('a') || I.hit('b') || I.hit('m') || I.hit('menu') || I.tap())) { G.audio.sfx('sel'); G.ui.pop(); } }
  draw(ctx) {
    const S = G.S, w = G.world, ox = 6, oy = 14;
    G.rect(ctx, 0, 0, G.W, G.H, 'B');
    G.rect(ctx, ox - 3, oy - 3, w.w * 2 + 6, w.h * 2 + 6, 'k'); G.rect(ctx, ox - 2, oy - 2, w.w * 2 + 4, w.h * 2 + 4, 'S');
    ctx.drawImage(this.mini, ox, oy);
    G.text(ctx, '세이지 크릭 일대 지도', ox, 2, 'Y', 's');
    const M = (tx, ty) => [ox + tx * 2 + 1, oy + ty * 2 + 1];
    // 광산
    w.mines.forEach((m, i) => { if (S.explored[m.y * w.w + m.x]) { const [a, b] = M(m.x, m.y); G.rect(ctx, a - 2, b - 2, 5, 5, 'k'); G.rect(ctx, a - 1, b - 1, 3, 3, S.mines[i].known ? 'W' : 'H'); } });
    const cp = w.camp; if (S.explored[cp.y * w.w + cp.x]) { const [a, b] = M(cp.x, cp.y); G.rect(ctx, a - 2, b - 2, 5, 5, 'k'); G.rect(ctx, a - 1, b - 1, 3, 3, 'w'); }
    // 마을
    { const [a, b] = M(G.TOWN.x0, G.TOWN.y0); G.rect(ctx, a, b, (G.TOWN.x1 - G.TOWN.x0) * 2, 2, 'k'); G.text(ctx, '세이지 크릭', a + 12, b - 11, 'k', 's'); }
    // 지도 조각 범위
    const n = G.pieceCount(), L = w.legend;
    if (S.legend.found) { const [a, b] = M(L.x, L.y); G.rect(ctx, a - 3, b - 3, 7, 7, 'k'); G.rect(ctx, a - 2, b - 2, 5, 5, 'Y'); }
    else if (n >= 6) { const [a, b] = M(L.x, L.y); ctx.fillStyle = P_('R'); for (let i = -3; i <= 3; i++) { ctx.fillRect(a + i, b + i, 2, 2); ctx.fillRect(a + i, b - i, 2, 2); } }
    else if (n > 0) {
      const R = [0, 26, 19, 13, 9, 5][n];
      const cx = L.x + S.mapOff.x * R * 0.55, cy = L.y + S.mapOff.y * R * 0.55;
      const [a, b] = M(cx, cy); ctx.fillStyle = P_('R');
      for (let k = 0; k < 64; k += 2) { const an = k / 64 * Math.PI * 2; ctx.fillRect(Math.round(a + Math.cos(an) * R * 2), Math.round(b + Math.sin(an) * R * 2), 2, 2); }
    }
    // 나
    if ((this.t * 3 | 0) % 2 === 0) { const [a, b] = M(S.x / 16, S.y / 16); G.rect(ctx, a - 2, b - 2, 5, 5, 'k'); G.rect(ctx, a - 1, b - 1, 3, 3, 'r'); }
    // 범례
    const lx = ox + w.w * 2 + 10; let ly = 16;
    const row = (col, txt) => { G.rect(ctx, lx, ly + 2, 5, 5, 'k'); G.rect(ctx, lx + 1, ly + 3, 3, 3, col); G.text(ctx, txt, lx + 9, ly, 'm', 's'); ly += 13; };
    row('r', '현재 위치'); row('W', '버려진 광산'); row('w', '탐광자 천막'); row('Y', '하스켈 광산');
    ly += 4; G.text(ctx, `뼈 지도 ${n}/6`, lx, ly, 'Y', 's'); ly += 12;
    S.pieces.forEach((p, i) => ctx.drawImage(p ? A.icon.bone : A.icon.boneOff, lx + (i % 3) * 14, ly + Math.floor(i / 3) * 9));
    ly += 22;
    const note = S.legend.found ? '광산을 찾았다!' : n >= 6 ? '붉은 X 표시가 광산이다!' : n > 0 ? '붉은 원 안 어딘가에 광산이 있다. 산 절벽 아래를 살펴보자.' : '지도 조각을 모으면 광산 위치가 드러난다.';
    G.wrap(note, G.W - lx - 4, 's').forEach(l => { G.text(ctx, l, lx, ly, 'W', 's'); ly += 11; });
    ly += 4; G.text(ctx, `${G.day()}일 ${G.clock()}`, lx, ly, 'w', 's');
    G.text(ctx, I.touchMode ? '탭하면 닫기' : '아무 키나 눌러 닫기', G.W - 6, G.H - 12, 'h', 's', 'right');
  }
}
const P_ = k => G.PAL[k];
G.MapScene = MapScene;

// =============== 타이틀 ===============
class TitleScene {
  constructor() { this.opaque = true; this.cur = 0; this.t = 0; this.rows = []; this.music = false; }
  enter() { this.music = false; this.cur = 0; }
  exit() { G.audio.stopMusic(); }
  items() {
    // 저장된 게임이 있으면 「이어하기」를 맨 위에 두고, 「새 게임」은 설정 안에 숨긴다 (실수 방지)
    if (G.hasSave()) return [
      { label: `이어하기 (${G.saveInfo()})`, act: () => G.loadAndPlay(G.latestSlot()) },
      { label: '불러오기', act: () => G.ui.push(G.slotMenu('load', false)) },
      { label: '설정', act: () => G.ui.push(G.settingsMenu(true)) },
      { label: '조작법 · 도움말', act: () => G.showHelp() }
    ];
    return [
      { label: '새 게임', act: () => G.startNew() },
      { label: '설정', act: () => G.ui.push(G.settingsMenu(false)) },
      { label: '조작법 · 도움말', act: () => G.showHelp() }
    ];
  }
  update(dt) {
    this.t += dt;
    if (!this.music && G.audio.ctx && G.ui.top() === this) { this.music = true; G.audio.music('title'); }
    const it = this.items();
    if (I.hit('up')) { this.cur = (this.cur + it.length - 1) % it.length; G.audio.sfx('sel'); }
    if (I.hit('down')) { this.cur = (this.cur + 1) % it.length; G.audio.sfx('sel'); }
    const go = i => { const x = it[i]; if (x.disabled) return G.audio.sfx('no'); G.audio.sfx('ok'); x.act(); };
    if (I.hit('a')) go(this.cur);
    let t; while ((t = I.tap())) for (const r of this.rows) if (t.y >= r.y && t.y < r.y + r.h && t.x > 100 && t.x < 284) { this.cur = r.i; go(r.i); return; }
  }
  draw(ctx) {
    const sky = ['P', 'q', 'p', 'e', 'o', 'Y'];
    for (let i = 0; i < 6; i++) G.rect(ctx, 0, i * 20, G.W, 20, sky[i]);
    for (let i = 0; i < 5; i++) for (let x = (i % 2) * 2; x < G.W; x += 4) G.rect(ctx, x, i * 20 + 18, 2, 2, sky[i + 1]);
    // 해
    const sy = 104; ctx.fillStyle = P_('Y'); ctx.beginPath(); ctx.arc(192, sy, 34, 0, 7); ctx.fill(); ctx.fillStyle = P_('w'); ctx.beginPath(); ctx.arc(192, sy, 26, 0, 7); ctx.fill();
    for (let i = 0; i < 4; i++) G.rect(ctx, 150, sy - 20 + i * 9, 84, 2, sky[3 + (i % 2)]);
    // 메사
    ctx.fillStyle = P_('R');
    [[0, 96, 80, 24], [60, 88, 50, 32], [250, 92, 70, 28], [310, 84, 74, 36]].forEach(([x, y, w, h]) => { ctx.fillRect(x, y, w, h + 30); ctx.fillRect(x + 6, y - 4, w - 12, 4); });
    G.rect(ctx, 0, 118, G.W, 98, 'n'); G.rect(ctx, 0, 118, G.W, 2, 'B');
    const cac = G.ART.tiles.cactus[0];
    [[30, 100], [330, 96], [360, 104]].forEach(([x, y]) => { ctx.globalAlpha = 1; ctx.drawImage(G.ART.cact || (G.ART.cact = silhouette(cac)), x, y, 32, 32); });
    // 제목
    const big = G.tbmp('사막의 황금', 'm', 'Y'), sh = G.tbmp('사막의 황금', 'm', 'k');
    const s = 3, bx = 192 - big.width * s / 2, by = 22 + Math.sin(this.t * 2) * 2;
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [2, 2]]) ctx.drawImage(sh, bx + dx * s, by + dy * s, sh.width * s, sh.height * s);
    ctx.drawImage(big, bx, by, big.width * s, big.height * s);
    G.px(ctx, 'DESERT GOLD - 1880', 192 - G.pxW('DESERT GOLD - 1880', 2) / 2, 66, 'n', 2);
    const it = this.items(); this.rows = [];
    it.forEach((x, i) => {
      const y = 126 + i * 15, sel = i === this.cur;
      if (sel) { G.rect(ctx, 110, y - 2, 164, 15, 'B'); ctx.drawImage(G.ART.icon.cursor, 116, y + 2); }
      G.text(ctx, x.label, 192, y, x.disabled ? 'h' : sel ? 'Y' : 'm', 'm', 'center');
      this.rows.push({ y: y - 1, h: 15, i });
    });
    if (G.titleMsg) { G.text(ctx, G.titleMsg, 192, G.H - 13, 'Y', 's', 'center'); if (this.t > 5) G.titleMsg = null; }
    else G.text(ctx, '서부 생존 어드벤처', 6, G.H - 12, 'S', 's');
    if (!G.titleMsg) G.text(ctx, 'v1.1', G.W - 6, G.H - 12, 'S', 's', 'right');
  }
}
function silhouette(src) { const c = G.canvas(16, 16); c.x.drawImage(src, 0, 0); c.x.globalCompositeOperation = 'source-in'; c.x.fillStyle = '#2a1010'; c.x.fillRect(0, 0, 16, 16); const o = G.canvas(16, 16); o.x.drawImage(G.spr(['.......kk.......', '......kgGk......', '......klGk......', '..kk..klGk.kk...', '.kgGk.klGk.klGk.', '.klGk.klGkkklGk.', '.klGkkklGGgglGk.', '.klGgggGlGGGGk..', '..kGGGGlGk......', '......klGk......', '......klGk......', '......klGk......', '......kgGk......', '......kkkk......', '................', '................'], { k: '#2a1010', g: '#2a1010', G: '#2a1010', l: '#2a1010' }), 0, 0); return o; }
G.TitleScene = TitleScene;

G.startNew = function () {
  G.newGame();
  G.ui.reset(new WorldScene());
  G.say([
    '1880년, 애리조나 준주의 작은 광산 마을 「세이지 크릭」.',
    '전설에 따르면 늙은 광부 제드 하스켈은 동쪽 「붉은 바위 산맥」 어딘가에서 엄청난 금맥을 찾았다. 하지만 그는 위치를 아무에게도 알리지 않고 죽었다.',
    '그가 남긴 지도는 뼈다귀 모양의 가죽 여섯 조각으로 찢겨 흩어졌다고 한다. 살롱의 도박판, 버려진 광산, 사막의 누군가가 그 조각을 갖고 있다.',
    '당신의 주머니엔 단돈 $120. 잡화점에서 장비를 사고, 우물에서 물을 채우고, 사막으로 나가라.',
    '목표: 하스켈의 광산을 찾아 시금소에 소유권을 등록하고, 은행에 $10,000를 모아라.\n사막은 무자비하다. 물과 식량, 뱀과 강도를 조심하라.'
  ], () => G.toast(I.touchMode ? '오른쪽 위 「메뉴」: 저장·나가기·소리' : 'ESC: 메뉴 · X/I: 가방 · M: 지도 · F: 사격', 'Y'));
};
G.showHelp = function () {
  G.say([
    '【조작법 — 컴퓨터】\n이동: 방향키 / WASD   행동·확인: 스페이스 / 엔터 / Z\n메뉴(저장·나가기·소리): ESC / P 또는 오른쪽 위 「메뉴」 클릭\n가방·뒤로: X / I / B   사격: F / C   지도: M   재장전: R',
    '【조작법 — 모바일】\n화면은 항상 가로로 표시된다. 왼쪽 조이스틱으로 이동, 오른쪽 버튼(행동·가방·사격)을 누른다. 오른쪽 위 「메뉴」에서 저장·나가기·소리 조절. 메뉴 항목은 직접 탭해도 된다.',
    '【생존】\n물은 시간이 지날수록 줄고, 더울수록 빨리 준다(화씨 100도 이상 주의). 물이나 식량이 바닥나면 체력이 줄어든다. 우물과 강에서 물을 채울 수 있다.',
    '【돈 벌기】\n살롱 포커, 강가 사금 채취(팬), 광산 채굴(곡괭이), 강도 현상금. 금 원석은 시금소에서 판다. 강도에게 털리지 않게 은행에 맡기자.',
    '【위험】\n방울뱀에 물리면 독 — 해독제나 의사 치료가 없으면 죽는다. 강도는 리볼버로 맞서거나, 도망치거나, 돈을 내준다. 광산은 무너질 수 있다.',
    '【지도 조각】\n6개의 뼈 지도 조각: 포커(2), 버려진 광산 깊은 곳(2, 랜턴 필요), 늙은 탐광자(1), 검은 모자 갱단 두목(1). 조각이 많을수록 지도의 붉은 원이 좁아진다.',
    '【저장】\n「메뉴」에서 슬롯 3개 중 하나에 언제든 저장하거나, 「저장하고 나가기」로 저장 후 타이틀로 나갈 수 있다. 호텔에서 잘 때와 건물에 들어갈 때도 자동 저장된다. 죽으면 마지막 저장에서 다시 시작한다.\n마을 건물은 대부분 08~18시 영업.'
  ]);
};

// =============== 게임 오버 ===============
class GameOverScene {
  constructor(cause) { this.opaque = true; this.cause = cause; this.cur = 0; this.t = 0; this.rows = []; G.audio.stopMusic(); G.audio.sfx('lose'); this.day = G.S ? G.day() : 1; this.st = G.S ? G.S.stats : { oz: 0, earned: 0 }; }
  items() {
    return [
      { label: '마지막 저장에서 다시', disabled: !G.hasSave(), act: () => G.loadAndPlay(G.latestSlot()) },
      { label: '불러오기', disabled: !G.hasSave(), act: () => G.ui.push(G.slotMenu('load', false)) },
      { label: '새 게임', act: () => G.startNew() },
      { label: '타이틀로', act: () => G.ui.reset(new TitleScene()) }
    ];
  }
  update(dt) {
    this.t += dt; if (this.t < 1) { I.taps.length = 0; return; }
    const it = this.items();
    if (I.hit('up')) this.cur = (this.cur + it.length - 1) % it.length;
    if (I.hit('down')) this.cur = (this.cur + 1) % it.length;
    const go = i => { if (it[i].disabled) return G.audio.sfx('no'); G.audio.sfx('ok'); it[i].act(); };
    if (I.hit('a')) go(this.cur);
    let t; while ((t = I.tap())) for (const r of this.rows) if (t.y >= r.y && t.y < r.y + r.h) { this.cur = r.i; go(r.i); return; }
  }
  draw(ctx) {
    G.rect(ctx, 0, 0, G.W, G.H, 'k');
    for (let i = 0; i < 5; i++) G.rect(ctx, 0, i * 12, G.W, 12, ['R', 'E', 'R', 'K', 'k'][i]);
    G.rect(ctx, 0, 60, G.W, 156, 'n');
    ctx.drawImage(G.scaleUp(G.ART.tiles.bones, 3), 168, 34);
    G.text(ctx, '게임 오버', 192, 86, 'r', 'm', 'center');
    G.text(ctx, `사인: ${this.cause}`, 192, 104, 'w', 'm', 'center');
    G.text(ctx, `${this.day}일 동안 버텼다 · 캐낸 금 ${this.st.oz.toFixed(1)}oz · 번 돈 $${G.money(this.st.earned)}`, 192, 120, 'W', 's', 'center');
    const it = this.items(); this.rows = [];
    it.forEach((x, i) => {
      const y = 144 + i * 17, sel = i === this.cur;
      if (sel) G.rect(ctx, 110, y - 2, 164, 15, 'B');
      G.text(ctx, x.label, 192, y, x.disabled ? 'h' : sel ? 'Y' : 'm', 'm', 'center');
      this.rows.push({ y: y - 3, h: 17, i });
    });
  }
}
G.GameOverScene = GameOverScene;

// =============== 승리 ===============
class VictoryScene {
  constructor() { this.opaque = true; this.t = 0; this.cur = 0; this.rows = []; G.audio.sfx('piece'); setTimeout(() => G.audio.music('win'), 900); }
  exit() { G.audio.stopMusic(); }
  update(dt) {
    this.t += dt; if (this.t < 1.5) { I.taps.length = 0; return; }
    const go = i => { G.audio.sfx('ok'); if (i === 0) G.ui.pop(); else G.ui.reset(new TitleScene()); };
    if (I.hit('up') || I.hit('down')) this.cur ^= 1;
    if (I.hit('a')) go(this.cur);
    let t; while ((t = I.tap())) for (const r of this.rows) if (t.y >= r.y && t.y < r.y + r.h) return go(r.i);
  }
  draw(ctx) {
    const S = G.S;
    const sky = ['U', 'u', 'v', 'y', 'Y'];
    for (let i = 0; i < 5; i++) G.rect(ctx, 0, i * 18, G.W, 18, sky[i]);
    G.rect(ctx, 0, 90, G.W, 126, 's');
    for (let i = 0; i < 40; i++) { const x = (i * 97 + this.t * 60 * (1 + i % 3)) % G.W, y = (i * 53 + this.t * 40) % 90; G.rect(ctx, x, y, 2, 2, ['Y', 'w', 'r', 'g'][i % 4]); }
    ctx.drawImage(G.scaleUp(G.ART.item.ore, 4), 30, 96); ctx.drawImage(G.scaleUp(G.ART.item.ore, 4), 306, 96);
    ctx.drawImage(G.scaleUp(G.ART.player.down[0], 4), 160, 30);
    G.text(ctx, '당신은 큰 부자가 되었다!', 192, 102, 'n', 'm', 'center');
    const lines = [`하스켈의 광산을 손에 넣고 은행에 $${G.money(S.bank)}를 모았다.`, `걸린 날: ${G.day()}일 · 캐낸 금: ${S.stats.oz.toFixed(1)}oz · 처치한 강도: ${S.kills}명`, '세이지 크릭 사람들은 오래도록 당신의 이름을 이야기할 것이다.'];
    lines.forEach((l, i) => G.text(ctx, l, 192, 120 + i * 12, 'n', 's', 'center'));
    const it = ['계속 플레이하기', '타이틀로']; this.rows = [];
    it.forEach((x, i) => { const y = 166 + i * 17, sel = i === this.cur; if (sel) G.rect(ctx, 110, y - 2, 164, 15, 'B'); G.text(ctx, x, 192, y, sel ? 'Y' : 'n', 'm', 'center'); this.rows.push({ y: y - 3, h: 17, i }); });
  }
}
G.VictoryScene = VictoryScene;
})();
