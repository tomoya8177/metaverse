<script lang="ts">
	import { UserStore } from '$lib/store';
	import axios from 'axios';
	import InputWithLabel from '../Molecules/InputWithLabel.svelte';
	import { videoChat } from '$lib/Classes/VideoChat';
	import type { User } from '$lib/types/User';
	export let onUpdateDone: () => void;
	let busy = false;

	const onUpdateProfileDoClicked = async () => {
		busy = true;
		await axios.put('/api/users/' + $UserStore.id, {
			nickname: user.nickname
		});
		$UserStore.nickname = user.nickname;
		videoChat.sendMessage({
			key: 'updateProfile',
			nickname: user.nickname,
			user: $UserStore
		});

		busy = false;
		onUpdateDone();
	};
	export let user: User;
	export let label: string = 'Update';
</script>

<InputWithLabel label="Nickname" bind:value={user.nickname} />
<button aria-busy={busy} on:click={() => onUpdateProfileDoClicked()} disabled={busy}>
	{label}
</button>
