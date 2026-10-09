<script lang="ts">
 import type {GameState,UIState} from '../lib/config/types';
 import Passport from '../lib/components/Passport.svelte';
 import ActionButton from '../lib/components/ActionButton.svelte';
 import {asset} from '../lib/config/assets';
 let {state,ui}:{state:GameState;ui:UIState}=$props();
</script>
{#if !state.session}<section class="trial-invite" aria-label="三卡试玩"><div><strong>先一起玩三张</strong><p>15–20分钟 · 无需花费 · 留下一张纪念票</p></div><ActionButton label="直接试玩" action="start-trial" kind="secondary"/></section>{/if}
<div class="departure-grid"><section class="departure-scene" aria-labelledby="departure-title"><div class="departure-heading"><p class="eyebrow">双人冒险</p><h1 id="departure-title">城市里，<br>藏着下一关。</h1></div><img class="journey-art" src={asset('journey-departure.webp')} alt="两位探险者在晴日街角查看地图，前方是发光的城市入口" width="960" height="640" fetchpriority="high"><p class="departure-caption">带上彼此，出发。</p></section><section class="departure-pass"><Passport {state}/><div class="passport-action"><ActionButton label={state.session?'继续冒险':'领取通行证'} action="nav" kind="block" attrs={{'data-route':state.session?'walk':'setup'}}/><p class="footnote">{state.session?'进度已保存':'短途 · 半日 · 自由走走'}</p></div>{#if state.history.length}<div class="last-journey"><span class="small muted">上一程</span><p>{state.history[0].name}</p><ActionButton label="翻看回忆" action="nav" kind="text" attrs={{'data-route':`detail/${state.history[0].id}`}}/></div>{/if}<p class="status-line" data-offline>{ui.offlineReady?'✓ 离线内容已准备好':'首次出门前，请联网打开一次，准备离线内容。'}</p></section></div>

<style>
.trial-invite{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px;margin-bottom:16px;border:1px solid var(--line);background:var(--paper);border-radius:4px}.trial-invite p{font-size:.8125rem;color:var(--muted);margin:6px 0 0}.trial-invite :global(button){flex:none}@media(max-width:360px){.trial-invite{align-items:flex-start;flex-direction:column}}

.passport-action{margin:20px 12px 0}.passport-action :global(.btn){border:3px double #e4c783;background:#19394f}.passport-action .footnote{text-align:center;margin:12px 0 0}
</style>
