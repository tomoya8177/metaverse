<script lang="ts">
	import AttendanceEditor from './AttendanceEditor.svelte';

	import { Event } from '$lib/frontend/Classes/Event';
	import { myConfirm, toast } from '$lib/frontend/toast';
	import { _ } from '$lib/i18n';
	import { page } from '$app/stores';
	import InputWithLabel from '../../../../Components/Molecules/InputWithLabel.svelte';
	import { convertLocalToUTC } from '$lib/frontend/convertLocalToUTC';
	import type { Room } from '$lib/frontend/Classes/Room';
	import type { Organization } from '$lib/types/Organization';
	import type { User } from '$lib/frontend/Classes/User';
	import Icon from '../../../../Components/Atom/Icon.svelte';
	import { onMount } from 'svelte';
	import axios from 'axios';
	import { Attendance } from '$lib/frontend/Classes/Attendance';
	import { DateTime } from 'luxon';
	import ScheduleEditor from '../../../../Components/Molecules/ScheduleEditor.svelte';
	import LinkUrlDescriptionEditor from '../../../../Components/Molecules/LinkURLDescriptionEditor.svelte';
	export let editEvent: Event;
	export let editMode: 'create' | 'update' = 'update';
	export let modalOpen: boolean = true;
	export let organization: Organization;
	export let rooms: Room[];
	export let users: User[];
	export let onUpdateDone: (event: Event) => void;
	export let onDeleteDone: (event: Event) => void;
	export let onCreateDone: (event: Event) => void;
</script>

<div class="flexOnWideScreen">
	<div>
		<InputWithLabel label={_('Title')} bind:value={editEvent.summary} />
		<ScheduleEditor bind:editEvent />
		<LinkUrlDescriptionEditor bind:editItem={editEvent} {organization} />
	</div>
	<div>
		<AttendanceEditor bind:editEvent bind:users />
	</div>
</div>

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
	<button class="secondary" on:click={() => (modalOpen = false)}>{_('Cancel')}</button>
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
	<button class="secondary" on:click={() => (modalOpen = false)}>{_('Cancel')}</button>
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
	a[role='button'] {
		padding: 0.5rem;
		border-radius: 0.5rem;
		font-size: 0.8rem;
	}
</style>
