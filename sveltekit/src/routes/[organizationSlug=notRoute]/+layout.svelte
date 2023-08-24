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
	import { User } from '$lib/frontend/Classes/User';

	export let data: PageData;
	let user;
	if (data.user) {
		user = new User(data.user);
	}
	console.log({ user });
	if (user) {
		user.isMember = true;
		if (user.userRole?.role == 'manager') {
			user.isManager = true;
		}
		UserStore.set(user);
	}

	organization = data.organization;
	actionHistory.organization = organization.id;
	console.log({ user: $UserStore });
</script>

<Navigation
	thumbnailURL={organization.thumbnailURL}
	logoLinkTo={'/' + organization.slug}
	title={organization?.title}
/>
<slot />
