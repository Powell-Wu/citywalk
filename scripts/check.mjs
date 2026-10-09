import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {prepareRelease} from './release.mjs';
import {staticFiles} from './files.mjs';
const root=path.resolve(import.meta.dirname,'..'),dist=path.join(root,process.env.CITYWALK_BUILD_DIR||'dist');
await prepareRelease(dist,{check:true});
const files=await staticFiles(dist),has=name=>files.includes(name);
for(const file of files.filter(name=>/\.(mjs|js)$/.test(name)))execFileSync(process.execPath,['--check',path.join(dist,file)]);
const checkURL=(url,from)=>{
 if(/^(?:https?:|data:|#)/.test(url))return;
 const name=url.startsWith('/citywalk/')?url.slice('/citywalk/'.length):url.startsWith('./')?path.posix.join(path.posix.dirname(from),url.slice(2)):url.startsWith('/')?null:path.posix.join(path.posix.dirname(from),url);
 assert(name&&has(name),`Missing or out-of-base asset ${url} in ${from}`);
};
for(const file of files.filter(name=>/\.(html|css)$/.test(name))){const text=await fs.readFile(path.join(dist,file),'utf8');for(const match of text.matchAll(/(?:src|href)="([^"]+)"|url\(\s*["']?([^"')\s]+)["']?\s*\)/g))checkURL(match[1]||match[2],file);}
const manifest=JSON.parse(await fs.readFile(path.join(dist,'manifest.webmanifest'),'utf8'));
assert.equal(manifest.id,'./');assert.equal(manifest.start_url,'./');assert.equal(manifest.scope,'./');for(const icon of manifest.icons)checkURL(icon.src,'manifest.webmanifest');
const sw=await fs.readFile(path.join(dist,'sw.js'),'utf8'),cached=JSON.parse(sw.match(/const FILES=(\[[^;]+);/)[1]);
for(const file of files.filter(name=>name!=='sw.js'))assert(cached.includes('./'+file),`${file} missing offline cache entry`);
assert(!files.some(name=>name.endsWith('.map')||name.startsWith('src/')),'Development sources shipped');
const bytes=(await Promise.all(files.map(async name=>(await fs.stat(path.join(dist,name))).size))).reduce((a,b)=>a+b,0);
assert(bytes<1024*1024,`Static payload exceeded 1MiB budget: ${bytes}`);
console.log(JSON.stringify({syntax:'valid',localAssets:'complete',pwaManifest:'compatible',offlineCoverage:'complete',staticFiles:files.length,totalBytes:bytes},null,2));
