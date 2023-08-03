<script lang="ts">
	import type { User } from '$lib/frontend/Classes/User';
	import { cookies } from '$lib/frontend/cookies';
	import { _ } from '$lib/i18n';
	import InputWithLabel from '../Molecules/InputWithLabel.svelte';

	export let user: User;
	const swapLocales = ['ja', 'ko', 'zh'];
</script>

{#if swapLocales.includes(cookies.get('locale'))}
	<InputWithLabel label={_('Last Name')} bind:value={user.lastName} />
	<InputWithLabel label={_('First Name')} bind:value={user.firstName} />
{:else}
	<InputWithLabel label={_('First Name')} bind:value={user.firstName} />
	<InputWithLabel label={_('Last Name')} bind:value={user.lastName} />
{/if}
