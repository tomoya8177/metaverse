<script lang="ts">
	import { _ } from '$lib/i18n';

	export let editMode: 'update' | 'create';
	export let onCreateClicked: () => void;
	export let onUpdateClicked: () => void;
	export let onDeleteClicked: () => void;
	export let busy: boolean = false;
	export let deleteBusy: boolean = false;
</script>

{#if editMode == 'create'}
	<button aria-busy={busy} on:click={onCreateClicked}>
		{_('Create')}
	</button>
{:else}
	<button aria-busy={busy} on:click={onUpdateClicked}>
		{_('Update')}
	</button>
	<button aria-busy={deleteBusy} on:click={onDeleteClicked}>
		{_('Delete')}
	</button>
{/if}
