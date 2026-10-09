import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,newSession,draw,complete,setSlotStatus,undo,thresholds,validateBackup} from '../src/lib/domain/core.mjs';
import {journeyProgress,rewardPreview,journeyRoute} from '../src/lib/ui/journey-view.mjs';
import {renderView} from '../src/lib/ui/views.mjs';
import {createDraftKeeper,saveUpdateDraft,restoreUpdateDraft} from '../src/lib/services/drafts.mjs';
import {showCompletion} from '../src/lib/interactions/rewards.mjs';

test('route derives current, later and skipped states without changing legacy records; undo recomputes rewards',()=>{
 const s=initialState();newSession(s,s.preferences);const se=s.session;
 draw(s,se.id,se.slots[0].id);setSlotStatus(s,se.id,se.slots[0].id,'later');
 setSlotStatus(s,se.id,se.slots[1].id,'skipped');draw(s,se.id,se.slots[2].id);
 const before=JSON.stringify(s),p=journeyProgress(se,se.slots[2].id);
 assert.equal(p.current,2);assert.equal(p.remaining,3);assert.match(journeyRoute(se,se.slots[2].id),/later/);
 assert.match(journeyRoute(se,se.slots[2].id),/skipped/);assert.equal(JSON.stringify(s),before);
 assert.deepEqual(validateBackup(s).session,se);assert.match(rewardPreview(se),/还差 8 分/);
 complete(s,se.id,se.slots[2].id,se.slots[2].card.id);assert.match(rewardPreview(se),/还差 5 分/);
 undo(s,se.id);assert.match(rewardPreview(se),/还差 8 分/);
 se.rewards[0]='<script>bad</script>';assert.match(rewardPreview(se),/&lt;script&gt;/);
});

test('short and half thresholds stay fixed; free and unscored views show valid progress without reward goals',()=>{
 for(const [mode,ts] of [['short',[8,11,13]],['half',[12,16,20]]]){const s=initialState();newSession(s,{...s.preferences,mode});assert.deepEqual(thresholds(s.session),ts);assert.match(renderView(s,{},'walk'),/journey-route/);}
 const s=initialState();newSession(s,{...s.preferences,mode:'free'});assert.doesNotMatch(rewardPreview(s.session),/还差|分档/);assert.match(journeyRoute(s.session),/探索 0/);
 s.session.mode='short';s.session.scoring=false;assert.doesNotMatch(rewardPreview(s.session),/还差|分档/);assert.doesNotMatch(renderView(s,{},'walk'),/score-value/);
});

function fixture(){
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
 const cost={id:'actual-cost',type:'number',value:'18.5'},memory={id:'memory',type:'textarea',value:'今天的回忆'};
 const name={id:'walk-name',type:'text',value:'城市绕路'},form={id:'finish-form',querySelectorAll:()=>[memory,name]};
 const elements={'actual-cost':cost,'finish-form':form},doc={getElementById:id=>elements[id]};
 const context={hash:'#walk',session:'session-1',slot:'slot-1',card:'card-1',revision:1};
 return {storage,cost,memory,name,elements,doc,context};
}
test('expense drafts survive rerender, foreground, refresh and revision changes but stay isolated by session, slot and card',()=>{
 const f=fixture(),keeper=createDraftKeeper(f.storage);keeper.capture(f.doc,f.context);
 for(const changes of [{revision:2},{},{}]){f.cost.value='0';createDraftKeeper(f.storage).restore(f.doc,{...f.context,...changes});assert.equal(f.cost.value,'18.5');}
 for(const changes of [{session:'new-session'},{slot:'new-slot'},{card:'new-card'}]){f.cost.value='0';keeper.restore(f.doc,{...f.context,...changes});assert.equal(f.cost.value,'0');}
 keeper.clear('actual-cost',f.context);f.cost.value='0';keeper.restore(f.doc,f.context);assert.equal(f.cost.value,'0');
});
test('closing drafts follow the session, custom editor survives reload, expired drafts are ignored and storage failures keep an in-memory copy',()=>{
 const f=fixture(),keeper=createDraftKeeper(f.storage);keeper.capture(f.doc,f.context,{customEditor:true,libraryType:'event',libraryCompleted:true,libraryDisabled:true});f.memory.value='';keeper.restore(f.doc,{...f.context,card:'changed'});assert.equal(f.memory.value,'今天的回忆');
 assert.deepEqual([keeper.readView(f.context).libraryType,keeper.readView(f.context).libraryCompleted,keeper.readView(f.context).libraryDisabled],['event',true,true]);
 f.memory.value='';keeper.restore(f.doc,{...f.context,session:'other'});assert.equal(f.memory.value,'');
 assert.equal(keeper.readView(f.context).customEditor,true);assert.deepEqual(keeper.readView({...f.context,session:'other'}),{});
 const broken=createDraftKeeper({getItem(){throw Error('blocked');},setItem(){throw Error('full');}});f.cost.value='9';assert.equal(broken.capture(f.doc,f.context),false);f.cost.value='0';broken.restore(f.doc,f.context);assert.equal(f.cost.value,'9');
 const now=Date.now;try{Date.now=()=>now()+13*60*60*1000;f.cost.value='0';keeper.restore(f.doc,f.context);assert.equal(f.cost.value,'0');}finally{Date.now=now;}
});
test('an update draft from the previous version without a slot field restores only the matching card and revision',()=>{
 const store=new Map(),storage={getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
 const input={id:'actual-cost',type:'number',value:'12'},doc={querySelectorAll:()=>[input]};
 const old={hash:'#walk',session:'s',card:'c',revision:3};saveUpdateDraft(doc,storage,old);input.value='0';restoreUpdateDraft(doc,storage,{...old,slot:'k'});assert.equal(input.value,'12');
});
test('ordinary completion uses a brief inline status without a dialog, handles interruption and never shows a score when disabled',async()=>{
 const keys=['document','window','matchMedia','setTimeout','clearTimeout'],saved=Object.fromEntries(keys.map(k=>[k,globalThis[k]]));
 try{for(const reduced of [false,true])for(const trigger of ['timer','hashchange','hidden']){
  const win=new Map(),doc=new Map();let timer,delay,removed=false,tag;
  const stamp={setAttribute(){},remove(){removed=true;}};
  globalThis.document={hidden:false,createElement:t=>{tag=t;return stamp;},querySelector:()=>({append(){}}),addEventListener:(k,v)=>doc.set(k,v),removeEventListener:k=>doc.delete(k)};
  globalThis.window={addEventListener:(k,v)=>win.set(k,v),removeEventListener:k=>win.delete(k)};globalThis.matchMedia=()=>({matches:reduced});
  globalThis.setTimeout=(fn,ms)=>{timer=fn;delay=ms;return 1;};globalThis.clearTimeout=()=>{};
  const done=showCompletion({points:2,scoring:false});assert.equal(tag,'div');assert.equal(delay,420);assert.doesNotMatch(stamp.textContent,/分/);
  if(trigger==='timer')timer();if(trigger==='hashchange')win.get('hashchange')();if(trigger==='hidden'){document.hidden=true;doc.get('visibilitychange')();}
  await done;assert(removed);assert.equal(win.size,0);assert.equal(doc.size,0);
 }}finally{for(const k of keys)if(saved[k]===undefined)delete globalThis[k];else globalThis[k]=saved[k];}
});
