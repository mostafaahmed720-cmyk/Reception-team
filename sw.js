// Reception Team service worker: the app shell works offline; data always comes live from Supabase.
// Bump VERSION whenever you upload a new index.html.
const VERSION='rt-v16';
const CORE=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','apple-touch-icon.png'];
const LIBS=['https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js','https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js','https://cdnjs.cloudflare.com/ajax/libs/jsQR/1.4.0/jsQR.min.js'];
self.addEventListener('install',e=>{e.waitUntil((async()=>{
  const c=await caches.open(VERSION);await c.addAll(CORE);
  for(const u of LIBS){try{await c.put(u,await fetch(new Request(u,{mode:'no-cors'})))}catch(_){}}
  self.skipWaiting()})())});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{
  for(const k of await caches.keys())if(k!==VERSION)await caches.delete(k);
  await self.clients.claim()})())});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET')return;
  // never cache Supabase or any other API traffic: only this site's own files and the two QR libraries
  if(u.origin!==self.location.origin&&!LIBS.includes(r.url))return;
  e.respondWith((async()=>{
    const c=await caches.open(VERSION);
    const hit=await c.match(r,{ignoreSearch:true});
    const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque'))c.put(r,res.clone());return res}).catch(()=>null);
    return hit||(await net)||(r.mode==='navigate'?await c.match('index.html'):Response.error());
  })());
});
