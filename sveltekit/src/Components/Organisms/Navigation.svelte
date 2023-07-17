<script lang="ts">
	import ProfileEditInputs from './ProfileEditInputs.svelte';

	import { cookies } from '$lib/frontend/cookies';
	import { EventStore, FocusObjectStore, UserStore } from '$lib/store';
	import axios from 'axios';
	import ModalCloseButton from '../Atom/ModalCloseButton.svelte';
	import InputWithLabel from '../Molecules/InputWithLabel.svelte';
	import { fade } from 'svelte/transition';
	import Icon from '../Atom/Icon.svelte';
	import { videoChat } from '$lib/frontend/Classes/VideoChat';
	import { EmptyEvent } from '$lib/preset/EmptyEvent';
	import { Users, UsersStore } from '$lib/frontend/Classes/Users';
	import type { Unit } from '$lib/frontend/Classes/Unit';
	import { editableObject } from '$lib/frontend/Classes/EditableObject';
	import { sharedObjects } from '$lib/frontend/Classes/SharedObjects';
	import {
		PUBLIC_FileStackAPIKey,
		PUBLIC_FileStackPolicy,
		PUBLIC_FileStackSignature
	} from '$env/static/public';
	import { uploader } from '$lib/frontend/Classes/Uploader';
	import ActionButtons from './ActionButtons.svelte';
	export let title: string = '';
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
		const res = await axios.put('/api/users/' + $UserStore.id, {
			email: newEmail
		});
		UserStore.update((user) => {
			user.email = newEmail;
			return user;
		});
		busy = false;
		emailDialogOpen = false;
	};

	const onLeaveClicked = () => {
		if (!confirm('Are you sure that you want to leave this room?')) return;
		videoChat.leave();
		EventStore.set(EmptyEvent);
		location.href = '/';
	};
	console.log({ $FocusObjectStore });
	const onDeleteClicked = async () => {
		if ($FocusObjectStore.title == 'Shared Screen') {
			//check if the screen belong to myself. otherwise you can't relete it.
			if (!$UserStore.onScreenShare) return alert('You are not sharing your screen.');
			videoChat.unpublishMyTrack('screen');
			const me = Users.find($UserStore.id);
			if (!me) return console.error('me is null');
			me?.hideScreen();
			$UserStore.onScreenShare = false;
			return;
		}

		const file = sharedObjects.get($FocusObjectStore.id);
		console.log({ file });
		await axios.delete('/api/objects/' + file.id);
		uploader.client.remove(file.handle, {
			policy: PUBLIC_FileStackPolicy,
			signature: PUBLIC_FileStackSignature
		});
		file.remove();
		videoChat.sendMessage({
			key: 'objectDelete',
			id: $FocusObjectStore.id
		});
		FocusObjectStore.set(null);
	};
</script>

<nav>
	<ul>
		<li>
			{title}
		</li>
	</ul>
	<ul />
	<ul>
		{#if $FocusObjectStore}
			<li>
				<details role="list">
					<summary aria-haspopup="listbox" role="link">
						<div>
							<Icon icon="deployed_code" />
							{$FocusObjectStore.title}
							{#if $FocusObjectStore.locked}
								<Icon icon="lock" />
							{:else}
								<Icon icon="lock_open" />
							{/if}
						</div>
					</summary>
					<ul role="listbox">
						{#if $FocusObjectStore.user == $UserStore.id || $UserStore.isManager}
							<li>
								<div style="display:flex;flex-direction:reverse">
									<div style="flex:1">Locked</div>
									<div>
										<InputWithLabel type="switch" bind:value={$FocusObjectStore.locked} />
									</div>
								</div>
							</li>
						{/if}
						{#if $FocusObjectStore.title == 'Shared Screen'}
							<li style="position:relative">
								<div style="position:absolute; top:0px;right:1rem;">
									<a href={$FocusObjectStore.linkTo} target="_blank">
										<Icon icon="open_in_new" /></a
									>
								</div>
								<InputWithLabel
									label="Link To"
									bind:value={$FocusObjectStore.linkTo}
									disabled={$FocusObjectStore.locked}
								/>
							</li>
							{#if !$FocusObjectStore.locked}
								<li>
									<button
										on:click={async () => {
											await axios.put('/api/objects/' + $FocusObjectStore.id, {
												linkTo: $FocusObjectStore.linkTo
											});
										}}>Update Link</button
									>
								</li>
							{/if}
						{/if}
						{#if !$FocusObjectStore.locked}
							<li>
								<button on:click={onDeleteClicked} class="secondary">Delete</button>
							</li>
						{/if}
					</ul>
				</details>
			</li>
		{/if}
		<li>
			<details role="list" dir="rtl">
				<summary aria-haspopup="listbox" role="link">
					<div>
						<Icon icon="groups" />
						Users (
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
							<button on:click={onLeaveClicked} class="warning">Leave Room</button>
						</li>
					{/if}
					<li><a href={'#'} on:click={changeEmailClicked}> Change Email </a></li>
					<li>
						<a href={'#'} on:click={changeProfileClicked}> Change Profile </a>
					</li>
					<li>
						<a href={'#'} on:click={onLogoutClicked}>Logout</a>
					</li>
				</ul>
			</details>
		</li>
	</ul>
</nav>
{#if emailDialogOpen}
	<dialog open transition:fade>
		<article>
			<ModalCloseButton
				onClick={() => {
					emailDialogOpen = false;
				}}
			/>
			<h3>Change Email</h3>
			<div style="margin-bottom:1rem">
				<div>Current Email</div>
				<span>{$UserStore.email}</span>
			</div>
			{#if emailAlreadyExists}
				<div style="margin-bottom:1rem">This Email address already exists.</div>
			{/if}
			<InputWithLabel label="New Email" bind:value={newEmail} />
			<button aria-busy={busy} on:click={() => onChangeEmailDoClicked()} disabled={busy}>
				Change
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
