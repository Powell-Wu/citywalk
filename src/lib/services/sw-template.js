const CACHE='__CONTENT_VERSION__';
const FILES=['./'];
const absolute=path=>new URL(path,self.registration.scope).href;
const clientVersions=new Map();
const clientSchemas=new Map();
async function cleanSafeCaches(){
 const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
 const relevant=clients.filter(client=>client.url?.startsWith(self.registration.scope));
 // Original v1 clients cannot report their version; retain caches while any
 // unknown client is open. Known Svelte clients pin the release they execute.
 if(relevant.some(client=>!clientVersions.has(client.id)))return;
 const pinned=new Set([CACHE,...relevant.map(client=>'citywalk-static-'+clientVersions.get(client.id))]);
 for(const key of await caches.keys())if(key.startsWith('citywalk-static-')&&!pinned.has(key))await caches.delete(key);
}
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 try{
  const entries=await Promise.all(FILES.map(async path=>{
   const request=new Request(absolute(path),{cache:'reload'}),response=await fetch(request);
   if(!response.ok||response.redirected)throw Error('Offline resource unavailable');
   const type=response.headers.get('content-type')||'';
   if(/\.(?:mjs|js)$/.test(path)&&!/javascript/.test(type))throw Error('Invalid script response');
   const copy=response.clone(),bytes=await response.arrayBuffer();
   const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
   if(INTEGRITY[path]&&digest!==INTEGRITY[path])throw Error('Incomplete or mismatched offline resource');
   return[request,copy];
  }));
  await Promise.all(entries.map(([request,response])=>cache.put(request,response)));
  await cache.put(absolute('./offline-ready'),new Response('ready'));
 }catch(error){await caches.delete(CACHE);throw error;}
})()));
// Prior caches remain available to already-open legacy clients. Fingerprinted
// new bundles never borrow bytes from an older release. Do not clear users' data.
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 await self.clients.claim();for(const client of await self.clients.matchAll()){client.postMessage({type:'CACHE_READY'});client.postMessage({type:'VERSION_REQUEST'});}
})()));
self.addEventListener('message',event=>{
 if(event.data?.type==='SKIP_WAITING')self.skipWaiting();
 if(event.data?.type==='CHECK_CACHE')event.source?.postMessage({type:'CACHE_READY'});
 if(event.data?.type==='CLIENT_VERSION'&&event.source?.id&&/^r-[a-f0-9]{12}$/.test(event.data.version)){
  clientVersions.set(event.source.id,event.data.version);clientSchemas.set(event.source.id,event.data.schema||1);event.waitUntil(cleanSafeCaches());
 }
 if(event.data?.type==='CAN_WRITE_SCHEMA'&&event.ports?.[0])event.waitUntil((async()=>{
  if(event.data.claim)await self.clients.claim();
  const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  const relevant=clients.filter(client=>client.url?.startsWith(self.registration.scope));
  const compatible=relevant.every(client=>clientSchemas.get(client.id)>=event.data.schema);
  for(const client of relevant)if(!clientSchemas.has(client.id))client.postMessage({type:'VERSION_REQUEST'});
  event.ports[0].postMessage({compatible});
 })());
});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url),scope=self.registration.scope;
 if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(scope))return;
 const fileURL=new URL(url);fileURL.search='';
 const paths=FILES.map(absolute);
 if(event.request.mode==='navigate')event.respondWith((async()=>{const cache=await caches.open(CACHE);return await cache.match(absolute('./index.html'))||fetch(event.request);})());
 else if(paths.includes(fileURL.href))event.respondWith((async()=>{const cache=await caches.open(CACHE);return await cache.match(fileURL.href)||fetch(event.request);})());
 else event.respondWith((async()=>{
  // Only our cache namespace and exact request URL may satisfy an old import.
  for(const key of (await caches.keys()).reverse())if(key.startsWith('citywalk-static-')&&key!==CACHE){const cache=await caches.open(key),response=await cache.match(event.request);if(response)return response;}
  return fetch(event.request);
 })());
});
