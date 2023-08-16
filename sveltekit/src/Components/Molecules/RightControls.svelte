<script lang="ts">
	import type { Me } from '$lib/frontend/Classes/Me';
	import Icon from '../Atom/Icon.svelte';

	export let me: Me;
</script>

<button
	class="circle-button"
	on:click={() => {
		me.jump();
		const canvas = document.querySelector('canvas');
		console.log({ canvas });
		canvas.click();
	}}
>
	<Icon icon="keyboard_double_arrow_up" />
</button>
