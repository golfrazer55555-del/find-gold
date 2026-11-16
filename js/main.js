'use strict';
// ===== 시작 / 게임 루프 / 화면 크기 =====
(function () {
const cv = G.cv = document.getElementById('game');
const ctx = cv.getContext('2d');
cv.width = G.W; cv.height = G.H; ctx.imageSmoothingEnabled = false;

const stage = document.getElementById('stage');
G.resize = function () {
  const iw = window.innerWidth, ih = window.innerHeight, dpr = window.devicePixelRatio || 1;
  const touch = G.input.touchMode;
  // 세로로 든 터치 기기는 화면 전체를 90도 돌려서 항상 가로로 보여 준다
  const rot = G.rotated = touch && ih > iw;
  const st = stage.style;
  if (rot) { st.width = ih + 'px'; st.height = iw + 'px'; st.transform = `translate(${iw}px, 0) rotate(90deg)`; }
  else { st.width = iw + 'px'; st.height = ih + 'px'; st.transform = ''; }
  document.body.classList.toggle('rot', rot);
  const vw = rot ? ih : iw, vh = rot ? iw : ih;
  const availW = touch ? Math.max(vw * 0.6, vw - 280) : vw, availH = vh;
  let s = Math.min(availW * dpr / G.W, availH * dpr / G.H);
  if (s >= 2 && !touch) s = Math.floor(s);
  cv.style.width = (G.W * s / dpr) + 'px'; cv.style.height = (G.H * s / dpr) + 'px';
};
// 지원하는 기기(안드로이드 등)에서는 첫 터치 때 전체 화면 + 실제 가로 고정도 시도
G.lockLandscape = function () {
  if (G.lockTried || !G.input.touchMode) return; G.lockTried = true;
  const el = document.documentElement;
  const req = el.requestFullscreen || el.webkitRequestFullscreen;
  const lock = () => { try { const p = screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape'); if (p && p.catch) p.catch(() => {}); } catch (e) {} };
  try { const r = req && req.call(el); if (r && r.then) r.then(lock).catch(lock); else lock(); } catch (e) { lock(); }
};
document.addEventListener('pointerdown', () => G.lockLandscape(), { capture: true });
window.addEventListener('resize', G.resize);
window.addEventListener('orientationchange', () => setTimeout(G.resize, 200));

let last = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
  G.input.update(dt);
  try {
    if (G.pendingDeath && !(G.ui.top() instanceof G.GameOverScene)) {
      const c = G.pendingDeath; G.ui.reset(new G.GameOverScene(c)); G.pendingDeath = null; G.dead = true;
    }
    G.menuInput();
    G.ui.update(dt); G.updateToasts(dt);
    ctx.fillStyle = '#140c10'; ctx.fillRect(0, 0, G.W, G.H);
    G.ui.draw(ctx);
  } catch (e) { console.error(e); }
  G.input.endFrame();
  requestAnimationFrame(frame);
}

async function boot() {
  G.loadOpts();
  G.input.setup(cv);
  G.resize();
  ctx.fillStyle = '#140c10'; ctx.fillRect(0, 0, G.W, G.H);
  await G.loadFonts();
  G.ui.reset(new G.TitleScene());
  document.getElementById('loading').remove();
  requestAnimationFrame(t => { last = t; frame(t); });
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
}
document.addEventListener('visibilitychange', () => { if (document.hidden) G.input.held = {}; });
boot();
})();
