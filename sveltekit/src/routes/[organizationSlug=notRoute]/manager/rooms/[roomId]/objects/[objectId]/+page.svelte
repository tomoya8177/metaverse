<script lang="ts">
	import { goto } from '$app/navigation';
	import { Event } from '$lib/frontend/Classes/Event';
	import { Room } from '$lib/frontend/Classes/Room';
	import { SharedObject } from '$lib/frontend/Classes/SharedObject';
	import { toast } from '$lib/frontend/toast';
	import { _ } from '$lib/i18n';

	import LinkEditor from '../../../../../../../Components/Organisms/LinkEditor.svelte';
	import type { PageData } from './$types';
	export let data: PageData;
	let room = new Room(data.room);
	let editObject = new SharedObject(data.object);
	let editEvent = data.event ? new Event(data.event) : undefined;
	let organization = data.organization;
</script>

<LinkEditor
	canAttachCaption={true}
	editMode="update"
	bind:editObject
	{room}
	{editEvent}
	{organization}
	attachEvent={!!editEvent}
	onCreate={(sharedObject) => {
		goto(`/${organization.slug}/manager/rooms/${room.id}/objects`);
	}}
	onUpdate={(sharedObject) => {
		goto(`/${organization.slug}/manager/rooms/${room.id}/objects`);
		toast(_('Updated'));
	}}
	onDelete={(sharedObject) => {
		goto(`/${organization.slug}/manager/rooms/${room.id}/objects`);

		toast(_('Deleted'));
	}}
/>
