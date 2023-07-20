<script lang="ts">
	import { EventStore, UserStore } from '$lib/store';
	import axios from 'axios';
	import InputWithLabel from '../Molecules/InputWithLabel.svelte';
	import { videoChat } from '$lib/frontend/Classes/VideoChat';
	import type { User } from '$lib/frontend/Classes/User';
	import { PresetAvatars } from '$lib/preset/PresetAvatars';
	import AvatarPreview from '../Atom/AvatarPreview.svelte';
	import type { Unit } from '$lib/frontend/Classes/Unit';
	import type { Me } from '$lib/frontend/Classes/Me';
	import { onMount } from 'svelte';
	import { Users } from '$lib/frontend/Classes/Users';
	import { fade } from 'svelte/transition';
	import { EmptyEvent } from '$lib/preset/EmptyEvent';
	import { _ } from '$lib/i18n';
	export let onUpdateDone: () => void;
	export let me: Me;
	let busy = false;

	onMount(() => {
		const found = Users.find($UserStore.id) as Me;
		if (found) me = found;
	});
	const onUpdateProfileDoClicked = async () => {
		if ($UserStore.avatarURL == '') {
			alert('Please select avatar');
			return;
		}
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
	let avatarSelectOpen = false;
	const onLeaveClicked = () => {
		videoChat.leave();
		EventStore.set(EmptyEvent);
		location.href = '/';
	};
</script>

<InputWithLabel label={_('Nickname')} bind:value={user.nickname} />
<div>
	<div>{_('Avatar')}</div>
	<div style="margin-left:auto; margin-right:auto;width:180px;margin-bottom:0.4rem;">
		{#if $UserStore.avatarURL}
			{#key $UserStore.avatarURL}
				<AvatarPreview url={$UserStore.avatarURL} />
			{/key}
		{/if}
	</div>
</div>
<button
	on:click={() => {
		avatarSelectOpen = !avatarSelectOpen;
	}}>{avatarSelectOpen ? _('OK') : _('Change Avatar')}</button
>

{#if avatarSelectOpen}
	<figure transition:fade>
		<div style="display:flex;gap:0.4rem;">
			{#each PresetAvatars as avatar}
				<div style="width:180px">
					<img src={avatar.thumbnailURL} alt="" style="margin-bottom:0.4rem;" />
					<button
						on:click={() => {
							$UserStore.avatarURL = avatar.url;
						}}>{_('Select')}</button
					>
				</div>
			{/each}
		</div>
	</figure>
{/if}
<slot />
<button aria-busy={busy} on:click={() => onUpdateProfileDoClicked()} disabled={busy}>
	{label}
</button>
<button class="secondary" on:click={onLeaveClicked}>{_('Leave')}</button>

<style>
	img {
		border-radius: 1rem;
		min-width: 180px;
		width: 180px;
		height: 180px;
	}
</style>
