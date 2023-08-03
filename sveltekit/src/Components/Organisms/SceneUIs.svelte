<script lang="ts">
	import ActionButtons from './ActionButtons.svelte';
	import ChatBox from './ChatBox.svelte';

	import { onDestroy, onMount } from 'svelte';
	import {
		PreviewPanelOpen,
		RoomStore,
		UserStore,
		ItemsInPreview,
		FocusObjectStore
	} from '$lib/store';
	import axios from 'axios';

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
	import NippleControl from '../Atom/NippleControl.svelte';
	import { EmptyObject } from '$lib/preset/EmptyObject';
	import { myAlert, toast } from '$lib/frontend/toast';
	import { actionHistory } from '$lib/frontend/Classes/ActionHistory';
	import InputWithLabel from '../Molecules/InputWithLabel.svelte';
	import { getPositionFromLockedPosition } from '$lib/frontend/getPositionFromLockedPosition';
	import ObjectLockSelect from '../Molecules/ObjectLockSelect.svelte';
	import ModalCloseButton from '../Atom/ModalCloseButton.svelte';
	const scrolToBottom = (element: Element) => {
		element.scrollTop = element.scrollHeight;
	};
	let virtuaMentorReady = false;
	let messages: Message[] = [];
	let authors: User[] = [];
	const loadMessages = async (existings: Message[] = []) => {
		messages = [
			...(await axios
				.get('/api/messages?room=' + $RoomStore.id + '&pinned=1')
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
		if ($RoomStore.mentor) {
			axios
				.put('/mentor/' + $RoomStore.mentor, {
					roomId: $RoomStore.id,
					refresh: false
				})
				.then(async (res) => {
					console.log({ res });
					//this is okay to be delaied
					virtuaMentorReady = true;
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
				if (!aiSpeaks) return;
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
					myAlert(_('Microphone access denied by the user.'));
					// Perform any necessary actions when access is denied
				} else {
					myAlert(event.error);
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
				room: $RoomStore.id,
				pinned: newMessagePinned
			});

			await sendChatMessage(newMessage);
			waitingForAIAnswer = true;
			const aiMessage = await sendQuestionToAI(
				$RoomStore.mentor,
				$RoomStore.id || 'none',
				newMessage
			);
			waitingForAIAnswer = false;
			const createdMessage = { ...(await sendChatMessage(aiMessage)), isTalking: true };
			const mentor = await axios.get('/api/mentors/' + $RoomStore.mentor).then((res) => res.data);
			console.log({ mentor });
			if (!aiSpeaks) {
				return;
			}
			aiSpeaksOut(createdMessage.body, Users.find(mentor.user) || null);
		}
	};
	let aiSpeaks = true;
	let waitingForAIAnswer = false;
	let newMessagePinned = false;
	let newMessageBody = '';

	const sendChatMessage = async (message: Message) => {
		actionHistory.send('sendChatMessage', message);
		const createdMessage = await axios.post('/api/messages', message).then((res) => res.data);
		console.log({ createdMessage });
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
	let filteredItemsInPreview: SharedObject[] = [];
	let objectEditorOpen = false;
	const onDeleteClicked = async () => {
		if ($FocusObjectStore.title == 'Shared Screen') {
			//check if the screen belong to myself. otherwise you can't relete it.
			if (!$UserStore.onScreenShare) return alert('You are not sharing your screen.');
			videoChat.unpublishMyTrack('screen');
			const me = Users.find($UserStore.id);
			if (!me) return console.error('me is null');
			me?.hideScreen();
			$UserStore.onScreenShare = false;
			return;
		}

		const file = sharedObjects.get($FocusObjectStore.id);
		console.log({ file });
		await axios.delete('/api/objects/' + file.id);
		// uploader.client.remove(file.handle, {
		// 	policy: PUBLIC_FileStackPolicy,
		// 	signature: PUBLIC_FileStackSignature
		// });
		file.remove();
		videoChat.sendMessage({
			key: 'objectDelete',
			id: $FocusObjectStore.id
		});
		FocusObjectStore.set(EmptyObject);
		toast(_('Deleted'));
	};
</script>

{#if $FocusObjectStore.id && $FocusObjectStore.id != ''}
	<nav class="objectEditorNav">
		<ul />
		<ul
			style="
	border:solid 1px #1e88e5;
	border-radius:0.6rem;
	height:3rem;
	background-color:rgba(0,0,0,0.3)
	max-width:100vw
	"
		>
			<ObjectEditor bind:modalOpen={$FocusObjectStore.editorOpen} />
			{#if $FocusObjectStore.user == $UserStore.id || $UserStore.isManager}
				<li>
					<button
						data-tooltip={$FocusObjectStore.locked ? _('Unock') : _('Lock')}
						class:outline={$FocusObjectStore.locked}
						class="circle-button"
						small
						on:click={() => {
							$FocusObjectStore.locked = !$FocusObjectStore.locked;
							if ($FocusObjectStore.locked) FocusObjectStore.set(EmptyObject);
						}}
					>
						<Icon icon={$FocusObjectStore.locked ? 'lock' : 'lock_open'} />
					</button>
				</li>
			{/if}
			<li>
				<button
					data-tooltip={_('Add To Preview Pane')}
					class="circle-button"
					small
					on:click={() => {
						if ($FocusObjectStore.type == 'screen') {
							PreviewPanelOpen.set(true);
							return;
						}
						$FocusObjectStore.inPreviewPane = true;
						ItemsInPreview.update((itemsInPreview) => {
							return [...itemsInPreview, $FocusObjectStore];
						});
						//
						PreviewPanelOpen.set(true);
						FocusObjectStore.set(EmptyObject);
					}}
				>
					<Icon icon="magnify_fullscreen" />
				</button>
			</li>
		</ul>
		<ul />
	</nav>
	{#if $FocusObjectStore.editorOpen}
		<dialog open style="position:absolute">
			<article>
				<ModalCloseButton
					onClick={() => {
						$FocusObjectStore.editorOpen = false;
					}}
				/>
				{#if $FocusObjectStore.type.includes('video')}
					<div style="display:flex;gap:0.4rem">
						{#if !$FocusObjectStore.playing}
							<div>
								<button
									small
									class="circle-button"
									on:click={() => {
										const video = document.getElementById(`${$FocusObjectStore.id}asset`);
										video?.play();
										$FocusObjectStore.playing = true;
									}}
								>
									<Icon icon="play_arrow" />
								</button>
							</div>
						{:else}
							<div>
								<button
									small
									class="circle-button"
									on:click={() => {
										const video = document.getElementById(`${$FocusObjectStore.id}asset`);
										video?.pause();
										$FocusObjectStore.playing = false;
									}}
								>
									<Icon icon="pause" />
								</button>
							</div>
						{/if}
						<div>
							<button
								small
								class="circle-button"
								on:click={() => {
									const video = document.getElementById(`${$FocusObjectStore.id}asset`);
									if (!video) return console.error('video is null');
									video.currentTime = 0;
								}}
							>
								<Icon icon="replay" />
							</button>
						</div>
						<div>
							<!-- mute button-->
							<button
								small
								class="circle-button"
								on:click={() => {
									const video = document.getElementById(`${$FocusObjectStore.id}asset`);
									if (!video) return console.error('video is null');
									video.muted = !video.muted;
									$FocusObjectStore.muted = video.muted;
								}}
							>
								{#if $FocusObjectStore.muted}
									<Icon icon="volume_off" />
								{:else}
									<Icon icon="volume_up" />
								{/if}
							</button>
						</div>
					</div>
				{/if}
				<div>
					{#if $FocusObjectStore.lockedPosition}
						{_('Object is in locked position.')}
					{:else}
						{_('Lock object to a fixed position.')}
					{/if}
					<ObjectLockSelect
						bind:object={$FocusObjectStore}
						readonly={$FocusObjectStore.locked}
						onUpdate={(value) => {
							$FocusObjectStore.lockedPosition = value;
							const position = getPositionFromLockedPosition(value);
							console.log({ position });
							//animate to the position
							$FocusObjectStore.el?.setAttribute('animation', {
								property: 'position',
								to: `${position.x} ${position.y} ${position.z}`,
								dur: 1000
							});
						}}
					/>
				</div>

				{#if $FocusObjectStore.title != 'Shared Screen'}
					<div>
						<InputWithLabel
							label={_('Title')}
							bind:value={$FocusObjectStore.title}
							readonly={$FocusObjectStore.locked}
						/>
					</div>
					<div style="position:relative">
						<InputWithLabel
							label={_('Link To')}
							bind:value={$FocusObjectStore.linkTo}
							readonly={$FocusObjectStore.locked}
							copiable={!!$FocusObjectStore.linkTo}
						/>
					</div>
					{#if $FocusObjectStore.linkTo}
						<div>
							<a href={$FocusObjectStore.linkTo} target="_blank">
								<Icon icon="link" />
								{_('Go To Link')}
							</a>
						</div>
					{/if}
					{#if !$FocusObjectStore.locked}
						{#if $FocusObjectStore.type.includes('image') || $FocusObjectStore.type.includes('video')}
							<div>
								{#if !$FocusObjectStore.isSphere}
									<button
										on:click={async () => {
											const updatedImage = await axios.put('/api/objects/' + $FocusObjectStore.id, {
												isSphere: true
											});
											$FocusObjectStore.isSphere = true;
											$FocusObjectStore.updateEntityGeometryAndMaterial();
											videoChat.sendMessage({
												key: 'objectUpdate',
												id: $FocusObjectStore.id,
												isSphere: true
											});
										}}>{_('Convert To 360 Sphere')}</button
									>
								{:else}
									<button
										on:click={async () => {
											const updatedImage = await axios.put('/api/objects/' + $FocusObjectStore.id, {
												isSphere: false
											});
											$FocusObjectStore.isSphere = false;
											$FocusObjectStore.updateEntityGeometryAndMaterial();
											videoChat.sendMessage({
												key: 'objectUpdate',
												id: $FocusObjectStore.id,
												isSphere: false
											});
										}}>{_('Convert To Flat Image')}</button
									>
								{/if}
							</div>
						{/if}
						<div>
							<button
								on:click={async () => {
									await axios.put('/api/objects/' + $FocusObjectStore.id, {
										title: $FocusObjectStore.title,
										linkTo: $FocusObjectStore.linkTo
									});
									toast(_(`Updated`));
									videoChat.sendMessage({
										key: 'objectUpdate',
										id: $FocusObjectStore.id,
										title: $FocusObjectStore.title,
										linkTo: $FocusObjectStore.linkTo
									});
								}}>{_('Update')}</button
							>
						</div>
					{/if}
				{/if}

				{#if !$FocusObjectStore.locked}
					<div>
						<button on:click={onDeleteClicked} class="secondary">{_('Delete')}</button>
					</div>
				{/if}
			</article>
		</dialog>
	{/if}
{/if}
<div class="filePreviewContainer" class:hidden={!$PreviewPanelOpen}>
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
		{#each $ItemsInPreview.filter((item) => item.shortType == 'screen') as object}
			<li class="previewPaneItem" id={object.id + '_preview'}>
				<div class="content" />
			</li>
		{/each}
		{#each $ItemsInPreview.filter((item) => item.shortType != 'screen') as object}
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
									console.log({ items });
									return items.filter((item) => item.inPreviewPane);
								});
							}}
						>
							<Icon icon="close" />
						</a>
					</div>
				{/if}
				<div class="content">
					{#if object.shortType == 'image'}
						<img src={object.url} alt={object.title} />
					{:else if object.shortType == 'video'}
						<video src={object.url} controls muted />
					{:else if object.shortType == 'screen'}
						<!--none-->
					{/if}
				</div>
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
			bind:aiSpeaks
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
	.hidden {
		display: none;
	}
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
		height: calc(100svh - 11rem);
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
		max-width: calc(100vw - 1rem);
		position: absolute;
		bottom: 0rem;
		right: 0.5rem;
		display: flex;
		gap: 0.4rem;
	}

	.chat-box {
		max-height: calc(100svh - 6rem);
		max-width: 100vw;
		width: 26rem;
		position: absolute;
		padding: 0.4rem;
		border-radius: 0.4rem;
		bottom: 5rem;
		right: 0;
		/* color: white; */
		background-color: rgba(255, 255, 255, 0.7);
		display: grid;
	}
	/* background color based on browder dark setting */
	@media (prefers-color-scheme: dark) {
		.chat-box {
			background-color: rgba(0, 0, 0, 0.7);
			/* color: black; */
		}
	}
</style>
