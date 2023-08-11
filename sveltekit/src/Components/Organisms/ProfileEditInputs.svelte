<script lang="ts">
	import AvatarSelectPane from './AvatarSelectPane.svelte';
	import { UserStore } from '$lib/store';
	import axios from 'axios';
	import InputWithLabel from '../Molecules/InputWithLabel.svelte';
	import { videoChat } from '$lib/frontend/Classes/VideoChat';
	import { PresetAvatars } from '$lib/preset/PresetAvatars';
	import { _ } from '$lib/i18n';
	import type { Me } from '$lib/frontend/Classes/Me';
	export let onUpdateDone: () => void;
	export let me: Me;
	export let label: string = _('Update');
	export let withName = false;
	export let withDescription = false;
	let busy = false;

	const onUpdateProfileDoClicked = async () => {
		if ($UserStore.avatarURL == '') {
			alert('Please select avatar');
			return;
		}
		busy = true;
		await axios.put('/api/users/' + $UserStore.id, {
			nickname: $UserStore.nickname,
			avatarURL: $UserStore.avatarURL,
			firstName: $UserStore.firstName,
			lastName: $UserStore.lastName,
			description: $UserStore.description
		});
		videoChat.sendMessage({
			key: 'updateProfile',
			nickname: $UserStore.nickname,
			avatarURL: $UserStore.avatarURL,
			user: { ...$UserStore }
		});
		if (me) {
			me.avatarURL = $UserStore.avatarURL;
			me.nickname = $UserStore.nickname;
		}
		busy = false;
		onUpdateDone();
	};
</script>

{#if withName}
	<div style="display:flex;gap:0.4rem">
		<InputWithLabel label={_('First Name')} bind:value={$UserStore.firstName} />
		<InputWithLabel label={_('Last Name')} bind:value={$UserStore.lastName} />
	</div>
{/if}

<InputWithLabel
	meta={_('Only alphabets and numbers allowed for nickname')}
	label={_('Nickname')}
	bind:value={$UserStore.nickname}
/>
<AvatarSelectPane
	bind:url={$UserStore.avatarURL}
	thumbnailURL={PresetAvatars.find((preset) => preset.url == $UserStore.avatarURL)?.thumbnailURL ||
		''}
/>
{#if withDescription}
	<InputWithLabel label={_('Bio')} bind:value={$UserStore.description} type="textarea" />
{/if}
<slot />
<button aria-busy={busy} on:click={() => onUpdateProfileDoClicked()} disabled={busy}>
	{label}
</button>

<style>
</style>
