<script lang="ts">
	import { filter } from '$lib/frontend/filter';
	import { _ } from '$lib/i18n';
	import { InputWithLabel } from 'mymetaverseportal-ui-component';

	let keyword: string = '';
	let currentPage: number = 1;
	let maxPage: number = 1;
	export let itemsPerPage: number = 10;
	export let inputArray: any[];
	export let paginated: any[];
	export let withFilter: boolean = true;
	let filtered: any[] = [];
	$: filtered = filter(inputArray, keyword);
	$: maxPage = Math.ceil(filtered.length / itemsPerPage);
	$: paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
</script>

{#if withFilter}
	<InputWithLabel label={_('Search')} bind:value={keyword} />
{/if}
{#if maxPage > 1}
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
{/if}
