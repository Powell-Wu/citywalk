import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {prepareRelease} from './release.mjs';
const version=await prepareRelease('.');
await prepareRelease('.',{check:true});
await fs.mkdir('_site',{recursive:true});
for(const file of await fs.readdir('.')){
 if(!/\.(?:mjs|js|css|html|json|webmanifest|png|webp|svg|ico)$/.test(file)||['package.json','package-lock.json'].includes(file))continue;
 if(/\.(?:mjs|js)$/.test(file))execFileSync(process.execPath,['--check',file]);
 await fs.copyFile(file,`_site/${file}`);
}
await fs.writeFile('_site/.nojekyll','');
console.log(`Prepared ${version}`);
