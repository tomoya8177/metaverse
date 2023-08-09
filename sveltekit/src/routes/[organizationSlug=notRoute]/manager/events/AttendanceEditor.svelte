<script lang="ts">
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
	import AvatarThumbnail from '../../../../Components/Atom/AvatarThumbnail.svelte';
	export let editEvent: Event;
	export let users: User[] = [];
	export let attendances: Attendance[] = [];
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
				<AvatarThumbnail url={user.avatarURL} size="2rem" />
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
			<div>
				<div style="display:flex;gap:0.6rem">
					<div style="flex:1">
						<AvatarThumbnail url={user.avatarURL} size="2rem" />

						{user.nickname}
					</div>
					<div>
						<a
							href={'#'}
							on:click={async () => {
								const data = await editEvent.ical([user], attendances);
								console.log(data);
								toast(`${_('Sent an invitation to ')}${user.nickname}`);
							}}
						>
							<Icon icon="email" />
							{_('Send Invitation')}
						</a>
					</div>
					<div style="width:1rem;text-align:right">
						<a
							href={'#'}
							on:click={() => {
								attendance.delete();
								attendances = attendances.filter((a) => a.id != attendance.id);
							}}
						>
							<Icon icon="delete" />
						</a>
					</div>
				</div>
				{#if editEvent.end > DateTime.now().toISO()}
					<div style="display:flex;gap:0.2rem">
						{#each [{ key: 'unknown', label: _('Unknown') }, { key: 'attending', label: _('Attending') }, { key: 'notAttending', label: _('Not Attending') }] as status}
							<div>
								<a
									class:outline={attendance.status != status.key}
									href={'#'}
									role="button"
									on:click={async () => {
										status.key = status.key;
										attendance.status = status.key;
										await attendance.update();
										toast(_('Updated'));
									}}
								>
									{status.label}
								</a>
							</div>
						{/each}
					</div>
				{:else}
					<div style="display:flex;gap:0.2rem">
						{#each [{ key: 'present', label: _('Present') }, { key: 'absent', label: _('Absent') }, { key: 'late', label: _('Late') }, { key: 'excused', label: _('Excused') }, { key: 'leftEarly', label: _('Left Early') }] as status}
							<div>
								<a
									class:outline={attendance.status != status.key}
									href={'#'}
									role="button"
									on:click={async () => {
										attendance.status = status.key;
										await attendance.update();
										toast(_('Updated'));
									}}
								>
									{status.label}
								</a>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	{/each}
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
