<script lang="ts">
	import { page } from '$app/stores';
	import { actionHistory } from '$lib/frontend/Classes/ActionHistory';
	import { _ } from '$lib/i18n';
	import { ConfirmDialog, Toast, Toasts } from '$lib/store';
	import { fade } from 'svelte/transition';
	actionHistory.send('visit', {
		path: $page.url.pathname
	});
</script>

<svelte:head>
	{#if !$page.url.host.includes('localhost')}
		<!-- Google tag (gtag.js) -->
		<!-- Google tag (gtag.js) -->
		<!-- Google tag (gtag.js) -->
		<!-- Google tag (gtag.js) -->
		<!-- Google tag (gtag.js) -->
		<!-- Google tag (gtag.js) -->
		<script async src="https://www.googletagmanager.com/gtag/js?id=G-VGNJBD1Q84"></script>
		<script>
			window.dataLayer = window.dataLayer || [];
			function gtag() {
				dataLayer.push(arguments);
			}
			gtag('js', new Date());

			gtag('config', 'G-VGNJBD1Q84');
		</script>
	{/if}
</svelte:head>

<slot />
{#each $Toasts as toast}
	<div
		class:toast-bottom={toast.position == 'bottom'}
		class:toast-top={toast.position == 'top'}
		transition:fade
	>
		{toast.message}
	</div>
{/each}
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
