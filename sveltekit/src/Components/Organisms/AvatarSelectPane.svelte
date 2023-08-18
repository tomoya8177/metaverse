<script lang="ts">
	import { PresetAvatars } from '$lib/preset/PresetAvatars';
	import AvatarPreview from '../Atom/AvatarPreview.svelte';
	import { fade } from 'svelte/transition';
	import { _ } from '$lib/i18n';
	import { actionHistory } from '$lib/frontend/Classes/ActionHistory';
	import { InputWithLabel } from 'mymetaverseportal-ui-component';
	import ModalCloseButton from '../Atom/ModalCloseButton.svelte';
	import { onDestroy, onMount } from 'svelte';
	export let url: string;
	export let thumbnailURL: string;

	let avatarSelectOpen = false;
	let RPMOpen = false;
</script>

<div>
	<div>{_('Avatar')}</div>
	<div style="margin-left:auto; margin-right:auto;width:180px;margin-bottom:0.4rem;">
		{#if url}
			{#key url}
				<AvatarPreview {url} {thumbnailURL} />
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
	<InputWithLabel
		label={_('Custom Avatar URL')}
		meta={_(
			'If you have ReadyPlayerMe avatar already, paste the URL of your avatar here. If not, click the button, and create one today!'
		)}
		type="url"
		bind:value={url}
	/>
	<button
		on:click={() => {
			RPMOpen = true;
		}}
	>
		{_('Open ReadyPlayerMe')}
	</button>
	<p>{_('If you are in a hurry, please select from existing avatars below.')}</p>
	<figure transition:fade>
		<div style="display:flex;gap:0.4rem;">
			{#each PresetAvatars as avatar}
				<div style="width:180px">
					<a
						href={'#'}
						on:click={() => {
							url = avatar.url;
							actionHistory.send('selectAvatar', { url: avatar.url });
						}}
					>
						<img src={avatar.thumbnailURL} alt="" style="margin-bottom:0.4rem;" />
					</a>
				</div>
			{/each}
		</div>
	</figure>
{/if}
<dialog open={RPMOpen}>
	<article>
		<ModalCloseButton
			onClick={() => {
				RPMOpen = false;
			}}
		/>
		<iframe
			title="ReadyPlayerMe"
			id="frame"
			class="frame"
			allow="camera *; microphone *; clipboard-write"
			src="https://virtuacampus.readyplayer.me?frameApi"
		/>
	</article>
</dialog>

<style>
	iframe {
		width: 650px;
		height: calc(100svh - 6rem);
	}
	article {
		height: calc(100svh - 2rem);
	}
	img {
		border-radius: 1rem;
		min-width: 180px;
		width: 180px;
		height: 180px;
	}
</style>
