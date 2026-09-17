import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {prepareRelease} from './release.mjs';
const root=path.resolve(import.meta.dirname,'..'),dist=path.join(root,'dist');
await prepareRelease(dist,{check:true});
const files=await fs.readdir(dist);
for(const f of files.filter(x=>/\.(mjs|js)$/.test(x)))execFileSync(process.execPath,['--check',path.join(dist,f)]);
const html=await fs.readFile(path.join(dist,'index.html'),'utf8');
for(const [,file] of html.matchAll(/(?:src|href)="\.\/([^"]+)"/g))assert(files.includes(file),`Missing HTML asset ${file}`);
for(const f of files.filter(x=>x.endsWith('.mjs'))){const text=await fs.readFile(path.join(dist,f),'utf8');for(const [,dep] of text.matchAll(/from '\.\/([^']+)'/g))assert(files.includes(dep),`${f} references missing ${dep}`);}
const manifest=JSON.parse(await fs.readFile(path.join(dist,'manifest.webmanifest'),'utf8'));
for(const icon of manifest.icons)assert(files.includes(icon.src.replace('./','')));
const sw=await fs.readFile(path.join(dist,'sw.js'),'utf8');
for(const f of files.filter(x=>x!=='sw.js'))assert(sw.includes(`'./${f}'`),`${f} missing offline cache entry`);
const bytes=(await Promise.all(files.map(async f=>(await fs.stat(path.join(dist,f))).size))).reduce((a,b)=>a+b,0);
assert(bytes<1024*1024,'Static payload exceeded 1MB budget');
console.log(JSON.stringify({syntax:'valid',localAssets:'complete',pwaManifest:'valid',offlineCoverage:'complete',staticFiles:files.length,totalBytes:bytes},null,2));
