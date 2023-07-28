<script lang="ts">
	import { page } from '$app/stores';
	import { Toast } from '$lib/store';
	import { fade } from 'svelte/transition';
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
{#if $page.url.host.includes('dev')}
	DEV Environment
{/if}
{#if $page.url.host.includes('localhost')}
	LOCAL Environment
{/if}

<style>
	.toast-bottom {
		position: fixed;
		background-color: darkred;
		color: white;
		bottom: 1rem;
		right: 1rem;
		padding: 1rem;
		border-radius: 0.5rem;
	}
	.toast-top {
		position: fixed;
		background-color: darkred;
		color: white;
		top: 1rem;
		right: 1rem;
		padding: 1rem;
		border-radius: 0.5rem;
	}
</style>
