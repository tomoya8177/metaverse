<script lang="ts">
	import axios from 'axios';
	import { onMount } from 'svelte';
	import { DateTime } from 'luxon';
	export let actionHistories: any[] = [];
	onMount(async () => {
		const actions = await axios
			.get('/api/actions?orderBy=createdAt&order=desc&limit=100')
			.then((res) => res.data);
	});
</script>

{#each actionHistories as actionHistory, i}
	{@const sameSession = actionHistory.session == actionHistories[i - 1]?.session}
	<div style="display:flex;gap:1rem">
		<div style="width:8rem">
			{#if !sameSession}
				{actionHistory.userData?.nickname || 'Anonymous'}
				({actionHistory.locale})
			{/if}
		</div>
		<div style="flex:1">
			{actionHistory.action}
		</div>
		<div>
			{actionHistory.dataData?.path || actionHistory.roomData?.title || ''}
		</div>
		<div>
			@
			{DateTime.fromISO(actionHistory.createdAt).toLocaleString(DateTime.DATETIME_SHORT)}
		</div>
	</div>
{/each}
