<script lang="ts">
	import type { Attendance as AttendanceClass } from '$lib/frontend/Classes/Attendance';
	import type { Event } from '$lib/frontend/Classes/Event';
	import type { SharedObject } from '$lib/frontend/Classes/SharedObject';
	import { UserStore } from '$lib/store';
	import { _ } from '$lib/i18n';
	import { escapeHTML, nl2br } from 'mymetaverse-helper';
	import type { Organization } from '$lib/types/Organization';
	import { DateTime } from 'luxon';
	import Attendance from '../Molecules/Attendance.svelte';
	import EventDateTimeDisplay from '../Molecules/EventDateTimeDisplay.svelte';
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
		<dl>
			<dt>
				<strong>
					{object.title}
				</strong>
			</dt>
			<dd>
				{@html nl2br(object.description)}
			</dd>
			{#if object.linkTo}
				<dt>{_('URL')}</dt>
				<dd>
					<a href={object.linkTo} target="_blank">{object.linkTo}</a>
				</dd>
			{/if}
		</dl>
	</div>
	{#if event && organization}
		{@const attendance = attendances.find((attendance) => attendance.user == $UserStore.id)}
		<div>
			<section>
				<h4>
					{_('Event')}
				</h4>
				<EventDateTimeDisplay {event} />
				{#if event.review}
					{@html nl2br(escapeHTML(event.review))}
				{/if}
			</section>
			{#if attendance}
				<h4>
					{_('RSVP')}
				</h4>
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
