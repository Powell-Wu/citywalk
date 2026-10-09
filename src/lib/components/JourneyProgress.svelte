<script lang="ts">
 import type {Journey} from '../config/types';
 import {journeyProgress} from '../ui/journey-view.mjs';
 import {score} from '../domain/core.mjs';
 let {journey,currentId}:{journey:Journey;currentId?:string}=$props();
 let progress=$derived(journeyProgress(journey,currentId));
 const statuses:Record<string,string>={waiting:'待领取',active:'进行中',later:'稍后',done:'完成',skipped:'跳过'};
 let closingCurrent=$derived(journey.endedAt===null&&progress.current<0&&progress.remaining===0);
</script>
{#if journey.mode==='free'}
 <div class="journey-route free-route" aria-label="自由旅程进度"><span>已完成 {score(journey).count} 张</span>{#each progress.types as item}<span>{item.label} {item.count}</span>{/each}</div>
{:else}
 <ol class="journey-route" aria-label="旅程路线">
  {#each progress.stops as stop,i (stop.id)}
   <li class={`route-stop ${stop.status}${stop.current?' current':''}`} aria-current={stop.current?'step':undefined} aria-label={`第 ${i+1} 站 ${stop.label} · ${statuses[stop.status]}`}><span class="route-symbol" aria-hidden="true">{stop.status==='done'?'✓':stop.status==='skipped'?'–':stop.status==='later'?'…':i+1}</span><span>{stop.label}</span><span class="visually-hidden">{statuses[stop.status]}</span></li>
  {/each}
  <li class={`route-stop closing ${journey.closing?'done':''}${closingCurrent?' current':''}`} aria-current={closingCurrent?'step':undefined} aria-label={`收尾 · ${journey.closing?'完成':'分享瞬间并为旅程取名'}`}><span class="route-symbol" aria-hidden="true">{journey.closing?'✓':'✦'}</span><span>收尾</span></li>
 </ol>
{/if}

<style>

.journey-route{list-style:none;display:flex;gap:4px;justify-content:space-between;margin:6px 0;padding:0;font-size:.75rem}
.route-stop{display:flex;flex:1;align-items:center;flex-direction:column;gap:2px;color:var(--muted);line-height:1.2;min-width:0}
.route-symbol{display:grid;place-items:center;width:20px;height:20px;border:1px solid var(--line);background:var(--white);font:.75rem ui-monospace,monospace}
.route-stop.done .route-symbol{background:var(--green);border-color:var(--green);color:white}
.route-stop.current{color:var(--accent);font-weight:700}.route-stop.current .route-symbol{outline:2px solid var(--accent);outline-offset:1px}
.route-stop.later .route-symbol{border-style:dashed;background:#faf0d8;color:#785d26}.route-stop.skipped .route-symbol{background:var(--soft);color:var(--muted)}
.free-route{justify-content:flex-start;flex-wrap:wrap;gap:6px 16px;padding:8px 0}
</style>
