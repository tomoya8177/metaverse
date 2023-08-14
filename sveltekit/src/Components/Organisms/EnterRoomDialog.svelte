<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { RoomStore, UserStore } from '$lib/store';

	import type { Me } from '$lib/frontend/Classes/Me';
	import { Users } from '$lib/frontend/Classes/Users';
	import SceneUIs from './SceneUIs.svelte';
	import { videoChat } from '$lib/frontend/Classes/VideoChat';
	import { messageListeners, messageUnlisteners } from '$lib/frontend/messageListeners';
	import ProfileEditInputs from './ProfileEditInputs.svelte';
	import AudioButton from '../Atom/AudioButton.svelte';
	import axios from 'axios';
	import type { Organization } from '$lib/types/Organization';
	import { _ } from '$lib/i18n';
	import { EmptyRoom } from '$lib/preset/EmptyRoom';
	import { actionHistory } from '$lib/frontend/Classes/ActionHistory';
	import NameTag from '../Atom/NameTag.svelte';
	import AvatarPreview from '../Atom/AvatarPreview.svelte';
	import { PresetAvatars } from '$lib/preset/PresetAvatars';
	import { fade } from 'svelte/transition';
	import ModalCloseButton from '../Atom/ModalCloseButton.svelte';
	import { escapeHTML } from '$lib/math/escapeHTML';

	export let readyToConnect;
	let organization: Organization | null = null;
	onMount(async () => {
		if (!$RoomStore) return;
		organization = await axios
			.get('/api/organizations/' + $RoomStore.organization)
			.then((res) => res.data);
		if (!$UserStore.nicknameURL) {
			profileDialogOpen = true;
		}
	});
	export let whenChatConnected: () => void;
	const onLeaveClicked = () => {
		actionHistory.send('leaveRoom');
		videoChat.leave();
		RoomStore.set(null);
		if ($UserStore?.isMember) {
			location.href = '/' + organization?.slug;
		} else {
			location.href = '/';
		}
	};
	let profileDialogOpen = false;
</script>

<dialog open>
	<article>
		{#if $RoomStore}
			<div>{_('Room Title')}</div>
			<h4>{$RoomStore.title}</h4>
			{#if organization}
				<div>{_('Organization')}</div>
				<h5>{organization?.title}</h5>
			{/if}
			<NameTag user={$UserStore} size={24} border={false} />
			<div style="text-align:center">
				<div style="display:inline-block">
					<AvatarPreview
						url={$UserStore.avatarURL}
						thumbnailURL={PresetAvatars.find((preset) => preset.url == $UserStore.avatarURL)
							?.thumbnailURL || ''}
					/>
				</div>
			</div>
			<button
				on:click={() => {
					profileDialogOpen = true;
				}}
			>
				{_('Edit Profile')}
			</button>

			<button
				on:click={async () => {
					if (!$RoomStore) return;

					actionHistory.send('enterRoom');
					readyToConnect = true;
					if (!videoChat.connected) {
						videoChat.init($UserStore, $RoomStore);
						await videoChat.connect();
						whenChatConnected();
					}
				}}
			>
				{_('Enter')}
			</button>
			<button class="secondary" on:click={onLeaveClicked}>{_('Leave')}</button>
		{/if}
	</article>
</dialog>
{#if profileDialogOpen}
	<dialog open transition:fade>
		<article>
			<ModalCloseButton
				onClick={() => {
					profileDialogOpen = false;
				}}
			/>
			<h3>Change Profile</h3>

			<ProfileEditInputs
				withName
				withDescription
				onUpdateDone={() => {
					actionHistory.send('profileUpdate', {
						user: { ...$UserStore, description: escapeHTML($UserStore.description) }
					});
					profileDialogOpen = false;
				}}
			/>
		</article>
	</dialog>
{/if}
