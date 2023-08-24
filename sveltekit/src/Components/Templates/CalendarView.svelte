<script lang="ts">
	import { calendar } from '$lib/frontend/Classes/Calendar';
	import type { Event } from '$lib/frontend/Classes/Event';
	import { onMount } from 'svelte';
	export let events: Event[];
	export let onEventClicked: (eventId: string) => void;
	onMount(() => {
		const el = document.getElementById('calendar') as HTMLElement;
		calendar.init(el, events, onEventClicked);
		calendar.render();
	});
</script>

<div id="calendar" />
