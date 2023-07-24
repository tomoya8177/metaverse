<script lang="ts">
	import { _ } from '$lib/i18n';
	import { ClockPositions } from '$lib/preset/ClockPositions';
	import Icon from '../../../../../../Components/Atom/Icon.svelte';
	import InputWithLabel from '../../../../../../Components/Molecules/InputWithLabel.svelte';
	import type { PageData } from './$types';
	export let data: PageData;
	let objects = data.objects;
</script>

<table>
	<thead>
		<tr>
			<th>{_('Title')}</th>
			<th>{_('Link')}</th>
			<th>{_('Lock Position')}</th>
		</tr>
	</thead>
	{#each objects as object}
		<tr>
			<td>
				{object.title}
				<a href={object.url} target="_blank">
					<Icon icon="open_in_new" />
				</a>
			</td>
			<td>
				{#if object.linkTo}
					<a href={object.linkTo} target="_blank">
						{object.linkTo}
					</a>
				{/if}
			</td>
			<td>
				<InputWithLabel type="select" selects={ClockPositions} bind:value={object.lockedPosition} />
			</td>
		</tr>
	{/each}
</table>
