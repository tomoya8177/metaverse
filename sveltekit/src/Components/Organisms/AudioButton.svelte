<script lang="ts">
	import 'aframe';
	import 'aframe-environment-component';
	import 'aframe-extras';
	import { EventStore, UserStore } from '$lib/store';

	import '$lib/AframeComponents';
	import Icon from '../Atom/Icon.svelte';
	import { videoChat } from '$lib/frontend/Classes/VideoChat';
	import { _ } from '$lib/i18n';
	let busy = false;
</script>

{#if $UserStore.onMute}
	<button
		data-tooltip={_('Press to Unmute')}
		aria-busy={busy}
		class="circle-button dim"
		on:click={async () => {
			busy = true;
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
			busy = false;
		}}
	>
		{#if !busy}
			<Icon icon="mic_off" />
		{/if}
	</button>
{:else}
	<button
		data-tooltip={_('Press to Mute')}
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
