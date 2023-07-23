<script lang="ts">
	import type { Event } from '$lib/frontend/Classes/Event';
	import Icon from '../Atom/Icon.svelte';
	import type { Organization } from '$lib/types/Organization';
	import { _ } from '$lib/i18n';
	export let event: Event;
	export let organization: Organization;
	export let forManager = false;
</script>

<div style="display:flex; gap:0.4rem">
	<div>
		<a
			data-tooltip={_('Enter Room')}
			href={`/${organization?.slug}/${event.slug}`}
			role="button"
			class=" circle-button"
		>
			<Icon icon="login" />
		</a>
	</div>
	<div style="align-self:center">
		{#if forManager}
			<a href={`/${organization?.slug}/manager/rooms/${event.id}`}>
				{event.title}
			</a>
		{:else}
			{event.title}
		{/if}
	</div>
</div>
