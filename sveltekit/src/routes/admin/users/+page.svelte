<script lang="ts">
	import axios from 'axios';
	import { onMount } from 'svelte';
	import FilterPagination from '../../../Components/Organisms/FilterPagination.svelte';
	import InputWithLabel from '../../../Components/Molecules/InputWithLabel.svelte';
	import ModalCloseButton from '../../../Components/Atom/ModalCloseButton.svelte';
	import { User } from '$lib/frontend/Classes/User';
	import { emptyUser } from '$lib/preset/EmptyUser';
	import type { UserRole } from '$lib/types/UserRole';
	import type { Organization } from '$lib/types/Organization';
	import { _ } from '$lib/i18n';
	import { fillOrganization } from './fillOrganization';
	import type { PageData } from './$types';
	export let data: PageData;
	let users: User[] = data.users;
	let paginated: User[] = [];
	let organizations: Organization[] = data.organizations;
	let userRoles: UserRole[] = data.userRoles;

	let newUserModalOpen = false;
	let editUser: User = emptyUser;
	let editMode: 'update' | 'create' = 'update';

	const createUserRoles = async (userId: string): Promise<UserRole[]> => {
		let promises: Promise<UserRole>[] = [];
		organizations.forEach((org) => {
			console.log({ org });
			if (org.checked) {
				console.log('posting');
				promises.push(
					axios
						.post('/api/userRoles', {
							user: userId,
							organization: org.id,
							role: org.isManager ? 'manager' : 'subscriber'
						})
						.then((res) => res.data)
				);
			}
		});
		const results = await Promise.all(promises);

		return results;
	};
	const deleteExistinguserRoles = (userRoles: UserRole[]) => {
		let promises: Promise<UserRole>[] = [];
		userRoles.forEach((userRole) => {
			promises.push(axios.delete('/api/userRoles/' + userRole.id).then((res) => res.data));
		});
		return Promise.all(promises);
	};
	const onCreateClicked = async () => {
		if (!editUser.email) {
			console.log('no email', editUser);
			alert('Email is required');
			return;
		}
		const result = await axios.post('/api/users', editUser).then((res) => res.data);
		const createdUserRoles = await createUserRoles(result.id);
		userRoles = [...createdUserRoles, ...userRoles];
		const filledUser = fillOrganization(result, userRoles, organizations);
		users = [filledUser, ...users];

		newUserModalOpen = false;
	};
	const onUpdateClicked = async () => {
		if (!editUser.email) {
			alert('Email is required');
			return;
		}
		const result = await axios.put('/api/users/' + editUser.id, editUser).then((res) => res.data);
		await deleteExistinguserRoles(editUser.userRoles || []);
		await createUserRoles(result.id);

		const filledUser = fillOrganization(result, userRoles, organizations);
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
		const userRoles = await axios.get('/api/userRoles?user=' + editUser.id).then((res) => res.data);
		await deleteExistinguserRoles(userRoles);
		await axios.delete('/api/users/' + editUser.id).then((res) => res.data);
		//		await new User(editUser).delete();
		users = users.filter((user) => user.id != editUser.id);
		newUserModalOpen = false;
	};
</script>

<h2>{_('Users')}</h2>
<div style="width:10rem">
	<button
		data-testid="newUserButton"
		on:click={() => {
			editUser = emptyUser;
			editMode = 'create';
			organizations.forEach((org) => {
				org.checked = false;
				org.isManager = false;
			});
			newUserModalOpen = true;
		}}>{_('New User')}</button
	>
</div>
{#if users.length}
	<FilterPagination inputArray={users} bind:paginated />
	<table>
		<thead>
			<tr>
				<th>{_('Nickname')}/{_('Email')}</th>
				<th>{_('Is Admin')}</th>
				<th>{_('Organizations')}</th>
				<th>{_('Edit')}</th>
			</tr>
		</thead>
		<tbody>
			{#each paginated as user, i}
				<tr data-testid={'user' + i}>
					<td>
						<div>
							{user.nickname}
						</div>
						<small>
							{user.email}
						</small>
					</td>
					<td>
						<input type="checkbox" disabled role="switch" bind:checked={user.isAdmin} />
					</td>
					<td>
						{#each user.organizations || [] as org}
							{@const userRole = user.userRoles?.find((role) => role.organization == org.id)}
							<div>
								<div>
									{org.title}
									{#if userRole}
										({userRole.role})
									{/if}
								</div>
							</div>
						{/each}
					</td>
					<td>
						<button
							data-testid="editButton{i}"
							on:click={() => {
								editUser = { ...user };
								editMode = 'update';
								organizations.forEach((org) => {
									org.checked = !!user.organizations?.find((userOrg) => userOrg.id == org.id);
									org.isManager = !!user.userRoles?.find(
										(userRole) => userRole.organization == org.id && userRole.role == 'manager'
									);
								});
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
			<ModalCloseButton testId="closeButton" onClick={() => (newUserModalOpen = false)} />
			<InputWithLabel testId="nicknameInput" label={_('Nickname')} bind:value={editUser.nickname} />
			<InputWithLabel
				testId="emailInput"
				label={_('Email')}
				bind:value={editUser.email}
				type="email"
			/>
			<InputWithLabel
				testId="adminSwitch"
				label={_('Is Admin')}
				bind:value={editUser.isAdmin}
				type="switch"
			/>
			<div style="margin-top:1rem">{_('Organizations')}</div>
			<ul>
				{#each organizations as org}
					<li style="display:flex;gap:1rem">
						<InputWithLabel type="checkbox" label={org.title} bind:value={org.checked} />
						{#if org.checked}
							<InputWithLabel type="switch" bind:value={org.isManager} label={_('Is Manager')} />
						{/if}
					</li>
				{/each}
			</ul>
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
