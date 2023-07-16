<script lang="ts">
	import TextChatMessage from '../Molecules/TextChatMessage.svelte';

	import 'aframe';
	import 'aframe-environment-component';
	import 'aframe-extras';
	import { onDestroy, onMount } from 'svelte';
	import { EventStore, FocusObjectStore, UserStore } from '$lib/store';
	import axios from 'axios';

	import '$lib/AframeComponents';
	import { videoChat } from '$lib/frontend/Classes/VideoChat';
	import { Message } from '$lib/frontend/Classes/Message';
	import InputWithLabel from '../Molecules/InputWithLabel.svelte';
	import Icon from '../Atom/Icon.svelte';
	import { escapeHTML, unescapeHTML } from '$lib/math/escapeHTML';
	import { Users } from '$lib/frontend/Classes/Users';
	import type { User } from '$lib/types/User';
	import { editableObject } from '$lib/frontend/Classes/EditableObject';
	import type { Me } from '$lib/frontend/Classes/Me';
	import VoiceResponse from 'twilio/lib/twiml/VoiceResponse';
	import { LocalAudioTrack, createLocalAudioTrack } from 'twilio-video';
	import { scrollToBottom } from '$lib/frontend/scrollToBottom';
	export let virtuaMentorReady = false;
	export let messages: Message[] = [];
	let newMessagePinned = false;
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
		const newMessage = {
			body: escapeHTML(newMessageBody),
			user: $UserStore.id,
			event: $EventStore.id,
			pinned: newMessagePinned
		};
		await sendChatMessage(new Message(newMessage));
		busy = false;
		if (newMessageBody.includes('@Mentor')) {
			//io.emit('question', newMessageBody);
			newMessageBody = '';
			//send message to mentor
			const response = await axios
				.post('/chat/' + $EventStore.id, newMessage)
				.then((res) => res.data);
			console.log(response);
			const aiMessage = new Message({
				body: escapeHTML(response.response || response.text),
				user: 'Mentor',
				event: $EventStore.id,
				pinned: false,
				isTalking: true
			});
			newMessageBody = '';
			const createdMessage = { ...(await sendChatMessage(aiMessage)), isTalking: true };
			const utterance = new SpeechSynthesisUtterance(unescapeHTML(createdMessage.body));
			speechSynthesis.speak(utterance);
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
	const sendChatMessage = async (message: Message) => {
		const createdMessage = await axios.post('/api/messages', message).then((res) => res.data);
		videoChat.sendMessage({ ...createdMessage, key: 'textMessage' });
		messages = [
			...messages,
			{ ...createdMessage, isTalking: createdMessage.user === 'Mentor' ? true : false }
		];
		authors = await axios
			.get(`/api/users?id=in:'${messages.map((m) => m.user).join("','")}'`)
			.then((res) => res.data);
		return createdMessage;
	};
	let busy = false;
	let newMessageForMentor = false;
	export let micActive = false;
	const onMicClicked = () => {
		micActive = !micActive;
		if (micActive) {
			//activate my mic and start audio to text
			startAudioToText();
		} else {
			//deactivate my mic and stop audio to text
			recognition.stop();
		}
	};
	let recognition;
	const startAudioToText = () => {
		//activate speech detech api
		createRecognition();
		recognition.start();
		console.log({ recognition }, 'started');
		recognition.addEventListener('result', (e) => {
			console.log(e.results);
			const transcript = e.results[0][0].transcript;
			// const transcript = Array.from(e.results)
			// 	.map((result) => result[0])
			// 	.map((result) => result.transcript.replace('at mentor', '@Mentor'))
			// 	.join('');
			newMessageBody = transcript;
			if (e.results[0].isFinal) {
				onMessageSendClicked();
				//reset recognition results
				// onMicClicked();

				// setTimeout(() => {
				// 	onMicClicked();
				// }, 1000);
			}
		});
		recognition.onerror = (event) => {
			if (event.error === 'not-allowed') {
				alert('Microphone access denied by the user.');
				// Perform any necessary actions when access is denied
			} else {
				console.log('Error', event.error);
			}
			onMicClicked();
		};
	};
	const createRecognition = () => {
		const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
		recognition = new SpeechRecognition();
		recognition.interimResults = false;
		recognition.lang = 'en-US';
		recognition.continuous = false;
		//Setting interimResults to true
	};
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
	<div style="display:flex; gap:1rem;">
		<div>
			<a href={'#'} on:click={onMicClicked} style:opacity={micActive ? 1 : 0.5}>
				<Icon icon="mic" />
			</a>
		</div>
		<div style="text-align:right;flex:1">
			<InputWithLabel
				label="@Mentor"
				disabled={!virtuaMentorReady}
				type="switch"
				bind:value={newMessageForMentor}
			/>
		</div>
		<InputWithLabel label="Pinned" type="switch" bind:value={newMessagePinned} />
	</div>
	<div style="display:flex;gap:0.4rem">
		<div style="flex:1" id="chat-textarea">
			<InputWithLabel label="" type="textarea" bind:value={newMessageBody} />
		</div>
		<div>
			<button aria-busy={busy} style="margin-bottom:0rem" on:click={onMessageSendClicked}
				>Send</button
			>
		</div>
	</div>
</div>

<style>
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
