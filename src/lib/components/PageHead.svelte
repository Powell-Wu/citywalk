<script lang="ts">
 import ActionButton from './ActionButton.svelte';
 let {title,back='home'}:{title:string;back?:string}=$props();
</script>
<div class="page-head"><h1>{title}</h1><ActionButton label="返回" action="nav" kind="text" attrs={{'data-route':back}}/></div>
