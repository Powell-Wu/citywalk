import {TYPES,REWARDS,uid,chooseBranch,initialState,allCards,score,elapsed,newSession,activeSession,draw,replaceCard,complete,setSlotStatus,undo,togglePause,finish,validateCustomCard,validateBackup} from '../domain/core.mjs';
import {brand} from '../config/brand';
import {renderTickets,showTicketDownload} from './ticket-export.mjs';
import {createSounds} from '../interactions/sound.mjs';
import {canWriteSchema} from './schema-guard.mjs';
import {readState,updateState} from './storage.mjs';
import {currentSlot,dueText,timeText,esc,button,filterForm} from '../ui/views.mjs';
import {THEMES,themeOf,setTheme,themePicker} from '../ui/themes.mjs';
import {installCardGestures,animateCardExit,animateCardTurn} from '../interactions/swipe.mjs';
import {createUpdater} from './updates.mjs';
import {showCompletion,rewardMilestone} from '../interactions/rewards.mjs';
import {saveUpdateDraft,restoreUpdateDraft,readUpdateView,createDraftKeeper} from './drafts.mjs';

// Svelte owns rendering; these event handlers retain the proven atomic domain operations.
export function createController(app,onRender){
let disposed=false,RELEASE='development';
const lifecycle=new AbortController(),timers=new Set();
const listen=(target,name,handler,options={})=>target?.addEventListener(name,handler,{...options,signal:lifecycle.signal});
const interval=(handler,delay)=>{const timer=setInterval(handler,delay);timers.add(timer);return timer;};

let state=initialState(),ready=false,busy=false,transitioning=false;
let visibleState=state;
const ui={phase:'idle',focusSlot:null,libraryType:'all',libraryFavorites:false,libraryCompleted:false,libraryDisabled:false,customEditor:false,offlineReady:false,storageError:'',schemaMessage:'',updateWaiting:false,updateChecking:false,updateMessage:'联网时会自动检查，也可以手动检查。'};
let draftStorage;try{draftStorage=sessionStorage;}catch{}
const drafts=createDraftKeeper(draftStorage);
let renderedContext=null;
let draftWarning=false;
const discardedDrafts=new Set();
const sounds=createSounds();listen(app,'pointerdown',()=>sounds.unlock());listen(document,'keydown',()=>sounds.unlock());
const draftContext=()=>{const slot=currentSlot(state.session||{slots:[]},ui.focusSlot);return {hash:location.hash,session:state.session?.id||null,slot:slot?.id||null,card:slot?.card?.id||null,revision:state.revision};};
function captureDrafts(){const saved=drafts.capture(document,renderedContext,ui,[...discardedDrafts]);if(!saved&&ready&&!draftWarning){draftWarning=true;toast('草稿暂时只能留在当前页，离开前请完成保存。');}return saved;}
function discardDraft(name){if(renderedContext)drafts.clear(name,renderedContext);discardedDrafts.add(name);}
listen(document,'input',()=>captureDrafts());
listen(document,'change',()=>captureDrafts());
listen(window,'pagehide',()=>captureDrafts());
try{ui.swipeSeen=localStorage.getItem('citywalk-swipe-seen')==='1';}catch{}
const channel=typeof BroadcastChannel!=='undefined'?new BroadcastChannel('citywalk-state'):null;
const route=()=>{const[name,id]=location.hash.slice(1).split('/');return{name:name||'home',id};};
const go=name=>{if(location.hash===`#${name}`)render();else location.hash=name;window.scrollTo({top:0,behavior:'instant'});};
function toast(text){if(disposed)return;const el=document.querySelector('#toast');if(!el)return;el.textContent=text;el.classList.remove('completion-feedback');el.classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('visible'),4200);}
function applyTheme(){
 const theme=themeOf(state);
 gestures?.cancel();
 document.documentElement.dataset.theme=theme;
 document.querySelector('meta[name="theme-color"]').content=THEMES[theme].color;
 try{localStorage.setItem('citywalk-theme',theme);}catch{}
 document.querySelectorAll('[data-theme-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.themeChoice===theme)));
 document.querySelectorAll('[data-theme-status]').forEach(el=>el.textContent=el.dataset.themeStatus===theme?'使用中':'选择');
}
async function chooseTheme(theme){await mutate(s=>setTheme(s,theme));applyTheme();}
function skinsDialog(){
 const d=document.createElement('dialog');d.className='dialog skin-dialog';d.setAttribute('aria-labelledby','skin-title');
 d.innerHTML=`<div class="page-head"><h2 id="skin-title">主题</h2><button type="button" class="btn text" data-close>完成</button></div>${themePicker(state)}`;
 document.body.append(d);d.addEventListener('close',()=>d.remove(),{once:true});
 d.addEventListener('click',async e=>{if(e.target.closest('[data-close]')){d.close();return;}const b=e.target.closest('[data-theme-choice]');if(!b||b.disabled||busy)return;try{await chooseTheme(b.dataset.themeChoice);}catch(err){toast(err.message);}});
 d.showModal();
}
function publish(commitState=false){if(commitState)visibleState=state;if(!disposed)onRender({state:visibleState,ui:{...ui},...route(),ready,release:RELEASE});}
function render(){if(disposed)return;sounds.setEnabled(state.sound);captureDrafts();discardedDrafts.clear();gestures?.cancel();applyTheme();publish(true);renderedContext=draftContext();drafts.restore(document,renderedContext);syncUpdateUI();}
async function mutate(fn){if(busy)throw Error('正在保存，请稍等一下。');busy=true;const priorPhase=ui.phase;if(priorPhase==='idle')ui.phase='saving';publish();try{if(!import.meta.env.DEV&&!navigator.serviceWorker?.controller){await prepareOffline();await Promise.race([navigator.serviceWorker?.ready,new Promise(resolve=>setTimeout(resolve,5000))]);}
 let compatible=await canWriteSchema(navigator.serviceWorker,RELEASE,{development:import.meta.env.DEV});if(!compatible){await new Promise(resolve=>setTimeout(resolve,100));compatible=await canWriteSchema(navigator.serviceWorker,RELEASE,{development:import.meta.env.DEV});}if(!compatible){ui.schemaMessage='还有旧版散步标签未关闭，或离线内容尚未就绪。请先关闭旧标签或在旧标签应用更新，再重试；当前记录与输入已保留。';throw Error(ui.schemaMessage);}ui.schemaMessage='';if(disposed)throw Error('页面已关闭，尚未提交操作。');const r=await updateState(fn);state=r.state;ui.storageError='';channel?.postMessage(state.revision);return r.result;}catch(e){if(/存储|保存|读取|中断/.test(e.message||''))ui.storageError=e.message;throw e;}finally{busy=false;if(priorPhase==='idle')ui.phase='idle';publish();}}
function confirmBox(title,text,yes='确认'){return new Promise(resolve=>{const d=document.createElement('dialog');d.className='dialog';d.innerHTML=`<h2>${esc(title)}</h2><p>${esc(text)}</p><div class="actions"><button class="btn outline" data-choice="no">先不改</button><button class="btn" data-choice="yes">${esc(yes)}</button></div>`;document.body.append(d);let settled=false;const end=v=>{if(settled)return;settled=true;lifecycle.signal.removeEventListener('abort',cancel);d.close();d.remove();resolve(v);};const cancel=()=>end(false);d.addEventListener('close',cancel,{once:true});lifecycle.signal.addEventListener('abort',cancel,{once:true});d.addEventListener('cancel',e=>{e.preventDefault();end(false);});d.addEventListener('click',e=>{const choice=e.target.closest('[data-choice]')?.dataset.choice;if(choice)end(choice==='yes');});d.showModal();});}
function filtersDialog(){if(!state.session)return;const d=document.createElement('dialog');d.className='dialog';d.innerHTML=filterForm(state.session);document.body.append(d);drafts.restore(document,draftContext());d.querySelector('[data-close]').onclick=()=>d.close();d.addEventListener('close',()=>d.remove(),{once:true});d.showModal();}
const gestures=installCardGestures(app,{
 enabled:()=>ready&&!busy&&!transitioning&&themeOf(state)==='adventure'&&!state.session?.pausedAt&&!document.querySelector('dialog[open]'),
 commit:async(action,data)=>{const ok=await performCardAction(action,data);if(ok){ui.swipeSeen=true;try{localStorage.setItem('citywalk-swipe-seen','1');}catch{}app.querySelector('.swipe-guide')?.remove();}return ok;}
});
async function performCardAction(action,d){
 if(busy||transitioning)return false;
 const input=document.querySelector('#actual-cost');
 if(action==='complete'&&input&&!input.reportValidity())return false;
 const oldCard=app.querySelector('.task-card');
 const animated=themeOf(state)==='adventure';
 const before=state.session?score(state.session).total:0;
 const previousFocus=document.activeElement;
 const restoreFocus=oldCard?.contains(previousFocus)||['complete','replace'].includes(previousFocus?.dataset?.action);
 let exitAnimation;
 transitioning=true;ui.phase=action==='replace'?'replacing':'completing';
 try{
  const changed=await mutate(s=>action==='replace'?replaceCard(s,d.session,d.slot,d.card):complete(s,d.session,d.slot,d.card,input?Number(input.value):0));
  if(disposed)return !!changed;
  if(action==='complete'&&!changed){render();return false;}
  discardDraft('actual-cost');
  if(action==='complete')ui.focusSlot=null;
  // Persist first. A failed save must never animate a successful decision.
  sounds.play(action==='replace'?'flip':rewardMilestone(state.session,before)?'reward':'stamp');
  if(animated)exitAnimation=await animateCardExit(oldCard,action,lifecycle.signal);
  // A successful write remains successful even if a subsequent refresh cannot read.
  try{state=await readState();}catch{}
  render();
  exitAnimation?.cancel();exitAnimation=null;
  window.scrollTo({top:0,behavior:'instant'});
  if(animated){app.querySelector('.task-card')?.classList.add('card-enter');if(state.session&&score(state.session).total>before)app.querySelector('.score-value')?.classList.add('score-pop');}
  if(restoreFocus){const next=app.querySelector('.card-reverse')||app.querySelector('.task-card h2')||app.querySelector('main h1');if(next?.tagName!=='BUTTON')next?.setAttribute('tabindex','-1');next?.focus({preventScroll:true});}
  if(animated&&action==='complete')await showCompletion({signal:lifecycle.signal,points:score(state.session).total-before,scoring:state.session.scoring,milestone:rewardMilestone(state.session,before)});
  const gained=state.session?score(state.session).total-before:0;
  if(action==='replace')toast('已换卡');
  else if(!animated)toast(gained>0?`任务完成 · +${gained} 分`:'任务完成');
  return true;
 }catch(e){toast(e.message||'刚才的操作没有成功，请重试。');return false;}
 finally{exitAnimation?.cancel();transitioning=false;ui.phase='idle';publish();}
}
listen(app,'click',async event=>{const b=event.target.closest('[data-action]');if(!b||busy||transitioning)return;const d=b.dataset;try{switch(d.action){
case'skins':skinsDialog();return;
case'set-theme':await chooseTheme(d.themeChoice);return;
case'nav':go(d.route);return;
case'reload':await boot();return;
case'start-trial':await mutate(s=>{newSession(s,{...s.preferences,mode:'trial'});draw(s,s.session.id,s.session.slots[0].id);});ui.focusSlot=null;go('walk');return;
case'branch':await mutate(s=>chooseBranch(s,d.session,d.branch));break;
case'export-ticket':{const latest=await readState(),journey=latest.history.find(x=>x.id===d.id);if(!journey)throw Error('这段记录已变化，请重新打开。');const blobs=await renderTickets(journey,brand.shortName);if(!disposed)showTicketDownload(blobs,journey.name,toast);return;}
case'toggle-sound':{sounds.setEnabled(!state.sound);sounds.unlock();try{await mutate(s=>{s.sound=!s.sound;});}finally{sounds.setEnabled(state.sound);}break;}
case'filter-completed':ui.libraryCompleted=!ui.libraryCompleted;break;
case'filter-disabled':ui.libraryDisabled=!ui.libraryDisabled;break;
case'draw':{const oldCard=app.querySelector('.task-card');let turn;transitioning=true;ui.phase='drawing';try{ui.focusSlot=await mutate(s=>draw(s,d.session,d.slot,d.type));sounds.play('flip');turn=await animateCardTurn(oldCard,false,lifecycle.signal);render();turn?.cancel();turn=null;turn=await animateCardTurn(app.querySelector('.task-card'),true,lifecycle.signal);const card=app.querySelector('.task-card');card?.focus({preventScroll:true});}finally{turn?.cancel();transitioning=false;ui.phase='idle';publish();}return;}
case'replace':case'complete':await performCardAction(d.action,d);return;
case'later':await mutate(s=>setSlotStatus(s,d.session,d.slot,'later'));ui.focusSlot=null;toast('已移到稍后');break;
case'skip':await mutate(s=>setSlotStatus(s,d.session,d.slot,'skipped'));ui.focusSlot=null;break;
case'pause':await mutate(s=>togglePause(s,d.session));break;
case'focus':ui.focusSlot=d.slot;break;
case'undo':if(await confirmBox('撤销最近一次完成？','这张卡会回到待完成，相关分数和任务花费也会恢复。','撤销完成'))ui.focusSlot=await mutate(s=>undo(s,d.session));break;
case'bonus':{const before=score(state.session).total;await mutate(s=>{const se=activeSession(s,d.session);if(!['surprise','laugh'].includes(d.key))throw Error('奖励不存在。');se.bonuses[d.key]=!se.bonuses[d.key];});const milestone=rewardMilestone(state.session,before);if(milestone){sounds.play('reward');transitioning=true;try{await showCompletion({signal:lifecycle.signal,points:score(state.session).total-before,milestone});}finally{transitioning=false;}}break;}
case'filters':filtersDialog();return;
case'filter-type':ui.libraryType=d.type;break;
case'filter-favorites':ui.libraryFavorites=!ui.libraryFavorites;break;
case'show-editor':ui.customEditor=!ui.customEditor;break;
case'favorite':case'disable-card':await mutate(s=>{if(!allCards(s).some(c=>c.id===d.card))throw Error('卡片不存在。');const key=d.action==='favorite'?'favorites':'disabled';s[key]=s[key].includes(d.card)?s[key].filter(x=>x!==d.card):[...s[key],d.card];});break;
case'export':await exportBackup();return;
case'import':document.querySelector('#backup-file').click();return;
case'delete-history':if(await confirmBox('删除这段回忆？','只删除当前设备的这条记录。删除后无法撤销。','删除记录')){await mutate(s=>{s.history=s.history.filter(x=>x.id!==d.id);});go('history');return;}break;
case'check-offline':await updater.check(true);await checkCache();return;
case'check-update':await updater.check(true);return;
case'apply-update':await applyUpdate();return;
}render();}catch(e){toast(e.message||'刚才的操作没有成功，请重试。');if(ui.storageError)render();}});
listen(document,'submit',async event=>{const f=event.target;if(!['setup-form','finish-form','reward-form','card-form','filters-form'].includes(f.id))return;event.preventDefault();if(busy||transitioning||!f.reportValidity())return;const data=new FormData(f),submit=f.querySelector('[type="submit"]');submit.disabled=true;try{switch(f.id){
case'setup-form':await mutate(s=>{newSession(s,{mode:data.get('mode'),place:data.get('place'),budget:Number(data.get('budget')),scoring:data.has('scoring'),rewards:s.preferences.rewards});if(s.session.mode==='trial')draw(s,s.session.id,s.session.slots[0].id);});discardDraft('setup-form');ui.focusSlot=null;go('walk');break;
case'finish-form':{const before=score(state.session).total;const id=await mutate(s=>finish(s,f.dataset.session,{name:data.get('name'),memory:data.get('memory'),closing:data.has('closing')}));discardDraft('finish-form');go(`detail/${id}`);toast('记录已保存');const saved=state.history.find(h=>h.id===id),milestone=rewardMilestone(saved,before);if(milestone){transitioning=true;try{await showCompletion({signal:lifecycle.signal,points:score(saved).total-before,milestone});}finally{transitioning=false;}}break;}
case'reward-form':await mutate(s=>{s.preferences.rewards=[0,1,2].map(i=>String(data.get(`reward${i}`)).trim().slice(0,80)||REWARDS[i]);});discardDraft('reward-form');toast('奖励已保存，下局生效');break;
case'card-form':{const card={id:'custom-'+uid(),type:data.get('type'),text:String(data.get('text')).trim(),note:String(data.get('note')).trim(),minutes:Number(data.get('minutes')),cost:Number(data.get('cost')),place:data.get('place'),source:'custom'};validateCustomCard(card);await mutate(s=>{if(s.customCards.length>=500)throw Error('自定义卡片已达到500张上限。');s.customCards.push(card);});discardDraft('card-form');ui.customEditor=false;ui.libraryType='all';ui.libraryFavorites=false;toast('卡片已添加');break;}
case'filters-form':await mutate(s=>{const se=activeSession(s,f.dataset.session);const budget=Number(data.get('budget')),place=data.get('place');if(se.mode==='trial')throw Error('试玩使用零消费任务，其他设置留到正式散步吧。');if(!Number.isFinite(budget)||budget<0||budget>10000||!['both','indoor','outdoor'].includes(place))throw Error('请检查预算和场景。');se.budget=budget;se.place=place;});discardDraft('filters-form');f.closest('dialog').close();toast('筛选已更新');break;
}render();}catch(e){toast(e.message||'保存失败，请重试。');if(ui.storageError){const p=document.createElement('p');p.className='storage-error';p.textContent=ui.storageError;f.prepend(p);}}finally{submit.disabled=false;}});
async function exportBackup(){const latest=await readState();const blob=new Blob([JSON.stringify(latest,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`一起走走-备份-${new Date().toISOString().slice(0,10)}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);toast('备份已生成，请在下载文件中确认保存。');}
listen(app,'change',async e=>{if(e.target.id!=='backup-file')return;const file=e.target.files[0];if(!file)return;try{if(file.size>5*1024*1024)throw Error('备份文件超过5MB，请选择有效的文字备份。');let raw;try{raw=JSON.parse(await file.text());}catch{throw Error('文件不是有效的JSON备份。');}const clean=validateBackup(raw);if(!await confirmBox('用备份替换本机记录？',`备份有 ${clean.history.length} 段历史、${clean.customCards.length} 张自定义卡${clean.session?'和一局进行中的散步':''}。当前记录将被替换。`,'导入并替换'))return;await mutate(s=>{const revision=s.revision;Object.assign(s,clean,{revision});});drafts.clearAll();renderedContext=null;ui.focusSlot=null;render();toast('备份已恢复到这部设备。');}catch(e){toast(e.message);}finally{e.target.value='';}});
listen(window,'hashchange',()=>{if(ready)render();});
listen(channel,'message',async()=>{if(transitioning)return;try{state=await readState();applyTheme();if(!document.querySelector('dialog[open]')&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))render();else toast('记录在另一页有更新，当前输入为你保留。');}catch(e){toast(e.message);}});
listen(document,'visibilitychange',async()=>{if(document.hidden){captureDrafts();return;}if(ready&&!busy&&!transitioning){try{state=await readState();applyTheme();if(['walk','home','history','detail'].includes(route().name))render();}catch(e){toast(e.message);}}});
interval(()=>{const se=state.session;if(document.hidden||!se||route().name!=='walk')return;const clock=document.querySelector('[data-elapsed]');if(clock)clock.textContent=timeText(elapsed(se));const due=document.querySelector('[data-due]');if(due)due.textContent=dueText(se,currentSlot(se,ui.focusSlot));},15000);
function syncUpdateUI(){
 document.querySelectorAll('[data-update-status]').forEach(el=>el.textContent=ui.updateMessage);
 document.querySelectorAll('[data-current-version]').forEach(el=>el.textContent=RELEASE);
 document.querySelectorAll('[data-action="check-update"]').forEach(el=>{el.disabled=ui.updateChecking;el.textContent=ui.updateChecking?'正在检查…':'检查更新';});
 document.querySelectorAll('[data-action="apply-update"],[data-update-banner]').forEach(el=>el.classList.toggle('hidden',!ui.updateWaiting));
}
async function applyUpdate(){
 if(busy||transitioning)return;
 try{
  // Preserve unsaved text locally before the user-requested reload.
  try{saveUpdateDraft(document,sessionStorage,draftContext(),ui);}
  catch{if(!await confirmBox('更新前先保存文字','当前浏览器无法暂存输入。散步记录不会丢失，但尚未保存的文字会在刷新后清空。','仍然刷新'))return;}
  await updater.apply();
 }catch(e){toast(e.message||'更新暂未完成，请重试。');}
}
const updater=createUpdater({serviceWorker:navigator.serviceWorker,secure:window.isSecureContext,signal:lifecycle.signal,onChange:s=>{
 ui.updateWaiting=s.available;ui.updateChecking=s.checking;ui.updateMessage=s.message;publish();syncUpdateUI();
},reload:()=>location.reload()});
async function checkCache(){try{if(!('caches' in window))return;const cache=await caches.open('citywalk-static-'+RELEASE);ui.offlineReady=!!await cache.match(new URL('./offline-ready',document.baseURI).href);document.querySelectorAll('[data-offline]').forEach(el=>el.textContent=ui.offlineReady?'✓ 离线内容已准备好':'离线尚未准备好，请联网打开并等待片刻。');}catch{ui.offlineReady=false;}}
async function prepareOffline(){if(import.meta.env.DEV)return;await updater.check();await checkCache();reportClientVersion();publish();}
const reportClientVersion=()=>navigator.serviceWorker?.controller?.postMessage({type:'CLIENT_VERSION',version:RELEASE,schema:2});
listen(navigator.serviceWorker,'message',e=>{if(e.data?.type==='CACHE_READY'){checkCache();reportClientVersion();}if(e.data?.type==='VERSION_REQUEST')reportClientVersion();});
listen(navigator.serviceWorker,'controllerchange',reportClientVersion);
listen(window,'online',()=>updater.check());
listen(document,'visibilitychange',()=>{if(document.visibilityState==='visible'&&ready)updater.check();});
interval(()=>{if(document.visibilityState==='visible')updater.check();},15*60*1000);
let registered=false;
function registerAgentTools(){const ctx=document.modelContext;if(!ctx?.registerTool||registered)return;registered=true;const list=[{name:'read_citywalk_state',description:'Read the current shared-phone walk, score and current card without altering records.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute(input={}){if(Object.keys(input).length)throw Error('No arguments accepted');const se=state.session;return se?{id:se.id,mode:se.mode,score:score(se),paused:!!se.pausedAt,current:currentSlot(se,ui.focusSlot)}:{active:false,historyCount:state.history.length};}},{name:'draw_citywalk_card',description:'Draw a card in the active walk using the same filters and deduplication as the interface. Does not mark it complete.',inputSchema:{type:'object',properties:{type:{type:'string',enum:['scene','talk','event']}},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},async execute(input={}){if(transitioning)throw Error('Wait for the current card');if(Object.keys(input).some(k=>k!=='type')||(input.type&&!TYPES[input.type]))throw Error('Invalid card type');if(!state.session)throw Error('Start a walk in the interface first');const se=state.session,x=currentSlot(se,ui.focusSlot);if(x&&x.status!=='waiting')throw Error('Current card must be finished or skipped first');if(!x&&!input.type)throw Error('Choose a card type');ui.focusSlot=await mutate(s=>draw(s,se.id,x?.id,input.type));go('walk');render();return{card:state.session.slots.find(x=>x.id===ui.focusSlot).card};}}];for(const tool of list){try{Promise.resolve(ctx.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}}
async function boot(){try{state=await readState();ready=true;ui.storageError='';Object.assign(ui,drafts.readView(draftContext()));try{Object.assign(ui,readUpdateView(sessionStorage));}catch{}render();try{restoreUpdateDraft(document,sessionStorage,draftContext());}catch{}registerAgentTools();prepareOffline();}catch(e){ready=false;ui.storageError=e.message;publish();}}
void (async()=>{try{if(!import.meta.env.DEV){const response=await fetch(new URL('release.json',document.baseURI));if(!response.ok)throw Error('版本信息读取失败');RELEASE=(await response.json()).version;}}catch(error){ui.storageError=error.message;publish();return;}if(!disposed)await boot();})();
return {dispose(){captureDrafts();disposed=true;lifecycle.abort();for(const timer of timers)clearInterval(timer);clearTimeout(toast.timer);gestures.destroy();sounds.dispose();channel?.close();document.querySelectorAll('dialog.dialog,dialog.reward-dialog').forEach(dialog=>dialog.close());}};
}
