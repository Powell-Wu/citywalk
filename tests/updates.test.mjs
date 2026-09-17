import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createUpdater} from '../dist/updates.mjs';
import {prepareRelease} from '../scripts/release.mjs';
import {saveUpdateDraft,restoreUpdateDraft,readUpdateView} from '../dist/drafts.mjs';

class Emitter {events={};addEventListener(n,fn){(this.events[n]||=[]).push(fn);}removeEventListener(n,fn){this.events[n]=(this.events[n]||[]).filter(x=>x!==fn);}emit(n){for(const fn of this.events[n]||[])fn();}}
function fixture(){const sw=new Emitter(),reg=new Emitter();sw.controller={};let updates=0,registers=0,reloads=0;reg.waiting=null;reg.installing=null;reg.update=async()=>{updates++;};sw.register=async()=>{registers++;return reg;};const changes=[];const app=createUpdater({serviceWorker:sw,secure:true,onChange:s=>changes.push(s),reload:()=>reloads++});return {sw,reg,app,changes,get updates(){return updates;},get registers(){return registers;},get reloads(){return reloads;}};}
test('manual checks use one registration, discover waiting update, never force reload',async()=>{
 const f=fixture();await f.app.check(true);assert.equal(f.app.getState().available,false);
 let posted;f.reg.waiting={postMessage:m=>posted=m};await f.app.check(true);
 assert.equal(f.app.getState().available,true);assert.equal(f.reloads,0);assert.equal(f.registers,1);
 await f.app.apply();assert.deepEqual(posted,{type:'SKIP_WAITING'});f.sw.emit('controllerchange');f.sw.emit('controllerchange');assert.equal(f.reloads,1);
});
test('first install does not advertise its transient waiting worker as an update',async()=>{
 const sw=new Emitter(),reg=new Emitter();sw.controller=null;reg.waiting={};reg.update=async()=>{};sw.register=async()=>reg;
 let reloads=0;const app=createUpdater({serviceWorker:sw,secure:true,onChange:()=>{},reload:()=>reloads++});
 await app.check(true);assert.equal(app.getState().available,false);
 reg.waiting=null;sw.controller={};sw.emit('controllerchange');assert.equal(app.getState().available,false);assert.equal(reloads,0);
});
test('new worker download updates controls without a page render; concurrent checks deduplicate',async()=>{
 const f=fixture();await f.app.check();const worker=new Emitter();worker.state='installing';f.reg.installing=worker;f.reg.emit('updatefound');
 const a=f.app.check(true),b=f.app.check(true);await Promise.resolve();await Promise.resolve();
 worker.state='installed';f.reg.waiting=worker;f.reg.installing=null;worker.emit('statechange');await Promise.all([a,b]);
 assert.equal(f.app.getState().available,true);assert.equal(f.updates,2);assert.equal(f.reloads,0);
});
test('offline check preserves ready update and a different tab activation only prompts',async()=>{
 const f=fixture();await f.app.check();f.reg.update=async()=>{throw Error('offline');};await f.app.check(true);
 assert.match(f.app.getState().message,/检查失败/);assert.equal(f.app.getState().checking,false);
 f.sw.emit('controllerchange');assert.equal(f.app.getState().available,true);assert.equal(f.reloads,0);
 await f.app.apply();assert.equal(f.reloads,1);
});
test('content-based release changes for card edits, ignores line endings, and detects stale stamp',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'citywalk-release-'));
 try{
  await fs.writeFile(path.join(dir,'sw.js'),"const CACHE='old';\nconst FILES=['./'];\n");
  await fs.writeFile(path.join(dir,'index.html'),'hello\n');
  await fs.writeFile(path.join(dir,'cards.mjs'),'card one\n');
  const first=await prepareRelease(dir);assert.equal(await prepareRelease(dir),first);await prepareRelease(dir,{check:true});
  await fs.writeFile(path.join(dir,'cards.mjs'),'card one\r\n');assert.equal(await prepareRelease(dir),first);
  await fs.writeFile(path.join(dir,'cards.mjs'),'card two\n');await assert.rejects(prepareRelease(dir,{check:true}),/stale/);
  assert.notEqual(await prepareRelease(dir),first);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
test('unsaved inputs and editor state survive a same-context update but never replace changed records',()=>{
 const store=new Map(),storage={getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
 const input={id:'memory',name:'memory',type:'textarea',value:'今天的小事',form:{id:'finish-form'}};
 const doc={querySelectorAll:()=>[input]},context={hash:'#finish',revision:4};
 saveUpdateDraft(doc,storage,context,{customEditor:true,libraryType:'talk'});assert.equal(readUpdateView(storage).customEditor,true);
 input.value='';restoreUpdateDraft(doc,storage,context);assert.equal(input.value,'今天的小事');
 saveUpdateDraft(doc,storage,context);input.value='新一局';restoreUpdateDraft(doc,storage,{hash:'#finish',revision:5});assert.equal(input.value,'新一局');
});
