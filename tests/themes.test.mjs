import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,newSession,draw,complete,finish,score,validateBackup} from '../dist/core.mjs';
import {themeOf,setTheme} from '../dist/themes.mjs';
import {readState,updateState} from '../dist/storage.mjs';

test('legacy backups adopt warm skin; theme survives backup and rejects unknown values',()=>{
 const legacy=initialState();delete legacy.theme;
 assert.equal(themeOf(legacy),'warm');assert.equal(validateBackup(legacy).theme,'warm');
 setTheme(legacy,'story');assert.equal(validateBackup(legacy).theme,'story');
 for(const theme of ['unknown','__proto__',null,{}])assert.throws(()=>validateBackup({...legacy,theme}),/皮肤/);
});
test('changing skins persists after reload and preserves ongoing card, points, and history',async()=>{
 await updateState(s=>{
  newSession(s,s.preferences,1000);let se=s.session;
  draw(s,se.id,se.slots[0].id);complete(s,se.id,se.slots[0].id,se.slots[0].card.id,0,2000);
  finish(s,se.id,{name:'周末的小路',memory:'一起走过',closing:true},3000);
  newSession(s,s.preferences,4000);se=s.session;
  draw(s,se.id,se.slots[0].id);complete(s,se.id,se.slots[0].id,se.slots[0].card.id,0,5000);
  draw(s,se.id,se.slots[1].id);
 });
 const before=await readState();
 for(const theme of ['adventure','story','warm','adventure']){
  await updateState(s=>setTheme(s,theme));const after=await readState();
  assert.equal(after.theme,theme);assert.deepEqual(after.session,before.session);
  assert.deepEqual(after.history,before.history);assert.deepEqual(score(after.session),score(before.session));
  assert.deepEqual(after.preferences,before.preferences);
 }
 await assert.rejects(updateState(s=>setTheme(s,'invalid')),/皮肤/);
 assert.equal((await readState()).theme,'adventure');
});
