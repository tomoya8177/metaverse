<script lang="ts">
	import { deleteOrganization } from '$lib/frontend/deleteOrganization';
	import type { PageData } from './$types';
	export let data: PageData;
	import axios from 'axios';
	let organization = data.organization;
</script>

<button
	on:click={async () => {
		if (!confirm('Are you sure that you want to delete this organization?')) return;
		await deleteOrganization(organization);
		location.href = '/';
	}}
	class="secondary">Delete Organization</button
>
