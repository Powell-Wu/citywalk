<script lang="ts">
 let {label,action,kind='',attrs={}}:{label:string;action:string;kind?:string;attrs?:Record<string,string|number|boolean|undefined>}=$props();
</script>
<button type="button" class={`btn ${kind}`} data-action={action} {...attrs}>{label}</button>
