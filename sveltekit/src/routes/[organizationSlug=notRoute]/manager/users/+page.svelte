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
	import type { PageData } from './$types';
	import AvatarThumbnail from '../../../../Components/Atom/AvatarThumbnail.svelte';
	import { actionHistory } from '$lib/frontend/Classes/actionHistory';
	export let data: PageData;
	export let users: User[] = data.users;
	export let userRoles: UserRole[] = data.userRoles;
	let paginated: User[] = [];
	const organization: Organization = data.organization;
	const fillOrganization = (user: User) => {
		const filteredUserRoles: UserRole[] = userRoles.filter((userRole) => userRole.user == user.id);
		if (!filteredUserRoles.length) return user;
		user.userRoles = filteredUserRoles;

		return user;
	};

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
		updateBusy = true;
		let existingUser = await axios
			.get('/api/users?email=' + editUser.email)
			.then((res) => res.data[0]);
		if (!existingUser) {
			existingUser = await axios.post('/api/users', editUser).then((res) => res.data);
		}
		await createUserRoles(existingUser.id);
		userRoles = await axios.get('/api/userRoles').then((res) => res.data);
		const filledUser = fillOrganization(existingUser);
		users = [...users, filledUser].sort((a: User, b: User) => (a.createdAt > b.createdAt ? -1 : 1));
		updateBusy = false;
		newUserModalOpen = false;
		actionHistory.send('createUser', { user: filledUser });
	};
	const onUpdateClicked = async () => {
		if (!editUser.email) {
			alert('Email is required');
			return;
		}
		updateBusy = true;
		const result = await axios.put('/api/users/' + editUser.id, editUser).then((res) => res.data);

		userRoles = await axios.get('/api/userRoles').then((res) => res.data);
		const filledUser = fillOrganization(result);
		users = users.map((user) => {
			if (user.id == result.id) {
				return filledUser;
			}
			return user;
		});
		updateBusy = false;
		newUserModalOpen = false;
		actionHistory.send('updateUser', { user: filledUser });
	};
	const onDeleteClicked = async () => {
		if (!confirm(_('Are you sure that you want to delete this user?'))) return;
		deleteBusy = true;
		const userRole: UserRole = await axios
			.get(`/api/userRoles?user=${editUser.id}&organization=${organization.id}`)
			.then((res) => res.data[0]);
		await new User(editUser).delete(userRole.id);
		deleteBusy = false;
		users = users.filter((user) => user.id != editUser.id);
		newUserModalOpen = false;
		actionHistory.send('deleteUser', { user: editUser });
	};
	let updateBusy = false;
	let deleteBusy = false;
</script>

<h2>{_('Users')}</h2>
<div>
	<a
		href={'#'}
		role="button"
		on:click={() => {
			editUser = emptyUser;
			editMode = 'create';

			newUserModalOpen = true;
		}}>{_('New User')}</a
	>
</div>
{#if users.length}
	<FilterPagination inputArray={users} bind:paginated />
	<table>
		<thead>
			<tr>
				<th>{_('Name')}</th>
				<th>{_('Email')}</th>
				<th>{_('Is Manager')}</th>
				<th>{_('Edit')}</th>
			</tr>
		</thead>
		<tbody>
			{#each paginated as user}
				{@const userRole = user.userRoles?.find((role) => role.organization == organization.id)}
				<tr>
					<td>
						<div style="display:flex;gap:0.4rem">
							{#if user.avatarURL}
								<AvatarThumbnail url={user.avatarURL} />
							{/if}
							<div>
								<div>
									<strong>
										{user.firstName || ''}
										{user.lastName || ''}
									</strong>
								</div>
								{user.nickname}
							</div>
						</div></td
					>
					<td>{user.email}</td>
					<td>
						<input type="checkbox" disabled role="switch" checked={userRole?.role == 'manager'} />
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
			<div style="display:flex;gap:0.4rem">
				<InputWithLabel label={_('First Name')} bind:value={editUser.firstName} />
				<InputWithLabel label={_('Last Name')} bind:value={editUser.lastName} />
			</div>
			<InputWithLabel
				meta={_('Only alphabets and numbers allowed for nickname')}
				label={_('Nickname')}
				bind:value={editUser.nickname}
			/>
			<InputWithLabel label={_('Email')} bind:value={editUser.email} type="email" />
			<InputWithLabel label={_('Is Manager')} bind:value={editUser.isAdmin} type="switch" />

			{#if editMode == 'create'}
				<button
					aria-busy={updateBusy}
					on:click={() => {
						onCreateClicked();
					}}>{_('Create')}</button
				>
			{:else}
				<button
					aria-busy={updateBusy}
					on:click={() => {
						onUpdateClicked();
					}}>{_('Update')}</button
				>
				<button
					aria-busy={deleteBusy}
					class="secondary"
					on:click={() => {
						onDeleteClicked();
					}}>{_('Delete')}</button
				>
			{/if}
		</article>
	</dialog>
{/if}
