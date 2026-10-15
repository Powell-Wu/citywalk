import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {serveResources,resourcesFrom} from './server.mjs';
import {v2Baseline} from './v2-baseline.mjs';
import {initialState,newSession,score} from '../src/lib/domain/core.mjs';

const output=process.env.CITYWALK_E2E_OUTPUT?`${process.env.CITYWALK_E2E_OUTPUT}/roam-migration`:'test-results/roam-migration-20261015';
await fs.mkdir(output,{recursive:true});
// Rebuild the last deployed v3 source, at its actual /citywalk/ path.
const originalRef=process.env.CITYWALK_V2_BASELINE_REF;
let legacy;
try{process.env.CITYWALK_V2_BASELINE_REF='957be6c';legacy=await v2Baseline();}
finally{if(originalRef===undefined)delete process.env.CITYWALK_V2_BASELINE_REF;else process.env.CITYWALK_V2_BASELINE_REF=originalRef;}
const current=await resourcesFrom(process.env.CITYWALK_BUILD_DIR||'dist');
const server=await serveResources(base=>base==='/citywalk/'?legacy.resources:current,{aliases:['/citywalk/']});
const browser=await chromium.launch({headless:true,...(process.env.CITYWALK_TEST_BROWSER==='chromium'?{}:{channel:process.env.CITYWALK_TEST_BROWSER||'msedge'})});
const read=page=>page.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open('citywalk-for-two',1);r.onerror=()=>reject(r.error);r.onsuccess=()=>{const db=r.result,q=db.transaction('state').objectStore('state').get('current');q.onsuccess=()=>{db.close();resolve(q.result);};q.onerror=()=>reject(q.error);};}));
const waitOffline=page=>page.waitForFunction(async()=>{for(const key of await caches.keys())if(await(await caches.open(key)).match(new URL('offline-ready',document.baseURI).href))return true;return false;});
const errors=[];
try{
 const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();
 page.on('pageerror',error=>errors.push(error.message));
 const oldURL=new URL('/citywalk/',server.base).href;
 await page.goto(oldURL);await page.getByRole('button',{name:'领取通行证',exact:true}).waitFor();
 const state=initialState();state.sound=true;state.favorites=['scene-1'];
 newSession(state,{...state.preferences,budget:100});
 const card={id:'custom-rename-paid',type:'scene',text:'迁移测试：一起选一份点心',note:'隔离测试',minutes:5,cost:20,place:'both'};
 state.customCards=[card];state.session.slots[0].card=card;state.session.slots[0].status='active';state.session.seen=[card.id];
 await page.evaluate(state=>new Promise((resolve,reject)=>{const r=indexedDB.open('citywalk-for-two',1);r.onsuccess=()=>{const db=r.result,tx=db.transaction('state','readwrite');tx.objectStore('state').put(state,'current');tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);};}),state);
 await page.goto(oldURL+'#walk');await page.reload();await page.locator('#actual-cost').fill('12.5');
 await waitOffline(page);await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await page.locator('#actual-cost').waitFor();
 const before=await read(page),draft=await page.evaluate(()=>sessionStorage.getItem('citywalk-form-drafts'));
 assert.equal(await page.locator('#actual-cost').inputValue(),'12.5');assert(draft);
 const oldCache=await page.evaluate(()=>caches.keys());
 const newer=await context.newPage();newer.on('pageerror',error=>errors.push(error.message));
 await newer.goto(server.base+'#walk');await newer.locator('#actual-cost').waitFor();await waitOffline(newer);
 await newer.getByRole('button',{name:'暂停',exact:true}).click();await newer.locator('[data-schema-status]').waitFor();
 assert.deepEqual(await read(newer),before,'old-path tab blocks a concurrent write');
 assert.deepEqual(await page.evaluate(keys=>caches.keys().then(current=>keys.every(key=>current.includes(key))),oldCache),true,'new worker preserves old-path caches');
 await newer.close();
 // Same-tab navigation retains its sessionStorage draft and same-origin IndexedDB.
 await page.goto(server.base+'#walk');await page.locator('#actual-cost').waitFor();await waitOffline(page);
 assert.deepEqual(await read(page),before);assert.equal(await page.locator('#actual-cost').inputValue(),'12.5');
 const draftContent=text=>JSON.stringify(JSON.parse(text),(key,value)=>key==='at'?undefined:value);
 assert.equal(draftContent(await page.evaluate(()=>sessionStorage.getItem('citywalk-form-drafts'))),draftContent(draft));
 const manifest=JSON.parse(current.get('manifest.webmanifest').toString());
 assert.equal(new URL(manifest.id,new URL('manifest.webmanifest',server.base)).pathname,'/citywalk/');
 assert.equal(new URL(manifest.start_url,server.base).pathname,'/roam/');assert.equal(new URL(manifest.scope,server.base).pathname,'/roam/');
 await page.getByRole('button',{name:'暂停',exact:true}).click();await page.getByRole('button',{name:'继续',exact:true}).waitFor();
 assert.equal(await page.locator('#actual-cost').inputValue(),'12.5','pause retains draft');
 await context.setOffline(true);await page.reload();await page.getByRole('button',{name:'继续',exact:true}).waitFor();assert.equal(await page.locator('#actual-cost').inputValue(),'12.5','offline reload retains draft');
 await page.getByRole('button',{name:'继续',exact:true}).click();await page.getByRole('button',{name:'暂停',exact:true}).waitFor();assert.equal(await page.locator('#actual-cost').inputValue(),'12.5','resume retains draft');
 await page.locator('.card-options summary').click();assert.equal(await page.locator('#actual-cost').inputValue(),'12.5','opening options retains draft');await page.getByRole('button',{name:'完成',exact:true}).click();
 await page.waitForFunction(()=>new Promise(resolve=>{const r=indexedDB.open('citywalk-for-two',1);r.onsuccess=()=>{const q=r.result.transaction('state').objectStore('state').get('current');q.onsuccess=()=>{r.result.close();resolve(q.result.session.slots[0].status==='done');};};}));
 const after=await read(page);assert.equal(after.session.slots[0].spent,12.5);assert.equal(score(after.session).count,1);assert.equal(after.sound,true);assert.deepEqual(after.favorites,before.favorites);assert.deepEqual(after.customCards,before.customCards);
 await page.screenshot({path:`${output}/roam-offline.png`,fullPage:true});
 assert.deepEqual(errors,[]);
 const result={baseline:legacy.ref,legacyPath:'/citywalk/',path:'/roam/',sameOriginStorage:'preserved',tabDraft:'preserved',oldTabWriteGuard:'passed',cacheIsolation:'passed',manifestIdentity:'preserved',offlineCompletion:'passed',pageErrors:errors};
 await fs.writeFile(`${output}/results.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(result));await context.close();
}finally{await browser.close();await server.close();}
