<script lang="ts">
	import { EventStore, UserStore } from '$lib/store';
	import axios from 'axios';
	import ModalCloseButton from '../Atom/ModalCloseButton.svelte';
	import InputWithLabel from '../Molecules/InputWithLabel.svelte';
	import { fade } from 'svelte/transition';
	import Icon from '../Atom/Icon.svelte';
	import { videoChat } from '$lib/frontend/Classes/VideoChat';
	import { EmptyEvent } from '$lib/preset/EmptyEvent';
	import { UsersStore } from '$lib/frontend/Classes/Users';
	import { _, lang } from '$lib/i18n';
	import Login from './Login.svelte';
	import type { Organization } from '$lib/types/Organization';
	import { onMount } from 'svelte';
	import LanguageSelector from '../Molecules/LanguageSelector.svelte';
	import { myConfirm, toast } from '$lib/frontend/toast';
	import { nl2br } from '$lib/math/nl2br';
	export let organization: Organization | null = null;
	export let open = false;
	let invitingEmail = '';
	let inviteBusy = false;
</script>

<dialog {open} transition:fade>
	<article>
		<ModalCloseButton
			onClick={() => {
				open = false;
			}}
		/>
		<h3>
			{_('Invite user')}
		</h3>
		<section>
			<InputWithLabel label="URL" value={location.href} readonly copiable />
			<InputWithLabel
				meta={_('One email address at a time.')}
				label={_('Invite by Email')}
				bind:value={invitingEmail}
			/>
			<button
				aria-busy={inviteBusy}
				on:click={async () => {
					console.log({ invitingEmail, organization });
					if (!invitingEmail || !organization) return;
					inviteBusy = true;
					let existingUser = await axios
						.get('/api/users?email=' + invitingEmail)
						.then((res) => res.data[0]);
					let existingUserRole = await axios
						.get('/api/userRoles?user=' + existingUser?.id + '&organization=' + organization.id)
						.then((res) => res.data[0]);
					console.log({ existingUserRole });
					if ($EventStore.isPublic) {
						//pass
					} else {
						if ($EventStore.isOpen) {
							if (existingUserRole) {
								//pass
							} else {
								//not a member. so we will make him a member
								if (
									!(await myConfirm(
										_('This user is not a member of this organization. Do you want to invite him?')
									))
								) {
									inviteBusy = false;
									return;
								}
								if (!existingUser) {
									existingUser = await axios
										.post('/api/users', {
											email: invitingEmail,
											nickname: invitingEmail.split('@')[0]
										})
										.then((res) => res.data);
								}
								await axios.post('/api/userRoles', {
									user: existingUser.id,
									organization: organization.id
								});
							}
						} else {
							if (
								existingUserRole &&
								existingUser &&
								$EventStore.allowedUsersArray.includes(existingUser.id)
							) {
								//pass
							} else if (existingUserRole) {
								//not allowed user
								if (
									!(await myConfirm(
										_(
											'This user is not allowed to join this room. Do you want to allow this user to join this room?'
										)
									))
								) {
									inviteBusy = false;
									return;
								}
								$EventStore.allowedUsersArray = $EventStore.allowedUsersArray.concat([
									existingUser.id
								]);
								$EventStore.allowedUsers = JSON.stringify($EventStore.allowedUsersArray);
								await axios.put('/api/events/' + $EventStore.id, {
									allowedUsers: $EventStore.allowedUsers
								});
							} else {
								//not a member. so we will make him a member
								if (
									!(await myConfirm(
										_(
											'This user is not a member of this organization. Do you want to invite him and allow this user to join this room?'
										)
									))
								) {
									inviteBusy = false;
									return;
								}
								if (!existingUser) {
									existingUser = await axios
										.post('/api/users', {
											email: invitingEmail,
											nickname: invitingEmail.split('@')[0]
										})
										.then((res) => res.data);
								}
								await axios.post('/api/userRoles', {
									user: existingUser.id,
									organization: organization.id
								});
								$EventStore.allowedUsersArray = $EventStore.allowedUsersArray.concat([
									existingUser.id
								]);
								$EventStore.allowedUsers = JSON.stringify($EventStore.allowedUsersArray);
								await axios.put('/api/events/' + $EventStore.id, {
									allowedUsers: $EventStore.allowedUsers
								});
							}
						}
					}
					//send email
					const body = `${_(`Hello,`)} ${$UserStore.nickname} ${_(
						`is inviting you to the metaverse world.`
					)}
						${_(`Please click the link below to enter the room!`)}
						${location.href}`;
					const html = nl2br(
						body.replace(location.href, `<a href="${location.href}">${location.href}</a>`)
					);
					await axios.post('/api/email', {
						to: invitingEmail, // list of receivers
						cc: $UserStore.email,
						subject: _('Invitation from VirtuaCampus'), // Subject line
						text: body, // plain text body
						html: html
					});
					toast(_('Invitation sent'));
					inviteBusy = false;
				}}
			>
				<Icon icon="email" />
				{_('Invite')}
			</button>
		</section>
		<section>
			<strong>
				{_('Room Setting')}
			</strong>
			<InputWithLabel
				disabled={!$UserStore.isManager}
				type="switch"
				label={_('Open for Anyone')}
				bind:value={$EventStore.isPublic}
				onChange={async () => {
					await axios.put('/api/events/' + $EventStore.id, {
						isPublic: $EventStore.isPublic
					});
					toast(_('Updated'));
				}}
			/>
			{#if !$EventStore.isPublic}
				<InputWithLabel
					disabled={!$UserStore.isManager}
					type="switch"
					label={_('Open for Anyone in the organization')}
					bind:value={$EventStore.isOpen}
					onChange={async () => {
						await axios.put('/api/events/' + $EventStore.id, {
							isOpen: $EventStore.isOpen
						});
						toast(_('Updated'));
					}}
				/>
				{#if organization}
					<strong>
						{_('Organization Setting')}
					</strong>
					<InputWithLabel
						disabled={!$UserStore.isManager}
						type="switch"
						label={_('Allow Registration by Users')}
						bind:value={organization.allowRegistration}
						onChange={async () => {
							if (!organization) return;
							await axios.put('/api/organizations/' + organization.id, {
								allowRegistration: organization.allowRegistration
							});
							toast(_('Updated'));
						}}
					/>
				{/if}
			{/if}
		</section>
		<strong>
			{_('Who can enter')}
		</strong>
		<div class="permissionRow">
			<div style="flex:1">
				{_('Users outside the organization')}
			</div>
			<div>
				{#if $EventStore.isPublic}
					<Icon icon="check" />
				{:else if $EventStore.isOpen && organization?.allowRegistration}
					<div style="text-align:center">
						<Icon icon="check" /><br />
						<small>
							{_('User will become a member of the organization')}
						</small>
					</div>
				{:else}
					<Icon icon="close" />
				{/if}
			</div>
		</div>
		<div class="permissionRow">
			<div style="flex:1">
				{_('Organization Mambers')}
			</div>
			<div>
				{#if $EventStore.isPublic}
					<Icon icon="check" />
				{:else if $EventStore.isOpen}
					<Icon icon="check" />
				{:else}
					<Icon icon="close" />
				{/if}
			</div>
		</div>
		<div class="permissionRow">
			<div style="flex:1">
				{_('Selected Organization Mambers')}
			</div>
			<div>
				<Icon icon="check" />
			</div>
		</div>
	</article>
</dialog>

<style>
	.permissionRow {
		display: flex;
		gap: 1rem;
		border-bottom: solid 1px #ccc;
	}
</style>
