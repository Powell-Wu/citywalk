import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createInterface} from 'node:readline/promises';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const allowed=['dist','tests','scripts','.github','package.json','package-lock.json','README.md','.gitignore','.gitattributes','publish.cmd'];
const inScope=file=>allowed.some(p=>file===p||file.startsWith(p+'/'));

export async function publish({run,ask,log,open}){
 const git=(...args)=>run('git',args);
 if(git('branch','--show-current').trim()!=='main')throw Error('请切回 main 分支后发布。');
 if(!/^https:\/\/github\.com\/Powell-Wu\/citywalk(?:\.git)?\/?$/.test(git('remote','get-url','--push','origin').trim()))throw Error('origin 推送地址不是 Powell-Wu/citywalk，已停止。');
 if(git('diff','--name-only','--diff-filter=U').trim())throw Error('存在未解决的合并冲突，请先处理。');
 const staged=git('diff','--cached','--name-only','-z').split('\0').filter(Boolean);
 if(staged.some(f=>!inScope(f)))throw Error('暂存区含项目发布范围外的文件，请先检查并取消暂存。');
 git('fetch','origin','main');
 const [ahead,behind]=git('rev-list','--left-right','--count','HEAD...origin/main').trim().split(/\s+/).map(Number);
 if(behind)throw Error('GitHub 有本地尚未同步的提交。请先处理本地修改并 git pull --ff-only，然后重试。脚本不会自动合并或覆盖文件。');
 log('正在生成版本、运行测试和检查…');
 run(process.execPath,['scripts/release.mjs'],true);
 run(process.execPath,['--test',...fs.readdirSync(path.join(root,'tests')).filter(f=>f.endsWith('.test.mjs')).map(f=>'tests/'+f)],true);
 run(process.execPath,['scripts/check.mjs'],true);
 const changes=git('status','--porcelain','--',...allowed).trim();
 if(!changes&&!ahead){log('没有需要提交或推送的修改。');return;}
 if(changes){
  log('\n本次提交的文件：\n'+changes);
  const message=(await ask('请输入修改说明（直接回车取消）：')).trim();
  if(!message){log('已取消，未创建提交或推送。');return;}
  // Configure identity locally only, and only from the user's own input.
  for(const [key,label] of [['user.name','Git 提交者名称'],['user.email','Git 提交邮箱（会出现在公开提交中，可用 GitHub 隐私邮箱）']]){
   let existing='';try{existing=git('config','--get',key).trim();}catch{}
   if(!existing){const value=(await ask(label+'：')).trim();if(!value)throw Error('未填写提交身份，已停止。');git('config','--local',key,value);}
  }
  git('add','--',...allowed);
  git('commit','-m',message);
 }else log(`发现 ${ahead} 个尚未推送的本地提交，正在重试推送。`);
 git('push','origin','main');
 log('\n已推送到 GitHub。网站正在由 Actions 测试和部署；绿色成功后才算上线。\nhttps://github.com/Powell-Wu/citywalk/actions');
 open('https://github.com/Powell-Wu/citywalk/actions');
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const rl=createInterface({input:process.stdin,output:process.stdout});
 const run=(command,args,live=false)=>{
  const result=spawnSync(command,args,{cwd:root,encoding:'utf8',stdio:live?'inherit':'pipe',windowsHide:true});
  if(result.error)throw Error(`无法执行 ${path.basename(command)}：${result.error.message}`);
  if(result.status!==0)throw Error(`${path.basename(command)} ${args[0]} 失败。\n${result.stderr||result.stdout||'请查看上方输出。'}\n若提交已经创建，修复问题后重新双击即可重试推送。`);
  return result.stdout||'';
 };
 try{await publish({run,ask:q=>rl.question(q),log:console.log,open:url=>{
  const r=spawnSync('rundll32.exe',['url.dll,FileProtocolHandler',url],{windowsHide:true});
  if(r.error)console.log('请手动打开上方 Actions 链接。');
 }});}catch(error){console.error('\n'+error.message);process.exitCode=1;}finally{rl.close();}
}
