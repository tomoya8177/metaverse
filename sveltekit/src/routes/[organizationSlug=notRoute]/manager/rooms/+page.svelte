<script lang="ts">
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
		editEvent.allowedUsers = JSON.stringify(editEvent.allowedUsersArray);
		const newEvent = await axios.post('/api/events', editEvent).then((res) => res.data);
		events = [...events, new Event(newEvent)].sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
		if (editEvent.mentor) {
			const mentor = await axios.get('/api/mentors/' + editEvent.mentor).then((res) => res.data);
			mentors = [...mentors.filter((mentor) => mentor.id != editEvent.mentor), mentor];
			await reinstallAIBrain(mentor);
		}
		busy = false;
		modalOpen = false;
	};
	const onUpdateClicked = async () => {
		if (!(await editEvent.validate())) return;
		busy = true;
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
		if (editEvent.mentor) {
			const mentor = await axios.get('/api/mentors/' + editEvent.mentor).then((res) => res.data);
			mentors = [...mentors.filter((mentor) => mentor.id != editEvent.mentor), mentor];
			await reinstallAIBrain(mentor);
		}

		busy = false;
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
	let busy = false;
</script>

<h3>{_('Rooms')}</h3>
<a
	href={'#'}
	role="button"
	on:click={() => {
		editEvent = new Event({
			...EmptyEvent,
			slug: crypto.randomUUID()
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
					<RoomTitleForManagers {event} {organization} />
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
			<InputWithLabel label={_('Title')} bind:value={editEvent.title} />
			<InputWithLabel label={_('Slug')} bind:value={editEvent.slug} />

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
			<InputWithLabel
				type="select"
				label={_('VirtuaMentor')}
				selects={[
					{
						name: _('None'),
						value: ''
					},
					...mentors.map((mentor) => {
						return {
							name: mentor.userData?.nickname,
							value: mentor.id
						};
					})
				]}
				bind:value={editEvent.mentor}
			/>
			{#if editEvent.mentor}
				<div>{_('Room Specific Materials')}</div>
				{#each editEvent.documents || [] as document}
					<DocumentForAiRow
						{document}
						onDeleteDone={() => {
							editEvent.documents = editEvent.documents.filter((doc) => doc.id != document.id);
						}}
					/>
				{/each}
				<input
					type="file"
					accept=".pdf,.txt,.docx"
					multiple
					on:change={async (e) => {
						//get files from event
						const files = e.target.files;
						const res = await uploader.uploadLocally(files);
						const promises = res.data.map(async (file) => {
							const res = await axios.post('/api/documentsForAI', {
								filename: file.filename,
								title: file.title,
								type: file.type,
								event: editEvent.id
							});
							return res.data;
						});
						const fileDatas = await Promise.all(promises);
						editEvent.documents = [...editEvent.documents, ...fileDatas];
						e.target.value = '';
					}}
				/>
				{#if progress > 0}
					<progress max={100} value={progress} />
				{/if}
				<InputWithLabel type="textarea" label={_('Prompt')} bind:value={editEvent.prompt} />
				{#if editEvent.mentor}
					<small>
						{_("VirtuaMentor's memory will be refreshed")}
					</small>
				{/if}
			{/if}
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
