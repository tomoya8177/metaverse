<script lang="ts">
	import type { Event } from '$lib/frontend/Classes/Event';
	import { DateTime } from 'luxon';
	import { UserStore } from '$lib/store';
	import InputWithLabel from '../Molecules/InputWithLabel.svelte';
	import type { Attendance as AttendanceClass } from '$lib/frontend/Classes/Attendance';
	import Attendance from '../Molecules/Attendance.svelte';
	import { nl2br } from '$lib/math/nl2br';
	import { _ } from '$lib/i18n';
	import EventDateTimeDisplay from '../Molecules/EventDateTimeDisplay.svelte';
	export let event: Event;
	export let attendance: AttendanceClass | null = null;
</script>

<section>
	<h4>
		{event.summary}
	</h4>
	<EventDateTimeDisplay {event} />
	<dl>
		<dd>
			{@html nl2br(event.description)}
		</dd>
		<dd>
			{@html event.location}
		</dd>
	</dl>
</section>
{#if attendance}
	<section>
		<h4>
			{_('RSVP')}
		</h4>
		<Attendance
			user={$UserStore}
			{event}
			{attendance}
			onDelete={() => {
				//attendances = attendances.filter((attendance) => attendance.user != $UserStore.id);
			}}
		/>
	</section>
{/if}
