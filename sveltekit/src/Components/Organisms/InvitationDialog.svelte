<script lang="ts">
	import { RoomStore, UserStore } from '$lib/store';
	import axios from 'axios';
	import { page } from '$app/stores';
	import ModalCloseButton from '../Atom/ModalCloseButton.svelte';
	import InputWithLabel from '../Molecules/InputWithLabel.svelte';
	import { fade } from 'svelte/transition';
	import Icon from '../Atom/Icon.svelte';
	import { videoChat } from '$lib/frontend/Classes/VideoChat';
	import { EmptyRoom } from '$lib/preset/EmptyRoom';
	import { UsersStore } from '$lib/frontend/Classes/Users';
	import { _, lang } from '$lib/i18n';
	import Login from './Login.svelte';
	import type { Organization } from '$lib/types/Organization';
	import { onMount } from 'svelte';
	import LanguageSelector from '../Molecules/LanguageSelector.svelte';
	import { myConfirm, toast } from '$lib/frontend/toast';
	import { nl2br } from '$lib/math/nl2br';
	import { actionHistory } from '$lib/frontend/Classes/ActionHistory';
	import { sendInvitedToOrganizationEmail } from '$lib/frontend/sendInvitedToOrganizationEmail';
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
					if ($RoomStore.isPublic) {
						//pass
					} else {
						if ($RoomStore.isOpen) {
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
								const url = `${$page.url.protocol}//${$page.url.host}/${organization.slug}/${$RoomStore.slug}`;
								await sendInvitedToOrganizationEmail($UserStore, invitingEmail, organization, url);
							}
						} else {
							if (
								existingUserRole &&
								existingUser &&
								$RoomStore.allowedUsersArray.includes(existingUser.id)
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
								$RoomStore.allowedUsersArray = $RoomStore.allowedUsersArray.concat([
									existingUser.id
								]);
								$RoomStore.allowedUsers = JSON.stringify($RoomStore.allowedUsersArray);
								await axios.put('/api/rooms/' + $RoomStore.id, {
									allowedUsers: $RoomStore.allowedUsers
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
								const url = `${$page.url.protocol}//${$page.url.host}/${organization.slug}/${$RoomStore.slug}`;
								await sendInvitedToOrganizationEmail($UserStore, invitingEmail, organization, url);
								$RoomStore.allowedUsersArray = $RoomStore.allowedUsersArray.concat([
									existingUser.id
								]);
								$RoomStore.allowedUsers = JSON.stringify($RoomStore.allowedUsersArray);
								await axios.put('/api/rooms/' + $RoomStore.id, {
									allowedUsers: $RoomStore.allowedUsers
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
					actionHistory.send('inviteUser', {
						user: existingUser
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
				bind:value={$RoomStore.isPublic}
				onChange={async () => {
					await axios.put('/api/rooms/' + $RoomStore.id, {
						isPublic: $RoomStore.isPublic
					});
					toast(_('Updated'));
				}}
			/>
			{#if !$RoomStore.isPublic}
				<InputWithLabel
					disabled={!$UserStore.isManager}
					type="switch"
					label={_('Open for Anyone in the organization')}
					bind:value={$RoomStore.isOpen}
					onChange={async () => {
						await axios.put('/api/rooms/' + $RoomStore.id, {
							isOpen: $RoomStore.isOpen
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
				{#if $RoomStore.isPublic}
					<Icon icon="check" />
				{:else if $RoomStore.isOpen && organization?.allowRegistration}
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
				{#if $RoomStore.isPublic}
					<Icon icon="check" />
				{:else if $RoomStore.isOpen}
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
