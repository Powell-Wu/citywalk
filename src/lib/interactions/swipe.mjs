// Distance and direction both matter: a vertical scroll must never choose a card.
export const swipeThreshold = width => Math.min(120, Math.max(72, width * .28));
export function swipeIntent(dx, dy, width) {
  if (Math.abs(dx) < swipeThreshold(width) || Math.abs(dx) < Math.abs(dy) * 1.25) return null;
  return dx > 0 ? 'complete' : 'replace';
}
export const motionDuration = reduced => reduced ? 0 : 260;
async function waitForAnimation(animation,signal){
 const cancel=()=>animation.cancel(),hidden=()=>{if(document.hidden)cancel();};
 window.addEventListener('hashchange',cancel);document.addEventListener('visibilitychange',hidden);signal?.addEventListener('abort',cancel,{once:true});
 if(signal?.aborted)cancel();
 try{await animation.finished;}catch{}finally{window.removeEventListener('hashchange',cancel);document.removeEventListener('visibilitychange',hidden);signal?.removeEventListener('abort',cancel);}
}
export async function animateCardTurn(card,reveal=false,signal){
 if(!card?.isConnected||!card.animate||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const animation=card.animate(reveal?[{transform:'rotateY(-90deg)'},{transform:'rotateY(0)'}]:[{transform:'rotateY(0)'},{transform:'rotateY(90deg)'}],{duration:170,easing:reveal?'ease-out':'ease-in',fill:'forwards'});
 await waitForAnimation(animation,signal);
 return animation;
}

export function installCardGestures(root, {enabled, commit}) {
  const lifecycle=new AbortController();
  const listen=(target,name,fn,options={})=>target.addEventListener(name,fn,{...options,signal:lifecycle.signal});
  let gesture = null, suppressClickUntil = 0;
  const reset = card => {
    if (!card) return;
    card.classList.remove('is-dragging','swipe-ready');
    card.style.removeProperty('transform');
    card.style.removeProperty('--left-choice');card.style.removeProperty('--right-choice');
    const stage=card.closest?.('.card-stage');
    stage?.style.removeProperty('--left-choice');stage?.style.removeProperty('--right-choice');stage?.classList.remove('swipe-ready');
  };
  const cancel = () => {const g=gesture;gesture=null;if(g){reset(g.card);if(g.card.hasPointerCapture?.(g.id))g.card.releasePointerCapture(g.id);}};
  listen(root,'pointerdown',e=>{
    if(gesture){cancel();return;}
    const card=e.target.closest('[data-swipe-card]');
    if(!card||!enabled()||e.isPrimary===false||e.button!==0||e.target.closest('button,input,textarea,select,a,label,summary'))return;
    gesture={card,id:e.pointerId,x:e.clientX,y:e.clientY,dx:0,dy:0,axis:null,width:card.getBoundingClientRect().width};
  });
  listen(root,'pointermove',e=>{
    const g=gesture;if(!g||e.pointerId!==g.id)return;
    if(!enabled()){cancel();return;}
    g.dx=e.clientX-g.x;g.dy=e.clientY-g.y;
    if(!g.axis&&Math.max(Math.abs(g.dx),Math.abs(g.dy))>9){
      if(Math.abs(g.dy)>=Math.abs(g.dx)){cancel();return;}
      g.axis='x';g.card.setPointerCapture(e.pointerId);g.card.classList.add('is-dragging');
      // The deal-in animation must not keep the card pinned while it is dragged.
      g.card.classList.remove('card-enter');
    }
    if(g.axis!=='x')return;
    e.preventDefault();
    const amount=Math.max(-g.width*1.15,Math.min(g.width*1.15,g.dx));
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    g.card.style.transform=reduced?'none':`translate3d(${amount}px, ${Math.min(16,Math.abs(amount)*.04)}px, 0) rotate(${amount/g.width*13}deg)`;
    g.card.style.setProperty('--left-choice',Math.min(1,Math.max(0,-g.dx)/swipeThreshold(g.width)));
    g.card.style.setProperty('--right-choice',Math.min(1,Math.max(0,g.dx)/swipeThreshold(g.width)));
    g.card.classList.toggle('swipe-ready',!!swipeIntent(g.dx,g.dy,g.width));
    const stage=g.card.closest?.('.card-stage');
    stage?.style.setProperty('--left-choice',Math.min(1,Math.max(0,-g.dx)/swipeThreshold(g.width)));
    stage?.style.setProperty('--right-choice',Math.min(1,Math.max(0,g.dx)/swipeThreshold(g.width)));
    stage?.classList.toggle('swipe-ready',!!swipeIntent(g.dx,g.dy,g.width));
  },{passive:false});
  listen(root,'pointerup',e=>{
    const g=gesture;if(!g||e.pointerId!==g.id)return;
    // Decide on release coordinates, including a rapid last movement back to center.
    const action=g.axis==='x'?swipeIntent(e.clientX-g.x,e.clientY-g.y,g.width):null;
    gesture=null;
    if(g.card.hasPointerCapture?.(g.id))g.card.releasePointerCapture(g.id);
    if(g.axis==='x')suppressClickUntil=Date.now()+450;
    g.card.classList.remove('is-dragging');
    if(action&&enabled())Promise.resolve(commit(action,{...g.card.dataset})).then(ok=>{if(!ok)reset(g.card);}).catch(()=>reset(g.card));
    else reset(g.card);
  });
  listen(root,'pointercancel',cancel);
  // A touch pointer is implicitly captured to the element under the finger, so
  // setPointerCapture on the card hands capture over and fires a bubbling
  // lostpointercapture from that child. Only losing the card's own capture
  // means the gesture is really gone.
  listen(root,'lostpointercapture',e=>{if(gesture&&e.target===gesture.card)cancel();});
  listen(root,'click',e=>{if(Date.now()<suppressClickUntil){e.preventDefault();e.stopImmediatePropagation();}},{capture:true});
  listen(window,'blur',cancel);
  listen(window,'hashchange',cancel);
  listen(document,'visibilitychange',()=>{if(document.hidden)cancel();});
  return {cancel,destroy(){cancel();lifecycle.abort();}};
}

export async function animateCardExit(card, action, signal) {
  if(!card?.isConnected)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration=motionDuration(reduced);
  if(!duration||!card.animate)return;
  const initial=getComputedStyle(card).transform;
  const distance=Math.max(innerWidth,card.getBoundingClientRect().width)*1.15;
  const dir=action==='replace'?-1:1;
  const animation=card.animate([{transform:initial==='none'?'translateX(0)':initial,opacity:1},{transform:`translateX(${dir*distance}px) rotate(${dir*18}deg)`,opacity:0}],{duration,easing:'cubic-bezier(.4,0,.8,.35)',fill:'forwards'});
  await waitForAnimation(animation,signal);
  // Keep the old card offscreen until the caller has rendered the next card.
  return animation;
}
