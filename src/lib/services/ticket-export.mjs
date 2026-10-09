import {BRANCHES} from '../domain/rules.mjs';
export function ticketLines(journey){
 const completed=journey.slots.filter(slot=>slot.status==='done');
 return [{kind:'title',text:journey.name},{kind:'meta',text:new Date(journey.startedAt).toLocaleDateString('zh-CN')},
  {kind:'heading',text:journey.branch?BRANCHES[journey.branch].name:'一起走走的一程'},
  ...(journey.branch?[{kind:'text',text:BRANCHES[journey.branch].recap}]:[]),
  {kind:'heading',text:`一起完成的任务 · ${completed.length} 张`},
  ...completed.map((slot,i)=>({kind:'text',text:`${i+1}. ${slot.card.text}`})),
  ...(!completed.length?[{kind:'text',text:'这次没有完成任务卡，也留下一段同行的时间。'}]:[]),
  {kind:'heading',text:'想记住的瞬间'},{kind:'text',text:journey.memory||'把今天，收进口袋。'}];
}
export async function renderTickets(journey,brand,document=globalThis.document){
 const width=900,padding=70,lineHeight=42,maxLines=44;
 const measure=document.createElement('canvas').getContext('2d');measure.font='28px system-ui, sans-serif';
 const wrapped=[];
 for(const entry of ticketLines(journey)){
  measure.font=`${['title','heading'].includes(entry.kind)?'bold ':''}${entry.kind==='title'?38:28}px system-ui, sans-serif`;
  for(const paragraph of entry.text.split('\n')){let line='';for(const char of Array.from(paragraph)){if(line&&measure.measureText(line+char).width>width-padding*2){wrapped.push({...entry,text:line});line=char;}else line+=char;}wrapped.push({...entry,text:line||' '});}
  wrapped.push({kind:'space',text:''});
 }
 const pages=[];for(let offset=0;offset<wrapped.length;offset+=maxLines){
  const rows=wrapped.slice(offset,offset+maxLines),canvas=document.createElement('canvas');canvas.width=width;canvas.height=Math.max(750,280+rows.length*lineHeight);
  const ctx=canvas.getContext('2d');ctx.fillStyle='#fff6df';ctx.fillRect(0,0,width,canvas.height);ctx.strokeStyle='#19394f';ctx.lineWidth=12;ctx.strokeRect(20,20,width-40,canvas.height-40);ctx.lineWidth=2;ctx.strokeStyle='#b89b54';ctx.strokeRect(36,36,width-72,canvas.height-72);
  ctx.fillStyle='#19394f';ctx.font='bold 24px system-ui, sans-serif';ctx.fillText(`${brand} · 双人同行纪念票`,padding,100);ctx.setLineDash([8,7]);ctx.beginPath();ctx.moveTo(padding,125);ctx.lineTo(width-padding,125);ctx.stroke();ctx.setLineDash([]);
  let y=185;for(const row of rows){ctx.fillStyle=row.kind==='meta'?'#647165':'#19394f';ctx.font=`${['title','heading'].includes(row.kind)?'bold ':''}${row.kind==='title'?38:28}px system-ui, sans-serif`;if(row.kind!=='space')ctx.fillText(row.text,padding,y);y+=lineHeight;}
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
