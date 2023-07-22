<script lang="ts">
	import { organizationFromSlug } from '$lib/frontend/organizationFromSlug';
	import type { Organization } from '$lib/types/Organization';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import type { PageData } from './$types';
	import { UserStore } from '$lib/store';
	import { _ } from '$lib/i18n';
	import AvatarThumbnail from './manager/mentors/AvatarThumbnail.svelte';
	import type { Mentor } from '$lib/types/Mentor';
	import axios from 'axios';
	import { nl2br } from '$lib/math/nl2br';
	import { unescapeHTML } from '$lib/math/escapeHTML';

	export let data: PageData;
	const organization: Organization = data.organization;
	let mentors: Mentor[] = [];
	onMount(async () => {
		mentors = await axios
			.get('/api/mentors?organization=' + organization.id)
			.then((res) => res.data);
		const users = await axios
			.get(`/api/users?id=in:'${mentors.map((mentor) => mentor.user).join("','")}'`)
			.then((res) => res.data);
		mentors = mentors.map((mentor) => {
			mentor.userData = users.find((user) => user.id == mentor.user);
			return mentor;
		});
	});
</script>

{#if organization}
	<div class="container">
		{#if $UserStore.isMember}
			{#if $UserStore.isManager}
				<div style="text-align:right">
					<a role="button" href={`/${organization.slug}/manager`}>
						{_("Manager's Console")}
					</a>
				</div>
			{/if}

			<div>
				{_('Available VirtuaMentors to chat with')}
			</div>
			{#each mentors as mentor}
				<div style="margin-bottom:0.4rem;">
					<a href={`/${organization.slug}/mentor/${mentor.id}`}>
						{#if mentor.userData?.avatarURL}
							<AvatarThumbnail url={mentor.userData.avatarURL} />
						{/if}
						{mentor.userData?.nickname || ''}
					</a>
					{@html nl2br(unescapeHTML(mentor.userData?.description) || '')}
				</div>
			{/each}
		{/if}
	</div>
{/if}
