<script lang="ts">
	import { RoomStore, UserStore } from '$lib/store';

	import Icon from '../Atom/Icon.svelte';
	import { videoChat } from '$lib/frontend/Classes/VideoChat';
	import { _ } from '$lib/i18n';
	import { actionHistory } from '$lib/frontend/Classes/ActionHistory';
	let busy = false;
</script>

{#if $UserStore.onMute}
	<button
		data-tooltip={_('Press to Unmute')}
		class="circle-button dim"
		on:click={async () => {
			busy = true;
			try {
				if (!videoChat.connected) {
					videoChat.init($UserStore, $RoomStore);
					await videoChat.connect();
				}
				await videoChat.startMyAudio();
				actionHistory.send('connectAudio');
				$UserStore.onMute = false;
			} catch (e) {
				console.log(e);
				alert(_(`Couldn't get access to the microphone`));
			}
			busy = false;
		}}
	>
		<span aria-busy={busy}>
			{#if !busy}
				<Icon icon="mic_off" />
			{/if}
		</span>
	</button>
{:else}
	<button
		data-tooltip={_('Press to Mute')}
		class="circle-button"
		on:click={() => {
			videoChat.unpublishMyTrack('audio');
			actionHistory.send('disconnectAudio');

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
