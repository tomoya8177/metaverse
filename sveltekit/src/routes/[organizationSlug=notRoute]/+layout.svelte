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
	import { actionHistory } from '$lib/frontend/Classes/ActionHistory';

	export let data: PageData;
	console.log(1);
	organization = data.organization;
	console.log(2);
	actionHistory.organization = organization.id;
	console.log({ user: $UserStore });
</script>

<svelte:head>
	<title>
		{organization.title} | VirtuaCampus
	</title>
</svelte:head>

<Navigation
	thumbnailURL={organization.thumbnailURL}
	logoLinkTo={'/' + organization.slug}
	title={organization?.title}
/>
<slot />
