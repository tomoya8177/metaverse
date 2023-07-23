<script lang="ts">
	import ObjectEditor from './ObjectEditor.svelte';

	import ProfileEditInputs from './ProfileEditInputs.svelte';

	import { cookies } from '$lib/frontend/cookies';
	import { EventStore, FocusObjectStore, PreviewPanelOpen, UserStore } from '$lib/store';
	import axios from 'axios';
	import ModalCloseButton from '../Atom/ModalCloseButton.svelte';
	import InputWithLabel from '../Molecules/InputWithLabel.svelte';
	import { fade } from 'svelte/transition';
	import Icon from '../Atom/Icon.svelte';
	import { videoChat } from '$lib/frontend/Classes/VideoChat';
	import { EmptyEvent } from '$lib/preset/EmptyEvent';
	import { Users, UsersStore } from '$lib/frontend/Classes/Users';
	import { _, lang } from '$lib/i18n';
	import Login from './Login.svelte';
	import type { Organization } from '$lib/types/Organization';
	export let title: String = 'VirtuaIntel';
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
</script>

<nav>
	<ul>
		<li>
			<a href={logoLinkTo || '#'}>
				<strong>
					{title}
				</strong>
			</a>
		</li>
		<ObjectEditor />
		{#if $FocusObjectStore.id}
			<li>
				<button
					class:outline={$FocusObjectStore.locked}
					class="circle-button"
					small
					on:click={() => {
						$FocusObjectStore.locked = !$FocusObjectStore.locked;
					}}
				>
					<Icon icon={$FocusObjectStore.locked ? 'lock' : 'lock_open'} />
				</button>
			</li>
			<li>
				<button
					class="circle-button"
					small
					on:click={() => {
						console.log($FocusObjectStore);
						if ($FocusObjectStore.type == 'screen') {
							PreviewPanelOpen.set(true);
							return;
						}
						let asset;
						asset = $FocusObjectStore.el.components.material.data.src;
						const el = document.createElement('div');
						el.style.position = 'relative';
						const deleteButton = document.createElement('a');
						deleteButton.href = '#';
						const x = document.createElement('span');
						x.innerHTML = 'Close';
						x.style.position = 'absolute';
						x.style.top = '0.2rem';
						x.style.right = '0.7rem';
						deleteButton.appendChild(x);
						deleteButton.style.position = 'absolute';
						deleteButton.classList.add('circle-button');
						deleteButton.classList.add('secondary');
						deleteButton.setAttribute('small', '');
						deleteButton.style.top = '0';
						deleteButton.style.right = '0';
						deleteButton.style['z-index'] = '1000';
						deleteButton.onclick = () => {
							el.remove();
						};
						el.style['min-width'] = 'calc(100vw - 6rem)';
						el.style['max-height'] = 'calc(100vh - 9rem)';
						el.style['border-radius'] = '0.2rem';
						el.style.overflow = 'hidden';
						el.appendChild(deleteButton);
						const clonedAsset = asset.cloneNode();
						if ($FocusObjectStore.type.includes('video')) {
							clonedAsset.controls = true;
							clonedAsset.autoplay = true;
							clonedAsset.style['width'] = 'calc(100vw - 6rem)';
						}
						clonedAsset.style['min-width'] = 'calc(100vw - 6rem)';
						clonedAsset.style['max-height'] = 'calc(100vh - 9rem)';
						clonedAsset.style['border-radius'] = '0.2rem';
						clonedAsset.id = asset.id + '_preview';
						el.appendChild(clonedAsset);
						document.querySelector('#filePreview')?.appendChild(el);
						PreviewPanelOpen.set(true);
						console.log($FocusObjectStore.el.components.material.data.src);
					}}
				>
					<Icon icon="magnify_fullscreen" />
				</button>
			</li>
		{/if}
	</ul>
	<ul />
	<ul>
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
								<option value="es">Spanish</option>
								<option value="nl">Dutch</option>
								<option value="pt">Portuguese</option>
								<option value="hi">Hindi</option>
								<option value="zh">Chinese</option>
								<option value="ko">Korean</option>
								<option value="ja">日本語</option>
							</select>
						</li>
					</ul>
				</details>
			</li>
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
	}
</style>
