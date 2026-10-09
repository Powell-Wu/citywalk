import test from 'node:test';
import assert from 'node:assert/strict';
import {createSounds} from '../src/lib/interactions/sound.mjs';
test('sound stays opt-in, starts from a gesture, has three cues and stops when hidden/disposed',()=>{
 const handlers={},doc={hidden:false,addEventListener:(key,fn)=>handlers[key]=fn,removeEventListener:key=>delete handlers[key]},nodes=[];let made=0,suspended=0,closed=0;
 class Audio {constructor(){made++;this.state='running';this.currentTime=0;}resume(){return Promise.resolve();}suspend(){suspended++;return Promise.resolve();}close(){closed++;return Promise.resolve();}createOscillator(){const osc={frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){},start(){this.started=true;},stop(){this.stopped=true;}};nodes.push(osc);return osc;}createGain(){return{gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}}
 const sound=createSounds({Audio,document:doc});sound.unlock();sound.play('flip');assert.equal(made,0);sound.setEnabled(true);sound.unlock();sound.play('flip');sound.play('stamp');sound.play('reward');assert.equal(nodes.length,5);assert(nodes.every(x=>x.started));doc.hidden=true;handlers.visibilitychange();assert.equal(suspended,1);sound.play('flip');assert.equal(nodes.length,5);assert(nodes.every(x=>x.stopped));sound.dispose();assert.equal(closed,1);assert.equal(handlers.visibilitychange,undefined);
});
