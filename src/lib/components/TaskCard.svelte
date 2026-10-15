<script lang="ts">
 import type {Journey,Slot} from '../config/types';
 import {TYPES,slotPoints} from '../domain/core.mjs';
 import {taskName} from '../ui/task-view.mjs';
 import {cardArt} from '../ui/art.mjs';
 import {taskBrief,taskInstructions} from '../domain/task-instructions.mjs';
 import {dueText} from '../ui/views.mjs';
 import {asset} from '../config/assets';
 import ActionButton from './ActionButton.svelte';
 import InkSeal from './InkSeal.svelte';
 let {journey,slot,hint=true,locked=false}:{journey:Journey;slot:Slot;hint?:boolean;locked?:boolean}=$props();
 let card=$derived(slot.card),art=$derived(card?cardArt(card):null);
 let instructions=$derived(card?taskInstructions(card,journey):null),brief=$derived(card?taskBrief(card,journey):null);
 let titleClipped=$state(false);
 function watchTitle(node:HTMLElement,_text:string){
  const check=()=>{if(node.isConnected)titleClipped=node.scrollHeight>node.clientHeight+1;};
  const observer=new ResizeObserver(check);observer.observe(node);check();
  return {update(){queueMicrotask(check);},destroy(){observer.disconnect();}};
 }
 let attrs=$derived({'data-session':journey.id,'data-slot':slot.id,'data-card':card?.id,disabled:!!journey.pausedAt||locked});
