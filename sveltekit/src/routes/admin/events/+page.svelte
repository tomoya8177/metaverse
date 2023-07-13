<script lang="ts">
	import { EmptyEvent } from '$lib/preset/EmptyEvent';
	import { Event } from '$lib/frontend/Classes/Event';
	import axios from 'axios';
	import ModalCloseButton from '../../../Components/Atom/ModalCloseButton.svelte';
	import InputWithLabel from '../../../Components/Molecules/InputWithLabel.svelte';
	import FilterPagination from '../../../Components/Organisms/FilterPagination.svelte';
	import { onMount } from 'svelte';
	import Icon from '../../../Components/Atom/Icon.svelte';
	import { fade } from 'svelte/transition';
	import type { User } from '$lib/types/User';
	import type { Organization } from '$lib/types/Organization';
	import type { UserRole } from '$lib/types/UserRole';

	let events: Event[] = [];
	let paginated: Event[] = [];
	let editEvent: Event = EmptyEvent;
	let editMode: 'update' | 'create' = 'update';
	let modalOpen = false;
	let organizations: Organization[] = [];
	let users: User[] = [];
	let userRoles: UserRole[] = [];
	onMount(async () => {
		userRoles = await axios.get('/api/userRoles').then((res) => res.data);
		organizations = await axios.get('/api/organizations').then((res) => res.data);
		users = await axios.get('/api/users').then((res) => {
			res.data = res.data.map((user: User) => {
				user.userRoles = userRoles.filter((userRole) => userRole.user == user.id);
				user.organizations = organizations.filter((org) =>
					user.userRoles.find((userRole) => userRole.organization == org.id)
				);
				return user;
			});
			return res.data;
		});
		console.log({ users });
		const results = await axios.get('/api/events').then((res) => {
			res.data.forEach((event: Event) => {
				event.organizationTitle = organizations.find((org) => org.id == event.organization).title;
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
		events = [...events, new Event(newEvent)].sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
		modalOpen = false;
	};
	const onUpdateClicked = async () => {
		if (!(await editEvent.validate())) return;
		editEvent.allowedUsers = JSON.stringify(editEvent.allowedUsersArray);
		const updatedEvent = await axios
			.put('/api/events/' + editEvent.id, editEvent)
			.then((res) => res.data);
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

<h3>Events</h3>
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
	New Event
</button>
<FilterPagination inputArray={events} bind:paginated />
<table>
	<thead>
		<tr>
			<th />
			<th>Title</th>
			<th>Slug</th>
			<th>Organization</th>
			<th>Edit</th>
		</tr>
	</thead>
	<tbody>
		{#each paginated as event}
			{@const organization = organizations.find((org) => org.id == event.organization)}
			<tr>
				<td>
					<a href={`/${event.slug}`} role="button" class="outline circle-button">
						<Icon icon="login" />
					</a>
				</td>
				<td> {event.title}</td>
				<td>{event.slug}</td>
				<td>{organization?.title}</td>
				<td>
					<button
						on:click={() => {
							editEvent = event;
							editMode = 'update';
							modalOpen = true;
						}}
					>
						Edit
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
			<InputWithLabel label="Title" bind:value={editEvent.title} />
			<InputWithLabel label="slug" bind:value={editEvent.slug} />
			<InputWithLabel
				disabled={editMode == 'update'}
				label="Organization"
				bind:value={editEvent.organization}
				type="select"
				selects={organizations.map((org) => {
					return {
						name: org.title,
						value: org.id
					};
				})}
			/>
			<InputWithLabel type="switch" label="Allow Audio" bind:value={editEvent.allowAudio} />
			<InputWithLabel type="switch" label="Allow Video" bind:value={editEvent.allowVideo} />
			<InputWithLabel type="switch" label="Open for Anyone" bind:value={editEvent.isPublic} />
			{#if !editEvent.isPublic}
				<InputWithLabel
					type="switch"
					label="Open for Anyone in the organization"
					bind:value={editEvent.isOpen}
				/>
				{#if !editEvent.isOpen}
					Allowed Users
					{#each users.filter((user) => user.organizations.find((userOrg) => {
							console.log({ userOrg });
							return userOrg.id == editEvent.organization;
						})) as user}
						<label>
							<input type="checkbox" bind:group={editEvent.allowedUsersArray} value={user.id} />
							{user.nickname}({user.email})
						</label>
					{/each}
				{/if}
			{/if}
			<div style="margin-top:1rem;margin-bottom:1rem">
				Capacity: {editEvent.capacity}
			</div>
			{#if editMode == 'create'}
				<button
					on:click={() => {
						onCreateClicked();
					}}
				>
					Create
				</button>
			{:else}
				<button
					on:click={() => {
						onUpdateClicked();
					}}
				>
					Update
				</button>
				<button
					class="secondary"
					on:click={() => {
						onDeleteClicked();
					}}
				>
					Delete
				</button>
			{/if}
		</article>
	</dialog>
{/if}
