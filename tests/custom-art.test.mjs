import test from 'node:test';
import assert from 'node:assert/strict';
import {ART,cardArtKey} from '../src/lib/ui/art.mjs';
import {initialState,newSession,draw,finish,validateCustomCard,validateBackup} from '../src/lib/domain/core.mjs';

const custom=()=>({id:'custom-picture',type:'scene',text:'一起拍照听城市的歌',note:'',minutes:5,cost:0,place:'both'});
test('explicit custom art overrides automatic text matching; built-in curation remains stable',()=>{
 assert.equal(cardArtKey(custom()),'photo');
 for(const artKey of Object.keys(ART)){const card={...custom(),artKey};validateCustomCard(card);assert.equal(cardArtKey(card),artKey);}
 assert.equal(cardArtKey({...custom(),id:'scene-01',artKey:'sound'}),'explore');
 for(const artKey of ['../private.png','__proto__','unknown',null,4])assert.throws(()=>validateCustomCard({...custom(),artKey}),/有效插画/);
});
test('custom art survives drawing, history and JSON backup, and older cards still import',()=>{
 const s=initialState();s.customCards.push({...custom(),artKey:'sound'});s.disabled=Array.from({length:16},(_,i)=>`scene-${String(i+1).padStart(2,'0')}`);
 newSession(s,s.preferences,1000);const journey=s.session;draw(s,journey.id,journey.slots[0].id);
 assert.equal(journey.slots[0].card.artKey,'sound');
 finish(s,journey.id,{name:'我们的自定义卡',memory:'',closing:false},2000);
 const restored=validateBackup(JSON.parse(JSON.stringify(s)));
 assert.equal(restored.customCards[0].artKey,'sound');assert.equal(restored.history[0].slots[0].card.artKey,'sound');
 delete restored.customCards[0].artKey;delete restored.history[0].slots[0].card.artKey;
 assert.equal(cardArtKey(validateBackup(restored).customCards[0]),'photo');
});
