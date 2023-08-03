<script lang="ts">
	import TextChatMessage from '../Molecules/TextChatMessage.svelte';

	import { onDestroy, onMount } from 'svelte';
	import { RoomStore, UserStore } from '$lib/store';
	import axios from 'axios';

	import { videoChat } from '$lib/frontend/Classes/VideoChat';
	import { Message } from '$lib/frontend/Classes/Message';
	import InputWithLabel from '../Molecules/InputWithLabel.svelte';
	import Icon from '../Atom/Icon.svelte';
	import { escapeHTML, unescapeHTML } from '$lib/math/escapeHTML';
	import { Users } from '$lib/frontend/Classes/Users';
	import type { User } from '$lib/frontend/Classes/User';
	import { editableObject } from '$lib/frontend/Classes/EditableObject';
	import type { Me } from '$lib/frontend/Classes/Me';
	import VoiceResponse from 'twilio/lib/twiml/VoiceResponse';
	import { LocalAudioTrack, createLocalAudioTrack } from 'twilio-video';
	import { scrollToBottom } from '$lib/frontend/scrollToBottom';
	import { uploader } from '$lib/frontend/Classes/Uploader';
	import { sendQuestionToAI } from '$lib/frontend/sendQuestionToAI';
	import { aiSpeaksOut } from '$lib/frontend/aiSpeaksOut';
	import { _ } from '$lib/i18n';
	import { GenerateImage } from '$lib/frontend/Classes/GenerateImage';
	import { actionHistory } from '$lib/frontend/Classes/ActionHistory';
	import SendMessageButton from '../Atom/SendMessageButton.svelte';
	export let virtuaMentorReady = false;
	export let messages: Message[] = [];
	export let newMessagePinned = false;
	let newMessageBody = '';
	export let authors: User[] = [];
	export let textChatOpen = false;
	export let forceMentor: string | false = false;
	export let forceNoPin = false;
	const onKeyDown = (e: KeyboardEvent) => {
		if (!textChatOpen) return;
		if (document.activeElement?.tagName === 'TEXTAREA' && e.key === 'Enter' && e.ctrlKey) {
			onMessageSendClicked();
			return;
		}
	};
	onMount(async () => {
		if (forceMentor) {
			newMessageForMentor = true;
		}

		document.addEventListener('keydown', onKeyDown);
	});
	onDestroy(() => {
		document.removeEventListener('keydown', onKeyDown);
	});

	const onMessageSendClicked = async () => {
		if (newMessageBody.trim() === '') return;
		if (newMessageForMentor && !forceMentor) {
			newMessageBody = newMessageBody + ' @Mentor';
		}
		busy = true;
		let newMessage = new Message({
			body: escapeHTML(newMessageBody),
			user: $UserStore.id,
			room: $RoomStore.id,
			pinned: newMessagePinned
		});
		if (!newMessageGenerateImage) {
			await sendChatMessage(newMessage);
		}
		busy = false;
		if (newMessageGenerateImage) {
			waitingForAIAnswer = true;
			actionHistory.send('generateImage', { message: newMessageBody });
			const promise = new GenerateImage(newMessageBody);
			promise.onDone(async (file) => {
				const mentor = await axios
					.get('/api/mentors/' + (forceMentor || $RoomStore.mentor))
					.then((res) => res.data);
				console.log({ file });
				const message = new Message({
					room: $RoomStore.id,
					type: 'attachment',
					user: mentor.user,
					body: 'generated image',
					handle: file.handle,
					url: file.url
				});
				console.log('sending image', message, mentor);
				const createdMessage = await sendChatMessage(message);
			});
			newMessageBody = '';
			waitingForAIAnswer = false;
			return;
		}
		if (newMessageBody.includes('@Mentor') || forceMentor) {
			console.log({ newMessage });
			//io.emit('question', newMessageBody);
			newMessageBody = '';
			//send message to mentor
			waitingForAIAnswer = true;
			const aiMessage = await sendQuestionToAI(
				forceMentor || $RoomStore.mentor,
				$RoomStore.id || 'none',
				newMessage
			);
			waitingForAIAnswer = false;
			newMessageBody = '';
			const createdMessage = { ...(await sendChatMessage(aiMessage)), isTalking: true };
			const mentor = await axios
				.get('/api/mentors/' + (forceMentor || $RoomStore.mentor))
				.then((res) => res.data);
			console.log({ mentor });
			if (!aiSpeaks) return;
			aiSpeaksOut(createdMessage.body, forceMentor ? null : Users.find(mentor.user) || null);
		} else {
			//io.emit('statement', newMessageBody);
		}
		newMessageBody = '';
		setTimeout(() => {
			const element = document.querySelector('.chat-box > div');
			if (!element) return;
			scrollToBottom(element);
		}, 100);
	};
	export let waitingForAIAnswer = false;
	export let sendChatMessage: (message: Message) => Promise<Message>;
	let busy = false;
	let newMessageForMentor = false;
	export let onMicClicked: () => void = () => {};
	let recognition;
	export let micActive: boolean = false;
	let newMessageGenerateImage = false;
	export let aiSpeaks = true;
