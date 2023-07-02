<script lang="ts">
	import { filter } from '$lib/frontend/filter';

	import InputWithLabel from '../Molecules/InputWithLabel.svelte';
	let keyword: string = '';
	let currentPage: number = 1;
	let maxPage: number = 1;
	export let itemsPerPage: number = 5;
	export let inputArray: any[];
	export let paginated: any[];
	export let withFilter: boolean = true;
	let filtered: any[] = [];
	$: filtered = filter(inputArray, keyword);
	$: maxPage = Math.ceil(filtered.length / itemsPerPage);
	$: paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
</script>

{#if withFilter}
	<InputWithLabel label="Search" bind:value={keyword} />
{/if}
<div style="display:flex;gap:0.4rem">
	{#each Array.from({ length: maxPage }) as _, i}
		<a
			role="button"
			href={'#'}
			class:outline={currentPage != i + 1}
			on:click={() => (currentPage = i + 1)}
			>{i + 1}
		</a>
	{/each}
</div>
