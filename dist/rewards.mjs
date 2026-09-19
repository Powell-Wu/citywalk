// Presentation only: points and completion are persisted before this runs.
export function showCompletion({points=0,scoring=true}={}){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 return new Promise(resolve=>{
  const layer=document.createElement('dialog');
  layer.className='reward-dialog';layer.setAttribute('aria-label','任务完成');
  layer.innerHTML=`<div class="reward-scene" aria-hidden="true"><img class="chest chest-closed" src="./chest-closed.webp" alt=""><img class="chest chest-open" src="./chest-open.webp" alt=""><img class="loot-badge" src="./explorer-badge.webp" alt=""><i class="loot-spark s1">✦</i><i class="loot-spark s2">✦</i></div><h2>任务完成</h2><p>${scoring?`+${Number(points)||0} 积分`:'又发现一段共同回忆'}</p><button type="button" class="btn text" data-dismiss>继续冒险</button>`;
  let timer,ended=false;
  const end=()=>{if(ended)return;ended=true;clearTimeout(timer);window.removeEventListener('hashchange',end);document.removeEventListener('visibilitychange',hidden);if(layer.open)layer.close();layer.remove();resolve();};
  const hidden=()=>{if(document.hidden)end();};
  layer.addEventListener('cancel',e=>{e.preventDefault();end();});
  layer.addEventListener('close',end);
  layer.querySelector('[data-dismiss]').addEventListener('click',end);
  window.addEventListener('hashchange',end);document.addEventListener('visibilitychange',hidden);
  document.body.append(layer);
  try{layer.showModal();layer.classList.add(reduced?'reward-still':'reward-playing');timer=setTimeout(end,reduced?650:1500);}catch{end();}
 });
}
