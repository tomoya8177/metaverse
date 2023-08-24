<script lang="ts">
	import Icon from '../Atom/Icon.svelte';

	export let value = 5;
	export let size = 4;
	export let readonly = false;
</script>

<div style="display:flex">
	{#each [1, 2, 3, 4, 5] as i}
		<a
			href={'#'}
			on:click={() => {
				if (readonly) return;
				value = i;
			}}
			class="star"
			class:selected={value >= i}
		>
			<Icon {size} icon="star" />
		</a>
	{/each}
</div>

<style>
	.star {
		flex: 1;
		text-align: center;
		display: inline-block;
		color: gray;
	}
	.star.selected {
		color: orange;
	}
</style>
