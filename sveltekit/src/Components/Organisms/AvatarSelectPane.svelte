<script lang="ts">
	import { PresetAvatars } from '$lib/preset/PresetAvatars';
	import AvatarPreview from '../Atom/AvatarPreview.svelte';
	import { fade } from 'svelte/transition';
	import { _ } from '$lib/i18n';
	export let url: string;

	let avatarSelectOpen = false;
</script>

<div>
	<div>{_('Avatar')}</div>
	<div style="margin-left:auto; margin-right:auto;width:180px;margin-bottom:0.4rem;">
		{#if url}
			{#key url}
				<AvatarPreview {url} />
			{/key}
		{/if}
	</div>
</div>
<button
	on:click={() => {
		avatarSelectOpen = !avatarSelectOpen;
	}}>{avatarSelectOpen ? _('OK') : url ? _('Change Avatar') : _('Set Avatar')}</button
>

{#if avatarSelectOpen}
	<figure transition:fade>
		<div style="display:flex;gap:0.4rem;">
			{#each PresetAvatars as avatar}
				<div style="width:180px">
					<img src={avatar.thumbnailURL} alt="" style="margin-bottom:0.4rem;" />
					<button
						on:click={() => {
							url = avatar.url;
						}}>{_('Select')}</button
					>
				</div>
			{/each}
		</div>
	</figure>
{/if}

<style>
	img {
		border-radius: 1rem;
		min-width: 180px;
		width: 180px;
		height: 180px;
	}
</style>
