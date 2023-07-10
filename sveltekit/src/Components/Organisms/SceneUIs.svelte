<script lang="ts">
	import TextChatMessage from '../Molecules/TextChatMessage.svelte';

	import 'aframe';
	import 'aframe-environment-component';
	import 'aframe-extras';
	import { onDestroy, onMount } from 'svelte';
	import { EventStore, UserStore } from '$lib/store';
	import axios from 'axios';

	import '$lib/AframeComponents';
	import { videoChat } from '$lib/Classes/VideoChat';
	import type { Message } from '$lib/Classes/Message';
	import InputWithLabel from '../Molecules/InputWithLabel.svelte';
	import Icon from '../Atom/Icon.svelte';
	import { escapeHTML } from '$lib/escapeHTML';
	import { Users } from '$lib/Classes/Users';
	import type { User } from '$lib/types/User';
	let messages: Message[] = [];
	let newMessagePinned = false;
	let newMessageBody = '';
	let authors: User[] = [];
	const scrolToBottom = (element: Element) => {
		element.scrollTop = element.scrollHeight;
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
	onMount(async () => {
		messages = await axios
			.get('/api/messages?event=' + $EventStore.id + '&pinned=1')
			.then((res) => res.data);
		authors = await axios
			.get('/api/users?ids=in:' + messages.map((m) => m.user).join(','))
			.then((res) => res.data);
		//onKeyDown
		document.onkeydown = (e) => {
			//check if any input has the focus

			//shift + enter will send message
			if (document.activeElement?.tagName === 'TEXTAREA' && e.key === 'Enter' && e.shiftKey) {
				onMessageSendClicked();
				return;
			}

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
		videoChat.listenTo('textMessage', (data) => {
			console.log('received textMessage', data);
			messages = [...messages, data];
			if (data.user !== $UserStore.id) {
				Users.find(data.user)?.say(data.body);
			}
		});
	});
	onDestroy(() => {
		document.onkeydown = null;
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
	let textChatOpen = false;
	$: {
		if (textChatOpen) {
			//focus on the textarea
			setTimeout(() => {
				const element = document.getElementById('chat-textarea')?.querySelector('textarea');
				if (!element) {
					console.log('not found');
					return;
				}
				console.log('found');
				element.focus();
			}, 100);
		}
	}
</script>

<div class="action-buttons">
	<button data-tooltip="T" class="circle-button" on:click={onTextChatClicked}>
		<Icon icon="chat" />
	</button>
	{#if $EventStore.allowAudio}
		{#if $UserStore.onMute}
			<button
				class="circle-button dim"
				on:click={async () => {
					try {
						await videoChat.startMyAudio();
						$UserStore.onMute = false;
					} catch (e) {
						console.log(e);
						alert(`Couldn't get access to the microphone`);
					}
				}}
			>
				<Icon icon="mic_off" />
			</button>
		{:else}
			<button
				class="circle-button"
				on:click={() => {
					videoChat.unpublishMyTrack('audio');
					$UserStore.onMute = true;
				}}
			>
				<Icon icon="mic" />
			</button>
		{/if}
	{/if}
	{#if $EventStore.allowVideo}
		{#if $UserStore.onVideoMute}
			<button
				class="circle-button dim"
				on:click={async () => {
					try {
						if (await videoChat.startMyVideo()) {
							$UserStore.onVideoMute = false;
						}
					} catch (e) {
						console.log(e);
						alert(`Couldn't get access to the Camera`);
					}
				}}
			>
				<Icon icon="videocam_off" />
			</button>
		{:else}
			<button
				class="circle-button"
				on:click={() => {
					videoChat.unpublishMyTrack('camera');

					document.getElementById('myCameraPreview')?.children[0].remove();
					$UserStore.onVideoMute = true;
				}}
			>
				<Icon icon="videocam" />
			</button>
		{/if}
		{#if $UserStore.onScreenShare}
			<button
				class="circle-button"
				on:click={() => {
					videoChat.unpublishMyTrack('screen');
					document.getElementById('myScreenPreview')?.children[0].remove();
					$UserStore.onScreenShare = false;
				}}
			>
				<Icon icon="screen_share" />
			</button>
		{:else}
			<button
				class="circle-button dim"
				on:click={async () => {
					try {
						if (await videoChat.startShareScreen()) {
							$UserStore.onScreenShare = true;
						}
					} catch (e) {
						console.log(e);
						alert(`Couldn't get access to the Screen`);
					}
				}}
			>
				<Icon icon="stop_screen_share" />
			</button>
		{/if}
	{/if}
</div>
{#if textChatOpen}
	<div class="chat-box">
		{#if textChatOpen}
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
		{/if}
	</div>
{/if}
<div class="videoPreview">
	<div style:display={!$UserStore.onVideoMute && !textChatOpen ? 'block' : 'none'}>
		<div id="myCameraPreview" />
	</div>
	<div style:display={$UserStore.onScreenShare && !textChatOpen ? 'block' : 'none'}>
		<div id="myScreenPreview" />
	</div>
</div>

<style>
	.videoPreview {
		position: absolute;
		display: flex;
		gap: 0.8rem;
		bottom: 6rem;
		right: 1rem;
	}
	.videoPreview > div {
		align-self: center;
	}
	#myScreenPreview {
		box-shadow: 0 0 1rem rgba(0, 0, 0, 0.5);
		width: 8rem;
		border-radius: 1rem;
		overflow: hidden;
		align-self: center;
	}
	#myCameraPreview {
		box-shadow: 0 0 1rem rgba(0, 0, 0, 0.5);
		width: 8rem;
		height: 8rem;
		border-radius: 50%;
		overflow: hidden;
		align-self: center;
	}
	.dim {
		opacity: 0.5;
	}

	.action-buttons {
		position: absolute;
		bottom: 1rem;
		right: 0;
		display: flex;
		gap: 0.4rem;
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
