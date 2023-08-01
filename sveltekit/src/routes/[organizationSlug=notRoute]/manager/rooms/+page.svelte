<script lang="ts">
	import EventEdit from '../../../../Components/Organisms/EventEdit.svelte';

	import RoomTitleForManagers from '../../../../Components/Molecules/RoomTitleForManagers.svelte';

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
	import type { Mentor } from '$lib/types/Mentor';
	import type { DocumentForAI } from '$lib/types/DocumentForAI';
	import { uploader } from '$lib/frontend/Classes/Uploader';
	import DocumentForAiRow from '../../../../Components/Molecules/DocumentForAIRow.svelte';
	import { reinstallAIBrain } from '$lib/frontend/reinstallAIBrain';
	import type { PageData } from './$types';
	import { actionHistory } from '$lib/frontend/Classes/actionHistory';
	export let data: PageData;
	let progress: number = 0;
	uploader.progress.subscribe((value) => {
		progress = value;
	});
	let events: Event[] = [];
	let paginated: Event[] = [];
	let editEvent: Event = EmptyEvent;
	let editMode: 'update' | 'create' = 'update';
	let modalOpen = false;
	let organizations: Organization[] = [];
	const organization: Organization = data.organization;
	const users: User[] = data.users;
	let mentors: Mentor[] = [];
	let documents: DocumentForAI[] = [];
	onMount(async () => {
		const results = await axios.get('/api/events?organization=' + organization.id).then((res) => {
			res.data.forEach((event: Event) => {
				event.organizationTitle =
					organizations.find((org) => org.id == event.organization)?.title || '';
				events.push(new Event(event));
			});
			return res.data;
		});
		events = events.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
		mentors = await axios
			.get('/api/mentors?organization=' + organization.id)
			.then((res) => res.data);
		const mentorUsers = await axios
			.get(`/api/users?id=in:'${mentors.map((mentor) => mentor.user).join("','")}'`)
			.then((res) => res.data);
		mentors = mentors.map((mentor) => {
			mentor.userData = mentorUsers.find((user) => user.id == mentor.user);
			return mentor;
		});
		documents = await axios
			.get(`/api/documentsForAI?event=in:'${events.map((event) => event.id).join("','")}'`)
			.then((res) => res.data);
		events = events.map((event) => {
			event.documents = documents.filter((document) => document.event == event.id);
			return event;
		});
	});

	const onCreateClicked = async () => {
		if (!(await editEvent.validate())) return;
		busy = true;
		const { newEvent, mentor } = await editEvent.create();
		events = [...events, new Event(newEvent)].sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
		mentors = [...mentors.filter((mentor) => mentor.id != editEvent.mentor), mentor];
		busy = false;
		modalOpen = false;
		actionHistory.send('createRoom', { room: newEvent });
	};
	const onUpdateClicked = async () => {
		if (!(await editEvent.validate())) return;
		busy = true;
		const { updatedEvent, mentor } = await editEvent.update();
		mentors = [...mentors.filter((m) => m.id != mentor.id), mentor];
		events = events.map((event) => {
			if (event.id == updatedEvent.id) return new Event(updatedEvent);
			return event;
		});
		busy = false;
		modalOpen = false;
		actionHistory.send('updateRoom', { room: updatedEvent });
	};
	const onDeleteClicked = async () => {
		if (!confirm(_('Are you sure you want to delete this room?'))) return;
		await editEvent.delete();

		events = events.filter((event) => event.id != editEvent.id);

		modalOpen = false;
		actionHistory.send('deleteRoom', { room: editEvent });
	};
	let busy = false;
</script>

<h3>{_('Rooms')}</h3>
<a
	href={'#'}
	role="button"
	on:click={() => {
		editEvent = new Event({
			...EmptyEvent,
			slug: crypto.randomUUID(),
			organization: organization.id
		});
		editMode = 'create';
		modalOpen = true;
	}}
>
	{_('New Room')}
</a>
<FilterPagination inputArray={events} bind:paginated />
<table>
	<thead>
		<tr>
			<th>{_('Title')}</th>
			<th>{_('Slug')}</th>
			<th>{_('Edit')}</th>
		</tr>
	</thead>
	<tbody>
		{#each paginated as event}
			<tr>
				<td>
					<RoomTitleForManagers forManager {event} {organization} />
				</td>
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
			<EventEdit {editEvent} {users} {mentors} />
			{#if editMode == 'create'}
				<button
					aria-busy={busy}
					on:click={() => {
						onCreateClicked();
					}}
				>
					{_('Create')}
				</button>
			{:else}
				<button
					aria-busy={busy}
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
