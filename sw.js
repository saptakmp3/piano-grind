// Piano Grind service worker: offline shell + background push for block-end alerts.
const V="pg-v7",SHELL=["./","./index.html","./manifest.json","./icons/icon-192.png","./icons/icon-512.png"];
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(V).then(c=>Promise.all(SHELL.map(u=>c.add(u).catch(()=>{})))))});
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=="GET"||u.origin!==location.origin)return;
  if(r.mode==="navigate"){e.respondWith(fetch(r).then(x=>{const c=x.clone();caches.open(V).then(h=>h.put("./index.html",c));return x}).catch(()=>caches.match("./index.html")));return}
  e.respondWith(caches.match(r).then(m=>{const n=fetch(r).then(x=>{if(x.ok){const c=x.clone();caches.open(V).then(h=>h.put(r,c))}return x}).catch(()=>m);return m||n}));
});
self.addEventListener("push",e=>{
  let d={title:"Block complete",body:"Ready for the next one."};
  try{d=e.data.json()}catch(x){}
  e.waitUntil((async()=>{
    // every push MUST show a notification (iOS revokes the subscription otherwise)
    await self.registration.showNotification("Piano Grind — "+d.title,{body:d.body,tag:"piano-grind-timer",renotify:true,silent:false,vibrate:[200,100,200],icon:"./icons/icon-192.png",badge:"./icons/icon-192.png"});
    (await self.clients.matchAll({type:"window",includeUncontrolled:true})).forEach(c=>c.postMessage({type:"pg-push"}));
  })());
});
self.addEventListener("notificationclick",e=>{
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(l=>l.length?l[0].focus():self.clients.openWindow(self.registration.scope)));
});
self.addEventListener("pushsubscriptionchange",e=>e.waitUntil(self.clients.matchAll({includeUncontrolled:true}).then(l=>l.forEach(c=>c.postMessage({type:"pg-resub"})))));
