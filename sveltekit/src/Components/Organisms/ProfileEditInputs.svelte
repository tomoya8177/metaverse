<script lang="ts">
	import AvatarSelectPane from './AvatarSelectPane.svelte';

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
	export let label: string = _('Update');
	let avatarSelectOpen = false;
</script>

<div style="display:flex;gap:0.4rem">
	<InputWithLabel label={_('First Name')} bind:value={user.firstName} />
	<InputWithLabel label={_('Last Name')} bind:value={user.lastName} />
</div>

<InputWithLabel
	meta={_('Only alphabets and numbers allowed for nickname')}
	label={_('Nickname')}
	bind:value={user.nickname}
/>
<AvatarSelectPane bind:url={user.avatarURL} />
<slot />
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
