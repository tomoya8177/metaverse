<script lang="ts">
	import ChatBox from './ChatBox.svelte';

	import TextChatMessage from '../Molecules/TextChatMessage.svelte';

	import 'aframe';
	import 'aframe-environment-component';
	import 'aframe-extras';
	import { onDestroy, onMount } from 'svelte';
	import { EventStore, FocusObjectStore, UserStore } from '$lib/store';
	import axios from 'axios';

	import '$lib/AframeComponents';
	import { videoChat } from '$lib/Classes/VideoChat';
	import type { Message } from '$lib/Classes/Message';
	import InputWithLabel from '../Molecules/InputWithLabel.svelte';
	import Icon from '../Atom/Icon.svelte';
	import { escapeHTML } from '$lib/escapeHTML';
	import { Users } from '$lib/Classes/Users';
	import type { User } from '$lib/types/User';
	import { editableObject } from '$lib/Classes/EditableObject';
	import type { Me } from '$lib/Classes/Me';
	export let textChatOpen = false;
	const scrolToBottom = (element: Element) => {
		element.scrollTop = element.scrollHeight;
	};
	const onTextChatClicked = () => {
		textChatOpen = !textChatOpen;
		if (!textChatOpen) return;
		setTimeout(() => {
			const element = document.querySelector('.chat-box > div');
			if (!element) return;
			scrolToBottom(element);
		}, 100);
	};

	const onKeyDown = (e: KeyboardEvent) => {
		if (
			document.activeElement?.tagName === 'INPUT' ||
			document.activeElement?.tagName === 'TEXTAREA' ||
			document.activeElement?.tagName === 'SELECT'
		)
			return;
		if (e.key === 't') {
			onTextChatClicked();
		}
	};
	onMount(async () => {
		document.addEventListener('keydown', onKeyDown);
	});
	onDestroy(() => {
		document.removeEventListener('keydown', onKeyDown);
	});

	export let me: Me | null = null;
</script>

<button data-tooltip="T" class="circle-button" on:click={onTextChatClicked}>
	<Icon icon="chat" />
</button>
{#if $EventStore.allowAudio}
	{#if $UserStore.onMute}
		<button
			class="circle-button dim"
			on:click={async () => {
				try {
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
{/if}
{#if $EventStore.allowVideo}
	{#if $UserStore.onVideoMute}
		<button
			class="circle-button dim"
			on:click={async () => {
				try {
					if (await videoChat.startMyCamera()) {
						$UserStore.onVideoMute = false;
					}
				} catch (e) {
					console.log(e);
					alert(`Couldn't get access to the Camera`);
				}
			}}
		>
			<Icon icon="videocam_off" />
		</button>
	{:else}
		<button
			class="circle-button"
			on:click={() => {
				videoChat.unpublishMyTrack('camera');
				me?.hideCamera();
				$UserStore.onVideoMute = true;
			}}
		>
			<Icon icon="videocam" />
		</button>
	{/if}
	{#if $UserStore.onScreenShare}
		<button
			class="circle-button"
			on:click={() => {
				videoChat.unpublishMyTrack('screen');
				me?.hideScreen();
				$UserStore.onScreenShare = false;
			}}
		>
			<Icon icon="screen_share" />
		</button>
	{:else}
		<button
			class="circle-button dim"
			on:click={async () => {
				try {
					const publicationTrackSid = await videoChat.startMyScreen();
					if (publicationTrackSid && videoChat.screenTrack && me) {
						me.showScreen(videoChat.screenTrack, publicationTrackSid);
						$UserStore.onScreenShare = true;
					}
				} catch (e) {
					console.log(e);
					alert(`Couldn't get access to the Screen`);
				}
			}}
		>
			<Icon icon="stop_screen_share" />
		</button>
	{/if}
{/if}

<style>
	.dim {
		opacity: 0.5;
	}
</style>
