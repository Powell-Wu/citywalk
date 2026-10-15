export function completedCards(state){
 const counts=new Map();for(const journey of [state.session,...state.history].filter(Boolean))for(const slot of journey.slots)if(slot.status==='done'&&slot.card)counts.set(slot.card.id,(counts.get(slot.card.id)||0)+1);
 return counts;
}
export function achievements(state){
 const journeys=[state.session,...state.history].filter(Boolean),distinct=completedCards(state).size;
 return [
  {id:'departure',name:'第一次出发',condition:'开始过一局散步',earned:journeys.length>0,progress:journeys.length?'已出发':'等待出发'},
  {id:'trio',name:'三类同行',condition:'在同一局完成观察、对话、合作三类卡',earned:journeys.some(se=>new Set(se.slots.filter(x=>x.status==='done').map(x=>x.type)).size===3),progress:'同一局三类任务'},
  {id:'discoveries',name:'新的眼光',condition:'完成过 8 张不同任务',earned:distinct>=8,progress:`${Math.min(distinct,8)} / 8 张`},
  ...['observe','duo'].map(theme=>({id:`theme-${theme}`,name:theme==='observe'?'城市观察章':'默契同行章',condition:`完成一程${theme==='observe'?'观察城市':'默契挑战'}并勾选一起收尾`,earned:state.history.some(journey=>completeThemeJourney(journey,theme)),progress:'计划卡全部完成；自由模式集齐三类任务'})),
  {id:'sixteen',name:'十六个新发现',condition:'完成过 16 张不同任务',earned:distinct>=16,progress:`${Math.min(distinct,16)} / 16 张`}
 ];
}
export function completeThemeJourney(journey,theme){return journey.journeyTheme===theme&&journey.endedAt!==null&&journey.closing&&journey.slots.length>0&&journey.slots.every(slot=>slot.status==='done')&&(journey.mode!=='free'||new Set(journey.slots.map(slot=>slot.type)).size===3);}
export function keepsakeSummary(state,id){
 const index=state.history.findIndex(journey=>journey.id===id);if(index<0)return{newBadges:[],next:null,nextTheme:'observe'};
 const earlier={...state,session:null,history:state.history.slice(index+1)},after={...earlier,history:state.history.slice(index)};
 after.history=[state.history[index],...earlier.history];
 const prior=new Set(achievements(earlier).filter(badge=>badge.earned).map(badge=>badge.id)),badges=achievements(state),nextTheme=state.history[index].journeyTheme==='observe'?'duo':'observe';
 const next=badges.find(badge=>badge.id===`theme-${nextTheme}`&&!badge.earned)||badges.find(badge=>!badge.earned)||null;
 return{newBadges:achievements(after).filter(badge=>badge.earned&&!prior.has(badge.id)),next,nextTheme};
}
export function pickCard(state,pool,rng=Math.random){
 // Preferences soften recent repetition, never remove a hard-filtered candidate.
 const recent=new Set(state.history.slice(0,3).flatMap(se=>se.slots.filter(x=>x.status==='done'&&x.card).map(x=>x.card.id)));
 const weights=pool.map(card=>recent.has(card.id)?.25:1),total=weights.reduce((a,b)=>a+b,0);
 let needle=Math.min(.999999999999,Math.max(0,rng()))*total;
 for(let i=0;i<pool.length;i++){needle-=weights[i];if(needle<0)return pool[i];}
 return pool.at(-1);
}
