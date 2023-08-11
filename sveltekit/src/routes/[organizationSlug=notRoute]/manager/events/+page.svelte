<script lang="ts">
	import EventEdit from '../../../../Components/Organisms/EventEdit.svelte';

	import { Event } from '$lib/frontend/Classes/Event';
	import { myConfirm, toast } from '$lib/frontend/toast';
	import { _ } from '$lib/i18n';
	import ModalCloseButton from '../../../../Components/Atom/ModalCloseButton.svelte';
	import InputWithLabel from '../../../../Components/Molecules/InputWithLabel.svelte';
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
	import { CalendarDisplay } from '$lib/frontend/Classes/Calendar';

	export let data: PageData;
	let events = data.events;
	let organization = data.organization;
	let modalOpen = false;
	let rooms = data.rooms;
	let editEvent: Event;
	let editMode: 'create' | 'update' = 'update';
	let calendar: CalendarDisplay;
	let users = data.users;
	onMount(() => {
		setTimeout(() => {
			const el = document.getElementById('calendar') as HTMLElement;
			calendar = new CalendarDisplay(el, events, onEventClicked);
			calendar.render();
		}, 1000);
	});
	const onEventClicked = (eventId: string) => {
		goto(`/${organization.slug}/manager/events/${eventId}`);
		return;
		editEvent = events.find((event) => event.id == eventId) || new Event({});
		if (!editEvent.id) return;
		//convert to local
		editEvent.start = convertUTCToLocal(editEvent.start);
		editEvent.end = convertUTCToLocal(editEvent.end);
		modalOpen = true;
		editMode = 'update';
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
				id: crypto.randomUUID(),
				organization: organization.id,
				start: DateTime.now().toISO(),
				end: DateTime.now().plus({ hours: 1 }).toISO()
			});
			modalOpen = true;
			editMode = 'create';
		}}
	>
		{_('Add Event')}
	</a>
</section>
<div id="calendar" />

{#if modalOpen}
	<dialog open>
		<article>
			<ModalCloseButton onClick={() => (modalOpen = false)} />
			<EventEdit
				{users}
				{organization}
				{rooms}
				{editMode}
				{editEvent}
				bind:modalOpen
				onCreateDone={(createdEvent) => {
					modalOpen = false;
					events.push(createdEvent);
					events = events.sort((a, b) => a.start.localeCompare(b.start));
					calendar.addEvent(createdEvent.toFullCalendarEvent());
				}}
				onUpdateDone={(editEvent) => {
					modalOpen = false;

					calendar.getEventById(editEvent.id)?.remove();
					calendar.addEvent(editEvent.toFullCalendarEvent());
				}}
				onDeleteDone={(editEvent) => {
					modalOpen = false;

					calendar.getEventById(editEvent.id)?.remove();
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
