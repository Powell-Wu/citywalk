<script lang="ts">
 import type {GameState} from '../lib/config/types';
 import {score,elapsed} from '../lib/domain/core.mjs';
 import {fmtDate,timeText} from '../lib/ui/views.mjs';
 import {asset} from '../lib/config/assets';
 import {POSTAL_ART,stampForJourney} from '../lib/ui/postal-art.mjs';
 import PageHead from '../lib/components/PageHead.svelte';
 import ActionButton from '../lib/components/ActionButton.svelte';
 import Achievements from '../lib/components/Achievements.svelte';
 import PostageStamp from '../lib/components/PostageStamp.svelte';
 let {state}:{state:GameState}=$props();
 let count=$derived(state.history.reduce((n,journey)=>n+score(journey).count,0));
</script>
<div class="page wide"><PageHead title="冒险日志"/><div class="memoir-layout"><aside class="memoir-sidebar"><div class="memoir-cover" style:background-image={`url("${asset(POSTAL_ART.cover)}")`}><p>ROAM / ADVENTURE LOG</p><h2>同行纪念册</h2><span>把共同的小冒险，<br>收进这本纪念册。</span><small>VOL. {String(new Date().getFullYear())}</small></div><div class="memoir-stats"><div><strong>{state.history.length}</strong><span>段同行</span></div><div><strong>{count}</strong><span>个小瞬间</span></div></div></aside><div class="memoir-pages"><div class="memoir-heading"><p class="eyebrow">我们的冒险存档</p><h2>{state.history.length?'一起走过的路，都在这里。':'第一页，留给你们的下一程。'}</h2><p>一枚邮票，一个日期，一段只属于你们的回忆。</p></div><Achievements {state}/><div class="journal-list">{#each state.history as journey,i (journey.id)}<article class="journal-entry"><div class="journal-index" aria-hidden="true">{String(state.history.length-i).padStart(2,'0')}</div><div class="journal-entry-stamp"><PostageStamp variant={stampForJourney(journey)} compact/></div><div class="journal-entry-body"><div class="list-top"><span class="small muted">{fmtDate(journey.startedAt)}</span><span class="record-score">{journey.scoring?`${score(journey).total} 分`:`${score(journey).count} 张`}</span></div><h2>{journey.name}</h2><p class="help">同行 {timeText(elapsed(journey))} · 完成 {score(journey).count} 张任务</p>{#if journey.memory}<p class="journal-excerpt">{journey.memory.slice(0,90)}{journey.memory.length>90?'…':''}</p>{/if}<ActionButton label="翻开这一程" action="nav" kind="text" attrs={{'data-route':`detail/${journey.id}`}}/></div></article>{:else}<div class="panel empty memoir-empty"><PostageStamp variant={3}/><h2>下一程，从今天开始</h2><p>完成一次散步，把第一枚邮票收进纪念册。</p><ActionButton label="去走走" action="nav" attrs={{'data-route':state.session?'walk':'setup'}}/></div>{/each}</div></div></div><p class="footnote">回忆保存在这部设备上，换手机前记得导出备份。</p></div>
