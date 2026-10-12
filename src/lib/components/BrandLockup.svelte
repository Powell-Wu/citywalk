<script lang="ts">
 import {brand} from '../config/brand';
 import {symbolBody,wordmarkBody} from '../ui/brand-art.mjs';
</script>
<div class="roam-lockup" role="img" aria-label={brand.title}>
 <svg class="roam-symbol" viewBox="0 0 64 64" aria-hidden="true">{@html symbolBody}</svg>
 <div class="roam-type"><svg class="roam-wordmark" viewBox="0 0 232 76" aria-hidden="true">{@html wordmarkBody}</svg><span>{brand.shortName}</span></div>
</div>
<style>
 .roam-lockup{display:flex;align-items:center;gap:9px;color:var(--ink);flex:none}
 .roam-symbol{display:block;width:43px;height:43px}
 .roam-type{display:flex;flex-direction:column;align-items:flex-start;gap:3px}
 .roam-wordmark{display:block;width:96px;height:auto}
 .roam-type span{font-size:11px;line-height:1.4;letter-spacing:.25em;padding-left:3px}
 @media(max-width:360px){.roam-symbol{width:37px;height:37px}.roam-wordmark{width:84px}.roam-lockup{gap:6px}}
</style>
