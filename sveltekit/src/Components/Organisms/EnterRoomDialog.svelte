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
	export let me: Me | null;

	export let readyToConnect;
	let organization: Organization | null = null;
	onMount(async () => {
		organization = await axios
			.get('/api/organizations/' + $RoomStore.organization)
			.then((res) => res.data);
	});
	export let whenChatConnected: () => void;
	const onLeaveClicked = () => {
		actionHistory.send('leaveRoom');
		videoChat.leave();
		RoomStore.set(EmptyRoom);
		if ($UserStore?.isMember) {
			location.href = '/' + organization?.slug;
		} else {
			location.href = '/';
		}
	};
</script>

<dialog open>
	<article>
		<div>{_('Room Title')}</div>
		<h4>{$RoomStore.title}</h4>
		{#if organization}
			<div>{_('Organization')}</div>
			<h5>{organization?.title}</h5>
		{/if}
		{#if me}
			<ProfileEditInputs
				{me}
				label={_('Enter')}
				onUpdateDone={async () => {
					actionHistory.send('enterRoom');
					readyToConnect = true;
					if (!videoChat.connected) {
						videoChat.init({ ...$UserStore }, $RoomStore);
						await videoChat.connect();
						whenChatConnected();
					}
				}}
				user={$UserStore}
			>
				<hr />
				<div>{_('Audio')}</div>
				<div style="display:flex;gap:1rem;">
					<div style="flex:1;align-self:center">
						{_('Your Audio')}:
						{#if $UserStore.onMute}{_('Muted')}{:else}{_('On')}{/if}
					</div>
					<div
						style="align-self: center;
      height: 3rem;"
					>
						<AudioButton />
					</div>
				</div>
				<hr />
			</ProfileEditInputs>
		{/if}
		<button class="secondary" on:click={onLeaveClicked}>{_('Leave')}</button>
	</article>
</dialog>
