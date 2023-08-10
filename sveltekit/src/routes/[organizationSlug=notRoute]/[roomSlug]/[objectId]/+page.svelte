<script lang="ts">
	import { Event } from '$lib/frontend/Classes/Event';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import type { PageData } from './$types';
	import { sharedObjects } from '$lib/frontend/Classes/SharedObjects';
	import ViewObject from '../../../../Components/Templates/ViewObject.svelte';
	import type { Organization } from '$lib/types/Organization';
	import { goto } from '$app/navigation';
	import { Attendance } from '$lib/frontend/Classes/Attendance';
	export let data: PageData;
	let object = sharedObjects.get($page.params.objectId);
	if (!object) {
		goto(`/${data.organization.slug}/${data.room.slug}`);
	}
	let event = data.event ? new Event(data.event) : undefined;
	let attendances: Attendance[] = [];
	console.log({ event });
	if (event) {
		attendances = data.attendances.map((atte) => new Attendance(atte));
	}
	let organization: Organization = data.organization;
	let room = data.room;

	onMount(() => {});
</script>

{#if object}
	<dialog open>
		<article>
			<a href={`/${organization.slug}/${room.slug}`} aria-label="Close" class="close" />
			<ViewObject {object} {event} {organization} {attendances} />
		</article>
	</dialog>
{/if}

<style>
	article {
		max-width: calc(100vw - 2rem);
	}
</style>
