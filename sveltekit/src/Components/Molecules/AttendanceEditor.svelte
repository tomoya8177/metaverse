<script lang="ts">
	import AttendingUser from './AttendingUser.svelte';

	import type { Event } from '$lib/frontend/Classes/Event';
	import { myConfirm, toast } from '$lib/frontend/toast';
	import { _ } from '$lib/i18n';
	import { page } from '$app/stores';
	import { convertLocalToUTC } from '$lib/frontend/convertLocalToUTC';
	import type { Room } from '$lib/frontend/Classes/Room';
	import type { Organization } from '$lib/types/Organization';
	import type { User } from '$lib/frontend/Classes/User';
	import Icon from '../Atom/Icon.svelte';
	import { onMount } from 'svelte';
	import axios from 'axios';
	import { Attendance } from '$lib/frontend/Classes/Attendance';
	import { DateTime } from 'luxon';
	import ScheduleEditor from './ScheduleEditor.svelte';
	import AvatarThumbnail from '../Atom/AvatarThumbnail.svelte';
	import { goto } from '$app/navigation';
	export let editEvent: Event;
	export let users: User[] = [];
	export let attendances: Attendance[] = [];
	export let organization: Organization;
	onMount(async () => {
		attendances = await axios
			.get('/api/attendances?event=' + editEvent.id)
			.then((res) => res.data.map((attendance: Attendance) => new Attendance(attendance)));
	});
</script>

<section>
	<strong>
		{_('Attendance')}
	</strong>
	{#each users.filter((user) => !attendances.some((attendance) => attendance.user == user.id)) as user}
		<div style="display:flex;margin-bottom:0.2rem">
			<div style="flex:1">
				<AvatarThumbnail {user} size="2rem" />
				{user.nickname}
			</div>
			<div style="width:8rem;text-align:right">
				<a
					href={'#'}
					on:click={async () => {
						const newAttendance = new Attendance({
							user: user.id,
							event: editEvent.id,
							status: 'unknown'
						});
						await newAttendance.create();
						attendances.push(newAttendance);
						attendances = attendances;
					}}
				>
					<Icon icon="person_add" />
					{_('Invite')}
				</a>
			</div>
		</div>
	{/each}
</section>
<section>
	<strong>
		{_('Attending Users')}
	</strong>
	{#each attendances as attendance}
		{@const user = users.find((user) => user.id == attendance.user)}
		{#if user}
			<AttendingUser {editEvent} {attendances} {user} />
		{/if}
	{/each}
</section>
<section>
	<button
		on:click={() => {
			goto(`/${organization.slug}/manager/events/${editEvent.id}/review`);
		}}
	>
		{_('Write Review')}
	</button>
</section>
<section>
	<strong>
		{_('Send Invitation')}
		<button
			on:click={async () => {
				const data = await editEvent.ical(users, attendances);
				console.log(data);
				toast(`${_('Sent invitations to users.')}`);
			}}
		>
			<Icon icon="email" />
			{_('Send Invitation')}
		</button>
	</strong>
</section>

<style>
	a[role='button'] {
		padding: 0.5rem;
		border-radius: 0.5rem;
		font-size: 0.8rem;
	}
</style>
