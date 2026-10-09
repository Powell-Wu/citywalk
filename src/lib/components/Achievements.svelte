<script lang="ts">
 import type {GameState} from '../config/types';
 import {achievements} from '../domain/collection.mjs';
 let {state}:{state:GameState}=$props();
 let badges=$derived(achievements(state));
</script>
<section class="panel" aria-label="同行纪念章"><h2>同行纪念章</h2><div class="badges">{#each badges as badge}<article class:earned={badge.earned} data-achievement={badge.id}><span aria-hidden="true">{badge.earned?'✦':'◇'}</span><div><h3>{badge.name} · {badge.earned?'已获得':'未获得'}</h3><p>{badge.condition}</p><small>{badge.progress}</small></div></article>{/each}</div><p class="help">按当前旅程和保留的历史计算；撤销任务或删除记录会重新计算。</p></section>
<style>
.badges{display:grid;gap:12px;margin:16px 0}.badges article{display:flex;gap:12px;padding:12px;border:1px dashed var(--line);opacity:.72}.badges article.earned{border-style:solid;opacity:1;background:#e4eee4}.badges span{font-size:24px;color:var(--green)}.badges h3{font-size:1rem;margin:0 0 6px}.badges p{font-size:.875rem;margin:0 0 6px}.badges small{font-size:.75rem;color:var(--muted)}
</style>
