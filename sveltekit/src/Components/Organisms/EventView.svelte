<script lang="ts">
	import type { Attendance as AttendanceType } from '$lib/frontend/Classes/Attendance';
	import type { Event } from '$lib/frontend/Classes/Event';
	import { _ } from '$lib/i18n';
	import type { Organization } from '$lib/types/Organization';
	import { nl2br } from 'mymetaverse-helper';
	import EventDateTimeDisplay from '../Molecules/EventDateTimeDisplay.svelte';
	import Attendance from '../Molecules/Attendance.svelte';
	import { UserStore } from '$lib/store';
	export let event: Event;
	export let organization: Organization;
</script>

<div class="flexOnWideScreen">
	<div style="min-width:14rem">
		<dl>
			<dt>
				<strong>
					{event.summary}
				</strong>
			</dt>
			<dd>
				{@html nl2br(event.description)}
			</dd>
			{#if event.linkTo}
				<dt>{_('URL')}</dt>
				<dd>
					<a href={event.linkTo} target="_blank">{event.linkTo}</a>
				</dd>
			{/if}
		</dl>
		{#if event && organization}
			<section>
				<EventDateTimeDisplay {event} />
			</section>
		{/if}
	</div>
</div>
