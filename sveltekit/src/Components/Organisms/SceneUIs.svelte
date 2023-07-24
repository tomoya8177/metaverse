<script lang="ts">
	import ActionButtons from './ActionButtons.svelte';
	import ChatBox from './ChatBox.svelte';

	import 'aframe';
	import 'aframe-environment-component';
	import 'aframe-extras';
	import { onDestroy, onMount } from 'svelte';
	import {
		PreviewPanelOpen,
		EventStore,
		UserStore,
		ItemsInPreview,
		FocusObjectStore
	} from '$lib/store';
	import axios from 'axios';

	import '$lib/AframeComponents';
	import type { User } from '$lib/frontend/Classes/User';
	import { scrollToBottom } from '$lib/frontend/scrollToBottom';
	import { Message } from '$lib/frontend/Classes/Message';
	import { videoChat } from '$lib/frontend/Classes/VideoChat';
	import { Users } from '$lib/frontend/Classes/Users';
	import type { Me } from '$lib/frontend/Classes/Me';
	import { sendQuestionToAI } from '$lib/frontend/sendQuestionToAI';
	import { aiSpeaksOut } from '$lib/frontend/aiSpeaksOut';
	import { escapeHTML } from '$lib/math/escapeHTML';
	import ObjectEditor from './ObjectEditor.svelte';
	import { VoiceRecognition } from '$lib/frontend/Classes/VoiceRecognition';
	import { _ } from '$lib/i18n';
	import Icon from '../Atom/Icon.svelte';
	import { sharedObjects } from '$lib/frontend/Classes/SharedObjects';
	import type { SharedObject } from '$lib/frontend/Classes/SharedObject';
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
		if ($EventStore.mentor) {
			axios.get('/mentor/' + $EventStore.mentor).then(async (res) => {
				//this is okay to be delaied
				virtuaMentorReady = true;
				console.log('chat setup', res);
				if (res.data.chain == null) {
					//put action
					const res = await axios.put('/mentor/' + $EventStore.mentor, {
						eventId: $EventStore.id
					});
				}
			}); //ping to wake up the server
		}
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
			if (data.user === 'Mentor') {
				data.isTalking = true;
				aiSpeaksOut(data.body);
			}
		});
	});
	onDestroy(() => {
		document.removeEventListener('keydown', onKeyDown);
		videoChat.dontListenTo('textMessage');
	});

	let textChatOpen = false;
	let recognition: VoiceRecognition;
	export let me: Me | null = null;
	let micActive = false;
	const onMicClicked = async () => {
		micActive = !micActive;
		if (micActive) {
			//activate my mic and start audio to text
			recognition = new VoiceRecognition((event) => {
				if (event.error === 'not-allowed') {
					alert('Microphone access denied by the user.');
					// Perform any necessary actions when access is denied
				} else {
					console.log('Error', event.error);
					alert(event.error);
					return;
				}
				onMicClicked();
			});
		} else {
			//deactivate my mic and stop audio to text
			recognition.stop();
			if (!recognition.body) return;
			const newMessage = new Message({
				body: escapeHTML(recognition.body) + ' @Mentor',
				user: $UserStore.id,
				event: $EventStore.id,
				pinned: newMessagePinned
			});

			await sendChatMessage(newMessage);
			waitingForAIAnswer = true;
			const aiMessage = await sendQuestionToAI($EventStore.mentor, $EventStore.id, newMessage);
			waitingForAIAnswer = false;
			const createdMessage = { ...(await sendChatMessage(aiMessage)), isTalking: true };
			const mentor = await axios.get('/api/mentors/' + $EventStore.mentor).then((res) => res.data);
			console.log({ mentor });
			aiSpeaksOut(createdMessage.body, Users.find(mentor.user) || null);
		}
	};
	let waitingForAIAnswer = false;
	let newMessagePinned = false;
	let newMessageBody = '';

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

