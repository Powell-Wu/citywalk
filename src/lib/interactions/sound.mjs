// Original synthesized cues: no downloads, music, or automatic playback.
export function createSounds({Audio=globalThis.AudioContext||globalThis.webkitAudioContext,document=globalThis.document}={}){
 let context,enabled=false;const nodes=new Set();
 const stop=()=>{for(const node of nodes){try{node.stop();}catch{}}nodes.clear();};
 const hidden=()=>{if(document.hidden){stop();context?.suspend().catch(()=>{});}};
 document.addEventListener('visibilitychange',hidden);
 function unlock(){if(!enabled||document.hidden||!Audio)return;try{context??=new Audio();context.resume().catch(()=>{});}catch{}}
 function setEnabled(value){enabled=!!value;if(!enabled){stop();context?.suspend().catch(()=>{});}}
 function play(kind){
  if(!enabled||document.hidden||!context||context.state!=='running')return;
  const notes=kind==='reward'?[523,659,784]:kind==='stamp'?[130]:[380];
  try{notes.forEach((frequency,i)=>{const start=context.currentTime+i*.09,osc=context.createOscillator(),gain=context.createGain();osc.type=kind==='flip'?'triangle':'sine';osc.frequency.setValueAtTime(frequency,start);if(kind==='stamp')osc.frequency.exponentialRampToValueAtTime(65,start+.07);gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.045,start+.008);gain.gain.exponentialRampToValueAtTime(.0001,start+.085);osc.connect(gain);gain.connect(context.destination);nodes.add(osc);osc.onended=()=>{nodes.delete(osc);osc.disconnect();gain.disconnect();};osc.start(start);osc.stop(start+.09);});}catch{}
 }
 return {setEnabled,unlock,play,dispose(){enabled=false;stop();document.removeEventListener('visibilitychange',hidden);context?.close().catch(()=>{});}};
}
