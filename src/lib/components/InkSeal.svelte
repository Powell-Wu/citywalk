<script lang="ts">
 import {asset} from '../config/assets';
 import {POSTAL_ART,spritePosition} from '../ui/postal-art.mjs';
 let {variant=0}:{variant?:number}=$props();
</script>
<span class="ink-seal" aria-hidden="true" style:background-image={`url("${asset(POSTAL_ART.seals)}")`} style:background-position={spritePosition(variant)}></span>
<style>.ink-seal{display:block;width:100%;aspect-ratio:1;background-size:300% 200%;background-repeat:no-repeat;mix-blend-mode:multiply;pointer-events:none}</style>
