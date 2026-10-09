<script lang="ts">
 import type {GameState,UIState,Slot} from '../lib/config/types';
 import {score,spent,target,elapsed,TYPES,BRANCHES} from '../lib/domain/core.mjs';
 import {currentSlot,timeText} from '../lib/ui/views.mjs';
 import {journeyProgress} from '../lib/ui/journey-view.mjs';
 import {taskName} from '../lib/ui/task-view.mjs';
 import TaskCard from '../lib/components/TaskCard.svelte';
 import JourneyProgress from '../lib/components/JourneyProgress.svelte';
 import RewardPreview from '../lib/components/RewardPreview.svelte';
 import PageHead from '../lib/components/PageHead.svelte';
 import ActionButton from '../lib/components/ActionButton.svelte';
 let {state,ui}:{state:GameState;ui:UIState}=$props();
 let journey=$derived(state.session),slot:Slot|undefined=$derived(journey?currentSlot(journey,ui.focusSlot):undefined);
 let later=$derived(journey?.slots.filter(item=>item.status==='later')||[]);
 let progress=$derived(journey?journeyProgress(journey,slot?.id):null);
 let points=$derived(journey?score(journey):null);
 let branchNeeded=$derived(journey?.mode==='trial'&&!journey.branch&&!!slot&&journey.slots.indexOf(slot)>0);
 let title=$derived(!journey?'准备开始散步':journey.mode==='free'?(slot?taskName(slot.type):'自由领取任务'):slot?`第 ${progress!.current+1} 站 / ${journey.slots.length} 站 · ${taskName(slot.type)}`:later.length?'回到稍后任务':'最后一站 · 一起收尾');
</script>
<div class="page">
 {#if !journey}<PageHead {title}/><div class="empty"><h2>今天会遇见什么？</h2><ActionButton label="开始一局" action="nav" attrs={{'data-route':'setup'}}/></div>
 {:else}
 <section class="walk-status" aria-label="当前旅程"><div class="walk-heading"><div><h1>{title}</h1><p class="walk-meta">{journey.pausedAt?'已暂停 · ':''}<span data-elapsed>{timeText(elapsed(journey))}</span> · {journey.mode==='free'?`已抽 ${journey.slots.length} 张`:`还余 ${progress!.remaining} 站`}{#if journey.scoring} · <span class="score-value">{points!.total}<small>{target(journey)?` / ${target(journey)}`:''}</small> 分</span>{/if}</p></div><ActionButton label={journey.pausedAt?'继续':'暂停'} action="pause" kind="outline icon" attrs={{'data-session':journey.id}}/></div><JourneyProgress {journey} currentId={slot?.id}/><RewardPreview {journey}/></section>
 {#if branchNeeded}<section class="panel branch-choice" aria-label="选择旅程方向"><p class="eyebrow">下一站，一起决定</p><h2>想沿着哪种线索继续？</h2><p>方向会改变后两张任务，也写进纪念票。</p><div class="actions">{#each Object.entries(BRANCHES) as [key,branch]}<ActionButton label={branch.name} action="branch" kind="outline" attrs={{'data-session':journey.id,'data-branch':key,disabled:!!journey.pausedAt||ui.phase!=='idle'}}/>{/each}</div></section>{:else if slot}{#key `${slot.id}:${slot.card?.id||'back'}`}<TaskCard {journey} {slot} hint={!ui.swipeSeen} locked={ui.phase!=='idle'}/>{/key}
 {:else}<div class="panel empty"><p class="eyebrow">{journey.mode==='free'?'接下来想做什么？':'最后一站'}</p><h2>{journey.mode==='free'?'领取新任务':later.length?'还有稍后任务':'一起收尾'}</h2><p>{journey.mode==='free'?'选一种卡片，随时开始。':later.length?'可以点开下方卡片继续，也可以现在收尾。':`各分享最喜欢的瞬间，再为旅程取名${journey.scoring?` · 收尾 +${journey.rules.closing} 分`:''}。`}</p>{#if journey.mode==='free'}<div class="actions">{#each Object.entries(TYPES) as [type,item]}<ActionButton label={item.name} action="draw" kind="secondary" attrs={{'data-session':journey.id,'data-type':type,disabled:!!journey.pausedAt}}/>{/each}</div>{:else}<ActionButton label="一起收尾" action="nav" kind="block" attrs={{'data-route':'finish'}}/>{/if}</div>{/if}
 {#if journey.branch}<p class="branch-note">这一程 · {BRANCHES[journey.branch].name}</p>{/if}
 {#if later.length}<div class="panel"><h2>稍后任务 <span class="muted small">{later.length}张</span></h2><div class="list">{#each later as item}<div class="list-item"><span class={`tag ${item.type}`}>{TYPES[item.type].name}</span><p style="margin:12px 0">{item.card?.text}</p><ActionButton label="现在做这一张" action="focus" kind="text" attrs={{'data-slot':item.id}}/></div>{/each}</div></div>{/if}
 <details class="panel journey-tools"><summary>旅程工具 · 预算、奖励与撤销</summary><div class="list-top"><span class="budget-display">任务已花费 ¥{spent(journey)} / 预算 ¥{journey.budget}</span>{#if journey.mode!=='trial'}<ActionButton label="调整" action="filters" kind="text" attrs={{'data-session':journey.id}}/>{/if}</div>{#if journey.scoring}<hr class="divider"><h3>额外奖励</h3><div class="actions"><ActionButton label={journey.bonuses.surprise?`✓ 小惊喜 +${journey.rules.bonus}`:`小惊喜 +${journey.rules.bonus}`} action="bonus" kind="secondary" attrs={{'data-key':'surprise','data-session':journey.id}}/><ActionButton label={journey.bonuses.laugh?`✓ 笑出声 +${journey.rules.bonus}`:`笑出声 +${journey.rules.bonus}`} action="bonus" kind="secondary" attrs={{'data-key':'laugh','data-session':journey.id}}/></div><p class="help">两人都认可就点一下，每种一局一次。再点可撤回。</p>{#if points!.trio}<p class="help">✓ 三类卡片集齐，已自动奖励{points!.trio}分。</p>{/if}{/if}<hr class="divider"><div class="actions"><ActionButton label="撤销最近完成" action="undo" kind="text" attrs={{'data-session':journey.id,disabled:!points!.count}}/><ActionButton label="结束这次散步" action="nav" kind="text" attrs={{'data-route':'finish'}}/></div></details>
 {/if}
</div>

<style>
.branch-note{text-align:center;font-size:.8125rem;color:var(--muted)}.branch-choice h2{font-size:1.125rem}


.walk-status{margin:0 0 6px;position:relative}
.walk-heading{display:flex;gap:8px;align-items:center;justify-content:space-between;min-height:50px}
.walk-heading>div{min-width:0}.walk-heading h1{font-size:.9375rem;line-height:1.4;margin:0 0 3px;letter-spacing:0}
.walk-heading :global(.btn){flex:none;font-size:.8125rem;padding:6px 10px}
.walk-meta{font-size:.75rem;line-height:1.5;color:var(--muted);margin:0}.walk-meta .score-value{font-size:.875rem;font-weight:700;color:var(--accent)}.walk-meta .score-value small{font-size:.75rem;font-weight:400}
.journey-tools{padding:0 16px}.journey-tools>summary{font-size:.875rem;padding:12px 0}.journey-tools[open]{padding-bottom:16px}
@media(min-width:800px){.walk-status{max-width:560px;margin-left:auto;margin-right:auto}.walk-heading h1{font-size:1.1rem}}
</style>
