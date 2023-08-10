<script lang="ts">
	import type { Attendance } from '$lib/frontend/Classes/Attendance';
	import type { Event } from '$lib/frontend/Classes/Event';
	import type { User } from '$lib/frontend/Classes/User';
	import { DateTime } from 'luxon';

	import AvatarThumbnail from '../Atom/AvatarThumbnail.svelte';
	import Icon from '../Atom/Icon.svelte';
	import { toast } from '$lib/frontend/toast';
	import { _ } from '$lib/i18n';
	export let user: User;

	export let event: Event;
	export let attendance: Attendance;
	export let onDelete: () => void;
</script>

<div>
	<div style="display:flex;gap:0.6rem">
		<div style="flex:1">
			<AvatarThumbnail url={user.avatarURL} size="2rem" />

			{user.nickname}
		</div>

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
	</div>
	{#if event.end > DateTime.now().toISO()}
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
