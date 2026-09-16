import {TYPES,REWARDS,uid,initialState,allCards,score,elapsed,newSession,activeSession,draw,replaceCard,complete,setSlotStatus,undo,togglePause,finish,validateCustomCard,validateBackup} from './core.mjs';
import {readState,updateState} from './storage.mjs';
import {renderView,currentSlot,dueText,timeText,esc,button,filterForm} from './views.mjs';
import {THEMES,themeOf,setTheme,themePicker} from './themes.mjs';
import {installCardGestures,animateCardExit} from './swipe.mjs';
const app=document.querySelector('#app');
let state=initialState(),ready=false,busy=false,transitioning=false,updateWaiting=null;
const ui={focusSlot:null,libraryType:'all',libraryFavorites:false,customEditor:false,offlineReady:false,storageError:'',updateWaiting:false};
const channel=typeof BroadcastChannel!=='undefined'?new BroadcastChannel('citywalk-state'):null;
const route=()=>{const[name,id]=location.hash.slice(1).split('/');return{name:name||'home',id};};
const go=name=>{if(location.hash===`#${name}`)render();else location.hash=name;window.scrollTo({top:0,behavior:'instant'});};
function toast(text){const el=document.querySelector('#toast');el.textContent=text;el.classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('visible'),4200);}
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
 d.innerHTML=`<div class="page-head"><h2 id="skin-title">给今天换个心情</h2><button type="button" class="btn text" data-close>完成</button></div><p class="help">随时切换，散步进度和当前输入都会保留。</p>${themePicker(state)}`;
 document.body.append(d);d.addEventListener('close',()=>d.remove(),{once:true});
 d.addEventListener('click',async e=>{if(e.target.closest('[data-close]')){d.close();return;}const b=e.target.closest('[data-theme-choice]');if(!b||busy)return;try{await chooseTheme(b.dataset.themeChoice);}catch(err){toast(err.message);}});
 d.showModal();
}
function render(){gestures?.cancel();applyTheme();const{name,id}=route();app.innerHTML=renderView(state,ui,name,id);}
async function mutate(fn){if(busy)throw Error('正在保存，请稍等一下。');busy=true;try{const r=await updateState(fn);state=r.state;ui.storageError='';channel?.postMessage(state.revision);return r.result;}catch(e){if(/存储|保存|读取|中断/.test(e.message||''))ui.storageError=e.message;throw e;}finally{busy=false;}}
function confirmBox(title,text,yes='确认'){return new Promise(resolve=>{const d=document.createElement('dialog');d.className='dialog';d.innerHTML=`<h2>${esc(title)}</h2><p>${esc(text)}</p><div class="actions"><button class="btn outline" data-choice="no">先不改</button><button class="btn" data-choice="yes">${esc(yes)}</button></div>`;document.body.append(d);let settled=false;const end=v=>{if(settled)return;settled=true;d.close();d.remove();resolve(v);};d.addEventListener('cancel',e=>{e.preventDefault();end(false);});d.addEventListener('click',e=>{const choice=e.target.closest('[data-choice]')?.dataset.choice;if(choice)end(choice==='yes');});d.showModal();});}
function filtersDialog(){if(!state.session)return;const d=document.createElement('dialog');d.className='dialog';d.innerHTML=filterForm(state.session);document.body.append(d);d.querySelector('[data-close]').onclick=()=>d.close();d.addEventListener('close',()=>d.remove(),{once:true});d.showModal();}
const gestures=installCardGestures(app,{
 enabled:()=>ready&&!busy&&!transitioning&&themeOf(state)==='story'&&!state.session?.pausedAt&&!document.querySelector('dialog[open]'),
 commit:performCardAction
});
async function performCardAction(action,d){
 if(busy||transitioning)return false;
 const input=document.querySelector('#actual-cost');
 if(action==='complete'&&input&&!input.reportValidity())return false;
 const oldCard=app.querySelector('.task-card');
 const story=themeOf(state)==='story';
 const before=state.session?score(state.session).total:0;
 const previousFocus=document.activeElement;
 const restoreFocus=oldCard?.contains(previousFocus);
 let exitAnimation;
 transitioning=true;
 try{
  await mutate(s=>action==='replace'?replaceCard(s,d.session,d.slot,d.card):complete(s,d.session,d.slot,d.card,input?Number(input.value):0));
  if(action==='complete')ui.focusSlot=null;
  // Persist first. A failed save must never animate a successful decision.
  if(story)exitAnimation=await animateCardExit(oldCard,action);
  // A successful write remains successful even if a subsequent refresh cannot read.
  try{state=await readState();}catch{}
  render();
  if(story){app.querySelector('.task-card')?.classList.add('card-enter');if(state.session&&score(state.session).total>before)app.querySelector('.score-value')?.classList.add('score-pop');}
  if(restoreFocus){const next=app.querySelector('.task-card h2')||app.querySelector('main h1');next?.setAttribute('tabindex','-1');next?.focus({preventScroll:true});}
  toast(action==='replace'?'换一张，看看下个故事。':'这件小事，记下了。');
  return true;
 }catch(e){toast(e.message||'刚才的操作没有成功，请重试。');return false;}
 finally{exitAnimation?.cancel();transitioning=false;}
}
app.addEventListener('click',async event=>{const b=event.target.closest('[data-action]');if(!b||busy||transitioning)return;const d=b.dataset;try{switch(d.action){
case'skins':skinsDialog();return;
case'set-theme':await chooseTheme(d.themeChoice);return;
case'nav':go(d.route);return;
case'reload':await boot();return;
case'draw':ui.focusSlot=await mutate(s=>draw(s,d.session,d.slot,d.type));render();if(themeOf(state)==='story')app.querySelector('.task-card')?.classList.add('card-enter');return;
case'replace':case'complete':await performCardAction(d.action,d);return;
case'later':await mutate(s=>setSlotStatus(s,d.session,d.slot,'later'));ui.focusSlot=null;toast('留到稍后，随时回来做。');break;
case'skip':await mutate(s=>setSlotStatus(s,d.session,d.slot,'skipped'));ui.focusSlot=null;break;
case'pause':await mutate(s=>togglePause(s,d.session));break;
case'focus':ui.focusSlot=d.slot;break;
case'undo':if(await confirmBox('撤销最近一次完成？','这张卡会回到待完成，相关分数和任务花费也会恢复。','撤销完成'))ui.focusSlot=await mutate(s=>undo(s,d.session));break;
case'bonus':await mutate(s=>{const se=activeSession(s,d.session);if(!['surprise','laugh'].includes(d.key))throw Error('奖励不存在。');se.bonuses[d.key]=!se.bonuses[d.key];});break;
case'filters':filtersDialog();return;
case'filter-type':ui.libraryType=d.type;break;
case'filter-favorites':ui.libraryFavorites=!ui.libraryFavorites;break;
case'show-editor':ui.customEditor=!ui.customEditor;break;
case'favorite':case'disable-card':await mutate(s=>{if(!allCards(s).some(c=>c.id===d.card))throw Error('卡片不存在。');const key=d.action==='favorite'?'favorites':'disabled';s[key]=s[key].includes(d.card)?s[key].filter(x=>x!==d.card):[...s[key],d.card];});break;
case'export':await exportBackup();return;
case'import':document.querySelector('#backup-file').click();return;
case'delete-history':if(await confirmBox('删除这段回忆？','只删除当前设备的这条记录。删除后无法撤销。','删除记录')){await mutate(s=>{s.history=s.history.filter(x=>x.id!==d.id);});go('history');return;}break;
case'check-offline':await prepareOffline();toast(ui.offlineReady?'离线内容已准备好。':'还未准备完成，请确认网络连接后再试。');break;
case'apply-update':if(updateWaiting&&!state.session)updateWaiting.postMessage({type:'SKIP_WAITING'});return;
}render();}catch(e){toast(e.message||'刚才的操作没有成功，请重试。');if(ui.storageError)render();}});
document.addEventListener('submit',async event=>{const f=event.target;if(!['setup-form','finish-form','reward-form','card-form','filters-form'].includes(f.id))return;event.preventDefault();if(busy||transitioning||!f.reportValidity())return;const data=new FormData(f),submit=f.querySelector('[type="submit"]');submit.disabled=true;try{switch(f.id){
case'setup-form':await mutate(s=>newSession(s,{mode:data.get('mode'),place:data.get('place'),budget:Number(data.get('budget')),scoring:data.has('scoring'),rewards:s.preferences.rewards}));ui.focusSlot=null;go('walk');break;
case'finish-form':{const id=await mutate(s=>finish(s,f.dataset.session,{name:data.get('name'),memory:data.get('memory'),closing:data.has('closing')}));go(`detail/${id}`);toast('今天的回忆，已经收好了。');break;}
case'reward-form':await mutate(s=>{s.preferences.rewards=[0,1,2].map(i=>String(data.get(`reward${i}`)).trim().slice(0,80)||REWARDS[i]);});toast('奖励已保存，下次出发就用它。');break;
case'card-form':{const card={id:'custom-'+uid(),type:data.get('type'),text:String(data.get('text')).trim(),note:String(data.get('note')).trim(),minutes:Number(data.get('minutes')),cost:Number(data.get('cost')),place:data.get('place'),source:'custom'};validateCustomCard(card);await mutate(s=>{if(s.customCards.length>=500)throw Error('自定义卡片已达到500张上限。');s.customCards.push(card);});ui.customEditor=false;ui.libraryType='all';ui.libraryFavorites=false;toast('你的卡片，已经放进盒子里。');break;}
case'filters-form':await mutate(s=>{const se=activeSession(s,f.dataset.session);const budget=Number(data.get('budget')),place=data.get('place');if(!Number.isFinite(budget)||budget<0||budget>10000||!['both','indoor','outdoor'].includes(place))throw Error('请检查预算和场景。');se.budget=budget;se.place=place;});f.closest('dialog').close();toast('后面的抽卡会按新设置进行。');break;
}render();}catch(e){toast(e.message||'保存失败，请重试。');if(ui.storageError){const p=document.createElement('p');p.className='storage-error';p.textContent=ui.storageError;f.prepend(p);}}finally{submit.disabled=false;}});
async function exportBackup(){const latest=await readState();const blob=new Blob([JSON.stringify(latest,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`一起走走-备份-${new Date().toISOString().slice(0,10)}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);toast('备份已生成，请在下载文件中确认保存。');}
app.addEventListener('change',async e=>{if(e.target.id!=='backup-file')return;const file=e.target.files[0];if(!file)return;try{if(file.size>5*1024*1024)throw Error('备份文件超过5MB，请选择有效的文字备份。');let raw;try{raw=JSON.parse(await file.text());}catch{throw Error('文件不是有效的JSON备份。');}const clean=validateBackup(raw);if(!await confirmBox('用备份替换本机记录？',`备份有 ${clean.history.length} 段历史、${clean.customCards.length} 张自定义卡${clean.session?'和一局进行中的散步':''}。当前记录将被替换。`,'导入并替换'))return;await mutate(s=>{const revision=s.revision;Object.assign(s,clean,{revision});});ui.focusSlot=null;render();toast('备份已恢复到这部设备。');}catch(e){toast(e.message);}finally{e.target.value='';}});
window.addEventListener('hashchange',()=>{if(ready)render();});
channel?.addEventListener('message',async()=>{if(transitioning)return;try{state=await readState();applyTheme();if(!document.querySelector('dialog[open]')&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))render();else toast('记录在另一页有更新，当前输入为你保留。');}catch(e){toast(e.message);}});
document.addEventListener('visibilitychange',async()=>{if(document.visibilityState==='visible'&&ready&&!busy&&!transitioning){try{state=await readState();applyTheme();if(['walk','home','history','detail'].includes(route().name))render();}catch(e){toast(e.message);}}});
setInterval(()=>{const se=state.session;if(!se||route().name!=='walk')return;const clock=document.querySelector('[data-elapsed]');if(clock)clock.textContent=timeText(elapsed(se));const due=document.querySelector('[data-due]');if(due)due.textContent=dueText(se,currentSlot(se,ui.focusSlot));},15000);
async function checkCache(){try{if(!('caches' in window))return;ui.offlineReady=!!await caches.match(new URL('./offline-ready',document.baseURI).href);document.querySelectorAll('[data-offline]').forEach(el=>el.textContent=ui.offlineReady?'✓ 离线内容已准备好':'离线尚未准备好，请联网打开并等待片刻。');}catch{ui.offlineReady=false;}}
async function prepareOffline(){if(!('serviceWorker' in navigator)||!window.isSecureContext)return;try{const reg=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});updateWaiting=reg.waiting;ui.updateWaiting=!!reg.waiting;reg.addEventListener('updatefound',()=>{reg.installing?.addEventListener('statechange',()=>{if(reg.waiting){updateWaiting=reg.waiting;ui.updateWaiting=true;if(!state.session)toast('有新版本，下次空闲时可在设置中更新。');}checkCache();});});await checkCache();reg.active?.postMessage({type:'CHECK_CACHE'});}catch{ui.offlineReady=false;}}
let refreshing=false;navigator.serviceWorker?.addEventListener('controllerchange',()=>{checkCache();if(updateWaiting&&!state.session&&!refreshing){refreshing=true;location.reload();}});navigator.serviceWorker?.addEventListener('message',e=>{if(e.data?.type==='CACHE_READY')checkCache();});
let registered=false;
function registerAgentTools(){const ctx=document.modelContext;if(!ctx?.registerTool||registered)return;registered=true;const lifecycle=new AbortController();window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});const list=[{name:'read_citywalk_state',description:'Read the current shared-phone walk, score and current card without altering records.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute(input={}){if(Object.keys(input).length)throw Error('No arguments accepted');const se=state.session;return se?{id:se.id,mode:se.mode,score:score(se),paused:!!se.pausedAt,current:currentSlot(se,ui.focusSlot)}:{active:false,historyCount:state.history.length};}},{name:'draw_citywalk_card',description:'Draw a card in the active walk using the same filters and deduplication as the interface. Does not mark it complete.',inputSchema:{type:'object',properties:{type:{type:'string',enum:['scene','talk','event']}},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},async execute(input={}){if(transitioning)throw Error('Wait for the current card');if(Object.keys(input).some(k=>k!=='type')||(input.type&&!TYPES[input.type]))throw Error('Invalid card type');if(!state.session)throw Error('Start a walk in the interface first');const se=state.session,x=currentSlot(se,ui.focusSlot);if(x&&x.status!=='waiting')throw Error('Current card must be finished or skipped first');if(!x&&!input.type)throw Error('Choose a card type');ui.focusSlot=await mutate(s=>draw(s,se.id,x?.id,input.type));go('walk');render();return{card:state.session.slots.find(x=>x.id===ui.focusSlot).card};}}];for(const tool of list){try{Promise.resolve(ctx.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}}
async function boot(){try{state=await readState();ready=true;ui.storageError='';render();registerAgentTools();prepareOffline();}catch(e){ready=false;ui.storageError=e.message;app.innerHTML=`<div class="shell"><div class="panel"><h1>先把回忆安顿好</h1><p>${esc(e.message)}</p><p>为避免记录丢失，暂时没有开始新一局。请使用普通浏览窗口，检查网站存储权限后重试。</p>${button('重新打开','reload','','block')}</div></div>`;}}
await boot();