</script>

<div
	style="overflow-y:auto;max-height:calc(100svh - 19rem)"
	style:max-height={forceMentor ? 'calc(100svh - 16rem)' : 'calc(100svh - 19rem)'}
>
	{#each messages.sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1)) as message}
		<TextChatMessage
			bind:message
			{forceNoPin}
			{forceMentor}
			author={authors.find((a) => a.id === message.user) || { nickname: 'AI' }}
			onDelete={(messageId) => {
				messages = messages.filter((m) => m.id !== messageId);
			}}
		/>
	{/each}
</div>
<hr />
<div style="display:flex; gap:0.4rem;">
	{#if forceMentor || $RoomStore.mentor}
		<div>
			<button
				small
				data-tooltip={_('Ask AI Mentor')}
				class="circle-button"
				style:background-color={micActive ? 'red' : ''}
				on:click={onMicClicked}
			>
				<Icon icon="record_voice_over" />
			</button>
		</div>
	{/if}
	{#if !forceMentor}
		<div>
			<button
				data-tooltip={_('Attach File')}
				class="circle-button"
				small
				on:click={() => {
					uploader.launchPicker(undefined, 1, async (res) => {
						res.filesUploaded.forEach(async (file) => {
							actionHistory.send('uploadToChat', file);
							console.log(file);

							const message = new Message({
								room: $RoomStore.id,
								type: 'attachment',
								user: $UserStore.id,
								body: file.filename,
								handle: file.handle,
								url: file.url
							});
							const createdMessage = await sendChatMessage(message);
							console.log({ createdMessage });
						});
					});
				}}
			>
				<Icon icon="attachment" />
			</button>
		</div>
	{/if}
	{#if !forceMentor}
		<div>
			<button
				data-tooltip={_('@Mentor')}
				class="circle-button"
				small
				on:click={() => {
					newMessageForMentor = !newMessageForMentor;
				}}
				style:opacity={newMessageForMentor ? 1 : 0.5}
			>
				<Icon icon="person" />
			</button>
		</div>
	{/if}
	<div>
		<button
			style:opacity={aiSpeaks ? 1 : 0.5}
			data-tooltip={_('AI Speaks')}
			class="circle-button"
			small
			on:click={() => {
				aiSpeaks = !aiSpeaks;
			}}
		>
			<Icon icon="campaign" />
		</button>
	</div>
	<div style="text-align:right;flex:1">
		<button
			data-tooltip={_('Generate Image')}
			class="circle-button"
			small
			on:click={() => {
				newMessageGenerateImage = !newMessageGenerateImage;
			}}
			style:opacity={newMessageGenerateImage ? 1 : 0.5}
		>
			<Icon icon="palette" />
		</button>
	</div>
	{#if !forceNoPin}
		<button
			data-tooltip={newMessagePinned ? _('Unpin') : _('Pin')}
			class="circle-button"
			small
			on:click={() => {
				newMessagePinned = !newMessagePinned;
			}}
			style:opacity={newMessagePinned ? 1 : 0.5}
		>
			<Icon icon="push_pin" />
		</button>
	{/if}
</div>
<div style="display:flex;gap:0.4rem">
	<div style="flex:1;" id="chat-textarea">
		<textarea bind:value={newMessageBody} />
	</div>
	<div>
		<SendMessageButton {onMessageSendClicked} bind:busy {newMessageGenerateImage} />
	</div>
</div>
