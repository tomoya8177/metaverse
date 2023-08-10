<script lang="ts">
	import type { Attendance as AttendanceClass } from '$lib/frontend/Classes/Attendance';
	import type { Event } from '$lib/frontend/Classes/Event';
	import type { SharedObject } from '$lib/frontend/Classes/SharedObject';
	import { UserStore } from '$lib/store';
	import { _ } from '$lib/i18n';
	import { nl2br } from '$lib/math/nl2br';
	import type { Organization } from '$lib/types/Organization';
	import InputWithLabel from '../Molecules/InputWithLabel.svelte';
	import { DateTime } from 'luxon';
	import Attendance from '../Molecules/Attendance.svelte';
	export let object: SharedObject;
	export let event: Event | null = null;
	export let organization: Organization | null = null;
	export let attendances: AttendanceClass[] = [];
	console.log({ attendances });
</script>

<div class="flexOnWideScreen">
	<div style="min-width:14rem">
		<h4>
			{_('Object')}
		</h4>
		<div>
			<label>{_('Title')}</label>
			{object.title}
		</div>
		{#if object.linkTo}
			<div>
				<label>{_('URL')}</label>
				<a href={object.linkTo} target="_blank">{object.linkTo}</a>
			</div>
		{/if}
		<div>
			<label>{_('Description')}</label>
			{@html nl2br(object.description)}
		</div>
	</div>
	{#if event && organization}
		{@const attendance = attendances.find((attendance) => attendance.user == $UserStore.id)}
		<div>
			<h4>
				{_('Event')}
			</h4>
			<InputWithLabel label={_('All Day')} bind:value={event.allDay} type="switch" disabled />
			<div>
				<label>{_('Start')}</label>
				{DateTime.fromISO(event.start).toLocaleString(
					event.allDay ? DateTime.DATE : DateTime.DATETIME_SHORT
				)}
			</div>
			<div>
				<label>{_('End')}</label>
				{DateTime.fromISO(event.end).toLocaleString(
					event.allDay ? DateTime.DATE : DateTime.DATETIME_SHORT
				)}
			</div>
			{#if attendance}
				You are attending
				<Attendance
					user={$UserStore}
					{event}
					{attendance}
					onDelete={() => {
						attendances = attendances.filter((attendance) => attendance.user != $UserStore.id);
					}}
				/>
			{/if}
		</div>
	{/if}
	{#if object.shortType == 'image'}
		<div>
			<img src={object.url} style="width:20rem;" alt="" crossorigin="anonymous" />
		</div>
	{/if}
</div>
