<script lang="ts">
	import type { User } from '$lib/frontend/Classes/User';
	import { _ } from '$lib/i18n';
	import { PresetAvatars } from '$lib/preset/PresetAvatars';
	import axios from 'axios';
	import { onMount } from 'svelte';
	export let size: string = '3rem';
	export let user: User | null;
	let thumbnailURL = '';
	onMount(async () => {
		if (!user) return;
		if (user.RPMId) {
			const json = await axios
				.get(`https://api.readyplayer.me/v1/avatars/${user.RPMId}.json`)
				.then((res) => res.data);
			thumbnailURL = `https://api.readyplayer.me/v1/avatars/${user.RPMId}.png?uat=${json.uat}}`;
		} else {
			thumbnailURL =
				PresetAvatars.find((avatar) => avatar.url === user.avatarURL)?.thumbnailURL || '';
		}
	});
</script>

<img
	src={thumbnailURL}
	style="width:{size};height:{size};border-radius:{Number(size.replace('rem', '')) /
		2}rem;margin-right:0.4rem"
	alt=""
/>
