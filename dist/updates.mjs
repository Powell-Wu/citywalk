// Check only; activating an update is an explicit action so walks/forms stay intact.
export function createUpdater({serviceWorker,secure,onChange,reload,now=Date.now}) {
 let registration,registrationPromise,inFlight,applying=false,refreshing=false,lastCheck=0;
 let controlled=!!serviceWorker?.controller;
 let state={available:false,checking:false,message:'联网时会自动检查，也可以手动检查。'};
 const watched=new WeakSet();
 const emit=patch=>{state={...state,...patch};onChange({...state});};
 const refresh=()=>{if(!refreshing){refreshing=true;reload();}};
 const inspect=()=>{
  if(registration?.waiting&&serviceWorker.controller)emit({available:true,message:'新版本已下载，点击应用更新即可使用。'});
 };
 function watch(worker){
  if(!worker||watched.has(worker))return;watched.add(worker);
  worker.addEventListener('statechange',()=>{inspect();if(worker.state==='redundant'&&!registration?.waiting)emit({message:'新版下载未完成，请联网后重试。'});});
 }
 async function register(){
  if(!serviceWorker||!secure)throw Error('更新与离线功能需要 HTTPS 网址或本机 localhost。');
  if(!registrationPromise)registrationPromise=serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).then(reg=>{
   registration=reg;reg.addEventListener('updatefound',()=>watch(reg.installing));watch(reg.installing);inspect();return reg;
  }).catch(error=>{registrationPromise=null;throw error;});
  return registrationPromise;
 }
 const controllerChanged=()=>{
  if(applying){refresh();return;}
  if(!controlled){controlled=!!serviceWorker.controller;return;}
  // Another tab may have activated the new worker. Do not discard this tab's draft.
  if(serviceWorker.controller)emit({available:true,message:'网站已更新，点击应用更新刷新本页。'});
 };
 serviceWorker?.addEventListener('controllerchange',controllerChanged);
 async function check(manual=false){
  if(inFlight)return inFlight;
  if(!manual&&lastCheck&&now()-lastCheck<60000)return;
  lastCheck=now();emit({checking:true,message:'正在检查服务器上的版本…'});
  inFlight=(async()=>{
   try{
    const reg=await register();await reg.update();
    const worker=reg.installing;
    if(worker&& !['installed','activated','redundant'].includes(worker.state))await new Promise(resolve=>{
     const done=()=>{if(['installed','activated','redundant'].includes(worker.state)){clearTimeout(timer);worker.removeEventListener('statechange',done);resolve();}};
     const timer=setTimeout(()=>{worker.removeEventListener('statechange',done);resolve();},20000);
     worker.addEventListener('statechange',done);done();
    });
    inspect();
    if(!state.available)emit({message:reg.installing?'新版正在下载，完成后会提示。':'未发现待应用的新版本。若刚刚发布，请稍后再检查。'});
   }catch(error){emit({message:!secure||!serviceWorker?error.message:'检查失败，请确认网络连接后重试；当前离线内容仍可使用。'});}
   finally{emit({checking:false});inFlight=null;}
  })();
  return inFlight;
 }
 async function apply(){
  if(applying)return;
  const reg=await register();
  if(!state.available&&!reg.waiting){await check(true);return;}
  applying=true;emit({message:'正在应用更新，稍后会刷新页面…'});
  if(reg.waiting){
   reg.waiting.postMessage({type:'SKIP_WAITING'});
   const timer=setTimeout(()=>{if(!refreshing){applying=false;emit({message:'更新尚未完成，请稍后再点应用更新。'});}},12000);
   timer.unref?.();
  }else refresh();
 }
 return {check,apply,getState:()=>({...state})};
}
