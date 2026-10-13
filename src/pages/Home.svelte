<script lang="ts">
 import type {GameState,UIState} from '../lib/config/types';
 import Passport from '../lib/components/Passport.svelte';
 import ActionButton from '../lib/components/ActionButton.svelte';
 import PostageStamp from '../lib/components/PostageStamp.svelte';
 import InkSeal from '../lib/components/InkSeal.svelte';
 import {asset} from '../lib/config/assets';
 import {POSTAL_ART} from '../lib/ui/postal-art.mjs';
 import {brand} from '../lib/config/brand';
 let {state,ui}:{state:GameState;ui:UIState}=$props();
</script>
<section class="roam-hero" aria-labelledby="departure-title">
 <div class="hero-copy"><p class="eyebrow">两个人 · 一部手机 · 一座城市</p><h1 id="departure-title">下一站，<br><span>走着看。</span></h1><p class="hero-description">城市里，藏着你们的下一关。<br>抽一张卡，开启一点意料之外的小冒险。</p>
 <div class="hero-actions">{#if state.session}<ActionButton label="继续冒险" action="nav" attrs={{'data-route':'walk'}}/>{:else}<ActionButton label="直接试玩" action="start-trial"/><ActionButton label="准备出发" action="nav" kind="outline" attrs={{'data-route':'setup'}}/>{/if}</div>
 <p class="hero-note">{state.session?'这一程已保存，随时接着走。':'三张卡，15–20 分钟。无需花费，也不用计分。'}</p><div class="hero-signature"><span>✦</span> 双人组队 · 抽卡出发 · 解锁共同回忆</div></div>
 <figure class="hero-illustration"><img class="journey-art" src={asset(POSTAL_ART.hero)} alt="两位探险者拿着地图站在晴日街角的发光城市入口前" width="1536" height="1024" fetchpriority="high"><div class="hero-seal"><InkSeal variant={0}/></div><figcaption><span>LEVEL 01 / 城市入口</span><span>{brand.shortName} · 双人冒险</span></figcaption></figure>
</section>
<section class="home-departure" aria-label="今日通行证"><div><p class="eyebrow">领取今日委托 / ADMIT TWO</p><h2>今天的故事，<br>从这里出发。</h2><p class="help">短途、半日，或自由走走。<br>按你们的节奏，选一段同行的时间。</p></div><div class="home-pass"><Passport {state}/><div class="home-pass-action"><ActionButton label={state.session?'继续这一程':'领取通行证'} action="nav" kind="block" attrs={{'data-route':state.session?'walk':'setup'}}/></div></div></section>
<section class="home-postage" aria-labelledby="home-postage-title"><div class="section-heading"><div><p class="eyebrow">探索 · 对话 · 合作</p><h2 id="home-postage-title">每一张卡，都是新的小冒险。</h2></div><ActionButton label="翻开收藏册 ↗" action="nav" kind="text" attrs={{'data-route':'library'}}/></div><div class="postage-preview">{#each [{variant:0,title:'发现一条街',text:'抬头、绕路，找到熟悉城市的新细节。'},{variant:1,title:'聊一点彼此',text:'留给对方一个问题，也留一点倾听的时间。'},{variant:2,title:'一起做件小事',text:'轮流出题、一起决定，让默契自然发生。'}] as item}<article><PostageStamp variant={item.variant}/><div><h3>{item.title}</h3><p>{item.text}</p></div></article>{/each}</div></section>
{#if state.history.length}<section class="home-last"><div><p class="eyebrow">上一程的余温</p><h2>{state.history[0].name}</h2></div><ActionButton label="翻看回忆 ↗" action="nav" kind="outline" attrs={{'data-route':`detail/${state.history[0].id}`}}/></section>{/if}
<p class="home-offline" data-offline>{ui.offlineReady?'✓ 离线内容已准备好 · 带着这一页出门吧':'首次出门前，请联网打开一次，准备离线内容。'}</p>
