<script lang="ts">
	import type { Me } from '$lib/frontend/Classes/Me';

	export let me: Me;
</script>

<button
	on:click={() => {
		me.jump();
		const canvas = document.querySelector('canvas');
		console.log({ canvas });
		canvas.click();
	}}>Jump</button
>
