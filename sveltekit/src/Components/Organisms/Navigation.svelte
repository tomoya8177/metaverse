<script lang="ts">
	import SquareThumbnail from './SquareThumbnail.svelte';
	import { page } from '$app/stores';
	import ProfileEditInputs from './ProfileEditInputs.svelte';
	import { cookies } from '$lib/frontend/cookies';
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
	export let thumbnailURL: string = '';
	export let title: String = '';
	export let organization: Organization | null = null;
	const onLogoutClicked = () => {
		videoChat.leave();
		EventStore.set(EmptyEvent);
		cookies.remove('login');
		location.reload();
	};
	let emailDialogOpen = false;
	const changeEmailClicked = () => {
		emailDialogOpen = true;
	};
	let profileDialogOpen = false;
	const changeProfileClicked = () => {
		profileDialogOpen = true;
	};
	let busy = false;
	let newEmail = '';
	let emailAlreadyExists = false;
	const onChangeEmailDoClicked = async () => {
		if (!confirm('Are you sure that ' + newEmail + ' is your email?')) return;
		busy = true;
		const existingUser = await axios.get('/api/users?email=' + newEmail).then((res) => res.data);
		if (existingUser.length) {
			//email already exists
			emailAlreadyExists = true;
			setTimeout(() => {
				emailAlreadyExists = false;
			}, 2000);
			busy = false;
			return;
		}
		await axios.put('/api/users/' + $UserStore.id, {
			email: newEmail
		});
		UserStore.update((user) => {
			user.email = newEmail;
			return user;
		});
		busy = false;
		emailDialogOpen = false;
	};

	const onLeaveClicked = async () => {
		if (!confirm(_('Are you sure that you want to leave this room?'))) return;
		videoChat.leave();
		const organization: Organization = await axios
			.get('/api/organizations/' + $EventStore.organization)
			.then((res) => res.data);
		EventStore.set(EmptyEvent);
		location.href = '/' + organization.slug;
	};
	let chosenLanguage: string = cookies.get('locale') || 'en';
	let loginOpen: boolean = false;
	export let logoLinkTo: string = '#';
	onMount(() => {
		const themeImage = document.getElementById('theme-image') as HTMLImageElement;
		if (!themeImage) return;
		const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

		if (prefersDarkScheme.matches) {
			themeImage.src = '/images/logo.png';
		} else {
			themeImage.src = '/images/logo.jpg';
		}
	});
	let inviteDialogOpen = false;
	let invitingEmail = '';
	let inviteBusy = false;
</script>

<nav>
	<ul class:hiddenInSmallScreen={$EventStore.id}>
		<li>
			<a href={logoLinkTo || '#'}>
				{#if thumbnailURL}
					<SquareThumbnail url={thumbnailURL} />
				{/if}
				{#if title}
					<strong class:hiddenInSmallScreen={thumbnailURL}>
						{title}
					</strong>
				{:else}
					<img alt="logo" id="theme-image" src="/images/logo.jpg" style="width:10rem" />
				{/if}
			</a>
		</li>
	</ul>
	<ul />
	<ul>
		<li style="flex:1" />
		{#if $UserStore.id}
			{#if $UsersStore.length && $EventStore.id}
				<li>
					<a
						href={'#'}
						on:click={() => {
							inviteDialogOpen = !inviteDialogOpen;
						}}
					>
						<Icon icon="email" />
						{_('Invite')}
					</a>
				</li>
				<li>
					<details role="list">
						<summary aria-haspopup="listbox" role="link">
							<div>
								<Icon icon="groups" />
								{lang.t('Users')} (
								{$UsersStore.length}
								)
							</div>
						</summary>
						<ul role="listbox">
							{#each $UsersStore || [] as unit}
								<li>
									{unit.nickname}
								</li>
							{/each}
						</ul>
					</details>
				</li>
			{/if}
			<li>
				<details role="list" dir="rtl">
					<summary aria-haspopup="listbox" role="link">
						<div>
							<Icon icon="account_circle" />
							{$UserStore.nickname}
						</div>
					</summary>
					<ul role="listbox">
						{#if $EventStore?.id}
							<li>
								<button on:click={onLeaveClicked} class="secondary">{_('Leave Room')}</button>
							</li>
						{/if}
						<li><a href={'#'} on:click={changeEmailClicked}> {_('Change Email')} </a></li>
						<li>
							<a href={'#'} on:click={changeProfileClicked}> {_('Change Profile')} </a>
						</li>
						{#if $UserStore.isAdmin}
							<li>
								<a
									href={'#'}
									on:click={() => {
										videoChat.leave();
										EventStore.set(EmptyEvent);
										location.href = '/admin';
									}}
								>
									{_('Admin console')}</a
								>
							</li>
						{/if}
						<li>
							<a href={'#'} on:click={onLogoutClicked}>{_('Logout')}</a>
						</li>
						<hr />
						<li>
							<div>Language</div>
							<LanguageSelector />
						</li>
					</ul>
				</details>
			</li>
		{:else}
			<li>
				<a
					href={'#'}
					on:click={() => {
						loginOpen = true;
					}}
				>
					{_('Login')}
				</a>
			</li>
			<li>
				<LanguageSelector />
			</li>
		{/if}
	</ul>
</nav>
{#if loginOpen}
	<Login />
{/if}
{#if inviteDialogOpen}
	<dialog open transition:fade>
		<article>
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
											_(
												'This user is not a member of this organization. Do you want to invite him?'
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
{/if}
{#if emailDialogOpen}
	<dialog open transition:fade>
		<article>
			<ModalCloseButton
				onClick={() => {
					emailDialogOpen = false;
				}}
			/>
			<h3>{_('Change Email')}</h3>
			<div style="margin-bottom:1rem">
				<div>{_('Current Email')}</div>
				<span>{$UserStore.email}</span>
			</div>
			{#if emailAlreadyExists}
				<div style="margin-bottom:1rem">This Email address already exists.</div>
			{/if}
			<InputWithLabel label={_('New Email')} bind:value={newEmail} />
			<button aria-busy={busy} on:click={() => onChangeEmailDoClicked()} disabled={busy}>
				{_('Change')}
			</button>
		</article>
	</dialog>
{/if}
{#if profileDialogOpen}
	<dialog open transition:fade>
		<article>
			<ModalCloseButton
				onClick={() => {
					profileDialogOpen = false;
				}}
			/>
			<h3>Change Profile</h3>

			<ProfileEditInputs
				withName
				withDescription
				user={$UserStore}
				onUpdateDone={() => {
					profileDialogOpen = false;
				}}
			/>
		</article>
	</dialog>
{/if}

<style>
	nav {
		padding-left: 1rem;
		padding-right: 1rem;
		flex-wrap: wrap;
	}
	.permissionRow {
		display: flex;
		gap: 1rem;
		border-bottom: solid 1px #ccc;
	}
</style>
