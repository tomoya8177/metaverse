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

	let textChatOpen = false;

	let rotation = 0;
	export let me: Me | null = null;
</script>

<div id="media-container" />

<div class="action-buttons">
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
						alert(`Couldn't get access to the microphone`);
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
						if (await videoChat.startMyVideo()) {
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
						const publicationTrackSid = await videoChat.startShareScreen();
						if (publicationTrackSid) {
							if (videoChat.screenTrack && me) {
								me.showScreen(videoChat.screenTrack, publicationTrackSid);
								$UserStore.onScreenShare = true;
							}
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
</div>
{#if textChatOpen}
	<ChatBox />
{/if}
<div id="cameraPreviews">
	<video class="remoteVideo" style="display:none" />
</div>
<div class="videoPreview">
	<div style:display={!$UserStore.onVideoMute && !textChatOpen ? 'block' : 'none'}>
		<div id="myCameraPreview" />
	</div>
	<div style:display={$UserStore.onScreenShare && !textChatOpen ? 'block' : 'none'}>
		<div id="myScreenPreview" />
	</div>
</div>
{#if $FocusObjectStore?.open}
	<div class="editingPane">
		<div style="display:flex">
			<div style="flex:1">
				{editableObject.name || ''}
			</div>
			<div>
				<a
					href={'#'}
					on:click={() => {
						$FocusObjectStore.open = false;
					}}
				>
					<Icon icon="close" />
				</a>
			</div>
		</div>
		<InputWithLabel
			label="Scale"
			value={editableObject.scaleX || 1}
			type="range"
			step={0.1}
			min={0.5}
			max={2}
			onChange={(e) => {
				editableObject.onScaleUpdated();
				editableObject.scaleX = 1;
			}}
			onInput={(e) => {
				const value = Number(e.target.value);
				editableObject.onScaleUpdate(value);
			}}
		/>

		<InputWithLabel
			label={`Rotation (${rotation})`}
			value={editableObject.x}
			type="range"
			step={5}
			min={-45}
			max={45}
			onChange={(e) => {
				editableObject.onRotationUpdated();
				editableObject.x = 0;
				rotation = 0;
			}}
			onInput={(e) => {
				const value = Number(e.target.value);
				editableObject.onRotationUpdate(value);
				rotation = value;
			}}
		/>
	</div>
{/if}

<style>
	#cameraPreviews {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 8rem;
		display: flex;
		flex-wrap: wrap;
	}
	.remoteVideo {
		width: 8rem;
		height: 8rem;
		object-fit: cover;
		border-radius: 1rem;
		box-shadow: 0 0 1rem rgba(0, 0, 0, 0.5);
	}
	#media-container {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}
	.videoPreview {
		position: absolute;
		display: flex;
		gap: 0.8rem;
		bottom: 6rem;
		right: 1rem;
	}
	.videoPreview > div {
		align-self: center;
	}
	#myScreenPreview {
		box-shadow: 0 0 1rem rgba(0, 0, 0, 0.5);
		width: 8rem;
		border-radius: 1rem;
		overflow: hidden;
		align-self: center;
	}
	#myCameraPreview {
		box-shadow: 0 0 1rem rgba(0, 0, 0, 0.5);
		width: 8rem;
		height: 8rem;
		border-radius: 50%;
		overflow: hidden;
		align-self: center;
	}
	.dim {
		opacity: 0.5;
	}

	.action-buttons {
		position: absolute;
		bottom: 1rem;
		right: 0;
		display: flex;
		gap: 0.4rem;
	}
	.chat-box {
		max-height: calc(100vh - 9rem);
		overflow: auto;
		width: 26rem;
		position: absolute;
		padding: 1rem;
		border-radius: 1rem;
		bottom: 6rem;
		right: 0;
		background-color: rgba(0, 0, 0, 0.5);
		color: white;
		display: grid;
	}
	.editingPane {
		padding: 0.4rem;
		border-radius: 0.4rem;
		position: absolute;
		background: rgba(0, 0, 0, 0.5);
		z-index: 100;
	}
</style>
