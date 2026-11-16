'use strict';
// ===== 총격전 (노상강도) =====
(function () {
const A = G.ART, I = G.input;
const COVERS = [
  { x: 52, y: 168, k: 'rock' }, { x: 122, y: 140, k: 'cactus' }, { x: 192, y: 156, k: 'wagon' },
  { x: 264, y: 140, k: 'barrel' }, { x: 334, y: 168, k: 'rock' }
];

class DuelScene {
  constructor(n, gang, onEnd) {
    this.opaque = true; this.onEnd = onEnd; this.gang = gang;
    this.bandits = [];
    for (let i = 0; i < n; i++) {
      const chief = gang && i === n - 1;
      this.bandits.push({ alive: true, chief, cover: -1, st: 'hidden', t: 0.8 + Math.random() * 1.6 + i * 0.4, rise: 0, fall: 0,
        spr: G.scaleUp((chief ? A.chief : A.bandit).down[0], 2) });
    }
    this.cx = 192; this.cy = 120; this.cyl = Math.min(6, G.S.bullets); this.reload = 0;
    this.flash = 0; this.hurtT = 0; this.endT = -1; this.result = null; this.fleeCd = 0; this.t = 0; this.msg = '';
    this.kills = 0;
  }
  vis() { return this.bandits.filter(b => b.alive && b.st !== 'hidden'); }
  fire() {
    const S = G.S;
    if (this.reload > 0) return;
    if (this.cyl <= 0) { G.audio.sfx('click'); return; }
    this.cyl--; S.bullets--; this.flash = 0.08; G.audio.sfx('shot');
    for (const b of this.bandits) {
      if (!b.alive || b.st === 'hidden' || b.cover < 0) continue;
      const c = COVERS[b.cover]; const ct = c.y - A.covers[c.k].height + 6;
      if (b.rise > 8 && this.cx >= c.x - 12 && this.cx <= c.x + 12 && this.cy >= ct - b.rise && this.cy <= ct) {
        b.alive = false; b.fall = 0.6; b.st = 'dead'; this.kills++; G.audio.sfx('hurt');
        this.msg = b.chief ? '두목을 쓰러뜨렸다!' : '명중!';
        break;
      }
    }
    if (this.cyl <= 0 && S.bullets > 0) { this.reload = 1.4; }
  }
  end(res) { if (this.endT < 0) { this.result = res; this.endT = res === 'win' ? 1.2 : 0.6; } }
  update(dt) {
    const S = G.S; this.t += dt;
    this.flash -= dt; this.hurtT -= dt; this.fleeCd -= dt;
    if (this.endT >= 0) { this.endT -= dt; if (this.endT < 0) { G.ui.remove(this); this.onEnd(this.result, this.kills); } return; }
    if (G.pendingDeath) return;
    // 조준
    const d = I.dir(); this.cx += d.x * 190 * dt; this.cy += d.y * 190 * dt;
    if (I.mouse.moved) { this.cx = I.mouse.x; this.cy = I.mouse.y; I.mouse.moved = false; }
    this.cx = G.clamp(this.cx, 4, G.W - 4); this.cy = G.clamp(this.cy, 20, G.H - 24);
    let t; while ((t = I.tap())) {
      if (t.y > G.H - 22 && t.x > G.W - 90) { this.tryFlee(); continue; }
      if (t.y > G.H - 22 && t.x < 90) { this.manualReload(); continue; }
      this.cx = t.x; this.cy = t.y; this.fire();
    }
    if (I.hit('a') || I.hit('c')) this.fire();
    if (I.hit('r')) this.manualReload();
    if (I.hit('b')) this.tryFlee();
    if (this.reload > 0) { this.reload -= dt; if (this.reload <= 0) { this.cyl = Math.min(6, S.bullets); G.audio.sfx('click'); } }
    // 강도들
    const busy = new Set(this.bandits.filter(b => b.alive && b.cover >= 0 && b.st !== 'hidden').map(b => b.cover));
    for (const b of this.bandits) {
      if (!b.alive) { if (b.fall > 0) b.fall -= dt; continue; }
      b.t -= dt;
      if (b.st === 'hidden' && b.t <= 0) {
        if (this.vis().length >= (this.gang ? 2 : 2)) { b.t = 0.4; continue; }
        const free = COVERS.map((c, i) => i).filter(i => !busy.has(i));
        b.cover = G.pick(Math.random, free); busy.add(b.cover); b.st = 'rise'; b.t = 0.18;
      } else if (b.st === 'rise') { b.rise = Math.min(30, b.rise + dt * 170); if (b.t <= 0) { b.st = 'aim'; b.t = (b.chief ? 0.75 : this.gang ? 0.95 : 1.15) * G.rnd(0.85, 1.2); } }
      else if (b.st === 'aim' && b.t <= 0) {
        b.st = 'fire'; b.t = 0.15; G.audio.sfx('shot');
        if (Math.random() < (b.chief ? 0.7 : 0.6)) { const dmg = b.chief ? G.rint(10, 16) : G.rint(6, 12); G.hurt(dmg, '강도의 총탄'); this.hurtT = 0.25; this.msg = `총에 맞았다! -${dmg}`; G.audio.sfx('hurt'); }
        else { G.audio.sfx('ric'); this.msg = '총알이 귓가를 스쳤다!'; }
      } else if (b.st === 'fire' && b.t <= 0) { b.st = 'duck'; b.t = 0.2; }
      else if (b.st === 'duck') { b.rise = Math.max(0, b.rise - dt * 170); if (b.t <= 0) { b.st = 'hidden'; b.rise = 0; b.cover = -1; b.t = 0.7 + Math.random() * 1.6; } }
    }
    if (this.bandits.every(b => !b.alive)) this.end('win');
    else if (S.bullets <= 0 && this.cyl <= 0 && this.reload <= 0) this.end('nobullet');
  }
  manualReload() { const S = G.S; if (this.reload <= 0 && this.cyl < 6 && S.bullets > this.cyl) { this.reload = 1.4; G.audio.sfx('click'); } }
  tryFlee() {
    if (this.fleeCd > 0) return;
    this.fleeCd = 2.5;
    if (Math.random() < (G.S.inv.horse ? 0.6 : 0.3)) { this.msg = '도망쳤다!'; this.end('fled'); }
    else { this.msg = '도망칠 틈이 없다!'; G.audio.sfx('no'); }
  }
  draw(ctx) {
    const S = G.S;
    ctx.drawImage(A.duelBg, 0, 0);
    COVERS.forEach((c, i) => {
      const cv = A.covers[c.k], ct = c.y - cv.height + 6;
      for (const b of this.bandits) {
        if (b.cover !== i) continue;
        if (!b.alive && b.fall <= 0) continue;
        ctx.save(); ctx.beginPath(); ctx.rect(c.x - 24, 0, 48, ct); ctx.clip();
        const yy = ct - b.rise + (b.alive ? 0 : (0.6 - b.fall) * 50);
        ctx.drawImage(b.spr, c.x - 16, yy);
        if (b.st === 'aim' && (this.t * 8 | 0) % 2) G.rect(ctx, c.x + 10, yy + 22, 2, 2, 'w');
        if (b.st === 'fire') { G.rect(ctx, c.x + 8, yy + 18, 8, 6, 'Y'); G.rect(ctx, c.x + 10, yy + 19, 4, 4, 'w'); }
        ctx.restore();
      }
      ctx.drawImage(cv, c.x - cv.width / 2, c.y - cv.height);
    });
    if (this.flash > 0) { ctx.globalAlpha = 0.25; G.rect(ctx, 0, 0, G.W, G.H, 'w'); ctx.globalAlpha = 1; }
    if (this.hurtT > 0) { ctx.globalAlpha = 0.35; G.rect(ctx, 0, 0, G.W, G.H, 'r'); ctx.globalAlpha = 1; }
    ctx.drawImage(A.crosshair, Math.round(this.cx) - 4, Math.round(this.cy) - 4);
    // 정보
    G.rect(ctx, 0, 0, G.W, 16, 'k');
    G.text(ctx, this.gang ? '검은 모자 갱단!' : '노상강도!', 6, 2, 'r', 'm');
    G.text(ctx, `남은 적 ${this.bandits.filter(b => b.alive).length}`, 120, 3, 'w', 's');
    ctx.drawImage(A.icon.heart, 190, 5); G.rect(ctx, 200, 5, 42, 7, 'K'); G.rect(ctx, 201, 6, Math.ceil(40 * S.health / 100), 5, S.health > 60 ? 'g' : S.health > 30 ? 'Y' : 'r');
    for (let i = 0; i < 6; i++) G.rect(ctx, 252 + i * 6, 5, 4, 7, i < this.cyl ? 'Y' : 'H');
    G.text(ctx, `/${S.bullets}`, 290, 3, 'w', 's');
    if (this.reload > 0) G.text(ctx, '재장전…', 330, 3, 'o', 's');
    G.rect(ctx, 0, G.H - 20, G.W, 20, 'k');
    G.rect(ctx, 2, G.H - 18, 84, 16, 'B'); G.text(ctx, '재장전 (R)', 44, G.H - 15, 'w', 's', 'center');
    G.rect(ctx, G.W - 86, G.H - 18, 84, 16, 'B'); G.text(ctx, '도망 (B)', G.W - 44, G.H - 15, 'w', 's', 'center');
    G.text(ctx, this.msg || (I.touchMode ? '적을 직접 탭해서 쏘세요' : '마우스/방향키로 조준, 클릭/스페이스로 사격'), 192, G.H - 15, 'Y', 's', 'center');
  }
}
G.DuelScene = DuelScene;
})();
