<script lang="ts">
	import FilePreviewPanel from './FilePreviewPanel.svelte';

	import ActionButtons from './ActionButtons.svelte';
	import ChatBox from './ChatBox.svelte';

	import { onDestroy, onMount } from 'svelte';
	import {
		PreviewPanelOpen,
		RoomStore,
		UserStore,
		ItemsInPreview,
		FocusObjectStore,
		ChatMessagesStore,
		TextChatOpen
	} from '$lib/store';
	import axios from 'axios';

	import type { User } from '$lib/frontend/Classes/User';
	import { scrollToBottom } from '$lib/frontend/scrollToBottom';
	import { Message } from '$lib/frontend/Classes/Message';
	import { videoChat } from '$lib/frontend/Classes/VideoChat';
	import { Users } from '$lib/frontend/Classes/Users';
	import type { Me } from '$lib/frontend/Classes/Me';
	import { sendQuestionToAI } from '$lib/frontend/sendQuestionToAI';
	import { escapeHTML } from '$lib/math/escapeHTML';
	import ObjectEditor from './ObjectEditor.svelte';
	import { VoiceRecognition } from '$lib/frontend/Classes/VoiceRecognition';
	import { _ } from '$lib/i18n';
	import Icon from '../Atom/Icon.svelte';
	import { sharedObjects } from '$lib/frontend/Classes/SharedObjects';
	import type { SharedObject } from '$lib/frontend/Classes/SharedObject';
	import NippleControl from '../Atom/NippleControl.svelte';
	import { myAlert, toast } from '$lib/frontend/toast';
	import { actionHistory } from '$lib/frontend/Classes/ActionHistory';
	import { getPositionFromLockedPosition } from '$lib/frontend/getPositionFromLockedPosition';
	import ObjectLockSelect from '../Molecules/ObjectLockSelect.svelte';
	import ModalCloseButton from '../Atom/ModalCloseButton.svelte';
	import MentorEdit from './MentorEdit.svelte';
	import { DateTime } from 'luxon';
	import { Mentor } from '$lib/frontend/Classes/Mentor';
	import { error } from '@sveltejs/kit';
	import type { Organization } from '$lib/types/Organization';
	import type { Room } from '$lib/frontend/Classes/Room';
	import RightControls from '../Molecules/RightControls.svelte';
	import { wasdControl } from '$lib/frontend/Classes/WASDControl';
	import { convertLocalToUTC } from '$lib/frontend/convertLocalToUTC';
	import { PUBLIC_IS_DEV } from '$env/static/public';
	import { nippleControl } from '$lib/frontend/Classes/NippleControl';
	import { Unit } from '$lib/frontend/Classes/Unit';
	export let organization: Organization;
	export let room: Room;
	const scrolToBottom = (element: Element) => {
		element.scrollTop = element.scrollHeight;
	};
	let authors: User[];
	const onTextChatClicked = () => {
		TextChatOpen.update((value) => {
			const val = !value;
			if (val) {
				setTimeout(() => {
					const element = document.querySelector('.chat-box > div');
					if (!element) return;
					scrolToBottom(element);
				}, 100);
			}
			return val;
		});
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
		//on space key
		if (e.key === ' ') {
			me.jump();
		}
		if (e.key === 'w' || e.key === 'a' || e.key === 's' || e.key === 'd') {
			me.disableTouch();
			nippleControl.hide();
			if (e.key === 'w') {
				wasdControl.velocityZ = 60;
			}
			if (e.key === 's') {
				wasdControl.velocityZ = -60;
			}
			if (e.key === 'a') {
				wasdControl.velocityX = 60;
			}
			if (e.key === 'd') {
				wasdControl.velocityX = -60;
			}
		}
	};
	const onKeyUp = (e: KeyboardEvent) => {
		if (
			document.activeElement?.tagName === 'INPUT' ||
			document.activeElement?.tagName === 'TEXTAREA' ||
			document.activeElement?.tagName === 'SELECT'
		)
			return;
		if (e.key === 'w' || e.key === 's') {
			wasdControl.velocityZ = 0;
		}
		if (e.key === 'a' || e.key === 'd') {
			wasdControl.velocityX = 0;
		}
	};
	const scrollChatToBottom = () => {
		const element = document.querySelector('.chat-box > div');
		if (!element) return;
		scrollToBottom(element);
	};
	onMount(async () => {
		document.addEventListener('keydown', onKeyDown);
		document.addEventListener('keyup', onKeyUp);

		videoChat.listenTo('textMessage', async (data) => {
			const message = new Message(data);
			ChatMessagesStore.update((arr) => {
				arr = [...arr, message];
				return arr;
			});

			if (message.user !== $UserStore.id) {
				const unit = Users.find(message.user);
				if (unit && unit instanceof Unit) unit.say(data.body);
			}
			setTimeout(() => {
				scrollChatToBottom();
			}, 100);
			if (message.isAIs) {
				if (!room.mentorData.toSpeak) {
					TextChatOpen.set(true);
					return;
				}
				room.mentorData.speak(message.body);
			}
		});
	});
	onDestroy(() => {
		document.removeEventListener('keydown', onKeyDown);
		document.removeEventListener('keyup', onKeyUp);
		videoChat.dontListenTo('textMessage');
	});

	let recognition: VoiceRecognition;
	export let me: Me;
	let micActive = false;
	const onMicClicked = async () => {
		micActive = !micActive;
		if (micActive) {
			recognition = new VoiceRecognition((event) => {
				if (event.error === 'not-allowed') {
					myAlert(_('Microphone access denied by the user.'));
				} else {
					myAlert(event.error);
					return;
				}
				onMicClicked();
			});
		} else {
			recognition.stop();
			if (!recognition.body) return;
			const newMessage = new Message({
				body: recognition.body + ' @Mentor',
				user: $UserStore.id,
				room: room.id,
				pinned: newMessagePinned
			});

			await sendChatMessage(newMessage);
			waitingForAIAnswer = true;
			const aiMessage = await sendQuestionToAI({
				type: 'room',
				mentor: room.mentorData,
				roomId: room.id,
				newMessage,
				userId: undefined,
				channelId: videoChat.room?.sid || ''
			});
			waitingForAIAnswer = false;
			const createdMessage = { ...(await sendChatMessage(aiMessage)) };
			room.mentorData.come(me);
			if (!room.mentorData.toSpeak) {
				TextChatOpen.set(true);
				return;
			}
			room.mentorData.speak(createdMessage.body);
		}
	};
	let waitingForAIAnswer = false;
	let newMessagePinned = false;

	const sendChatMessage = async (message: Message): Promise<Message> => {
		actionHistory.send('sendChatMessage', { ...message, body: escapeHTML(message.body) });
		message.create();
		//		const createdMessage = new Message(await message.create());
		videoChat.sendMessage({ ...message, key: 'textMessage' });
		ChatMessagesStore.update((arr) => {
			arr = [...arr, message];
			return arr;
		});
		return message;
	};
