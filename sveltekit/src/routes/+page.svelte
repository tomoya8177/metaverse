<script lang="ts">
	import { _ } from '$lib/i18n';
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
	let mentor: Mentor | null = null;
	let intro: string = '';
	let invite: string = '';
	onMount(async () => {
		const mentors = await axios
			.get('/api/mentors?organization=086694b4-bdb4-4f34-b036-b39598132085')
			.then((res) => res.data);
		//get random one
		mentor = mentors[Math.floor(Math.random() * mentors.length)];
		if (!mentor) return;
		mentor.userData = await axios.get('/api/users/' + mentor?.user).then((res) => res.data);
		const getResult = await axios.get('/mentor/' + mentor.id);
		console.log(getResult);
		await axios.put('/mentor/' + mentor.id, {
			eventId: undefined
		});
		const response = await axios.post('/mentor/' + mentor.id, {
			eventId: undefined,
			body: `Create a greeting paragraph to the user visiting in less than 100 words. Start with saying Hello, and mention your name. then invite them to enter the sample metaverse room. User's prefered language is ${cookies.get(
				'locale'
			)}, so answer in that language if that is specified.`,
			user: $UserStore.id || 'anonymous'
		});
		console.log({ response });
		intro = response.data.response || response.data.text;
		const response2 = await axios.post('/mentor/' + mentor.id, {
			eventId: undefined,
			body: `Now, create a message to encourage the user to create their own virtual school with AI mentor with ChatGPT and AI image generator from Stability.ai in less than 100 words. User's prefered language is ${cookies.get(
				'locale'
			)}, so answer in that language if that is specified.`,
			user: $UserStore.id || 'anonymous'
		});
		invite = response2.data.response || response2.data.text;
	});
</script>

<Navigation />
<div class="container">
	<section>
		{#if mentor}
			{#if mentor.userData}
				<div transition:fade>
					<AvatarThumbnail size="4rem" url={mentor.userData.avatarURL} />
				</div>
			{/if}
		{/if}
		{#if intro}
			<div transition:fade>
				{intro}
			</div>
		{/if}
	</section>

	<section style="">
		<a role="button" href={'/gnv/firsttest'}>
			<Icon icon="login" />

			{_('Enter Sample Room')}
		</a>
	</section>
	<section>
		{#if invite}
			<div transition:fade>
				{invite}
			</div>
		{/if}
	</section>
	<section>
		<a role="button" href={'/create-organization'}>
			<Icon icon="apartment" />

			{_('Create New Organization')}
		</a>
	</section>
</div>

<style>
	.container {
		position: relative;
	}
	section {
		text-align: center;
	}
</style>
