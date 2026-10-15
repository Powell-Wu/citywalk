<script lang="ts">
 import type {GameState,Journey} from '../config/types';
 import {keepsakeSummary} from '../domain/collection.mjs';
 import InkSeal from './InkSeal.svelte';
 import ActionButton from './ActionButton.svelte';
 let {state,journey}:{state:GameState;journey:Journey}=$props();
 let summary=$derived(keepsakeSummary(state,journey.id));
</script>
<section class="panel journey-keepsakes" aria-label="本次纪念与下一程" data-keepsake-summary>
 <p class="eyebrow">这一程的新收获</p><h2>把同行，变成纪念。</h2>
 {#if summary.newBadges.length}<div class="new-badges">{#each summary.newBadges as badge}<article data-new-badge={badge.id}><InkSeal variant={badge.id==='theme-observe'?4:badge.id==='theme-duo'?5:badge.id==='sixteen'?2:3}/><strong>{badge.name}</strong><span>这次新获得</span></article>{/each}</div>{:else}<p>已把这次同行收进纪念册，每一次发现都会留下足迹。</p>{/if}
 {#if summary.next}<div class="next-keepsake" data-next-keepsake><h3>下一枚 · {summary.next.name}</h3><p>{summary.next.condition}</p><p class="help">{summary.next.progress}</p></div>{:else}<p>六枚纪念章都已点亮，下一程换一种做法，再找些新发现。</p>{/if}
 <div class="actions"><ActionButton label={summary.nextTheme==='observe'?'下一程 · 观察城市':'下一程 · 默契挑战'} action="plan-theme" attrs={{'data-theme':summary.nextTheme}}/><ActionButton label="查看我的纪念" action="album" kind="outline"/></div>
</section>
<style>
.journey-keepsakes h2{font-size:1.2rem;margin:8px 0 18px}.new-badges{display:flex;flex-wrap:wrap;gap:16px}.new-badges article{display:flex;flex-direction:column;align-items:center;width:116px;text-align:center;gap:6px;font-size:.8125rem}.new-badges article :global(.ink-seal){width:90px}.new-badges span{font-size:.75rem;color:var(--green)}.next-keepsake{border-top:1px dashed var(--line);margin-top:18px;padding:14px 0}.next-keepsake h3{font-size:.9375rem;margin:0 0 8px}.next-keepsake p{font-size:.8125rem;margin:4px 0}.journey-keepsakes>.actions{margin-top:16px}
</style>
