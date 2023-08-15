<script lang="ts">
	import { onMount } from 'svelte';
	import ChatBox from '../../../../Components/Organisms/ChatBox.svelte';
	import AvatarThumbnail from '../../../../Components/Atom/AvatarThumbnail.svelte';
	import type { PageData } from './$types';
	import { Message } from '$lib/frontend/Classes/Message';
	import axios from 'axios';
	import { VoiceRecognition } from '$lib/frontend/Classes/VoiceRecognition';
	import { UserStore, AISpeaks } from '$lib/store';
	import { escapeHTML } from '$lib/math/escapeHTML';
	import { sendQuestionToAI } from '$lib/frontend/sendQuestionToAI';
	import { aiSpeaksOut } from '$lib/frontend/aiSpeaksOut';
	import { Mentor } from '$lib/frontend/Classes/Mentor';
	import { DateTime } from 'luxon';
	import { _ } from '$lib/i18n';
	export let data: PageData;
	const mentor = new Mentor(data.mentor);
	const sendChatMessage = async (message: Message) => {
		console.log('sending message', message);
		await message.createSendOutAndPush();
		return message;
	};
	let recognition: VoiceRecognition;
	let waitingForAIAnswer = false;
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
				body: escapeHTML(recognition.body),
				user: $UserStore.id,
				pinned: false
			});
			await newMessage.createSendOutAndPush();
			send(newMessage);

			//			aiSpeaksOut(aiMessage.body);
		}
	};
	let mentorReady = false;
	onMount(async () => {
		await mentor.init();
		console.log({ mentor });
		mentorReady = true;
		const newMessage = new Message({
			body: escapeHTML(_('Hello.')),
			user: $UserStore.id,
			pinned: false
		});
		send(newMessage);
	});
	const send = async (newMessage: Message) => {
		waitingForAIAnswer = true;
		const aiMessage = await sendQuestionToAI({
			type: 'user',
			mentor: mentor,
			roomId: undefined,
			userId: $UserStore.id,
			newMessage,
			channelId: $UserStore.id + DateTime.now().toISODate()
		});
		waitingForAIAnswer = false;
		await aiMessage.createSendOutAndPush();
		if (!$AISpeaks) return;
		mentor.speak(aiMessage.body);
	};
</script>

{#if mentorReady}
	<div class="container" style="position:relative;height:calc(100svh - 3rem)">
		<div aria-busy={waitingForAIAnswer}>
			<AvatarThumbnail url={mentor.userData?.avatarURL || ''} />
			{mentor.userData?.nickname}
		</div>
		<div style="position:absolute;bottom:0px;width:calc(100% - 2rem)">
			<ChatBox
				forceMentor={mentor}
				forceNoPin
				{micActive}
				{sendChatMessage}
				bind:waitingForAIAnswer
				{onMicClicked}
			/>
		</div>
	</div>
{/if}
