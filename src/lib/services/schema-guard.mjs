// An open original client can still mutate v1; never expose a trial to it.
// Ask on every write (worker memory may have been suspended between gestures).
export async function canWriteSchema(serviceWorker,version,{development=false,timeout=2500}={}){
 if(development)return true;
 // Reloading during first activation can create a page just after claim().
 // Talk to the active registration too, so the user's first gesture can finish.
 const controller=serviceWorker?.controller||(await serviceWorker?.getRegistration())?.active;if(!controller)return false;
 controller.postMessage({type:'CLIENT_VERSION',version,schema:2});
 return new Promise(resolve=>{
  const channel=new MessageChannel();let settled=false;
  const finish=value=>{if(settled)return;settled=true;clearTimeout(timer);channel.port1.close();channel.port2.close();resolve(value);};
  const timer=setTimeout(()=>finish(false),timeout);
  channel.port1.onmessage=event=>finish(event.data?.compatible===true);
  try{controller.postMessage({type:'CAN_WRITE_SCHEMA',schema:2,claim:!serviceWorker.controller},[channel.port2]);}catch{finish(false);}
 });
}
