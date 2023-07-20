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
	import type { Organization } from '$lib/types/Organization';
	let loggedIn: boolean | null = null;
	let event: any = null;
	let noEvent: boolean | null = null;
	let organization: Organization | null = null;
	$: console.log(loggedIn);
	onMount(async () => {
		loggedIn = await checkLogin();
		console.log({ loggedIn });
		organization = await axios
			.get(`/api/organizations?slug=${$page.params.organizationSlug}`)
			.then((res) => res.data[0]);
		if (!organization) {
			noEvent = true;
			return;
		}
		event = await axios
			.get(`/api/events?slug=${$page.params.eventSlug}&organization=${organization.id}`)
			.then((res) => res.data[0]);
		if (!event) {
			noEvent = true;
			return;
		}
		EventStore.set(new Event(event));
		console.log($EventStore);
		if (!loggedIn) return;
		const userRole: UserRole = await axios
			.get(`/api/userRoles?user=${$UserStore.id}&organization=${event.organization}`)
			.then((res) => res.data[0]);

		if (userRole?.role == 'manager') {
			$UserStore.isManager = true;
		}
		if (!event.isPublic) {
			if (!userRole) {
				//event exists, but you are not a mamber of this organization
				//check if the ogranization accepts registration
				console.log({ organization });
				if (!organization.allowRegistration) {
					noEvent = true;
					return;
				}
				//you may get registered
				const newUserRole = {
					user: $UserStore.id,
					organization: event.organization
				};
				const res = await axios.post('/api/userRoles', newUserRole);
				//let's do it again.
				location.reload();
				return;
			}
			if (!event.isOpen && !event.allowedUsersArray?.includes($UserStore.id)) {
				noEvent = true;
				return;
			}
		}
		noEvent = false;
	});
</script>

{#if loggedIn === false}
	<Login organization={$EventStore.organization} {event} />
{:else}
	{#if loggedIn === null || noEvent === null}
		<dialog open transition:fade>
			<article>
				{_('logging in')}...
				<progress />
			</article>
		</dialog>
	{:else if $EventStore.id && !noEvent}
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
		<Navigation title={$EventStore.title} />
	</div>
{/if}

<style>
	.top {
		position: fixed;
		top: 0;
		width: 100vw;
	}
</style>
