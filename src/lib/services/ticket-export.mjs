import {BRANCHES} from '../domain/rules.mjs';
import {drawBrand} from '../ui/brand-art.mjs';
import {POSTAL_ART,spriteRect,stampForJourney,STAMP_NAMES} from '../ui/postal-art.mjs';
export function ticketLines(journey){
 const completed=journey.slots.filter(slot=>slot.status==='done');
 return [{kind:'title',text:journey.name},{kind:'meta',text:new Date(journey.startedAt).toLocaleDateString('zh-CN')},
  {kind:'heading',text:journey.themePlan?.name||(journey.branch?BRANCHES[journey.branch].name:'沿途的一程')},
  ...(journey.themePlan?[{kind:'text',text:journey.themePlan.recap},{kind:'text',text:journey.themePlan.closing}]:[]),
  ...(journey.branch?[{kind:'text',text:BRANCHES[journey.branch].recap}]:[]),
  {kind:'heading',text:`一起完成的任务 · ${completed.length} 张`},
  ...completed.map((slot,i)=>({kind:'text',text:`${i+1}. ${slot.card.text}`})),
  ...(!completed.length?[{kind:'text',text:'这次没有完成任务卡，也留下一段同行的时间。'}]:[]),
  {kind:'heading',text:'想记住的瞬间'},{kind:'text',text:journey.memory||'把今天，收进口袋。'}];
}
export async function renderTickets(journey,brand,document=globalThis.document){
 const load=name=>new Promise((resolve,reject)=>{const img=document.createElement('img');img.onload=()=>resolve(img);img.onerror=()=>reject(Error('纪念美术暂时未加载，请稍后重试。'));img.src=new URL(name,document.baseURI).href;});
 const [illustration,stamps,seals]=await Promise.all([load('journey-keepsake.webp'),load(POSTAL_ART.stamps),load(POSTAL_ART.seals)]);
 const width=900,padding=70,lineHeight=42,maxLines=44;
 const measure=document.createElement('canvas').getContext('2d');measure.font='28px system-ui, sans-serif';
 const wrapped=[];
 for(const entry of ticketLines(journey)){
  measure.font=`${['title','heading'].includes(entry.kind)?'bold ':''}${entry.kind==='title'?38:28}px system-ui, sans-serif`;
  for(const paragraph of entry.text.split('\n')){let line='';for(const char of Array.from(paragraph)){if(line&&measure.measureText(line+char).width>width-padding*2){wrapped.push({...entry,text:line});line=char;}else line+=char;}wrapped.push({...entry,text:line||' '});}
  wrapped.push({kind:'space',text:''});
 }
 const pages=[];for(let offset=0;offset<wrapped.length;offset+=maxLines){
  const rows=wrapped.slice(offset,offset+maxLines),canvas=document.createElement('canvas');canvas.width=width;canvas.height=Math.max(900,610+rows.length*lineHeight);
  const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.fillStyle='#fff8e9';ctx.fillRect(0,0,width,canvas.height);ctx.strokeStyle='#19394f';ctx.lineWidth=8;ctx.strokeRect(24,24,width-48,canvas.height-48);ctx.lineWidth=2;ctx.strokeStyle='#dbb564';ctx.strokeRect(36,36,width-72,canvas.height-72);
  drawBrand(ctx,padding,60,44);ctx.fillStyle='#19394f';ctx.font='bold 24px system-ui, sans-serif';ctx.fillText(`${brand} · 双人同行纪念票`,padding+156,100);
  ctx.fillStyle='#e3eee2';ctx.fillRect(padding,136,width-padding*2,294);ctx.fillStyle='#fffdf5';ctx.fillRect(padding+16,152,474,245);ctx.drawImage(illustration,0,(illustration.height-illustration.width/2)/2,illustration.width,illustration.width/2,padding+24,160,458,229);
  const variant=stampForJourney(journey),sx=598,sy=160;ctx.fillStyle='#fff8e9';ctx.fillRect(sx-8,sy-18,150,229);ctx.strokeStyle='#9eb3b7';ctx.lineWidth=1;ctx.strokeRect(sx-8,sy-18,150,229);
  ctx.fillStyle='#285d89';ctx.font='bold 12px ui-monospace, monospace';ctx.fillText('ROAM POST / ×2',sx,sy-1);ctx.drawImage(stamps,...spriteRect(stamps,variant),sx,sy+10,134,134);ctx.font='bold 16px system-ui, sans-serif';ctx.fillStyle='#17354d';ctx.fillText(STAMP_NAMES[variant],sx,sy+169);
  ctx.save();ctx.globalCompositeOperation='multiply';ctx.translate(756,333);ctx.rotate(-.18);ctx.drawImage(seals,...spriteRect(seals,2),-53,-53,106,106);ctx.restore();ctx.font='18px system-ui, sans-serif';ctx.fillStyle='#376f62';ctx.fillText('冒险完成 · 把今天，收进口袋。',padding+24,417);
  ctx.setLineDash([8,7]);ctx.strokeStyle='#a9bcaf';ctx.beginPath();ctx.moveTo(padding,456);ctx.lineTo(width-padding,456);ctx.stroke();ctx.setLineDash([]);
  let y=515;for(const row of rows){ctx.fillStyle=row.kind==='meta'?'#566674':row.kind==='heading'?'#376f62':'#19394f';ctx.font=`${['title','heading'].includes(row.kind)?'bold ':''}${row.kind==='title'?38:28}px system-ui, sans-serif`;if(row.kind!=='space')ctx.fillText(row.text,padding,y);y+=lineHeight;}
  ctx.font='22px system-ui, sans-serif';ctx.fillStyle='#647165';ctx.fillText(`这一程已保存 · ${Math.floor(offset/maxLines)+1} / ${Math.ceil(wrapped.length/maxLines)}`,padding,canvas.height-70);
  const blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(Error('图片生成失败，请重试。')),'image/png'));pages.push(blob);
 }
 return pages;
}
export function showTicketDownload(blobs,name,onError){
 const dialog=document.createElement('dialog');dialog.className='dialog ticket-download';dialog.setAttribute('aria-label','保存纪念票');
 const title=document.createElement('h2');title.textContent=blobs.length>1?`纪念票共 ${blobs.length} 页`:'把这一程存成图片';dialog.append(title);
 const urls=[];
 blobs.forEach((blob,i)=>{const url=URL.createObjectURL(blob);urls.push(url);const filename=`${name.replace(/[\\/:*?"<>|]/g,'-').slice(0,40)}-纪念票${blobs.length>1?'-'+(i+1):''}.png`,image=document.createElement('img');image.src=url;image.alt=`纪念票第 ${i+1} 页`;image.style.cssText='display:block;width:100%;height:auto;margin:16px 0';dialog.append(image);
  const save=document.createElement('a');save.className='btn block';save.textContent=blobs.length>1?`保存第 ${i+1} 页`:'保存图片';save.href=url;save.download=filename;dialog.append(save);
  const file=new File([blob],filename,{type:'image/png'});if(navigator.canShare?.({files:[file]})){const share=document.createElement('button');share.type='button';share.className='btn block outline';share.textContent=blobs.length>1?`分享第 ${i+1} 页`:'分享图片';share.onclick=()=>navigator.share({files:[file]}).catch(error=>{if(error.name!=='AbortError')onError('分享未完成，可以选择保存图片。');});dialog.append(share);}
 });
 const close=document.createElement('button');close.type='button';close.className='btn block text';close.textContent='完成';close.onclick=()=>dialog.close();dialog.append(close);dialog.addEventListener('close',()=>{urls.forEach(url=>URL.revokeObjectURL(url));dialog.remove();},{once:true});document.body.append(dialog);dialog.showModal();return dialog;
}
