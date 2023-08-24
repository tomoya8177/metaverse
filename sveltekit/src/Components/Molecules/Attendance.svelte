<script lang="ts">
	import type { Attendance } from '$lib/frontend/Classes/Attendance';
	import type { Event } from '$lib/frontend/Classes/Event';
	import type { User } from '$lib/frontend/Classes/User';
	import { DateTime } from 'luxon';

	import AvatarThumbnail from '../Atom/AvatarThumbnail.svelte';
	import Icon from '../Atom/Icon.svelte';
	import { toast } from '$lib/frontend/toast';
	import { _ } from '$lib/i18n';
	import { UserStore } from '$lib/store';
	import { escapeHTML, nl2br } from 'mymetaverse-helper';
	import RatingStars from './RatingStars.svelte';
	import {
		AttendanceStatusOptions,
		AttendanceStatusOptionsWithUnknown
	} from '$lib/types/AttendanceStatus';
	export let user: User;

	export let event: Event;
	export let attendance: Attendance;
	export let onDelete: () => void;
	let attendanceOptions: typeof AttendanceStatusOptions | typeof AttendanceStatusOptionsWithUnknown;
	if (event.end > DateTime.now().toISO()) {
		attendanceOptions = AttendanceStatusOptionsWithUnknown;
	} else {
		attendanceOptions = AttendanceStatusOptions;
	}
</script>

<div>
	<div style="display:flex;gap:0.6rem">
		<div style="flex:1">
			<AvatarThumbnail {user} size="2rem" />

			{user.nickname}
		</div>
		{#if $UserStore.isManager}
			<div style="width:1rem;text-align:right">
				<a
					href={'#'}
					on:click={() => {
						attendance.delete();
						onDelete();
					}}
				>
					<Icon icon="delete" />
				</a>
			</div>
		{/if}
	</div>
	<div style="display:flex;gap:0.2rem">
		{#each attendanceOptions as status}
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
	{#if attendance.status == 'present' || attendance.status == 'late' || attendance.status == 'leftEarly'}
		{#if attendance.stars}
			<RatingStars value={attendance.stars} readonly />
		{/if}
		{#if attendance.review}
			{@html nl2br(escapeHTML(attendance.review))}
		{/if}
	{/if}
</div>
