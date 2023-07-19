<script lang="ts">
	import TextChatMessage from '../Molecules/TextChatMessage.svelte';

	import 'aframe';
	import 'aframe-environment-component';
	import 'aframe-extras';
	import { onDestroy, onMount } from 'svelte';
	import { EventStore, UserStore } from '$lib/store';
	import axios from 'axios';

	import '$lib/AframeComponents';
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
	export let virtuaMentorReady = false;
	export let messages: Message[] = [];
	export let newMessagePinned = false;
	let newMessageBody = '';
	export let authors: User[];
	export let textChatOpen = false;

	const onKeyDown = (e: KeyboardEvent) => {
		if (!textChatOpen) return;
		if (document.activeElement?.tagName === 'TEXTAREA' && e.key === 'Enter' && e.ctrlKey) {
			onMessageSendClicked();
			return;
		}
	};
	onMount(async () => {
		//loadMessages();
		//onKeyDown
		// io.emit('setEventId', {
		// 	eventId: $EventStore.id,
		// 	userId: $UserStore.id
		// });
		document.addEventListener('keydown', onKeyDown);
	});
	onDestroy(() => {
		document.removeEventListener('keydown', onKeyDown);
	});

	// io.on('answer', async (answer) => {
	// 	const aiMessage = new Message({
	// 		body: escapeHTML(answer),
	// 		user: 'Mentor',
	// 		event: $EventStore.id,
	// 		pinned: false
	// 	});
	// 	newMessageBody = '';
	// 	const createdMessage = await sendChatMessage(aiMessage);
	// 	const utterance = new SpeechSynthesisUtterance(unescapeHTML(createdMessage.body));
	// 	speechSynthesis.speak(utterance);
	// });
	const onMessageSendClicked = async () => {
		if (newMessageBody.trim() === '') return;
		if (newMessageForMentor) {
			newMessageBody = newMessageBody + ' @Mentor';
		}
		busy = true;
		const newMessage = new Message({
			body: escapeHTML(newMessageBody),
			user: $UserStore.id,
			event: $EventStore.id,
			pinned: newMessagePinned
		});
		await sendChatMessage(newMessage);
		busy = false;
		if (newMessageBody.includes('@Mentor')) {
			//io.emit('question', newMessageBody);
			newMessageBody = '';
			//send message to mentor
			waitingForAIAnswer = true;
			const aiMessage = await sendQuestionToAI($EventStore.id, newMessage);
			waitingForAIAnswer = false;
			newMessageBody = '';
			const createdMessage = { ...(await sendChatMessage(aiMessage)), isTalking: true };
			aiSpeaksOut(createdMessage.body);
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
	export let onMicClicked: () => void;
	let recognition;
	export let micActive: boolean;
</script>

<div class="chat-box">
	<div style="overflow-y:auto;max-height:calc(100vh - 23rem)">
		{#each messages.sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1)) as message}
			<TextChatMessage
				{message}
				author={authors.find((a) => a.id === message.user) || { nickname: 'AI' }}
				onDelete={(messageId) => {
					messages = messages.filter((m) => m.id !== messageId);
				}}
			/>
		{/each}
	</div>
	<hr />
	<div style="display:flex; gap:0.4rem;">
		<div>
			<button
				data-tooltip={_('Ask AI Mentor')}
				aria-busy={waitingForAIAnswer}
				class="pill-icon-button"
				style:background-color={micActive ? 'red' : ''}
				on:click={onMicClicked}
			>
				<Icon icon="mic" />
			</button>
		</div>
		<div>
			<button
				data-tooltip={_('Attach File')}
				class="pill-icon-button"
				on:click={() => {
					uploader.launchPicker(undefined, async (res) => {
						res.filesUploaded.forEach(async (file) => {
							console.log(file);

							const message = new Message({
								event: $EventStore.id,
								type: 'attachment',
								user: $UserStore.id,
								body: file.filename,
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
		<div style="text-align:right;flex:1">
			<InputWithLabel
				label="@Mentor"
				disabled={!virtuaMentorReady}
				type="switch"
				bind:value={newMessageForMentor}
			/>
		</div>
		<InputWithLabel label={_('Pinned')} type="switch" bind:value={newMessagePinned} />
	</div>
	<div style="display:flex;gap:0.4rem">
		<div style="flex:1" id="chat-textarea">
			<InputWithLabel label="" type="textarea" bind:value={newMessageBody} />
		</div>
		<div>
			<button aria-busy={busy} style="margin-bottom:0rem" on:click={onMessageSendClicked}
				>{_('Send')}</button
			>
		</div>
	</div>
</div>

<style>
	.pill-icon-button {
		height: 2rem;
		border-radius: 1rem;
		padding-top: 0.1rem;
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
</style>
