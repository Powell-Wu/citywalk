import fs from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
import {appIconSvg,symbolSvg,wordmarkSvg} from '../src/lib/ui/brand-art.mjs';
const root=path.resolve(import.meta.dirname,'..');
const output=path.join(root,'public');
for(const [name,svg] of [['icon.svg',appIconSvg()],['brand-symbol.svg',symbolSvg()],['brand-wordmark.svg',wordmarkSvg()]])await fs.writeFile(path.join(output,name),svg+'\n');
const channel=process.env.CITYWALK_TEST_BROWSER||(process.platform==='win32'?'msedge':'chromium');
const browser=await chromium.launch({headless:true,...(channel==='chromium'?{}:{channel})});
try{
 for(const [name,size] of [['icon-180.png',180],['icon-192.png',192],['icon-512.png',512],['icon-maskable.png',512]]){
  const page=await browser.newPage({viewport:{width:size,height:size},deviceScaleFactor:1});
  await page.setContent(`<style>html,body{margin:0;width:100%;height:100%;overflow:hidden}svg{display:block}</style>${appIconSvg(size)}`);
  await page.screenshot({path:path.join(output,name)});await page.close();
 }
}finally{await browser.close();}
console.log('Roam SVG + 180/192/512/maskable PNG assets generated.');
