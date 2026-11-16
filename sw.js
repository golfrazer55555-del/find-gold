// 오프라인 실행을 위한 서비스 워커
const CACHE = 'desert-gold-v4';
const FILES = [
  './', 'index.html', 'css/style.css', 'manifest.webmanifest',
  'js/core.js', 'js/art.js', 'js/input.js', 'js/world.js', 'js/state.js', 'js/ui.js',
  'js/town.js', 'js/poker.js', 'js/duel.js', 'js/scenes.js', 'js/main.js',
  'fonts/Galmuri11.woff2', 'fonts/Galmuri9.woff2', 'icons/icon-192.png', 'icons/icon-512.png'
];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
