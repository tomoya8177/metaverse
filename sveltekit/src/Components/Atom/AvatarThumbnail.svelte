<script lang="ts">
	import { _ } from '$lib/i18n';
	import { PresetAvatars } from '$lib/preset/PresetAvatars';
	export let url: string;
	export let size: string = '3rem';
</script>

<img
	src={PresetAvatars.find((avatar) => avatar.url == url)?.thumbnailURL}
	style="width:{size};height:{size};border-radius:0.2rem;margin-right:0.4rem"
	alt=""
/>
