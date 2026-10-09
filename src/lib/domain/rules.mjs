// JSON schema and IndexedDB version are deliberately independent.
export const SCHEMA_VERSION=2;
export const LEGACY_PLANS={short:['scene','talk','event','talk'],half:['scene','talk','event','scene','talk','event','talk'],free:[]};
export const LEGACY_POINTS={scene:2,talk:2,event:3};
export const BRANCHES={
 clues:{name:'寻找街角线索',recap:'把城市的小细节串成了我们的线索。',talk:['talk-09','talk-13'],event:['event-14','event-16']},
 sounds:{name:'观察城市声音',recap:'从听见的声音里，接出了两个人的故事。',talk:['talk-10','talk-12'],event:['event-09','event-15']}
};
export const TRIAL_FIRST=['scene-09','scene-12','scene-14'];
export function ruleSnapshot(mode){
 const sequence=mode==='trial'?['scene','talk','event']:[...LEGACY_PLANS[mode]];
 const goal=mode==='free'||mode==='trial'?0:sequence.reduce((n,type)=>n+LEGACY_POINTS[type],0)+4;
 return {id:mode==='trial'?'trial-1':'classic-1',sequence,typePoints:{...LEGACY_POINTS},trio:2,bonus:1,closing:4,target:goal,thresholds:goal?[Math.ceil(goal*.6),Math.ceil(goal*.8),goal]:[]};
}
export function slotPoints(slot,journey){return slot.points??journey.rules?.typePoints[slot.type]??LEGACY_POINTS[slot.type];}
export function sessionRules(journey){return journey.rules||ruleSnapshot(journey.mode);}
export function validateRules(journey){
 const r=journey.rules,number=n=>Number.isInteger(n)&&n>=0&&n<=100;
 if(!r||!['classic-1','trial-1'].includes(r.id)||(journey.mode==='trial')!==(r.id==='trial-1')||!Array.isArray(r.sequence)||JSON.stringify(r.sequence)!==JSON.stringify(ruleSnapshot(journey.mode).sequence)||!r.typePoints||!Object.keys(LEGACY_POINTS).every(type=>number(r.typePoints[type]))||![r.trio,r.bonus,r.closing,r.target].every(number)||!Array.isArray(r.thresholds)||![0,3].includes(r.thresholds.length)||r.thresholds.some((n,i)=>!number(n)||(i>0&&n<r.thresholds[i-1]))||(r.target===0)!==(r.thresholds.length===0)||(r.thresholds.length&&r.thresholds[2]!==r.target)||journey.slots.some(x=>!number(x.points)||x.points!==r.typePoints[x.type]))throw Error('备份的规则快照不正确。');
 if(journey.mode==='trial'&&(journey.budget!==0||journey.scoring||!(journey.branch===null||Object.hasOwn(BRANCHES,journey.branch))||journey.slots.some((x,i)=>i>0&&x.card&&!journey.branch)))throw Error('备份的试玩安排不正确。');
 if(journey.mode==='trial'&&journey.slots.some((x,i)=>x.card&&(x.card.cost!==0||x.card.minutes<3||x.card.minutes>5||!(i===0?TRIAL_FIRST:BRANCHES[journey.branch]?.[x.type]||[]).includes(x.card.id))))throw Error('备份的试玩卡片不正确。');
 if(journey.mode!=='trial'&&journey.branch!==null)throw Error('备份的旅程方向不正确。');
}
