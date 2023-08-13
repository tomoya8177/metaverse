<script lang="ts">
	import Login from '../../Components/Organisms/Login.svelte';
	import type { PageData } from '$lib/types';
	import { _ } from '$lib/i18n';
	import OrganizationEdit from '../../Components/Organisms/OrganizationEdit.svelte';
	import type { Organization } from '$lib/types/Organization';
	import { EmptyOrganization } from '$lib/preset/EmptyOrganization';
	import { onMount } from 'svelte';
	import { checkSlugForOrganization } from '$lib/frontend/checkSlugForOrganization';
	import axios from 'axios';
	import { page } from '$app/stores';
	import { myAlert, toast } from '$lib/frontend/toast';
	import type { User } from '$lib/frontend/Classes/User';
	import RoomEdit from '../../Components/Organisms/RoomEdit.svelte';
	import { Room } from '$lib/frontend/Classes/Room';
	import { EmptyRoom } from '$lib/preset/EmptyRoom';
	import MentorEdit from '../../Components/Organisms/MentorEdit.svelte';
	import { EmptyMentor } from '$lib/preset/EmptyMentor';
	import { validateMentorData } from '$lib/frontend/validateMentorData';
	import Navigation from '../../Components/Organisms/Navigation.svelte';
	import { escapeHTML } from '$lib/math/escapeHTML';
	import { emptyUser } from '$lib/preset/EmptyUser';
	import Icon from '../../Components/Atom/Icon.svelte';
	import TeamIconEditor from '../[organizationSlug=notRoute]/manager/TeamIconEditor.svelte';
	import { UserStore } from '$lib/store';
	import { sendJoinedToOrganizationEmail } from '$lib/frontend/sendInvitedToOrganizationEmail';
	import { Mentor } from '$lib/frontend/Classes/Mentor';
	export let data: PageData;
	console.log(data);
	let loggedIn = data.loggedIn;
	let user = data.user;
	let process: 'organization' | 'room' | 'mentor' = 'organization';
	let organization: Organization;
	let room: Room = new Room({
		...EmptyRoom,
		slug: crypto.randomUUID()
	});
	let mentor: Mentor = new Mentor({});
	onMount(async () => {
		await mentor.init();
	});
	let busy = false;
	const createOrgWhenLoggedIn = async (loggedIn) => {
		if (loggedIn) {
			organization = await axios
				.post('/api/organizations', {
					slug: crypto.randomUUID()
				})
				.then((res) => res.data);
		}
	};

	$: createOrgWhenLoggedIn(loggedIn);
</script>

<svelte:head>
	<title>Create Organization | VirtuaCampus</title>
</svelte:head>
<Navigation />

{#if !loggedIn}
	<Login />
{:else if organization}
	<div class="container">
		<h3>
			{_("Let's Create an Organization!")}
		</h3>
		{#if process == 'organization'}
			<h4>
				{_('Organization')}
			</h4>
			<OrganizationEdit bind:editOrganization={organization} />
			<div class="teamIcon">
				<h4>{_('Icon')}</h4>
				<TeamIconEditor bind:organization />
			</div>
			<button
				aria-busy={busy}
				style="margin-top: 1rem;"
				on:click={async () => {
					if (!(await checkSlugForOrganization(organization.slug, organization))) return;
					if (!organization.title) return myAlert(_('Please enter a title'));
					busy = true;
					const newOrg = await axios
						.put('/api/organizations/' + organization.id, organization)
						.then((res) => res.data);
					const newUserRole = await axios.post('/api/userRoles', {
						user: user.id,
						organization: newOrg.id,
						role: 'manager'
					});
					const url = `${$page.url.protocol}//${$page.url.host}/${newOrg.slug}`;
					await sendJoinedToOrganizationEmail($UserStore.email, newOrg, url);
					room.organization = newOrg.id;
					mentor.organization = newOrg.id;
					if (!mentor.userData) mentor.userData = emptyUser;
					mentor.userData.nickname = 'My First AI Mentor';
					mentor.userData =
						(await axios.post('/api/users', mentor.userData).then((res) => res.data)) || emptyUser;
					mentor.user = mentor.userData?.id || '';
					const mentorRes = await axios.post('/api/mentors', mentor).then((res) => res.data);
					mentor = {
						...mentor,
						...mentorRes
					};

					process = 'mentor';
					busy = false;
				}}
			>
				{_('Next')}
			</button>
		{:else if process == 'mentor'}
			<h4>
				{_('VirtuaMentor')}
			</h4>
			<MentorEdit editMentor={mentor} />
			<button
				aria-busy={busy}
				on:click={async () => {
					if (!validateMentorData(mentor)) return;
					busy = true;
					if (!mentor.userData) mentor.userData = emptyUser;

					const updatedUser = await axios
						.put('/api/users/' + mentor.userData.id, {
							...mentor.userData,
							description: escapeHTML(mentor.userData.description)
						})
						.then((res) => res.data);
					const updatedMentor = await axios
						.put('/api/mentors/' + mentor.id, {
							...mentor,
							prompt: escapeHTML(mentor.prompt)
						})
						.then((res) => res.data);
					mentor.id = updatedMentor.id;
					updatedMentor.userData = updatedUser;
					room.mentor = updatedMentor.id;
					console.log({ updatedMentor, updatedUser });
					busy = false;
					process = 'room';
				}}
			>
				{_('Next')}
			</button>
		{:else if process == 'room'}
			<h4>
				{_('Room')}
			</h4>
			<RoomEdit bind:editRoom={room} users={[user]} mentors={[mentor]} />
			<button
				aria-busy={busy}
				on:click={async () => {
					if (!(await room.validate())) return;
					busy = true;
					console.log({ room });
					const { newRoom, mentor } = await room.create();
					console.log({ newRoom, mentor });
					busy = false;
					location.href = `/${organization.slug}/${newRoom.slug}`;
				}}
			>
				{_('Next')}
			</button>
		{/if}
	</div>
{/if}
