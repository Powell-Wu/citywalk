import {createServer} from 'vite';
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const output=process.env.CITYWALK_E2E_OUTPUT?process.env.CITYWALK_E2E_OUTPUT+'/lifecycle':'test-results/lifecycle-20261009';await fs.mkdir(output,{recursive:true});
// Only this temporary dev server exposes the harness. The production app has no
// test controls or exported instance. No source or generated files are modified.
const html=`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#fff8e9"><div id="app"></div><script type="module">
 import {mount,unmount} from 'svelte';import App from '/src/App.svelte';
 import '/src/styles/base.css';import '/src/styles/theme.css';import '/src/styles/motion.css';import '/src/styles/accessibility.css';
 let instance;globalThis.testMount=()=>{instance=mount(App,{target:document.getElementById('app')});};
 globalThis.testUnmount=async()=>{await unmount(instance);instance=null;};testMount();
 </script></html>`;
const server=await createServer({server:{host:'127.0.0.1',port:0},plugins:[{name:'isolated-lifecycle-harness',configureServer(server){server.middlewares.use(async(req,res,next)=>{if(!req.url?.endsWith('/__lifecycle.html'))return next();try{res.setHeader('Content-Type','text/html');res.end(await server.transformIndexHtml(req.url,html));}catch(error){next(error);}});}}]});
await server.listen();
const browser=await chromium.launch({headless:true,...(process.env.CITYWALK_TEST_BROWSER==='chromium'?{}:{channel:process.env.CITYWALK_TEST_BROWSER||'msedge'})});
try{
 const address=server.httpServer.address(),context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(`http://127.0.0.1:${address.port}/citywalk/__lifecycle.html`);await page.getByRole('button',{name:'领取通行证',exact:true}).waitFor();
 const cdp=await context.newCDPSession(page),listeners=async()=>{const r=await cdp.send('Runtime.evaluate',{expression:`JSON.stringify({hash:(getEventListeners(window).hashchange||[]).length,input:(getEventListeners(document).input||[]).length,visibility:(getEventListeners(document).visibilitychange||[]).length})`,includeCommandLineAPI:true,returnByValue:true});return JSON.parse(r.result.value);};
 const mounted=await listeners();await page.getByRole('button',{name:'直接试玩',exact:true}).click();await page.locator('[data-swipe-card]').waitFor();await page.locator('.card-options summary').click();await page.getByRole('button',{name:'完成',exact:true}).click();await page.locator('.branch-choice').waitFor();
 await page.locator('.journey-tools summary').click();await page.getByRole('button',{name:'撤销最近完成',exact:true}).click();await page.getByRole('dialog').waitFor();
 await page.evaluate(()=>testUnmount());await page.waitForTimeout(50);assert.equal(await page.locator('dialog,.completion-stamp').count(),0);assert.equal(await page.locator('#app>*').count(),0);const unmounted=await listeners();assert.equal(unmounted.hash,0);assert.equal(unmounted.input,0);assert.equal(unmounted.visibility,0);
 await page.evaluate(()=>testMount());await page.locator('.branch-choice').waitFor();const remounted=await listeners();assert.deepEqual(remounted,mounted);
 // A committed write can finish after disposal. It stays committed, but its old
 // continuation must not write to the new UI or leave a global feedback timer.
 await page.getByRole('button',{name:'寻找街角线索',exact:true}).click();await page.locator('.card-reverse').waitFor();await page.locator('.card-reverse').click();await page.locator('[data-swipe-card]').waitFor();await page.waitForFunction(()=>document.querySelector('main').getAttribute('aria-busy')==='false');await page.locator('.card-options summary').click();
 await page.evaluate(()=>new Promise((resolve,reject)=>{const original=IDBObjectStore.prototype.put,timer=setTimeout(()=>{IDBObjectStore.prototype.put=original;reject(Error('Expected completion transaction did not commit'));},5000);IDBObjectStore.prototype.put=function(...args){const request=original.apply(this,args);this.transaction.addEventListener('complete',()=>{clearTimeout(timer);IDBObjectStore.prototype.put=original;testUnmount().then(resolve);},{once:true});return request;};document.querySelector('[data-action="complete"]').click();}));
 await page.waitForTimeout(550);assert.equal(await page.locator('dialog,.completion-stamp,#toast').count(),0);assert.deepEqual(errors,[]);
 const completed=await page.evaluate(()=>new Promise(resolve=>{const r=indexedDB.open('citywalk-for-two',1);r.onsuccess=()=>{const db=r.result,get=db.transaction('state').objectStore('state').get('current');get.onsuccess=()=>{resolve(get.result.session.slots.filter(x=>x.status==='done').length);db.close();};};}));assert.equal(completed,2);
 const sourceHash=createHash('sha256').update(await fs.readFile('src/lib/services/controller.mjs')).update(await fs.readFile('src/App.svelte')).digest('hex');
 const result={sourceHash,browser:await browser.version(),mounted,unmounted,remounted,completed,errors,checks:['confirm dialog cancellation on unmount','listener cleanup','no listener growth on remount','committed action disposal without stale toast or feedback']};await fs.writeFile(output+'/results.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));await context.close();
}finally{await browser.close();await server.close();}
