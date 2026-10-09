<script lang="ts">
 import type {GameState} from '../lib/config/types';
 import {score,target} from '../lib/domain/core.mjs';
 import {asset} from '../lib/config/assets';
 import PageHead from '../lib/components/PageHead.svelte';
 import ActionButton from '../lib/components/ActionButton.svelte';
 import ScoreBreakdown from '../lib/components/ScoreBreakdown.svelte';
 import JourneyProgress from '../lib/components/JourneyProgress.svelte';
 import RewardPreview from '../lib/components/RewardPreview.svelte';
 let {state}:{state:GameState}=$props();
 let journey=$derived(state.session),remaining=$derived(journey?.slots.filter(item=>!['done','skipped'].includes(item.status)).length||0);
</script>
<div class="page"><PageHead title={journey?'收好这一程':'这次散步已经保存'} back={journey?'walk':'home'}/>
{#if !journey}<div class="empty">到冒险日志里看看吧。<ActionButton label="查看记录" action="nav" attrs={{'data-route':'history'}}/></div>
{:else}<section class="closing-intro"><img class="journey-art" src={asset('journey-keepsake.webp')} alt="冒险结束，两人在城市露台收好地图与探险徽章" width="960" height="640" decoding="async"><div class="closing-intro-copy"><p class="eyebrow">这一程的最后一站{journey.scoring?` · 收尾 +${journey.rules.closing} 分`:''}</p><h2>把今天，收进口袋。</h2><p>各说一个最喜欢的瞬间，再给这次冒险取个名字。</p><span class="small muted">已完成 {score(journey).count} 张任务{journey.scoring?` · 当前 ${score(journey).total} 积分`:''}</span><ScoreBreakdown {journey}/>{#if journey.scoring&&target(journey)}<p class="help">目标 {target(journey)} 分 = 计划任务 {target(journey)-journey.rules.closing} 分 + 收尾 {journey.rules.closing} 分。三类集齐与额外奖励另计。</p>{/if}</div></section><JourneyProgress {journey}/><RewardPreview {journey}/><div class="panel closing-form">{#if remaining}<p class="help">还有 {remaining} 张未完成，可以留在这次记录里。结束后本局不再计分。</p>{/if}<form id="finish-form" data-session={journey.id}><label for="walk-name">这次散步的名字</label><input id="walk-name" name="name" maxlength="80" placeholder="比如：绕路也很开心的一天" required><label for="memory">留下一句话（可不填）</label><textarea id="memory" name="memory" maxlength="1000" placeholder="今天想记住的小事…"></textarea><label class="check"><input name="closing" type="checkbox">我们完成了这张收尾卡{journey.scoring?`（+${journey.rules.closing}分）`:''}</label><button class="btn block" type="submit">保存记录</button></form></div>{/if}
</div>
