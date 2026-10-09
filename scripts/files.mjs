import fs from 'node:fs/promises';
import path from 'node:path';
export async function staticFiles(directory,prefix=''){
 const files=[];
 for(const entry of await fs.readdir(path.join(directory,prefix),{withFileTypes:true})){
  const name=(prefix?prefix+'/':'')+entry.name;
  if(entry.isDirectory())files.push(...await staticFiles(directory,name));
  else if(entry.isFile()&&/\.(?:mjs|js|css|html|json|webmanifest|png|webp|svg|ico|woff2?)$/.test(name)&&!['package.json','package-lock.json'].includes(name))files.push(name);
 }
 return files.sort();
}
