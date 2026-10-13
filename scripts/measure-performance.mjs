import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import {serveResources,resourcesFrom} from './server.mjs';
const output=process.env.CITYWALK_PERFORMANCE_OUTPUT||`test-results/performance-${new Date().toISOString().replace(/[-:.]/g,'')}`;
const flow=process.env.CITYWALK_PERFORMANCE_FLOW||'trial';
if(!['trial','observe','duo'].includes(flow))throw Error('Performance flow must be trial, observe or duo');
const repetitions=Number(process.env.CITYWALK_PERFORMANCE_REPETITIONS||3);
if(!Number.isInteger(repetitions)||repetitions<1||repetitions>10)throw Error('Performance repetitions must be 1–10');
const owned=path.resolve('test-results'),destination=path.resolve(output);
if(!destination.startsWith(owned+path.sep))throw Error('Performance output must stay inside test-results');
await fs.mkdir(destination,{recursive:true});
const resources=await resourcesFrom('dist'),server=await serveResources(()=>resources);
const browserOptions={headless:true,...(process.env.CITYWALK_TEST_BROWSER==='chromium'?{}:{channel:process.env.CITYWALK_TEST_BROWSER||'msedge'})};let browserVersion;
const observer=await fs.readFile('node_modules/web-vitals/dist/web-vitals.attribution.iife.js','utf8'),runs=[];
const targets={LCP:2500,INP:200,CLS:.1};
const ready=page=>page.waitForFunction(()=>document.querySelector('main')?.getAttribute('aria-busy')==='false');
try{
 for(const profile of [{name:'desktop-local',viewport:{width:1100,height:850},cpu:1,latency:0,throughput:-1},{name:'mobile-simulation',viewport:{width:390,height:844},cpu:4,latency:150,throughput:375000}]){
  for(let repetition=1;repetition<=repetitions;repetition++){
   const profileDir=await fs.mkdtemp(path.join(destination,'isolated-profile-'));
   for(const cache of ['cold','warm']){
    // Reopen only this owned test profile in a fresh process: keep the warm
    // offline cache, while avoiding retained renderer/CPU emulation state.
    const context=await chromium.launchPersistentContext(profileDir,{...browserOptions,viewport:profile.viewport});browserVersion=context.browser().version();
    try{
    const page=context.pages()[0],metrics={},samples=[],errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.addInitScript({content:`;
     globalThis.paintProbe={lcp:[],paint:[],longTasks:[],stages:[]};
     for(const type of ['largest-contentful-paint','paint','longtask'])new PerformanceObserver(list=>{for(const e of list.getEntries()){
      if(type==='largest-contentful-paint')paintProbe.lcp.push({startTime:e.startTime,renderTime:e.renderTime,loadTime:e.loadTime,hero:e.element?.classList.contains('journey-art'),candidate:e.element?.className,size:e.size});
      else if(type==='paint')paintProbe.paint.push({name:e.name,startTime:e.startTime});
      else paintProbe.longTasks.push({startTime:e.startTime,duration:e.duration});
     }}).observe({type,buffered:true});
     const stageObserver=new MutationObserver(()=>{if(document.querySelector('.journey-art')){paintProbe.stages.push({name:'home-mounted',at:performance.now()});stageObserver.disconnect();}});stageObserver.observe(document,{childList:true,subtree:true});
`});
    await page.bringToFront();const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:profile.cpu});await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:profile.latency,downloadThroughput:profile.throughput,uploadThroughput:profile.throughput});
    await page.goto(server.base);await page.getByRole('button',{name:'直接试玩',exact:true}).waitFor();await page.locator('.journey-art').evaluate(image=>image.decode());
    // A decoded image or a fixed sleep does not prove a contentful paint.
    // Wait for an actual hero LCP entry before input finalizes the measurement.
    let painted=true;try{await page.waitForFunction(()=>paintProbe.lcp.some(e=>e.hero),{},{timeout:10000});}catch{painted=false;}
    const firstScreen=await page.evaluate(()=>({visibility:document.visibilityState,probe:paintProbe,controlled:!!navigator.serviceWorker.controller,navigation:performance.getEntriesByType('navigation').map(e=>({transferSize:e.transferSize,decodedBodySize:e.decodedBodySize,duration:e.duration,responseStart:e.responseStart})),resources:performance.getEntriesByType('resource').filter(e=>e.initiatorType!=='fetch'||e.name.endsWith('release.json')).map(e=>({file:new URL(e.name).pathname.split('/').at(-1),transferSize:e.transferSize,decodedBodySize:e.decodedBodySize,startTime:e.startTime,duration:e.duration,responseEnd:e.responseEnd})),supported:PerformanceObserver.supportedEntryTypes}));
    // The official library uses buffered entries; defer its own parse/work until
    // after the app has painted, before measuring any user interactions.
    await page.addScriptTag({content:observer+`;globalThis.currentMetrics={};globalThis.metricSamples=[];for(const name of ['LCP','CLS','INP'])webVitals['on'+name](metric=>{
      const a=metric.attribution,entry=metric.entries.at(-1);
      const result={name:metric.name,value:metric.value,rating:metric.rating,navigationType:metric.navigationType,lastEntry:entry?.entryType,candidate:entry?.element?.className,attribution:a&&{timeToFirstByte:a.timeToFirstByte,resourceLoadDelay:a.resourceLoadDelay,resourceLoadDuration:a.resourceLoadDuration,elementRenderDelay:a.elementRenderDelay}};currentMetrics[metric.name]=result;metricSamples.push(result);
     },{reportAllChanges:true,reportSoftNavs:false});`});
    if(flow==='trial'){
     await page.getByRole('button',{name:'直接试玩',exact:true}).click();await page.locator('[data-swipe-card]').waitFor();await ready(page);await page.locator('.card-options summary').click();await page.getByRole('button',{name:'完成',exact:true}).click();await page.locator('.branch-choice').waitFor();await page.getByRole('button',{name:'寻找街角线索',exact:true}).click();
    }else{
     await page.getByRole('button',{name:'领取通行证',exact:true}).click();await page.locator(`[name=journeyTheme][value=${flow}]`).check();await page.locator('[name=scoring]').uncheck();await page.getByRole('button',{name:'出发',exact:true}).click();await page.locator('.card-reverse').click();await page.locator('[data-swipe-card]').waitFor();await ready(page);await page.locator('.card-options summary').click();await page.getByRole('button',{name:'完成',exact:true}).click();
    }
    await page.locator('.card-reverse').waitFor();await page.locator('.card-reverse').click();await page.locator('[data-swipe-card]').waitFor();await ready(page);
    await page.waitForTimeout(250);const observedInteractions=await page.evaluate(()=>performance.interactionCount??null);
    await page.waitForFunction(async()=>{for(const name of await caches.keys())if(await(await caches.open(name)).match(new URL('offline-ready',document.baseURI).href))return true;return false;});
    let completeMetrics=true;try{await page.waitForFunction(()=>['LCP','CLS','INP'].every(name=>Number.isFinite(currentMetrics[name]?.value)),{},{timeout:10000});}catch{completeMetrics=false;}
    const collected=await page.evaluate(()=>({metrics:currentMetrics,samples:metricSamples}));Object.assign(metrics,collected.metrics);samples.push(...collected.samples);
    // Reset only this isolated fixture, preserving its complete warm static cache.
    await page.evaluate(()=>new Promise(resolve=>{const request=indexedDB.open('citywalk-for-two',1);request.onsuccess=()=>{const db=request.result,tx=db.transaction('state','readwrite');tx.objectStore('state').delete('current');tx.oncomplete=()=>{db.close();resolve();};};}));
    // End the measured page directly. Navigating through about:blank first
    // retains a different renderer/emulation history for the next warm tab.
    await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});await cdp.detach();
    await page.close();await new Promise(resolve=>setTimeout(resolve,100));
    const valid=painted&&completeMetrics&&firstScreen.visibility==='visible'&&observedInteractions>=5&&errors.length===0&&Object.keys(targets).every(name=>Number.isFinite(metrics[name]?.value));
    const passed=valid&&Object.entries(targets).every(([name,max])=>metrics[name].value<=max);
    const run={profile,cache,repetition,valid,passed,painted,validation:{completeMetrics,missingMetrics:Object.keys(targets).filter(name=>!Number.isFinite(metrics[name]?.value))},metrics,samples,observedInteractions,firstScreen,firstScreenDecodedBytes:firstScreen.resources.reduce((n,e)=>n+e.decodedBodySize,firstScreen.navigation[0]?.decodedBodySize||0),errors,limitations:'Headless desktop browser, emulated viewport/network/CPU and scripted interactions. Not real-phone or population p75 measurements.'};runs.push(run);
    console.log(JSON.stringify({profile:profile.name,cache,repetition,valid,passed,metrics:Object.fromEntries(Object.entries(metrics).map(([name,m])=>[name,m.value]))}));
    }finally{await context.close();}
   }
   const actual=await fs.realpath(profileDir);if(path.dirname(actual)!==await fs.realpath(destination)||!path.basename(actual).startsWith('isolated-profile-'))throw Error('Unexpected temporary browser profile');await fs.rm(actual,{recursive:true,force:true,maxRetries:5,retryDelay:100});
  }
 }
 const summary=[];for(const profile of ['desktop-local','mobile-simulation'])for(const cache of ['cold','warm']){
  const group=runs.filter(x=>x.profile.name===profile&&x.cache===cache),measurements={};
  for(const name of Object.keys(targets)){const values=group.map(x=>x.metrics[name]?.value).filter(Number.isFinite).sort((a,b)=>a-b);measurements[name]={count:values.length,min:values[0]??null,median:values.length?(values[Math.floor((values.length-1)/2)]+values[Math.ceil((values.length-1)/2)])/2:null,max:values.at(-1)??null};}
  summary.push({profile,cache,valid:group.filter(x=>x.valid).length,passed:group.filter(x=>x.passed).length,total:group.length,measurements});
 }
 const result={release:JSON.parse(resources.get('release.json').toString()).version,flow,browser:browserVersion,library:'web-vitals 6.2.3 attribution',methodology:'Fresh browser process per navigation, isolated persistent profile per cold/warm pair; full offline cache retained; buffered official metrics loaded after hero paint and before input; in-browser collection.',targets,repetitions,passed:runs.every(x=>x.passed),summary,runs};await fs.writeFile(destination+'/results.json',JSON.stringify(result,null,2));console.log(JSON.stringify({release:result.release,flow,passed:result.passed,summary},null,2));if(!result.passed)process.exitCode=1;
}finally{await server.close();}
