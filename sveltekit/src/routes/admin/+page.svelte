<script lang="ts">
	import ActionHistoryTable from './ActionHistoryTable.svelte';

	import type { PageData } from './$types';
	export let data: PageData;
	let actionHistories = data.actionHistories;
</script>

<ActionHistoryTable {actionHistories} />
