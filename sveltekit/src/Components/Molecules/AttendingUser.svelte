<script lang="ts">
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
	import type { Attendance } from '$lib/frontend/Classes/Attendance';
	import { DateTime } from 'luxon';
	import ScheduleEditor from './ScheduleEditor.svelte';
	import AvatarThumbnail from '../Atom/AvatarThumbnail.svelte';
	import { goto } from '$app/navigation';
	export let editEvent: Event;
	export let user: User;
	export let attendances: Attendance[];
	export let withInvitation = true;
	export let withTrash = true;
	let attendance: Attendance | null = null;
	const extractAttendance = (attendances: Attendance[]) => {
		attendance = attendances.find((a) => a.user == user.id) || null;
	};
	$: extractAttendance(attendances);
</script>

{#if attendance}
	<div>
		<div style="display:flex;gap:0.6rem">
			<div style="flex:1">
				<AvatarThumbnail {user} size="2rem" />

				{user.nickname}
			</div>
			{#if withInvitation}
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
			{/if}
			{#if withTrash}
				<div style="width:1rem;text-align:right">
					<a
						href={'#'}
						on:click={() => {
							if (!attendance) return;
							attendance.delete();
							attendances = attendances.filter((a) => a.id != attendance.id);
						}}
					>
						<Icon icon="delete" />
					</a>
				</div>
			{/if}
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
								if (!attendance) return;

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
								if (!attendance) return;

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

<style>
	a[role='button'] {
		padding: 0.5rem;
		border-radius: 0.5rem;
		font-size: 0.8rem;
	}
</style>
