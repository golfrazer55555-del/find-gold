'use strict';
// ===== UI: 장면 스택, 메뉴, 대화상자, 상태바 =====
(function () {
const P = G.PAL, I = G.input;

G.ui = {
  stack: [],
  push(s) { this.stack.push(s); if (s.enter) s.enter(); },
  pop() { const s = this.stack.pop(); if (s && s.exit) s.exit(); const t = this.top(); if (t && t.resume) t.resume(); return s; },
  top() { return this.stack[this.stack.length - 1]; },
  reset(s) { for (const o of this.stack) if (o.exit) o.exit(); this.stack = []; this.push(s); },
  remove(s) { const i = this.stack.indexOf(s); if (i >= 0) { this.stack.splice(i, 1); if (s.exit) s.exit(); } },
  update(dt) { const t = this.top(); if (t) t.update(dt); },
  draw(ctx) {
    let i = this.stack.length - 1; while (i > 0 && !this.stack[i].opaque) i--;
    for (; i < this.stack.length; i++) this.stack[i].draw(ctx);
  }
};

// ---- 알림 (월드 화면) ----
G.toasts = [];
G.toast = (msg, col = 'w') => { G.toasts.push({ msg, col, t: 4 }); if (G.toasts.length > 3) G.toasts.shift(); };
G.updateToasts = dt => { for (const t of G.toasts) t.t -= dt; G.toasts = G.toasts.filter(t => t.t > 0); };
G.drawToasts = function (ctx, baseY) {
  let y = baseY;
  for (let i = G.toasts.length - 1; i >= 0; i--) {
    const t = G.toasts[i]; const w = G.tw(t.msg, 's') + 10;
    ctx.globalAlpha = Math.min(1, t.t * 2) * 0.85; G.rect(ctx, 192 - w / 2, y - 1, w, 13, 'k'); ctx.globalAlpha = Math.min(1, t.t * 2);
    G.text(ctx, t.msg, 192, y + 1, t.col, 's', 'center'); ctx.globalAlpha = 1; y -= 14;
  }
};

// ---- 상태바 ----
G.drawHUD = function (ctx) {
  const S = G.S; if (!S) return;
  G.rect(ctx, 0, 0, G.W, 17, 'n'); G.rect(ctx, 0, 17, G.W, 1, 'k'); G.rect(ctx, 0, 16, G.W, 1, 'B');
  const A = G.ART.icon; const h = G.hour(); const blink = (Date.now() / 400 | 0) % 2;
  let x = 4;
  ctx.drawImage(h >= 6 && h < 19 ? A.sun : A.moon, x, 5); x += 8;
  x += G.text(ctx, `${G.day()}일 ${G.clock()}`, x, 3, 'w', 's') + 7;
  const tp = G.temp(); ctx.drawImage(A.therm, x, 4); x += 5;
  x += G.text(ctx, `${tp}°F`, x, 3, tp >= 105 ? 'r' : tp >= 95 ? 'o' : 'w', 's') + 7;
  x += G.text(ctx, '$' + G.money(S.cash), x, 3, 'Y', 's') + 7;
  ctx.drawImage(A.heart, x, 5); x += 9;
  const hc = S.poisoned ? 'p' : S.health > 60 ? 'g' : S.health > 30 ? 'Y' : 'r';
  G.rect(ctx, x, 5, 32, 7, 'k'); G.rect(ctx, x + 1, 6, 30, 5, 'K');
  if (!(S.health <= 30 && blink)) G.rect(ctx, x + 1, 6, Math.ceil(30 * S.health / 100), 5, hc);
  x += 34;
  if (S.poisoned) { if (blink) ctx.drawImage(A.skull, x, 5); x += 8; }
  x += 3;
  ctx.drawImage(A.food, x, 5); x += 9;
  x += G.text(ctx, String(Math.floor(S.food)), x, 3, S.food <= 3 ? 'r' : 'w', 's') + 6;
  ctx.drawImage(A.drop, x, 5); x += 8;
  const low = S.water < G.waterCap() * 0.25;
  x += G.text(ctx, `${Math.floor(S.water)}/${G.waterCap()}`, x, 3, low ? (blink ? 'r' : 'o') : 'v', 's') + 6;
  if (S.inv.revolver) { ctx.drawImage(A.bullet, x, 5); x += 6; x += G.text(ctx, String(S.bullets), x, 3, 'w', 's') + 6; }
  if (S.ore > 0) { ctx.drawImage(A.nugget, x, 5); x += 9; x += G.text(ctx, S.ore.toFixed(1), x, 3, 'Y', 's') + 4; }
};

// ---- 메뉴 장면 ----
class Menu {
  constructor(o) {
    Object.assign(this, { title: '', art: null, text: '', items: [], onBack: null, hud: true, opaque: true, info: null, maxText: 3 }, o);
    this.cur = 0; this.scroll = 0; this.flashT = 0; this.rows = [];
  }
  getItems() { return typeof this.items === 'function' ? this.items() : this.items; }
  flash(msg, col = 'Y') { this.flashMsg = msg; this.flashCol = col; this.flashT = 3.2; }
  back() { G.audio.sfx('sel'); if (this.onBack) this.onBack(); else G.ui.pop(); }
  activate(it) {
    if (!it) return;
    if (it.disabled) { G.audio.sfx('no'); if (it.why) this.flash(it.why, 'r'); return; }
    G.audio.sfx('sel'); it.act && it.act(this);
  }
  update(dt) {
    this.flashT -= dt;
    const items = this.getItems(); if (!items.length) { if (I.hit('b') || I.hit('a')) this.back(); return; }
    if (this.cur >= items.length) this.cur = items.length - 1;
    if (I.hit('up')) { this.cur = (this.cur + items.length - 1) % items.length; G.audio.sfx('sel'); }
    if (I.hit('down')) { this.cur = (this.cur + 1) % items.length; G.audio.sfx('sel'); }
    if (I.hit('a')) this.activate(items[this.cur]);
    else if (I.hit('b')) this.back();
    let t; while ((t = I.tap())) {
      for (const r of this.rows) if (t.x >= r.x && t.x < r.x + r.w && t.y >= r.y && t.y < r.y + r.h) {
        this.cur = r.i; this.activate(items[r.i]); return;
      }
      if (this.upBtn && t.y >= this.upBtn.y && t.y < this.upBtn.y + 10 && t.x > 340) { this.cur = Math.max(0, this.scroll - 1); }
    }
  }
  draw(ctx) {
    const top = this.hud ? 18 : 0;
    G.rect(ctx, 0, 0, G.W, G.H, 'k');
    let py = top;
    if (this.art) {
      const art = typeof this.art === 'function' ? null : this.art;
      if (art) ctx.drawImage(art, 0, top); else this.art(ctx, 0, top, G.W, 88);
      py = top + 88;
    }
    G.box(ctx, 0, py, G.W, G.H - py);
    G.text(ctx, this.title, 10, py + 6, 'Y', 'm');
    if (this.info) G.text(ctx, typeof this.info === 'function' ? this.info() : this.info, G.W - 10, py + 7, 'W', 's', 'right');
    let ty = py + 21;
    const txt = this.flashT > 0 ? this.flashMsg : (typeof this.text === 'function' ? this.text() : this.text);
    const col = this.flashT > 0 ? this.flashCol : 'W';
    let lines = txt ? G.wrap(txt, G.W - 22, 's') : [];
    const maxL = this.art ? this.maxText : 9;
    if (lines.length > maxL) lines = lines.slice(0, maxL);
    for (const l of lines) { G.text(ctx, l, 10, ty, col, 's'); ty += 11; }
    if (this.flashT > 0) {
      const base = typeof this.text === 'function' ? this.text() : this.text;
      const n = base ? Math.min(maxL, G.wrap(base, G.W - 22, 's').length) : 0;
      ty = py + 21 + Math.max(n, lines.length) * 11;
    }
    ty += 3;
    const items = this.getItems();
    const vis = Math.max(1, Math.floor((G.H - 5 - ty) / 13));
    if (this.cur < this.scroll) this.scroll = this.cur;
    if (this.cur >= this.scroll + vis) this.scroll = this.cur - vis + 1;
    this.scroll = G.clamp(this.scroll, 0, Math.max(0, items.length - vis));
    this.rows = [];
    for (let k = 0; k < vis && this.scroll + k < items.length; k++) {
      const i = this.scroll + k, it = items[i], y = ty + k * 13;
      const sel = i === this.cur;
      if (sel) G.rect(ctx, 5, y - 1, G.W - 10, 13, 'B');
      if (sel) ctx.drawImage(G.ART.icon.cursor, 9, y + 2);
      const c = it.disabled ? 'h' : sel ? 'w' : 'm';
      G.text(ctx, it.label, 18, y, c, 'm');
      if (it.right) G.text(ctx, it.right, G.W - 12, y + 1, it.disabled ? 'h' : (it.rcol || 'Y'), 's', 'right');
      this.rows.push({ x: 0, y: y - 1, w: G.W, h: 13, i });
    }
    if (this.scroll > 0) G.text(ctx, '▲', G.W - 12, ty - 12, 'Y', 's', 'right');
    if (this.scroll + vis < items.length) G.text(ctx, '▼', G.W - 12, G.H - 12, 'Y', 's', 'right');
    if (this.hud) G.drawHUD(ctx);
  }
}
G.Menu = Menu;

// ---- 대화 상자 ----
class Dialog {
  constructor(o) {
    Object.assign(this, { pages: [], choices: null, portrait: null, onDone: null, opaque: false, title: null }, o);
    if (typeof this.pages === 'string') this.pages = [this.pages];
    const tw = this.portrait ? 316 : 356;
    this.chunks = [];
    const maxL = this.choices ? 9 : 6;
    for (const p of this.pages) {
      const ls = G.wrap(p, tw, 'm');
      for (let i = 0; i < ls.length; i += maxL) this.chunks.push(ls.slice(i, i + maxL));
    }
    if (!this.chunks.length) this.chunks.push(['']);
    this.page = 0; this.cur = 0; this.t = 0; this.rows = [];
    if (this.choices) this.cur = Math.max(0, this.choices.findIndex(c => !c.disabled));
  }
  last() { return this.page >= this.chunks.length - 1; }
  choose(i) {
    const c = this.choices[i]; if (!c) return;
    if (c.disabled) { G.audio.sfx('no'); return; }
    G.audio.sfx('ok'); G.ui.remove(this); c.act && c.act();
  }
  next() {
    G.audio.sfx('sel');
    if (!this.last()) { this.page++; this.t = 0; return; }
    G.ui.remove(this); this.onDone && this.onDone();
  }
  update(dt) {
    this.t += dt;
    if (this.t < 0.15) { I.taps.length = 0; I.pressed.delete('a'); return; }
    const ch = this.last() && this.choices;
    if (ch) {
      if (I.hit('up')) { this.cur = (this.cur + ch.length - 1) % ch.length; G.audio.sfx('sel'); }
      if (I.hit('down')) { this.cur = (this.cur + 1) % ch.length; G.audio.sfx('sel'); }
      if (I.hit('a')) return this.choose(this.cur);
      let t; while ((t = I.tap())) for (const r of this.rows) if (t.y >= r.y && t.y < r.y + r.h && t.x >= r.x && t.x < r.x + r.w) return this.choose(r.i);
    } else {
      if (I.hit('a') || I.hit('b') || I.tap()) this.next();
    }
  }
  draw(ctx) {
    const lines = this.chunks[this.page];
    const ch = this.last() && this.choices ? this.choices : [];
    const hh = 12 + (this.title ? 14 : 0) + lines.length * 13 + (ch.length ? ch.length * 14 + 4 : 0) + (ch.length ? 0 : 6);
    const h = Math.max(this.portrait ? 50 : 30, hh);
    const x = 6, y = G.H - 4 - h, w = G.W - 12;
    G.box(ctx, x, y, w, h);
    let tx = x + 10, ty = y + 7;
    if (this.portrait) { G.rect(ctx, x + 6, y + 6, 36, 36, 'k'); G.rect(ctx, x + 7, y + 7, 34, 34, 'S'); ctx.drawImage(this.portrait, x + 8, y + 8, 32, 32); tx = x + 50; }
    if (this.title) { G.text(ctx, this.title, tx, ty, 'Y', 'm'); ty += 14; }
    for (const l of lines) { G.text(ctx, l, tx, ty, 'w', 'm'); ty += 13; }
    this.rows = [];
    if (ch.length) {
      ty += 3;
      ch.forEach((c, i) => {
        const sel = i === this.cur;
        if (sel) G.rect(ctx, tx - 4, ty - 1, w - (tx - x) - 4, 13, 'B');
        if (sel) ctx.drawImage(G.ART.icon.cursor, tx - 2, ty + 2);
        G.text(ctx, c.label, tx + 8, ty, c.disabled ? 'h' : sel ? 'Y' : 'm', 'm');
        this.rows.push({ x: x, y: ty - 2, w: w, h: 14, i });
        ty += 14;
      });
    } else if ((this.t * 2 | 0) % 2) G.text(ctx, '▼', x + w - 12, y + h - 13, 'Y', 's');
  }
}
G.Dialog = Dialog;
G.say = (pages, onDone, o = {}) => G.ui.push(new Dialog(Object.assign({ pages, onDone }, o)));
G.ask = (text, choices, o = {}) => G.ui.push(new Dialog(Object.assign({ pages: [text], choices }, o)));
G.portrait = spr => spr; // 16x16 스프라이트를 2배로 그림
})();
