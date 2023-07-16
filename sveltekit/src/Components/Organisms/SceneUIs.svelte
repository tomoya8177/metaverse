<script lang="ts">
	import ActionButtons from './ActionButtons.svelte';
	import ChatBox from './ChatBox.svelte';

	import TextChatMessage from '../Molecules/TextChatMessage.svelte';

	import 'aframe';
	import 'aframe-environment-component';
	import 'aframe-extras';
	import { onDestroy, onMount } from 'svelte';
	import { EventStore, FocusObjectStore, UserStore } from '$lib/store';
	import axios from 'axios';

	import '$lib/AframeComponents';
	import InputWithLabel from '../Molecules/InputWithLabel.svelte';
	import Icon from '../Atom/Icon.svelte';
	import type { User } from '$lib/types/User';
	import { scrollToBottom } from '$lib/frontend/scrollToBottom';
	import type { Message } from '$lib/frontend/Classes/Message';
	import { videoChat } from '$lib/frontend/Classes/VideoChat';
	import { Users } from '$lib/frontend/Classes/Users';
	import { editableObject } from '$lib/frontend/Classes/EditableObject';
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
		console.log({ messages });
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
		console.log({ element });
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
				console.log(res);
			}
		}); //ping to wake up the server
		console.log('listening to incoming message');
		console.log({ videoChat });
		videoChat.listenTo('textMessage', async (data) => {
			console.log('received textMessage', data);
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

	let rotation = 0;
	export let me: Me | null = null;
	let micActive = false;
</script>

<div class="action-buttons">
	<ActionButtons bind:textChatOpen bind:micActive {me} />
</div>
{#if textChatOpen}
	<ChatBox bind:messages bind:authors bind:micActive {virtuaMentorReady} />
{/if}

<div style:display={!$UserStore.onVideoMute && !textChatOpen ? 'block' : 'none'}>
	<div id="myCameraPreview" />
</div>

<style>
	.transform-buttons {
		position: absolute;
		top: 1rem;
		display: flex;
		gap: 0.4rem;
	}
	.action-buttons {
		position: absolute;
		bottom: 1rem;
		right: 1rem;
		display: flex;
		gap: 0.4rem;
	}

	.editingPane {
		padding: 0.4rem;
		border-radius: 0.4rem;
		position: absolute;
		background: rgba(0, 0, 0, 0.5);
		z-index: 100;
	}
</style>
