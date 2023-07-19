<script lang="ts">
	import { organizationFromSlug } from '$lib/frontend/organizationFromSlug';
	import type { Organization } from '$lib/types/Organization';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	let organization: Organization | null = null;
	onMount(async () => {
		organization = await organizationFromSlug($page.params.organizationSlug);
	});
</script>

{#if organization}
	<div class="container">
		If you are a manager, pleave visit
		<a href={`/${organization.slug}/manager`}> the Manager's console </a>
	</div>
{/if}
