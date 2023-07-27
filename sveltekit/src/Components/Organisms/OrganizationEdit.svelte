<script lang="ts">
	import { EmptyOrganization } from '$lib/preset/EmptyOrganization';
	import type { Organization } from '$lib/types/Organization';
	import { onMount } from 'svelte';
	import ModalCloseButton from '../Atom/ModalCloseButton.svelte';
	import InputWithLabel from '../Molecules/InputWithLabel.svelte';
	import axios from 'axios';
	import FilterPagination from './FilterPagination.svelte';
	import { _ } from '$lib/i18n';
	import { page } from '$app/stores';
	export let editOrganization: Organization;
</script>

<InputWithLabel label={_('Organization Name')} bind:value={editOrganization.title} />
<InputWithLabel
	meta={`${_('URL for the organization will be ')}${$page.url.protocol}//${$page.url.host}/${
		editOrganization.slug
	}`}
	label={_('Slug')}
	bind:value={editOrganization.slug}
/>
<InputWithLabel
	label={_('Allow Registration by Users')}
	bind:value={editOrganization.allowRegistration}
	type="switch"
/>
<small>
	{_(
		'If turned ON, any users who visits the URL will be able to get registered under your organization.'
	)}
</small>
