import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readState,updateState} from '../src/lib/services/storage.mjs';
import {newSession,draw,complete,score,validateBackup} from '../src/lib/domain/core.mjs';
import fs from 'node:fs/promises';
test('IndexedDB saves atomically, rejects failed edits and serializes concurrent completions',async()=>{
 let s=await readState();assert.equal(s.session,null);
 await updateState(s=>newSession(s,{...s.preferences,mode:'short'}));s=await readState();const id=s.session.id,slot=s.session.slots[0].id;
 await updateState(s=>draw(s,id,slot));s=await readState();const card=s.session.slots[0].card.id;
 await Promise.all([updateState(s=>complete(s,id,slot,card)),updateState(s=>complete(s,id,slot,card))]);
 s=await readState();assert.equal(score(s.session).total,2);const revision=s.revision;
 await assert.rejects(updateState(s=>{s.session.name='should roll back';throw Error('intentional abort');}),/intentional/);
 const after=await readState();assert.equal(after.session.name,'');assert.equal(after.revision,revision);assert.equal(validateBackup(after).session.id,id);
});
test('v1 validation and migration share the atomic user transaction; abort leaves old bytes intact',async()=>{
 const old=JSON.parse(await fs.readFile(new URL('./fixtures/v1-state.json',import.meta.url),'utf8'));
 const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('citywalk-for-two',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
 const raw=()=>new Promise(resolve=>{const tx=db.transaction('state'),r=tx.objectStore('state').get('current');r.onsuccess=()=>resolve(r.result);});
 await new Promise(resolve=>{const tx=db.transaction('state','readwrite');tx.objectStore('state').put(old,'current');tx.oncomplete=resolve;});
 assert.equal((await readState()).version,2);assert.deepEqual(await raw(),old);
 await assert.rejects(updateState(s=>{s.session.name='lost';throw Error('abort migration');}),/abort migration/);assert.deepEqual(await raw(),old);
 const slot=old.session.slots[0];await updateState(s=>complete(s,s.session.id,slot.id,slot.card.id));const saved=await raw();assert.equal(saved.version,2);assert.equal(saved.revision,old.revision+1);assert.equal(score(saved.history[0]).total,6);assert.equal(saved.history[0].name,old.history[0].name);assert(saved.session.rules);db.close();
});
