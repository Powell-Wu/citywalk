import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {CARDS,initialState,newSession,draw} from '../dist/core.mjs';
import {cardArt} from '../dist/art.mjs';
import {renderView} from '../dist/views.mjs';
import {showCompletion} from '../dist/rewards.mjs';

test('task art is stable, all built-in and custom card types resolve to packaged offline assets',()=>{
 const sw=readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');
 const covered=new Set();
 for(const card of [...CARDS,...['scene','talk','event'].map(type=>({type,text:'自定义任务'}))]){
  const art=cardArt(card);assert.deepEqual(cardArt({...card}),art);covered.add(art.src);
  assert(existsSync(new URL('../dist/'+art.src,import.meta.url)));
  assert(sw.includes(`'./${art.src}'`));
 }
 assert.equal(covered.size,6);
 for(const file of ['card-back.webp','chest-closed.webp','chest-open.webp','explorer-badge.webp'])assert(sw.includes(`'./${file}'`));
});

test('default task actions are inside collapsed disclosure; paused cards cannot swipe',()=>{
 const s=initialState();newSession(s,s.preferences);draw(s,s.session.id,s.session.slots[0].id);
 const html=renderView(s,{},'walk');
 const disclosure=html.match(/<details class="card-options">([\s\S]*?)<\/details>/)?.[0];
 assert(disclosure);assert.match(disclosure,/data-action="complete"/);assert.match(disclosure,/data-action="replace"/);
 assert.doesNotMatch(html.replace(disclosure,''),/data-action="(?:complete|replace)"/);
 assert.match(html,/data-swipe-card/);assert.match(html,/class="task-art"/);
 assert.doesNotMatch(renderView(s,{swipeSeen:true},'walk'),/class="swipe-guide"/);
 s.session.pausedAt=Date.now();const paused=renderView(s,{},'walk');
 assert.doesNotMatch(paused,/data-swipe-card/);assert.match(paused,/data-action="complete"[^>]*disabled/);
});

test('completion can be dismissed or interrupted without leaving dialog listeners or scoring side effects',async()=>{
 const globals=['document','window','matchMedia'];const original=Object.fromEntries(globals.map(k=>[k,globalThis[k]]));
 try{
  for(const reduced of [false,true])for(const trigger of ['button','cancel','hashchange','hidden']){
   const handlers={},win=new Map(),doc=new Map();let removed=false,click;
   const layer={open:false,classList:{add(value){handlers.mode=value;}},setAttribute(){},addEventListener(k,v){handlers[k]=v;},querySelector(){return{addEventListener(k,v){click=v;}};},showModal(){this.open=true;},close(){this.open=false;handlers.close?.();},remove(){removed=true;}};
   globalThis.document={hidden:false,createElement:()=>layer,body:{append(){}},addEventListener:(k,v)=>doc.set(k,v),removeEventListener:k=>doc.delete(k)};
   globalThis.window={addEventListener:(k,v)=>win.set(k,v),removeEventListener:k=>win.delete(k)};
   globalThis.matchMedia=()=>({matches:reduced});
   const done=showCompletion({points:2,scoring:false});
   assert.equal(handlers.mode,reduced?'reward-still':'reward-playing');assert.doesNotMatch(layer.innerHTML,/\+2 积分/);
   if(trigger==='button')click();
   if(trigger==='cancel')handlers.cancel({preventDefault(){}});
   if(trigger==='hashchange')win.get('hashchange')();
   if(trigger==='hidden'){document.hidden=true;doc.get('visibilitychange')();}
   await done;assert(removed);assert.equal(win.size,0);assert.equal(doc.size,0);assert.equal(layer.open,false);
  }
 }finally{for(const k of globals)if(original[k]===undefined)delete globalThis[k];else globalThis[k]=original[k];}
});
