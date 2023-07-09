<script lang="ts">
	import TextChatMessage from '../Molecules/TextChatMessage.svelte';

	import 'aframe';
	import 'aframe-environment-component';
	import 'aframe-extras';
	import { io } from '$lib/realtime';
	import { onMount } from 'svelte';
	import { EventStore, UserStore } from '$lib/store';
	import axios from 'axios';

	import '$lib/AframeComponents';
	import { VideoChat } from '$lib/Classes/VideoChat';
	import { Message } from '$lib/Classes/Message';
	import InputWithLabel from '../Molecules/InputWithLabel.svelte';
	import Icon from '../Atom/Icon.svelte';
	import { escapeHTML } from '$lib/escapeHTML';
	import { Users } from '$lib/Classes/Users';
	let messages: Message[] = [];
	let newMessagePinned = false;
	let newMessageBody = '';
	let videoChat: VideoChat;
	const scrolToBobbom = (element) => {
		element.scrollTop = element.scrollHeight;
	};
	onMount(async () => {
		//me.twilioConnect($EventStore.id);
		//me.cometChat($EventStore, $UserStore.nickname);
		videoChat = new VideoChat($EventStore, $UserStore.id);
		if ($EventStore.allowAudio) {
			try {
				await videoChat.connect($EventStore.allowVideo);
				$UserStore.onMute = false;
			} catch (e) {
				console.log(e);
				$UserStore.onMute = true;
				alert(
					`You don't have a microphone connected. Please connect a microphone and refresh the page to join the audio chat.`
				);
			}
		}
		messages = await axios
			.get('/api/messages?event=' + $EventStore.id + '&pinned=1')
			.then((res) => res.data);
	});
	io.on('textMessage', (message: Message) => {
		console.log('newMessage', message);
		const newMessage = new Message(message);
		messages = [...messages, message];
		if (message.user !== $UserStore.id) {
			Users.find(message.user)?.say(message.body);
		}
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
		io.emit('textMessage', createdMessage);
		newMessageBody = '';
		setTimeout(() => {
			const element = document.querySelector('.chat-box > div');
			scrolToBobbom(element);
		}, 100);
	};
	let textChatOpen = false;
</script>

<div class="action-buttons">
	<button
		class="circle-button"
		on:click={() => {
			textChatOpen = !textChatOpen;
			if (!textChatOpen) return;
			setTimeout(() => {
				const element = document.querySelector('.chat-box > div');
				scrolToBobbom(element);
			}, 100);
		}}
	>
		<Icon icon="chat" />
	</button>
	{#if $EventStore.allowAudio}
		{#if $UserStore.onMute}
			<button
				class="circle-button dim"
				on:click={() => {
					try {
						videoChat.unmuteMyAudio();
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
					videoChat.muteMyAudio();
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
					videoChat.muteMyVideo('camera');

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
					videoChat.muteMyVideo('screen');
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
			<InputWithLabel type="textarea" bind:value={newMessageBody} />
			<button style="margin-bottom:0rem" on:click={onMessageSendClicked}>Send</button>
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
	.top-right {
		position: absolute;
		top: 0;
		right: 0;
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
	#media-container {
		position: absolute;
		top: 0;
		left: 0;
		width: 400px;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.5);
		color: white;
	}
</style>
