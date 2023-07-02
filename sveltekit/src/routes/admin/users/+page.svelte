<script lang="ts">
	import axios from 'axios';
	import { onMount } from 'svelte';
	import FilterPagination from '../../../Components/Organisms/FilterPagination.svelte';
	import InputWithLabel from '../../../Components/Molecules/InputWithLabel.svelte';
	import ModalCloseButton from '../../../Components/Atom/ModalCloseButton.svelte';
	import type { User } from '$lib/types/User';
	import { emptyUser } from '$lib/preset/EmptyUser';
	import type { UserRole } from '$lib/types/UserRole';
	import type { Organization } from '$lib/types/Organization';

	let users: User[] = [];
	let paginated: User[] = [];
	let organizations: Organization[] = [];
	let userRoles: UserRole[] = [];
	const fillOrganization = (user: User) => {
		const filteredUserRoles: UserRole[] = userRoles.filter((userRole) => userRole.user == user.id);
		if (!filteredUserRoles.length) return user;
		user.userRoles = filteredUserRoles;
		user.organizations = organizations.filter((org) =>
			filteredUserRoles.find((userRole) => userRole.organization == org.id)
		);
		return user;
	};

	onMount(async () => {
		userRoles = await axios.get('/api/userRoles').then((res) => res.data);
		organizations = await axios.get('/api/organizations').then((res) => res.data);
		users = await axios.get('/api/users').then((res) => res.data);
		const promises: Promise<User>[] = [];
		users = users
			.map((user) => {
				return fillOrganization(user);
			})
			.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
		console.log({ users });
	});
	let newUserModalOpen = false;
	let editUser: User = emptyUser;
	let editMode: 'update' | 'create' = 'update';

	const createUserRoles = async (userId: string) => {
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
		await Promise.all(promises).then((results) => {
			console.log(results);
		});
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
		await deleteExistinguserRoles(editUser.userRoles || []);
		await createUserRoles(result.id);

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
</script>

<h2>Users</h2>
<div style="width:10rem">
	<button
		on:click={() => {
			editUser = emptyUser;
			editMode = 'create';
			organizations.forEach((org) => {
				org.checked = false;
				org.isManager = false;
			});
			newUserModalOpen = true;
		}}>New User</button
	>
</div>
{#if users.length}
	<FilterPagination inputArray={users} bind:paginated />
	<table>
		<thead>
			<tr>
				<th>Nickname</th>
				<th>Email</th>
				<th>Is Admin</th>
				<th>Organizations</th>
				<th>Edit</th>
			</tr>
		</thead>
		<tbody>
			{#each paginated as user}
				<tr>
					<td>{user.nickname}</td>
					<td>{user.email}</td>
					<td>
						<input type="checkbox" disabled role="switch" bind:checked={user.isAdmin} />
					</td>
					<td>
						<ul>
							{#each user.organizations || [] as org}
								{@const userRole = user.userRoles?.find((role) => role.organization == org.id)}
								<li>
									<div>
										{org.title}
										{#if userRole}
											({userRole.role})
										{/if}
									</div>
								</li>
							{/each}
						</ul>
					</td>
					<td>
						<button
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
							Edit
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
			<InputWithLabel label="Nickname" bind:value={editUser.nickname} />
			<InputWithLabel label="Email" bind:value={editUser.email} type="email" />
			<InputWithLabel label="Is Admin" bind:value={editUser.isAdmin} type="switch" />
			<div style="margin-top:1rem">Linked Organization</div>
			<ul>
				{#each organizations as org}
					<li style="display:flex;gap:1rem">
						<InputWithLabel type="checkbox" label={org.title} bind:value={org.checked} />
						{#if org.checked}
							<InputWithLabel type="switch" bind:value={org.isManager} label="Is Manager" />
						{/if}
					</li>
				{/each}
			</ul>
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
