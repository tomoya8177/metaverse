<script lang="ts">
	import { EmptyOrganization } from '$lib/preset/EmptyOrganization';
	import type { Organization } from '$lib/types/Organization';
	import { onMount } from 'svelte';
	import ModalCloseButton from '../../../Components/Atom/ModalCloseButton.svelte';
	import InputWithLabel from '../../../Components/Molecules/InputWithLabel.svelte';
	import axios from 'axios';
	import FilterPagination from '../../../Components/Organisms/FilterPagination.svelte';
	let editOrganization: Organization = EmptyOrganization;
	let editMode: 'update' | 'create' = 'update';
	let organizations: Organization[] = [];
	let modalOpen = false;
	let paginated: Organization[] = [];
	onMount(async () => {
		organizations = await axios.get('/api/organizations').then((res) => res.data);
	});
	const onCreateClicked = async () => {
		if (!editOrganization.title) return alert('Please enter a title');
		const newOrg = await axios.post('/api/organizations', editOrganization).then((res) => res.data);
		organizations = [...organizations, newOrg].sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
		modalOpen = false;
	};
	const onUpdateClicked = async () => {
		if (!editOrganization.title) return alert('Please enter a title');
		const updatedOrg = await axios
			.put('/api/organizations/' + editOrganization.id, editOrganization)
			.then((res) => res.data);
		organizations = organizations.map((org) => {
			if (org.id == updatedOrg.id) {
				return updatedOrg;
			}
			return org;
		});
		modalOpen = false;
	};
</script>

<h2>Organizations</h2>
<div style="width:14rem">
	<button
		on:click={() => {
			editOrganization = EmptyOrganization;
			editMode = 'create';
			organizations.forEach((org) => {
				org.checked = false;
				org.isManager = false;
			});
			modalOpen = true;
		}}>New Organization</button
	>
</div>
<FilterPagination inputArray={organizations} bind:paginated />
<table>
	<thead>
		<tr>
			<th>Title</th>
			<th>Edit</th>
		</tr>
	</thead>
	<tbody>
		{#each paginated as org}
			<tr>
				<td>{org.title}</td>
				<td>
					<button
						on:click={() => {
							editOrganization = org;
							editMode = 'update';
							modalOpen = true;
						}}>Edit</button
					>
				</td>
			</tr>
		{/each}
	</tbody>
</table>
{#if modalOpen}
	<dialog open>
		<article>
			<ModalCloseButton onClick={() => (modalOpen = false)} />
			<InputWithLabel label="Title" bind:value={editOrganization.title} />
			{#if editMode == 'create'}
				<button
					on:click={() => {
						onCreateClicked();
					}}>Create</button
				>
			{:else}
				<button
					on:click={() => {
						onUpdateClicked();
					}}>Update</button
				>
			{/if}
		</article>
	</dialog>
{/if}
