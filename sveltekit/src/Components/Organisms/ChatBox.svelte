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
		if (newMessageForMentor && !forceMentor) {
			newMessageBody = newMessageBody + ' @Mentor';
		}
		busy = true;
		let newMessage = new Message({
			body: escapeHTML(newMessageBody),
			user: $UserStore.id,
			event: $EventStore.id,
			pinned: newMessagePinned
		});
		await sendChatMessage(newMessage);
		busy = false;
		if (newMessageGenerateImage) {
			waitingForAIAnswer = true;
			const response = await axios.post('/stability', {
				prompt: newMessageBody
			});
			newMessageBody = '';

			console.log(response.data);
			const mentor = await axios
				.get('/api/mentors/' + (forceMentor || $EventStore.mentor))
				.then((res) => res.data);
			const message = new Message({
				event: $EventStore.id,
				type: 'attachment',
				user: mentor.user,
				body: 'generated image',
				url: response.data.path
			});
			const createdMessage = await sendChatMessage(message);
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
				forceMentor || $EventStore.mentor,
				$EventStore.id,
				newMessage
			);
			waitingForAIAnswer = false;
			newMessageBody = '';
			const createdMessage = { ...(await sendChatMessage(aiMessage)), isTalking: true };
			const mentor = await axios
				.get('/api/mentors/' + (forceMentor || $EventStore.mentor))
				.then((res) => res.data);
			console.log({ mentor });
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
</script>

<div
	style="overflow-y:auto;max-height:calc(100svh - 23rem)"
	style:max-height={forceMentor ? 'calc(100svh - 16rem)' : 'calc(100svh - 23rem)'}
>
	{#each messages.sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1)) as message}
		<TextChatMessage
			{message}
			{forceNoPin}
			author={authors.find((a) => a.id === message.user) || { nickname: 'AI' }}
			onDelete={(messageId) => {
				messages = messages.filter((m) => m.id !== messageId);
			}}
		/>
	{/each}
</div>
<hr />
<div style="display:flex; gap:0.4rem;">
	{#if forceMentor || $EventStore.mentor}
		<div>
			<button
				data-tooltip={_('Ask AI Mentor')}
				class="pill-icon-button"
				style:background-color={micActive ? 'red' : ''}
				on:click={onMicClicked}
			>
				<Icon icon="mic" />
			</button>
		</div>
	{/if}
	{#if !forceMentor}
		<div>
			<button
				data-tooltip={_('Attach File')}
				class="pill-icon-button"
				on:click={() => {
					uploader.launchPicker(undefined, 1, async (res) => {
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
	{/if}
	<div style="text-align:right;flex:1">
		<small>
			{#if forceMentor || $EventStore.mentor}
				<InputWithLabel
					label="@Mentor"
					disabled={!virtuaMentorReady || forceMentor}
					type="switch"
					bind:value={newMessageForMentor}
				/>
			{/if}
		</small>
	</div>
	<div>
		<small>
			<InputWithLabel
				label={_('Generate Image')}
				type="switch"
				bind:value={newMessageGenerateImage}
			/>
		</small>
	</div>
	{#if !forceNoPin}
		<small>
			<InputWithLabel label={_('Pinned')} type="switch" bind:value={newMessagePinned} />
		</small>
	{/if}
</div>
<div style="display:flex;gap:0.4rem">
	<div style="flex:1;" id="chat-textarea">
		<textarea bind:value={newMessageBody} />
	</div>
	<div>
		<button aria-busy={busy} style="margin-bottom:0rem" on:click={onMessageSendClicked}
			>{_('Send')}</button
		>
	</div>
</div>

<style>
	#chat-textarea textarea {
		color: white;
	}
	.pill-icon-button {
		height: 2rem;
		border-radius: 1rem;
		padding-top: 0.1rem;
	}
</style>
