<script lang="ts">
 import {asset} from '../config/assets';
 import {POSTAL_ART,STAMP_NAMES,spritePosition} from '../ui/postal-art.mjs';
 let {variant=0,label,compact=false}:{variant?:number;label?:string;compact?:boolean}=$props();
</script>
<span class:compact class="postage-stamp" aria-hidden="true">
 <span class="postage-top"><span>ROAM POST</span><span>✦</span></span>
 <span class="postage-picture" style:background-image={`url("${asset(POSTAL_ART.stamps)}")`} style:background-position={spritePosition(variant)}></span>
 <span class="postage-caption"><span>{label||STAMP_NAMES[variant]}</span><span>×2</span></span>
</span>
<style>
 .postage-stamp{display:flex;flex-direction:column;position:relative;padding:10px;background:#fff8e9;color:var(--ink);filter:drop-shadow(0 3px 3px #17354d15);mask:radial-gradient(circle at 5px 5px,transparent 3px,#000 3.4px) -5px -5px/10px 10px,linear-gradient(#000 0 0) center/calc(100% - 10px) calc(100% - 10px) no-repeat;mask-composite:add;min-width:0;line-height:1.3}
 .postage-top,.postage-caption{display:flex;align-items:center;justify-content:space-between;gap:6px;font:9px/1.4 ui-monospace,monospace;letter-spacing:.05em}
 .postage-top{padding:0 1px 5px}.postage-picture{display:block;aspect-ratio:1;background-size:300% 200%;background-repeat:no-repeat;width:100%;border:1px solid #17354d12}
 .postage-caption{padding:7px 1px 1px;letter-spacing:0;font-size:11px}.postage-caption>span:last-child{font:italic 19px/1 Georgia,serif}
 .compact{padding:7px}.compact .postage-top{font-size:7px;padding-bottom:3px}.compact .postage-caption{font-size:9px;padding:4px 0 0}.compact .postage-caption>span:last-child{font-size:13px}
</style>
