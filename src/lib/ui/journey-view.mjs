import {TYPES,MODES,score,spent,target,thresholds,elapsed} from '../domain/core.mjs';

const stopNames={scene:'探索',talk:'对话',event:'挑战'};
const statuses={waiting:'待领取',active:'进行中',later:'稍后',done:'完成',skipped:'跳过'};
const escapeText=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Derive the route from the saved slots; legacy sessions keep their original plan.
export function journeyProgress(se,currentId){
 const current=se.slots.findIndex(x=>x.id===currentId);
 return {current,remaining:se.slots.filter(x=>!['done','skipped'].includes(x.status)).length,
  stops:se.slots.map((x,i)=>({id:x.id,label:stopNames[x.type],status:x.status,current:i===current})),
  types:Object.keys(TYPES).map(type=>({type,label:stopNames[type],count:se.slots.filter(x=>x.type===type&&x.status==='done').length}))};
}
export function journeyRoute(se,currentId){
 const p=journeyProgress(se,currentId);
 const closingCurrent=se.endedAt===null&&p.current<0&&p.remaining===0;
 if(se.mode==='free')return `<div class="journey-route free-route" aria-label="自由旅程进度"><span>已完成 ${score(se).count} 张</span>${p.types.map(x=>`<span>${x.label} ${x.count}</span>`).join('')}</div>`;
 return `<ol class="journey-route" aria-label="旅程路线">${p.stops.map((x,i)=>`<li class="route-stop ${x.status}${x.current?' current':''}" ${x.current?'aria-current="step"':''} aria-label="第 ${i+1} 站 ${x.label} · ${statuses[x.status]}"><span class="route-symbol" aria-hidden="true">${x.status==='done'?'✓':x.status==='skipped'?'–':x.status==='later'?'…':i+1}</span><span>${x.label}</span><span class="visually-hidden">${statuses[x.status]}</span></li>`).join('')}<li class="route-stop closing ${se.closing?'done':''}${closingCurrent?' current':''}" ${closingCurrent?'aria-current="step"':''} aria-label="收尾 · ${se.closing?'完成':'分享瞬间并为旅程取名'}"><span class="route-symbol" aria-hidden="true">${se.closing?'✓':'✦'}</span><span>收尾</span></li></ol>`;
}
export function rewardPreview(se){
 const ts=se.scoring?thresholds(se):[],total=score(se).total;
 if(!ts.length)return `<div class="reward-preview keepsake-preview">${se.scoring?'自由积累 · ':'只记录旅程 · '}收尾留下一份双人纪念</div>`;
 const next=ts.findIndex(t=>total<t);
 return `<details class="reward-preview"><summary>${next<0?'最高档奖励已达成':`下一档：${escapeText(se.rewards[next])} · 还差 ${ts[next]-total} 分`}</summary><div class="reward-preview-list">${ts.map((t,i)=>`<p>${total>=t?'✓ 已达到':'待解锁'} · ${t} 分 · ${escapeText(se.rewards[i])}</p>`).join('')}<p>按最高达成档领取。完成计划任务与收尾，目标 ${target(se)} 分。</p></div></details>`;
}
export function scoreBreakdown(se){
 if(!se.scoring)return '';
 const sc=score(se);
 return `<dl class="score-breakdown" aria-label="积分明细">${[[sc.base,'任务基础分'],[sc.trio,'三类集齐'],[sc.bonus,'额外奖励'],[sc.closing,'一起收尾']].map(([n,label])=>`<div><dt>${label}</dt><dd>${n} 分</dd></div>`).join('')}</dl>`;
}

const art=(file,alt,extra='')=>`<img class="journey-art" src="./${file}" alt="${alt}" width="960" height="640" decoding="async" ${extra}>`;
const badge=()=>'<img class="journey-badge" src="./explorer-badge.webp" alt="" width="72" height="72">';

export function adventureHome(s,ui,{esc,fmtDate,navBtn}){
 const se=s.session,sc=se?score(se):null;
 return `<div class="departure-grid">
 <section class="departure-scene" aria-labelledby="departure-title">
 <div class="departure-heading"><p class="eyebrow">双人冒险</p><h1 id="departure-title">城市里，<br>藏着下一关。</h1></div>
 ${art('journey-departure.webp','两位探险者在晴日街角查看地图，前方是发光的城市入口','fetchpriority="high"')}
 <p class="departure-caption">带上彼此，出发。</p>
 </section>
 <section class="departure-pass"><article class="ticket adventure-pass passport-ticket">
 <div class="passport-main"><p class="eyebrow">一起走走</p><h2>双人冒险通行证</h2><p class="pass-note">${se?`${fmtDate(se.startedAt)} · ${MODES[se.mode].name}`:'城市里，藏着下一关。'}</p>
 <div class="passport-number"><span>NO. ${String(s.history.length+1).padStart(3,'0')}</span>${se?`<span>${se.pausedAt?'暂停中':`已完成 ${sc.count} 张`}</span>`:''}</div></div>
 <div class="passport-stub">${badge()}<span>双人<br>同行</span><i aria-hidden="true">✦ ✦</i></div>
 </article><div class="passport-action">${navBtn(se?'继续冒险':'领取通行证',se?'walk':'setup','block')}<p class="footnote">${se?'进度已保存':'短途 · 半日 · 自由走走'}</p></div>${s.history.length?`<div class="last-journey"><span class="small muted">上一程</span><p>${esc(s.history[0].name)}</p>${navBtn('翻看回忆',`detail/${esc(s.history[0].id)}`,'text')}</div>`:''}
 <p class="status-line" data-offline>${ui.offlineReady?'✓ 离线内容已准备好':'首次出门前，请联网打开一次，准备离线内容。'}</p></section></div>`;
}

