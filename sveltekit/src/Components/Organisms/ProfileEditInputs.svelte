<script lang="ts">
	import { UserStore } from '$lib/store';
	import axios from 'axios';
	import InputWithLabel from '../Molecules/InputWithLabel.svelte';
	import { videoChat } from '$lib/frontend/Classes/VideoChat';
	import type { User } from '$lib/types/User';
	import { PresetAvatars } from '$lib/preset/PresetAvatars';
	import AvatarPreview from '../Atom/AvatarPreview.svelte';
	import type { Unit } from '$lib/frontend/Classes/Unit';
	import type { Me } from '$lib/frontend/Classes/Me';
	import { onMount } from 'svelte';
	import { Users } from '$lib/frontend/Classes/Users';
	export let onUpdateDone: () => void;
	export let me: Me;
	let busy = false;

	onMount(() => {
		const found = Users.find($UserStore.id) as Me;
		if (found) me = found;
	});
	const onUpdateProfileDoClicked = async () => {
		busy = true;
		await axios.put('/api/users/' + $UserStore.id, {
			nickname: user.nickname,
			avatarURL: $UserStore.avatarURL
		});
		$UserStore.nickname = user.nickname;
		videoChat.sendMessage({
			key: 'updateProfile',
			nickname: user.nickname,
			avatarURL: $UserStore.avatarURL,
			user: $UserStore
		});
		me.avatarURL = $UserStore.avatarURL;
		busy = false;
		onUpdateDone();
	};
	export let user: User;
	export let label: string = 'Update';
</script>

<InputWithLabel label="Nickname" bind:value={user.nickname} />
<div>
	<div>Avatar</div>
	{#if $UserStore.avatarURL}
		{#key $UserStore.avatarURL}
			<AvatarPreview url={$UserStore.avatarURL} />
		{/key}
	{/if}
</div>
Choose Avatar
<figure>
	<div style="display:flex;gap:0.2rem;">
		{#each PresetAvatars as avatar}
			<div style="width:180px">
				<img src={avatar.thumbnailURL} />
				<button
					on:click={() => {
						$UserStore.avatarURL = avatar.url;
					}}>Select</button
				>
			</div>
		{/each}
	</div>
</figure>
<button aria-busy={busy} on:click={() => onUpdateProfileDoClicked()} disabled={busy}>
	{label}
</button>

<style>
	img {
		border-radius: 1rem;
		min-width: 180px;
		width: 180px;
		height: 180px;
	}
</style>
