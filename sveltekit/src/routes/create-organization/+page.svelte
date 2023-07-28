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
	import { myAlert, toast } from '$lib/frontend/toast';
	import type { User } from '$lib/frontend/Classes/User';
	import EventEdit from '../../Components/Organisms/EventEdit.svelte';
	import { Event } from '$lib/frontend/Classes/Event';
	import { EmptyEvent } from '$lib/preset/EmptyEvent';
	import MentorEdit from '../../Components/Organisms/MentorEdit.svelte';
	import type { Mentor } from '$lib/types/Mentor';
	import { EmptyMentor } from '$lib/preset/EmptyMentor';
	import { validateMentorData } from '$lib/frontend/validateMentorData';
	import Navigation from '../../Components/Organisms/Navigation.svelte';
	export let data: PageData;
	console.log(data);
	let loggedIn = data.loggedIn;
	let user = data.user;
	let process: 'organization' | 'event' | 'mentor' = 'organization';
	let organization: Organization = EmptyOrganization;
	let event: Event = new Event({
		...EmptyEvent,
		slug: crypto.randomUUID(),
		allowAudio: true,
		allowVideo: true
	});
	let mentor: Mentor = EmptyMentor;
	onMount(() => {
		organization = {
			...EmptyOrganization,
			slug: crypto.randomUUID()
		};
	});
	let busy = false;
</script>

<Navigation />

{#if !loggedIn}
	<Login />
{:else}
	<div class="container">
		<h3>
			{_("Let's Create an Organization!")}
		</h3>
		{#if process == 'organization'}
			<h4>
				{_('Organization')}
			</h4>
			<OrganizationEdit bind:editOrganization={organization} />
			<button
				aria-busy={busy}
				style="margin-top: 1rem;"
				on:click={async () => {
					if (!(await checkSlugForOrganization(organization.slug, organization))) return;
					if (!organization.title) return myAlert(_('Please enter a title'));
					busy = true;
					const newOrg = await axios
						.post('/api/organizations', organization)
						.then((res) => res.data);
					const newUserRole = await axios.post('/api/userRoles', {
						user: user.id,
						organization: newOrg.id,
						role: 'manager'
					});
					event.organization = newOrg.id;
					mentor.organization = newOrg.id;
					mentor.userData.nickname = _('My First AI Mentor');
					process = 'mentor';
					busy = false;
				}}
			>
				{_('Next')}
			</button>
		{:else if process == 'mentor'}
			{_('VirtuaMentor')}
			<MentorEdit editMentor={mentor} />
			<button
				aria-busy={busy}
				on:click={async () => {
					if (!validateMentorData(mentor)) return;
					busy = true;
					const createdUser = await axios
						.post('/api/users', mentor.userData)
						.then((res) => res.data);
					const createdMentor = await axios
						.post('/api/mentors', {
							...mentor,
							user: createdUser.id
						})
						.then((res) => res.data);
					mentor.id = createdMentor.id;
					createdMentor.userData = createdUser;
					event.mentor = createdMentor.id;
					console.log({ createdMentor, createdUser });
					busy = false;
					process = 'event';
				}}
			>
				{_('Next')}
			</button>
		{:else if process == 'event'}
			{_('Room')}
			<EventEdit bind:editEvent={event} users={[user]} mentors={[mentor]} />
			<button
				aria-busy={busy}
				on:click={async () => {
					if (!(await event.validate())) return;
					busy = true;
					console.log({ event });
					const { newEvent, mentor } = await event.create();
					console.log({ newEvent, mentor });
					busy = false;
					location.href = `/${organization.slug}/${newEvent.slug}`;
				}}
			>
				{_('Next')}
			</button>
		{/if}
	</div>
{/if}
