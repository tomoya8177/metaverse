<script lang="ts">
	import { _ } from '$lib/i18n';
	import type { PageData } from './$types';
	export let data: PageData;
	let objects = data.objects;
</script>

<table>
	<thead>
		<tr>
			<th>{_('Title')}</th>
			<th>{_('Link')}</th>
		</tr>
	</thead>
	{#each objects as object}
		<tr>
			<td>
				{object.title}
			</td>
			<td>
				<a href={object.linkTo} target="_blank">
					{object.linkTo}
				</a>
			</td></tr
		>
	{/each}
</table>
