import fs from 'node:fs/promises';
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {serveResources,resourcesFrom} from './server.mjs';
import {initialState,newSession,draw,complete,chooseBranch,finish,score} from '../src/lib/domain/core.mjs';
import {SCHEMA_VERSION} from '../src/lib/domain/rules.mjs';
// A fallback must preserve the current schema, themes and immutable rule snapshots.
const fallbackDir=process.env.CITYWALK_FALLBACK_DIR;if(!fallbackDir)throw Error('Set CITYWALK_FALLBACK_DIR to a compatible fallback artifact.');
const current=await resourcesFrom('dist'),fallback=await resourcesFrom(fallbackDir);let resources=current;
const currentVersion=JSON.parse(current.get('release.json').toString()).version,fallbackVersion=JSON.parse(fallback.get('release.json').toString()).version;
if(currentVersion===fallbackVersion)throw Error('Choose a distinct, known compatible fallback build.');
const output=process.env.CITYWALK_ROLLBACK_OUTPUT||'test-results/rollback-20261013';await fs.mkdir(output,{recursive:true});
const server=await serveResources(()=>resources),browser=await chromium.launch({headless:true,...(process.env.CITYWALK_TEST_BROWSER==='chromium'?{}:{channel:process.env.CITYWALK_TEST_BROWSER||'msedge'})}),runs=[];
const read=page=>page.evaluate(()=>new Promise(resolve=>{const r=indexedDB.open('citywalk-for-two',1);r.onsuccess=()=>{const db=r.result,q=db.transaction('state').objectStore('state').get('current');q.onsuccess=()=>{resolve(q.result);db.close();};};}));
try{
 for(const journeyTheme of ['trial','observe','duo']){
  resources=current;const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));page.setDefaultTimeout(15000);
  try{
   await page.goto(server.base);await page.getByRole('button',{name:'直接试玩',exact:true}).waitFor();
   const state=initialState();newSession(state,state.preferences);for(const slot of state.session.slots){draw(state,state.session.id,slot.id);complete(state,state.session.id,slot.id,slot.card.id);}finish(state,state.session.id,{name:'旧积分保留',memory:'兼容回退历史',closing:true});state.sound=true;
   newSession(state,{...state.preferences,mode:journeyTheme==='trial'?'trial':'short',journeyTheme:journeyTheme==='trial'?'mixed':journeyTheme,scoring:false,place:'indoor',budget:0});
   draw(state,state.session.id,state.session.slots[0].id);complete(state,state.session.id,state.session.slots[0].id,state.session.slots[0].card.id);if(journeyTheme==='trial')chooseBranch(state,state.session.id,'sounds');draw(state,state.session.id,state.session.slots[1].id);state.revision=42;
   await page.evaluate(state=>new Promise(resolve=>{const r=indexedDB.open('citywalk-for-two',1);r.onsuccess=()=>{const db=r.result,tx=db.transaction('state','readwrite');tx.objectStore('state').put(state,'current');tx.oncomplete=()=>{db.close();resolve();};};}),state);
   await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await page.waitForFunction(()=>!!navigator.serviceWorker.controller);await page.goto(server.base+'#settings');await page.waitForFunction(()=>!document.querySelector('[data-action="check-update"]').disabled);
   resources=fallback;await page.getByRole('button',{name:'检查更新',exact:true}).click();await page.getByRole('button',{name:'应用更新并刷新',exact:true}).waitFor();await page.getByRole('button',{name:'应用更新并刷新',exact:true}).click();await page.locator('[data-current-version]').filter({hasText:fallbackVersion}).waitFor();
   assert.deepEqual(await read(page),state,'opening fallback must not rewrite the record');await page.goto(server.base+'#walk');await page.locator('[data-swipe-card]').waitFor();assert.equal(await page.locator('[data-swipe-card]').getAttribute('data-card'),state.session.slots[1].card.id);
   await context.setOffline(true);await page.locator('.card-options summary').click();await page.getByRole('button',{name:'完成',exact:true}).click();await page.locator('.card-reverse').waitFor();const saved=await read(page);
   assert.equal(saved.version,SCHEMA_VERSION);assert.equal(saved.session.id,state.session.id);assert.equal(saved.session.branch,state.session.branch);assert.equal(saved.session.journeyTheme,state.session.journeyTheme);assert.deepEqual(saved.session.themePlan,state.session.themePlan);assert.equal(saved.session.slots[1].status,'done');assert.equal(saved.sound,true);assert.equal(saved.revision,43);assert.deepEqual(saved.history,state.history);assert.equal(score(saved.history[0]).total,15);assert.deepEqual(errors,[]);runs.push({journeyTheme,errors,revision:saved.revision});console.log('PASS compatible fallback '+journeyTheme);
  }finally{await context.close();}
 }
 const result={from:currentVersion,to:fallbackVersion,schema:SCHEMA_VERSION,browser:browser.version(),checks:['input unchanged on open','trial/card/branch and theme snapshots retained','offline completion commits current schema','history snapshots and sound preference retained'],runs};await fs.writeFile(output+'/results.json',JSON.stringify(result,null,2));
}finally{await browser.close();await server.close();}
