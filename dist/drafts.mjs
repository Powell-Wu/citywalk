const KEY='citywalk-update-draft';
export function saveUpdateDraft(document,storage,context,view={}){
 const fields=[...document.querySelectorAll('input,textarea,select')].filter(el=>el.type!=='file'&&el.type!=='password'&&(el.id||el.name)).map(el=>({id:el.id,name:el.name,form:el.form?.id||'',type:el.type,value:el.value,checked:el.checked}));
 storage.setItem(KEY,JSON.stringify({context,fields,view:{customEditor:!!view.customEditor,libraryType:view.libraryType,libraryFavorites:!!view.libraryFavorites,focusSlot:view.focusSlot},at:Date.now()}));
}
export function readUpdateView(storage){
 try{const d=JSON.parse(storage.getItem(KEY));if(!d||Date.now()-d.at>3600000)return {};const v=d.view||{};return {customEditor:!!v.customEditor,libraryFavorites:!!v.libraryFavorites,libraryType:['all','scene','talk','event'].includes(v.libraryType)?v.libraryType:'all',focusSlot:typeof v.focusSlot==='string'&&/^[a-zA-Z0-9-]{1,100}$/.test(v.focusSlot)?v.focusSlot:null};}catch{return {};}
}
export function restoreUpdateDraft(document,storage,context){
 const text=storage.getItem(KEY);if(!text)return;
 storage.removeItem(KEY);
 let draft;try{draft=JSON.parse(text);}catch{return;}
 if(JSON.stringify(draft.context)!==JSON.stringify(context)||Date.now()-draft.at>3600000||!Array.isArray(draft.fields))return;
 const elements=[...document.querySelectorAll('input,textarea,select')];
 for(const field of draft.fields){
  const el=elements.find(el=>field.id?el.id===field.id:el.name===field.name&&(el.form?.id||'')===field.form&&el.type===field.type&&(!['radio','checkbox'].includes(el.type)||el.value===field.value));
  if(!el||el.type!==field.type||el.type==='file'||el.type==='password')continue;
  if(['checkbox','radio'].includes(el.type))el.checked=!!field.checked;else el.value=field.value;
 }
}
