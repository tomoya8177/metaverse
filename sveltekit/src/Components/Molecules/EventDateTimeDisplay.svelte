<script lang="ts">
	import type { Event } from '$lib/frontend/Classes/Event';
	import { _ } from '$lib/i18n';
	import { DateTime } from 'luxon';
	import InputWithLabel from './InputWithLabel.svelte';
	export let event: Event;
	let showEnd = true;
	let showEndDate = true;
	let showEndTime = true;
	//if start and end is the same day, hide end date
	//if all day event, the end date will be a day before the end day.
</script>

<dl>
	<dt>
		<InputWithLabel label={_('All Day')} bind:value={event.allDay} type="switch" disabled />
	</dt>
	<dt>{_('Schedule')}</dt>
	<dd>
		{DateTime.fromISO(event.start).toLocaleString(
			event.allDay ? DateTime.DATE : DateTime.DATETIME_SHORT
		)}

		{#if event.allDay}
			{#if DateTime.fromISO(event.end)
				.minus({ days: 1 })
				.toLocaleString(DateTime.DATE) == DateTime.fromISO(event.start).toLocaleString(DateTime.DATE)}
				<!--none-->
			{:else}
				-
				{DateTime.fromISO(event.end).minus({ days: 1 }).toLocaleString(DateTime.DATE)}
			{/if}
		{:else if DateTime.fromISO(event.end).toLocaleString(DateTime.DATE) == DateTime.fromISO(event.start).toLocaleString(DateTime.DATE)}
			-
			{DateTime.fromISO(event.end).toLocaleString(DateTime.TIME_SIMPLE)}
		{:else}
			-
			{DateTime.fromISO(event.end).toLocaleString(DateTime.DATETIME_SHORT)}
		{/if}
	</dd>
</dl>
