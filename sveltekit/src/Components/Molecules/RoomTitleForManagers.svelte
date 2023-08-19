<script lang="ts">
	import type { Room } from '$lib/frontend/Classes/Room';
	import Icon from '../Atom/Icon.svelte';
	import type { Organization } from '$lib/types/Organization';
	import { _ } from '$lib/i18n';
	export let room: Room;
	export let organization: Organization;
	export let forManager = false;
</script>

<div style="display:flex; gap:0.4rem">
	<div>
		<a
			data-tooltip={_('Enter Room')}
			href={'#'}
			on:click={() => {
				location.href = `/${organization?.slug}/${room.slug}`;
			}}
			role="button"
			class=" circle-button"
		>
			<Icon icon="login" />
		</a>
	</div>
	<div style="align-self:center">
		{#if forManager}
			<a href={`/${organization?.slug}/manager/rooms/${room.id}`}>
				{@html room.title}
			</a>
		{:else}
			{@html room.title}
		{/if}
	</div>
</div>
