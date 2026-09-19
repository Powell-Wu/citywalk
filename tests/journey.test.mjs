import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,newSession,draw,complete,finish,score} from '../dist/core.mjs';
import {renderView} from '../dist/views.mjs';

function record({scoring=true,mode='short',count=3,closing=true}={}){
 const s=initialState();newSession(s,{...s.preferences,scoring,mode},1000000);
 for(let i=0;i<count;i++){
  const se=s.session;
  const x=mode==='free'?draw(s,se.id,null,'scene',()=>0):se.slots[i];
  if(mode!=='free')draw(s,se.id,x.id,null,()=>0);
  const slot=mode==='free'?se.slots.at(-1):x;
  complete(s,se.id,slot.id,slot.card.id,0,1001000+i);
 }
 const id=finish(s,s.session.id,{name:'<img src=x onerror=alert(1)>',memory:'<script>bad</script>\n今天很好',closing},1060000);
 return {s,html:renderView(s,{},'detail',id)};
}

test('journey recap highlights only the highest earned reward and preserves score breakdown',()=>{
 const {s,html}=record();assert.equal(score(s.history[0]).total,13);
 const loot=html.match(/<section class="journey-loot">[\s\S]*?<\/section>/)[0];
 assert.match(loot,/约好一次喜欢的大餐/);assert.doesNotMatch(loot,/一起吃份甜品/);
 assert.match(html,/三类集齐/);assert.match(html,/一起收尾/);
 assert.match(html,/途中未完成的任务 · 1 张/);
 assert.match(html,/&lt;img/);assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);
 const home=renderView(s,{},'home');assert.match(home,/&lt;img/);assert.doesNotMatch(home,/<img src=x/);
});

test('unscored, free and zero-completion journeys never imply unearned rewards',()=>{
 const unscored=record({scoring:false}).html;
 assert.doesNotMatch(unscored,/本次积分|journey-loot|reward-tiers|task-earned|journey-bonuses/);
 const free=record({mode:'free',count:1}).html;
 assert.doesNotMatch(free,/journey-loot|reward-tiers/);assert.match(free,/本次积分/);
 const empty=record({count:0,closing:false}).html;
 assert.match(empty,/这次还没到奖励分数/);assert.match(empty,/这次没有完成任务卡/);assert.doesNotMatch(empty,/领取这一档奖励/);
});
