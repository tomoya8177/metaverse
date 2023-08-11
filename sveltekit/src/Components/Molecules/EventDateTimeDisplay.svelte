<script lang="ts">
	import type { Event } from '$lib/frontend/Classes/Event';
	import { _ } from '$lib/i18n';
	import { DateTime } from 'luxon';
	import InputWithLabel from './InputWithLabel.svelte';
	export let event: Event;
</script>

<dl>
	<dt>
		<InputWithLabel label={_('All Day')} bind:value={event.allDay} type="switch" disabled />
	</dt>
	<dt>{_('Start')}</dt>
	<dd>
		{DateTime.fromISO(event.start).toLocaleString(
			event.allDay ? DateTime.DATE : DateTime.DATETIME_SHORT
		)}
		{#if DateTime.fromISO(event.end).toISO() != DateTime.fromISO(event.start)
				.plus({ days: 1 })
				.toISO()}
			-
			{DateTime.fromISO(event.end).toLocaleString(
				event.allDay
					? DateTime.DATE
					: DateTime.fromISO(event.end).toISODate() == DateTime.fromISO(event.start).toISODate()
					? DateTime.TIME_SIMPLE
					: DateTime.DATETIME_SHORT
			)}
		{/if}
	</dd>
</dl>
