import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readState,updateState} from '../dist/storage.mjs';
import {newSession,draw,complete,score,validateBackup} from '../dist/core.mjs';
test('IndexedDB saves atomically, rejects failed edits and serializes concurrent completions',async()=>{
 let s=await readState();assert.equal(s.session,null);
 await updateState(s=>newSession(s,{...s.preferences,mode:'short'}));s=await readState();const id=s.session.id,slot=s.session.slots[0].id;
 await updateState(s=>draw(s,id,slot));s=await readState();const card=s.session.slots[0].card.id;
 await Promise.all([updateState(s=>complete(s,id,slot,card)),updateState(s=>complete(s,id,slot,card))]);
 s=await readState();assert.equal(score(s.session).total,2);const revision=s.revision;
 await assert.rejects(updateState(s=>{s.session.name='should roll back';throw Error('intentional abort');}),/intentional/);
 const after=await readState();assert.equal(after.session.name,'');assert.equal(after.revision,revision);assert.equal(validateBackup(after).session.id,id);
});
