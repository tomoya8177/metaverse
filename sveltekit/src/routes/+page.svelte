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
	import type { Mentor } from '$lib/types/Mentor';
	import AvatarThumbnail from '../Components/Atom/AvatarThumbnail.svelte';
	import { fade } from 'svelte/transition';
	import { User } from '$lib/frontend/Classes/User';
	import { cookies } from '$lib/frontend/cookies';
	import { actionHistory } from '$lib/frontend/Classes/ActionHistory';
	import SendMessageButton from '../Components/Atom/SendMessageButton.svelte';
	import { Message } from '$lib/frontend/Classes/Message';
	import { DateTime } from 'luxon';
	import TextChatMessage from '../Components/Molecules/TextChatMessage.svelte';
	import { InputWithLabel } from 'mymetaverseportal-ui-component';
	let mentor: Mentor | null = null;
	let intro: string = '';
	let invite: string = '';
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
			.get('/api/mentors?organization=086694b4-bdb4-4f34-b036-b39598132085')
			.then((res) => res.data);
		//get random one
		mentor = mentors[Math.floor(Math.random() * mentors.length)];
		if (!mentor) return;
		mentor.userData = await axios.get('/api/users/' + mentor?.user).then((res) => res.data);
		firstPrompt = {
			role: 'system',
			content: `Below is a friendly conversation between a user and an assistant named ${
				mentor.userData.fullName
			}. Assistant will initiate the conversation by greeting the user, starting with saying Hello, and mention assistant's name that is ${
				mentor.userData.nickname
			}. Assistant works for a company Global New Ventures as an AI mentor on the project called VirtuaCampus.
			After getting the hi back from the user, assistant should ask if user wants to do either of the three actions.
			1) Create New Organization by clicking the blue button,
			2) Enter Sample Room by clicking the green button.
			3) Keep the conversation with assistant to know more about this website, VirtuaCampus.
			When choosing 1), user can create his/her own virtual school with AI mentor and AI image generator.
			When choosing 2), he/she can try walking through a metaverse world, and try different things inside.
			Don't overwhelm the user with a long answer, and just answer question only it is asked. Try to keep one message in less than 50 words.
			If the conversation includes more than 10 messages, only the recent top 10 messages will be displayed below. So if there are 10 messages and there's no greeting, concider that the greeting is already done.
			Make sure to answer in the user's prefered language based on their locale setting. User's prefered language locale is ${cookies.get(
				'locale'
			)}.`
		};
		const response = await axios.post('/mentor', {
			messages: [firstPrompt]
		});
		busy = false;
		console.log({ response });
		messages = [
			new Message({
				user: mentor.userData.id,
				body: response.data.response.content,
				createdAt: DateTime.now().toISO()
			})
		];
		// const response2 = await axios.post('/mentor', {
		// 	messages: [
		// 		{
		// 			role: 'system',
		// 			content: `Encourage the user to create their own virtual school with AI mentor and AI image generator in less than 100 words. Make sure to answer in the user's prefered language based on their locale setting. User's prefered language locale is ${cookies.get(
		// 				'locale'
		// 			)}.`
		// 		}
		// 	]
		// });
		// console.log({ response2 });
		// invite = response2.data.response.content;
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
		const response = await axios.post('/mentor', {
			messages: [
				firstPrompt,
				...messages
					//get top 10 messages
					.slice(-10)
					.map((message) => {
						return {
							role: message.user == mentor.user ? 'assistant' : 'user',
							content: message.body
						};
					})
			]
		});
		busy = false;
		messages = [
			...messages,
			new Message({
				user: mentor.userData.id,
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
		<ul class="chatMessagesWithAI">
			{#each messages as message}
				<li>
					<TextChatMessage
						withPinWithTrash={false}
						{message}
						onDelete={() => {}}
						author={message.user == $UserStore.id
							? new User({ nickname: $UserStore.fullName || 'User' })
							: mentor.userData}
					/>
				</li>
			{/each}
		</ul>
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
					href={cookies.get('locale') == 'ja' ? `/gnv/japan` : `/gnv/virtual-classroom-pilot`}
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
	ul,
	li {
		list-style: none;
		padding: 0;
	}
</style>
