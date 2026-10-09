import test from 'node:test';
import assert from 'node:assert/strict';
import {CARDS,initialState,newSession,draw,complete,finish} from '../src/lib/domain/core.mjs';
import {TASK_ART,cardArtKey} from '../src/lib/ui/art.mjs';
import {rewardMilestone,showCompletion} from '../src/lib/interactions/rewards.mjs';
import {renderView} from '../src/lib/ui/views.mjs';

test('every built-in task has a curated illustration; sensory and collaboration cards are not generic routes',()=>{
 assert.deepEqual(Object.keys(TASK_ART).sort(),CARDS.map(c=>c.id).sort());
 for(const [id,key] of [['scene-14','sound'],['event-04','photo'],['event-14','photo'],['event-15','sound'],['event-01','cooperate'],['event-12','cooperate'],['scene-03','talk'],['event-08','challenge']])assert.equal(cardArtKey(CARDS.find(c=>c.id===id)),key);
 for(const [text,key] of [['拍照寻找颜色','photo'],['听一首歌','sound'],['轮流做动作','cooperate'],['喝一杯茶','shop']])assert.equal(cardArtKey({type:'event',text}),key);
 assert.equal(cardArtKey({type:'talk',text:'想象买一间店'}),'talk');
});

test('reward milestones only occur on newly crossed tiers and select highest tier',()=>{
 const s=initialState();newSession(s,s.preferences);const se=s.session;
 for(let i=0;i<3;i++){const x=se.slots[i];draw(s,se.id,x.id);complete(s,se.id,x.id,x.card.id);}
 assert.deepEqual(rewardMilestone(se,4),{points:8,name:se.rewards[0]});
 assert.equal(rewardMilestone(se,9),null);
 se.closing=true;assert.deepEqual(rewardMilestone(se,7),{points:13,name:se.rewards[2]});
 se.scoring=false;assert.equal(rewardMilestone(se,0),null);
 const free=initialState();newSession(free,{...free.preferences,mode:'free'});assert.equal(rewardMilestone(free.session,0),null);
});

test('milestone dialog safely displays custom reward and waits for dismissal, reduced motion included',async()=>{
 const keys=['document','window','matchMedia','setTimeout','clearTimeout','location'],saved=Object.fromEntries(keys.map(k=>[k,globalThis[k]]));
 try{for(const reduced of [true,false]){
  let click,timers=0,removed=false;const handlers={};
  const layer={open:false,classList:{add(){}},setAttribute(){},addEventListener(k,v){handlers[k]=v;},querySelector(){return{addEventListener(k,v){click=v;}};},showModal(){this.open=true;},close(){this.open=false;handlers.close?.();},remove(){removed=true;}};
  globalThis.document={body:{append(){}},createElement:()=>layer,addEventListener(){},removeEventListener(){}};
  const events=new Map();globalThis.window={addEventListener:(k,v)=>events.set(k,v),removeEventListener:k=>events.delete(k)};globalThis.matchMedia=()=>({matches:reduced});globalThis.location={hash:'#detail/record-1'};
  globalThis.setTimeout=()=>{timers++;return 1;};globalThis.clearTimeout=()=>{};
  const done=showCompletion({points:2,milestone:{points:8,name:'<img onerror=bad>'}});
  assert.equal(timers,0);assert.match(layer.innerHTML,/&lt;img/);assert.match(layer.className,/reward-milestone/);
  events.get('hashchange')({newURL:'https://walk.example/#detail/record-1'});assert.equal(removed,false,'entering the recap must not dismiss its own reward');
  click();await done;assert(removed);
 }}finally{for(const k of keys)if(saved[k]===undefined)delete globalThis[k];else globalThis[k]=saved[k];}
});

test('collection filtering and journal text remain safe with the redesigned views',()=>{
 const s=initialState();s.customCards.push({id:'custom-safe',type:'talk',text:'<script>bad</script>',note:'<img>',minutes:5,cost:0,place:'both'});s.favorites.push('custom-safe');
 const html=renderView(s,{libraryType:'talk',libraryFavorites:true},'library');
 assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);assert.match(html,/1 张任务/);assert.match(html,/aria-pressed="true"/);
 newSession(s,s.preferences);finish(s,s.session.id,{name:'<b>名字</b>',memory:'<script>回忆</script>',closing:false});
 const journal=renderView(s,{},'history');assert.match(journal,/&lt;b&gt;/);assert.doesNotMatch(journal,/<script>/);
});
