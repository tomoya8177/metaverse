<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { EventStore, UserStore } from '$lib/store';

	import type { Me } from '$lib/frontend/Classes/Me';
	import { Users } from '$lib/frontend/Classes/Users';
	import SceneUIs from './SceneUIs.svelte';
	import { videoChat } from '$lib/frontend/Classes/VideoChat';
	import { messageListeners, messageUnlisteners } from '$lib/frontend/messageListeners';
	import ProfileEditInputs from './ProfileEditInputs.svelte';
	import AudioButton from './AudioButton.svelte';
	import axios from 'axios';
	import type { Organization } from '$lib/types/Organization';
	import { _ } from '$lib/i18n';
	import { EmptyEvent } from '$lib/preset/EmptyEvent';
	import { actionHistory } from '$lib/frontend/Classes/actionHistory';
	export let me: Me | null;

	export let readyToConnect;
	let organization: Organization | null = null;
	onMount(async () => {
		organization = await axios
			.get('/api/organizations/' + $EventStore.organization)
			.then((res) => res.data);
	});
	export let whenChatConnected: () => void;
	const onLeaveClicked = () => {
		actionHistory.send('leaveRoom');
		videoChat.leave();
		EventStore.set(EmptyEvent);
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
		<h4>{$EventStore.title}</h4>
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
						videoChat.init($UserStore, $EventStore);
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
