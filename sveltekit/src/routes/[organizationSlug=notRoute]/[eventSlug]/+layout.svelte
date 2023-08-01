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
	import type { PageData } from './$types';
	export let data: PageData;
	let loggedIn: boolean | null = data.loggedIn;
	let event: any = null;
	let noEvent: boolean | null = null;
	let organization: Organization | null = data.organization;
	$: console.log(loggedIn);
	onMount(async () => {
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
		console.log($EventStore, $UserStore);
		if (!loggedIn) return;
		const userRole: UserRole | undefined = $UserStore.userRole;
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
			if (!event.isOpen && !$EventStore.allowedUsersArray?.includes($UserStore.id)) {
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
		<div style="display:flex;width:100vw;height:100svh">
			<div style="align-self:center;width:100%;text-align:center">
				<h2>
					{_('NO ROOM FOUND')}
				</h2>
				<p>
					{_('Please make sure you have the correct URL and you have the right to enter the room!')}
				</p>
			</div>
		</div>
	{/if}
	<div class="top">
		<Navigation title={$EventStore.title} {organization} />
	</div>
{/if}

<style>
	.top {
		position: fixed;
		top: 0;
		width: 100vw;
	}
</style>
