'use strict';
// ===== 시작 / 게임 루프 / 화면 크기 =====
(function () {
const cv = G.cv = document.getElementById('game');
const ctx = cv.getContext('2d');
cv.width = G.W; cv.height = G.H; ctx.imageSmoothingEnabled = false;

G.resize = function () {
  const vw = window.innerWidth, vh = window.innerHeight, dpr = window.devicePixelRatio || 1;
  const touch = G.input.touchMode, portrait = vh > vw;
  const availW = touch && !portrait ? Math.max(vw * 0.6, vw - 280) : vw, availH = touch && portrait ? vh - Math.min(260, vh * 0.38) : vh;
  let s = Math.min(availW * dpr / G.W, availH * dpr / G.H);
  if (s >= 2 && !touch) s = Math.floor(s);
  cv.style.width = (G.W * s / dpr) + 'px'; cv.style.height = (G.H * s / dpr) + 'px';
  document.body.classList.toggle('portrait', portrait);
};
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
    G.ui.update(dt);
    G.updateToasts(dt);
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
