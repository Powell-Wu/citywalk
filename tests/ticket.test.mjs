import test from 'node:test';
import assert from 'node:assert/strict';
import {ticketLines} from '../src/lib/services/ticket-export.mjs';
test('keepsake includes date, full prose, branch and every completed task, excluding skipped tasks',()=>{
 const journey={name:'街角 <img>',startedAt:1791504000000,branch:'sounds',memory:'一段回忆'.repeat(200),slots:[{status:'done',card:{text:'听见三种声音'}},{status:'skipped',card:{text:'未完成的任务'}}]};const lines=ticketLines(journey);assert(lines.some(x=>x.text===journey.name));assert(lines.some(x=>x.text===journey.memory));assert(lines.some(x=>x.text==='观察城市声音'));assert(lines.some(x=>x.text.includes('听见三种声音')));assert(!lines.some(x=>x.text.includes('未完成的任务')));assert(lines.some(x=>x.kind==='meta'&&/2026/.test(x.text)));
});
