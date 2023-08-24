<script lang="ts">
	import { Attendance as AttendanceType } from '$lib/frontend/Classes/Attendance';
	import { Event } from '$lib/frontend/Classes/Event';
	import { InputWithLabel } from 'mymetaverseportal-ui-component';
	import EventView from '../../../../../../Components/Organisms/EventView.svelte';
	import type { PageData } from './$types';
	import { _ } from '$lib/i18n';
	import RatingStars from '../../../../../../Components/Molecules/RatingStars.svelte';
	import Attendance from '../../../../../../Components/Molecules/Attendance.svelte';
	import AttendingUser from '../../../../../../Components/Molecules/AttendingUser.svelte';
	import { User } from '$lib/frontend/Classes/User';
	import { toast } from '$lib/frontend/toast';

	export let data: PageData;
	let organization = data.organization;
	console.log({ event: data.event });
	const event = new Event(data.event);
	let attendances = data.attendances.map((atte: any) => new AttendanceType(atte));
	console.log({ event, attendances });
</script>

<div class="flexOnWideScreen">
	<div>
		<EventView {event} {organization} />
		{_('Review for the class')}

		<InputWithLabel bind:value={event.review} type="textarea" />
	</div>
	<div>
		{_('Review for individual attendees')}
		{#each attendances as attendance}
			<article>
				<AttendingUser
					withTrash={false}
					withInvitation={false}
					editEvent={event}
					bind:attendances
					user={data.users.find((user) => user.id == attendance.user)}
				/>
				{_('Review')}
				<RatingStars bind:value={attendance.stars} size={2} />
				<InputWithLabel bind:value={attendance.review} type="textarea" />
			</article>
		{/each}
	</div>
</div>
<button
	on:click={async () => {
		await event.update();
		const promises = attendances.map((attendance) => attendance.update());
		await Promise.all(promises);
		toast(_('Updated'));
	}}
>
	{_('Update')}
</button>
