<script lang="ts">
	import { Event } from '$lib/frontend/Classes/Event';
	import { myConfirm, toast } from '$lib/frontend/toast';
	import { _ } from '$lib/i18n';
	import { page } from '$app/stores';
	import InputWithLabel from '../../../../Components/Molecules/InputWithLabel.svelte';
	import { convertLocalToUTC } from '$lib/frontend/convertLocalToUTC';
	import type { Room } from '$lib/frontend/Classes/Room';
	import type { Organization } from '$lib/types/Organization';
	export let editEvent: Event;
	export let editMode: 'create' | 'update' = 'update';
	export let modalOpen: boolean;
	export let organization: Organization;
	export let rooms: Room[];
	export let onUpdateDone: (event: Event) => void;
	export let onDeleteDone: (event: Event) => void;
	export let onCreateDone: (event: Event) => void;
</script>

<InputWithLabel label={_('Title')} bind:value={editEvent.summary} />
<div style="display:flex">
	<InputWithLabel label={_('Start Date')} bind:value={editEvent.startDate} type="date" />
	{#if !editEvent.allDay}
		<InputWithLabel label={_('Start Time')} bind:value={editEvent.startTime} type="time" />
	{/if}
	<InputWithLabel label={_('All Day')} bind:value={editEvent.allDay} type="switch" />
</div>
<div style="display:flex">
	<InputWithLabel label={_('End Date')} bind:value={editEvent.endDate} type="date" />
	{#if !editEvent.allDay}
		<InputWithLabel label={_('End Time')} bind:value={editEvent.endTime} type="time" />
	{/if}
</div>
<InputWithLabel
	label={_('Link to Room')}
	bind:value={editEvent.url}
	type="select"
	selects={[
		{
			name: _('No Link'),
			value: ''
		},
		...rooms.map((room) => {
			return {
				name: room.title,
				value: `${$page.url.protocol}//${$page.url.host}/${organization.slug}/${room.id}`
			};
		})
	]}
/>
<InputWithLabel label={_('URL')} bind:value={editEvent.url} type="url" />
<InputWithLabel label={_('Location')} bind:value={editEvent.location} />
<InputWithLabel label={_('Description')} bind:value={editEvent.description} type="textarea" />

{#if editMode == 'create'}
	<button
		on:click={async () => {
			if (!editEvent.validate()) return;
			modalOpen = false;
			editEvent.start = convertLocalToUTC(editEvent.start);
			editEvent.end = convertLocalToUTC(editEvent.end);
			console.log(editEvent.start, editEvent.end);
			const createdEvent = new Event(await editEvent.create());
			toast(_('Created'));
			onCreateDone(createdEvent);
		}}>{_('Create')}</button
	>
{:else}
	<button
		on:click={async () => {
			if (!editEvent.validate()) return;
			//close modal first
			modalOpen = false;

			editEvent.start = convertLocalToUTC(editEvent.start);
			editEvent.end = convertLocalToUTC(editEvent.end);
			await editEvent.update();
			toast(_('Updated'));
			onUpdateDone(editEvent);
		}}>{_('Update')}</button
	>
	<button
		class="secondary"
		on:click={async () => {
			if (!(await myConfirm(_('Are you sure?')))) {
				return;
			}
			modalOpen = false;

			await editEvent.delete();
			toast(_('Deleted'));
			onDeleteDone(editEvent);
		}}>{_('Delete')}</button
	>
{/if}

<style>
</style>
