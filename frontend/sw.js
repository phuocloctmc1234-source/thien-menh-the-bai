// Cho phép chơi khi mất mạng. Không bao giờ lưu cache cho API.
const C='thebai-v9',F=['./','./index.html','./css/style.css','./js/fx.js','./js/data.js','./js/cards2.js','./js/cards3.js','./js/api.js','./js/game.js','./js/cardsui.js','./js/home.js','./manifest.json','./icon-192.png','./icon-512.png','./img/card-frame.png','./img/hero-kiem.webp','./img/hero-kiem-face.webp'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(F)))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.pathname.includes('/api/')||u.origin!==location.origin)return;
  // Ưu tiên mạng (luôn có bản mới nhất), mất mạng thì dùng cache
  e.respondWith(fetch(e.request).then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put(e.request,cp));return res}).catch(()=>caches.match(e.request)));
});
