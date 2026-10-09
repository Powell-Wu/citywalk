import test from 'node:test';
import assert from 'node:assert/strict';
import {canWriteSchema} from '../src/lib/services/schema-guard.mjs';
test('schema handshake uses an active but not-yet-controlling first worker and requests claim',async()=>{
 const messages=[],active={postMessage(data,ports){messages.push(data);if(ports)ports[0].postMessage({compatible:true});}};
 assert.equal(await canWriteSchema({controller:null,getRegistration:async()=>({active})},'r-aaaaaaaaaaaa'),true);
 assert.equal(messages[0].schema,2);assert.equal(messages[1].claim,true);
});
test('unsupported old worker and missing registration fail closed without writing',async()=>{
 assert.equal(await canWriteSchema({controller:{postMessage(){}}},'r-aaaaaaaaaaaa',{timeout:10}),false);
 assert.equal(await canWriteSchema({getRegistration:async()=>undefined},'r-aaaaaaaaaaaa'),false);
 assert.equal(await canWriteSchema(null,'development',{development:true}),true);
});
