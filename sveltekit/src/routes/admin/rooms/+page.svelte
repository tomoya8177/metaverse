<script lang="ts">
	import { EmptyRoom } from '$lib/preset/EmptyRoom';
	import { Room } from '$lib/frontend/Classes/Room';
	import axios from 'axios';
	import ModalCloseButton from '../../../Components/Atom/ModalCloseButton.svelte';
	import FilterPagination from '../../../Components/Organisms/FilterPagination.svelte';
	import { onMount } from 'svelte';
	import Icon from '../../../Components/Atom/Icon.svelte';
	import { fade } from 'svelte/transition';
	import type { User } from '$lib/frontend/Classes/User';
	import type { Organization } from '$lib/types/Organization';
	import type { UserRole } from '$lib/types/UserRole';
	import { _ } from '$lib/i18n';
	import RoomTitleForManagers from '../../../Components/Molecules/RoomTitleForManagers.svelte';
	import { InputWithLabel } from 'mymetaverseportal-ui-component';

	let rooms: Room[] = [];
	let paginated: Room[] = [];
	let editRoom: Room = EmptyRoom;
	let organizations: Organization[] = [];
	onMount(async () => {
		organizations = await axios.get('/api/organizations').then((res) => res.data);

		const results = await axios.get('/api/rooms').then((res) => {
			res.data.forEach((room: Room) => {
				room.organizationTitle =
					organizations.find((org) => org.id == room.organization)?.title || '';
				rooms.push(new Room(room));
			});
			return res.data;
		});
		rooms = rooms.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
	});
	let editMode: 'update' | 'create' = 'update';
	let modalOpen = false;
</script>

<h3>{_('Rooms')}</h3>

<FilterPagination inputArray={rooms} bind:paginated />
<table>
	<thead>
		<tr>
			<th>{_('Title')}</th>
			<th>{_('Slug')}</th>
			<th>{_('Organization')}</th>
			<th />
		</tr>
	</thead>
	<tbody>
		{#each paginated as room}
			{@const organization = organizations.find((org) => org.id == room.organization)}
			<tr>
				<td>
					{#if organization}
						<RoomTitleForManagers {room} {organization} />
					{/if}
				</td>
				<td>{room.slug}</td>
				<td>{organization?.title}</td>

				<td>
					<InputWithLabel
						type="switch"
						label={_('Open for Anyone')}
						bind:value={room.isPublic}
						disabled
					/>
					<InputWithLabel
						type="switch"
						label={_('Open for Anyone in the organization')}
						bind:value={room.isOpen}
						disabled
					/>
				</td>
			</tr>
		{/each}
	</tbody>
</table>
