import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,newSession,draw,complete,finish,score,validateBackup} from '../dist/core.mjs';
import {themeOf,setTheme,themePicker} from '../dist/themes.mjs';
import {readState,updateState} from '../dist/storage.mjs';

test('legacy themes migrate to adventure and unavailable themes cannot be selected',()=>{
 for(const theme of [undefined,'warm','story','adventure']){
  const legacy={...initialState(),theme};
  assert.equal(themeOf(legacy),'adventure');assert.equal(validateBackup(legacy).theme,'adventure');
 }
 for(const theme of ['unknown','__proto__',null,{}])assert.throws(()=>validateBackup({...initialState(),theme}),/皮肤/);
 for(const theme of ['warm','story'])assert.throws(()=>setTheme(initialState(),theme),/皮肤/);
 const picker=themePicker(initialState());assert.doesNotMatch(picker,/叙事卡牌|data-theme-choice="warm"/);assert.match(picker,/disabled/);
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
 for(const theme of ['adventure']){
  await updateState(s=>setTheme(s,theme));const after=await readState();
  assert.equal(after.theme,theme);assert.deepEqual(after.session,before.session);
  assert.deepEqual(after.history,before.history);assert.deepEqual(score(after.session),score(before.session));
  assert.deepEqual(after.preferences,before.preferences);
 }
 await assert.rejects(updateState(s=>setTheme(s,'invalid')),/皮肤/);
 assert.equal((await readState()).theme,'adventure');
});

test('legacy theme backup migration preserves active cards, history and score',()=>{
 const s=initialState();newSession(s,s.preferences,1000);draw(s,s.session.id,s.session.slots[0].id);
 complete(s,s.session.id,s.session.slots[0].id,s.session.slots[0].card.id,0,2000);
 for(const theme of ['warm','story']){const restored=validateBackup({...s,theme});assert.deepEqual(restored.session,s.session);assert.deepEqual(score(restored.session),score(s.session));}
});
