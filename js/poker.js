'use strict';
// ===== 살롱 포커 (5장 드로우, 리밋 베팅) =====
(function () {
const A = G.ART, I = G.input;
const CAT = ['하이 카드', '원 페어', '투 페어', '트리플', '스트레이트', '플러시', '풀 하우스', '포카드', '스트레이트 플러시'];
const NAMES = ['외눈 잭', '도박꾼 루이', '카드꾼 몰리', '목장주 빌', '떠돌이 행크', '신사 모리스', '은발의 케이트', '노름꾼 피트'];
const LOOKS = [{ b: 'K', B: 'k', r: 'R', u: 'K' }, { b: 'w', B: 'K', r: 'u', u: 'H' }, { b: 'p', B: 'P', r: 'p', u: 'q' }, { b: 'S', B: 'B', r: 'g', u: 'b' }, { b: 'h', B: 'H', r: 'o', u: 'B' }, { b: 'k', B: 'R', r: 'w', u: 'k' }];

G.evalHand = function (cards) {
  const rs = cards.map(c => c.r).sort((a, b) => b - a);
  const cnt = {}; rs.forEach(r => (cnt[r] = (cnt[r] || 0) + 1));
  const g = Object.entries(cnt).map(([r, c]) => [c, +r]).sort((a, b) => b[0] - a[0] || b[1] - a[1]);
  const flush = cards.every(c => c.s === cards[0].s);
  let sh = 0;
  if (g.length === 5) { if (rs[0] - rs[4] === 4) sh = rs[0]; else if (rs.join() === '14,5,4,3,2') sh = 5; }
  if (sh && flush) return [8, sh];
  if (g[0][0] === 4) return [7, g[0][1], g[1][1]];
  if (g[0][0] === 3 && g[1][0] === 2) return [6, g[0][1], g[1][1]];
  if (flush) return [5, ...rs];
  if (sh) return [4, sh];
  if (g[0][0] === 3) return [3, g[0][1], ...g.slice(1).map(x => x[1])];
  if (g[0][0] === 2 && g[1][0] === 2) return [2, g[0][1], g[1][1], g[2][1]];
  if (g[0][0] === 2) return [1, g[0][1], ...g.slice(1).map(x => x[1])];
  return [0, ...rs];
};
const cmp = (a, b) => { for (let i = 0; i < Math.max(a.length, b.length); i++) { const d = (a[i] || 0) - (b[i] || 0); if (d) return d; } return 0; };
function drawInfo(hand) {
  const suits = [0, 0, 0, 0]; hand.forEach(c => suits[c.s]++);
  const fs = suits.findIndex(n => n === 4);
  const u = [...new Set(hand.map(c => c.r))].sort((a, b) => a - b);
  let straight = null;
  for (let i = 0; i + 3 < u.length; i++) if (u[i + 3] - u[i] === 3) straight = u.slice(i, i + 4);
  return { fs, straight };
}
function aiDiscard(hand) {
  const e = G.evalHand(hand), cat = e[0];
  if (cat >= 4) return [];
  const cnt = {}; hand.forEach(c => (cnt[c.r] = (cnt[c.r] || 0) + 1));
  if (cat >= 1) return hand.map((c, i) => (cnt[c.r] >= 2 ? -1 : i)).filter(i => i >= 0).slice(0, 3);
  const d = drawInfo(hand);
  if (d.fs >= 0) return hand.map((c, i) => (c.s !== d.fs ? i : -1)).filter(i => i >= 0);
  if (d.straight) { const keep = new Set(d.straight); const out = []; hand.forEach((c, i) => { if (keep.has(c.r)) keep.delete(c.r); else out.push(i); }); return out.slice(0, 1); }
  const idx = hand.map((c, i) => i).sort((a, b) => hand[a].r - hand[b].r);
  return idx.slice(0, 3);
}

class PokerScene {
  constructor(ante) {
    this.opaque = true; this.ante = ante; this.need = ante * 25;
    const S = G.S;
    const me = { name: '나', isAI: false, hand: [], folded: false, bet: 0, act: '' };
    Object.defineProperty(me, 'stack', { get: () => S.cash, set: v => { S.cash = v; } });
    this.seats = [me]; this.seats.push(this.newOpp()); this.seats.push(this.newOpp());
    this.phase = 'idle'; this.pot = 0; this.msg = '판돈 $' + ante + ' 테이블에 앉았다.'; this.btn = 0; this.sel = new Set(); this.cur = 0;
    this.aiT = 0; this.buttons = []; this.btnRects = []; this.winners = [];
    this.startHand();
  }
  newOpp() {
    const S = G.S;
    const pokerLeft = !S.pieces[0] || !S.pieces[1];
    const has = this.seats && this.seats.some(s => s && s.piece);
    const piece = pokerLeft && !has && Math.random() < 0.55;
    const name = piece ? '늙은 광부 에드' : G.pick(Math.random, NAMES.filter(n => !(this.seats || []).some(s => s && s.name === n)));
    const look = piece ? { b: 'h', B: 'H', r: 'b', u: 'B' } : G.pick(Math.random, LOOKS);
    const ch = A.makeChar(look, piece ? { 8: '....kWWWWWWk....', 9: '.....kWWWWk.....' } : null);
    return { name, isAI: true, piece, agg: G.rnd(0.8, 1.3), stack: Math.round(this.ante * G.rnd(32, 70)), hand: [], folded: false, bet: 0, act: '', face: ch.down[0] };
  }
  active() { return this.seats.filter(s => !s.folded); }
  startHand() {
    const S = G.S;
    if (S.cash < this.need) { this.phase = 'end'; this.msg = `돈이 모자라 더 칠 수 없다. ($${this.need} 필요)`; this.setButtons(); return; }
    G.advance(10, { town: true }); if (G.pendingDeath) return;
    S.stats.hands++;
    const deck = []; for (let s = 0; s < 4; s++) for (let r = 2; r <= 14; r++) deck.push({ r, s });
    G.shuffle(Math.random, deck); this.deck = deck;
    this.pot = 0; this.sel.clear(); this.revealed = false; this.winners = [];
    for (const s of this.seats) { s.folded = false; s.bet = 0; s.act = ''; s.hand = deck.splice(0, 5); s.stack -= this.ante; this.pot += this.ante; }
    G.audio.sfx('card');
    this.msg = `참가비 $${this.ante}씩. 패를 확인하시오.`;
    this.beginRound(1);
  }
  beginRound(n) {
    this.round = n; this.betSize = this.ante * (n === 1 ? 2 : 4); this.curBet = 0; this.raises = 0;
    for (const s of this.seats) { s.bet = 0; if (!s.folded) s.act = s.act === '폴드' ? s.act : (n === 2 ? s.act : ''); }
    this.pending = new Set(this.seats.map((s, i) => i).filter(i => !this.seats[i].folded));
    this.turn = 0; while (!this.pending.has(this.turn)) this.turn = (this.turn + 1) % 3;
    this.phase = 'bet'; this.aiT = 0.6; this.setButtons();
  }
  pay(s, amt) { s.stack -= amt; this.pot += amt; s.bet += amt; }
  doAct(i, a) {
    const s = this.seats[i]; const toCall = this.curBet - s.bet;
    if (a === 'raise' && this.raises >= 3) a = 'call';
    if (a === 'fold' && toCall === 0) a = 'call';
    if (a === 'fold') { s.folded = true; s.act = '폴드'; this.pending.delete(i); }
    else if (a === 'call') { this.pay(s, toCall); s.act = toCall ? `콜 $${toCall}` : '체크'; this.pending.delete(i); }
    else { const nb = this.curBet + this.betSize; this.pay(s, nb - s.bet); s.act = this.curBet ? `레이즈 $${nb}` : `베팅 $${nb}`; this.curBet = nb; this.raises++; this.pending = new Set(this.seats.map((x, j) => j).filter(j => j !== i && !this.seats[j].folded)); }
    G.audio.sfx(a === 'fold' ? 'card' : 'coin');
    if (this.active().length === 1) return this.finish();
    if (!this.pending.size) {
      if (this.round === 1) { this.phase = 'draw'; this.msg = '바꿀 카드를 고르시오 (최대 3장).'; this.cur = 0; this.setButtons(); if (this.seats[0].folded) this.aiDraws(); }
      else this.finish();
      return;
    }
    do { this.turn = (this.turn + 1) % 3; } while (!this.pending.has(this.turn));
    this.aiT = 0.65; this.setButtons();
  }
  aiDecide(s) {
    const e = G.evalHand(s.hand), cat = e[0], hi = e[1]; const toCall = this.curBet - s.bet; const R = Math.random(); const ag = s.agg; const rz = this.raises;
    if (this.round === 1) {
      if (cat >= 2) return R < 0.75 * ag ? 'raise' : 'call';
      if (cat === 1) {
        const high = hi >= 11;
        if (toCall === 0) return high && R < 0.45 * ag ? 'raise' : 'call';
        if (high) return rz <= 2 ? 'call' : (R < 0.5 ? 'call' : 'fold');
        return rz <= 1 ? 'call' : (R < 0.35 ? 'call' : 'fold');
      }
      const d = drawInfo(s.hand);
      if (toCall === 0) return R < 0.07 * ag ? 'raise' : 'call';
      if ((d.fs >= 0 || d.straight) && rz <= 1) return 'call';
      return R < 0.08 ? 'call' : 'fold';
    }
    if (cat >= 3) return R < 0.85 ? 'raise' : 'call';
    if (cat === 2) { if (toCall === 0) return R < 0.6 * ag ? 'raise' : 'call'; if (rz < 2 && R < 0.35 * ag) return 'raise'; return rz <= 2 ? 'call' : (R < 0.6 ? 'call' : 'fold'); }
    if (cat === 1) {
      const high = hi >= 11;
      if (toCall === 0) return high && R < 0.3 * ag ? 'raise' : 'call';
      if (high) return rz <= 1 ? 'call' : (R < 0.4 ? 'call' : 'fold');
      return rz === 0 && R < 0.5 ? 'call' : 'fold';
    }
    if (toCall === 0) return R < 0.08 * ag ? 'raise' : 'call';
    return R < 0.04 ? 'call' : 'fold';
  }
  aiDraws() {
    for (let i = 1; i < 3; i++) {
      const s = this.seats[i]; if (s.folded) continue;
      const d = aiDiscard(s.hand); d.sort((a, b) => b - a).forEach(j => s.hand.splice(j, 1));
      s.hand.push(...this.deck.splice(0, d.length));
      s.act = d.length ? `${d.length}장 교환` : '그대로';
    }
  }
  playerDraw() {
    const me = this.seats[0]; const idx = [...this.sel].sort((a, b) => b - a);
    idx.forEach(j => me.hand.splice(j, 1)); me.hand.push(...this.deck.splice(0, idx.length));
    me.act = idx.length ? `${idx.length}장 교환` : '그대로';
    this.sel.clear(); G.audio.sfx('card');
    this.aiDraws();
    this.msg = '두 번째 베팅.';
    this.beginRound(2);
  }
  finish() {
    const S = G.S; const act = this.active();
    let win;
    if (act.length === 1) win = act;
    else {
      this.revealed = true;
      const ev = act.map(s => ({ s, e: G.evalHand(s.hand) }));
      ev.sort((a, b) => cmp(b.e, a.e));
      win = ev.filter(x => cmp(x.e, ev[0].e) === 0).map(x => x.s);
      for (const x of ev) x.s.act = CAT[x.e[0]];
    }
    const share = Math.floor(this.pot / win.length);
    win.forEach(s => (s.stack += share));
    this.winners = win;
    const meWin = win.includes(this.seats[0]);
    if (meWin) { S.stats.won++; G.audio.sfx(win.length > 1 ? 'coin' : 'win'); }
    this.msg = (win.length > 1 ? '무승부! ' : '') + win.map(s => s.name === '나' ? '내가' : s.name + '이(가)').join(', ') + ` 판돈 $${G.money(this.pot)}를 가져갔다.`;
    this.pot = 0; this.phase = 'end';
    // 파산한 상대
    const pages = [this.msg]; let got = false;
    for (let i = 1; i < 3; i++) {
      const s = this.seats[i];
      if (s.stack < this.need) {
        if (s.piece && meWin && G.givePiece(!S.pieces[0] ? 0 : 1)) { pages.push(`${s.name}: "돈이 다 떨어졌군… 이거라도 가져가게."\n낡은 뼈 지도 조각을 내밀었다!`); got = true; }
        else pages.push(`${s.name}은(는) 빈털터리가 되어 자리를 떴다.`);
        s.piece = false;
        this.seats[i] = this.newOpp();
        pages.push(`${this.seats[i].name}이(가) 빈자리에 앉았다.`);
      }
    }
    if (got) pages.push(G.pieceText());
    if (pages.length > 1) G.say(pages);
    this.setButtons();
  }
  setButtons() {
    const me = this.seats[0]; const B = [];
    if (this.phase === 'bet' && this.turn === 0 && !me.folded) {
      const toCall = this.curBet - me.bet;
      B.push({ label: '폴드', act: () => this.doAct(0, 'fold') });
      B.push({ label: toCall ? `콜 $${toCall}` : '체크', act: () => this.doAct(0, 'call') });
      B.push({ label: this.raises >= 3 ? '레이즈 불가' : (this.curBet ? `레이즈 +$${this.betSize}` : `베팅 $${this.betSize}`), disabled: this.raises >= 3, act: () => this.doAct(0, 'raise') });
    } else if (this.phase === 'draw' && !me.folded) {
      B.push({ label: this.sel.size ? `${this.sel.size}장 교환` : '그대로 간다', act: () => this.playerDraw() });
    } else if (this.phase === 'end') {
      B.push({ label: '다음 판', disabled: G.S.cash < this.need, act: () => this.startHand() });
      B.push({ label: '일어나기', act: () => G.ui.pop() });
    }
    this.buttons = B; if (this.btn >= B.length) this.btn = 0;
    if (this.phase === 'bet' && B.length === 3) this.btn = 1;
    if (this.phase !== 'draw') this.cur = this.btn;
  }
  update(dt) {
    const me = this.seats[0];
    if (this.phase === 'bet' && (this.turn !== 0 || me.folded)) {
      this.aiT -= dt;
      if (this.aiT <= 0) { if (me.folded && this.turn === 0) return; this.doAct(this.turn, this.aiDecide(this.seats[this.turn])); }
      I.taps.length = 0; return;
    }
    if (this.phase === 'draw' && me.folded) { this.beginRound(2); return; }
    const nb = this.buttons.length;
    const inDraw = this.phase === 'draw';
    const total = inDraw ? 5 + nb : nb;
    if (I.hit('left')) { this.cur = (this.cur + total - 1) % total; G.audio.sfx('sel'); }
    if (I.hit('right')) { this.cur = (this.cur + 1) % total; G.audio.sfx('sel'); }
    if (I.hit('up') && inDraw && this.cur >= 5) this.cur = 2;
    if (I.hit('down') && inDraw && this.cur < 5) this.cur = 5;
    if (!inDraw) this.cur = this.btn = G.clamp(this.cur, 0, Math.max(0, nb - 1));
    const press = idx => {
      if (inDraw && idx < 5) { if (this.sel.has(idx)) this.sel.delete(idx); else if (this.sel.size < 3) this.sel.add(idx); else G.audio.sfx('no'); G.audio.sfx('card'); this.setButtons(); return; }
      const b = this.buttons[inDraw ? idx - 5 : idx]; if (!b) return;
      if (b.disabled) { G.audio.sfx('no'); return; }
      G.audio.sfx('sel'); b.act();
    };
    if (I.hit('a')) press(this.cur);
    if (I.hit('b') && this.phase === 'end') G.ui.pop();
    let t; while ((t = I.tap())) {
      if (inDraw) for (let i = 0; i < 5; i++) { const x = 114 + i * 32; if (t.x >= x && t.x < x + 28 && t.y >= 112 && t.y < 166) { this.cur = i; press(i); return; } }
      this.btnRects.forEach((r, i) => { if (t.x >= r.x && t.x < r.x + r.w && t.y >= r.y && t.y < r.y + r.h) { this.cur = inDraw ? 5 + i : i; press(this.cur); } });
    }
  }
  draw(ctx) {
    // 탁자
    G.rect(ctx, 0, 0, G.W, G.H, 'n');
    G.rect(ctx, 6, 4, G.W - 12, 176, 'k'); G.rect(ctx, 8, 6, G.W - 16, 172, 'B'); G.rect(ctx, 12, 10, G.W - 24, 164, 'G');
    for (let y = 12; y < 172; y += 4) for (let x = 14 + (y % 8 ? 2 : 0); x < G.W - 14; x += 4) G.rect(ctx, x, y, 1, 1, 'g');
    const me = this.seats[0];
    // 상대
    for (let i = 1; i < 3; i++) {
      const s = this.seats[i], ox = i === 1 ? 22 : 204;
      G.rect(ctx, ox, 14, 158, 62, 'k'); G.rect(ctx, ox + 1, 15, 156, 60, s.folded ? 'K' : 'n');
      ctx.drawImage(s.face, ox + 4, 19, 32, 32);
      G.text(ctx, s.name, ox + 40, 18, s.piece ? 'Y' : 'w', 'm');
      G.text(ctx, '$' + G.money(s.stack), ox + 40, 32, 'Y', 's');
      G.text(ctx, s.act, ox + 152, 32, s.act === '폴드' ? 'h' : 'o', 's', 'right');
      if (s.piece) ctx.drawImage(A.icon.bone, ox + 140, 20);
      for (let k = 0; k < 5; k++) {
        const c = s.hand[k]; if (!c) continue;
        const img = (this.revealed && !s.folded) ? A.card(c.r, c.s, true) : A.cardBack(true);
        ctx.drawImage(img, ox + 40 + k * 18, 47);
      }
      if (this.phase === 'bet' && this.turn === i && !s.folded) G.text(ctx, '생각 중…', ox + 6, 56, 'W', 's');
      if (this.winners.includes(s)) G.text(ctx, '승리!', ox + 6, 56, 'Y', 's');
    }
    // 판돈
    G.rect(ctx, 152, 84, 80, 18, 'k'); G.rect(ctx, 153, 85, 78, 16, 'B');
    G.text(ctx, `판돈 $${G.money(this.pot)}`, 192, 88, 'Y', 's', 'center');
    for (let i = 0; i < Math.min(8, Math.ceil(this.pot / this.ante / 3)); i++) { G.rect(ctx, 120 - (i % 4) * 6, 92 - (i >> 2) * 3, 5, 3, i % 2 ? 'r' : 'w'); }
    // 내 카드
    for (let k = 0; k < 5; k++) {
      const c = me.hand[k]; if (!c) continue;
      const x = 114 + k * 32; const up = this.sel.has(k) ? -7 : 0;
      ctx.globalAlpha = me.folded ? 0.5 : 1;
      ctx.drawImage(A.card(c.r, c.s), x, 124 + up); ctx.globalAlpha = 1;
      if (this.sel.has(k)) G.text(ctx, '교환', x + 14, 110, 'r', 's', 'center');
      if (this.phase === 'draw' && this.cur === k) { G.rect(ctx, x - 1, 163, 30, 2, 'Y'); }
    }
    if (me.hand.length === 5) { const e = G.evalHand(me.hand); G.text(ctx, CAT[e[0]], 192, 165, 'Y', 's', 'center'); }
    G.text(ctx, `소지금 $${G.money(G.S.cash)}`, 18, 160, 'Y', 's');
    G.text(ctx, me.act, 366, 160, 'o', 's', 'right');
    // 메시지
    const ml = G.wrap(this.msg, G.W - 20, 's');
    G.text(ctx, ml[0] || '', 192, 183, 'w', 's', 'center');
    // 버튼
    this.btnRects = [];
    const n = this.buttons.length, bw = n === 1 ? 150 : n === 2 ? 130 : 116, gap = 8;
    const tot = n * bw + (n - 1) * gap; let bx = 192 - tot / 2;
    this.buttons.forEach((b, i) => {
      const sel = (this.phase === 'draw' ? this.cur - 5 : this.cur) === i;
      G.rect(ctx, bx, 196, bw, 17, 'k'); G.rect(ctx, bx + 1, 197, bw - 2, 15, sel ? 'Y' : 'S'); G.rect(ctx, bx + 2, 198, bw - 4, 13, sel ? 'o' : 'B');
      G.text(ctx, b.label, bx + bw / 2, 199, b.disabled ? 'h' : 'w', 'm', 'center');
      this.btnRects.push({ x: bx, y: 194, w: bw, h: 22 });
      bx += bw + gap;
    });
    if (this.phase === 'bet' && this.turn !== 0) G.text(ctx, '상대 차례…', 192, 200, 'W', 's', 'center');
  }
}
G.PokerScene = PokerScene;
})();
