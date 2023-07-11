<script lang="ts">
	import TextChatMessage from '../Molecules/TextChatMessage.svelte';

	import 'aframe';
	import 'aframe-environment-component';
	import 'aframe-extras';
	import { onDestroy, onMount } from 'svelte';
	import { EventStore, FocusObjectStore, UserStore } from '$lib/store';
	import axios from 'axios';

	import '$lib/AframeComponents';
	import { videoChat } from '$lib/Classes/VideoChat';
	import type { Message } from '$lib/Classes/Message';
	import InputWithLabel from '../Molecules/InputWithLabel.svelte';
	import Icon from '../Atom/Icon.svelte';
	import { escapeHTML } from '$lib/escapeHTML';
	import { Users } from '$lib/Classes/Users';
	import type { User } from '$lib/types/User';
	import { editableObject } from '$lib/Classes/EditableObject';
	import type { Me } from '$lib/Classes/Me';
	let messages: Message[] = [];
	let newMessagePinned = false;
	let newMessageBody = '';
	let authors: User[] = [];
	const scrolToBottom = (element: Element) => {
		element.scrollTop = element.scrollHeight;
	};

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
	const onKeyDown = (e: KeyboardEvent) => {
		if (document.activeElement?.tagName === 'TEXTAREA' && e.key === 'Enter' && e.shiftKey) {
			onMessageSendClicked();
			return;
		}
	};
	onMount(async () => {
		loadMessages();
		//onKeyDown
		document.addEventListener('keydown', onKeyDown);
		videoChat.listenTo('textMessage', (data) => {
			console.log('received textMessage', data);
			messages = [...messages, data];
			if (data.user !== $UserStore.id) {
				const unit = Users.find(data.user);
				if (!unit) return;
				unit.say(data.body);
			}
		});
	});
	onDestroy(() => {
		document.removeEventListener('keydown', onKeyDown);
		videoChat.dontListenTo('textMessage');
	});

	const onMessageSendClicked = async () => {
		if (newMessageBody.trim() === '') return;
		const newMessage = {
			body: escapeHTML(newMessageBody),
			user: $UserStore.id,
			event: $EventStore.id,
			pinned: newMessagePinned
		};
		const createdMessage = await axios.post('/api/messages', newMessage).then((res) => res.data);
		messages = [...messages, createdMessage];
		videoChat.sendMessage({ ...createdMessage, key: 'textMessage' });
		newMessageBody = '';
		setTimeout(() => {
			const element = document.querySelector('.chat-box > div');
			if (!element) return;
			scrolToBottom(element);
		}, 100);
	};
</script>

<div class="chat-box">
	<div style="overflow-y:auto;max-height:calc(100vh - 23rem)">
		{#each messages.sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1)) as message}
			<TextChatMessage
				{message}
				author={authors.find((a) => a.id === message.user) || null}
				onDelete={(messageId) => {
					messages = messages.filter((m) => m.id !== messageId);
				}}
			/>
		{/each}
	</div>
	<hr />
	<div style="text-align:right">
		<InputWithLabel label="Pinned" type="switch" bind:value={newMessagePinned} />
	</div>
	<div style="display:flex;gap:0.4rem">
		<div style="flex:1" id="chat-textarea">
			<InputWithLabel label="" type="textarea" bind:value={newMessageBody} />
		</div>
		<div>
			<button
				data-tooltip="Shift + Enter"
				style="margin-bottom:0rem"
				on:click={onMessageSendClicked}>Send</button
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
