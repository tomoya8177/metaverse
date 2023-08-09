<script lang="ts">
	import type { Event } from '$lib/frontend/Classes/Event';
	import { _ } from '$lib/i18n';

	import InputWithLabel from './InputWithLabel.svelte';
	export let editEvent: Event;
</script>

<InputWithLabel label={_('All Day')} bind:value={editEvent.allDay} type="switch" />
<div style="display:flex;gap:0.2rem">
	<InputWithLabel label={_('Start Date')} bind:value={editEvent.startDate} type="date" />
	{#if !editEvent.allDay}
		<InputWithLabel label={_('Start Time')} bind:value={editEvent.startTime} type="time" />
	{/if}
</div>
<div style="display:flex;gap:0.2rem">
	<InputWithLabel label={_('End Date')} bind:value={editEvent.endDate} type="date" />
	{#if !editEvent.allDay}
		<InputWithLabel label={_('End Time')} bind:value={editEvent.endTime} type="time" />
	{/if}
</div>
