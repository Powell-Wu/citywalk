<script lang="ts">
 import type {GameState} from '../lib/config/types';
 import PageHead from '../lib/components/PageHead.svelte';
 import ActionButton from '../lib/components/ActionButton.svelte';
 import {MODES} from '../lib/domain/core.mjs';
 let {state}:{state:GameState}=$props();
</script>
<div class="page"><PageHead title={state.session?'还有一段散步没结束':'准备出发'}/>
 {#if state.session}<div class="panel"><p>可以继续上次，或者先结束这一局再重新开始。</p><ActionButton label="继续散步" action="nav" kind="block" attrs={{'data-route':'walk'}}/></div>
 {:else}<div class="setup-intro"><span class="setup-emblem" aria-hidden="true">↗</span><div><p class="eyebrow">今天的冒险</p><p>选好这一程，就出发。</p></div></div><form id="setup-form"><div class="mode-options">{#each Object.entries(MODES) as [key]}<label class="mode"><input type="radio" name="mode" value={key} checked={state.preferences.mode===key}><strong>{key==='trial'?'试玩':key==='short'?'短途':key==='half'?'半日':'自由'}</strong><span>{key==='trial'?'3张 · 15–20分钟 · 零消费、不计分':key==='short'?'4张 · 60–90分钟':key==='half'?'7张 · 3–4.5小时':'想走多久都可以'}</span></label>{/each}</div><div class="panel"><div class="field-row"><div><label for="place">今天的场景</label><select name="place" id="place" value={state.preferences.place}><option value="both">室内外都可以</option><option value="indoor">以室内为主</option><option value="outdoor">以户外为主</option></select></div><div><label for="budget">任务购物预算（元）</label><input id="budget" name="budget" type="number" inputmode="decimal" min="0" max="10000" step="0.01" value={state.preferences.budget} required></div></div><p class="help">填0只抽零消费任务。不包含交通和日常餐费。</p><label class="check"><input name="scoring" type="checkbox" checked={state.preferences.scoring}>开启计分与奖励</label><p class="help">不计分也可以玩全部卡片。奖励可在设置里修改。</p></div><ActionButton label="看看我们的奖励" action="nav" kind="text" attrs={{'data-route':'settings'}}/><button class="btn block" type="submit">出发</button><p class="footnote">时间只是建议，途中随时暂停、换卡或结束。</p></form>{/if}
</div>
