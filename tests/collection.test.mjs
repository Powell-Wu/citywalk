import test from 'node:test';
import assert from 'node:assert/strict';
import {completedCards,achievements,pickCard} from '../src/lib/domain/collection.mjs';
import {initialState,newSession,draw,complete,finish,undo,eligible,CARDS} from '../src/lib/domain/core.mjs';
test('recent-three preference is a soft weight, with hard filters and session deduplication intact',()=>{
 const s=initialState(),pool=CARDS.filter(x=>x.type==='scene').slice(0,2);s.history=[{slots:[{status:'done',card:pool[0]}]}];assert.equal(pickCard(s,pool,()=>.4).id,pool[1].id);
 s.history=Array.from({length:3},()=>({slots:[]})).concat(s.history);assert.equal(pickCard(s,pool,()=>.4).id,pool[0].id);
 newSession(s,s.preferences);s.disabled=CARDS.filter(x=>x.type==='scene'&&x.id!==pool[0].id).map(x=>x.id);s.history=[{slots:[{status:'done',card:pool[0]}]}];assert.deepEqual(eligible(s,'scene').map(x=>x.id),[pool[0].id]);draw(s,s.session.id,s.session.slots[0].id);assert.equal(s.session.slots[0].card.id,pool[0].id);assert.equal(eligible(s,'scene').length,0);
});
test('completed card counts and badges derive from current and retained history; undo and deletion recompute',()=>{
 const s=initialState();assert(achievements(s).every(x=>!x.earned));newSession(s,s.preferences);assert(achievements(s)[0].earned);
 for(const x of s.session.slots.slice(0,3)){draw(s,s.session.id,x.id);complete(s,s.session.id,x.id,x.card.id);}
 assert(achievements(s)[1].earned);assert.equal(completedCards(s).size,3);undo(s,s.session.id);assert.equal(achievements(s)[1].earned,false);assert.equal(completedCards(s).size,2);
 finish(s,s.session.id,{name:'一程',memory:'',closing:false});assert.equal(completedCards(s).size,2);s.history=[];assert.equal(completedCards(s).size,0);assert(achievements(s).every(x=>!x.earned));
});
