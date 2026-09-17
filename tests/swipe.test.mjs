import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {swipeIntent,swipeThreshold,motionDuration,installCardGestures} from '../dist/swipe.mjs';

test('swipe needs deliberate horizontal distance; short, vertical, diagonal motion cancels',()=>{
 for(const width of [280,340,430,900]){
  const threshold=swipeThreshold(width);
  assert.equal(swipeIntent(threshold-1,0,width),null);
  assert.equal(swipeIntent(threshold,0,width),'complete');
  assert.equal(swipeIntent(-threshold,0,width),'replace');
  assert.equal(swipeIntent(130,200,width),null);
  assert.equal(swipeIntent(130,130,width),null);
 }
 assert.equal(motionDuration(true),0);
});

// Exercise real pointer handlers including capture/cancel, with minimal DOM doubles.
test('pointer cancellation, release threshold, pause and control exclusions never commit accidentally',async()=>{
 const listeners=new Map();
 const root={addEventListener(name,fn){listeners.set(name,fn);}};
 globalThis.window={addEventListener(){}};globalThis.document={addEventListener(){},hidden:false};
 globalThis.matchMedia=()=>({matches:false});
 const styles=new Map(),classes=new Set();let capture=false,allowed=true,control=false;
 const card={dataset:{session:'walk-1',slot:'slot-1',card:'scene-01'},style:{setProperty(k,v){styles.set(k,v);},removeProperty(k){styles.delete(k);}},classList:{add(x){classes.add(x);},remove(...xs){xs.forEach(x=>classes.delete(x));},toggle(x,on){on?classes.add(x):classes.delete(x);}},getBoundingClientRect:()=>({width:300}),setPointerCapture(){capture=true;},hasPointerCapture:()=>capture,releasePointerCapture(){capture=false;}};
 const commits=[];const api=installCardGestures(root,{enabled:()=>allowed,commit:async(...args)=>{commits.push(args);return false;}});
 const fire=(name,x,y,more={})=>listeners.get(name)({pointerId:1,clientX:x,clientY:y,button:0,isPrimary:true,preventDefault(){},target:{closest(selector){return selector==='[data-swipe-card]'?card:control?{}:null;}},...more});
 fire('pointerdown',0,0);fire('pointermove',140,0);fire('pointercancel',140,0);fire('pointerup',140,0);
 assert.equal(commits.length,0);assert.equal(capture,false);
 fire('pointerdown',0,0);fire('pointermove',140,0);fire('pointerup',10,0);
 assert.equal(commits.length,0,'returning to center before release cancels');
 fire('pointerdown',0,0);fire('pointermove',5,50);fire('pointerup',180,50);
 assert.equal(commits.length,0,'vertical scroll keeps its axis');
 fire('pointerdown',0,0);fire('pointermove',140,0);allowed=false;fire('pointerup',140,0);
 assert.equal(commits.length,0);allowed=true;
 control=true;fire('pointerdown',0,0);fire('pointermove',140,0);fire('pointerup',140,0);control=false;
 assert.equal(commits.length,0,'inputs and buttons cannot start a swipe');
 fire('pointerdown',0,0);fire('pointermove',-140,0);fire('pointerup',-140,0);fire('pointerup',-140,0);
 assert.equal(commits.length,1);assert.equal(commits[0][0],'replace');assert.equal(commits[0][1].card,'scene-01');
 await Promise.resolve();assert.equal(styles.has('--left-choice'),false,'rejected save resets the preview');
 fire('pointerdown',0,0);fire('pointermove',140,0);api.cancel();fire('pointerup',140,0);
 assert.equal(commits.length,1,'theme/navigation cancellation cannot choose');
});

