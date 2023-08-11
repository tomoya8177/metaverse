<script lang="ts">
	import ModalCloseButton from '../../../../../Components/Atom/ModalCloseButton.svelte';
	import ViewEvent from '../../../../../Components/Organisms/ViewEvent.svelte';
	import { UserStore } from '$lib/store';
	import type { PageData } from './$types';
	import { Attendance } from '$lib/frontend/Classes/Attendance';
	import { _ } from '$lib/i18n';
	import { myAlert, myConfirm } from '$lib/frontend/toast';
	import { goto } from '$app/navigation';
	import { Event } from '$lib/frontend/Classes/Event';
	import axios from 'axios';
	import { calendar } from '$lib/frontend/Classes/Calendar';
	export let data: PageData;
	let event = new Event(data.event);
	let attendances: Attendance[] = data.attendances.map(
		(attendance: any) => new Attendance(attendance)
	);
</script>

<dialog open>
	<article style="max-width:calc(100vw - 2rem)">
		<ModalCloseButton href={`/${data.organization.slug}/${data.room.slug}/events`} />
		<ViewEvent
			{event}
			attendance={attendances.find((attendance) => attendance.user == $UserStore.id)}
		/>
		{#if $UserStore.isManager}
			<button
				on:click={async () => {
					if (event.object) {
						const object = await axios.get('/api/objects/' + event.object).then((res) => res.data);
						if (!object) {
							goto(`/${data.organization.slug}/${data.room.slug}/events/edit/${event.id}`);
							return;
						} else if (object.room == data.room.id) {
							goto(`/${data.organization.slug}/${data.room.slug}/editCard/${event.object}`);
							return;
						} else {
							myAlert(
								_(
									'This event is attached to an object in another room. You can only edit the object in the room it is attached to.'
								)
							);
							return;
						}
					}
					goto(`/${data.organization.slug}/${data.room.slug}/events/edit/${event.id}`);
				}}
			>
				{_('Edit')}
			</button>
			<button
				class="secondary"
				on:click={async () => {
					if (event.object) {
						const object = await axios.get('/api/objects/' + event.object).then((res) => res.data);
						if (!object) {
						} else if (object.room == data.room.id) {
						} else {
							myAlert(
								_(
									'This event is attached to an object in another room. You can only edit the object in the room it is attached to.'
								)
							);
							return;
						}
					}
					if (!(await myConfirm(_('Are you sure?')))) return;
					await event.delete();
					calendar.removeEvent(event.id);
					goto(`/${data.organization.slug}/${data.room.slug}/events`);
				}}
			>
				{_('Delete')}
			</button>
		{/if}
	</article>
</dialog>
