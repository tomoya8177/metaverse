<script lang="ts">
	import { cookies } from '$lib/frontend/cookies';
	import { io } from '$lib/realtime';
	import { UserStore } from '$lib/store';
	import axios from 'axios';
	import ModalCloseButton from '../Atom/ModalCloseButton.svelte';
	import InputWithLabel from '../Molecules/InputWithLabel.svelte';
	import { fade } from 'svelte/transition';
	import Icon from '../Atom/Icon.svelte';
	export let title: string = '';
	const onLogoutClicked = () => {
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
	let newNickname = '';
	const onUpdateProfileDoClicked = async () => {
		busy = true;
		const res = await axios.put('/api/users/' + $UserStore.id, {
			nickname: newNickname
		});
		io.emit('updateProfile', { nickname: newNickname, id: $UserStore.id });

		busy = false;
		profileDialogOpen = false;
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
		<li>
			<details role="list" dir="rtl">
				<summary aria-haspopup="listbox" role="link">
					<div>
						<Icon icon="account_circle" />
						{$UserStore.nickname}
					</div>
				</summary>
				<ul role="listbox">
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
			<InputWithLabel label="Nickname" bind:value={newNickname} />
			<button aria-busy={busy} on:click={() => onUpdateProfileDoClicked()} disabled={busy}>
				Change
			</button>
		</article>
	</dialog>
{/if}

<style>
	nav {
		padding-left: 1rem;
		padding-right: 1rem;
	}
</style>
