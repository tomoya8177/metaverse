<script lang="ts">
	import ActionHistory from './ActionHistory.svelte';

	import axios from 'axios';
	import { onMount } from 'svelte';
	import { DateTime } from 'luxon';
	import type { User } from '$lib/frontend/Classes/User';
	import type { ActionHistory } from '$lib/types/ActionHistory';
	let actionHistories: ActionHistory[] = [];
	onMount(async () => {
		const actions = await axios
			.get('/api/actions?orderBy=createdAt&order=desc&limit=100')
			.then((res) => res.data);
		const users = await axios.get('/api/users').then((res) => res.data);
		actionHistories = actions.map((actionHistory: ActionHistory) => {
			actionHistory.param = '';
			actionHistory.userData = users.find((user: User) => user.id == actionHistory.user);
			if (actionHistory.action == 'visit') {
				actionHistory.param = JSON.parse(actionHistory.data).path;
			}
			return actionHistory;
		});
	});
</script>

<ActionHistory {actionHistories} />
