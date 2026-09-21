import {score,thresholds} from './core.mjs';
const escapeText=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function rewardMilestone(session,before){
 if(!session?.scoring)return null;
 const total=score(session).total,ts=thresholds(session);
 const index=ts.reduce((best,t,i)=>before<t&&total>=t?i:best,-1);
 return index<0?null:{points:ts[index],name:session.rewards[index]};
}
// Presentation only: points and completion are persisted before this runs.
export function showCompletion({points=0,scoring=true,milestone=null}={}){
 milestone=scoring?milestone:null;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 return new Promise(resolve=>{
  const layer=document.createElement('dialog');
  layer.className=`reward-dialog${milestone?' reward-milestone':''}`;layer.setAttribute('aria-label',milestone?'奖励已解锁':'任务完成');
  layer.innerHTML=`<div class="reward-scene" aria-hidden="true"><img class="chest chest-closed" src="./chest-closed.webp" alt=""><img class="chest chest-open" src="./chest-open.webp" alt=""><img class="loot-badge" src="./explorer-badge.webp" alt=""><i class="loot-spark s1">✦</i><i class="loot-spark s2">✦</i></div><h2>${milestone?'奖励已解锁':'任务完成'}</h2><p>${scoring?`+${Number(points)||0} 积分`:'又发现一段共同回忆'}</p>${milestone?`<div class="milestone-prize"><strong>${escapeText(milestone.name)}</strong><span>${Number(milestone.points)} 分档 · 结束时按最高档领取</span></div>`:''}<button type="button" class="btn ${milestone?'block':'text'}" data-dismiss>继续冒险</button>`;
  let timer,ended=false;
  const end=()=>{if(ended)return;ended=true;clearTimeout(timer);window.removeEventListener('hashchange',end);document.removeEventListener('visibilitychange',hidden);if(layer.open)layer.close();layer.remove();resolve();};
  const hidden=()=>{if(document.hidden)end();};
  layer.addEventListener('cancel',e=>{e.preventDefault();end();});
  layer.addEventListener('close',end);
  layer.querySelector('[data-dismiss]').addEventListener('click',end);
  window.addEventListener('hashchange',end);document.addEventListener('visibilitychange',hidden);
  document.body.append(layer);
  try{layer.showModal();layer.classList.add(reduced?'reward-still':'reward-playing');if(!milestone)timer=setTimeout(end,reduced?650:1150);}catch{end();}
 });
}
