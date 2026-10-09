import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {publish} from '../scripts/publish.mjs';

test('Windows launcher uses ASCII and CRLF so cmd does not misparse lines',()=>{
 const bytes=fs.readFileSync(new URL('../publish.cmd',import.meta.url));
 assert([...bytes].every(b=>b<128));
 assert(!/(?<!\r)\n/.test(bytes.toString('ascii')));
 assert.match(fs.readFileSync(new URL('../.gitattributes',import.meta.url),'utf8'),/\*\.cmd text eol=crlf/);
});

function fixture({behind=0,ahead=0,changes=' M src/lib/domain/cards.mjs',fail='',staged='',legacyDist='',generatedStaged='',message='更新卡片 & echo secret'}={}){
 const calls=[],logs=[];
 return {calls,logs,options:{ask:async()=>message,log:s=>logs.push(s),open:u=>calls.push(['open',u]),run:(cmd,args)=>{
  calls.push([cmd,...args]);
  if(args[0]===fail)throw Error('simulated failure');
  if(args[0]==='branch')return 'main';
  if(args[0]==='remote')return 'https://github.com/Powell-Wu/citywalk.git';
  if(args[0]==='diff')return args.some(arg=>arg.startsWith('--diff-filter=ACMRT'))?generatedStaged:args.includes('--cached')?staged:'';
  if(args[0]==='ls-files')return legacyDist;
  if(args[0]==='rev-list')return `${ahead}\t${behind}`;
  if(args[0]==='status')return changes;
  if(args[0]==='config')return 'Configured identity';
  return '';
 }}};
}
test('publish stops before staging or pushing if tests fail or remote is ahead',async()=>{
 for(const params of [{fail:'--test'},{fail:'scripts/build.mjs'},{fail:'scripts/e2e.mjs'},{behind:1},{staged:'private.txt\0'},{staged:'dist/index.html\0',generatedStaged:'dist/index.html'}]){
  const f=fixture(params);await assert.rejects(publish(f.options));
  assert(!f.calls.some(c=>['add','commit','push','open'].includes(c[1])));
 }
});
test('migration untracks original dist after all checks, while the generated output is never added',async()=>{
 const f=fixture({legacyDist:'dist/app.mjs\ndist/index.html'});await publish(f.options);
 const remove=f.calls.findIndex(call=>call[1]==='rm'),browser=f.calls.findIndex(call=>call[1]==='scripts/e2e.mjs');
 assert(remove>browser);assert.deepEqual(f.calls[remove],['git','rm','-r','--cached','--','dist']);
 assert(!f.calls.find(call=>call[1]==='add').includes('dist'));
});
test('publish commits the description as one literal argument, then pushes and opens Actions',async()=>{
 const f=fixture();await publish(f.options);
 assert.deepEqual(f.calls.find(c=>c[1]==='commit'),['git','commit','-m','更新卡片 & echo secret']);
 assert(f.calls.findIndex(c=>c[1]==='push')>f.calls.findIndex(c=>c[1]==='commit'));
 assert.equal(f.calls.at(-1)[0],'open');
});
test('failed push is recoverable: retry pushes existing commit without making another',async()=>{
 const failed=fixture({fail:'push'});await assert.rejects(publish(failed.options));assert(!failed.calls.some(c=>c[0]==='open'));
 const retry=fixture({ahead:1,changes:''});await publish(retry.options);
 assert(!retry.calls.some(c=>c[1]==='commit'));assert(retry.calls.some(c=>c[1]==='push'));
});
test('empty description cancels and clean repository does not push',async()=>{
 for(const params of [{message:''},{changes:''}]){const f=fixture(params);await publish(f.options);assert(!f.calls.some(c=>['add','commit','push'].includes(c[1])));}
});