</script>
<div class="card-stage solid-deck" data-card-type={slot.type} style={`--card-back-art:url('${asset('deck-pattern.svg')}')`}><div class="card-object">
 <div class="card-back card-back-far" aria-hidden="true"></div><div class="card-back card-back-near" aria-hidden="true"></div>
 {#if card&&art}
  <div class="swipe-reveal reveal-left" aria-hidden="true">↻<strong>换一张</strong><span class="swipe-pending">继续左滑</span><span class="swipe-commit">松手换卡</span><i class="swipe-meter"></i></div><div class="swipe-reveal reveal-right" aria-hidden="true">✓<strong>完成</strong><span class="swipe-pending">继续右滑</span><span class="swipe-commit">松手完成</span><i class="swipe-meter"></i></div>
  <article class={`task-card solid-card card-front ${slot.type}`} data-swipe-card={journey.pausedAt?undefined:''} data-session={journey.id} data-slot={slot.id} data-card={card.id} tabindex="-1" aria-label="任务卡：左右滑动，或使用下方完成与换卡按钮">
   <div class="card-heading"><span class="quest-identity"><svg class="quest-emblem" viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d={slot.type==='scene'?'M3 3h6l6 4 6-4v18h-6l-6-4-6 4z':slot.type==='talk'?'M2 3h16v12h-7l-4 4v-4H2zM18 8h4v12h-3v3l-4-3H9v-4':'M4 2h3v20H4zM7 3h14v11H7z'} fill="none" stroke="currentColor" stroke-width="2"/></svg><span>{taskName(slot.type)}</span></span><span class="quest-value">{journey.scoring?`+${slotPoints(slot,journey)}`:''}</span></div>
   <div class="quest-art-frame"><img class="task-art" src={asset(art.src)} alt={art.alt} width="600" height="800" draggable="false"><div class="task-postmark"><InkSeal variant={slot.type==='scene'?1:slot.type==='talk'?0:2}/></div></div>
   <div class="task-copy"><h2 use:watchTitle={card.text}>{card.text}</h2>{#if titleClipped}<p class="task-note title-cue">完整任务在下方</p>{/if}{#if brief}<div class="task-brief" data-task-cooperation><p class="brief-first">先手：{brief.first}</p><p class="brief-action">{brief.action}</p><p class="brief-done">完成：{brief.done}</p></div>{/if}<div class="task-meta"><span>约 {card.minutes} 分钟</span><span>{card.cost?`预算 ¥${card.cost} 内`:'无需花费'}</span></div></div>
  </article>
 {:else}
  <button type="button" class={`task-card solid-card card-reverse ${slot.type}`} data-action="draw" data-session={journey.id} data-slot={slot.id} disabled={!!journey.pausedAt||locked} aria-label={`抽一张${TYPES[slot.type].name}`}><img class="reverse-art" src={asset('deck-pattern.svg')} alt="" width="500" height="700" draggable="false"><span class="visually-hidden">点击翻开{taskName(slot.type)}</span></button>
 {/if}
 </div>
 <div class="deck-caption">{#if journey.pausedAt}<p>暂停中 · 继续后可以操作</p>{:else if card}{#if hint}<p class="swipe-guide">左滑换卡 · 右滑完成</p>{/if}{:else}<p>点击翻开 · {taskName(slot.type)}</p><p class="muted small" data-due>{dueText(journey,slot)}</p>{/if}</div>
 <div class="deck-tools">
 {#if card}<div class="task-actions" data-task-actions><ActionButton label="完成" action="complete" {attrs}/><ActionButton label="换一张" action="replace" {attrs} kind="outline"/><details class="card-options"><summary aria-label="更多操作">更多</summary><div class="actions"><ActionButton label="稍后再做" action="later" {attrs} kind="text"/><ActionButton label="跳过" action="skip" {attrs} kind="text"/></div></details></div>{:else}<ActionButton label="跳过这个节点" action="skip" {attrs} kind="text"/>{/if}
 {#if card?.cost}<div class="task-expense"><label for="actual-cost">完成前填实际花费（元）</label><input id="actual-cost" type="number" min="0" max="10000" step="0.01" inputmode="decimal" value="0" disabled={!!journey.pausedAt||locked}></div>{/if}
 {#if card&&titleClipped}<section class="task-full" aria-label="任务全文"><h3>{card.text}</h3></section>{/if}

 {#if card}<details class="task-reading"><summary>任务详情</summary><h3>{card.text}</h3><p>{card.note}</p>{#if instructions}<section class="duo-handoff" aria-label="双人配合"><p>谁先：{instructions.first}</p><p>{instructions.action}</p><p>做到就完成：{instructions.done}</p></section>{/if}</details>{/if}
 </div>
 <p class="deck-count">{journey.mode==='free'?'自由模式':`本局另有 ${journey.slots.filter(item=>!['done','skipped'].includes(item.status)&&item.id!==slot.id).length} 张待完成`}</p>
</div>

<style>
.task-brief{font-size:.75rem;line-height:1.35;display:grid;gap:4px;color:var(--ink)}.task-brief p{margin:0;overflow-wrap:anywhere}.brief-first{color:var(--muted)}.brief-action{font-weight:650}.brief-done{color:var(--green)}
.task-actions{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) 48px;gap:6px;margin:5px 0}.task-actions :global(.btn){min-height:44px;padding:6px 4px;font-size:.8125rem}.task-actions .card-options{display:contents}.task-actions .card-options summary{display:flex;align-items:center;justify-content:center;min-height:44px;padding:0;border:1px solid var(--line);border-radius:4px;list-style:none;font-size:.75rem;cursor:pointer}.card-options summary::-webkit-details-marker{display:none}.task-actions .card-options .actions{grid-column:1/-1}.task-actions .card-options:not([open]) .actions{display:none}

.task-full{padding:12px 0;border-top:1px dashed var(--line)}.task-full h3{font-size:1rem;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere;margin:0}.solid-deck .task-note.title-cue{display:block}
.duo-handoff{font-size:.875rem;border-top:1px dashed var(--line);padding:10px 0;margin-top:8px}.duo-handoff p{margin:0 0 6px}


.solid-deck{container-type:inline-size;--card-width:min(360px,calc((100svh - 390px - max(0px,var(--walk-safe-top) - 12px) - var(--walk-safe-bottom))*5/7));width:min(100%,max(195px,var(--card-width)));max-width:360px;padding:6px 0 0}
.card-object{position:relative;aspect-ratio:5/7;perspective:1200px;isolation:isolate}
.solid-deck .card-back{inset:0;border:5px solid #19394f;border-radius:7px;background:#14364b var(--card-back-art) center/cover;box-shadow:inset 0 0 0 2px #e5c782}
:global([data-theme=adventure]) .solid-deck .solid-card{position:relative;display:block;width:100%;height:100%;min-height:0;margin:0;padding:6px;border:6px solid #19394f;border-radius:7px;background:#fff6df;box-shadow:inset 0 0 0 2px #e5c782,2px 3px 0 #132d4140;color:var(--ink);transform-origin:center;backface-visibility:hidden}
:global([data-theme=adventure]) .solid-deck .card-front{display:grid;grid-template-rows:10% 32% 58%;overflow:hidden}
:global([data-theme=adventure]) .solid-deck .card-reverse{background:#14364b;cursor:pointer;overflow:hidden}
.reverse-art{display:block;position:absolute;inset:0;width:100%;height:100%;object-fit:cover;image-rendering:pixelated;pointer-events:none}
.solid-deck .card-reverse:focus-visible{outline:3px solid #2d8d86;outline-offset:5px}
.solid-deck .card-reverse:disabled{cursor:default;opacity:.75}
.solid-deck .card-heading{display:flex;align-items:center;justify-content:space-between;gap:6px;min-height:0;padding:0 8px;border-bottom:1px solid #cbb87c;background:#fff6df;font-size:.875rem;font-weight:700}
.solid-deck .quest-emblem{width:22px;height:22px}.solid-deck .quest-value{font-size:.875rem;box-shadow:none;border:0;background:none;padding:0}
.solid-deck .quest-art-frame{min-height:0;padding:0;border:0;border-radius:0;overflow:hidden;background:#e3ede9}
.solid-deck .quest-art-frame::before{display:none}
.solid-deck .quest-art-frame::after{display:none}
:global(.shell[data-page=walk]) .solid-deck .task-art{display:block;width:100%;height:100%;aspect-ratio:auto;object-fit:cover;object-position:50% 42%;border-radius:0;image-rendering:pixelated;pointer-events:none}
.solid-deck .task-copy{padding:7px 8px 5px;display:flex;flex-direction:column;gap:5px;min-height:0;background:#fff6df;border-top:2px solid #d2bd82}
:global([data-theme=adventure]) .solid-deck .task-card h2{font-size:1.0625rem;line-height:1.35;margin:0;overflow:hidden;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;line-clamp:3;flex-shrink:0;max-height:4.05em;overflow-wrap:anywhere}
.solid-deck .task-note{font-size:.8125rem;line-height:1.4;margin:0;overflow:hidden;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-clamp:2;min-height:0}
.solid-deck .task-meta{font-size:.75rem;line-height:1.3;gap:4px 8px;margin-top:auto;padding-top:3px;border-top:1px solid #deceaa;flex-shrink:0}
.solid-deck .deck-caption{text-align:center;font-size:.8125rem;padding:5px 0 0}.deck-caption p{margin:0;min-height:22px}
.solid-deck .deck-tools{padding:0 4px 10px}.deck-tools .card-options{font-size:.875rem;margin:0}.card-options summary{min-height:44px;text-align:center;color:var(--ink)}
.card-options .actions{padding:8px 0;gap:8px}
.task-expense label{font-size:.8125rem;margin:12px 0 6px}.task-expense input{scroll-margin-block:80px}
.task-reading{font-size:.875rem;margin:4px 0}.task-reading summary{color:var(--muted);cursor:pointer}.task-reading h3{font-size:1rem;margin:12px 0 6px;overflow-wrap:anywhere}.task-reading p{white-space:pre-wrap;overflow-wrap:anywhere;margin-bottom:12px}
.solid-deck .swipe-reveal{top:15%;bottom:15%}
@media(max-width:360px){.solid-deck .task-copy{padding:7px 7px 4px;gap:4px}:global([data-theme=adventure]) .solid-deck .task-card h2{font-size:1rem}.solid-deck .card-heading{padding:0 5px;font-size:.8125rem}}
@media(max-height:760px){.solid-deck .task-note{display:none}}
@media(max-height:500px){.solid-deck{--card-width:240px}}
@media(prefers-reduced-motion:reduce){.solid-deck .solid-card{transition:none}.solid-deck .swipe-meter{transition:none}}
@container(max-width:230px){:global([data-theme=adventure]) .solid-deck .card-front{grid-template-rows:10% 20% 70%}.solid-deck .task-copy{padding:6px 6px 4px;gap:3px}:global([data-theme=adventure]) .solid-deck .task-card h2{-webkit-line-clamp:2;line-clamp:2}.solid-deck .task-note{display:none}}
.solid-deck{--task-tone:var(--green)}.solid-deck[data-card-type=talk]{--task-tone:var(--blue)}.solid-deck[data-card-type=event]{--task-tone:#975036}.card-heading{color:var(--task-tone)}.task-meta{display:flex;flex-wrap:wrap;color:var(--muted);margin-bottom:0}.task-note{color:var(--muted)}

</style>
