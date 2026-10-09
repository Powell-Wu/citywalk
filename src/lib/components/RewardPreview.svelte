<script lang="ts">
 import type {Journey} from '../config/types';
 import {score,thresholds,target} from '../domain/core.mjs';
 let {journey}:{journey:Journey}=$props();
 let tiers=$derived(journey.scoring?thresholds(journey):[]),total=$derived(score(journey).total),next=$derived(tiers.findIndex((n:number)=>total<n));
</script>
{#if !tiers.length}<div class="reward-preview keepsake-preview">{journey.scoring?'自由积累 · ':'只记录旅程 · '}收尾留下一份双人纪念</div>
{:else}<details class="reward-preview"><summary>{next<0?'最高档奖励已达成':`下一档：${journey.rewards[next]} · 还差 ${tiers[next]-total} 分`}</summary><div class="reward-preview-list">{#each tiers as n,i}<p>{total>=n?'✓ 已达到':'待解锁'} · {n} 分 · {journey.rewards[i]}</p>{/each}<p>按最高达成档领取。完成计划任务与收尾，目标 {target(journey)} 分。</p></div></details>{/if}

<style>

.reward-preview{font-size:.75rem;border-bottom:1px dashed var(--line);margin:0 0 6px;color:var(--ink)}
.reward-preview summary{min-height:44px;display:list-item;line-height:1.5;padding:10px 0;overflow-wrap:anywhere}
.reward-preview-list{padding:4px 10px 10px;background:var(--white)}.reward-preview-list p{font-size:.8125rem;margin:8px 0}
.keepsake-preview{min-height:44px;padding:10px 0}
</style>
