<script lang="ts">
	import { EmptyEvent } from '$lib/preset/EmptyEvent';
	import { Event } from '$lib/frontend/Classes/Event';
	import axios from 'axios';
	import ModalCloseButton from '../../../../Components/Atom/ModalCloseButton.svelte';
	import InputWithLabel from '../../../../Components/Molecules/InputWithLabel.svelte';
	import FilterPagination from '../../../../Components/Organisms/FilterPagination.svelte';
	import { onMount } from 'svelte';
	import Icon from '../../../../Components/Atom/Icon.svelte';
	import { fade } from 'svelte/transition';
	import type { User } from '$lib/frontend/Classes/User';
	import type { Organization } from '$lib/types/Organization';
	import type { UserRole } from '$lib/types/UserRole';
	import { _ } from '$lib/i18n';
	import { page } from '$app/stores';

	let events: Event[] = [];
	let paginated: Event[] = [];
	let editEvent: Event = EmptyEvent;
	let editMode: 'update' | 'create' = 'update';
	let modalOpen = false;
	let organizations: Organization[] = [];
	let organization: Organization;
	let users: User[] = [];
	let userRoles: UserRole[] = [];
	onMount(async () => {
		organization = await axios
			.get('/api/organizations?slug=' + $page.params.organizationSlug)
			.then((res) => res.data[0]);
		userRoles = await axios
			.get('/api/userRoles?organizatin=' + organization.id)
			.then((res) => res.data);
		users = await axios
			.get(`/api/users?id=in:'${userRoles.map((role) => role.user).join("','")}'`)
			.then((res) => {
				res.data = res.data.map((user: User) => {
					user.userRoles = userRoles.filter((userRole) => userRole.user == user.id);
					return user;
				});
				return res.data;
			});
		console.log({ users });
		const results = await axios.get('/api/events?organization=' + organization.id).then((res) => {
			res.data.forEach((event: Event) => {
				event.organizationTitle =
					organizations.find((org) => org.id == event.organization)?.title || '';
				events.push(new Event(event));
			});
			return res.data;
		});
		events = events.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
	});

	const onCreateClicked = async () => {
		if (!(await editEvent.validate())) return;
		editEvent.allowedUsers = JSON.stringify(editEvent.allowedUsersArray);
		const newEvent = await axios.post('/api/events', editEvent).then((res) => res.data);
		axios.put('/chat/' + newEvent.id).then((res) => {
			console.log(res.data);
		});
		events = [...events, new Event(newEvent)].sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
		modalOpen = false;
	};
	const onUpdateClicked = async () => {
		if (!(await editEvent.validate())) return;
		editEvent.allowedUsers = JSON.stringify(editEvent.allowedUsersArray);
		const updatedEvent = await axios
			.put('/api/events/' + editEvent.id, editEvent)
			.then((res) => res.data);
		axios.put('/chat/' + updatedEvent.id).then((res) => {
			console.log(res.data);
		});
		events = events.map((event) => {
			if (event.id == updatedEvent.id) {
				return new Event(updatedEvent);
			}
			return event;
		});
		modalOpen = false;
	};
	const onDeleteClicked = async () => {
		if (!confirm('Are you sure you want to delete this event?')) return;
		await axios.delete('/api/events/' + editEvent.id);
		events = events.filter((event) => event.id != editEvent.id);
		await axios.delete('/api/sessions?event=' + editEvent.id);
		await axios.delete('/api/messages?event=' + editEvent.id);
		modalOpen = false;
	};
</script>

<h3>{_('Events')}</h3>
<button
	on:click={() => {
		editEvent = new Event({
			...EmptyEvent,
			slug: crypto.randomUUID()
		});
		editMode = 'create';
		modalOpen = true;
	}}
>
	{_('New Event')}
</button>
<FilterPagination inputArray={events} bind:paginated />
<table>
	<thead>
		<tr>
			<th />
			<th>{_('Title')}</th>
			<th>{_('Slug')}</th>
			<th>{_('Edit')}</th>
		</tr>
	</thead>
	<tbody>
		{#each paginated as event}
			<tr>
				<td>
					<a
						href={`/${organization?.slug}/${event.slug}`}
						role="button"
						class="outline circle-button"
					>
						<Icon icon="login" />
					</a>
				</td>
				<td> {event.title}</td>
				<td>{event.slug}</td>
				<td>
					<button
						on:click={() => {
							editEvent = event;
							editMode = 'update';
							modalOpen = true;
						}}
					>
						{_('Edit')}
					</button>
				</td>
			</tr>
		{/each}
	</tbody>
</table>
{#if modalOpen}
	<dialog open transition:fade>
		<article>
			<ModalCloseButton onClick={() => (modalOpen = false)} />
			<InputWithLabel label={_('Title')} bind:value={editEvent.title} />
			<InputWithLabel label={_('Slug')} bind:value={editEvent.slug} />
			<InputWithLabel
				disabled={editMode == 'update'}
				label={_('Organization')}
				bind:value={editEvent.organization}
				type="select"
				selects={organizations.map((org) => {
					return {
						name: org.title,
						value: org.id
					};
				})}
			/>
			<InputWithLabel type="switch" label={_('Allow Audio')} bind:value={editEvent.allowAudio} />
			<InputWithLabel type="switch" label={_('Allow Video')} bind:value={editEvent.allowVideo} />
			<InputWithLabel type="switch" label={_('Open for Anyone')} bind:value={editEvent.isPublic} />
			{#if !editEvent.isPublic}
				<InputWithLabel
					type="switch"
					label={_('Open for Anyone in the organization')}
					bind:value={editEvent.isOpen}
				/>
				{#if !editEvent.isOpen}
					Allowed Users
					{#each users as user}
						<label>
							<input type="checkbox" bind:group={editEvent.allowedUsersArray} value={user.id} />
							{user.nickname}
							({user.email})
						</label>
					{/each}
				{/if}
			{/if}

			<InputWithLabel label="VirtuaMentor's Name" bind:value={editEvent.virtuaMentorName} />
			<InputWithLabel
				type="textarea"
				label="Prompt for VirtuaMentor"
				bind:value={editEvent.virtuaMentorPrompt}
			/>
			{#if editMode == 'create'}
				<button
					on:click={() => {
						onCreateClicked();
					}}
				>
					{_('Create')}
				</button>
			{:else}
				<button
					on:click={() => {
						onUpdateClicked();
					}}
				>
					{_('Update')}
				</button>
				<button
					class="secondary"
					on:click={() => {
						onDeleteClicked();
					}}
				>
					{_('Delete')}
				</button>
			{/if}
		</article>
	</dialog>
{/if}
