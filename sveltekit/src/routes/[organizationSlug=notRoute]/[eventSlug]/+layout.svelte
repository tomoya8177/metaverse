<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import axios from 'axios';
	import { EventStore, UserStore } from '$lib/store';
	import Login from '../../../Components/Organisms/Login.svelte';
	import { fade } from 'svelte/transition';
	import { checkLogin } from '$lib/frontend/checkLogin';
	import Navigation from '../../../Components/Organisms/Navigation.svelte';
	import { Event } from '$lib/frontend/Classes/Event';
	import type { UserRole } from '$lib/types/UserRole';
	import { _ } from '$lib/i18n';
	let loggedIn: boolean | null = null;
	let event: any = null;
	let noEvent = false;
	$: console.log(loggedIn);
	onMount(async () => {
		loggedIn = await checkLogin();
		console.log({ loggedIn });
		const events = await axios
			.get(`/api/events?slug=${$page.params.eventSlug}`)
			.then((res) => res.data);
		console.log({ events });
		if (events.length) {
			const event = new Event(events[0]);
			EventStore.set(new Event(event));
			console.log($EventStore);
			if (!loggedIn) return;
			const userRole: UserRole = await axios
				.get(`/api/userRoles?user=${$UserStore.id}&organization=${event.organization}`)
				.then((res) => res.data[0]);
			if (userRole.role == 'manager') {
				$UserStore.isManager = true;
			}
			if (!event.isPublic) {
				if (!userRole) {
					noEvent = true;
					return;
				}
				if (!event.isOpen && !event.allowedUsersArray.includes($UserStore.id)) {
					noEvent = true;
					return;
				}
			}
		} else {
			noEvent = true;
		}
	});
</script>

{#if loggedIn === false}
	<Login organization={$EventStore.organization} />
{:else}
	{#if loggedIn === null}
		<dialog open transition:fade>
			<article>
				{_('logging in')}...
				<progress />
			</article>
		</dialog>
	{/if}
	{#if $EventStore.id}
		<slot />
	{/if}
	{#if noEvent}
		<div style="display:flex;width:100vw;height:100vh">
			<div style="align-self:center;width:100%;text-align:center">
				<h2>
					{_('NO EVENT FOUND')}
				</h2>
				<p>
					{_(
						'Please make sure you have the correct URL and you have the right to enter the event!'
					)}
				</p>
			</div>
		</div>
	{/if}
	<div class="top">
		<Navigation />
	</div>
{/if}

<style>
	.top {
		position: fixed;
		top: 0;
		width: 100vw;
	}
</style>
