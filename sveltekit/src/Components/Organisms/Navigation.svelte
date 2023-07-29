<script lang="ts">
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
	export let title: String = '';
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
</script>

<nav>
	<ul class:hiddenInSmallScreen={$EventStore.id}>
		<li>
			<a href={logoLinkTo || '#'}>
				{#if title}
					<strong>
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
		{#if $UsersStore.length}
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
		{#if $UserStore.id}
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
								<button on:click={onLeaveClicked} class="warning">{_('Leave Room')}</button>
							</li>
						{/if}
						<li><a href={'#'} on:click={changeEmailClicked}> {_('Change Email')} </a></li>
						<li>
							<a href={'#'} on:click={changeProfileClicked}> {_('Change Profile')} </a>
						</li>
						<li>
							<a href={'#'} on:click={onLogoutClicked}>{_('Logout')}</a>
						</li>
						<hr />
						<li>
							<div>Language</div>
							<select
								bind:value={chosenLanguage}
								on:change={(e) => {
									//set it to cookie
									console.log(chosenLanguage);
									cookies.set('locale', chosenLanguage, { expires: 365 * 10 });
									location.reload();
								}}
							>
								<option value="en">English</option>
								<option value="es">Español</option>
								<option value="nl">Nederlands</option>
								<option value="pt">Português</option>
								<option value="hi">हिन्दी</option>
								<option value="zh">中文</option>
								<option value="ko">한국어</option>
								<option value="ja">日本語</option>
							</select>
						</li>
					</ul>
				</details>
			</li>
			<li>Version:0.0.1</li>
		{:else}
			<a
				href={'#'}
				on:click={() => {
					loginOpen = true;
				}}
			>
				{_('Login')}
			</a>
		{/if}
	</ul>
</nav>
{#if loginOpen}
	<Login />
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
</style>
