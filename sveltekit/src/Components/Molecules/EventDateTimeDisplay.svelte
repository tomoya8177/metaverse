<script lang="ts">
	import type { Event } from '$lib/frontend/Classes/Event';
	import { _ } from '$lib/i18n';
	import { DateTime } from 'luxon';
	import InputWithLabel from './InputWithLabel.svelte';
	export let event: Event;
</script>

<InputWithLabel label={_('All Day')} bind:value={event.allDay} type="switch" disabled />
<label>{_('Start')}</label>
{DateTime.fromISO(event.start).toLocaleString(
	event.allDay ? DateTime.DATE : DateTime.DATETIME_SHORT
)}
{#if DateTime.fromISO(event.end).toISO() != DateTime.fromISO(event.start).plus({ days: 1 }).toISO()}
	<div>
		<label>{_('End')}</label>
		{DateTime.fromISO(event.end).toLocaleString(
			event.allDay ? DateTime.DATE : DateTime.DATETIME_SHORT
		)}
	</div>
{/if}