{#if $FocusObjectStore.id}
	<nav class="objectEditorNav">
		<ul />
		<ul
			style="
	border:solid 1px lightgreen;
	border-radius:0.6rem;
	height:3rem;
	background-color:rgba(0,0,0,0.3)
	"
		>
			<ObjectEditor />
			{#if $FocusObjectStore.user == $UserStore.id || $UserStore.isManager}
				<li>
					<button
						class:outline={$FocusObjectStore.locked}
						class="circle-button"
						small
						on:click={() => {
							$FocusObjectStore.locked = !$FocusObjectStore.locked;
						}}
					>
						<Icon icon={$FocusObjectStore.locked ? 'lock' : 'lock_open'} />
					</button>
				</li>
			{/if}
			<li>
				<button
					class="circle-button"
					small
					on:click={() => {
						if ($FocusObjectStore.type == 'screen') {
							PreviewPanelOpen.set(true);
							return;
						}
						sharedObjects.get($FocusObjectStore.id)?.cloneToPreviewPane();
						PreviewPanelOpen.set(true);
					}}
				>
					<Icon icon="magnify_fullscreen" />
				</button>
			</li>
		</ul>
		<ul />
	</nav>
{/if}

<div class="filePreviewContainer" style:display={$PreviewPanelOpen ? 'block' : 'none'}>
	<div style="display:flex">
		<div style="flex:1">
			{_('Preview Panel')}
		</div>
		<div>
			<a
				href={'#'}
				on:click={() => {
					PreviewPanelOpen.set(false);
				}}
			>
				<Icon icon="close" />
			</a>
		</div>
	</div>
	<ul id="filePreview">
		{#each $ItemsInPreview as object}
			<li class="previewPaneItem" id={object.id + '_preview'}>
				{#if object.title}
					<div style="position:absolute; top:0px;right:0px;z-index:2;">
						<a href={object.url} target="_blank">
							{object.title}
							<Icon icon="open_in_new" />
						</a>
						<a
							href={'#'}
							on:click={() => {
								object.inPreviewPane = false;
								ItemsInPreview.update((items) => {
									return items.filter((item) => item.id !== object.id);
								});
							}}
						>
							<Icon icon="close" />
						</a>
					</div>
				{/if}
			</li>
		{/each}
	</ul>
</div>

<div class="object-editor" />

<div class="action-buttons">
	<ActionButtons {waitingForAIAnswer} {onMicClicked} bind:textChatOpen bind:micActive {me} />
</div>
<div style:display={textChatOpen ? 'block' : 'none'}>
	<div class="chat-box">
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
</div>

<div style:display={!$UserStore.onVideoMute && !textChatOpen ? 'block' : 'none'}>
	<div id="myCameraPreview" />
</div>

<style>
	.objectEditorNav {
		position: absolute;
		/* center */
		left: 50%;
		transform: translateX(-50%);
		top: 0.4rem;
		z-index: 2;
	}
	@media (max-width: 1200px) {
		.objectEditorNav {
			position: absolute;
			top: 3rem;
			width: 100vw;
		}
	}
	#filePreview {
		overflow: auto;
		display: flex;
		flex-wrap: nowrap;
		list-style-type: none;
		gap: 0.2rem;
		height: 100%;
		margin-bottom: 0px;
	}
	.previewPaneItem {
		/* min-width: calc(100vw - 6rem); */
		height: calc(100vh - 11rem);
		border-radius: 0.2rem;
		flex: none;
		position: relative;
		list-style: none;
		margin-bottom: 0px;
	}
	.filePreviewContainer {
		position: absolute;
		top: 3rem;
		left: 1rem;
		right: 1rem;
		background-color: black;
		padding: 0.4rem;
		border-radius: 0.4rem;
	}

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

	.chat-box {
		max-height: calc(100vh - 9rem);
		overflow: auto;
		width: 26rem;
		position: absolute;
		padding: 1rem;
		border-radius: 1rem;
		bottom: 6rem;
		right: 0;
		background-color: rgba(0, 0, 0, 0.7);
		color: white;
		display: grid;
	}
</style>
