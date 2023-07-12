<script lang="ts">
	import 'aframe';
	import 'aframe-environment-component';
	import 'aframe-extras';
	import { EventStore, UserStore } from '$lib/store';

	import '$lib/AframeComponents';
	import Icon from '../Atom/Icon.svelte';
	import { videoChat } from '$lib/frontend/Classes/VideoChat';
</script>

{#if $UserStore.onMute}
	<button
		class="circle-button dim"
		on:click={async () => {
			try {
				if (!videoChat.connected) {
					videoChat.init($UserStore, $EventStore);
					await videoChat.connect();
				}
				await videoChat.startMyAudio();
				$UserStore.onMute = false;
			} catch (e) {
				console.log(e);
				alert(`Couldn't get access to the microphone.`);
			}
		}}
	>
		<Icon icon="mic_off" />
	</button>
{:else}
	<button
		class="circle-button"
		on:click={() => {
			videoChat.unpublishMyTrack('audio');
			$UserStore.onMute = true;
		}}
	>
		<Icon icon="mic" />
	</button>
{/if}

<style>
	.dim {
		opacity: 0.5;
	}
</style>
