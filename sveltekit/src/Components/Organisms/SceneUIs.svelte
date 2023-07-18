<script lang="ts">
	import ActionButtons from './ActionButtons.svelte';
	import ChatBox from './ChatBox.svelte';

	import 'aframe';
	import 'aframe-environment-component';
	import 'aframe-extras';
	import { onDestroy, onMount } from 'svelte';
	import { EventStore, UserStore } from '$lib/store';
	import axios from 'axios';

	import '$lib/AframeComponents';
	import type { User } from '$lib/types/User';
	import { scrollToBottom } from '$lib/frontend/scrollToBottom';
	import { Message } from '$lib/frontend/Classes/Message';
	import { videoChat } from '$lib/frontend/Classes/VideoChat';
	import { Users } from '$lib/frontend/Classes/Users';
	import type { Me } from '$lib/frontend/Classes/Me';
	import { sendQuestionToAI } from '$lib/frontend/sendQuestionToAI';
	import { aiSpeaksOut } from '$lib/frontend/aiSpeaksOut';
	import { escapeHTML } from '$lib/math/escapeHTML';
	import ObjectEditor from './ObjectEditor.svelte';
	const scrolToBottom = (element: Element) => {
		element.scrollTop = element.scrollHeight;
	};
	let virtuaMentorReady = false;
	let messages: Message[] = [];
	let authors: User[] = [];
	const loadMessages = async (existings: Message[] = []) => {
		messages = [
			...(await axios
				.get('/api/messages?event=' + $EventStore.id + '&pinned=1')
				.then((res) => res.data)),
			...existings
		].filter((thing, index, self) => self.findIndex((t) => t.id === thing.id) === index);
		authors = await axios
			.get(`/api/users?id=in:'${messages.map((m) => m.user).join("','")}'`)
			.then((res) => res.data);
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
	const scrollChatToBottom = () => {
		const element = document.querySelector('.chat-box > div');
		if (!element) return;
		scrollToBottom(element);
	};
	onMount(async () => {
		document.addEventListener('keydown', onKeyDown);
		loadMessages(messages);
		axios.get('/chat/' + $EventStore.id).then(async (res) => {
			//this is okay to be delaied
			virtuaMentorReady = true;
			console.log('chat setup', res);
			if (res.data.chain == null) {
				//put action
				const res = await axios.put('/chat/' + $EventStore.id, {});
			}
		}); //ping to wake up the server
		videoChat.listenTo('textMessage', async (data) => {
			messages = [...messages, data];
			const existingAuthor = authors.find((a) => a.id === data.user);
			if (!existingAuthor) {
				const author = await axios.get(`/api/users/${data.user}`).then((res) => res.data);
				authors = [...authors, author];
			}
			if (data.user !== $UserStore.id) {
				const unit = Users.find(data.user);
				if (unit) unit.say(data.body);
			}
			setTimeout(() => {
				scrollChatToBottom();
			}, 100);
			if (data.user === 'Mentor') aiSpeaksOut(data.body);
		});
	});
	onDestroy(() => {
		document.removeEventListener('keydown', onKeyDown);
		videoChat.dontListenTo('textMessage');
	});

	let textChatOpen = false;
	let recognition;
	export let me: Me | null = null;
	let micActive = false;
	const onMicClicked = async () => {
		micActive = !micActive;
		if (micActive) {
			//activate my mic and start audio to text
			startAudioToText();
		} else {
			//deactivate my mic and stop audio to text
			recognition.stop();
			const newMessage = new Message({
				body: escapeHTML(newMessageBody) + ' @Mentor',
				user: $UserStore.id,
				event: $EventStore.id,
				pinned: newMessagePinned
			});

			await sendChatMessage(newMessage);
			waitingForAIAnswer = true;
			const aiMessage = await sendQuestionToAI($EventStore.id, newMessage);
			waitingForAIAnswer = false;
			const createdMessage = { ...(await sendChatMessage(aiMessage)), isTalking: true };
			aiSpeaksOut(createdMessage.body);
		}
	};
	let waitingForAIAnswer = false;
	let newMessagePinned = false;
	let newMessageBody = '';
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
			console.log({ transcript });
			// if (e.results[0].isFinal) {
			// 	onMessageSendClicked();
			// 	//reset recognition results
			// 	// onMicClicked();

			// 	// setTimeout(() => {
			// 	// 	onMicClicked();
			// 	// }, 1000);
			// }
		});
		recognition.onerror = (event) => {
			if (event.error === 'not-allowed') {
				alert('Microphone access denied by the user.');
				// Perform any necessary actions when access is denied
			} else {
				console.log('Error', event.error);
				alert(event.error);
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
</script>

<div class="object-editor" />

<div class="action-buttons">
	<ActionButtons {waitingForAIAnswer} {onMicClicked} bind:textChatOpen bind:micActive {me} />
</div>
<div style:display={textChatOpen ? 'block' : 'none'}>
	<ChatBox
		bind:waitingForAIAnswer
		bind:newMessagePinned
		{sendChatMessage}
		{onMicClicked}
		bind:messages
		bind:authors
		bind:micActive
		{virtuaMentorReady}
	/>
</div>

<div style:display={!$UserStore.onVideoMute && !textChatOpen ? 'block' : 'none'}>
	<div id="myCameraPreview" />
</div>

<style>
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

	.action-buttons {
		position: absolute;
		bottom: 1rem;
		right: 1rem;
		display: flex;
		gap: 0.4rem;
	}
</style>
