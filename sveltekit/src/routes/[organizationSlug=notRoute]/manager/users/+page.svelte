<script lang="ts">
	import axios from 'axios';
	import { getContext, onMount } from 'svelte';
	import FilterPagination from '../../../../Components/Organisms/FilterPagination.svelte';
	import InputWithLabel from '../../../../Components/Molecules/InputWithLabel.svelte';
	import ModalCloseButton from '../../../../Components/Atom/ModalCloseButton.svelte';
	import { User } from '$lib/frontend/Classes/User';
	import { emptyUser } from '$lib/preset/EmptyUser';
	import type { UserRole } from '$lib/types/UserRole';
	import type { Organization } from '$lib/types/Organization';
	import { _ } from '$lib/i18n';
	import { page } from '$app/stores';

	let users: User[] = [];
	let paginated: User[] = [];
	let organization: Organization;
	let userRoles: UserRole[] = [];
	const fillOrganization = (user: User) => {
		const filteredUserRoles: UserRole[] = userRoles.filter((userRole) => userRole.user == user.id);
		if (!filteredUserRoles.length) return user;
		user.userRoles = filteredUserRoles;

		return user;
	};

	onMount(async () => {
		organization = await axios
			.get('/api/organizations?slug=' + $page.params.organizationSlug)
			.then((res) => res.data[0]);
		userRoles = await axios
			.get('/api/userRoles?organization=' + organization.id)
			.then((res) => res.data);
		console.log({ userRoles });
		users = await axios
			.get(`/api/users?id=in:'${userRoles.map((role) => role.user).join("','")}'`)
			.then((res) => res.data);
		users = users
			.map((user) => {
				user = fillOrganization(user);
				return new User(user);
			})
			.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
		console.log({ users });
	});
	let newUserModalOpen = false;
	let editUser: User = emptyUser;
	let editMode: 'update' | 'create' = 'update';

	const createUserRoles = async (userId: string) => {
		return await axios
			.post('/api/userRoles', {
				user: userId,
				organization: organization.id,
				role: organization.isManager ? 'manager' : 'subscriber'
			})
			.then((res) => res.data);
	};

	const onCreateClicked = async () => {
		if (!editUser.email) {
			alert('Email is required');
			return;
		}
		const result = await axios.post('/api/users', editUser).then((res) => res.data);
		await createUserRoles(result.id);
		userRoles = await axios.get('/api/userRoles').then((res) => res.data);
		const filledUser = fillOrganization(result);
		users = [...users, filledUser].sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));

		newUserModalOpen = false;
	};
	const onUpdateClicked = async () => {
		if (!editUser.email) {
			alert('Email is required');
			return;
		}
		const result = await axios.put('/api/users/' + editUser.id, editUser).then((res) => res.data);

		userRoles = await axios.get('/api/userRoles').then((res) => res.data);
		const filledUser = fillOrganization(result);
		users = users.map((user) => {
			if (user.id == result.id) {
				return filledUser;
			}
			return user;
		});
		newUserModalOpen = false;
	};
	const onDeleteClicked = async () => {
		if (!confirm('Are you sure that you want to delete this user?')) return;
		await new User(editUser).delete();
		users = users.filter((user) => user.id != editUser.id);
		newUserModalOpen = false;
	};
</script>

<h2>{_('Users')}</h2>
<div style="width:10rem">
	<button
		on:click={() => {
			editUser = emptyUser;
			editMode = 'create';

			newUserModalOpen = true;
		}}>{_('New User')}</button
	>
</div>
{#if users.length}
	<FilterPagination inputArray={users} bind:paginated />
	<table>
		<thead>
			<tr>
				<th>{_('Nickname')}</th>
				<th>{_('Email')}</th>
				<th>{_('Is Manager')}</th>
				<th>{_('Edit')}</th>
			</tr>
		</thead>
		<tbody>
			{#each paginated as user}
				{@const userRole = user.userRoles?.find((role) => role.organization == organization.id)}
				<tr>
					<td>{user.nickname}</td>
					<td>{user.email}</td>
					<td>
						<input type="checkbox" disabled role="switch" checked={userRole.role == 'manager'} />
					</td>
					<td>
						<button
							on:click={() => {
								editUser = { ...user };
								editMode = 'update';

								newUserModalOpen = true;
							}}
						>
							{_('Edit')}
						</button>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}
{#if newUserModalOpen}
	<dialog open>
		<article>
			<ModalCloseButton onClick={() => (newUserModalOpen = false)} />
			<InputWithLabel label={_('Nickname')} bind:value={editUser.nickname} />
			<InputWithLabel label={_('Email')} bind:value={editUser.email} type="email" />
			<InputWithLabel label={_('Is Manager')} bind:value={editUser.isAdmin} type="switch" />

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
					on:click={() => {
						onDeleteClicked();
					}}>{_('Delete')}</button
				>
			{/if}
		</article>
	</dialog>
{/if}
