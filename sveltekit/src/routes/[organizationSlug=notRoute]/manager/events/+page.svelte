<script lang="ts">
	import EventEdit from '../../../../Components/Organisms/EventEdit.svelte';

	import { Event } from '$lib/frontend/Classes/Event';
	import { myConfirm, toast } from '$lib/frontend/toast';
	import { _ } from '$lib/i18n';
	import ModalCloseButton from '../../../../Components/Atom/ModalCloseButton.svelte';
	import type { PageData } from './$types';
	import { DateTime } from 'luxon';
	import ActionButtons from '../../../../Components/Organisms/ActionButtons.svelte';
	import Icon from '../../../../Components/Atom/Icon.svelte';
	import { convertLocalToUTC, convertUTCToLocal } from '$lib/frontend/convertLocalToUTC';
	import { onMount } from 'svelte';
	import { Calendar } from '@fullcalendar/core';
	import dayGridPlugin from '@fullcalendar/daygrid';
	import timeGridPlugin from '@fullcalendar/timegrid';
	import listPlugin from '@fullcalendar/list';
	import { cookies } from '$lib/frontend/cookies';
	import { goto } from '$app/navigation';
	import { calendar } from '$lib/frontend/Classes/Calendar';
	import CalendarView from '../../../../Components/Templates/CalendarView.svelte';

	export let data: PageData;
	let events = data.events;
	let organization = data.organization;
	let modalOpen = false;
	let rooms = data.rooms;
	let editEvent: Event;
	let editMode: 'create' | 'update' = 'update';
	let users = data.users;

	const onEventClicked = (eventId: string) => {
		goto(`/${organization.slug}/manager/events/${eventId}`);
		return;
	};
</script>

<h3>
	{_('Events')}
</h3>
<section>
	<a
		role="button"
		href={'#'}
		on:click={() => {
			editEvent = new Event({
				organization: organization.id
			});
			modalOpen = true;
			editMode = 'create';
		}}
	>
		{_('Add Event')}
	</a>
</section>
<CalendarView {onEventClicked} bind:events />

{#if modalOpen}
	<dialog open>
		<article>
			<ModalCloseButton onClick={() => (modalOpen = false)} />
			<EventEdit
				{users}
				{organization}
				{editMode}
				{editEvent}
				bind:modalOpen
				onCreateDone={(createdEvent) => {
					modalOpen = false;
					events.push(createdEvent);
					events = events.sort((a, b) => a.start.localeCompare(b.start));
					calendar.addEvent(createdEvent);
				}}
				onUpdateDone={(editEvent) => {
					modalOpen = false;

					calendar.updateEvent(editEvent);
				}}
				onDeleteDone={(editEvent) => {
					modalOpen = false;

					calendar.removeEvent(editEvent.id);
					events = events.filter((event) => event.id != editEvent.id);
				}}
			/>
		</article>
	</dialog>
{/if}

<style>
	article {
		max-width: calc(100vw - 2rem);
	}
</style>
