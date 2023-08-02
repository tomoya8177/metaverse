<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import axios from 'axios';
	import { RoomStore, UserStore } from '$lib/store';
	import Login from '../../../Components/Organisms/Login.svelte';
	import { fade } from 'svelte/transition';
	import { checkLogin } from '$lib/frontend/checkLogin';
	import Navigation from '../../../Components/Organisms/Navigation.svelte';
	import { Room } from '$lib/frontend/Classes/Room';
	import type { UserRole } from '$lib/types/UserRole';
	import { _ } from '$lib/i18n';
	import type { Organization } from '$lib/types/Organization';
	import type { PageData } from '../[eventSlug]/$types';
	export let data: PageData;
	let loggedIn: boolean | null = data.loggedIn;
	let room: any = null;
	let noRoom: boolean | null = null;
	let organization: Organization | null = data.organization;
	$: console.log(loggedIn);
	onMount(async () => {
		console.log({ organization });
		if (!organization) {
			noRoom = true;
			return;
		}
		room = await axios
			.get(`/api/rooms?slug=${$page.params.roomSlug}&organization=${organization.id}`)
			.then((res) => res.data[0]);
		if (!room) {
			noRoom = true;
			return;
		}
		RoomStore.set(new Room(room));
		console.log($RoomStore, $UserStore);
		if (!loggedIn) return;
		const userRole: UserRole | undefined = $UserStore.userRole;
		if (userRole?.role == 'manager') {
			$UserStore.isManager = true;
		}
		if (!room.isPublic) {
			if (!userRole) {
				//room exists, but you are not a mamber of this organization
				//check if the ogranization accepts registration
				console.log({ organization });
				if (!organization.allowRegistration) {
					noRoom = true;
					return;
				}
				//you may get registered
				const newUserRole = {
					user: $UserStore.id,
					organization: room.organization
				};
				const res = await axios.post('/api/userRoles', newUserRole);
				//let's do it again.
				location.reload();
				return;
			}
			if (!room.isOpen && !$RoomStore.allowedUsersArray?.includes($UserStore.id)) {
				noRoom = true;
				return;
			}
		}
		noRoom = false;
	});
</script>

{#if loggedIn === false}
	<Login organization={$RoomStore.organization} {room} />
{:else}
	{#if loggedIn === null || noRoom === null}
		<dialog open transition:fade>
			<article>
				{_('logging in')}...
				<progress />
			</article>
		</dialog>
	{:else if $RoomStore.id && !noRoom}
		<slot />
	{/if}
	{#if noRoom}
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
	{#if $RoomStore.id}
		<div class="top">
			<Navigation title={$RoomStore.title} {organization} />
		</div>
	{/if}
{/if}

<style>
	.top {
		position: fixed;
		top: 0;
		width: 100vw;
	}
</style>
