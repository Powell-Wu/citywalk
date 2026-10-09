import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {prepareRelease} from '../scripts/release.mjs';
import {staticFiles} from '../scripts/files.mjs';
import {validateBackup,migrateState,score,complete,TYPES,thresholds} from '../src/lib/domain/core.mjs';
test('published v1 fixture validates and resumes with identical history and scoring',async()=>{
 const old=JSON.parse(await fs.readFile(new URL('./fixtures/v1-state.json',import.meta.url),'utf8'));
 const clean=validateBackup(old),history=structuredClone(clean.history);
 const originalFields=journey=>{const {rules,branch,...rest}=journey;return{...rest,slots:rest.slots.map(({points,...slot})=>slot)};};
 assert.equal(clean.version,2);assert.deepEqual(clean.history.map(originalFields),old.history);assert.deepEqual(originalFields(clean.session),old.session);assert.equal(migrateState(old).revision,old.revision);
 const oldPoints=TYPES.scene.points;try{TYPES.scene.points=99;assert.equal(score(clean.history[0]).total,6);assert.deepEqual(thresholds(clean.history[0]),[8,11,13]);}finally{TYPES.scene.points=oldPoints;}
 const first=clean.session.slots[0];complete(clean,clean.session.id,first.id,first.card.id,0);
 assert.equal(score(clean.session).total,2);assert.equal(score(clean.history[0]).total,6);assert.deepEqual(clean.history,history);
});
test('recursive fingerprint assets determine version; generated metadata does not cause a hash loop',async()=>{
 const root=path.resolve('test-results/release-fixtures');await fs.mkdir(root,{recursive:true});const dir=await fs.mkdtemp(path.join(root,'case-'));
 try{
  await fs.mkdir(path.join(dir,'assets'));await fs.writeFile(path.join(dir,'index.html'),'test\n');await fs.writeFile(path.join(dir,'assets/app-abc.js'),'export const value=1;\n');await fs.writeFile(path.join(dir,'assets/app-abc.css'),'body{color:red}');await fs.writeFile(path.join(dir,'assets/app-abc.js.map'),'private map');
  const template=await fs.readFile(new URL('../src/lib/services/sw-template.js',import.meta.url),'utf8');
  const version=await prepareRelease(dir,{template});assert.equal(await prepareRelease(dir),version);await prepareRelease(dir,{check:true});assert.equal(JSON.parse(await fs.readFile(path.join(dir,'release.json'),'utf8')).version,version);
  const sw=await fs.readFile(path.join(dir,'sw.js'),'utf8'),cached=JSON.parse(sw.match(/const FILES=(\[[^;]+);/)[1]);assert(cached.includes('./assets/app-abc.js'));assert(!cached.some(name=>name.endsWith('.map')));assert(!(await staticFiles(dir)).some(name=>name.endsWith('.map')));
  await fs.writeFile(path.join(dir,'assets/app-abc.js'),'export const value=2;\n');await assert.rejects(prepareRelease(dir,{check:true}),/stale/);assert.notEqual(await prepareRelease(dir),version);
 }finally{assert(dir.startsWith(root+path.sep));await fs.rm(dir,{recursive:true,force:true});}
});
