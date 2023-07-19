<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import UnderConstruction from '../../Components/Templates/UnderConstruction.svelte';
	import type { Organization } from '$lib/types/Organization';
	import { organizationFromSlug } from '$lib/frontend/organizationFromSlug';
	import Navigation from '../../Components/Organisms/Navigation.svelte';
	let organization: Organization;
	onMount(async () => {
		organization = await organizationFromSlug($page.params.organizationSlug);
	});
</script>

<Navigation title={organization?.title} />
<slot></slot>