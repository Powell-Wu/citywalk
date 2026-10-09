<script lang="ts">
 import type {GameState} from '../config/types';
 import {MODES,score} from '../domain/core.mjs';
 import {fmtDate} from '../ui/views.mjs';
 import {brand} from '../config/brand';
 import {asset} from '../config/assets';
 let {state}:{state:GameState}=$props();
</script>
<article class="ticket adventure-pass passport-ticket"><div class="passport-main"><p class="eyebrow">{brand.shortName}</p><h2>双人冒险通行证</h2><p class="pass-note">{state.session?`${fmtDate(state.session.startedAt)} · ${MODES[state.session.mode].name}`:'城市里，藏着下一关。'}</p><div class="passport-number"><span>NO. {String(state.history.length+1).padStart(3,'0')}</span>{#if state.session}<span>{state.session.pausedAt?'暂停中':`已完成 ${score(state.session).count} 张`}</span>{/if}</div></div><div class="passport-stub"><img class="journey-badge" src={asset('explorer-badge.webp')} alt="" width="72" height="72"><span>双人<br>同行</span><i aria-hidden="true">✦ ✦</i></div></article>

<style>

:global([data-theme=adventure]) .passport-ticket{display:grid;grid-template-columns:minmax(0,1fr) 26%;padding:8px;border:6px solid #19394f;border-radius:4px;box-shadow:inset 0 0 0 2px #e5c782;min-height:208px;background:radial-gradient(circle at 18% 75%,#abc6ba33 0 24%,transparent 24%),repeating-linear-gradient(135deg,transparent 0 38px,#b6c9b41a 39px 40px),#fff6df;mask:radial-gradient(circle 12px at 0 50%,transparent 97%,black 100%) left/51% 100% no-repeat,radial-gradient(circle 12px at 100% 50%,transparent 97%,black 100%) right/51% 100% no-repeat}
.passport-main{padding:14px 10px;min-width:0;display:flex;flex-direction:column;justify-content:center}
.passport-main .eyebrow{font-size:.75rem;margin:0 0 10px}.passport-main h2{font-size:clamp(1.05rem,2.5vw,1.6rem);line-height:1.5;margin:0 0 8px}
.passport-main .pass-note{font-size:.75rem;margin:0 0 16px}.passport-number{display:flex;flex-wrap:wrap;gap:6px 14px;margin-top:auto;font:.75rem ui-monospace,monospace;color:var(--muted)}
.passport-stub{border-left:2px dashed #365369;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:7px;font-size:.8125rem;font-weight:700;text-align:center;padding:8px 4px}
.passport-stub .journey-badge{width:52px;height:52px}.passport-stub i{color:#ab8433;font-size:.75rem;font-style:normal}
@media(max-width:360px){.passport-main{padding:10px 5px}.passport-stub .journey-badge{width:42px;height:42px}}
</style>
