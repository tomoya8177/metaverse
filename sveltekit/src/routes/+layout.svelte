<script lang="ts">
	import { Toast } from '$lib/store';
	import { fade } from 'svelte/transition';
</script>

<slot />
{#if $Toast.open}
	<div class="toast" transition:fade>
		{$Toast.message}
	</div>
{/if}

<style>
	.toast {
		position: fixed;
		background-color: darkred;
		color: white;
		bottom: 1rem;
		right: 1rem;
		padding: 1rem;
		border-radius: 0.5rem;
	}
</style>
