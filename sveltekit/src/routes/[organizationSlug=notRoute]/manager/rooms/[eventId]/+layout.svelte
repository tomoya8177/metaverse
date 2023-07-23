<script lang="ts">
	import { _ } from '$lib/i18n';
	import InputWithLabel from '../../../../../Components/Molecules/InputWithLabel.svelte';
	import RoomTitleForManagers from '../../../../../Components/Molecules/RoomTitleForManagers.svelte';
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import EventEdit from '../../../../../Components/Organisms/EventEdit.svelte';
	import { Event } from '$lib/frontend/Classes/Event';
	import { toast } from '$lib/frontend/toast';
	import { fade } from 'svelte/transition';
	export let data: PageData;
	let event = new Event(data.event);
	const organization = data.organization;
	const mentor = data.mentor;
	const mentors = data.mentors;
	const users = data.users;
	let objects = data.objects;

	let tab = 'basic';
	if ($page.url.href.includes('objects')) tab = 'objects';
</script>

<h3>
	<RoomTitleForManagers {event} {organization} />
</h3>

<InputWithLabel
	label={_('URL')}
	type="url"
	value={`${$page.url.protocol}//${$page.url.host}/${organization.slug}/${event.slug}`}
	readonly
	copiable
/>
<hr />
<nav>
	<ul>
		<li>
			<a
				href={`/${organization.slug}/manager/rooms/${event.id}`}
				on:click={() => {
					tab = 'basic';
				}}
				role="button"
				class:secondary={tab != 'basic'}
			>
				Basic Setting
			</a>
		</li>
		<li>
			<a
				href={`/${organization.slug}/manager/rooms/${event.id}/objects`}
				on:click={() => {
					tab = 'objects';
				}}
				role="button"
				class:secondary={tab != 'objects'}
			>
				Objects
			</a>
		</li>
	</ul>
</nav>
<slot />
<hr />

<style>
</style>
