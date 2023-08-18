<script lang="ts">
	import RoomEdit from '../../../../Components/Organisms/RoomEdit.svelte';

	import RoomTitleForManagers from '../../../../Components/Molecules/RoomTitleForManagers.svelte';

	import { EmptyRoom } from '$lib/preset/EmptyRoom';
	import { Room } from '$lib/frontend/Classes/Room';
	import axios from 'axios';
	import ModalCloseButton from '../../../../Components/Atom/ModalCloseButton.svelte';
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
	import type { PageData } from './$types';
	import { actionHistory } from '$lib/frontend/Classes/ActionHistory';
	export let data: PageData;
	let progress: number = 0;
	uploader.progress.subscribe((value) => {
		progress = value;
	});
	let rooms: Room[] = [];
	let paginated: Room[] = [];
	let editRoom: Room = EmptyRoom;
	let editMode: 'update' | 'create' = 'update';
	let modalOpen = false;
	let organizations: Organization[] = [];
	const organization: Organization = data.organization;
	const users: User[] = data.users;
	let mentors: Mentor[] = [];
	let documents: DocumentForAI[] = [];
	onMount(async () => {
		const results = await axios.get('/api/rooms?organization=' + organization.id).then((res) => {
			res.data.forEach((room: Room) => {
				room.organizationTitle =
					organizations.find((org) => org.id == room.organization)?.title || '';
				rooms.push(new Room(room));
			});
			return res.data;
		});
		rooms = rooms.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
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
			.get(`/api/documentsForAI?room=in:'${rooms.map((room) => room.id).join("','")}'`)
			.then((res) => res.data);
		rooms = rooms.map((room) => {
			room.documents = documents.filter((document) => document.room == room.id);
			return room;
		});
	});

	const onCreateClicked = async () => {
		if (!(await editRoom.validate())) return;
		busy = true;
		await editRoom.create();
		rooms = [...rooms, editRoom].sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
		busy = false;
		modalOpen = false;
		actionHistory.send('createRoom', { room: editRoom.purifyData() });
	};

	let busy = false;
</script>

<h3>{_('Rooms')}</h3>
<a
	href={'#'}
	role="button"
	on:click={() => {
		editRoom = new Room({
			...EmptyRoom,
			slug: crypto.randomUUID(),
			organization: organization.id
		});
		editMode = 'create';
		modalOpen = true;
	}}
>
	{_('New Room')}
</a>
<FilterPagination inputArray={rooms} bind:paginated />
<table>
	<thead>
		<tr>
			<th>{_('Title')}</th>
			<th>{_('Slug')}</th>
			<th>{_('Edit')}</th>
		</tr>
	</thead>
	<tbody>
		{#each paginated as room}
			<tr>
				<td>
					<RoomTitleForManagers forManager {room} {organization} />
				</td>
				<td>{room.slug}</td>
				<td>
					<a
						role="button"
						class="circle-button"
						href={`/${organization.slug}/manager/rooms/${room.id}`}
					>
						<Icon icon="edit" />
					</a>
				</td>
			</tr>
		{/each}
	</tbody>
</table>
{#if modalOpen}
	<dialog open transition:fade>
		<article>
			<ModalCloseButton onClick={() => (modalOpen = false)} />
			<RoomEdit {editRoom} {users} {mentors} />
			{#if editMode == 'create'}
				<button
					aria-busy={busy}
					on:click={() => {
						onCreateClicked();
					}}
				>
					{_('Create')}
				</button>
			{/if}
		</article>
	</dialog>
{/if}
