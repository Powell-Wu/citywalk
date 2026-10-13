import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {serveResources,resourcesFrom} from './server.mjs';

const output=process.env.CITYWALK_EDITOR_OUTPUT||(process.env.CITYWALK_E2E_OUTPUT?process.env.CITYWALK_E2E_OUTPUT+'/editor-polish':'test-results/editor-polish-20261013');
await fs.mkdir(output,{recursive:true});
const resources=await resourcesFrom(process.env.CITYWALK_BUILD_DIR||'dist'),server=await serveResources(()=>resources);
const browser=await chromium.launch({headless:true,...(process.env.CITYWALK_TEST_BROWSER==='chromium'?{}:{channel:'msedge'})});
const results=[],errors=[];
let activePage;
const ready=page=>page.waitForFunction(()=>document.querySelector('main')?.getAttribute('aria-busy')==='false');
const read=page=>page.evaluate(()=>new Promise(resolve=>{const r=indexedDB.open('citywalk-for-two',1);r.onsuccess=()=>{const db=r.result,q=db.transaction('state').objectStore('state').get('current');q.onsuccess=()=>{db.close();resolve(q.result)};};}));
const previewArt=page=>page.locator('[data-card-preview] > img').getAttribute('src');
async function shot(page,name,locator){await ready(page);await page.evaluate(()=>{for(const img of document.images)img.loading='eager';});await page.evaluate(()=>Promise.all([...document.images].map(img=>img.decode())));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'horizontal overflow');await(locator||page).screenshot({path:`${output}/${name}.png`,...(locator?{}:{fullPage:true})});}
try{
 for(const width of [320,390,1280]){
  const context=await browser.newContext({viewport:{width,height:width===320?700:width===390?844:900},reducedMotion:'reduce'}),page=await context.newPage();activePage=page;page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));console.log('CHECK editor '+width);
  await page.goto(server.base+'#library');await page.getByRole('button',{name:'完成过',exact:true}).click();await page.getByRole('button',{name:'不抽',exact:true}).click();assert.equal(await page.locator('.collection-card').count(),0);
  await page.getByRole('button',{name:'＋ 写一张自己的卡',exact:true}).click();await page.locator('[data-card-preview]').waitFor();
  await page.locator('#card-type').selectOption('event');await page.locator('#card-text').fill('用镜头找一处藏着笑脸的城市细节');assert.match(await previewArt(page),/art-photo\.webp$/);assert.equal(await page.locator('.draft-heading').innerText(),'挑战任务');
  await page.locator('[name=artKey][value=sound]').check();assert.match(await previewArt(page),/art-sound\.webp$/);await page.locator('#card-type').selectOption('talk');assert.match(await previewArt(page),/art-sound\.webp$/);await page.locator('[name=artKey][value=auto]').check();assert.match(await previewArt(page),/art-talk\.webp$/);await page.locator('#card-type').selectOption('event');assert.match(await previewArt(page),/art-photo\.webp$/);await page.locator('[name=artKey][value=sound]').check();
  let text='<img id="preview-injection" src=x onerror="alert(1)">镜头里的一处城市细节';await page.locator('#card-text').fill(text);await page.locator('#card-note').fill('一个人闭上眼睛，另一个人留意周围。交换角色再分享。');await page.locator('#card-minutes').fill('8');await page.locator('#card-cost').fill('12.50');await page.locator('#card-place').selectOption('indoor');
  assert.equal(await page.locator('[data-card-preview] h3').innerText(),text);assert.equal(await page.locator('#preview-injection').count(),0);assert.match(await page.locator('.draft-meta').innerText(),/8 分钟/);assert.match(await page.locator('.draft-meta').innerText(),/12.5/);
  text='轮流闭上眼睛30秒，告诉对方刚刚听到了哪三种城市声音。';await page.locator('#card-text').fill(text);
  console.log('CHECK preview before reload '+width);await page.reload();await page.locator('#card-form').waitFor();await page.locator('[data-preview-art]').filter({hasText:'城市声音'}).waitFor();assert.equal(await page.locator('#card-text').inputValue(),text);assert.equal(await page.locator('[data-card-preview] h3').innerText(),text);assert.match(await previewArt(page),/art-sound\.webp$/);assert.equal(await page.locator('#card-type').inputValue(),'event');assert.match(await page.locator('.draft-meta').innerText(),/12.5/);
  await shot(page,`preview-${width}`,page.locator('.editor-preview'));await shot(page,`editor-${width}`,page.locator('#card-form'));
  await page.locator('#card-cost').fill('-1');await page.getByRole('button',{name:'放进收藏册',exact:true}).click();assert.equal((await read(page))?.customCards.length||0,0);assert.equal(await page.locator('#card-text').inputValue(),text);await page.locator('#card-cost').fill('12.50');
  await page.getByRole('button',{name:'放进收藏册',exact:true}).click();await page.locator('#card-form').waitFor({state:'detached'});await ready(page);const saved=(await read(page)).customCards[0];assert.equal(saved.artKey,'sound');assert.equal(saved.cost,12.5);assert.equal(saved.minutes,8);assert.equal(saved.place,'indoor');
  for(const name of ['完成过','不抽','只看喜欢'])assert.equal(await page.getByRole('button',{name,exact:true}).getAttribute('aria-pressed'),'false');
  const entry=page.locator(`[data-library-card="${saved.id}"]`);assert(await entry.isVisible());assert.equal(await entry.locator('h2').evaluate(el=>document.activeElement===el),true);const bounds=await entry.boundingBox(),nav=await page.locator('.nav').boundingBox();assert(bounds.y>=0&&bounds.y+bounds.height<=nav.y,'newly saved card remains above navigation');await shot(page,`saved-${width}`,entry);await page.screenshot({path:`${output}/saved-viewport-${width}.png`});
  await page.getByRole('button',{name:'＋ 写一张自己的卡',exact:true}).click();assert.equal(await page.locator('#card-text').inputValue(),'');assert.match(await previewArt(page),/art-explore\.webp$/);
  results.push({width,automatic:'text and type matching',explicit:'selection takes precedence',draft:'reload restores preview, text and metadata',validation:'invalid cost keeps input and does not save',save:'all filters cleared, new card focused and visible',clear:'next editor starts empty'});await context.close();
 }
 assert.deepEqual(errors,[]);assert(!server.requests.some(r=>r.status!==200));await fs.writeFile(output+'/results.json',JSON.stringify({release:JSON.parse(resources.get('release.json').toString()).version,browser:browser.version(),results,errors},null,2));console.log(JSON.stringify({passed:results.length,errors},null,2));
}catch(error){await fs.writeFile(output+'/failure.json',JSON.stringify({message:error.message,results,errors},null,2));if(activePage&&!activePage.isClosed())await activePage.screenshot({path:output+'/failure.png',fullPage:true}).catch(()=>{});throw error;}finally{await browser.close();await server.close();}
