const CACHE='aster-research-v1';
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE))});
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/')||url.pathname.includes('auth'))return;
 event.respondWith(fetch(event.request).then(r=>{if(r.ok&&!r.redirected&&(event.request.mode==='navigate'||['script','style','font','image'].includes(event.request.destination))){const c=r.clone();caches.open(CACHE).then(cache=>cache.put(event.request,c))}return r}).catch(async()=>{const c=await caches.match(event.request);if(c)return c;if(event.request.mode==='navigate'){const root=await caches.match('/');if(root)return root}return new Response('Offline: open ASTER while connected to cache this page.',{status:503})}));
});
