<script lang="ts">
	import { organizationFromSlug } from '$lib/frontend/organizationFromSlug';
	import type { Organization } from '$lib/types/Organization';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import type { PageData } from './$types';
	import { RoomStore, FocusObjectStore, UserStore } from '$lib/store';
	import { _ } from '$lib/i18n';
	import type { Mentor } from '$lib/types/Mentor';
	import axios from 'axios';
	import { nl2br } from '$lib/math/nl2br';
	import { unescapeHTML } from '$lib/math/escapeHTML';
	import { Room } from '$lib/frontend/Classes/Room';
	import RoomTitleForManagers from '../../Components/Molecules/RoomTitleForManagers.svelte';
	import AvatarThumbnail from '../../Components/Atom/AvatarThumbnail.svelte';
	import { EmptyRoom } from '$lib/preset/EmptyRoom';
	import { Users } from '$lib/frontend/Classes/Users';
	import { EmptyObject } from '$lib/preset/EmptyObject';
	import { actionHistory } from '$lib/frontend/Classes/ActionHistory';

	export let data: PageData;
	const organization: Organization = data.organization;
	let mentors: Mentor[] = [];
	let rooms: Room[] = [];
	onMount(async () => {
		actionHistory.send('dashboard', { organization });
		console.log('dashboard mount');
		FocusObjectStore.set(EmptyObject);
		RoomStore.set(EmptyRoom);
		Users.clear();
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
		const unfilteredRooms = await axios
			.get('/api/rooms?organization=' + organization.id)
			.then((res) => res.data);
		rooms = unfilteredRooms.filter((room) => {
			if (room.isPublic) return true;
			if (room.isOpen) return true;
			if (room.allowedUsers.includes($UserStore.id)) return true;
			return false;
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
			<section>
				<div>
					{_('Available Rooms')}
				</div>
				{#each rooms as room}
					<div style="margin-bottom:0.4rem;">
						<RoomTitleForManagers {room} {organization} />
					</div>
				{/each}
			</section>
			<section>
				<div>
					{_('Available VirtuaMentors to chat with')}
				</div>
				{#each mentors as mentor}
					<div style="margin-bottom:0.4rem;">
						<a data-tooltip={_('Start Chat')} href={`/${organization.slug}/mentor/${mentor.id}`}>
							{#if mentor.userData?.avatarURL}
								<AvatarThumbnail url={mentor.userData.avatarURL} />
							{/if}
							{mentor.userData?.nickname || ''}
						</a>
						{@html nl2br(unescapeHTML(mentor.userData?.description) || '')}
					</div>
				{/each}
			</section>
		{/if}
	</div>
{/if}
