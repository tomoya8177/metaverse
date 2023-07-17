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
	import type { Message } from '$lib/frontend/Classes/Message';
	import { videoChat } from '$lib/frontend/Classes/VideoChat';
	import { Users } from '$lib/frontend/Classes/Users';
	import type { Me } from '$lib/frontend/Classes/Me';
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
		});
	});
	onDestroy(() => {
		document.removeEventListener('keydown', onKeyDown);
		videoChat.dontListenTo('textMessage');
	});

	let textChatOpen = false;

	export let me: Me | null = null;
	let micActive = false;
</script>

<div class="action-buttons">
	<ActionButtons bind:textChatOpen bind:micActive {me} />
</div>
<div style:display={textChatOpen ? 'block' : 'none'}>
	<ChatBox bind:messages bind:authors bind:micActive {virtuaMentorReady} />
</div>

<div style:display={!$UserStore.onVideoMute && !textChatOpen ? 'block' : 'none'}>
	<div id="myCameraPreview" />
</div>

<style>
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
