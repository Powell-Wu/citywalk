import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {initialState,newSession,draw,replaceCard,complete,finish,eligible,score,target,thresholds,validateBackup,CARDS,JOURNEY_THEMES} from '../src/lib/domain/core.mjs';
import {ticketLines} from '../src/lib/services/ticket-export.mjs';

test('both themed pools support a full zero-budget indoor short/half walk with classic scoring',()=>{
 for(const journeyTheme of ['observe','duo'])for(const mode of ['short','half']){
  const s=initialState();newSession(s,{...s.preferences,mode,journeyTheme,place:'indoor',budget:0});const se=s.session;
  for(const slot of se.slots){draw(s,se.id,slot.id,undefined,()=>0);assert(se.themePlan.cards[slot.type].includes(slot.card.id));assert.equal(slot.card.cost,0);assert.notEqual(slot.card.place,'outdoor');complete(s,se.id,slot.id,slot.card.id);}
  assert.equal(new Set(se.slots.map(slot=>slot.card.id)).size,se.slots.length);
  assert.equal(target(se),mode==='short'?13:20);assert.deepEqual(thresholds(se),mode==='short'?[8,11,13]:[12,16,20]);
  finish(s,se.id,{name:'主题测试',memory:'轮流找到小发现',closing:true});assert(score(s.history[0]).total>=target(s.history[0]));assert.equal(validateBackup(s).history[0].journeyTheme,journeyTheme);
 }
});
test('observation and duo give distinct talk/event pools, opening and closing prompts',()=>{
 const pools={};for(const key of ['observe','duo']){const s=initialState();newSession(s,{...s.preferences,journeyTheme:key,place:'indoor'});pools[key]=['talk','event'].map(type=>eligible(s,type).map(card=>card.id));}
 assert.notDeepEqual(pools.observe[0],pools.duo[0]);assert(pools.observe[1].every(id=>!pools.duo[1].includes(id)));
 assert.notEqual(JOURNEY_THEMES.observe.opening,JOURNEY_THEMES.duo.opening);assert.notEqual(JOURNEY_THEMES.observe.closing,JOURNEY_THEMES.duo.closing);
});
test('theme snapshots survive source changes, resume and ticket export without changing old prose',()=>{
 const s=initialState();newSession(s,{...s.preferences,journeyTheme:'observe'});const snapshot=structuredClone(s.session.themePlan),definition=JOURNEY_THEMES.observe;
 try{JOURNEY_THEMES.observe={...definition,opening:'未来版本的开场',cards:{scene:[],talk:[],event:[]}};const restored=validateBackup(JSON.parse(JSON.stringify(s)));assert.deepEqual(restored.session.themePlan,snapshot);assert.equal(eligible(restored,'scene').length,snapshot.cards.scene.length);finish(restored,restored.session.id,{name:'小发现',memory:'原始回忆',closing:false});const lines=ticketLines(restored.history[0]);assert(lines.some(line=>line.text===snapshot.name));assert(lines.some(line=>line.text===snapshot.closing));assert(lines.some(line=>line.text==='原始回忆'));}finally{JOURNEY_THEMES.observe=definition;}
});
test('theme filtering never relaxes disabled/budget/place/seen, and failed replace preserves current card',()=>{
 const s=initialState();newSession(s,{...s.preferences,journeyTheme:'duo',place:'indoor',budget:0});const se=s.session,slot=se.slots[0];draw(s,se.id,slot.id,undefined,()=>0);const current=structuredClone(slot);
 s.disabled=CARDS.filter(card=>card.type==='scene'&&card.id!==slot.card.id).map(card=>card.id);assert.equal(eligible(s,'scene').length,0);assert.throws(()=>replaceCard(s,se.id,slot.id,slot.card.id),/用完/);assert.deepEqual(slot,current);
 const noTheme=CARDS.find(card=>card.type==='scene'&&!se.themePlan.cards.scene.includes(card.id));s.disabled=[];assert(!eligible(s,'scene').some(card=>card.id===noTheme.id));assert(!eligible(s,'scene').some(card=>card.id===slot.card.id));
});
test('replacement also favors a fresh task and still draws when all suitable tasks are recent',()=>{
 const s=initialState();newSession(s,{...s.preferences,place:'indoor'});s.disabled=CARDS.filter(card=>card.type==='scene'&&!['scene-03','scene-09','scene-12'].includes(card.id)).map(card=>card.id);
 const slot=s.session.slots[0];draw(s,s.session.id,slot.id,undefined,()=>0);assert.equal(slot.card.id,'scene-03');
 s.history=[{slots:[{status:'done',card:CARDS.find(card=>card.id==='scene-09')}]}];replaceCard(s,s.session.id,slot.id,slot.card.id,()=>.4);assert.equal(slot.card.id,'scene-12');
 replaceCard(s,s.session.id,slot.id,slot.card.id,()=>.4);assert.equal(slot.card.id,'scene-09');
});
test('v2 import preserves saved rules/branch/history/sound and gains only neutral theme fields',async()=>{
 const old=JSON.parse(await fs.readFile(new URL('./fixtures/v2-state.json',import.meta.url),'utf8')),before=structuredClone(old),clean=validateBackup(old);
 assert.equal(clean.version,3);assert.equal(clean.preferences.journeyTheme,'mixed');assert.equal(clean.sound,old.sound);assert.deepEqual(old,before);
 for(const [i,journey] of [...old.history,old.session].entries())if(journey){const upgraded=[...clean.history,clean.session][i];assert.equal(upgraded.journeyTheme,'mixed');assert.equal(upgraded.themePlan,null);const {journeyTheme,themePlan,...rest}=upgraded;assert.deepEqual(rest,journey);}
});
test('invalid theme inputs and snapshots fail before mutation, while trial retains its own branch',()=>{
 const s=initialState(),before=structuredClone(s);assert.throws(()=>newSession(s,{...s.preferences,journeyTheme:'__proto__'}));assert.deepEqual(s,before);
 newSession(s,{...s.preferences,journeyTheme:'observe'});
 for(const change of [x=>x.session.themePlan=null,x=>x.session.themePlan.cards.scene=['talk-01'],x=>x.session.themePlan.cards.event=[],x=>x.session.themePlan.name='x'.repeat(41),x=>x.session.journeyTheme='unknown',x=>x.preferences.journeyTheme='unknown',x=>x.session.journeyTheme=['observe']]){const raw=structuredClone(s);change(raw);assert.throws(()=>validateBackup(raw));}
 const trial=initialState();newSession(trial,{...trial.preferences,mode:'trial',journeyTheme:'duo'});assert.equal(trial.session.journeyTheme,'mixed');assert.equal(trial.session.themePlan,null);assert.equal(trial.session.scoring,false);assert.equal(validateBackup(trial).session.mode,'trial');
});
