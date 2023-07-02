<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import axios from 'axios';
	import { EventStore, UserStore } from '$lib/store';
	import InputWithLabel from '../../Components/Molecules/InputWithLabel.svelte';
	import { cookies } from '$lib/frontend/cookies';
	import Login from '../../Components/Organisms/Login.svelte';
	import { fade } from 'svelte/transition';
	import Icon from '../../Components/Atom/Icon.svelte';
	import { io } from '$lib/realtime';
	let loggedIn: boolean | null = null;
	let event: any = null;
	$: console.log(loggedIn);
	onMount(async () => {
		if (location.href.includes('/login')) return;
		console.log('logging in');
		const result = await axios.get('/api/login');
		console.log({ result });
		if (result.data.result) {
			//logged in
			UserStore.set(result.data.user);
			setTimeout(() => {
				loggedIn = true;
			}, 1000);
		} else {
			//not logged in
			loggedIn = false;
		}
		const events = await axios
			.get(`/api/events?slug=${$page.params.eventSlug}`)
			.then((res) => res.data);
		console.log({ events });
		if (events.length) {
			EventStore.set(events[0]);
		}
	});

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
		const existingUser = await axios.get('api/users?email=' + newEmail).then((res) => res.data);
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

{#if loggedIn === false}
	<Login />
{:else}
	{#if loggedIn === null}
		<dialog open transition:fade>
			<article>
				logging in...
				<progress />
			</article>
		</dialog>
	{/if}
	{#if $EventStore.id}
		<slot />
	{/if}
	<div class="top">
		<nav>
			<ul />
			<ul />
			<ul>
				<li>
					<details role="list" dir="rtl">
						<summary aria-haspopup="listbox" role="link">
							<div>Menu</div>
						</summary>
						<ul role="listbox">
							<li><a on:click={changeEmailClicked}> Change Email </a></li>
							<li>
								<a on:click={changeProfileClicked}> Change Profile </a>
							</li>
							<li>
								<a on:click={onLogoutClicked}>Logout</a>
							</li>
						</ul>
					</details>
				</li>
			</ul>
		</nav>
	</div>
{/if}
{#if emailDialogOpen}
	<dialog open transition:fade>
		<article>
			<a
				href={'#'}
				on:click={() => {
					emailDialogOpen = false;
				}}
				aria-label="Close"
				class="close"
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
			<button aria-busy={busy} on:click={onChangeEmailDoClicked} disabled={busy}> Change </button>
		</article>
	</dialog>
{/if}
{#if profileDialogOpen}
	<dialog open transition:fade>
		<article>
			<a
				href={'#'}
				on:click={() => {
					profileDialogOpen = false;
				}}
				aria-label="Close"
				class="close"
			/>
			<h3>Change Profile</h3>
			<InputWithLabel label="Nickname" bind:value={newNickname} />
			<button aria-busy={busy} on:click={onUpdateProfileDoClicked} disabled={busy}> Change </button>
		</article>
	</dialog>
{/if}

<style>
	.top {
		position: fixed;
		top: 0;
		width: 100vw;
		padding-left: 1rem;
		padding-right: 1rem;
	}
</style>
