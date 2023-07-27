<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import axios from 'axios';
	import { UserStore } from '$lib/store';
	import InputWithLabel from '../../Components/Molecules/InputWithLabel.svelte';
	import { cookies } from '$lib/frontend/cookies';
	import { fade } from 'svelte/transition';
	import type { Event } from '$lib/frontend/Classes/Event';
	import { _ } from '$lib/i18n';
	import { myAlert } from '$lib/frontend/toast';
	export let organization: string = '';
	export let event: Event | null = null;
	let loggedIn: boolean | null = null;
	let verificationMode = false;
	let email = '';
	let busy = false;
	let wrongCode = false;
	const login = async (email: string) => {
		busy = true;
		const res = await axios.post('/api/login/sendCode', {
			email
		});
		busy = false;
		verificationMode = true;
	};
	let verificationCode: string = '';
	const onVerifyClicked = async () => {
		busy = true;
		const res = await axios.post('/api/login/verifyCode', {
			email,
			code: verificationCode
		});
		console.log({
			res
		});
		if (res.data.result) {
			cookies.set('login', res.data.login, { expires: 30 });
			location.reload();
		} else {
			//wrong code
			wrongCode = true;
			setTimeout(() => {
				wrongCode = false;
			}, 2000);
		}
		busy = false;
	};
	const onLoginClicked = async () => {
		if (!email) {
			myAlert(_('Please enter your email address'));
			return;
		}
		busy = true;
		const existingUser = await axios
			.post('/api/login/checkExisting', { email })
			.then((res) => res.data);
		if (existingUser.length) {
			await login(email);
			return;
		} else {
			//register if organiatin allow to do so
			const organiatinData = await axios
				.get('/api/organizations/' + organization)
				.then((res) => res.data[0]);
			console.log({ event, organiatinData });
			if (!organiatinData.allowRegistration && (event === null || !event.isPublic)) {
				busy = false;
				myAlert(_('This organization does not allow registration'));
				return;
			}
			if (event !== null && event.isPublic) {
				//event is free to access. no registration under organization
				const res = await axios.post('/api/register', {
					email
				});
			} else {
				//event is not public. register under organization
				const res = await axios.post('/api/register', {
					email,
					organization
				});
			}
			await login(email);
		}
	};
</script>

<dialog open>
	<article>
		<h3>Welcome!</h3>
		{#if !verificationMode}
			<p class="p">Please enter your email address and click "Proceed"</p>
			<InputWithLabel label="Email" bind:value={email} type="email" />
			<button aria-busy={busy} class="button" on:click={onLoginClicked}>Proceed</button>
		{:else}
			<p class="p">
				Please check your Email and copy the verification code here. Please understand the
				verification email is likely to be sent to your spam box...
			</p>
			<InputWithLabel type="tel" label="Verification Code" bind:value={verificationCode} />
			{#if wrongCode}
				<p class="p" style="color:red" transition:fade>Wrong code</p>
			{/if}
			<button aria-busy={busy} class="button" on:click={onVerifyClicked}>Verify</button>
			<a
				on:click={() => {
					verificationMode = false;
				}}>{_('Back')}</a
			>
		{/if}
	</article>
</dialog>

<style>
	.p {
		margin-bottom: 1rem;
	}
</style>
