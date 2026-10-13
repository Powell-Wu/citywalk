import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {serveResources,resourcesFrom} from './server.mjs';
import {CARDS,validateBackup} from '../src/lib/domain/core.mjs';
const output=process.env.CITYWALK_ACCEPTANCE_OUTPUT||'test-results/acceptance-fixes-20261013/visual';
await fs.mkdir(output,{recursive:true});
const resources=await resourcesFrom('dist'),server=await serveResources(()=>resources);
const browser=await chromium.launch({headless:true,...(process.env.CITYWALK_TEST_BROWSER==='chromium'?{}:{channel:'msedge'})});
const errors=[],checks=[];
const read=page=>page.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open('citywalk-for-two',1);r.onerror=()=>reject(r.error);r.onsuccess=()=>{const db=r.result,q=db.transaction('state').objectStore('state').get('current');q.onsuccess=()=>{db.close();resolve(q.result)};q.onerror=()=>reject(q.error);};}));
const seed=(page,state)=>page.evaluate(state=>new Promise((resolve,reject)=>{const r=indexedDB.open('citywalk-for-two',1);r.onsuccess=()=>{const db=r.result,tx=db.transaction('state','readwrite');tx.objectStore('state').put(state,'current');tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>reject(tx.error);};}),state);
const ready=page=>page.waitForFunction(()=>document.querySelector('main')?.getAttribute('aria-busy')==='false');
async function screenshot(page,name,locator){await ready(page);await page.evaluate(()=>{for(const img of document.images)img.loading='eager';});await page.evaluate(()=>Promise.all([...document.images].map(img=>img.decode())));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+' overflow');await(locator||page).screenshot({path:output+'/'+name+'.png',...(locator?{}:{fullPage:true})});checks.push(name);}
try{
 for(const width of [320,390,1280]){
  const context=await browser.newContext({viewport:{width,height:width===320?700:width===390?844:900},reducedMotion:'reduce'}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(server.base);await screenshot(page,'passport-'+width,page.locator('.passport-ticket'));
  const box=await page.locator('.passport-ticket').boundingBox();for(const el of await page.locator('.passport-print>*').all()){const r=await el.boundingBox();assert(r.y>=box.y&&r.y+r.height<=box.y+box.height,'printed text stays in ticket');}
  await page.goto(server.base+'#setup');await screenshot(page,'setup-'+width);await page.screenshot({path:output+'/setup-viewport-'+width+'.png'});
  if(width<801){const action=await page.locator('.departure-action').boundingBox(),nav=await page.locator('.nav').boundingBox();assert(action.y+action.height<nav.y,'setup action clears navigation');}
  await page.locator('[name=mode][value=half]').check();await page.locator('[name=journeyTheme][value=duo]').check();await page.locator('#place').selectOption('indoor');await page.locator('#budget').fill('30');await page.locator('[name=scoring]').uncheck();
  assert.equal(await page.locator('[data-plan-mode]').innerText(),'留出半天');assert.match(await page.locator('[data-plan-budget]').innerText(),/30/);assert.match(await page.locator('[data-plan-theme]').innerText(),/默契/);if(width<801)assert.match(await page.locator('.mobile-plan strong').innerText(),/默契挑战/);
  await page.reload();await ready(page);assert(await page.locator('[name=mode][value=half]').isChecked());assert(await page.locator('[name=journeyTheme][value=duo]').isChecked());assert.match(await page.locator('[data-plan-budget]').innerText(),/30/);
  await page.locator('[name=mode][value=trial]').check();assert(await page.locator('#budget').isDisabled());assert.equal(await page.locator('[data-plan-budget]').innerText(),'无需花费');
  await page.locator('[name=mode][value=short]').check();assert(await page.locator('#budget').isEnabled());assert.match(await page.locator('[data-plan-budget]').innerText(),/30/);await page.locator(`[name=journeyTheme][value=${width===390?'duo':'mixed'}]`).check();await page.locator('#budget').fill('0');
  await page.getByRole('button',{name:'出发',exact:true}).click();await page.locator('.reverse-art').waitFor();await screenshot(page,'card-back-'+width);
  assert(await page.locator('.reverse-art').evaluate(img=>img.complete&&img.naturalWidth>0));assert.match(await page.locator('.reverse-art').getAttribute('src'),/deck-pattern\.svg$/);assert.equal(await page.locator('.card-reverse [data-theme-opening]').count(),0);
  if(width===390){assert.match(await page.locator('[data-journey-theme]').innerText(),/默契挑战/);assert.equal(await page.locator('[data-theme-opening]').isVisible(),false);await page.locator('.journey-tools > summary').click();assert(await page.locator('[data-theme-opening]').isVisible());await page.locator('.journey-tools > summary').click();}
  await page.locator('.card-reverse').click();await page.locator('[data-swipe-card]').waitFor();await ready(page);await screenshot(page,'card-front-'+width);
  await context.close();
 }
 {
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(server.base+'#library');await page.getByRole('button',{name:'＋ 写一张自己的卡',exact:true}).click();assert.equal(await page.locator('[name=artKey]').count(),10);
  await page.locator('#card-text').fill('用镜头找一处藏着笑脸的城市细节');await page.locator('[name=artKey][value=sound]').check();await screenshot(page,'custom-editor-390',page.locator('#card-form'));
  await page.reload();await ready(page);assert(await page.locator('[name=artKey][value=sound]').isChecked());assert.match(await page.locator('#card-text').inputValue(),/镜头/);
  await page.getByRole('button',{name:'放进收藏册',exact:true}).click();await page.locator('#card-form').waitFor({state:'detached'});let state=await read(page);assert.equal(state.customCards[0].artKey,'sound');
  const entry=page.locator('.collection-card').filter({hasText:state.customCards[0].text});assert.match(await entry.locator('.collection-art img').getAttribute('src'),/art-sound\.webp$/);await screenshot(page,'custom-saved-390',entry);
  await page.goto(server.base+'#settings');const pending=page.waitForEvent('download');await page.getByRole('button',{name:'导出备份',exact:true}).click();await(await pending).saveAs(output+'/custom-art-backup.json');const backup=JSON.parse(await fs.readFile(output+'/custom-art-backup.json','utf8'));assert.equal(validateBackup(backup).customCards[0].artKey,'sound');
  await page.locator('#backup-file').setInputFiles(output+'/custom-art-backup.json');await page.getByRole('button',{name:'导入并替换',exact:true}).click();await ready(page);assert.equal((await read(page)).customCards[0].artKey,'sound');
  state=await read(page);state.disabled=CARDS.map(c=>c.id);await seed(page,state);await page.goto(server.base+'#setup');await page.reload();await page.locator('[name=mode][value=short]').check();await page.locator('[name=journeyTheme][value=mixed]').check();await page.getByRole('button',{name:'出发',exact:true}).click();await page.locator('.card-reverse').click();await page.locator('[data-swipe-card]').waitFor();assert.match(await page.locator('.task-art').getAttribute('src'),/art-sound\.webp$/);assert.equal((await read(page)).session.slots[0].card.artKey,'sound');await screenshot(page,'custom-drawn-390');
  await page.waitForFunction(()=>navigator.serviceWorker?.controller);await context.setOffline(true);await page.reload();await page.locator('[data-swipe-card]').waitFor();await screenshot(page,'custom-offline-390');assert.equal((await read(page)).session.slots[0].card.artKey,'sound');await context.close();
 }
 {
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'no-preference'}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(server.base+'#setup');await page.getByRole('button',{name:'出发',exact:true}).click();await page.locator('.reverse-art').waitFor();await screenshot(page,'card-back-motion');await page.locator('.card-reverse').click();await page.locator('[data-swipe-card]').waitFor();await ready(page);await screenshot(page,'card-front-motion');assert.equal(await page.locator('.task-card').evaluate(el=>el.getAnimations().length),0);await context.close();
 }
 assert.equal(errors.length,0);assert(!server.requests.some(r=>r.status!==200),JSON.stringify(server.requests.filter(r=>r.status!==200)));
 await fs.writeFile(output+'/results.json',JSON.stringify({release:JSON.parse(resources.get('release.json').toString()).version,browser:browser.version(),checks,errors,customArt:'selection, draft reload, save, JSON export/import, draw snapshot and offline reload passed',setup:'summary, draft reload and trial/regular transitions passed'},null,2));
 console.log(JSON.stringify({screens:checks.length,errors,customArt:'passed',setup:'passed'},null,2));
}finally{await browser.close();await server.close();}
