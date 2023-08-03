<script lang="ts">
	import axios from 'axios';
	import { onMount } from 'svelte';
	import { DateTime } from 'luxon';
	import type { User } from '$lib/frontend/Classes/User';
	import type { ActionHistory } from '$lib/types/ActionHistory';
	export let actionHistories: ActionHistory[] = [];
	onMount(async () => {
		const actions = await axios
			.get('/api/actions?orderBy=createdAt&order=desc&limit=100')
			.then((res) => res.data);
	});
</script>

{#each actionHistories as actionHistory, i}
	{@const sameSession = actionHistory.session == actionHistories[i - 1]?.session}
	<div style="display:flex;gap:1rem">
		<div style="width:4rem">
			{#if !sameSession}
				<small>
					{actionHistory.session.substring(0, 6)}
				</small>
			{/if}
		</div>
		<div style="width:8rem">
			{#if !sameSession}
				{actionHistory.userData?.nickname || '???'}
			{/if}
		</div>
		<div style="flex:1">
			{actionHistory.action}
		</div>
		<div>
			{actionHistory.param}
		</div>
		<div>
			@
			{DateTime.fromISO(actionHistory.createdAt).toLocaleString(DateTime.DATETIME_MED)}
		</div>
	</div>
{/each}
