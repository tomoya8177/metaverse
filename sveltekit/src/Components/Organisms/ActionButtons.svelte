<script lang="ts">
	import AudioButton from './AudioButton.svelte';
	import { onDestroy, onMount } from 'svelte';
	import { EventStore, UserStore, PreviewPanelOpen, FocusObjectStore } from '$lib/store';
	import Icon from '../Atom/Icon.svelte';
	import type { Me } from '$lib/frontend/Classes/Me';
	import { videoChat } from '$lib/frontend/Classes/VideoChat';
	import { uploader } from '$lib/frontend/Classes/Uploader';
	import axios from 'axios';
	import { SharedObject } from '$lib/frontend/Classes/SharedObject';
	import { sharedObjects } from '$lib/frontend/Classes/SharedObjects';
	import { _ } from '$lib/i18n';
	import { myAlert } from '$lib/frontend/toast';
	import { EmptyObject } from '$lib/preset/EmptyObject';
	export let textChatOpen = false;
	export let waitingForAIAnswer: boolean;
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

	export let me: Me;
	export let onMicClicked: () => void;
	export let micActive: boolean;
</script>

{#if $EventStore.mentor}
	<button
		data-tooltip={_('Ask AI Mentor')}
		style:background-color={micActive ? 'red' : ''}
		class=""
		style="border-radius:29px
		"
		on:click={onMicClicked}
	>
		<Icon icon="mic" />
		<span aria-busy={waitingForAIAnswer} class="hiddenInSmallScreen">
			{_('Ask AI Mentor')}
		</span>
	</button>
{/if}
<div style="position:relative">
	<button data-tooltip={_('Text Chat') + ' (T)'} class="circle-button" on:click={onTextChatClicked}>
		<Icon icon="chat" />
	</button>
</div>

{#if $EventStore.allowAudio}
	<AudioButton />
{/if}
{#if $EventStore.allowVideo}
	{#if $UserStore.onVideoMute}
		<button
			data-tooltip={_('Start My Camera')}
			class="circle-button dim"
			on:click={async () => {
				try {
					if (await videoChat.startMyCamera()) {
						$UserStore.onVideoMute = false;
					}
				} catch (e) {
					console.log(e);
					myAlert(_(`Couldn't get access to the Camera`));
				}
			}}
		>
			<Icon icon="videocam_off" />
		</button>
	{:else}
		<button
			data-tooltip={_('Hide My Camera')}
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
			data-tooltip={_('Hide My Screen')}
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
			data-tooltip={_('Share Screen')}
			class="circle-button dim"
			on:click={async () => {
				try {
					const publicationTrackSid = await videoChat.startMyScreen();
					if (!publicationTrackSid) return console.error(`Couldn't get access to the Screen`);
					const el = document.getElementById(publicationTrackSid);
					if (!el) return console.error(`Couldn't get access to the Screen`);
					el.addEventListener('loadedmetadata', () => {
						if (publicationTrackSid && videoChat.screenTrack && me) {
							me.showScreen(videoChat.screenTrack, publicationTrackSid);
							$UserStore.onScreenShare = true;
						}
					});
				} catch (e) {
					console.log(e);
					myAlert(_(`Couldn't get access to the Screen`));
				}
			}}
		>
			<Icon icon="stop_screen_share" />
		</button>
	{/if}
	<button
		data-tooltip={_('Preview Panel')}
		class="circle-button"
		on:click={() => {
			$PreviewPanelOpen = !$PreviewPanelOpen;
			FocusObjectStore.set(EmptyObject);
		}}
	>
		<Icon icon="preview" />
	</button>
	<button
		data-tooltip={_('Upload')}
		class="circle-button"
		on:click={() =>
			uploader.launchPicker(['image/*', 'video/*', '.glb', 'gltf'], 1, (res) => {
				//when done
				console.log(res);
				res.filesUploaded.forEach(async (file) => {
					const createdFile = await axios
						.post('/api/objects', {
							event: $EventStore.id,
							type: file.mimetype,
							url: file.url,
							title: file.filename,
							handle: file.handle,
							user: $UserStore.id,
							size: file.size,
							editable: 1,
							components: JSON.stringify({
								position: me.position,
								rotation: {
									x: 0,
									y: 0,
									z: 0
								},
								scale: {
									x: 1,
									y: 1,
									z: 1
								}
							})
						})
						.then((res) => res.data);
					const object = new SharedObject(createdFile);
					if (!me) return console.error('me is null');
					object.moveToMyFront(me.position, me.rotation);
					object.locked = false;
					sharedObjects.add(object);
					videoChat.sendMessage({
						key: 'objectCreate',
						id: object.id
					});
				});
			})}
	>
		<Icon icon="add" />
	</button>
{/if}

<style>
	.dim {
		opacity: 0.5;
	}
</style>
