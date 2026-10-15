import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {serveResources,resourcesFrom} from './server.mjs';
import {initialState,newSession,draw,complete,finish,validateBackup} from '../src/lib/domain/core.mjs';
import {POSTAL_ART,STAMP_NAMES,spritePosition} from '../src/lib/ui/postal-art.mjs';
const out=process.env.CITYWALK_ART_OUTPUT||'test-results/art-direction-20261013/visual';
await fs.mkdir(out,{recursive:true});
const resources=await resourcesFrom('dist'),server=await serveResources(()=>resources);
const browser=await chromium.launch({headless:true,...(process.env.CITYWALK_TEST_BROWSER==='chromium'?{}:{channel:process.env.CITYWALK_TEST_BROWSER||'msedge'})});
const errors=[],results=[];
const state=initialState(),now=Date.now();
for(const [i,theme] of ['mixed','observe','duo'].entries()){
 newSession(state,{...state.preferences,mode:'short',journeyTheme:theme,budget:0,scoring:false},now-(4-i)*3600000);
 const journey=state.session;
 for(const slot of journey.slots){draw(state,journey.id,slot.id,null,()=>.35);complete(state,journey.id,slot.id,slot.card.id,0,journey.startedAt+600000);}
 finish(state,journey.id,{name:['绕路也有新发现','城市藏着小线索','今天的默契加一'][i],memory:['没有赶路，一起打开了街角的新入口。','你看见窗边的小鸟，我发现了招牌的笑脸。','轮流出题，一起决定。原来我们还能这么配合。'][i],closing:true},journey.startedAt+1200000);
}
validateBackup(state);
const seed=async page=>page.evaluate(state=>new Promise((resolve,reject)=>{const r=indexedDB.open('citywalk-for-two',1);r.onerror=()=>reject(r.error);r.onsuccess=()=>{const db=r.result,tx=db.transaction('state','readwrite');tx.objectStore('state').put(state,'current');tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);};}),state);
async function capture(page,name,fullPage=false){
 await page.waitForFunction(()=>document.querySelector('main')?.getAttribute('aria-busy')==='false');
 await page.evaluate(()=>Promise.all([...document.images].map(img=>img.decode())));
 const geometry=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-innerWidth,images:[...document.images].every(img=>img.complete&&img.naturalWidth>0)}));
 assert(geometry.overflow<=1,JSON.stringify({name,...geometry}));assert(geometry.images);
 await page.screenshot({path:`${out}/${name}.png`,fullPage});results.push({name,...geometry});
}
try{
 for(const width of [320,390,1280]){
  const context=await browser.newContext({viewport:{width,height:width===320?700:width===390?844:900},reducedMotion:'reduce'}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(server.base);await page.locator('[data-page=home]').waitFor();await capture(page,`home-${width}`,width===1280);
  await page.getByRole('button',{name:'领取通行证',exact:true}).click();await page.locator('[data-page=setup]').waitFor();await capture(page,`setup-${width}`,true);
  await page.locator('[name=mode][value=short]').check();await page.locator('[name=scoring]').uncheck();await page.getByRole('button',{name:'出发',exact:true}).click();await page.locator('.card-reverse').click();await page.locator('[data-swipe-card]').waitFor();await capture(page,`task-${width}`);
  const gap=()=>page.evaluate(()=>document.querySelector('.nav').getBoundingClientRect().top-document.querySelector('.card-options>summary').getBoundingClientRect().bottom);
  assert(await gap()>=8,'Task options must clear navigation');
  if(width<700){await page.evaluate(()=>{document.documentElement.style.setProperty('--walk-safe-top','47px');document.documentElement.style.setProperty('--walk-safe-bottom','34px');});assert(await gap()>=8,'Task options must clear simulated safe areas');await capture(page,`task-safe-${width}`);await page.evaluate(()=>{document.documentElement.style.removeProperty('--walk-safe-top');document.documentElement.style.removeProperty('--walk-safe-bottom');});}
  await page.goto(server.base+'#history');await page.locator('[data-page=history]').waitFor();await capture(page,`album-empty-${width}`,true);
  await seed(page);await page.reload();await page.locator('.journal-entry').first().waitFor();assert.equal(await page.locator('.journal-entry').count(),3);await capture(page,`album-${width}`,true);
  await page.goto(server.base+'#library');await page.getByRole('button',{name:'任务卡池',exact:true}).click();await page.locator('.collection-card').first().waitFor();await capture(page,`library-${width}`);
  await page.goto(server.base+'#detail/'+state.history[0].id);await page.locator('.journey-record').waitFor();await capture(page,`ticket-${width}`,true);
  if(width===390){await page.getByRole('button',{name:'保存纪念票图片',exact:true}).click();await page.locator('.ticket-download img').waitFor();await page.locator('.ticket-download img').evaluate(img=>img.decode());const download=page.waitForEvent('download');await page.getByRole('link',{name:'保存图片',exact:true}).click();await(await download).saveAs(out+'/ticket-export.png');await page.getByRole('button',{name:'完成',exact:true}).click();}
  await context.close();
 }
 const board=`<!doctype html><meta charset="utf-8"><title>Roam 像素纪念美术</title><style>*{box-sizing:border-box}body{margin:0;padding:38px 46px;background:#fff8e9;color:#17354d;font-family:'Segoe UI','Microsoft YaHei',sans-serif}header{display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #19394f;padding-bottom:18px;margin-bottom:26px}h1{font-size:27px;margin:0}header p{font-size:12px;color:#376f62;margin:8px 0 0}.serial{font:12px monospace;color:#566674}.layout{display:grid;grid-template-columns:1fr 278px;gap:40px}h2{font-size:16px;margin:0 0 16px}.stamps{display:grid;grid-template-columns:repeat(3,1fr);gap:20px 28px}.stamp{background:#fffdf5;border:2px solid #b7c6c9;box-shadow:3px 3px #17354d14;padding:10px;position:relative}.stamp:before,.stamp:after{content:'';position:absolute;inset:8px auto 8px -3px;width:4px;background:repeating-linear-gradient(to bottom,#fff8e9 0 4px,transparent 4px 12px)}.stamp:after{left:auto;right:-3px}.tiny{font:9px monospace;display:flex;justify-content:space-between;margin-bottom:6px;color:#285d89}.picture{aspect-ratio:1;background-size:300% 200%;image-rendering:pixelated}.label{display:flex;justify-content:space-between;font-size:12px;margin-top:8px;font-weight:700}.label span{color:#376f62}.seals{display:grid;grid-template-columns:repeat(6,1fr);gap:16px}.seal{aspect-ratio:1;background-size:300% 200%;image-rendering:pixelated}.seal-label{font-size:10px;text-align:center;color:#566674}.ink{margin-top:28px}.cover{height:414px;background-size:cover;image-rendering:pixelated;position:relative;border:3px solid #19394f;box-shadow:5px 5px #17354d20}.cover p{text-align:center;color:#fff1b4;font-size:23px;font-weight:750;margin:48px 0 0;letter-spacing:.07em}.cover small{position:absolute;top:25px;left:0;right:0;text-align:center;color:#e5c782;font:8px monospace}.caption{margin:18px 0 0;color:#566674;font-size:12px;line-height:1.8}.tokens{display:flex;gap:8px;margin-top:22px}.token{width:28px;height:28px;border:1px solid #19394f55}footer{font-size:11px;color:#566674;border-top:1px solid #b7c6c9;padding-top:16px;margin-top:28px}</style><header><div><h1>沿途未定 · 城市像素冒险</h1><p>双人组队 / 探索、对话、合作 / 纪念美术套组</p></div><span class="serial">ROAM ART BOOK — 01</span></header><div class="layout"><section><h2>六枚冒险邮票</h2><div class="stamps">${STAMP_NAMES.map((name,i)=>`<article class="stamp"><div class="tiny"><span>ROAM POST</span><span>✦</span></div><div class="picture" style="background-image:url('../../../public/${POSTAL_ART.stamps}');background-position:${spritePosition(i)}"></div><div class="label">${name}<span>×2</span></div></article>`).join('')}</div><div class="ink"><h2>六枚透明纪念印章</h2><div class="seals">${['城市入口','探索发现','合作击掌','第一次出发','三类同行','新的眼光'].map((name,i)=>`<div><div class="seal" style="background-image:url('../../../public/${POSTAL_ART.seals}');background-position:${spritePosition(i)}"></div><div class="seal-label">${name}</div></div>`).join('')}</div></div></section><aside><h2>同行纪念册封面</h2><div class="cover" style="background-image:url('../../../public/${POSTAL_ART.cover}')"><small>ROAM / ADVENTURE LOG</small><p>同行纪念册</p></div><p class="caption">同一组角色，同一座城市。<br>收集完成的小冒险，点亮同行纪念章。</p><div class="tokens">${['#17354d','#fff8e9','#376f62','#366b91','#f1c76b','#ed643b'].map(color=>`<span class="token" style="background:${color}"></span>`).join('')}</div></aside></div><footer>图像为原创生成美术；标题、日期与状态由界面排版。大图原稿与透明印章已保留，网页使用压缩图集。</footer>`;
 await fs.writeFile(out+'/asset-board.html',board);const context=await browser.newContext({viewport:{width:1280,height:920}}),page=await context.newPage();await page.setContent(board.replaceAll('../../../public/',server.base));await page.waitForLoadState('networkidle');await page.screenshot({path:out+'/asset-board.png',fullPage:true});await context.close();
 assert.equal(errors.length,0);assert(!server.requests.some(r=>r.status!==200),JSON.stringify(server.requests.filter(r=>r.status!==200)));
 const png=await fs.readFile(out+'/ticket-export.png');assert.equal(png.readUInt32BE(16),900);
 await fs.writeFile(out+'/results.json',JSON.stringify({release:JSON.parse(resources.get('release.json').toString()).version,checks:results,pngWidth:900,errors},null,2));console.log(JSON.stringify({screens:results.length,pngWidth:900,errors},null,2));
}finally{await browser.close();await server.close();}
