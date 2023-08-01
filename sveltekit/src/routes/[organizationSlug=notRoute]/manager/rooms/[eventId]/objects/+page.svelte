<script lang="ts">
	import { _ } from '$lib/i18n';
	import { ClockPositions } from '$lib/preset/ClockPositions';
	import axios from 'axios';
	import Icon from '../../../../../../Components/Atom/Icon.svelte';
	import InputWithLabel from '../../../../../../Components/Molecules/InputWithLabel.svelte';
	import type { PageData } from './$types';
	import { toast } from '$lib/frontend/toast';
	import ObjectLockSelect from '../../../../../../Components/Molecules/ObjectLockSelect.svelte';
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
				<ObjectLockSelect bind:object />
			</td>
		</tr>
	{/each}
</table>
