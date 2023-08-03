<script lang="ts">
	import { page } from '$app/stores';
	import { PUBLIC_IS_DEV } from '$env/static/public';
	import { actionHistory } from '$lib/frontend/Classes/actionHistory';
	import { _ } from '$lib/i18n';
	import { ConfirmDialog, Toast, UserStore } from '$lib/store';
	import { fade } from 'svelte/transition';
	actionHistory.send('visit', {
		path: $page.url.pathname
	});
</script>

<slot />
{#if $Toast.open}
	<div
		class:toast-bottom={$Toast.position == 'bottom'}
		class:toast-top={$Toast.position == 'top'}
		transition:fade
	>
		{$Toast.message}
	</div>
{/if}
<dialog id="myConfirmDialog" data-testid="myConfirmDialog" open={$ConfirmDialog.open}>
	<article>
		{$ConfirmDialog.message}
		<div style="display:flex; margin-top:1rem">
			<div style="flex:1;">
				<a
					href={'#'}
					role="button"
					on:click={() => {
						$ConfirmDialog.result = true;
					}}
				>
					{_('OK')}
				</a>
			</div>
			<div>
				<a
					class="secondary"
					role="button"
					href={'#'}
					on:click={() => {
						$ConfirmDialog.result = false;
					}}
				>
					{_('Cancel')}
				</a>
			</div>
		</div>
	</article>
</dialog>

<style>
	.toast-bottom {
		position: fixed;
		background-color: lightseagreen;
		color: white;
		bottom: 1rem;
		right: 1rem;
		padding: 1rem;
		border-radius: 0.5rem;
		z-index: 1000;
		max-width: calc(100vw - 2rem);
	}
	.toast-top {
		position: fixed;
		background-color: darkred;
		color: white;
		top: 1rem;
		right: 1rem;
		padding: 1rem;
		border-radius: 0.5rem;
		z-index: 1000;
		max-width: calc(100vw - 2rem);
	}
</style>
