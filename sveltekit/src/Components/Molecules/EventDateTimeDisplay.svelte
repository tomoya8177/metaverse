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
	</dd>
	{#if DateTime.fromISO(event.end).toISO() != DateTime.fromISO(event.start)
			.plus({ days: 1 })
			.toISO()}
		<dt>
			{_('End')}
		</dt>
		<dd>
			{DateTime.fromISO(event.end).toLocaleString(
				event.allDay ? DateTime.DATE : DateTime.DATETIME_SHORT
			)}
		</dd>
	{/if}
</dl>
