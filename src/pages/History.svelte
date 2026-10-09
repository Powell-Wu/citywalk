<script lang="ts">
 import type {GameState} from '../lib/config/types';
 import {score,elapsed} from '../lib/domain/core.mjs';
 import {fmtDate,timeText} from '../lib/ui/views.mjs';
 import {asset} from '../lib/config/assets';
 import PageHead from '../lib/components/PageHead.svelte';
 import ActionButton from '../lib/components/ActionButton.svelte';
 let {state}:{state:GameState}=$props();
</script>
<div class="page"><PageHead title="冒险日志"/><div class="journal-cover"><img src={asset('explorer-badge.webp')} alt="" width="64" height="64"><div><p class="eyebrow">双人冒险 · 冒险日志</p><p>{state.history.length?`我们一起走过 ${state.history.length} 程。`:'第一段故事，等你们出发。'}</p></div></div><div class="journal-list">{#each state.history as journey,i (journey.id)}<article class="journal-entry"><div class="journal-index" aria-hidden="true">{String(state.history.length-i).padStart(2,'0')}</div><div class="journal-entry-body"><div class="list-top"><span class="small muted">{fmtDate(journey.startedAt)}</span><span class="record-score">{journey.scoring?`${score(journey).total} 分`:`${score(journey).count} 张`}</span></div><h2>{journey.name}</h2><p class="help">同行 {timeText(elapsed(journey))} · 完成 {score(journey).count} 张任务</p>{#if journey.memory}<p class="journal-excerpt">{journey.memory.slice(0,90)}{journey.memory.length>90?'…':''}</p>{/if}<ActionButton label="翻开这一程" action="nav" kind="text" attrs={{'data-route':`detail/${journey.id}`}}/></div></article>{:else}<div class="panel empty"><img class="journal-empty-art" src={asset('journey-departure.webp')} alt="两人准备开启城市冒险" width="960" height="640"><h2>下一程，从今天开始</h2><ActionButton label="去走走" action="nav" attrs={{'data-route':state.session?'walk':'setup'}}/></div>{/each}</div><p class="footnote">回忆保存在这部设备上，换手机前记得导出备份。</p></div>
