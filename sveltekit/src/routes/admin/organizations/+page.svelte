<script lang="ts">
	import OrganizationEdit from '../../../Components/Organisms/OrganizationEdit.svelte';

	import { EmptyOrganization } from '$lib/preset/EmptyOrganization';
	import type { Organization } from '$lib/types/Organization';
	import { onMount } from 'svelte';
	import ModalCloseButton from '../../../Components/Atom/ModalCloseButton.svelte';
	import InputWithLabel from '../../../Components/Molecules/InputWithLabel.svelte';
	import axios from 'axios';
	import FilterPagination from '../../../Components/Organisms/FilterPagination.svelte';
	import { _ } from '$lib/i18n';
	import { checkSlugForOrganization } from '$lib/frontend/checkSlugForOrganization';
	import { deleteOrganization } from '$lib/frontend/deleteOrganization';
	import { myAlert } from '$lib/frontend/toast';
	let editOrganization: Organization = EmptyOrganization;
	let editMode: 'update' | 'create' = 'update';
	let organizations: Organization[] = [];
	let modalOpen = false;
	let paginated: Organization[] = [];
	onMount(async () => {
		organizations = await axios.get('/api/organizations').then((res) => res.data);
	});

	const onCreateClicked = async () => {
		if (!(await checkSlugForOrganization(editOrganization.slug, editOrganization))) return;
		if (!editOrganization.title) return myAlert(_('Please enter a title'));
		const newOrg = await axios.post('/api/organizations', editOrganization).then((res) => res.data);
		organizations = [...organizations, newOrg].sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
		modalOpen = false;
	};
	const onUpdateClicked = async () => {
		if (!(await checkSlugForOrganization(editOrganization.slug, editOrganization))) return;

		if (!editOrganization.title) return myAlert(_('Please enter a title'));
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

<h2>{_('Organizations')}</h2>
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
		}}>{_('New Organization')}</button
	>
</div>
<FilterPagination inputArray={organizations} bind:paginated />
<table>
	<thead>
		<tr>
			<th>{_('Organization Name')}</th>
			<th>{_('Edit')}</th>
		</tr>
	</thead>
	<tbody>
		{#each paginated as org}
			<tr>
				<td>
					<a href={`/${org.slug}`}>
						{org.title}
					</a>
				</td>
				<td>
					<button
						on:click={() => {
							editOrganization = org;
							editMode = 'update';
							modalOpen = true;
						}}>{_('Edit')}</button
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
			<OrganizationEdit {editOrganization} />
			{#if editMode == 'create'}
				<button
					on:click={() => {
						onCreateClicked();
					}}>{_('Create')}</button
				>
			{:else}
				<button
					on:click={() => {
						onUpdateClicked();
					}}>{_('Update')}</button
				>
				<button
					class="secondary"
					on:click={async () => {
						if (!confirm(_('Are you sure that you want to delete this organization?'))) return;
						await deleteOrganization(editOrganization);
						modalOpen = false;
						organizations = organizations.filter((org) => org.id != editOrganization.id);
					}}
				>
					{_('Delete')}
				</button>
			{/if}
		</article>
	</dialog>
{/if}