// A touch pointer is implicitly captured to the child under the finger, so the
// card's setPointerCapture hands capture over and fires a bubbling
// lostpointercapture from that child. Treating that handover as a real loss is
// what silently killed every touch swipe while mouse drags kept working.
test('touch capture handover keeps the drag alive, a genuine loss still cancels',async()=>{
 const listeners=new Map();
 const root={addEventListener(name,fn){listeners.set(name,fn);}};
 globalThis.window={addEventListener(){}};globalThis.document={addEventListener(){},hidden:false};
 globalThis.matchMedia=()=>({matches:false});
 let capture=false;
 const card={dataset:{session:'s',slot:'k',card:'scene-01'},style:{setProperty(){},removeProperty(){}},classList:{add(){},remove(){},toggle(){}},getBoundingClientRect:()=>({width:300}),setPointerCapture(){capture=true;},hasPointerCapture:()=>capture,releasePointerCapture(){capture=false;}};
 const child={closest:()=>card};
 const commits=[];
 installCardGestures(root,{enabled:()=>true,commit:async(...a)=>{commits.push(a);return true;}});
 const fire=(name,x,y,over={})=>listeners.get(name)({pointerId:1,clientX:x,clientY:y,button:0,isPrimary:true,preventDefault(){},target:{closest:s=>s==='[data-swipe-card]'?card:null},...over});

 // Handover: the child implicitly held capture, the card takes it over.
 fire('pointerdown',0,0);fire('pointermove',-140,0);
 assert.equal(capture,true,'card took pointer capture when the drag locked to x');
 fire('lostpointercapture',-140,0,{target:child});
 fire('pointerup',-140,0);
 assert.equal(commits.length,1,'handover from the implicitly captured child must not cancel');
 assert.equal(commits[0][0],'replace');

 // Genuine loss: the card itself loses capture mid-drag.
 fire('pointerdown',0,0);fire('pointermove',-140,0);
 fire('lostpointercapture',-140,0,{target:card});
 fire('pointerup',-140,0);
 assert.equal(commits.length,1,'losing the card capture must still cancel the gesture');
});

test('grabbing a card drops the deal-in class so the drag transform can apply',()=>{
 const listeners=new Map();
 const root={addEventListener(name,fn){listeners.set(name,fn);}};
 globalThis.window={addEventListener(){}};globalThis.document={addEventListener(){},hidden:false};
 globalThis.matchMedia=()=>({matches:false});
 const classes=new Set(['card-enter']);
 const card={dataset:{},style:{setProperty(){},removeProperty(){}},classList:{add(x){classes.add(x);},remove(...xs){xs.forEach(x=>classes.delete(x));},toggle(x,on){on?classes.add(x):classes.delete(x);}},getBoundingClientRect:()=>({width:300}),setPointerCapture(){},hasPointerCapture:()=>false,releasePointerCapture(){}};
 installCardGestures(root,{enabled:()=>true,commit:async()=>true});
 const fire=(name,x,y)=>listeners.get(name)({pointerId:1,clientX:x,clientY:y,button:0,isPrimary:true,preventDefault(){},target:{closest:s=>s==='[data-swipe-card]'?card:null}});
 fire('pointerdown',0,0);
 assert.equal(classes.has('card-enter'),true,'the card is still dealing in before the drag');
 fire('pointermove',-40,0);
 assert.equal(classes.has('card-enter'),false,'grabbing must release the deal-in animation');
 assert.equal(classes.has('is-dragging'),true);
});

// A CSS animation outranks an inline style, so a forwards-filling deal-in
// animation keeps the card pinned at "no transform" for the rest of its life.
// The tilt then never appears even though the drag writes it every frame.
test('deal-in animation must not fill forwards, or it would pin the card transform',()=>{
 const css=readFileSync(new URL('../dist/story.css',import.meta.url),'utf8');
 const rule=/\.card-enter\{animation:deal-card[^}]*\}/.exec(css);
 assert.ok(rule,'the deal-in rule should exist in story.css');
 assert.doesNotMatch(rule[0],/\b(both|forwards)\b/,'a forwards fill would override the drag transform after the deal-in ends');
});
