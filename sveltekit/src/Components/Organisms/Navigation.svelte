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
	let newNickname = $UserStore.nickname;

	const onLeaveClicked = () => {
		if (!confirm('Are you sure that you want to leave this room?')) return;
		videoChat.leave();
		EventStore.set(EmptyEvent);
		location.href = '/';
	};
	console.log({ $FocusObjectStore });
	const onDeleteClicked = async () => {
		if (!confirm('Are you sure that you want to delete this object?')) return;
		await axios.delete('/api/sessions/' + $FocusObjectStore.id);
		videoChat.sendMessage({
			key: 'objectDelete',
			id: $FocusObjectStore.id
		});
		editableObject.remove();
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
		{#if $FocusObjectStore.el}
			<li>
				<details role="list" dir="rtl">
					<summary aria-haspopup="listbox" role="link">
						<div>
							<Icon icon="deployed_code" />
							{$FocusObjectStore.name}
						</div>
					</summary>
					<ul role="listbox">
						<li>
							<button on:click={onDeleteClicked} class="secondary">Delete</button>
						</li>
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
