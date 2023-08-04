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
	export let data: PageData;
	const mentor = data.mentor;
	let authors: User[] = [];
	let messages: Message[] = [];
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
			waitingForAIAnswer = true;
			const aiMessage = await sendQuestionToAI(mentor, 'none', newMessage);
			waitingForAIAnswer = false;
			await aiMessage.createSendOutAndPush();
			if (!$AISpeaks) return;
			aiSpeaksOut(aiMessage.body);
		}
	};
	onMount(async () => {
		const res = await axios.put('/mentor/' + mentor.id, {
			roomId: 'none'
		});
		console.log({ mentorinitialized: res.data });
	});
</script>

<div class="container" style="position:relative;height:calc(100svh - 3rem)">
	<div aria-busy={waitingForAIAnswer}>
		<AvatarThumbnail url={mentor.userData.avatarURL} />
		{mentor.userData.nickname}
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
