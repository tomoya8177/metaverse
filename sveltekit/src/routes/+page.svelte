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
	import { actionHistory } from '$lib/frontend/Classes/actionHistory';
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
		const response = await axios.post('/mentor', {
			messages: [
				{
					role: 'system',
					content: `Greet the user visiting in less than 100 words. Start with saying Hello, and mention your name that is ${
						mentor.userData.nickname
					}. and you work for a company Global New Venture as an AI mentor on the project called VirtuaCampus. Then invite them to enter the sample metaverse room.  make sure to answer in the user's prefered language based on their locale setting.  User's prefered language locale is ${cookies.get(
						'locale'
					)}.`
				}
			]
		});
		console.log({ response });
		intro = response.data.response.content;
		const response2 = await axios.post('/mentor', {
			messages: [
				{
					role: 'system',
					content: `Encourage the user to create their own virtual school with AI mentor with ChatGPT and AI image generator from Stability.ai in less than 100 words.  make sure to answer in the user's prefered language based on their locale setting. User's prefered language locale is ${cookies.get(
						'locale'
					)}.`
				}
			]
		});
		console.log({ response2 });
		invite = response2.data.response.content;
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
		{:else}
			<span aria-busy="true" />
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
		{:else}
			<span aria-busy="true" />
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
