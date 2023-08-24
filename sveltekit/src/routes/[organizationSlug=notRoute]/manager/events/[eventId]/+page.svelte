<script lang="ts">
	import { goto } from '$app/navigation';
	import { Event } from '$lib/frontend/Classes/Event';
	import { Room } from '$lib/frontend/Classes/Room';
	import { SharedObject } from '$lib/frontend/Classes/SharedObject';
	import { convertUTCToLocal } from '$lib/frontend/convertLocalToUTC';
	import { toast } from '$lib/frontend/toast';
	import { _ } from '$lib/i18n';
	import LinkEditor from '../../../../../Components/Organisms/LinkEditor.svelte';
	import EventEdit from '../../../../../Components/Organisms/EventEdit.svelte';

	import type { PageData } from './$types';
	export let data: PageData;
	console.log({ data });
	let editEvent = new Event(data.event);
	console.log({ editEvent });

	let editObject = editEvent.object ? new SharedObject(data.object) : undefined;
	let room = editObject?.room ? new Room(data.room) : undefined;
	let organization = data.organization;

	let users = data.users;
</script>

{#if editObject}
	<LinkEditor
		canAttachCaption={true}
		editMode="update"
		bind:editObject
		{room}
		{editEvent}
		{organization}
		attachEvent={!!editEvent}
		onCreate={(sharedObject) => {
			goto(`/${organization.slug}/manager/events`);
			toast(_('Created'));
		}}
		onUpdate={(sharedObject) => {
			goto(`/${organization.slug}/manager/events`);
			toast(_('Updated'));
		}}
		onDelete={(sharedObject) => {
			goto(`/${organization.slug}/manager/events`);

			toast(_('Deleted'));
		}}
	/>
{:else}
	<EventEdit
		{users}
		{organization}
		editMode="update"
		{editEvent}
		onCreateDone={(sharedObject) => {
			goto(`/${organization.slug}/manager/events`);
			toast(_('Created'));
		}}
		onUpdateDone={(sharedObject) => {
			goto(`/${organization.slug}/manager/events`);
			toast(_('Updated'));
		}}
		onDeleteDone={(sharedObject) => {
			goto(`/${organization.slug}/manager/events`);

			toast(_('Deleted'));
		}}
	/>
{/if}
