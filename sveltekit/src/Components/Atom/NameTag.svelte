<script lang="ts">
	import type { User } from '$lib/frontend/Classes/User';

	export let user: User;
	export let className = '';
	export let size = 16;
	export let border = true;
</script>

<div style="text-align:center">
	<div
		style="display:inline-block;min-width:10rem"
		style:border={border ? '1px solid grey' : 'none'}
	>
		<div class={className}>
			<div style="font-size:{size}px">
				{user.nickname}
			</div>
			<div style="font-size:{(3 * size) / 4}px">
				{user.subtitle || ''}
			</div>
		</div>
	</div>
</div>
