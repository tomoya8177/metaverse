<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import axios from 'axios';
	import { UserStore } from '$lib/store';
	import InputWithLabel from '../../Components/Molecules/InputWithLabel.svelte';
	import { cookies } from '$lib/frontend/cookies';
	import { fade } from 'svelte/transition';
	import type { Room } from '$lib/frontend/Classes/Room';
	import { _ } from '$lib/i18n';
	import { myAlert } from '$lib/frontend/toast';
	import { nl2br } from '$lib/math/nl2br';
	import { unescapeHTML } from '$lib/math/escapeHTML';
	import { actionHistory } from '$lib/frontend/Classes/actionHistory';
	export let organization: string = '';
	export let room: Room | null = null;
	let loggedIn: boolean | null = null;
	let verificationMode = false;
	let email = '';
	let busy = false;
	let wrongCode = false;
	const login = async (email: string) => {
		busy = true;
		const emailBody = `${_('Hello.')}
  ${_('Please return to the login page and input the verification code below:')}
	[[code]]
  `;
		const res = await axios.post('/api/login/sendCode', {
			email,
			emailBody,
			emailBodyHTML: nl2br(unescapeHTML(emailBody)),
			subject: _('Confirmation Code')
		});
		busy = false;
		verificationMode = true;
		actionHistory.send('login', { email });
	};
	let verificationCode: string = '';
	const onVerifyClicked = async () => {
		busy = true;
		const res = await axios.post('/api/login/verifyCode', {
			email,
			code: verificationCode
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
		actionHistory.send('verify', { email });
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
			if (!organiatinData.allowRegistration && (room === null || !room.isPublic)) {
				busy = false;
				myAlert(_('This organization does not allow registration'));
				return;
			}
			if (room !== null && room.isPublic) {
				//room is free to access. no registration under organization
				const res = await axios.post('/api/register', {
					email
				});
			} else {
				//room is not public. register under organization
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
		<h3>{_('Welcome!')}</h3>
		{#if !verificationMode}
			<p class="p">{_('Please enter your email address and click "Proceed"')}</p>
			<InputWithLabel label={_('Email')} bind:value={email} type="email" />
			<button aria-busy={busy} class="button" on:click={onLoginClicked}>{_('Proceed')}</button>
		{:else}
			<p class="p">
				{_(
					'Please check your Email and copy the verification code here. Please understand the verification email is likely to be sent to your spam box...'
				)}
			</p>
			<InputWithLabel type="tel" label={_('Verification Code')} bind:value={verificationCode} />
			{#if wrongCode}
				<p class="p" style="color:red" transition:fade>{_('Wrong code')}</p>
			{/if}
			<button aria-busy={busy} class="button" on:click={onVerifyClicked}>{_('Verify')}</button>
			<a
				href={'#'}
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
