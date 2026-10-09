import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {staticFiles} from './files.mjs';
const generated=new Set(['sw.js','release.json','release.mjs']);
const textFile=name=>/\.(?:mjs|js|css|html|json|webmanifest|svg)$/.test(name);
export async function prepareRelease(directory,{check=false,template}={}){
 const files=(await staticFiles(directory)).filter(name=>!generated.has(name));
 const sw=template??await fs.readFile(path.join(directory,'sw.js'),'utf8');
 const list=['./',...files.map(name=>'./'+name),'./release.json','./release.mjs'];
 const normalized=sw.replace(/const CACHE='[^']+';/,"const CACHE='__CONTENT_VERSION__';").replace(/const FILES=\[[^;]+;/,`const FILES=${JSON.stringify(list)};`).replace(/const INTEGRITY=[^;]+;\r?\n?/,'').replaceAll('\r\n','\n');
 const hash=createHash('sha256').update(normalized),integrity={};
 for(const file of files){const bytes=await fs.readFile(path.join(directory,file));hash.update(file+'\0');hash.update(textFile(file)?bytes.toString('utf8').replaceAll('\r\n','\n'):bytes);integrity['./'+file]=createHash('sha256').update(bytes).digest('hex');}
 const version='r-'+hash.digest('hex').slice(0,12);
 const releaseJSON=JSON.stringify({version})+'\n';
 const releaseModule=`// Compatibility for the original update entry.\nexport const RELEASE='${version}';\n`;
 integrity['./']=integrity['./index.html'];
 integrity['./release.json']=createHash('sha256').update(releaseJSON).digest('hex');
 integrity['./release.mjs']=createHash('sha256').update(releaseModule).digest('hex');
 const output=normalized.replace('__CONTENT_VERSION__','citywalk-static-'+version).replace(`const FILES=${JSON.stringify(list)};`,`const FILES=[${list.map(name=>JSON.stringify(name)).join(',')}];\nconst INTEGRITY=${JSON.stringify(integrity)};`);
 const expected={'sw.js':output,'release.json':releaseJSON,'release.mjs':releaseModule};
 if(check){for(const [file,contents] of Object.entries(expected))if((await fs.readFile(path.join(directory,file),'utf8')).replaceAll('\r\n','\n')!==contents)throw Error('Release stamp is stale. Run npm run release before publishing.');}
 else for(const [file,contents] of Object.entries(expected))await fs.writeFile(path.join(directory,file),contents);
 return version;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){const target=process.argv.slice(2).find(arg=>!arg.startsWith('--'));console.log(await prepareRelease(target?path.resolve(target):path.resolve(import.meta.dirname,'../dist'),{check:process.argv.includes('--check')}));}
