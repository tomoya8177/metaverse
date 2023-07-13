<script lang="ts">
	import 'aframe';
	import 'aframe-environment-component';
	import 'aframe-extras';
	import { onDestroy, onMount } from 'svelte';
	import { EventStore, FocusObjectStore, UserStore } from '$lib/store';

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

	export let me: Me | null;

	export let readyToConnect;
	let organization: Organization | null = null;
	onMount(async () => {
		organization = await axios
			.get('/api/organizations/' + $EventStore.organization)
			.then((res) => res.data);
	});
</script>

<dialog open>
	<article>
		<div>Title</div>
		<h4>{$EventStore.title}</h4>
		{#if organization}
			<div>Organization</div>
			<h5>{organization?.title}</h5>
		{/if}
		{#if me}
			<ProfileEditInputs
				{me}
				label="Enter"
				onUpdateDone={async () => {
					readyToConnect = true;
					if (!videoChat.connected) {
						videoChat.init($UserStore, $EventStore);
						await videoChat.connect();
					}
				}}
				user={$UserStore}
			>
				<hr />
				<div>Audio</div>
				<div style="display:flex;gap:1rem;">
					<div style="flex:1;align-self:center">
						Your Audio is {#if $UserStore.onMute}Muted{:else}On{/if}
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