</script>

<div style="position:absolute;bottom:11rem;left:1rem;" class="nippleControl">
	<NippleControl />
</div>

{#if $FocusObjectStore && $FocusObjectStore.title != ''}
	{@const iCanEdit = $FocusObjectStore.user == $UserStore.id || $UserStore.isManager}
	<div class="objectEditorNav">
		<Icon icon="deployed_code" />
		<span style="max-width:15rem;text-wrap:nowrap;overflow:hidden;">
			{$FocusObjectStore.title}
		</span>
		<div
			style="
			margin-top:0.4rem;
			align-items:center;
			display:flex;
			gap:0.4rem;
			justify-content: center; 
			align-items: center;
	"
		>
			<div>
				<a
					role="button"
					small
					class="circle-button"
					data-tooltip={_('Info')}
					href={`/${organization.slug}/${room.slug}/${$FocusObjectStore.id}`}
				>
					<Icon icon="info" />
				</a>
			</div>
			{#if iCanEdit && $FocusObjectStore.type != 'screen'}
				<div>
					<a
						role="button"
						small
						class="circle-button"
						data-tooltip={_('Edit')}
						href={`/${organization.slug}/${room.slug}/editCard/${$FocusObjectStore.id}`}
					>
						<Icon icon="edit" />
					</a>
				</div>
			{/if}
			{#if iCanEdit}
				<div>
					<button
						data-tooltip={$FocusObjectStore.locked ? _('Unock') : _('Lock')}
						class:outline={$FocusObjectStore.locked}
						class="circle-button"
						small
						on:click={() => {
							if (!$FocusObjectStore) return;
							$FocusObjectStore.locked = !$FocusObjectStore.locked;
							if ($FocusObjectStore.locked) FocusObjectStore.set(null);
						}}
					>
						<Icon icon={$FocusObjectStore.locked ? 'lock' : 'lock_open'} />
					</button>
				</div>
			{/if}
			<div>
				<button
					data-tooltip={_('Add To Preview Pane')}
					class="circle-button"
					small
					on:click={() => {
						if (!$FocusObjectStore) return;

						if ($FocusObjectStore.type == 'screen') {
							PreviewPanelOpen.set(true);
							return;
						}
						$FocusObjectStore.inPreviewPane = true;
						ItemsInPreview.update((itemsInPreview) => {
							if (!$FocusObjectStore) return itemsInPreview;
							return [...itemsInPreview, $FocusObjectStore];
						});
						//
						PreviewPanelOpen.set(true);
						FocusObjectStore.set(null);
					}}
				>
					<Icon icon="magnify_fullscreen" />
				</button>
			</div>
			{#if $FocusObjectStore.type?.includes('video')}
				{#if $FocusObjectStore && !$FocusObjectStore.playing}
					<div>
						<button
							small
							class="circle-button"
							on:click={() => {
								if (!$FocusObjectStore || !$FocusObjectStore.asset) return;
								$FocusObjectStore.asset.play();
								$FocusObjectStore.playing = true;
							}}
						>
							<Icon icon="play_arrow" />
						</button>
					</div>
				{:else}
					<div>
						<button
							small
							class="circle-button"
							on:click={() => {
								if (!$FocusObjectStore || !$FocusObjectStore.asset) return;
								$FocusObjectStore.asset.pause();
								$FocusObjectStore.playing = false;
							}}
						>
							<Icon icon="pause" />
						</button>
					</div>
				{/if}
				<div>
					<button
						small
						class="circle-button"
						on:click={() => {
							if (!$FocusObjectStore || !$FocusObjectStore.asset) return;
							if ($FocusObjectStore.asset instanceof HTMLVideoElement)
								$FocusObjectStore.asset.currentTime = 0;
						}}
					>
						<Icon icon="replay" />
					</button>
				</div>
				<div>
					<!-- mute button-->
					<button
						small
						class="circle-button"
						on:click={() => {
							if (!$FocusObjectStore) return;

							const video = document.getElementById(`${$FocusObjectStore.id}asset`);
							if (!video || !$FocusObjectStore.asset) return console.error('video is null');
							if ($FocusObjectStore.asset instanceof HTMLVideoElement) {
								$FocusObjectStore.asset.muted = !$FocusObjectStore.asset.muted;
								$FocusObjectStore.muted = $FocusObjectStore.asset.muted;
							}
						}}
					>
						{#if $FocusObjectStore.muted}
							<Icon icon="volume_off" />
						{:else}
							<Icon icon="volume_up" />
						{/if}
					</button>
				</div>
			{/if}
			<div>
				<button
					data-tooltip={_('Like')}
					class="circle-button"
					on:click={async () => {
						if (!$FocusObjectStore) return;
						await me.sendLike($FocusObjectStore.user, 'like', 1);
						toast(_('Sent Like'));
					}}
					small
				>
					<Icon icon="thumb_up" />
				</button>
			</div>
		</div>
	</div>
{/if}
<FilePreviewPanel />

<div class="object-editor" />

<ActionButtons {waitingForAIAnswer} {onMicClicked} bind:micActive {me} {room} />
<div style:display={$TextChatOpen ? 'block' : 'none'}>
	<div class="chat-box">
		<ChatBox
			mentor={room.mentorData}
			{room}
			bind:waitingForAIAnswer
			bind:newMessagePinned
			{sendChatMessage}
			{onMicClicked}
			bind:authors
			bind:micActive
		/>
	</div>
</div>

<div style:display={!$UserStore.onVideoMute && !$TextChatOpen ? 'block' : 'none'}>
	<div id="myCameraPreview" />
</div>

<style>
	button {
		margin-bottom: 0rem;
	}

	.objectEditorNav {
		position: absolute;
		/* center */
		left: 50%;
		transform: translateX(-50%);
		top: 3.2rem;
		z-index: 2;
		text-align: center;
		background-color: rgba(0, 0, 0, 0.3);
		max-width: 100vw;
		padding: 0.4rem;
		border: solid 1px #1e88e5;
		border-radius: 0.6rem;
	}

	.object-editor {
		position: absolute;
		top: 2em;
		left: 1rem;
		z-index: 100;
	}
	#myCameraPreview {
		position: absolute;
		bottom: 6rem;
		right: 1rem;
		border-radius: 50%;
		overflow: hidden;
		box-shadow: 0 0 0.4rem 0.4rem rgba(0, 0, 0, 0.2);
	}

	.chat-box {
		max-height: calc(100svh - 6rem);
		max-width: 100vw;
		width: 26rem;
		position: absolute;
		padding: 0.4rem;
		border-radius: 0.4rem;
		bottom: 5rem;
		right: 0;
		/* color: white; */
		background-color: rgba(255, 255, 255, 0.7);
		display: grid;
	}
	/* background color based on browder dark setting */
	@media (prefers-color-scheme: dark) {
		.chat-box {
			background-color: rgba(0, 0, 0, 0.7);
			/* color: black; */
		}
	}
</style>
