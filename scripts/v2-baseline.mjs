import fs from 'node:fs/promises';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {resourcesFrom} from './server.mjs';
const exec=promisify(execFile);

// Build an actual published schema-v2 source revision in an owned fixture.
// Dependencies are shared read-only; no install, checkout or user-data mutation.
export async function v2Baseline(){
 if(process.env.CITYWALK_V2_BASELINE_DIR){
  const fixture=path.resolve(process.env.CITYWALK_V2_BASELINE_DIR),resources=await resourcesFrom(fixture);
  return{ref:'artifact',resources,version:JSON.parse(resources.get('release.json').toString()).version,fixture};
 }
 const root=process.cwd(),ref=process.env.CITYWALK_V2_BASELINE_REF||'91d13cb';
 const git=async args=>(await exec('git',['-C',root,...args],{encoding:'buffer',maxBuffer:8*1024*1024,windowsHide:true})).stdout;
 const lock=await git(['show',`${ref}:package-lock.json`]);
 if(JSON.stringify(JSON.parse(lock))!==JSON.stringify(JSON.parse(await fs.readFile('package-lock.json','utf8'))))throw Error('v2 baseline dependencies differ; supply a verified baseline artifact instead.');
 const directory=path.resolve('test-results/v2-baselines');await fs.mkdir(directory,{recursive:true});
 const fixture=await fs.mkdtemp(path.join(directory,'source-'));
 const files=(await git(['ls-tree','-r','--name-only',ref])).toString().trim().split('\n').filter(file=>/^(src\/|public\/|scripts\/)/.test(file)||['package.json','package-lock.json','index.html','vite.config.ts','svelte.config.js','tsconfig.json'].includes(file));
 for(const file of files){const target=path.resolve(fixture,file);if(!target.startsWith(fixture+path.sep))throw Error('Invalid baseline path');await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,await git(['show',`${ref}:${file}`]));}
 const dependencyLink=path.join(fixture,'node_modules');await fs.symlink(path.resolve('node_modules'),dependencyLink,process.platform==='win32'?'junction':'dir');
 try{await exec(process.execPath,[path.join(fixture,'scripts/build.mjs')],{cwd:fixture,windowsHide:true,maxBuffer:4*1024*1024});}finally{await fs.unlink(dependencyLink);}
 const resources=await resourcesFrom(path.join(fixture,'dist'));return{ref,resources,version:JSON.parse(resources.get('release.json').toString()).version,fixture};
}
