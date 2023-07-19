<script lang="ts">
	import 'aframe';
	import 'aframe-environment-component';
	import 'aframe-extras';
	import { onDestroy, onMount } from 'svelte';
	import { EventStore, UserStore } from '$lib/store';

	import '$lib/AframeComponents';
	import { Me } from '$lib/frontend/Classes/Me';
	import { Users } from '$lib/frontend/Classes/Users';
	import SceneUIs from './SceneUIs.svelte';
	import { videoChat } from '$lib/frontend/Classes/VideoChat';
	import { messageListeners, messageUnlisteners } from '$lib/frontend/messageListeners';
	import ProfileEditInputs from './ProfileEditInputs.svelte';
	import AudioButton from './AudioButton.svelte';
	import axios from 'axios';
	import type { Organization } from '$lib/types/Organization';
	import { _ } from '$lib/i18n';

	export let me: Me | null;

	export let readyToConnect;
	let organization: Organization | null = null;
	onMount(async () => {
		organization = await axios
			.get('/api/organizations/' + $EventStore.organization)
			.then((res) => res.data);
	});
	export let whenChatConnected: () => void;
</script>

<dialog open>
	<article>
		<div>{_('Event Title')}</div>
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
	</article>
</dialog>
