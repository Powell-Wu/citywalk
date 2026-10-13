<script lang="ts">
 import type {GameState,Config} from '../config/types';
 import {MODES,score} from '../domain/core.mjs';
 import {fmtDate} from '../ui/views.mjs';
 import {asset} from '../config/assets';
 let {state,config}:{state:GameState;config?:Config}=$props();
 let note=$derived(state.session?`${fmtDate(state.session.startedAt)} · ${MODES[state.session.mode].name}`:config?`${MODES[config.mode].name} · 两人同行`:'目的地：下一站的意外');
</script>
<article class="passport-ticket" aria-label="双人冒险通行证">
 <img class="passport-art" src={asset('roam-pixel-passport-v1.webp')} alt="" width="960" height="384">
 <div class="passport-print"><p class="passport-label">ROAM / ADMIT TWO</p><h2>双人冒险通行证</h2><p class="pass-note">{note}</p><div class="passport-number"><span>NO. {String(state.history.length+1).padStart(3,'0')}</span><span>{state.session?state.session.pausedAt?'暂停中':`已完成 ${score(state.session).count} 张`:config?'路线已选好 · 随时出发':'两人同行 · 当日有效'}</span></div></div>
</article>
<style>
 .passport-ticket{container-type:inline-size;position:relative;width:100%;line-height:1.4;filter:drop-shadow(3px 4px 0 #17354d18)}.passport-art{display:block;width:100%;height:auto;image-rendering:pixelated}.passport-print{position:absolute;left:8%;top:14%;bottom:22%;width:48%;display:flex;flex-direction:column;justify-content:center;min-width:0}.passport-label{font:clamp(7px,1.6cqw,11px)/1.4 ui-monospace,monospace;letter-spacing:.12em;margin:0 0 2.2cqw;color:#285d49}.passport-print h2{font-size:clamp(13px,3.2cqw,24px);line-height:1.4;margin:0 0 1.5cqw;font-weight:750}.pass-note{font-size:clamp(9px,2.2cqw,15px);line-height:1.4;margin:0 0 2.5cqw;color:#36556a}.passport-number{display:flex;gap:1cqw;flex-wrap:wrap;justify-content:space-between;font:clamp(8px,1.8cqw,12px)/1.4 ui-monospace,monospace;color:#285d49}.passport-number span{white-space:nowrap}
 @media(forced-colors:active){.passport-ticket{border:2px solid CanvasText}.passport-art{opacity:0}.passport-print{color:CanvasText}}
</style>
