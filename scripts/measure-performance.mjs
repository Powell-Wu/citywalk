import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import {serveResources,resourcesFrom} from './server.mjs';
const output='test-results/performance-20261009';await fs.mkdir(output,{recursive:true});
const resources=await resourcesFrom('dist'),server=await serveResources(()=>resources);
const browser=await chromium.launch({headless:true,...(process.env.CITYWALK_TEST_BROWSER==='chromium'?{}:{channel:process.env.CITYWALK_TEST_BROWSER||'msedge'})});
const observer=await fs.readFile('node_modules/web-vitals/dist/web-vitals.iife.js','utf8'),runs=[];
try{
 for(const profile of [{name:'desktop-local',viewport:{width:1100,height:850},cpu:1,latency:0,throughput:-1},{name:'mobile-simulation',viewport:{width:390,height:844},cpu:4,latency:150,throughput:375000}]){
  const context=await browser.newContext({viewport:profile.viewport});
  for(const cache of ['cold','warm']){
   const page=await context.newPage(),metrics={},samples=[];await page.exposeFunction('recordMetric',metric=>{metrics[metric.name]=metric;samples.push(metric);});
   await page.addInitScript({content:observer+`;for(const name of ['LCP','CLS','INP'])webVitals['on'+name](metric=>recordMetric({name:metric.name,value:metric.value,rating:metric.rating,navigationType:metric.navigationType,lastEntry:metric.entries.at(-1)?.entryType,candidate:metric.entries.at(-1)?.element?.className}),{reportAllChanges:true,reportSoftNavs:false});`});
   await page.bringToFront();const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:profile.cpu});await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:profile.latency,downloadThroughput:profile.throughput,uploadThroughput:profile.throughput});
   await page.goto(server.base);await page.getByRole('button',{name:'直接试玩',exact:true}).waitFor();await page.locator('.journey-art').evaluate(image=>image.decode());
   // decode() is not proof of a presented frame; allow the visible home to paint
   // before the first scripted gesture finalizes LCP.
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await page.waitForTimeout(250);
   const firstScreen=await page.evaluate(()=>({visibility:document.visibilityState,navigation:performance.getEntriesByType('navigation').map(e=>({transferSize:e.transferSize,decodedBodySize:e.decodedBodySize,duration:e.duration})),resources:performance.getEntriesByType('resource').filter(e=>e.initiatorType!=='fetch'||e.name.endsWith('release.json')).map(e=>({file:new URL(e.name).pathname.split('/').at(-1),transferSize:e.transferSize,decodedBodySize:e.decodedBodySize,startTime:e.startTime,duration:e.duration})),supported:PerformanceObserver.supportedEntryTypes}));
   await page.getByRole('button',{name:'直接试玩',exact:true}).click();await page.locator('[data-swipe-card]').waitFor();await page.locator('.card-options summary').click();await page.getByRole('button',{name:'完成',exact:true}).click();await page.locator('.branch-choice').waitFor();await page.getByRole('button',{name:'寻找街角线索',exact:true}).click();await page.locator('.card-reverse').waitFor();await page.locator('.card-reverse').click();await page.locator('[data-swipe-card]').waitFor();
   await page.waitForTimeout(250);const observedInteractions=await page.evaluate(()=>performance.interactionCount??null);
   await page.waitForFunction(async()=>{const registration=await navigator.serviceWorker.getRegistration();return registration?.active?.state==='activated';});
   // Reset only this isolated fixture, preserving its warm static cache.
   await page.evaluate(()=>new Promise(resolve=>{const request=indexedDB.open('citywalk-for-two',1);request.onsuccess=()=>{const db=request.result,tx=db.transaction('state','readwrite');tx.objectStore('state').delete('current');tx.oncomplete=()=>{db.close();resolve();};};}));
   await page.goto('about:blank');await page.waitForTimeout(100);
   runs.push({profile,cache,metrics,samples,observedInteractions,firstScreen,firstScreenDecodedBytes:firstScreen.resources.reduce((n,e)=>n+e.decodedBodySize,firstScreen.navigation[0]?.decodedBodySize||0),limitations:'Headless desktop browser, emulated viewport/network/CPU and scripted interactions. Not real-phone or population p75 measurements.'});await page.close();
  }await context.close();
 }
 const result={release:JSON.parse(resources.get('release.json').toString()).version,browser:await browser.version(),library:'web-vitals 6.2.3',targets:{LCP:2500,INP:200,CLS:.1},runs};await fs.writeFile(output+'/results.json',JSON.stringify(result,null,2));console.log(JSON.stringify({release:result.release,runs:runs.map(x=>({profile:x.profile.name,cache:x.cache,metrics:x.metrics,firstScreenDecodedBytes:x.firstScreenDecodedBytes}))},null,2));
}finally{await browser.close();await server.close();}
