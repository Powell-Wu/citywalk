<script lang="ts">
 import type {GameState} from '../config/types';
 import {achievements} from '../domain/collection.mjs';
 import InkSeal from './InkSeal.svelte';
 let {state}:{state:GameState}=$props();
 let badges=$derived(achievements(state));
</script>
<section class="panel achievement-album" aria-label="同行纪念章"><div class="section-heading"><div><p class="eyebrow">冒险成就 / ACHIEVEMENTS</p><h2>同行纪念章</h2></div><span class="small muted">{badges.filter(b=>b.earned).length} / {badges.length}</span></div><div class="badges">{#each badges as badge,i}<article class:earned={badge.earned} data-achievement={badge.id}><div class="badge-impression"><InkSeal variant={[3,4,5,4,5,2][i]}/></div><h3>{badge.name}</h3><span class="badge-status">{badge.earned?'已获得 · 已盖章':'未获得 · 待点亮'}</span><p>{badge.condition}</p><small>{badge.progress}</small></article>{/each}</div><p class="help">印章随你们的足迹点亮；撤销任务或删除记录后，会按保留的旅程重新计算。</p></section>
<style>
 .achievement-album{background:var(--white)}.achievement-album .section-heading h2{font-size:1.2rem;margin:0}.achievement-album .eyebrow{font-size:9px;margin-bottom:6px}.badges{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:20px 0 10px}.badges article{text-align:center;position:relative;padding:10px 8px 16px;border:1px dashed var(--line);background:var(--paper);min-width:0}.badge-impression{width:min(115px,100%);margin:0 auto 8px;filter:grayscale(1);opacity:.22;transform:rotate(-8deg)}.badges article:nth-child(2) .badge-impression{transform:rotate(5deg)}.badges article.earned{border-style:solid;background:#faf7ee}.earned .badge-impression{filter:none;opacity:1}.badges h3{font-size:.875rem;margin:0 0 6px}.badge-status{display:inline-block;font-size:10px;color:var(--muted);border-bottom:1px solid var(--line);margin-bottom:8px}.earned .badge-status{color:var(--green);border-color:var(--green)}.badges p{font-size:12px;line-height:1.6;margin:0 0 5px;color:var(--muted)}.badges small{font-size:12px;color:var(--muted)}.achievement-album>.help{font-size:12px}
 @media(max-width:600px){.badges{grid-template-columns:repeat(2,minmax(0,1fr))}}
 @media(max-width:360px){.badges{gap:6px}.badges article{padding:8px 4px}.badges h3{font-size:12px}.badges p{font-size:12px}}
</style>
