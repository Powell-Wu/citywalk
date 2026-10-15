import {CARDS} from './cards.mjs';
import {THEME_TASKS} from './theme-tasks.mjs';

// Gameplay themes are independent of the visual adventure skin.
export const JOURNEY_THEMES={
 mixed:{name:'随心探索',opening:'让下一张卡决定今天的小冒险。',closing:'各说一个最喜欢的瞬间，再给这次冒险取个名字。'},
 observe:{name:'观察城市',opening:'各找一个平时忽略的细节，再交换你们眼中的城市。',closing:'今天哪个不起眼的细节，因为对方的提醒变得特别？',recap:'把沿途的小发现，拼成了两个人眼中的城市。',cards:{scene:['scene-02','scene-03','scene-04','scene-09','scene-10','scene-11','scene-12','scene-13','scene-14','scene-15'],talk:['talk-03','talk-09','talk-11','talk-12','talk-13','talk-14'],event:['event-03','event-04','event-08','event-10','event-11','event-14']}},
 duo:{name:'默契挑战',opening:'轮流出题、猜一猜、一起决定，看看你们会怎样配合。',closing:'哪次配合让你意外？下一次想怎样交换角色？',recap:'在轮流出题和共同选择中，发现了彼此的新一面。',cards:{scene:['scene-02','scene-03','scene-09','scene-12','scene-14','scene-15'],talk:['talk-04','talk-05','talk-10','talk-11','talk-15','talk-16'],event:['event-01','event-02','event-09','event-12','event-15','event-16']}}
};
export const validJourneyTheme=key=>typeof key==='string'&&Object.hasOwn(JOURNEY_THEMES,key);
export function themeSnapshot(key){return key==='mixed'?null:{id:`${key}-1`,...structuredClone(JOURNEY_THEMES[key]),tasks:structuredClone(THEME_TASKS[key])};}
export function themeAllows(journey,card){return !journey.themePlan||journey.themePlan.cards[card.type].includes(card.id);}
export function validateThemePlan(journey){
 const key=journey.journeyTheme,p=journey.themePlan;
 if(!validJourneyTheme(key)||(journey.mode==='trial'&&key!=='mixed'))throw Error('备份的旅程主题不正确。');
 if(key==='mixed'){if(p!==null)throw Error('备份的旅程主题快照不正确。');return;}
 const text=(value,max)=>typeof value==='string'&&value.trim().length>0&&value.length<=max;
 if(!p||p.id!==`${key}-1`||!text(p.name,40)||!['opening','closing','recap'].every(field=>text(p[field],180))||!p.cards)throw Error('备份的旅程主题快照不正确。');
 for(const type of ['scene','talk','event']){
  const ids=p.cards[type];
  if(!Array.isArray(ids)||ids.length<1||ids.length>16||new Set(ids).size!==ids.length||ids.some(id=>!CARDS.some(card=>card.id===id&&card.type===type)))throw Error('备份的主题卡池不正确。');
 }
 if(Object.hasOwn(p,'tasks')){
  const ids=Object.values(p.cards).flat();
  if(!p.tasks||typeof p.tasks!=='object'||Array.isArray(p.tasks)||Object.keys(p.tasks).length!==ids.length||ids.some(id=>!Object.hasOwn(p.tasks,id)||!['first','action','done'].every(field=>text(p.tasks[id]?.[field],field==='first'?80:180))))throw Error('备份的主题任务做法不正确。');
 }
 if(journey.slots.some(slot=>slot.card&&!themeAllows(journey,slot.card)))throw Error('备份卡片不属于这段主题旅程。');
}
