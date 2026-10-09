<script lang="ts">
 import type {Journey} from '../config/types';
 import {score} from '../domain/core.mjs';
 let {journey}:{journey:Journey}=$props();
 let points=$derived(score(journey));
</script>
{#if journey.scoring}<dl class="score-breakdown" aria-label="积分明细">{#each [[points.base,'任务基础分'],[points.trio,'三类集齐'],[points.bonus,'额外奖励'],[points.closing,'一起收尾']] as [amount,label]}<div><dt>{label}</dt><dd>{amount} 分</dd></div>{/each}</dl>{/if}

<style>

.score-breakdown{margin:16px 0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 16px;font-size:.8125rem}
.score-breakdown>div{display:flex;gap:8px;justify-content:space-between}.score-breakdown dt{color:var(--muted)}.score-breakdown dd{margin:0;font-weight:650;white-space:nowrap}
</style>
