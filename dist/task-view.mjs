import {TYPES} from './core.mjs';
import {cardArt} from './art.mjs';
// Small UI emblems use a shared 24-unit pixel grid, not platform emoji.
const frames={
 scene:{name:'探索委托',title:'下一站，发现什么？',icon:'<path d="M10 1h4v4h-4zM10 19h4v4h-4zM1 10h4v4H1zM19 10h4v4h-4z"/><path d="M12 5l7 7-7 7-7-7z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 8l3 4-3 4z"/>'},
 talk:{name:'双人对话',title:'这一张，留给我们。',icon:'<path d="M2 3h13v10H8l-4 4v-4H2z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M18 8h4v12h-3v3l-4-3H9v-4" fill="none" stroke="currentColor" stroke-width="2"/>'},
 event:{name:'挑战任务',title:'一起试试这一关？',icon:'<path d="M4 2h3v20H4zM7 3h14v11H7z"/><path d="M9 5h4v3H9zM16 5h3v3h-3zM13 8h3v3h-3z" fill="var(--white)"/>'}
};
const emblem=type=>`<svg class="quest-emblem" viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" focusable="false">${frames[type].icon}</svg>`;
export function taskCardView(se,x,{esc,button,dueText},hint=true){
 const c=x.card,a=`data-session="${se.id}" data-slot="${x.id}"`,disabled=se.pausedAt?'disabled':'';
 const actions=c?`${a} data-card="${esc(c.id)}" ${disabled}`:'';
 const art=c?cardArt(c):null;
 return `<div class="card-stage"><div class="card-back card-back-far" aria-hidden="true"></div><div class="card-back card-back-near" aria-hidden="true"></div>
 ${c?'<div class="swipe-reveal reveal-left" aria-hidden="true">↻<strong>换一张</strong><span class="swipe-pending">继续左滑</span><span class="swipe-commit">松手换卡</span><i class="swipe-meter"></i></div><div class="swipe-reveal reveal-right" aria-hidden="true">✓<strong>完成</strong><span class="swipe-pending">继续右滑</span><span class="swipe-commit">松手完成</span><i class="swipe-meter"></i></div>':''}
 <article class="panel task-card ${x.type}" ${c&&!se.pausedAt?`data-swipe-card ${actions} tabindex="0" aria-label="任务卡：左右滑动，或使用更多操作"`:''}>
 <div class="list-top card-heading"><span class="quest-identity">${emblem(x.type)}<span class="tag ${x.type}">${frames[x.type].name}</span></span><span class="quest-value small">${c&&se.scoring?`+${TYPES[x.type].points} 积分`:`${String(se.slots.indexOf(x)+1).padStart(2,'0')} / ${se.mode==='free'?'∞':se.slots.length}`}</span></div>
 ${c?`<div class="quest-art-frame"><img class="task-art" src="./${art.src}" alt="${art.alt}" width="600" height="800" draggable="false"></div><div class="task-copy"><div class="quest-brief"><h2>${esc(c.text)}</h2>${c.note?`<p class="task-note">${esc(c.note)}</p>`:''}</div><div class="task-meta"><span>约 ${c.minutes} 分钟</span><span>${c.cost?`预算 ¥${c.cost} 内`:'无需花费'}</span></div>
 ${c.cost?`<label for="actual-cost">实际花费（元）</label><input id="actual-cost" type="number" min="0" max="10000" step="0.01" inputmode="decimal" value="0">`:''}
 <details class="card-options"><summary>更多操作</summary><div class="actions">${button('完成','complete',actions)}${button('换一张','replace',actions,'outline')}${button('稍后再做','later',`${a} ${disabled}`,'text')}${button('跳过','skip',`${a} ${disabled}`,'text')}</div></details></div>`:
 `<div class="draw-card-art"><img src="./card-back.webp" alt="城市探险卡背" width="480" height="640"><span class="deck-seal" aria-hidden="true">${emblem(x.type)}</span></div><div class="task-copy"><h2>${frames[x.type].title}</h2><p class="muted small" data-due>${dueText(se,x)}</p>${button(`抽一张${TYPES[x.type].name}`,'draw',`${a} ${disabled}`,'block')}${button('跳过这个节点','skip',`${a} ${disabled}`,'text')}</div>`}</article>
 ${se.pausedAt?'<p class="swipe-guide">暂停中 · 继续后可以滑牌</p>':c&&hint?'<p class="swipe-guide">左滑换卡 · 右滑完成</p>':''}
 <p class="deck-count">${se.mode==='free'?'自由模式':`本局还有 ${se.slots.filter(k=>!['done','skipped'].includes(k.status)&&k.id!==x.id).length} 张待完成`}</p></div>`;
}
