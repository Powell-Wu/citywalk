import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs/promises';
async function worker(fail=false){
 const handlers={},buckets=new Map();let network=0;
 const key=r=>typeof r==='string'?r:r.url;
 const caches={async open(name){if(!buckets.has(name))buckets.set(name,new Map());const b=buckets.get(name);return{async put(k,r){b.set(key(k),r);},async match(r){return b.get(key(r))?.clone();}};},async keys(){return [...buckets.keys()];},async delete(n){return buckets.delete(n);},async match(r){for(const b of buckets.values())if(b.has(key(r)))return b.get(key(r)).clone();}};
 const self={registration:{scope:'https://walk.example/'},location:{origin:'https://walk.example'},clients:{async claim(){},async matchAll(){return[];}},skipWaiting(){},addEventListener(name,fn){handlers[name]=fn;}};
 const context=vm.createContext({self,caches,URL,Request,Response,Promise,fetch:async r=>{network++;if(fail&&key(r).endsWith('cards.mjs'))return new Response('unavailable',{status:503});return new Response(key(r).endsWith('index.html')?'CACHED APP':'asset',{headers:{'Content-Type':key(r).endsWith('.mjs')?'text/javascript':'text/html'}});}});
 vm.runInContext(await fs.readFile(new URL('../dist/sw.js',import.meta.url),'utf8'),context);
 return {handlers,caches,buckets,network:()=>network};
}
test('service worker caches full shell and serves navigation with no network',async()=>{const w=await worker();let install;w.handlers.install({waitUntil:p=>install=p});await install;assert(await w.caches.match('https://walk.example/offline-ready'));const count=w.network();let response;w.handlers.fetch({request:{url:'https://walk.example/',method:'GET',mode:'navigate'},respondWith:p=>response=p});assert.equal(await(await response).text(),'CACHED APP');assert.equal(w.network(),count);});
test('failed offline installation never advertises readiness or leaves partial cache',async()=>{const w=await worker(true);let install;w.handlers.install({waitUntil:p=>install=p});await assert.rejects(install);assert.equal(await w.caches.match('https://walk.example/offline-ready'),undefined);assert.equal(w.buckets.size,0);});

test('all narrative illustrations and gesture code are available without network',async()=>{const w=await worker();let install;w.handlers.install({waitUntil:p=>install=p});await install;const count=w.network();for(const name of ['story-scene.webp','story-talk.webp','story-event.webp','cards.css','swipe.mjs']){let response;w.handlers.fetch({request:{url:'https://walk.example/'+name,method:'GET',mode:'cors'},respondWith:p=>response=p});assert.equal((await response).status,200);}assert.equal(w.network(),count);});
