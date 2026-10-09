<script lang="ts">
 import type {GameState} from '../lib/config/types';
 import JourneyTicket from '../lib/components/JourneyTicket.svelte';
 import PageHead from '../lib/components/PageHead.svelte';
 import ActionButton from '../lib/components/ActionButton.svelte';
 let {state,id}:{state:GameState;id?:string}=$props();
 let journey=$derived(state.history.find(item=>item.id===id));
</script>
<div class="page"><PageHead title={journey?'这一程的回忆':'没找到这段记录'} back="history"/>{#if journey}<JourneyTicket {journey}/><div class="record-actions"><ActionButton label="保存纪念票图片" action="export-ticket" kind="outline block" attrs={{'data-id':journey.id}}/><ActionButton label="回到今天" action="nav" kind="block" attrs={{'data-route':'home'}}/><ActionButton label="删除这段记录" action="delete-history" kind="text" attrs={{'data-id':journey.id}}/></div>{:else}<p>它可能已在另一页被删除或被备份替换。</p>{/if}</div>
