<script lang="ts">
	import { GenerateImage } from '$lib/frontend/Classes/GenerateImage';
	import { uploader } from '$lib/frontend/Classes/Uploader';
	import { _ } from '$lib/i18n';
	import type { Organization } from '$lib/types/Organization';
	import SquareThumbnail from '../../../Components/Organisms/SquareThumbnail.svelte';
	import axios from 'axios';
	export let organization: Organization;
	let thumbnailBusy = false;
</script>

{#if organization.thumbnailURL}
	<div style="text-align:center">
		<SquareThumbnail url={organization.thumbnailURL} size="12rem" radius="0.4rem" />
	</div>
{/if}
<div style="text-align:center">
	<a
		role="button"
		style="margin-right:0.4rem;margin-bottom:0.4rem"
		href={'#'}
		on:click={async () => {
			uploader.launchPicker('image/*', 1, async (res) => {
				console.log(res);
				organization.thumbnailURL = res.filesUploaded[0].url;
				if (!organization.id) return;
				await axios.put(`/api/organizations/${organization.id}`, organization);
			});
		}}>{_('Upload')}</a
	>
	<a
		aria-busy={thumbnailBusy}
		role="button"
		href={'#'}
		on:click={async () => {
			thumbnailBusy = true;
			const promise = new GenerateImage(`Icon image for a team called ${organization.title}`);
			promise.onDone((file) => {
				organization.thumbnailURL = file.url;
				axios.put(`/api/organizations/${organization.id}`, organization);
				thumbnailBusy = false;
			});
		}}>{_('Have AI to generate Icon')}</a
	>
</div>
