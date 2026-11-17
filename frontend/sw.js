// Cho phép chơi khi mất mạng. Không bao giờ lưu cache cho API.
const C='thebai-v2',F=['./','./index.html','./css/style.css','./js/fx.js','./js/data.js','./js/api.js','./js/game.js','./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(F)))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.pathname.includes('/api/')||u.origin!==location.origin)return;
  // Ưu tiên mạng (luôn có bản mới nhất), mất mạng thì dùng cache
  e.respondWith(fetch(e.request).then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put(e.request,cp));return res}).catch(()=>caches.match(e.request)));
});
