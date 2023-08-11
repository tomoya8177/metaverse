<script lang="ts">
	import { CalendarDisplay, calendar } from '$lib/frontend/Classes/Calendar';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { Room } from '$lib/frontend/Classes/Room';
	import { Event } from '$lib/frontend/Classes/Event';
	import ModalCloseButton from '../../../../Components/Atom/ModalCloseButton.svelte';
	import { UserStore } from '$lib/store';
	export let data: PageData;
	let events = data.events.map((event: any) => new Event(event));
	let attendances = data.attendances;
	console.log({ attendances });
	events = events
		.filter((event) =>
			$UserStore.isManager
				? true
				: attendances.some((atte) => atte.event == event.id && atte.user == $UserStore.id)
		)
		.map((event) => {
			event.attendances = attendances.filter((attendance) => attendance.event == event.id);
			event.myAttendance = event.attendances.find((attendance) => attendance.user == $UserStore.id);
			return event;
		});
	console.log({ events });
	let room = new Room(data.room);
	let organization = data.organization;
	onMount(() => {
		const el = document.getElementById('calendar') as HTMLElement;
		calendar.init(el, events, onEventClicked);
		calendar.render();
	});
	const onEventClicked = (eventId: string) => {
		goto(`/${organization.slug}/${room.slug}/events/${eventId}`);
		return;
	};
</script>

<dialog open>
	<article style="width:calc(100vw - 2rem)">
		<ModalCloseButton href={`/${data.organization.slug}/${data.room.slug}`} />
		<div id="calendar" />
	</article>
</dialog>
<slot />
