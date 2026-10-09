<script lang="ts">
 import {onMount,flushSync} from 'svelte';
 import {createController} from './lib/services/controller.mjs';
 import type {Snapshot} from './lib/config/types';
 import {brand} from './lib/config/brand';
 import ActionButton from './lib/components/ActionButton.svelte';
 import RewardFeedback from './lib/components/RewardFeedback.svelte';
 import Home from './pages/Home.svelte';
 import Setup from './pages/Setup.svelte';
 import Walk from './pages/Walk.svelte';
 import Finish from './pages/Finish.svelte';
 import Library from './pages/Library.svelte';
 import History from './pages/History.svelte';
 import Detail from './pages/Detail.svelte';
 import Settings from './pages/Settings.svelte';
 let root:HTMLElement;
 let snapshot=$state.raw<Snapshot|null>(null);
 onMount(()=>{const controller=createController(root,(next:Snapshot)=>flushSync(()=>{snapshot=next;}));return ()=>controller.dispose();});
</script>
<div bind:this={root}>
{#if !snapshot}<div class="loading">正在打开今天的散步…</div>
{:else if !snapshot.ready}<div class="shell"><div class="panel"><h1>先把回忆安顿好</h1><p>{snapshot.ui.storageError}</p><p>为避免记录丢失，暂时没有开始新一局。请使用普通浏览窗口，检查网站存储权限后重试。</p><ActionButton label="重新打开" action="reload" kind="block"/></div></div>
{:else}
<div class="shell" data-page={snapshot.name}><header class="brand"><div class="brand-name"><span class="brand-mark" aria-hidden="true">↗</span>{brand.shortName}</div><div class="brand-tools"><span class="brand-meta">{brand.subtitle}</span><ActionButton label="主题" action="skins" kind="outline icon skin-trigger" attrs={{'aria-haspopup':'dialog'}}/></div></header>
{#if snapshot.ui.storageError}<div role="alert" class="storage-error">{snapshot.ui.storageError} <ActionButton label="重试" action="reload" kind="outline"/></div>{/if}
<aside class={`notice ${snapshot.ui.updateWaiting?'':'hidden'}`} data-update-banner aria-label="版本更新"><span>新版本已就绪，进度会保留。</span> <ActionButton label="应用更新" action="apply-update" kind="outline icon"/></aside>
{#if snapshot.ui.schemaMessage}<aside class="notice" role="status" data-schema-status>{snapshot.ui.schemaMessage}</aside>{/if}
<main aria-busy={snapshot.ui.phase!=='idle'}>
{#if snapshot.name==='setup'}<Setup state={snapshot.state}/>
{:else if snapshot.name==='walk'}<Walk state={snapshot.state} ui={snapshot.ui}/>
{:else if snapshot.name==='finish'}<Finish state={snapshot.state}/>
{:else if snapshot.name==='library'}<Library state={snapshot.state} ui={snapshot.ui}/>
{:else if snapshot.name==='history'}<History state={snapshot.state}/>
{:else if snapshot.name==='detail'}<Detail state={snapshot.state} id={snapshot.id}/>
{:else if snapshot.name==='settings'}<Settings state={snapshot.state} ui={snapshot.ui} release={snapshot.release}/>
{:else}<Home state={snapshot.state} ui={snapshot.ui}/>{/if}
</main></div>
<nav class="nav" aria-label="主导航">{#each [['home','今天'],['library','收藏册'],['history','冒险日志'],['settings','设置']] as [route,label]}<button type="button" data-action="nav" data-route={route} class={snapshot.name===route||route==='home'&&['walk','setup','finish'].includes(snapshot.name)?'active':''} aria-current={snapshot.name===route?'page':undefined}>{label}</button>{/each}</nav>
{/if}
<RewardFeedback/>
</div>

<style>

.shell[data-page=walk]{padding-top:max(12px,var(--walk-safe-top));padding-bottom:calc(90px + var(--walk-safe-bottom))}
.shell[data-page=walk]~.nav{padding-bottom:calc(8px + var(--walk-safe-bottom))}
:global([data-theme=adventure]) .shell[data-page=walk] .brand{margin-bottom:8px;padding-bottom:6px;min-height:44px}
@media(min-width:800px){.shell[data-page=walk] :global(.page){max-width:720px}}
</style>
