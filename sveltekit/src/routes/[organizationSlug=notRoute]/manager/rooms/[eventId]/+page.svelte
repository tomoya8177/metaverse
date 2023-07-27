<script lang="ts">
	import { Event } from '$lib/frontend/Classes/Event';
	import { toast } from '$lib/frontend/toast';
	import { _ } from '$lib/i18n';
	import EventEdit from '../../../../../Components/Organisms/EventEdit.svelte';
	import type { PageData } from './$types';
	export let data: PageData;
	let event = new Event(data.event);
	const organization = data.organization;
	const mentors = data.mentors;
	const users = data.users;
	const onUpdateClicked = async () => {
		if (!(await event.validate())) return;
		updateBusy = true;
		const { updatedEvent, mentor } = await event.update();
		event = new Event({ ...updatedEvent, documents: event.documents });
		updateBusy = false;
		toast(_('Updated'));
	};
	const onDeleteClicked = async () => {
		if (!confirm(_('Are you sure to delete this room?'))) return;
		deleteBusy = true;
		await event.delete();
		deleteBusy = false;
		location.href = '/' + organization.slug + '/manager/rooms';
	};
	let updateBusy = false;
	let deleteBusy = false;
</script>

<EventEdit bind:editEvent={event} {mentors} {users} />
<button aria-busy={updateBusy} on:click={onUpdateClicked}>{_('Update')}</button>
<button aria-busy={deleteBusy} class="secondary" on:click={onDeleteClicked}>{_('Delete')}</button>
