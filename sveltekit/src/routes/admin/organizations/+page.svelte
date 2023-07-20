<script lang="ts">
	import { EmptyOrganization } from '$lib/preset/EmptyOrganization';
	import type { Organization } from '$lib/types/Organization';
	import { onMount } from 'svelte';
	import ModalCloseButton from '../../../Components/Atom/ModalCloseButton.svelte';
	import InputWithLabel from '../../../Components/Molecules/InputWithLabel.svelte';
	import axios from 'axios';
	import FilterPagination from '../../../Components/Organisms/FilterPagination.svelte';
	import { _ } from '$lib/i18n';
	let editOrganization: Organization = EmptyOrganization;
	let editMode: 'update' | 'create' = 'update';
	let organizations: Organization[] = [];
	let modalOpen = false;
	let paginated: Organization[] = [];
	onMount(async () => {
		organizations = await axios.get('/api/organizations').then((res) => res.data);
	});
	const checkSlug = async (slug: string) => {
		const result = await axios.get('/api/organizations?slug=' + slug).then((res) => res.data);
		if (result.length && result[0].id != editOrganization.id) {
			alert('Slug already exists');
			return false;
		}
		return true;
	};

	const onCreateClicked = async () => {
		if (!(await checkSlug(editOrganization.slug))) return;
		if (!editOrganization.title) return alert('Please enter a title');
		const newOrg = await axios.post('/api/organizations', editOrganization).then((res) => res.data);
		organizations = [...organizations, newOrg].sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
		modalOpen = false;
	};
	const onUpdateClicked = async () => {
		if (!(await checkSlug(editOrganization.slug))) return;

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
				<td>{org.title}</td>
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
			<InputWithLabel label={_('Organization Name')} bind:value={editOrganization.title} />
			<InputWithLabel label={_('Slug')} bind:value={editOrganization.slug} />
			<InputWithLabel
				label={_('Allow Registration by Users')}
				bind:value={editOrganization.allowRegistration}
				type="switch"
			/>
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
			{/if}
		</article>
	</dialog>
{/if}
