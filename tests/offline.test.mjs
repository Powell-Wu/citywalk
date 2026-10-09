import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs/promises';
import path from 'node:path';
import {prepareRelease} from '../scripts/release.mjs';
async function worker(fail=false){
 const handlers={},buckets=new Map();let network=0,skips=0;
 const key=request=>typeof request==='string'?request:request.url;
 const caches={async open(name){if(!buckets.has(name))buckets.set(name,new Map());const bucket=buckets.get(name);return{async put(k,response){bucket.set(key(k),response);},async match(k){return bucket.get(key(k))?.clone();}};},async keys(){return [...buckets.keys()];},async delete(name){return buckets.delete(name);},async match(request){for(const bucket of buckets.values())if(bucket.has(key(request)))return bucket.get(key(request)).clone();}};
 const self={registration:{scope:'https://walk.example/citywalk/'},location:{origin:'https://walk.example'},clients:{async claim(){},async matchAll(){return[];}},skipWaiting(){skips++;},addEventListener(name,fn){handlers[name]=fn;}};
 const fixtureRoot=path.resolve('test-results/worker-fixtures');await fs.mkdir(fixtureRoot,{recursive:true});
 const directory=await fs.mkdtemp(path.join(fixtureRoot,'case-'));await fs.mkdir(path.join(directory,'assets'));
 const content={'index.html':'CACHED APP','cards.mjs':'export const cards=[];','assets/app-abc.js':'export const app=true;','assets/app-abc.css':'body{margin:0}',...Object.fromEntries(['art-explore.webp','art-talk.webp','art-challenge.webp','deck-pattern.svg'].map(name=>[name,'fixture '+name]))};
 for(const [name,text] of Object.entries(content))await fs.writeFile(path.join(directory,name),text);
 await prepareRelease(directory,{template:await fs.readFile(new URL('../src/lib/services/sw-template.js',import.meta.url),'utf8')});
 for(const name of ['release.json','release.mjs'])content[name]=await fs.readFile(path.join(directory,name),'utf8');
 const code=await fs.readFile(path.join(directory,'sw.js'),'utf8');
 assert(directory.startsWith(fixtureRoot+path.sep));await fs.rm(directory,{recursive:true,force:true});
 const context=vm.createContext({self,caches,crypto:globalThis.crypto,URL,Request,Response,Promise,Uint8Array,fetch:async request=>{network++;const name=new URL(key(request)).pathname.replace('/citywalk/','')||'index.html';if(fail&&name==='cards.mjs')return new Response('unavailable',{status:fail==='corrupt'?200:503,headers:{'Content-Type':'text/javascript'}});return new Response(content[name],{headers:{'Content-Type':/\.(?:mjs|js)$/.test(name)?'text/javascript':'text/html'}});}});
 vm.runInContext(code,context);return {self,handlers,caches,buckets,network:()=>network,skips:()=>skips};
}
const install=async worker=>{let promise;worker.handlers.install({waitUntil:value=>promise=value});await promise;};
test('schema guard refuses unknown or v1 clients and accepts only an all-v2 scope',async()=>{
 const w=await worker(),messages=[];w.self.clients.matchAll=async()=>[{id:'new',url:'https://walk.example/citywalk/#home',postMessage:x=>messages.push(x)},{id:'old',url:'https://walk.example/citywalk/#walk',postMessage:x=>messages.push(x)}];
 const report=async(id,schema)=>{let done;w.handlers.message({source:{id},data:{type:'CLIENT_VERSION',version:'r-aaaaaaaaaaaa',schema},waitUntil:p=>done=p});await done;};
 const check=async()=>{let done,answer;w.handlers.message({data:{type:'CAN_WRITE_SCHEMA',schema:2},ports:[{postMessage:x=>answer=x}],waitUntil:p=>done=p});await done;return answer.compatible;};
 await report('new',2);assert.equal(await check(),false);assert(messages.some(x=>x.type==='VERSION_REQUEST'));await report('old',1);assert.equal(await check(),false);await report('old',2);assert.equal(await check(),true);
});
test('built worker caches the full recursive shell and serves subpath navigation offline',async()=>{const w=await worker();await install(w);assert(await w.caches.match('https://walk.example/citywalk/offline-ready'));const count=w.network();let response;w.handlers.fetch({request:{url:'https://walk.example/citywalk/',method:'GET',mode:'navigate'},respondWith:value=>response=value});assert.equal(await(await response).text(),'CACHED APP');assert.equal(w.network(),count);assert.equal(w.skips(),0);w.handlers.message({data:{type:'SKIP_WAITING'}});assert.equal(w.skips(),1);});
test('failed or hash-mismatched offline download deletes the incomplete cache and never reports ready',async()=>{for(const fail of [true,'corrupt']){const w=await worker(fail);await assert.rejects(install(w));assert.equal(await w.caches.match('https://walk.example/citywalk/offline-ready'),undefined);assert.equal(w.buckets.size,0);}});
test('nested fingerprint bundles and current art are cached, while archived art is excluded',async()=>{const w=await worker();await install(w);const count=w.network();for(const name of ['art-explore.webp','art-talk.webp','art-challenge.webp','deck-pattern.svg','assets/app-abc.js','assets/app-abc.css']){let response;w.handlers.fetch({request:{url:'https://walk.example/citywalk/'+name,method:'GET',mode:'cors'},respondWith:value=>response=value});assert.equal((await response).status,200);}assert.equal(w.network(),count);for(const name of ['story-scene.webp','story-talk.webp','story-event.webp'])assert.equal(await w.caches.match('https://walk.example/citywalk/'+name),undefined);});
test('activation preserves prior cached modules for an open old client without mixing new fingerprint imports',async()=>{const w=await worker();await install(w);const prior=await w.caches.open('citywalk-static-prior');await prior.put('https://walk.example/citywalk/core.mjs',new Response('OLD CORE'));let activated;w.handlers.activate({waitUntil:promise=>activated=promise});await activated;assert(w.buckets.has('citywalk-static-prior'));let response;w.handlers.fetch({request:{url:'https://walk.example/citywalk/core.mjs',method:'GET',mode:'cors'},respondWith:value=>response=value});assert.equal(await(await response).text(),'OLD CORE');});
test('known open clients pin their actual releases; an unknown scoped client stops pruning until it reports or closes',async()=>{
 const w=await worker();await install(w);const current=(await w.caches.keys())[0],old='citywalk-static-r-111111111111',unused='citywalk-static-r-222222222222';await w.caches.open(old);await w.caches.open(unused);
 let clients=[{id:'new',url:'https://walk.example/citywalk/#walk'},{id:'old',url:'https://walk.example/citywalk/#settings'},{id:'outside',url:'https://walk.example/another/'}];w.self.clients.matchAll=async()=>clients;
 const report=async(id,version)=>{let done;w.handlers.message({source:{id},data:{type:'CLIENT_VERSION',version,schema:2},waitUntil:p=>done=p});await done;};
 await report('new',current.replace('citywalk-static-',''));assert(w.buckets.has(old));assert(w.buckets.has(unused));
 await report('old','r-111111111111');assert(w.buckets.has(current));assert(w.buckets.has(old));assert.equal(w.buckets.has(unused),false);
 clients=clients.filter(c=>c.id!=='old');await report('new',current.replace('citywalk-static-',''));assert.equal(w.buckets.has(old),false);assert(w.buckets.has(current));
});
