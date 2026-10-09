const KEY='citywalk-update-draft';
const FORM_KEY='citywalk-form-drafts',MAX_AGE=12*60*60*1000;
const forms=['actual-cost','setup-form','finish-form','card-form','reward-form','filters-form'];
const cleanView=view=>({customEditor:!!view.customEditor,libraryType:['all','scene','talk','event'].includes(view.libraryType)?view.libraryType:'all',libraryFavorites:!!view.libraryFavorites,libraryCompleted:!!view.libraryCompleted,libraryDisabled:!!view.libraryDisabled,focusSlot:typeof view.focusSlot==='string'&&/^[a-zA-Z0-9-]{1,100}$/.test(view.focusSlot)?view.focusSlot:null});
const fieldsOf=element=>element.id==='actual-cost'?[element]:[...element.querySelectorAll('input,textarea,select')];
const fieldData=el=>({id:el.id,name:el.name,type:el.type,value:el.value,checked:el.checked});
function applyFields(elements,fields){
 for(const field of fields){
  const el=elements.find(el=>field.id?el.id===field.id:el.name===field.name&&el.type===field.type&&(!['radio','checkbox'].includes(el.type)||el.value===field.value));
  if(!el||el.type!==field.type||['file','password'].includes(el.type))continue;
  if(['checkbox','radio'].includes(el.type))el.checked=!!field.checked;else el.value=field.value;
 }
}
function formKey(name,context){
 if(name==='actual-cost')return JSON.stringify([name,context.session,context.slot,context.card]);
 if(['finish-form','filters-form'].includes(name))return JSON.stringify([name,context.session]);
 return name;
}
// A draft is tab-local. Storage failure retains the in-memory copy and never
// prevents a committed game action. A changed revision alone is not a new task.
export function createDraftKeeper(storage){
 let records={},view={};
 try{const saved=JSON.parse(storage?.getItem(FORM_KEY));records=saved?.records||{};view=saved?.view||{};}catch{}
 const persist=()=>{try{storage.setItem(FORM_KEY,JSON.stringify({records,view}));return true;}catch{return false;}};
 const prune=()=>{records=Object.fromEntries(Object.entries(records).filter(([,d])=>d&&Date.now()-d.at<MAX_AGE&&Array.isArray(d.fields)).sort((a,b)=>b[1].at-a[1].at).slice(0,60));};
 return {
  capture(document,context,ui={},exclude=[]){
   if(!context)return true;
   for(const name of forms){
    if(exclude.includes(name))continue;
    const element=document.getElementById(name);if(!element)continue;
    records[formKey(name,context)]={at:Date.now(),fields:fieldsOf(element).filter(el=>!['file','password'].includes(el.type)).map(fieldData)};
   }
   view={at:Date.now(),hash:context.hash,session:context.session,...cleanView(ui)};
   prune();return persist();
  },
  restore(document,context){
   prune();
   for(const name of forms){const element=document.getElementById(name),draft=records[formKey(name,context)];if(element&&draft)applyFields(fieldsOf(element),draft.fields);}
  },
  readView(context){return view.hash===context.hash&&view.session===context.session&&Date.now()-view.at<MAX_AGE?cleanView(view):{};},
  clear(name,context){delete records[formKey(name,context)];persist();},
  clearAll(){records={};view={};persist();}
 };
}
export function saveUpdateDraft(document,storage,context,view={}){
 const fields=[...document.querySelectorAll('input,textarea,select')].filter(el=>el.type!=='file'&&el.type!=='password'&&(el.id||el.name)).map(el=>({id:el.id,name:el.name,form:el.form?.id||'',type:el.type,value:el.value,checked:el.checked}));
 storage.setItem(KEY,JSON.stringify({context,fields,view:{customEditor:!!view.customEditor,libraryType:view.libraryType,libraryFavorites:!!view.libraryFavorites,libraryCompleted:!!view.libraryCompleted,libraryDisabled:!!view.libraryDisabled,focusSlot:view.focusSlot},at:Date.now()}));
}
export function readUpdateView(storage){
 try{const d=JSON.parse(storage.getItem(KEY));if(!d||Date.now()-d.at>3600000)return {};const v=d.view||{};return {customEditor:!!v.customEditor,libraryFavorites:!!v.libraryFavorites,libraryCompleted:!!v.libraryCompleted,libraryDisabled:!!v.libraryDisabled,libraryType:['all','scene','talk','event'].includes(v.libraryType)?v.libraryType:'all',focusSlot:typeof v.focusSlot==='string'&&/^[a-zA-Z0-9-]{1,100}$/.test(v.focusSlot)?v.focusSlot:null};}catch{return {};}
}
export function restoreUpdateDraft(document,storage,context){
 const text=storage.getItem(KEY);if(!text)return;
 storage.removeItem(KEY);
 let draft;try{draft=JSON.parse(text);}catch{return;}
 if(!draft.context||Object.entries(draft.context).some(([k,v])=>context[k]!==v)||Date.now()-draft.at>3600000||!Array.isArray(draft.fields))return;
 const elements=[...document.querySelectorAll('input,textarea,select')];
 for(const field of draft.fields){
  const el=elements.find(el=>field.id?el.id===field.id:el.name===field.name&&(el.form?.id||'')===field.form&&el.type===field.type&&(!['radio','checkbox'].includes(el.type)||el.value===field.value));
  if(!el||el.type!==field.type||el.type==='file'||el.type==='password')continue;
  if(['checkbox','radio'].includes(el.type))el.checked=!!field.checked;else el.value=field.value;
 }
}
