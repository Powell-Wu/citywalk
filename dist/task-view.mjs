import {TYPES} from './core.mjs';
import {cardArt} from './art.mjs';
export function taskCardView(se,x,{esc,button,dueText},hint=true){
 const c=x.card,a=`data-session="${se.id}" data-slot="${x.id}"`,disabled=se.pausedAt?'disabled':'';
 const actions=c?`${a} data-card="${esc(c.id)}" ${disabled}`:'';
 const art=c?cardArt(c):null;
 return `<div class="card-stage"><div class="card-back card-back-far" aria-hidden="true"></div><div class="card-back card-back-near" aria-hidden="true"></div>
 ${c?'<div class="swipe-reveal reveal-left" aria-hidden="true">↻<strong>换一张</strong><span>松手换卡</span></div><div class="swipe-reveal reveal-right" aria-hidden="true">✓<strong>完成</strong><span>松手完成</span></div>':''}
 <article class="panel task-card ${x.type}" ${c&&!se.pausedAt?`data-swipe-card ${actions} tabindex="0" aria-label="任务卡：左右滑动，或使用更多操作"`:''}>
 <div class="list-top card-heading"><span class="tag ${x.type}">${TYPES[x.type].label}</span><span class="small">${c&&se.scoring?`✦ +${TYPES[x.type].points} 积分`:`${String(se.slots.indexOf(x)+1).padStart(2,'0')} / ${se.mode==='free'?'∞':se.slots.length}`}</span></div>
 ${c?`<img class="task-art" src="./${art.src}" alt="${art.alt}" width="600" height="800" draggable="false"><div class="task-copy"><h2>${esc(c.text)}</h2><p class="task-note">${esc(c.note)}</p><div class="task-meta"><span>约 ${c.minutes} 分钟</span><span>${c.cost?`预算 ¥${c.cost} 内`:'无需花费'}</span></div>
 ${c.cost?`<label for="actual-cost">实际花费（元）</label><input id="actual-cost" type="number" min="0" max="10000" step="0.01" inputmode="decimal" value="0">`:''}
 <details class="card-options"><summary>更多操作</summary><div class="actions">${button('完成','complete',actions)}${button('换一张','replace',actions,'outline')}${button('稍后再做','later',`${a} ${disabled}`,'text')}${button('跳过','skip',`${a} ${disabled}`,'text')}</div></details></div>`:
 `<div class="draw-card-art"><img src="./card-back.webp" alt="城市探险卡背" width="480" height="640"></div><div class="task-copy"><h2>下一站，发现什么？</h2><p class="muted small" data-due>${dueText(se,x)}</p>${button(`抽一张${TYPES[x.type].name}`,'draw',`${a} ${disabled}`,'block')}${button('跳过这个节点','skip',`${a} ${disabled}`,'text')}</div>`}</article>
 ${se.pausedAt?'<p class="swipe-guide">暂停中 · 继续后可以滑牌</p>':c&&hint?'<p class="swipe-guide">左滑换卡 · 右滑完成</p>':''}
 <p class="deck-count">${se.mode==='free'?'自由模式':`本局还有 ${se.slots.filter(k=>!['done','skipped'].includes(k.status)&&k.id!==x.id).length} 张待完成`}</p></div>`;
}
