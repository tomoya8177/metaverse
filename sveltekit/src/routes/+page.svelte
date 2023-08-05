<script lang="ts">
	import { _ } from '$lib/i18n';
	import { page } from '$app/stores';
	import { UserStore } from '$lib/store';
	import { onMount } from 'svelte';
	import Icon from '../Components/Atom/Icon.svelte';
	import NippleControl from '../Components/Atom/NippleControl.svelte';
	import Navigation from '../Components/Organisms/Navigation.svelte';
	import UnderConstruction from '../Components/Templates/UnderConstruction.svelte';
	import axios from 'axios';
	import AvatarThumbnail from '../Components/Atom/AvatarThumbnail.svelte';
	import { fade } from 'svelte/transition';
	import { User } from '$lib/frontend/Classes/User';
	import { cookies } from '$lib/frontend/cookies';
	import { actionHistory } from '$lib/frontend/Classes/ActionHistory';
	import InputWithLabel from '../Components/Molecules/InputWithLabel.svelte';
	import SendMessageButton from '../Components/Atom/SendMessageButton.svelte';
	import { Message } from '$lib/frontend/Classes/Message';
	import { DateTime } from 'luxon';
	import TextChatMessage from '../Components/Molecules/TextChatMessage.svelte';
	import { PUBLIC_LOCALHOST } from '$env/static/public';
	import { Mentor } from '$lib/frontend/Classes/Mentor';
	export let mentor: Mentor | null = null; // can be fed by system when testing
	let firstPrompt: {
		role: string;
		content: string;
	};
	let messages: Message[] = [];
	onMount(async () => {
		busy = true;
		//when shift+return is pressed, send the message
		window.addEventListener('keydown', (e) => {
			if (e.key == 'Enter' && e.shiftKey) {
				onMessageSendClicked();
			}
		});
		const mentors = await axios
			.get(PUBLIC_LOCALHOST + '/api/mentors?organization=086694b4-bdb4-4f34-b036-b39598132085')
			.then((res) => res.data);

		//get random one
		mentor = new Mentor(mentors[Math.floor(Math.random() * mentors.length)]);
		if (!mentor) return;
		await mentor.init();
		firstPrompt = {
			role: 'system',
			content: `Below is a friendly conversation between a user and an assistant named ${
				mentor.userData?.fullName || mentor.userData?.nickname
			}. Assistant will initiate the conversation by greeting the user, starting with saying Hello, and mention assistant's name that is ${
				mentor.userData?.nickname
			}. Assistant works for a company Global New Venture as an AI mentor on the project called VirtuaCampus.
			After getting the hi back from the user, assistant should ask if user wants to do either of the three actions.
			1) Create New Organization by clicking the blue button,
			2) Enter Sample Room by clicking the green button.
			3) Keep the conversation with assistant to know more about this website, VirtuaCampus.
			When choosing 1), user can create his/her own virtual school with AI mentor and AI image generator.
			When choosing 2), he/she can try walking through a metaverse world, and try different things inside.
			Don't overwhelm the user with a long answer, and just answer question only it is asked. Try to keep one message in less than 50 words.
			If the conversation includes more than 10 messages, only the recent top 10 messages will be displayed below. So if there are 10 messages and there's no greeting, concider that the greeting is already done.
			If the conversation includes more then 5 messages, the user hasn't decided what to do. You can recommend that if user is familiar with metaverse world, ht/she can go to 1), and if not, he/she can go to 2).
			Make sure to answer in the user's prefered language based on their locale setting. User's prefered language locale is ${cookies.get(
				'locale'
			)}.`
		};
		const response = await axios.post(PUBLIC_LOCALHOST + '/mentor', {
			messages: [firstPrompt]
		});
		busy = false;
		console.log({ response });
		messages = [
			new Message({
				user: mentor?.userData?.id,
				body: response.data.response.content,
				createdAt: DateTime.now().toISO()
			})
		];
	});
	let newMessageBody: string = '';
	const onMessageSendClicked = async () => {
		if (newMessageBody.trim() === '') return;
		busy = true;
		messages = [
			...messages,
			new Message({
				user: $UserStore.id,
				body: newMessageBody,
				createdAt: DateTime.now().toISO()
			})
		];
		newMessageBody = '';
		const messagesToAI = [
			...messages
				//get top 10 messages
				.slice(-10)
				.map((message) => {
					return {
						role: message.user == mentor?.user ? 'assistant' : 'user',
						content: message.body
					};
				})
		];
		if (firstPrompt) {
			messagesToAI.unshift(firstPrompt);
		}
		console.log({ messagesToAI });
		const response = await axios.post(PUBLIC_LOCALHOST + '/mentor', {
			messages: messagesToAI
		});
		busy = false;
		messages = [
			...messages,
			new Message({
				user: mentor?.userData?.id,
				body: response.data.response.content,
				createdAt: DateTime.now().toISO()
			})
		];
	};
	let busy = false;
</script>

<Navigation />
<div class="container">
	<section style="text-align:left">
		{#if mentor}
			{#if mentor.userData}
				<div transition:fade>
					<AvatarThumbnail size="4rem" url={mentor.userData.avatarURL} />
					<p>
						{mentor.userData.nickname}
						<br />
						{_('AI Mentor')}
					</p>
				</div>
			{/if}
		{/if}
		{#each messages as message, i}
			<div data-testid={'message' + i} style="display:none">Message</div>
			<TextChatMessage withPinWithTrash={false} {message} onDelete={() => {}} />
		{/each}
	</section>
	<section style="text-align:center">
		{#if busy}
			<span aria-busy="true">{_('AI is generating the content...')}</span>
		{/if}
	</section>
	<section>
		<div style="display:flex;gap:0.4rem">
			<div style="flex:1;text-align:left">
				<InputWithLabel label={_('Message')} bind:value={newMessageBody} />
			</div>
			<div style="padding-top:1rem">
				<SendMessageButton {onMessageSendClicked} bind:busy />
			</div>
		</div>
		<div style="text-align:center">
			<div style="display:inline-block;">
				<a
					role="button"
					href={'/create-organization'}
					style="margin-right:0.3rem;margin-bottom:0.6rem"
				>
					<Icon icon="apartment" />

					{_('Create New Organization')}
				</a>

				<a
					role="button"
					href={cookies.get('locale') == 'ja' ? `/gnv/japan` : `/gnv/firsttest`}
					class="green-button"
					style="margin-left:0.3rem"
				>
					<Icon icon="login" />

					{_('Enter Sample Room')}
				</a>
			</div>
		</div>
	</section>
</div>

<style>
	.container {
		position: relative;
	}
	section {
		text-align: center;
	}
	.green-button {
		background-color: rgb(32, 178, 170);
		color: white;
		border-color: lightseagreen;
	}
	.green-button:hover {
		background-color: rgb(40, 188, 180);
		color: white;
		border-color: darkseagreen;
	}
</style>
