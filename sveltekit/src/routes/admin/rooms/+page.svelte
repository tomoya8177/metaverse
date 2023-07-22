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
	import type { User } from '$lib/frontend/Classes/User';
	import type { Organization } from '$lib/types/Organization';
	import type { UserRole } from '$lib/types/UserRole';
	import { _ } from '$lib/i18n';
	import RoomTitleForManagers from '../../../Components/Molecules/RoomTitleForManagers.svelte';

	let events: Event[] = [];
	let paginated: Event[] = [];
	let editEvent: Event = EmptyEvent;
	let organizations: Organization[] = [];
	onMount(async () => {
		organizations = await axios.get('/api/organizations').then((res) => res.data);

		const results = await axios.get('/api/events').then((res) => {
			res.data.forEach((event: Event) => {
				event.organizationTitle =
					organizations.find((org) => org.id == event.organization)?.title || '';
				events.push(new Event(event));
			});
			return res.data;
		});
		events = events.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
	});
</script>

<h3>{_('Rooms')}</h3>
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
	{_('New Room')}
</button>
<FilterPagination inputArray={events} bind:paginated />
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
		{#each paginated as event}
			{@const organization = organizations.find((org) => org.id == event.organization)}
			<tr>
				<td>
					{#if organization}
						<RoomTitleForManagers {event} {organization} />
					{/if}
				</td>
				<td>{event.slug}</td>
				<td>{organization?.title}</td>

				<td>
					<InputWithLabel
						type="switch"
						label={_('Open for Anyone')}
						bind:value={editEvent.isPublic}
						disabled
					/>
					<InputWithLabel
						type="switch"
						label={_('Open for Anyone in the organization')}
						bind:value={editEvent.isOpen}
						disabled
					/>
				</td>
			</tr>
		{/each}
	</tbody>
</table>
