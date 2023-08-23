<script lang="ts">
	import { _ } from '$lib/i18n';
	import { ClockPositions } from '$lib/preset/ClockPositions';
	import axios from 'axios';
	import Icon from '../../../../../../Components/Atom/Icon.svelte';
	import type { PageData } from './$types';
	import { toast } from '$lib/frontend/toast';
	import ObjectLockSelect from '../../../../../../Components/Molecules/ObjectLockSelect.svelte';
	import SquareThumbnail from '../../../../../../Components/Organisms/SquareThumbnail.svelte';
	import { SharedObject } from '$lib/frontend/Classes/SharedObject';
	export let data: PageData;
	let organization = data.organization;
	let room = data.room;
	let objects: SharedObject[] = data.objects.map((object: any) => {
		const obj = new SharedObject(object);
		return obj;
	});
</script>

<table>
	<thead>
		<tr>
			<th>{_('Title')}</th>
			<th>{_('Link')}</th>
			<th>{_('Lock Position')}</th>
			<th />
		</tr>
	</thead>
	{#each objects as object}
		<tr>
			<td>
				{#if object.shortType == 'image'}
					<SquareThumbnail url={object.url || object.captionUrl} />
				{/if}
				{object.title}
				<a href={object.url || object.captionUrl} target="_blank">
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
			<td>
				<a
					role="button"
					class="circle-button"
					href={`/${organization.slug}/manager/rooms/${room.id}/objects/${object.id}`}
				>
					<Icon icon="edit" />
				</a>
			</td>
		</tr>
	{/each}
</table>
