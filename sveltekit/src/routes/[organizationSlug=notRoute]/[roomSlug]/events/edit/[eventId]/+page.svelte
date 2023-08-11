<script lang="ts">
	import { goto } from '$app/navigation';
	import { calendar } from '$lib/frontend/Classes/Calendar';
	import { Event } from '$lib/frontend/Classes/Event';
	import { User } from '$lib/frontend/Classes/User';
	import ModalCloseButton from '../../../../../../Components/Atom/ModalCloseButton.svelte';

	import EventEdit from '../../../../../../Components/Organisms/EventEdit.svelte';
	import type { PageData } from './$types';
	export let data: PageData;
	let event = new Event(data.event);
	let users = data.users.map((user) => new User(user));
</script>

<dialog open>
	<article>
		<ModalCloseButton href={`/${data.organization.slug}/${data.room.slug}/events/${event.id}`} />
		<EventEdit
			editEvent={event}
			organization={data.organization}
			{users}
			onCreateDone={() => {}}
			onUpdateDone={() => {
				calendar.updateEvent(event);
				goto(`/${data.organization.slug}/${data.room.slug}/events/${event.id}`);
			}}
			onDeleteDone={() => {
				calendar.removeEvent(event.id);
				goto(`/${data.organization.slug}/${data.room.slug}/events/${event.id}`);
			}}
		/>
	</article>
</dialog>
