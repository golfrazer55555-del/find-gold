'use strict';
// ===== 입력: 키보드 + 마우스 + 터치(가상 조이스틱/버튼) =====
(function () {
const I = G.input = {
  held: {}, pressed: new Set(), taps: [], mouse: { x: -100, y: -100, moved: false, isMouse: false },
  joy: { x: 0, y: 0, id: null }, jnav: { dir: null, t: 0 }, touchMode: false
};
const KEY = {
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  Space: 'a', Enter: 'a', NumpadEnter: 'a', KeyZ: 'a', KeyE: 'a',
  Escape: 'b', KeyX: 'b', Backspace: 'b', KeyI: 'b', Tab: 'b',
  KeyF: 'c', KeyC: 'c', KeyM: 'm', KeyR: 'r'
};
const NAV = { up: 1, down: 1, left: 1, right: 1 };
window.addEventListener('keydown', e => {
  const k = KEY[e.code]; if (!k) return;
  e.preventDefault(); G.audio.init();
  if (!e.repeat || NAV[k]) I.pressed.add(k);
  I.held[k] = true;
});
window.addEventListener('keyup', e => { const k = KEY[e.code]; if (k) I.held[k] = false; });
window.addEventListener('blur', () => { I.held = {}; I.joy.x = I.joy.y = 0; });

I.hit = k => { if (I.pressed.has(k)) { I.pressed.delete(k); return true; } return false; };
I.tap = () => I.taps.shift() || null;
I.peekTap = () => I.taps[0] || null;
I.dir = function () {
  let x = (I.held.right ? 1 : 0) - (I.held.left ? 1 : 0) + I.joy.x;
  let y = (I.held.down ? 1 : 0) - (I.held.up ? 1 : 0) + I.joy.y;
  const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; }
  return { x, y };
};
I.update = function (dt) {
  // 조이스틱 → 메뉴 이동 입력 (반복)
  const { x, y } = I.joy; let d = null;
  if (Math.hypot(x, y) > 0.55) d = Math.abs(x) > Math.abs(y) ? (x > 0 ? 'right' : 'left') : (y > 0 ? 'down' : 'up');
  if (d !== I.jnav.dir) { I.jnav.dir = d; I.jnav.t = 0.38; if (d) I.pressed.add(d); }
  else if (d) { I.jnav.t -= dt; if (I.jnav.t <= 0) { I.jnav.t = 0.13; I.pressed.add(d); } }
};
I.endFrame = function () { I.pressed.clear(); I.taps.length = 0; I.mouse.clicked = false; };

I.toGame = function (cx, cy) {
  const r = G.cv.getBoundingClientRect();
  return { x: (cx - r.left) / r.width * G.W, y: (cy - r.top) / r.height * G.H };
};
I.setup = function (canvas) {
  canvas.addEventListener('pointerdown', e => {
    G.audio.init();
    const p = I.toGame(e.clientX, e.clientY);
    I.taps.push(p);
    I.mouse.x = p.x; I.mouse.y = p.y; I.mouse.isMouse = e.pointerType === 'mouse';
    if (e.pointerType !== 'mouse') setTouch(true);
    e.preventDefault();
  });
  canvas.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    const p = I.toGame(e.clientX, e.clientY); I.mouse.x = p.x; I.mouse.y = p.y; I.mouse.moved = true; I.mouse.isMouse = true;
  });
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  // 가상 조이스틱
  const joy = document.getElementById('joy'), knob = document.getElementById('knob');
  const setJoy = (cx, cy) => {
    const r = joy.getBoundingClientRect(); const R = r.width / 2;
    let dx = (cx - (r.left + R)) / R, dy = (cy - (r.top + R)) / R;
    const m = Math.hypot(dx, dy); if (m > 1) { dx /= m; dy /= m; }
    const dead = 0.18; const mm = Math.hypot(dx, dy);
    I.joy.x = mm < dead ? 0 : dx; I.joy.y = mm < dead ? 0 : dy;
    knob.style.transform = `translate(${dx * R * 0.55}px, ${dy * R * 0.55}px)`;
  };
  joy.addEventListener('pointerdown', e => { G.audio.init(); setTouch(true); I.joy.id = e.pointerId; joy.setPointerCapture(e.pointerId); setJoy(e.clientX, e.clientY); e.preventDefault(); });
  joy.addEventListener('pointermove', e => { if (e.pointerId === I.joy.id) { setJoy(e.clientX, e.clientY); e.preventDefault(); } });
  const endJoy = e => { if (e.pointerId === I.joy.id) { I.joy.id = null; I.joy.x = I.joy.y = 0; knob.style.transform = ''; } };
  joy.addEventListener('pointerup', endJoy); joy.addEventListener('pointercancel', endJoy);

  document.querySelectorAll('[data-k]').forEach(btn => {
    const k = btn.dataset.k;
    btn.addEventListener('pointerdown', e => { G.audio.init(); setTouch(true); I.pressed.add(k); I.held[k] = true; btn.classList.add('on'); btn.setPointerCapture(e.pointerId); e.preventDefault(); });
    const up = () => { I.held[k] = false; btn.classList.remove('on'); };
    btn.addEventListener('pointerup', up); btn.addEventListener('pointercancel', up);
  });
  document.addEventListener('touchmove', e => { if (e.target.closest && e.target.closest('#game,#touch')) e.preventDefault(); }, { passive: false });
  document.addEventListener('dblclick', e => e.preventDefault());

  const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  setTouch(coarse || ('ontouchstart' in window && navigator.maxTouchPoints > 0));
};
function setTouch(on) {
  if (I.touchMode === on) return;
  I.touchMode = on; document.body.classList.toggle('touch', on);
  if (G.resize) G.resize();
}
})();
