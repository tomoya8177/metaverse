<script lang="ts">
	import AudioButton from '../Atom/AudioButton.svelte';
	import { onDestroy, onMount } from 'svelte';
	import {
		RoomStore,
		UserStore,
		PreviewPanelOpen,
		FocusObjectStore,
		ItemsInPreview,
		TextChatOpen
	} from '$lib/store';
	import Icon from '../Atom/Icon.svelte';
	import type { Me } from '$lib/frontend/Classes/Me';
	import { videoChat } from '$lib/frontend/Classes/VideoChat';
	import { uploader } from '$lib/frontend/Classes/Uploader';
	import axios from 'axios';
	import { _ } from '$lib/i18n';
	import { myAlert } from '$lib/frontend/toast';
	import { EmptyObject } from '$lib/preset/EmptyObject';
	import { appendObjectInTheRoom } from '$lib/frontend/appendObjectInTheRoom';
	import { actionHistory } from '$lib/frontend/Classes/ActionHistory';
	import { slide } from 'svelte/transition';
	export let waitingForAIAnswer: boolean;
	import { quintOut } from 'svelte/easing';
	import ModalCloseButton from '../Atom/ModalCloseButton.svelte';
	import LinkEditor from './LinkEditor.svelte';
	import type { Organization } from '$lib/types/Organization';
	import { sharedObjects } from '$lib/frontend/Classes/SharedObjects';
	import { SharedObject } from '$lib/frontend/Classes/SharedObject';
	import { goto } from '$app/navigation';

	const scrolToBottom = (element: Element) => {
		element.scrollTop = element.scrollHeight;
	};
	const onTextChatClicked = () => {
		TextChatOpen.update((v) => !v);
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
	let organization: Organization;
	onMount(async () => {
		document.addEventListener('keydown', onKeyDown);
		organization = await axios
			.get('/api/organizations/' + $RoomStore.organization)
			.then((res) => res.data);
	});
	onDestroy(() => {
		document.removeEventListener('keydown', onKeyDown);
	});

	export let me: Me;
	export let onMicClicked: () => void;
	export let micActive: boolean;
	let more = false;
	let linkEditorOpen = false;
</script>

<div class="action-buttons">
	{#if $RoomStore.mentor}
		<button
			data-tooltip={_('Ask AI Mentor')}
			style:background-color={micActive ? 'red' : ''}
			class=""
			style="border-radius:29px
	"
			on:click={onMicClicked}
		>
			<Icon icon="record_voice_over" />
			<span aria-busy={waitingForAIAnswer} class="hiddenInSmallScreen">
				{_('Ask AI Mentor')}
			</span>
		</button>
	{/if}
	<div style="position:relative">
		<button
			data-tooltip={_('Text Chat') + ' (T)'}
			class="circle-button"
			on:click={onTextChatClicked}
		>
			<Icon icon="chat" />
		</button>
	</div>

	<AudioButton />
	{#if $UserStore.onVideoMute}
		<button
			data-tooltip={_('Start My Camera')}
			class="circle-button dim"
			on:click={async () => {
				try {
					if (await videoChat.startMyCamera()) {
						actionHistory.send('startMyCamera');
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
				actionHistory.send('hideMyCamera');
				me?.hideCamera();
				$UserStore.onVideoMute = true;
			}}
		>
			<Icon icon="videocam" />
		</button>
	{/if}
	<button
		class="circle-button"
		data-tooltip={_('More')}
		on:click={() => {
			more = !more;
			if (more) {
				TextChatOpen.set(false);
			}
		}}
	>
		<Icon icon="more_vert" />
	</button>
</div>
{#if more}
	<div class="more" transition:slide={{ delay: 0, duration: 500, easing: quintOut, axis: 'y' }}>
		{#if $UserStore.isMember}
			<button
				on:click={() => {
					goto(`/${organization.slug}/${$RoomStore.slug}/events`);
				}}
			>
				<Icon icon="calendar_month" />
				{_('Calendar')}
			</button>
		{/if}
		{#if $UserStore.onScreenShare}
			<button
				data-tooltip={_('Hide My Screen')}
				on:click={() => {
					videoChat.unpublishMyTrack('screen');
					actionHistory.send('hideMyScreen');
					me?.hideScreen();
					$UserStore.onScreenShare = false;
				}}
			>
				<Icon icon="screen_share" />
				{_('Hide My Screen')}
			</button>
		{:else}
			<button
				data-tooltip={_('Share Screen')}
				class="dim"
				on:click={async () => {
					try {
						const publicationTrackSid = await videoChat.startMyScreen();
						actionHistory.send('startMyScreen');
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
				{_('Share Screen')}
			</button>
		{/if}
		{#if $ItemsInPreview.length}
			<button
				data-tooltip={_('Preview Panel')}
				on:click={() => {
					$PreviewPanelOpen = !$PreviewPanelOpen;
					FocusObjectStore.set(null);
				}}
			>
				<Icon icon="preview" />
				{_('Preview Panel')}
			</button>
		{/if}
		<button
			data-tooltip={_('Upload')}
			on:click={() =>
				uploader.launchPicker(['image/*', 'video/*', '.glb', 'gltf'], 1, (res) => {
					//when done
					actionHistory.send('uploadToScene', { files: res.filesUploaded });
					res.filesUploaded.forEach(async (file) => {
						appendObjectInTheRoom({
							roomId: $RoomStore.id,
							file,
							userId: $UserStore.id,
							me
						});
					});
				})}
		>
			<Icon icon="add" />
			{_('Upload')}
		</button>
		<a
			role="button"
			href={`/${organization.slug}/${$RoomStore.slug}/createCard`}
			data-tooltip={_('Add Text Card')}
		>
			<Icon icon="post_add" />
			{_('Add Text Card')}
		</a>
	</div>
{/if}
{#if linkEditorOpen}
	<dialog open>
		<article style="max-width:calc(100vw - 2rem)">
			<ModalCloseButton onClick={() => (linkEditorOpen = false)} />
			<LinkEditor
				{organization}
				onCreate={(sharedObject) => {
					sharedObject.attachElement();
					sharedObject.locked = false;
					sharedObjects.add(sharedObject);
					sharedObject.moveToMyFront(me.position, me.rotation);
					linkEditorOpen = false;
				}}
				onUpdate={(sharedObject) => {
					//sharedObject.moveToMyFront(me.position, me.rotation);
					linkEditorOpen = false;
				}}
			/>
		</article>
	</dialog>
{/if}

<style>
	.dim {
		opacity: 0.7;
	}
	.action-buttons {
		max-width: calc(100vw - 1rem);
		position: absolute;
		bottom: 0rem;
		right: 0.5rem;
		display: flex;
		gap: 0.4rem;
	}
	.more {
		position: absolute;
		bottom: 4rem;
		right: 0.5rem;
		padding-bottom: 0.4rem;
		gap: 0.4rem;
	}
	button {
		margin-bottom: 0.4rem;
		height: 3rem;
	}
	button:not(.circle-button) {
		padding-top: 0.6rem;
	}
</style>
