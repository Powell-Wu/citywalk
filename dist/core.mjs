import {restoreTheme} from './themes.mjs';
import {CARDS,TYPES} from './cards.mjs';
export {CARDS,TYPES};
export const MODES={short:{name:'轻轻走一会',duration:75,sequence:['scene','talk','event','talk']},half:{name:'把半天留给我们',duration:240,sequence:['scene','talk','event','scene','talk','event','talk']},free:{name:'自由走走',duration:0,sequence:[]}};
export const REWARDS=['一起吃份甜品','由你挑选下次约会','约好一次喜欢的大餐'];
export const uid=()=>globalThis.crypto.randomUUID();
export function initialState(){return{version:1,revision:0,theme:'adventure',session:null,history:[],customCards:[],disabled:[],favorites:[],preferences:{mode:'short',place:'both',budget:0,scoring:true,rewards:[...REWARDS]},offlineReady:false};}
export function allCards(s){return [...CARDS,...s.customCards];}
export function score(session){const done=session.slots.filter(x=>x.status==='done');const base=done.reduce((n,x)=>n+TYPES[x.type].points,0);const trio=new Set(done.map(x=>x.type)).size===3?2:0;const bonus=Number(session.bonuses.surprise)+Number(session.bonuses.laugh);return{base,trio,bonus,closing:session.closing?4:0,total:base+trio+bonus+(session.closing?4:0),count:done.length};}
export function spent(session){return Math.round(session.slots.filter(x=>x.status==='done').reduce((n,x)=>n+(x.spent||0),0)*100)/100;}
export function target(session){return session.mode==='free'?0:MODES[session.mode].sequence.reduce((n,t)=>n+TYPES[t].points,0)+4;}
export function thresholds(session){const t=target(session);return t?[Math.ceil(t*.6),Math.ceil(t*.8),t]:[];}
export function elapsed(session,now=Date.now()){return Math.max(0,(session.pausedAt||session.endedAt||now)-session.startedAt-session.pausedMs);}
export function eligible(s,type){const session=s.session;return allCards(s).filter(c=>c.type===type&&!s.disabled.includes(c.id)&&!session.seen.includes(c.id)&&(session.place==='both'||c.place==='both'||c.place===session.place)&&c.cost<=Math.max(0,session.budget-spent(session)));}
export function newSession(s,config,now=Date.now()){
 if(s.session)throw Error('请先结束当前散步。');
 if(!MODES[config.mode]||!['both','indoor','outdoor'].includes(config.place)||!Number.isFinite(config.budget)||config.budget<0||config.budget>10000)throw Error('请检查散步设置。');
 s.preferences={...config,rewards:config.rewards.map((x,i)=>String(x).trim().slice(0,80)||REWARDS[i])};
 s.session={id:uid(),...s.preferences,startedAt:now,pausedAt:null,pausedMs:0,endedAt:null,seen:[],slots:MODES[config.mode].sequence.map(type=>({id:uid(),type,status:'waiting',card:null,completedAt:null,spent:0})),bonuses:{surprise:false,laugh:false},closing:false,name:'',memory:''};
}
export function activeSession(s,id){if(!s.session||s.session.id!==id)throw Error('这局散步已变化，请重新打开。');return s.session;}
export function draw(s,sessionId,slotId,type,rng=Math.random){const se=activeSession(s,sessionId);if(se.pausedAt)throw Error('请先继续散步。');let slot=se.slots.find(x=>x.id===slotId);if(!slot&&se.mode!=='free')throw Error('找不到这张卡的位置。');if(slot&&slot.status!=='waiting')throw Error('这张卡已经抽过了。');type=slot?.type||type;if(!TYPES[type])throw Error('请选择一种卡片。');const pool=eligible(s,type);if(!pool.length)throw Error('没有符合条件的新卡了。可以调整预算或场景，也可以跳过这个节点。');const card=pool[Math.min(pool.length-1,Math.floor(rng()*pool.length))];if(!slot){slot={id:uid(),type,status:'waiting',card:null,spent:0,completedAt:null};se.slots.push(slot);}slot.card={...card};slot.status='active';se.seen.push(card.id);return slot.id;}
export function replaceCard(s,sessionId,slotId,expectedCardId,rng=Math.random){const se=activeSession(s,sessionId);if(se.pausedAt)throw Error('请先继续散步。');const slot=se.slots.find(x=>x.id===slotId);if(!slot||!['active','later'].includes(slot.status)||slot.card.id!==expectedCardId)throw Error('这张卡已经变化，请刷新查看。');const pool=eligible(s,slot.type);if(!pool.length)throw Error('同类新卡暂时用完了，可以保留这张或跳过。');slot.card={...pool[Math.min(pool.length-1,Math.floor(rng()*pool.length))]};slot.status='active';se.seen.push(slot.card.id);}
export function complete(s,sessionId,slotId,cardId,cost=0,now=Date.now()){const se=activeSession(s,sessionId);if(se.pausedAt)throw Error('请先继续散步。');const slot=se.slots.find(x=>x.id===slotId);if(!slot||slot.card?.id!==cardId)throw Error('任务已变化，请重新查看。');if(slot.status==='done')return false;if(!['active','later'].includes(slot.status))throw Error('请先抽卡。');if(!Number.isFinite(cost)||cost<0||cost>10000)throw Error('请输入有效的实际花费。');slot.status='done';slot.spent=Math.round(cost*100)/100;slot.completedAt=now;return true;}
export function setSlotStatus(s,id,slotId,status){const se=activeSession(s,id);if(se.pausedAt)throw Error('请先继续散步。');const slot=se.slots.find(x=>x.id===slotId);if(!slot||slot.status==='done'||!['later','skipped','active'].includes(status))throw Error('当前任务无法这样操作。');if(status!=='skipped'&&!slot.card)throw Error('请先抽一张卡。');slot.status=status;}
export function undo(s,id){const se=activeSession(s,id);const slot=se.slots.filter(x=>x.status==='done').reverse().sort((a,b)=>b.completedAt-a.completedAt)[0];if(!slot)throw Error('还没有可以撤销的完成记录。');slot.status='active';slot.completedAt=null;slot.spent=0;return slot.id;}
export function togglePause(s,id,now=Date.now()){const se=activeSession(s,id);if(se.pausedAt){se.pausedMs+=now-se.pausedAt;se.pausedAt=null;}else se.pausedAt=now;}
export function finish(s,id,{name,memory,closing},now=Date.now()){const se=activeSession(s,id);if(se.pausedAt){se.pausedMs+=now-se.pausedAt;se.pausedAt=null;}se.closing=!!closing;se.name=String(name||'一起走走的一天').trim().slice(0,80);se.memory=String(memory||'').trim().slice(0,1000);se.endedAt=now;s.history.unshift(se);s.history=s.history.slice(0,300);s.session=null;return se.id;}
const validId=v=>typeof v==='string'&&/^[a-zA-Z0-9-]{1,100}$/.test(v);
const validType=v=>['scene','talk','event'].includes(v);
const validTime=v=>Number.isSafeInteger(v)&&v>=0&&v<=8640000000000000;
const textWithin=(v,max)=>typeof v==='string'&&v.length<=max;
function validateCard(c){if(!c||!validId(c.id)||!validType(c.type)||!textWithin(c.text,200)||!c.text.trim()||!textWithin(c.note,500)||!Number.isFinite(c.cost)||c.cost<0||c.cost>10000||!Number.isFinite(c.minutes)||c.minutes<1||c.minutes>120||!['both','indoor','outdoor'].includes(c.place))throw Error('卡片的内容或格式不正确。');}
export function validateCustomCard(c){validateCard(c);if(!c.id.startsWith('custom-'))throw Error('自定义卡片编号不正确。');}
function validateConfig(c){if(!c||!['short','half','free'].includes(c.mode)||!['both','indoor','outdoor'].includes(c.place)||typeof c.scoring!=='boolean'||!Number.isFinite(c.budget)||c.budget<0||c.budget>10000||!Array.isArray(c.rewards)||c.rewards.length!==3||c.rewards.some(x=>!textWithin(x,80)))throw Error('备份的散步设置不正确。');}
function validSession(se,ended){
 validateConfig(se);
 if(!validId(se.id)||!validTime(se.startedAt)||!Number.isSafeInteger(se.pausedMs)||se.pausedMs<0||!(se.pausedAt===null||validTime(se.pausedAt))||!(se.endedAt===null||validTime(se.endedAt))||(se.endedAt!==null)!==ended||!Array.isArray(se.seen)||se.seen.length>10000||se.seen.some(x=>!validId(x))||!Array.isArray(se.slots)||se.slots.length>10000||!textWithin(se.name,80)||!textWithin(se.memory,1000)||typeof se.closing!=='boolean'||!se.bonuses||typeof se.bonuses.surprise!=='boolean'||typeof se.bonuses.laugh!=='boolean')throw Error('备份的行程记录不正确。');
 if(ended&&(se.endedAt<se.startedAt||se.pausedAt!==null||se.pausedMs>se.endedAt-se.startedAt))throw Error('备份的行程时间不正确。');
 if(se.mode!=='free'&&(se.slots.length!==MODES[se.mode].sequence.length||se.slots.some((x,i)=>x?.type!==MODES[se.mode].sequence[i])))throw Error('备份的任务安排不完整。');
 const ids=new Set();for(const x of se.slots){if(!x||!validId(x.id)||ids.has(x.id)||!validType(x.type)||!['waiting','active','later','done','skipped'].includes(x.status)||!Number.isFinite(x.spent)||x.spent<0||x.spent>10000)throw Error('备份中有无效任务。');ids.add(x.id);if(x.card){validateCard(x.card);if(x.card.type!==x.type)throw Error('备份卡片类别不一致。');}else if(['active','later','done'].includes(x.status))throw Error('备份中有缺失卡片。');if(x.status==='done'&&!validTime(x.completedAt))throw Error('备份中有无效完成记录。');}
}
export function validateBackup(raw){
 if(!raw||raw.version!==1||!Array.isArray(raw.history)||raw.history.length>300||!Array.isArray(raw.customCards)||raw.customCards.length>500||!Array.isArray(raw.disabled)||!Array.isArray(raw.favorites)||!(raw.session===null||typeof raw.session==='object'))throw Error('这不是支持的备份文件。');
 validateConfig(raw.preferences);raw.customCards.forEach(validateCustomCard);if(new Set(raw.customCards.map(x=>x.id)).size!==raw.customCards.length)throw Error('自定义卡片编号重复。');for(const a of [raw.disabled,raw.favorites])if(a.length>1000||a.some(x=>!validId(x)))throw Error('备份的卡片偏好不正确。');raw.history.forEach(x=>validSession(x,true));if(raw.session)validSession(raw.session,false);const sessionIds=[...raw.history.map(x=>x.id),...(raw.session?[raw.session.id]:[])];if(new Set(sessionIds).size!==sessionIds.length)throw Error('备份的行程编号重复。');const clean=initialState();restoreTheme(clean,raw.theme);for(const key of ['session','history','customCards','disabled','favorites','preferences'])clean[key]=structuredClone(raw[key]);return clean;
}
