<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import UnderConstruction from '../../Components/Templates/UnderConstruction.svelte';
	import type { Organization } from '$lib/types/Organization';
	import { organizationFromSlug } from '$lib/frontend/organizationFromSlug';
	import Navigation from '../../Components/Organisms/Navigation.svelte';
	let organization: Organization;
	import { UserStore } from '$lib/store';
	import type { PageData } from './$types';

	export let data: PageData;
	organization = data.organization;
	console.log({ user: $UserStore });
</script>

<Navigation logoLinkTo={'/' + organization.slug} title={organization?.title} />
<slot />
