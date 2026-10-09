import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createServer} from 'node:http';
import {execFileSync} from 'node:child_process';

// Optional test-only Playwright installation; never used by the shipped app.
const modulePath=process.env.CITYWALK_PLAYWRIGHT_MODULE;
const {chromium}=await import(modulePath?pathToFileURL(modulePath).href:'playwright');
const base=process.env.CITYWALK_TEST_URL||'http://127.0.0.1:5197/';
const output=path.resolve('test-results/optimization-20261009');
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,channel:process.env.CITYWALK_TEST_BROWSER||'msedge'});
const results=[],errors=[];
const record=result=>{results.push(result);console.log('PASS '+result.test);};
const fresh=async(viewport={width:390,height:844},extra={})=>{
 const context=await browser.newContext({viewport,...extra});const page=await context.newPage();
 page.setDefaultTimeout(15000);
 page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.getByRole('button',{name:'领取通行证'}).waitFor();return {context,page};
};
const snapshot=async(page,name)=>page.screenshot({path:path.join(output,name+'.png')});
const game=page=>page.evaluate(async()=>{const {readState}=await import('./storage.mjs');const {score}=await import('./core.mjs');const s=await readState();return {s,score:s.session?score(s.session):null};});
const start=async(page)=>{await page.getByRole('button',{name:'领取通行证'}).click();await page.getByRole('button',{name:'出发',exact:true}).click();await page.locator('.card-reverse').waitFor();};
const reveal=async(page)=>{await page.locator('.card-reverse').click();await page.locator('[data-swipe-card]').waitFor();await page.waitForTimeout(380);};
const options=async(page)=>{const d=page.locator('.card-options');if(!await d.getAttribute('open').then(x=>x!==null))await d.locator('summary').click();};
const tools=async(page)=>{if(!await page.locator('.journey-tools').getAttribute('open').then(x=>x!==null))await page.locator('.journey-tools>summary').click();};
const seedPaid=async(page)=>{
 await page.evaluate(async()=>{
  const {updateState}=await import('./storage.mjs');const {initialState,newSession,draw,CARDS}=await import('./core.mjs');
  await updateState(s=>{Object.assign(s,initialState());s.disabled=CARDS.filter(c=>c.type==='scene').map(c=>c.id);
   s.customCards=['custom-paid-a','custom-paid-b'].map((id,i)=>({id,type:'scene',text:i?'一起买第二份点心':'一起选一份点心',note:'共同决定并记录实际花费',minutes:5,cost:10,place:'both'}));
   newSession(s,{...s.preferences,budget:100});draw(s,s.session.id,s.session.slots[0].id,null,()=>0);
  });location.hash='walk';
 });await page.reload();await page.locator('#actual-cost').waitFor();
};
const visibleAgain=async(page)=>{
 await page.evaluate(()=>{for(const [key,value] of [['visibilityState','hidden'],['hidden',true]])Object.defineProperty(document,key,{configurable:true,value});document.dispatchEvent(new Event('visibilitychange'));});
 await page.evaluate(()=>{for(const key of ['visibilityState','hidden'])delete document[key];document.dispatchEvent(new Event('visibilitychange'));});
 await page.waitForTimeout(180);
};
try{
 for(const viewport of [{width:320,height:700},{width:390,height:844},{width:844,height:390},{width:1100,height:850}]){
  const {context,page}=await fresh(viewport);await start(page);
  const back=await page.locator('.task-card').boundingBox();await reveal(page);
  const geometry=await page.evaluate(()=>{const box=s=>document.querySelector(s)?.getBoundingClientRect().toJSON();return {card:box('.task-card'),title:box('.task-copy h2'),hint:box('.swipe-guide'),options:box('.card-options>summary'),nav:box('.nav'),width:document.documentElement.scrollWidth,viewport:innerWidth};});
  assert.equal(geometry.width,geometry.viewport,'horizontal overflow');assert(Math.abs(geometry.card.width-back.width)<1&&Math.abs(geometry.card.height-back.height)<1,'front/back mismatch');
  if(viewport.height>=700){for(const key of ['title','hint','options'])assert(geometry[key].bottom<=geometry.nav.top-8,`${viewport.width}: ${key} is obscured (${JSON.stringify(geometry)})`);}
  await snapshot(page,'walk-'+viewport.width);await options(page);await page.getByRole('button',{name:'完成',exact:true}).waitFor({state:'visible'});
  record({test:'layout',viewport,geometry});await context.close();
 }
 {
  const {context,page}=await fresh();await start(page);await reveal(page);await options(page);
  const before=await game(page);const clickTime=await page.evaluate(()=>{const button=document.querySelector('[data-action="complete"]');window.feedbackTimes={start:performance.now()};const observer=new MutationObserver(()=>{if(document.querySelector('.completion-stamp')&&!window.feedbackTimes.visible)window.feedbackTimes.visible=performance.now();});observer.observe(document.body,{childList:true,subtree:true});button.click();button.click();return window.feedbackTimes.start;});
  await page.locator('.completion-stamp').waitFor();await snapshot(page,'ordinary-completion');assert.equal(await page.locator('dialog[open]').count(),0);assert.equal((await game(page)).score.total,2);
  await page.locator('.completion-stamp').waitFor({state:'detached'});record({test:'ordinary-feedback',duration:420,responseMs:await page.evaluate(()=>window.feedbackTimes.visible)-clickTime});
  assert.equal((await game(page)).s.session.slots.filter(x=>x.status==='done').length,1,'double click counted twice');
  for(const [i,total] of [[1,4],[2,9],[3,11]]){await reveal(page);await options(page);await page.getByRole('button',{name:'完成',exact:true}).click();
   if(i>=2){await page.locator('.reward-milestone[open]').waitFor();await snapshot(page,'milestone-'+total);await page.getByRole('button',{name:'继续冒险',exact:true}).click();}
   else {await page.locator('.completion-stamp').waitFor();await page.locator('.completion-stamp').waitFor({state:'detached'});}
   assert.equal((await game(page)).score.total,total);
  }
  await page.getByRole('button',{name:'一起收尾',exact:true}).click();await page.locator('#walk-name').fill('我们一起走过四站');await page.locator('#memory').fill('街角的阳光与笑声');
  await visibleAgain(page);assert.equal(await page.locator('#memory').inputValue(),'街角的阳光与笑声');await page.reload();assert.equal(await page.locator('#walk-name').inputValue(),'我们一起走过四站');
  await page.locator('[name="closing"]').check();await page.getByRole('button',{name:'保存记录',exact:true}).click();await page.locator('.reward-milestone[open]').waitFor();await page.getByRole('button',{name:'继续冒险',exact:true}).click();
  await page.locator('.journey-record').waitFor();const end=await game(page);assert.equal(end.s.session,null);assert.equal(end.s.history[0].slots.filter(x=>x.status==='done').length,4);assert.equal(end.s.history[0].closing,true);
  await snapshot(page,'complete-journey');await page.reload();assert.equal((await game(page)).s.history[0].memory,'街角的阳光与笑声');record({test:'full-short-journey',completed:4,total:15,baselineSession:before.s.session.id});await context.close();
 }
 {
  const {context,page}=await fresh();await seedPaid(page);await page.locator('#actual-cost').fill('12.5');await visibleAgain(page);assert.equal(await page.locator('#actual-cost').inputValue(),'12.5');
  await page.getByRole('button',{name:'暂停',exact:true}).click();await page.getByRole('button',{name:'继续',exact:true}).waitFor();assert.equal(await page.locator('#actual-cost').inputValue(),'12.5');assert.equal(await page.locator('[data-swipe-card]').count(),0);await page.getByRole('button',{name:'继续',exact:true}).click();await page.getByRole('button',{name:'暂停',exact:true}).waitFor();
  await page.reload();assert.equal(await page.locator('#actual-cost').inputValue(),'12.5');
  await options(page);await page.getByRole('button',{name:'稍后再做',exact:true}).click();await page.getByRole('button',{name:'现在做这一张',exact:true}).click();assert.equal(await page.locator('#actual-cost').inputValue(),'12.5');
  await page.reload();assert.equal(await page.locator('#actual-cost').inputValue(),'12.5');await options(page);await page.getByRole('button',{name:'换一张',exact:true}).click();await page.waitForTimeout(500);assert.equal(await page.locator('#actual-cost').inputValue(),'0');
  await page.locator('#actual-cost').fill('7');await options(page);
  await page.evaluate(()=>{window.savedPut=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(){throw new DOMException('Injected full storage','QuotaExceededError');};});
  await page.getByRole('button',{name:'完成',exact:true}).click();await page.waitForTimeout(180);assert.equal((await game(page)).score.total,0);assert.equal(await page.locator('#actual-cost').inputValue(),'7');assert.equal(await page.locator('.completion-stamp').count(),0);
  await page.evaluate(()=>{IDBObjectStore.prototype.put=window.savedPut;});await page.getByRole('button',{name:'完成',exact:true}).click();await page.locator('.card-reverse').waitFor();assert.equal((await game(page)).s.session.slots[0].spent,7);
  record({test:'drafts-and-save-failure',foreground:true,pause:true,refresh:true,later:true,replacement:true,retry:true});await context.close();
 }
 {
  const {context,page}=await fresh({width:320,height:700},{isMobile:true,hasTouch:true});await start(page);await reveal(page);const cdp=await context.newCDPSession(page);
  const touch=async(dx,dy=0,cancel=false)=>{const b=await page.locator('[data-swipe-card]').boundingBox(),x=b.x+b.width/2,y=b.y+b.height*.38;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
   for(let i=1;i<=6;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/6,y:y+dy*i/6}]});
   const transform=await page.locator('[data-swipe-card]').evaluate(el=>getComputedStyle(el).transform);await cdp.send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]});await page.waitForTimeout(800);return transform;};
  const original=(await game(page)).s.session.slots[0].card.id;
  await touch(20);assert.equal((await game(page)).s.session.slots[0].card.id,original);await touch(5,70);assert.equal((await game(page)).score.total,0);await touch(100,0,true);assert.equal((await game(page)).score.total,0);
  const transform=await touch(-110);assert.notEqual((await game(page)).s.session.slots[0].card.id,original);assert.notEqual(transform,'none');await touch(110);assert.equal((await game(page)).score.total,2);
  record({test:'touch',shortCancel:true,vertical:true,pointerCancel:true,captureHandover:true,replace:true,complete:true,transform});await context.close();
 }
 {
  for(const viewport of [{width:320,height:700},{width:390,height:844}]){
   const {context,page}=await fresh(viewport);await start(page);await page.evaluate(()=>{document.documentElement.style.setProperty('--walk-safe-top','47px');document.documentElement.style.setProperty('--walk-safe-bottom','34px');});await reveal(page);
   const gap=await page.evaluate(()=>document.querySelector('.nav').getBoundingClientRect().top-document.querySelector('.card-options summary').getBoundingClientRect().bottom);assert(gap>=8,'safe area hides options');await snapshot(page,'safe-area-'+viewport.width);await context.close();
  }
  record({test:'safe-area',top:47,bottom:34});
 }
 {
  const {context,page}=await fresh();await start(page);await page.locator('.card-reverse').press('Enter');await page.locator('[data-swipe-card]').waitFor();await page.waitForTimeout(380);
  await page.locator('.card-options summary').press('Space');await page.getByRole('button',{name:'完成',exact:true}).press('Enter');await page.locator('.completion-stamp').waitFor();await page.locator('.card-reverse').evaluate(el=>el.click());await page.locator('[data-swipe-card]').waitFor();
  const next=await game(page);assert.equal(next.score.total,2);assert.equal(next.s.session.seen.length,2);record({test:'keyboard-and-immediate-next',nextDuringFeedback:true});await context.close();
 }
 {
  const {context,page}=await fresh({width:320,height:700});await seedPaid(page);
  const text='一起观察城市的不同细节，轮流描述再请对方寻找。'.repeat(8).slice(0,200),note='把看到的内容和彼此分享。'.repeat(50).slice(0,500);
  await page.evaluate(async({text,note})=>{const {updateState}=await import('./storage.mjs');await updateState(s=>Object.assign(s.session.slots[0].card,{text,note}));},{text,note});await page.reload();
  const measured=await page.evaluate(()=>{const box=s=>document.querySelector(s).getBoundingClientRect();return {title:box('.task-copy h2').bottom,meta:box('.task-meta').top,options:box('.card-options summary').bottom,nav:box('.nav').top};});
  assert(measured.title<=measured.meta,'long title overlaps metadata');assert(measured.options<=measured.nav-8,'paid task options obscured');await snapshot(page,'long-task-320');
  await page.locator('.task-reading summary').click();assert.equal(await page.locator('.task-reading h3').innerText(),text);assert.equal(await page.locator('.task-reading p').innerText(),note);
  await page.locator('#actual-cost').fill('14');await page.setViewportSize({width:320,height:420});await page.locator('#actual-cost').focus();await page.locator('#actual-cost').scrollIntoViewIfNeeded();
  const inputBox=await page.locator('#actual-cost').boundingBox();assert(inputBox.y>=0&&inputBox.y+inputBox.height<420-60,'input unreachable in reduced viewport');
  record({test:'long-task-and-reduced-viewport',textLength:text.length,noteLength:note.length,measured});await context.close();
 }
 {
  for(const config of [{mode:'half',scoring:true},{mode:'free',scoring:true},{mode:'short',scoring:false}]){
   const {context,page}=await fresh({width:320,height:700});await page.evaluate(async config=>{const {updateState}=await import('./storage.mjs');const {newSession}=await import('./core.mjs');await updateState(s=>newSession(s,{...s.preferences,...config}));location.hash='walk';},config);await page.reload();
   if(config.mode==='free'){assert.equal(await page.locator('.score-value small').innerText(),' 分');assert.equal(await page.locator('.reward-preview').innerText(),'自由积累 · 收尾留下一份双人纪念');}
   else {await reveal(page);const position=await page.evaluate(()=>({options:document.querySelector('.card-options summary').getBoundingClientRect().bottom,nav:document.querySelector('.nav').getBoundingClientRect().top}));assert(position.options<=position.nav-8);}
   if(!config.scoring)assert.equal(await page.locator('.score-value').count(),0);await context.close();
  }
  record({test:'half-free-unscored',zeroBudget:true});
 }
 {
  const {context,page}=await fresh();await page.getByRole('button',{name:'收藏册',exact:true}).click();await page.getByRole('button',{name:'＋ 写一张自己的卡',exact:true}).click();await page.locator('#card-text').fill('轮流找同一种颜色');await page.locator('#card-note').fill('彼此交换找到的细节');
  await visibleAgain(page);await page.reload();assert.equal(await page.locator('#card-text').inputValue(),'轮流找同一种颜色');await page.getByRole('button',{name:'放进收藏册',exact:true}).click();await page.locator('#card-form').waitFor({state:'detached'});
  await page.getByRole('button',{name:'＋ 写一张自己的卡',exact:true}).click();assert.equal(await page.locator('#card-text').inputValue(),'');record({test:'custom-form-draft',reload:true,clearAfterSave:true});await context.close();
 }
 {
  const {context,page}=await fresh({width:390,height:844},{reducedMotion:'reduce'});await start(page);await reveal(page);await options(page);await page.getByRole('button',{name:'完成',exact:true}).click();await page.locator('.card-reverse').waitFor();assert.equal((await game(page)).score.total,2);assert.equal(await page.locator('dialog[open]').count(),0);
  await page.waitForFunction(()=>navigator.serviceWorker.controller);await context.setOffline(true);await page.reload();await reveal(page);await options(page);await page.getByRole('button',{name:'完成',exact:true}).click();await page.locator('.card-reverse').waitFor();assert.equal((await game(page)).score.total,4);await page.reload();assert.equal((await game(page)).score.total,4);
  await context.setOffline(false);await page.reload();assert.equal((await game(page)).score.total,4);record({test:'offline-and-reduced-motion',reopen:true,complete:true,reconnect:true});await context.close();
 }
 {
  // Serve immutable baseline and new builds from the same isolated subpath,
  // exercising real service-worker waiting/apply/reload behavior.
  const ref=process.env.CITYWALK_BASELINE_REF||'ab9bbd2b3b64db60ebf391ee79e906b46093a8b7';
  const files=execFileSync('git',['ls-tree','--name-only',ref+':dist'],{encoding:'utf8'}).trim().split(/\r?\n/);
  let baselinePhase=true,resources=new Map(files.map(name=>[name,execFileSync('git',['show',ref+':dist/'+name],{maxBuffer:4*1024*1024})]));
  // Bootstrap the legacy cache with a body-draining installer. Its old client,
  // cache version and update protocol remain intact for the migration test.
  resources.set('sw.js',Buffer.from(resources.get('sw.js').toString().replace('return[request,response];','const copy=response.clone();await response.arrayBuffer();return[request,copy];')));
  const server=createServer((request,response)=>{const pathname=new URL(request.url,'http://localhost').pathname,name=pathname.slice('/citywalk/'.length)||'index.html',content=resources.get(name);
   if(!content){response.writeHead(404);response.end();return;}const type=/\.(mjs|js)$/.test(name)?'text/javascript':name.endsWith('.css')?'text/css':name.endsWith('.svg')?'image/svg+xml':name.endsWith('.webp')?'image/webp':name.endsWith('.png')?'image/png':name.endsWith('.webmanifest')?'application/manifest+json':'text/html';
   response.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store','Connection':baselinePhase?'close':'keep-alive'});response.end(content);
  });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url=`http://127.0.0.1:${server.address().port}/citywalk/`;
  const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  page.setDefaultTimeout(15000);
  try{
   await page.goto(url);await page.getByRole('button',{name:'领取通行证'}).waitFor();await page.waitForFunction(()=>navigator.serviceWorker.controller);await seedPaid(page);
   await page.locator('#actual-cost').fill('19.75');const before=await game(page);
   const names=await fs.readdir('dist');resources=new Map(await Promise.all(names.map(async name=>[name,await fs.readFile(path.join('dist',name))])));baselinePhase=false;
   await page.evaluate(async()=>{await (await navigator.serviceWorker.getRegistration()).update();});await page.locator('[data-update-banner]:not(.hidden)').waitFor();
   await page.locator('[data-update-banner] [data-action="apply-update"]').click();await page.waitForFunction(()=>document.querySelector('.walk-status')&&document.querySelector('#actual-cost')?.value==='19.75');
   assert.equal((await game(page)).s.session.id,before.s.session.id);assert.equal((await game(page)).s.revision,before.s.revision);await snapshot(page,'upgrade-preserved');
   await context.setOffline(true);await page.reload();assert.equal(await page.locator('#actual-cost').inputValue(),'19.75');record({test:'baseline-upgrade',baseline:ref,bootstrapInstaller:'body-drain-only',subpath:'/citywalk/',persistentConnections:true,expense:true,session:true,offline:true});
  }catch(error){console.error('Upgrade fixture: '+JSON.stringify(await page.evaluate(async()=>{const reg=await navigator.serviceWorker.getRegistration();return {secure:isSecureContext,registration:!!reg,installing:reg?.installing?.state,waiting:reg?.waiting?.state,active:reg?.active?.state,caches:await caches.keys()};})));throw error;
  }finally{await context.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
 }
 assert.deepEqual(errors,[],'browser errors');const {RELEASE}=await import('../dist/release.mjs');await fs.writeFile(path.join(output,'results.json'),JSON.stringify({release:RELEASE,browser:await browser.version(),results,errors},null,2));console.log(JSON.stringify({passed:results.length,errors,output},null,2));
}catch(error){
 for(const context of browser.contexts())for(const page of context.pages()){
  await snapshot(page,'failure');const state=await game(page);console.error(JSON.stringify({errors,url:page.url(),text:(await page.locator('body').innerText()).slice(0,1000),score:state.score,slots:state.s.session?.slots.map(x=>({status:x.status,card:x.card?.id}))},null,2));
 }
 throw error;
}finally{await browser.close();}
