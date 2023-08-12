<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import axios from 'axios';
	import { ChatMessagesStore, RoomStore, UserStore } from '$lib/store';
	import Login from '../../../Components/Organisms/Login.svelte';
	import { fade } from 'svelte/transition';
	import Navigation from '../../../Components/Organisms/Navigation.svelte';
	import { Room } from '$lib/frontend/Classes/Room';
	import type { UserRole } from '$lib/types/UserRole';
	import { _ } from '$lib/i18n';
	import type { Organization } from '$lib/types/Organization';
	import type { PageData } from './$types';
	import { sendJoinedToOrganizationEmail } from '$lib/frontend/sendInvitedToOrganizationEmail';
	import { Mentor } from '$lib/frontend/Classes/Mentor';
	import { User } from '$lib/frontend/Classes/User';
	import Scene from '../../../Components/Templates/Scene.svelte';
	export let data: PageData;
	let loggedIn: boolean | null = data.loggedIn;
	let room: Room = new Room(data.room);
	let roomReady = false;
	if (room.mentor) {
		room.mentorData = new Mentor(data.mentor);
		room.mentorData.userData = new User(data.mentorUser);
	}
	roomReady = true;
	let noRoom: boolean | null = null;
	let organization: Organization | null = data.organization;
	ChatMessagesStore.set(data.messages);
	onMount(async () => {
		if (!organization) {
			noRoom = true;
			return;
		}

		if (!room) {
			noRoom = true;
			return;
		}
		RoomStore.set(room);
		if (!loggedIn) return;
		const userRole: UserRole | undefined = $UserStore.userRole;
		if (userRole?.role == 'manager') {
			$UserStore.isManager = true;
		}
		if (!room.isPublic) {
			if (!userRole) {
				if (!organization.allowRegistration) {
					noRoom = true;
					return;
				}
				const newUserRole = {
					user: $UserStore.id,
					organization: room.organization
				};
				const res = await axios.post('/api/userRoles', newUserRole);
				const url = $page.url.protocol + '//' + $page.url.host + '/' + organization.slug;
				await sendJoinedToOrganizationEmail($UserStore.email, organization, url);
				//let's do it again.
				location.reload();
				return;
			}
			if (!room.isOpen && !room.allowedUsersArray?.includes($UserStore.id)) {
				noRoom = true;
				return;
			}
		}
		noRoom = false;
	});
</script>

<svelte:head>
	<title>
		{room.title} | {organization?.title} | VirtuaCampus
	</title>
</svelte:head>

{#if loggedIn === false}
	<Login organization={room.organization} {room} />
{:else}
	{#if loggedIn === null || noRoom === null}
		<dialog open transition:fade>
			<article>
				{_('logging in')}...
				<progress />
			</article>
		</dialog>
	{:else if roomReady && !noRoom}
		<Scene {data} {room} />
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
	{#if roomReady}
		<div class="top">
			<Navigation title={room.title} {organization} />
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