export function closingIntro(se){
 const sc=score(se);
 return `<section class="closing-intro">${art('journey-keepsake.webp','冒险结束，两人在城市露台收好地图与探险徽章')}
 <div class="closing-intro-copy"><p class="eyebrow">这一程的最后一站${se.scoring?' · 收尾 +4 分':''}</p><h2>把今天，收进口袋。</h2><p>各说一个最喜欢的瞬间，再给这次冒险取个名字。</p><span class="small muted">已完成 ${sc.count} 张任务${se.scoring?` · 当前 ${sc.total} 积分`:''}</span>${scoreBreakdown(se)}${se.scoring&&target(se)?`<p class="help">目标 ${target(se)} 分 = 计划任务 ${target(se)-4} 分 + 收尾 4 分。三类集齐与额外奖励另计。</p>`:''}</div></section>${journeyRoute(se)}${rewardPreview(se)}`;
}

export function adventureRecord(h,{esc,fmtDate,timeText,tag}){
 const sc=score(h),ts=h.scoring?thresholds(h):[];
 const tier=ts.reduce((best,t,i)=>sc.total>=t?i:best,-1);
 const completed=h.slots.filter(x=>x.status==='done');
 const unfinished=h.slots.filter(x=>x.status!=='done');
 const bonuses=h.scoring?[[sc.trio,'三类集齐'],[h.bonuses.surprise?1:0,'小惊喜'],[h.bonuses.laugh?1:0,'笑出声'],[h.closing?4:0,'一起收尾']].filter(([n])=>n):[];
 return `<article class="ticket journey-record">
 <div class="ticket-top"><span>双人冒险 · 旅程存档</span><span>${fmtDate(h.startedAt)}</span></div>
 ${art('journey-keepsake.webp','两人把地图和探险徽章收好，留下这一程的纪念')}
 <div class="journey-record-body"><div class="record-heading">${badge()}<div><p class="eyebrow">${MODES[h.mode].name}</p><h2>${esc(h.name)}</h2></div></div>
 <dl class="journey-stats"><div><dt>完成任务</dt><dd>${sc.count}<small> 张</small></dd></div><div><dt>同行时间</dt><dd class="duration">${timeText(elapsed(h))}</dd></div>${h.scoring?`<div><dt>本次积分</dt><dd>${sc.total}</dd></div>`:''}</dl>${journeyRoute(h)}${scoreBreakdown(h)}
 ${h.memory?`<section class="memory-note"><h3>想记住的瞬间</h3><p>${esc(h.memory)}</p></section>`:''}
 ${ts.length?`<section class="journey-loot"><img src="./${tier>=0?'chest-open':'chest-closed'}.webp" alt="" width="100" height="100"><div><p class="eyebrow">${tier>=0?'这次的奖励':'奖励进度'}</p><h3>${tier>=0?esc(h.rewards[tier]):'这次还没到奖励分数'}</h3><p class="help">${tier>=0?`${ts[tier]} 分档 · 领取这一档奖励`:`已获得 ${sc.total} 分 · 第一档 ${ts[0]} 分`}</p></div></section><details class="reward-tiers"><summary>查看各档奖励</summary>${ts.map((t,i)=>`<div class="reward ${sc.total>=t?'unlocked':'locked'}">${i===tier?'本次奖励':sc.total>=t?'已达到':'未达到'} · ${t} 分 · ${esc(h.rewards[i])}</div>`).join('')}<p class="help">按最高达成档领取，不叠加。</p></details>`:''}
 <section class="journey-log"><h3>一起完成的任务 <span class="muted small">${sc.count} 张</span></h3>${completed.length?`<ol class="journey-tasks">${completed.map(x=>`<li><div>${tag(x.type)}${h.scoring?`<span class="task-earned">+${TYPES[x.type].points}</span>`:''}</div><p>${esc(x.card.text)}</p></li>`).join('')}</ol>`:'<p class="muted">这次没有完成任务卡，也留下一段同行的时间。</p>'}
 ${bonuses.length?`<ul class="journey-bonuses">${bonuses.map(([n,label])=>`<li><span>${label}</span><strong>+${n}</strong></li>`).join('')}</ul>`:''}
 ${unfinished.length?`<details class="unfinished-tasks"><summary>途中未完成的任务 · ${unfinished.length} 张</summary><ul class="ledger">${unfinished.map(x=>`<li><span>${esc(x.card?.text||`未抽取的${TYPES[x.type].name}`)}</span><small class="muted">${x.status==='skipped'?'已跳过':x.status==='later'?'稍后':'未完成'}</small></li>`).join('')}</ul></details>`:''}</section>
 <p class="footnote">任务花费 ¥${spent(h)} · 购物预算 ¥${h.budget}</p></div></article>`;
}
