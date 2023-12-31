<script lang="ts">
	import InvitationDialog from './InvitationDialog.svelte';

	import SquareThumbnail from './SquareThumbnail.svelte';
	import { page } from '$app/stores';
	import ProfileEditInputs from './ProfileEditInputs.svelte';
	import { cookies } from '$lib/frontend/cookies';
	import { ChatMessagesStore, FocusObjectStore, RoomStore, UserStore } from '$lib/store';
	import axios from 'axios';
	import ModalCloseButton from '../Atom/ModalCloseButton.svelte';
	import { fade } from 'svelte/transition';
	import Icon from '../Atom/Icon.svelte';
	import { videoChat } from '$lib/frontend/Classes/VideoChat';
	import { EmptyRoom } from '$lib/preset/EmptyRoom';
	import { Users, UsersStore } from '$lib/frontend/Classes/Users';
	import { _, lang } from '$lib/i18n';
	import Login from './Login.svelte';
	import type { Organization } from '$lib/types/Organization';
	import { onMount } from 'svelte';
	import LanguageSelector from '../Molecules/LanguageSelector.svelte';
	import { myConfirm, toast } from '$lib/frontend/toast';
	import { actionHistory } from '$lib/frontend/Classes/ActionHistory';
	import { escapeHTML } from 'mymetaverse-helper';
	import { goto } from '$app/navigation';
	import type { Me } from '$lib/frontend/Classes/Me';
	import AvatarThumbnail from '../Atom/AvatarThumbnail.svelte';
	import { ChatMessage } from 'langchain/schema';
	import { InputWithLabel } from 'mymetaverseportal-ui-component';
	import { textChat } from '$lib/frontend/Classes/TextChat';
	export let thumbnailURL: string = '';
	export let title: String = '';
	export let organization: Organization | null = null;
	export let me: Me | null = null;
	const onLogoutClicked = () => {
		actionHistory.send('logout');
		videoChat.leave();
		textChat.leave();

		RoomStore.set(null);
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
		if (!(await myConfirm('Are you sure that ' + newEmail + ' is your email?'))) return;
		busy = true;
		actionHistory.send('changeEmail', { newEmail });
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
		if (!(await myConfirm(_('Are you sure that you want to leave this room?')))) return;
		actionHistory.send('leaveRoom');
		videoChat.leave();
		textChat.leave();

		ChatMessagesStore.set([]);
		RoomStore.set(null);
		if (!organization) {
			location.href = '/';
			return;
		}
		location.href = '/' + organization.slug;
	};
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
	$: $UsersStore;
</script>

<nav>
	<ul class:hiddenInSmallScreen={$RoomStore?.id}>
		<li style="max-width:18rem">
			<a href={logoLinkTo || '#'}>
				{#if thumbnailURL}
					<SquareThumbnail url={thumbnailURL} />
				{/if}
				{#if title}
					<strong class:hiddenInSmallScreen={thumbnailURL}>
						{@html title}
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
			{#if $UsersStore.length && $RoomStore?.id}
				<li>
					<a
						href={'#'}
						on:click={() => {
							FocusObjectStore.set(null);
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
									<AvatarThumbnail user={unit.userData} size="2rem" />
									{unit.userData.nickname}
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
							<span class="hiddenInSmallScreen">
								{$UserStore.nickname}
							</span>
						</div>
					</summary>
					<ul role="listbox">
						{#if $UserStore.coin}
							<li style="text-align:center">
								{$UserStore.coin}
								<Icon icon="local_police" />
								<AvatarThumbnail user={$UserStore || null} size="3rem" />
							</li>
						{/if}
						{#if $RoomStore?.id}
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
										textChat.leave();

										RoomStore.set(null);
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
	<InvitationDialog bind:open={inviteDialogOpen} {organization} />
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
				onUpdateDone={() => {
					actionHistory.send('profileUpdate', {
						user: { ...$UserStore, description: escapeHTML($UserStore.description) }
					});
					profileDialogOpen = false;
					console.log({ me });
					if (me) me.updateAvatar();
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
</style>
